import { Common, Hardfork } from '@ethereumjs/common'
import * as kzg from 'c-kzg'
import { randomBytes } from 'crypto'
import * as tape from 'tape'

import { BlobEIP4844Transaction, TransactionFactory, initKZG } from '../src'
import {
  blobsToCommitments,
  commitmentsToVersionedHashes,
  getBlobs,
} from '../src/utils/blobHelpers'

// Hack to detect if running in browser or not
const isBrowser = new Function('try {return this===window;}catch(e){ return false;}')

const pk = randomBytes(32)
if (isBrowser() === false) initKZG(kzg, __dirname + '/../../client/lib/trustedSetups/devnet4.txt')

const gethGenesis = require('../../block/test/testdata/4844-hardfork.json')
const common = Common.fromGethGenesis(gethGenesis, {
  chain: 'customChain',
  hardfork: Hardfork.ShardingForkDev,
})

tape('EIP4844 constructor tests - valid scenarios', (t) => {
  if (isBrowser() === true) {
    t.end()
  } else {
    const txData = {
      type: 0x05,
      versionedHashes: [Buffer.concat([Buffer.from([1]), randomBytes(31)])],
      maxFeePerDataGas: 1n,
    }
    const tx = BlobEIP4844Transaction.fromTxData(txData, { common })
    t.equal(tx.type, 5, 'successfully instantiated a blob transaction from txData')
    const factoryTx = TransactionFactory.fromTxData(txData, { common })
    t.equal(factoryTx.type, 5, 'instantiated a blob transaction from the tx factory')

    const serializedTx = tx.serialize()
    t.equal(serializedTx[0], 5, 'successfully serialized a blob tx')
    const deserializedTx = BlobEIP4844Transaction.fromSerializedTx(serializedTx, { common })
    t.equal(deserializedTx.type, 5, 'deserialized a blob tx')

    const signedTx = tx.sign(pk)
    const sender = signedTx.getSenderAddress().toString()
    const decodedTx = BlobEIP4844Transaction.fromSerializedTx(signedTx.serialize(), { common })
    t.equal(
      decodedTx.getSenderAddress().toString(),
      sender,
      'signature and sender were deserialized correctly'
    )

    t.end()
  }
})

tape('fromTxData using from a json', (t) => {
  if (isBrowser() === true) {
    t.end()
  } else {
    const txData = {
      type: '0x5',
      nonce: '0x0',
      gasPrice: null,
      maxPriorityFeePerGas: '0x12a05f200',
      maxFeePerGas: '0x12a05f200',
      gasLimit: '0x33450',
      value: '0xbc614e',
      input: '0x',
      v: '0x0',
      r: '0x8a83833ec07806485a4ded33f24f5cea4b8d4d24dc8f357e6d446bcdae5e58a7',
      s: '0x68a2ba422a50cf84c0b5fcbda32ee142196910c97198ffd99035d920c2b557f8',
      to: '0xffb38a7a99e3e2335be83fc74b7faa19d5531243',
      chainId: '0x28757b3',
      accessList: null,
      maxFeePerDataGas: '0xb2d05e00',
      versionedHashes: ['0x01b0a4cdd5f55589f5c5b4d46c76704bb6ce95c0a8c09f77f197a57808dded28'],
      kzgAggregatedProof:
        '0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000',
      hash: 'd5455662e76b193a84ce57d4c0a3b6fd609fdfca21cc93b93408de62be3c5708',
      serialized:
        '054500000000a7585eaecd6b446d7e358fdc244d8d4bea5c4ff233ed4d5a480678c03e83838af857b5c220d93590d9ff9871c910691942e12ea3bdfcb5c084cf502a42baa268b357870200000000000000000000000000000000000000000000000000000000000000000000000000f2052a0100000000000000000000000000000000000000000000000000000000f2052a010000000000000000000000000000000000000000000000000000005034030000000000c00000004e61bc0000000000000000000000000000000000000000000000000000000000d5000000d5000000005ed0b200000000000000000000000000000000000000000000000000000000d500000001ffb38a7a99e3e2335be83fc74b7faa19d553124301b0a4cdd5f55589f5c5b4d46c76704bb6ce95c0a8c09f77f197a57808dded28',
    }
    const c = common.copy()
    c['_chainParams'] = Object.assign({}, common['_chainParams'], {
      chainId: Number(txData.chainId),
    })
    try {
      const tx = BlobEIP4844Transaction.fromTxData(txData, { common: c })
      t.pass('Should be able to parse a json data and hash it')

      t.equal(typeof tx.maxFeePerDataGas, 'bigint', 'should be able to parse correctly')
      t.equal(tx.serialize().toString('hex'), txData.serialized, 'serialization should match')
      // TODO: fix the hash
      t.equal(tx.hash().toString('hex'), txData.hash, 'hash should match')
    } catch (e) {
      t.fail('failed to parse json data')
    }

    t.end()
  }
})

