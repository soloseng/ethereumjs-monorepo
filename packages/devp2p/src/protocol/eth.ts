import { RLP } from '@ethereumjs/rlp'
import {
  arrToBufArr,
  bigIntToBuffer,
  bufArrToArr,
  bufferToBigInt,
  bufferToHex,
} from '@ethereumjs/util'
import * as snappy from 'snappyjs'

import { assertEq, buffer2int, formatLogData, formatLogId, int2buffer } from '../util'

import { EthProtocol, Protocol } from './protocol'

import type { Peer } from '../rlpx/peer'
import type { SendMethod } from './protocol'

export class ETH extends Protocol {
  _status: ETH.StatusMsg | null = null
  _peerStatus: ETH.StatusMsg | null = null
  DEBUG: boolean = false

  // Eth64
  _hardfork: string = 'chainstart'
  _latestBlock = BigInt(0)
  _forkHash: string = ''
  _nextForkBlock = BigInt(0)

  constructor(version: number, peer: Peer, send: SendMethod) {
    super(peer, send, EthProtocol.ETH, version, ETH.MESSAGE_CODES)

    // Set forkHash and nextForkBlock
    if (this._version >= 64) {
      const c = this._peer._common
      this._hardfork = c.hardfork() ?? this._hardfork
      // Set latestBlock minimally to start block of fork to have some more
      // accurate basis if no latestBlock is provided along status send
      this._latestBlock = c.hardforkBlock(this._hardfork) ?? BigInt(0)
      this._forkHash = c.forkHash(this._hardfork)
      // Next fork block number or 0 if none available
      this._nextForkBlock = c.nextHardforkBlockOrTimestamp(this._hardfork) ?? BigInt(0)
    }

    // Skip DEBUG calls unless 'ethjs' included in environmental DEBUG variables
    this.DEBUG = process?.env?.DEBUG?.includes('ethjs') ?? false
  }

  static eth62 = { name: 'eth', version: 62, length: 8, constructor: ETH }
  static eth63 = { name: 'eth', version: 63, length: 17, constructor: ETH }
  static eth64 = { name: 'eth', version: 64, length: 17, constructor: ETH }
  static eth65 = { name: 'eth', version: 65, length: 17, constructor: ETH }
  static eth66 = { name: 'eth', version: 66, length: 17, constructor: ETH }

  _handleMessage(code: ETH.MESSAGE_CODES, data: any) {
    const payload = arrToBufArr(RLP.decode(bufArrToArr(data)))
    const messageName = this.getMsgPrefix(code)
    const debugMsg = this.DEBUG
      ? `Received ${messageName} message from ${this._peer._socket.remoteAddress}:${this._peer._socket.remotePort}`
      : undefined

    if (code !== ETH.MESSAGE_CODES.STATUS && this.DEBUG) {
      const logData = formatLogData(data.toString('hex'), this._verbose)
      this.debug(messageName, `${debugMsg}: ${logData}`)
    }
    switch (code) {
      case ETH.MESSAGE_CODES.STATUS: {
        assertEq(
          this._peerStatus,
          null,
          'Uncontrolled status message',
          this.debug.bind(this),
          'STATUS'
        )
        this._peerStatus = payload as ETH.StatusMsg
        const peerStatusMsg = `${
          this._peerStatus !== undefined ? this._getStatusString(this._peerStatus) : ''
        }`
        if (this.DEBUG) {
          this.debug(messageName, `${debugMsg}: ${peerStatusMsg}`)
        }
        this._handleStatus()
        break
      }

      case ETH.MESSAGE_CODES.NEW_BLOCK_HASHES:
      case ETH.MESSAGE_CODES.TX:
      case ETH.MESSAGE_CODES.GET_BLOCK_HEADERS:
      case ETH.MESSAGE_CODES.BLOCK_HEADERS:
      case ETH.MESSAGE_CODES.GET_BLOCK_BODIES:
      case ETH.MESSAGE_CODES.BLOCK_BODIES:
      case ETH.MESSAGE_CODES.NEW_BLOCK:
        if (this._version >= ETH.eth62.version) break
        return

      case ETH.MESSAGE_CODES.GET_NODE_DATA:
      case ETH.MESSAGE_CODES.NODE_DATA:
      case ETH.MESSAGE_CODES.GET_RECEIPTS:
      case ETH.MESSAGE_CODES.RECEIPTS:
        if (this._version >= ETH.eth63.version) break
        return

      case ETH.MESSAGE_CODES.NEW_POOLED_TRANSACTION_HASHES:
      case ETH.MESSAGE_CODES.GET_POOLED_TRANSACTIONS:
      case ETH.MESSAGE_CODES.POOLED_TRANSACTIONS:
        if (this._version >= ETH.eth65.version) break
        return

      default:
        return
    }

    this.emit('message', code, payload)
  }