tape('EIP4844 constructor tests - invalid scenarios', (t) => {
  if (isBrowser() === true) {
    t.end()
  } else {
    const baseTxData = {
      type: 0x05,
      maxFeePerDataGas: 1n,
    }
    const shortVersionHash = {
      versionedHashes: [Buffer.concat([Buffer.from([3]), randomBytes(3)])],
    }
    const invalidVersionHash = {
      versionedHashes: [Buffer.concat([Buffer.from([3]), randomBytes(31)])],
    }
    const tooManyBlobs = {
      versionedHashes: [
        Buffer.concat([Buffer.from([1]), randomBytes(31)]),
        Buffer.concat([Buffer.from([1]), randomBytes(31)]),
        Buffer.concat([Buffer.from([1]), randomBytes(31)]),
      ],
    }
    try {
      BlobEIP4844Transaction.fromTxData({ ...baseTxData, ...shortVersionHash }, { common })
    } catch (err: any) {
      t.ok(
        err.message.includes('versioned hash is invalid length'),
        'throws on invalid versioned hash length'
      )
    }
    try {
      BlobEIP4844Transaction.fromTxData({ ...baseTxData, ...invalidVersionHash }, { common })
    } catch (err: any) {
      t.ok(
        err.message.includes('does not start with KZG commitment'),
        'throws on invalid commitment version'
      )
    }
    try {
      BlobEIP4844Transaction.fromTxData({ ...baseTxData, ...tooManyBlobs }, { common })
    } catch (err: any) {
      t.ok(err.message.includes('tx can contain at most'), 'throws on too many versioned hashes')
    }
    t.end()
  }
})

tape('Network wrapper tests', async (t) => {
  if (isBrowser() === true) {
    t.end()
  } else {
    const blobs = getBlobs('hello world')
    const commitments = blobsToCommitments(blobs)
    const versionedHashes = commitmentsToVersionedHashes(commitments)
    const proof = kzg.computeAggregateKzgProof(blobs)
    const bufferedHashes = versionedHashes.map((el) => Buffer.from(el))
    const unsignedTx = BlobEIP4844Transaction.fromTxData(
      {
        versionedHashes: bufferedHashes,
        blobs,
        kzgCommitments: commitments,
        kzgProof: Buffer.from(proof),
        maxFeePerDataGas: 100000000n,
        gasLimit: 0xffffffn,
        to: randomBytes(20),
      },
      { common }
    )
    const signedTx = unsignedTx.sign(pk)
    const sender = signedTx.getSenderAddress().toString()
    const wrapper = signedTx.serializeNetworkWrapper()
    const deserializedTx = BlobEIP4844Transaction.fromSerializedBlobTxNetworkWrapper(wrapper, {
      common,
    })

    t.equal(
      deserializedTx.type,
      0x05,
      'successfully deserialized a blob transaction network wrapper'
    )
    t.equal(deserializedTx.blobs?.length, blobs.length, 'contains the correct number of blobs')
    t.equal(
      deserializedTx.getSenderAddress().toString(),
      sender,
      'decoded sender address correctly'
    )
    const minimalTx = BlobEIP4844Transaction.minimalFromNetworkWrapper(deserializedTx, { common })
    t.ok(minimalTx.blobs === undefined, 'minimal representation contains no blobs')
    t.ok(
      minimalTx.hash().equals(deserializedTx.hash()),
      'has the same hash as the network wrapper version'
    )

    const txWithMissingBlob = BlobEIP4844Transaction.fromTxData(
      {
        versionedHashes: bufferedHashes,
        blobs: blobs.slice(1),
        kzgCommitments: commitments,
        maxFeePerDataGas: 100000000n,
        gasLimit: 0xffffffn,
        to: randomBytes(20),
      },
      { common }
    )

    const serializedWithMissingBlob = txWithMissingBlob.serializeNetworkWrapper()
    t.throws(
      () =>
        BlobEIP4844Transaction.fromSerializedBlobTxNetworkWrapper(serializedWithMissingBlob, {
          common,
        }),
      (err: any) =>
        err.message === 'Number of versionedHashes, blobs, and commitments not all equal',
      'throws when blobs/commitments/hashes mismatch'
    )

    const mangledValue = commitments[0][0]

    commitments[0][0] = 154
    const txWithInvalidCommitment = BlobEIP4844Transaction.fromTxData(
      {
        versionedHashes: bufferedHashes,
        blobs,
        kzgCommitments: commitments,
        maxFeePerDataGas: 100000000n,
        gasLimit: 0xffffffn,
        to: randomBytes(20),
      },
      { common }
    )

    const serializedWithInvalidCommitment = txWithInvalidCommitment.serializeNetworkWrapper()
    t.throws(
      () =>
        BlobEIP4844Transaction.fromSerializedBlobTxNetworkWrapper(serializedWithInvalidCommitment, {
          common,
        }),
      (err: any) => err.message === 'KZG proof cannot be verified from blobs/commitments',
      'throws when kzg proof cant be verified'
    )

    bufferedHashes[0][1] = 2
    commitments[0][0] = mangledValue

    const txWithInvalidVersionedHashes = BlobEIP4844Transaction.fromTxData(
      {
        versionedHashes: bufferedHashes,
        blobs,
        kzgCommitments: commitments,
        kzgProof: Buffer.from(proof),
        maxFeePerDataGas: 100000000n,
        gasLimit: 0xffffffn,
        to: randomBytes(20),
      },
      { common }
    )

    const serializedWithInvalidVersionedHashes =
      txWithInvalidVersionedHashes.serializeNetworkWrapper()
    t.throws(
      () =>
        BlobEIP4844Transaction.fromSerializedBlobTxNetworkWrapper(
          serializedWithInvalidVersionedHashes,
          {
            common,
          }
        ),
      (err: any) => err.message === 'commitment for blob at index 0 does not match versionedHash',
      'throws when versioned hashes dont match kzg commitments'
    )
    t.end()
  }
})

tape('hash() and signature verification', async (t) => {
  if (isBrowser() === true) {
    t.end()
  } else {
    const unsignedTx = BlobEIP4844Transaction.fromTxData(
      {
        chainId: 1,
        nonce: 1,
        versionedHashes: [
          Buffer.from('01624652859a6e98ffc1608e2af0147ca4e86e1ce27672d8d3f3c9d4ffd6ef7e', 'hex'),
        ],
        maxFeePerDataGas: 10000000n,
        gasLimit: 123457n,
        maxFeePerGas: 42n,
        maxPriorityFeePerGas: 10n,
        accessList: [
          {
            address: '0x0000000000000000000000000000000000000001',
            storageKeys: ['0x0000000000000000000000000000000000000000000000000000000000000000'],
          },
        ],
      },
      { common }
    )
    t.equal(
      unsignedTx.unsignedHash().toString('hex'),
      '0fcee5b30088a9c96b4990a3914002736a50f42468209d65a93badd3d1cd0677',
      'produced the correct transaction hash'
    )
    const signedTx = unsignedTx.sign(
      Buffer.from('45a915e4d060149eb4365960e6a7a45f334393093061116b197e3240065ff2d8', 'hex')
    )

    t.equal(
      signedTx.getSenderAddress().toString(),
      '0xa94f5374fce5edbc8e2a8697c15331677e6ebf0b',
      'was able to recover sender address'
    )
    t.ok(signedTx.verifySignature(), 'signature is valid')
    t.end()
  }
})