  /**
   * Eth 64 Fork ID validation (EIP-2124)
   * @param forkId Remote fork ID
   */
  _validateForkId(forkId: Buffer[]) {
    const c = this._peer._common

    const peerForkHash = bufferToHex(forkId[0])
    const peerNextFork = bufferToBigInt(forkId[1])

    if (this._forkHash === peerForkHash) {
      // There is a known next fork
      if (peerNextFork > BigInt(0)) {
        if (this._latestBlock >= peerNextFork) {
          const msg = 'Remote is advertising a future fork that passed locally'
          if (this.DEBUG) {
            this.debug('STATUS', msg)
          }
          throw new Error(msg)
        }
      }
    }
    const peerFork: any = c.hardforkForForkHash(peerForkHash)
    if (peerFork === null) {
      const msg = 'Unknown fork hash'
      if (this.DEBUG) {
        this.debug('STATUS', msg)
      }
      throw new Error(msg)
    }

    if (c.hardforkGteHardfork(peerFork.name, this._hardfork) === false) {
      const nextHardforkBlock = c.nextHardforkBlockOrTimestamp(peerFork.name)
      if (
        peerNextFork === null ||
        nextHardforkBlock === null ||
        nextHardforkBlock !== peerNextFork
      ) {
        const msg = 'Outdated fork status, remote needs software update'
        if (this.DEBUG) {
          this.debug('STATUS', msg)
        }
        throw new Error(msg)
      }
    }
  }

  _handleStatus(): void {
    if (this._status === null || this._peerStatus === null) return
    clearTimeout(this._statusTimeoutId!)

    assertEq(
      this._status[0],
      this._peerStatus[0],
      'Protocol version mismatch',
      this.debug.bind(this),
      'STATUS'
    )
    assertEq(
      this._status[1],
      this._peerStatus[1],
      'NetworkId mismatch',
      this.debug.bind(this),
      'STATUS'
    )
    assertEq(
      this._status[4],
      this._peerStatus[4],
      'Genesis block mismatch',
      this.debug.bind(this),
      'STATUS'
    )

    const status: any = {
      networkId: this._peerStatus[1],
      td: Buffer.from(this._peerStatus[2] as Buffer),
      bestHash: Buffer.from(this._peerStatus[3] as Buffer),
      genesisHash: Buffer.from(this._peerStatus[4] as Buffer),
    }

    if (this._version >= 64) {
      assertEq(
        this._peerStatus[5].length,
        2,
        'Incorrect forkId msg format',
        this.debug.bind(this),
        'STATUS'
      )
      this._validateForkId(this._peerStatus[5] as Buffer[])
      status['forkId'] = this._peerStatus[5]
    }

    this.emit('status', status)
    if (this._firstPeer === '') {
      this._addFirstPeerDebugger()
    }
  }

  getVersion() {
    return this._version
  }

  _forkHashFromForkId(forkId: Buffer): string {
    return `0x${forkId.toString('hex')}`
  }

  _nextForkFromForkId(forkId: Buffer): number {
    return buffer2int(forkId)
  }

  _getStatusString(status: ETH.StatusMsg) {
    let sStr = `[V:${buffer2int(status[0] as Buffer)}, NID:${buffer2int(status[1] as Buffer)}, TD:${
      status[2].length === 0 ? 0 : buffer2int(status[2] as Buffer)
    }`
    sStr += `, BestH:${formatLogId(status[3].toString('hex'), this._verbose)}, GenH:${formatLogId(
      status[4].toString('hex'),
      this._verbose
    )}`
    if (this._version >= 64) {
      sStr += `, ForkHash: ${
        status[5] !== undefined ? '0x' + (status[5][0] as Buffer).toString('hex') : '-'
      }`
      sStr += `, ForkNext: ${
        (status[5][1] as Buffer).length > 0 ? buffer2int(status[5][1] as Buffer) : '-'
      }`
    }
    sStr += `]`
    return sStr
  }

  sendStatus(status: ETH.StatusOpts) {
    if (this._status !== null) return
    this._status = [
      int2buffer(this._version),
      bigIntToBuffer(this._peer._common.chainId()),
      status.td,
      status.bestHash,
      status.genesisHash,
    ]
    if (this._version >= 64) {
      if (status.latestBlock) {
        const latestBlock = bufferToBigInt(status.latestBlock)
        if (latestBlock < this._latestBlock) {
          throw new Error(
            'latest block provided is not matching the HF setting of the Common instance (Rlpx)'
          )
        }
        this._latestBlock = latestBlock
      }
      const forkHashB = Buffer.from(this._forkHash.substr(2), 'hex')

      const nextForkB =
        this._nextForkBlock === BigInt(0)
          ? Buffer.from('', 'hex')
          : bigIntToBuffer(this._nextForkBlock)

      this._status.push([forkHashB, nextForkB])
    }

    if (this.DEBUG) {
      this.debug(
        'STATUS',
        `Send STATUS message to ${this._peer._socket.remoteAddress}:${
          this._peer._socket.remotePort
        } (eth${this._version}): ${this._getStatusString(this._status)}`
      )
    }

    let payload = Buffer.from(RLP.encode(bufArrToArr(this._status)))

    // Use snappy compression if peer supports DevP2P >=v5
    if (this._peer._hello !== null && this._peer._hello.protocolVersion >= 5) {
      payload = snappy.compress(payload)
    }

    this._send(ETH.MESSAGE_CODES.STATUS, payload)
    this._handleStatus()
  }

  sendMessage(code: ETH.MESSAGE_CODES, payload: any) {
    const logData = formatLogData(
      Buffer.from(RLP.encode(bufArrToArr(payload))).toString('hex'),
      this._verbose
    )
    if (this.DEBUG) {
      const messageName = this.getMsgPrefix(code)
      const debugMsg = `Send ${messageName} message to ${this._peer._socket.remoteAddress}:${this._peer._socket.remotePort}: ${logData}`

      this.debug(messageName, debugMsg)
    }

    switch (code) {
      case ETH.MESSAGE_CODES.STATUS:
        throw new Error('Please send status message through .sendStatus')

      case ETH.MESSAGE_CODES.NEW_BLOCK_HASHES:
      case ETH.MESSAGE_CODES.TX:
      case ETH.MESSAGE_CODES.GET_BLOCK_HEADERS:
      case ETH.MESSAGE_CODES.BLOCK_HEADERS:
      case ETH.MESSAGE_CODES.GET_BLOCK_BODIES:
      case ETH.MESSAGE_CODES.BLOCK_BODIES:
      case ETH.MESSAGE_CODES.NEW_BLOCK:
        if (this._version >= ETH.eth62.version) break
        throw new Error(`Code ${code} not allowed with version ${this._version}`)

      case ETH.MESSAGE_CODES.GET_NODE_DATA:
      case ETH.MESSAGE_CODES.NODE_DATA:
      case ETH.MESSAGE_CODES.GET_RECEIPTS:
      case ETH.MESSAGE_CODES.RECEIPTS:
        if (this._version >= ETH.eth63.version) break
        throw new Error(`Code ${code} not allowed with version ${this._version}`)

      case ETH.MESSAGE_CODES.NEW_POOLED_TRANSACTION_HASHES:
      case ETH.MESSAGE_CODES.GET_POOLED_TRANSACTIONS:
      case ETH.MESSAGE_CODES.POOLED_TRANSACTIONS:
        if (this._version >= ETH.eth65.version) break
        throw new Error(`Code ${code} not allowed with version ${this._version}`)

      default:
        throw new Error(`Unknown code ${code}`)
    }

    payload = Buffer.from(RLP.encode(bufArrToArr(payload)))

    // Use snappy compression if peer supports DevP2P >=v5
    if (this._peer._hello !== null && this._peer._hello.protocolVersion >= 5) {
      payload = snappy.compress(payload)
    }

    this._send(code, payload)
  }

  getMsgPrefix(msgCode: ETH.MESSAGE_CODES): string {
    return ETH.MESSAGE_CODES[msgCode]
  }
}

export namespace ETH {
  export interface StatusMsg extends Array<Buffer | Buffer[]> {}

  export type StatusOpts = {
    td: Buffer
    bestHash: Buffer
    latestBlock?: Buffer
    genesisHash: Buffer
  }

  export enum MESSAGE_CODES {
    // eth62
    STATUS = 0x00,
    NEW_BLOCK_HASHES = 0x01,
    TX = 0x02,
    GET_BLOCK_HEADERS = 0x03,
    BLOCK_HEADERS = 0x04,
    GET_BLOCK_BODIES = 0x05,
    BLOCK_BODIES = 0x06,
    NEW_BLOCK = 0x07,

    // eth63
    GET_NODE_DATA = 0x0d,
    NODE_DATA = 0x0e,
    GET_RECEIPTS = 0x0f,
    RECEIPTS = 0x10,

    // eth65
    NEW_POOLED_TRANSACTION_HASHES = 0x08,
    GET_POOLED_TRANSACTIONS = 0x09,
    POOLED_TRANSACTIONS = 0x0a,
  }
}
