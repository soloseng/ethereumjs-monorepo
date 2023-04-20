import { Block } from '@ethereumjs/block'
import { Chain, Common, Hardfork } from '@ethereumjs/common'
import { RLP } from '@ethereumjs/rlp'
import {
  AccessListEIP2930Transaction,
  Capability,
  FeeMarketEIP1559Transaction,
  Transaction,
} from '@ethereumjs/tx'
import { Account, Address, KECCAK256_RLP, toBuffer } from '@ethereumjs/util'
import * as tape from 'tape'

import { VM } from '../../src/vm'
import { getDAOCommon, setupPreConditions } from '../util'

import * as testnet from './testdata/testnet.json'
import { createAccount, setBalance, setupVM } from './utils'

import type {
  AfterBlockEvent,
  PostByzantiumTxReceipt,
  PreByzantiumTxReceipt,
  RunBlockOpts,
} from '../../src/types'
import type { TypedTransaction } from '@ethereumjs/tx'

const testData = require('./testdata/blockchain.json')
const common = new Common({ chain: Chain.Mainnet, hardfork: Hardfork.Berlin })

tape('runBlock() -> successful API parameter usage', async (t) => {
  async function simpleRun(vm: VM, st: tape.Test) {
    const common = new Common({ chain: Chain.Mainnet, hardfork: Hardfork.London })
    const genesisRlp = toBuffer(testData.genesisRLP)
    const genesis = Block.fromRLPSerializedBlock(genesisRlp, { common })

    const blockRlp = toBuffer(testData.blocks[0].rlp)
    const block = Block.fromRLPSerializedBlock(blockRlp, { common })

    //@ts-ignore
    await setupPreConditions(vm.eei, testData)

    st.ok(
      //@ts-ignore
      vm.stateManager._trie.root().equals(genesis.header.stateRoot),
      'genesis state root should match calculated state root'
    )

    const res = await vm.runBlock({
      block,
      // @ts-ignore
      root: vm.stateManager._trie.root(),
      skipBlockValidation: true,
      skipHardForkValidation: true,
    })

    st.equal(
      res.results[0].totalGasSpent.toString(16),
      '5208',
      'actual gas used should equal blockHeader gasUsed'
    )
  }

  async function uncleRun(vm: VM, st: tape.Test) {
    const testData = require('./testdata/uncleData.json')

    //@ts-ignore
    await setupPreConditions(vm.eei, testData)

    const common = new Common({ chain: Chain.Mainnet, hardfork: Hardfork.London })
    const block1Rlp = toBuffer(testData.blocks[0].rlp)
    const block1 = Block.fromRLPSerializedBlock(block1Rlp, { common })
    await vm.runBlock({
      block: block1,
      // @ts-ignore
      root: vm.stateManager._trie.root(),
      skipBlockValidation: true,
      skipHardForkValidation: true,
    })

    const block2Rlp = toBuffer(testData.blocks[1].rlp)
    const block2 = Block.fromRLPSerializedBlock(block2Rlp, { common })
    await vm.runBlock({
      block: block2,
      // @ts-ignore
      root: vm.stateManager._trie.root(),
      skipBlockValidation: true,
      skipHardForkValidation: true,
    })

    const block3Rlp = toBuffer(testData.blocks[2].rlp)
    const block3 = Block.fromRLPSerializedBlock(block3Rlp, { common })
    await vm.runBlock({
      block: block3,
      // @ts-ignore
      root: vm.stateManager._trie.root(),
      skipBlockValidation: true,
      skipHardForkValidation: true,
    })

    const uncleReward = (
      await vm.stateManager.getAccount(
        Address.fromString('0xb94f5374fce5ed0000000097c15331677e6ebf0b')
      )
    ).balance.toString(16)

    st.equal(
      `0x${uncleReward}`,
      testData.postState['0xb94f5374fce5ed0000000097c15331677e6ebf0b'].balance,
      'calculated balance should equal postState balance'
    )
  }

  t.test('PoW block, unmodified options', async (st) => {
    const vm = await setupVM({ common })
    await simpleRun(vm, st)
  })

  t.test('Uncle blocks, compute uncle rewards', async (st) => {
    const vm = await setupVM({ common })
    await uncleRun(vm, st)
  })

  t.test('PoW block, Common custom chain (Common.custom() static constructor)', async (st) => {
    const customChainParams = { name: 'custom', chainId: 123, networkId: 678 }
    const common = Common.custom(customChainParams, { baseChain: 'mainnet', hardfork: 'berlin' })
    const vm = await setupVM({ common })
    await simpleRun(vm, st)
  })

  t.test('PoW block, Common custom chain (Common customChains constructor option)', async (st) => {
    const customChains = [testnet]
    const common = new Common({ chain: 'testnet', hardfork: Hardfork.Berlin, customChains })
    const vm = await setupVM({ common })
    await simpleRun(vm, st)
  })

  t.test('hardforkByBlockNumber option', async (st) => {
    const common1 = new Common({
      chain: Chain.Mainnet,
      hardfork: Hardfork.MuirGlacier,
    })

    // Have to use an unique common, otherwise the HF will be set to muirGlacier and then will not change back to chainstart.
    const common2 = new Common({
      chain: Chain.Mainnet,
      hardfork: Hardfork.Chainstart,
    })

    const privateKey = Buffer.from(
      'e331b6d69882b4cb4ea581d88e0b604039a3de5967688d3dcffdd2270c0fd109',
      'hex'
    )

    function getBlock(common: Common): Block {
      return Block.fromBlockData(
        {
          header: {
            number: BigInt(10000000),
          },
          transactions: [
            Transaction.fromTxData(
              {
                data: '0x600154', // PUSH 01 SLOAD
                gasLimit: BigInt(100000),
              },
              { common }
            ).sign(privateKey),
          ],
        },
        { common }
      )
    }

    const vm = await VM.create({ common: common1, hardforkByBlockNumber: true })
    const vm_noSelect = await VM.create({ common: common2 })

    const txResultMuirGlacier = await vm.runBlock({
      block: getBlock(common1),
      skipBlockValidation: true,
      generate: true,
    })
    const txResultChainstart = await vm_noSelect.runBlock({
      block: getBlock(common2),
      skipBlockValidation: true,
      generate: true,
    })
    st.equal(
      txResultChainstart.results[0].totalGasSpent,
      BigInt(21000) + BigInt(68) * BigInt(3) + BigInt(3) + BigInt(50),
      'tx charged right gas on chainstart hard fork'
    )
    st.equal(
      txResultMuirGlacier.results[0].totalGasSpent,
      BigInt(21000) + BigInt(32000) + BigInt(16) * BigInt(3) + BigInt(3) + BigInt(800),
      'tx charged right gas on muir glacier hard fork'
    )
  })
})

tape('runBlock() -> API parameter usage/data errors', async (t) => {
  const vm = await VM.create({ common })

  t.test('should fail when runTx fails', async (t) => {
    const common = new Common({ chain: Chain.Mainnet, hardfork: Hardfork.London })
    const blockRlp = toBuffer(testData.blocks[0].rlp)
    const block = Block.fromRLPSerializedBlock(blockRlp, { common })

    // The mocked VM uses a mocked runTx
    // which always returns an error.
    await vm
      .runBlock({ block, skipBlockValidation: true, skipHardForkValidation: true })
      .then(() => t.fail('should have returned error'))
      .catch((e) => t.ok(e.message.includes("sender doesn't have enough funds to send tx")))
  })

  t.test('should fail when block gas limit higher than 2^63-1', async (t) => {
    const vm = await VM.create({ common })

    const block = Block.fromBlockData({
      header: {
        ...testData.blocks[0].header,
        gasLimit: Buffer.from('8000000000000000', 'hex'),
      },
    })
    await vm
      .runBlock({ block })
      .then(() => t.fail('should have returned error'))
      .catch((e) => t.ok(e.message.includes('Invalid block')))
  })

  t.test('should fail when block validation fails', async (t) => {
    const vm = await VM.create({ common })

    const blockRlp = toBuffer(testData.blocks[0].rlp)
    const block = Object.create(Block.fromRLPSerializedBlock(blockRlp, { common }))

    await vm
      .runBlock({ block })
      .then(() => t.fail('should have returned error'))
      .catch((e) => {
        t.ok(e.code.includes('LEVEL_NOT_FOUND'), 'block failed validation due to no parent header')
      })
  })

  t.test('should fail when no `validateHeader` method exists on blockchain class', async (t) => {
    const vm = await VM.create({ common })
    const blockRlp = toBuffer(testData.blocks[0].rlp)
    const block = Object.create(Block.fromRLPSerializedBlock(blockRlp, { common }))
    ;(vm.blockchain as any).validateHeader = undefined
    try {
      await vm.runBlock({ block })
    } catch (err: any) {
      t.equal(
        err.message,
        'cannot validate header: blockchain has no `validateHeader` method',
        'should error'
      )
    }
  })

  t.test('should fail when tx gas limit higher than block gas limit', async (t) => {
    const vm = await VM.create({ common })

    const blockRlp = toBuffer(testData.blocks[0].rlp)
    const block = Object.create(Block.fromRLPSerializedBlock(blockRlp, { common }))
    // modify first tx's gasLimit
    const { nonce, gasPrice, to, value, data, v, r, s } = block.transactions[0]

    const gasLimit = BigInt('0x3fefba')
    const opts = { common: block._common }
    block.transactions[0] = new Transaction(
      { nonce, gasPrice, gasLimit, to, value, data, v, r, s },
      opts
    )

    await vm
      .runBlock({ block, skipBlockValidation: true })
      .then(() => t.fail('should have returned error'))
      .catch((e) => t.ok(e.message.includes('higher gas limit')))
  })
})

tape('runBlock() -> runtime behavior', async (t) => {
  // this test actually checks if the DAO fork works. This is not checked in ethereum/tests
  t.test('DAO fork behavior', async (t) => {
    const common = getDAOCommon(1)

    const vm = await setupVM({ common })

    const block1: any = RLP.decode(testData.blocks[0].rlp)
    // edit extra data of this block to "dao-hard-fork"
    block1[0][12] = Buffer.from('dao-hard-fork')
    const block = Block.fromValuesArray(block1, { common })
    // @ts-ignore
    await setupPreConditions(vm.eei, testData)

    // fill two original DAO child-contracts with funds and the recovery account with funds in order to verify that the balance gets summed correctly
    const fundBalance1 = BigInt('0x1111')
    const accountFunded1 = createAccount(BigInt(0), fundBalance1)
    const DAOFundedContractAddress1 = new Address(
      Buffer.from('d4fe7bc31cedb7bfb8a345f31e668033056b2728', 'hex')
    )
    await vm.stateManager.putAccount(DAOFundedContractAddress1, accountFunded1)

    const fundBalance2 = BigInt('0x2222')
    const accountFunded2 = createAccount(BigInt(0), fundBalance2)
    const DAOFundedContractAddress2 = new Address(
      Buffer.from('b3fb0e5aba0e20e5c49d252dfd30e102b171a425', 'hex')
    )
    await vm.stateManager.putAccount(DAOFundedContractAddress2, accountFunded2)

    const DAORefundAddress = new Address(
      Buffer.from('bf4ed7b27f1d666546e30d74d50d173d20bca754', 'hex')
    )
    const fundBalanceRefund = BigInt('0x4444')
    const accountRefund = createAccount(BigInt(0), fundBalanceRefund)
    await vm.stateManager.putAccount(DAORefundAddress, accountRefund)

    await vm.runBlock({
      block,
      skipBlockValidation: true,
      generate: true,
    })

    const DAOFundedContractAccount1 = await vm.stateManager.getAccount(DAOFundedContractAddress1)
    t.equals(DAOFundedContractAccount1.balance, BigInt(0)) // verify our funded account now has 0 balance
    const DAOFundedContractAccount2 = await vm.stateManager.getAccount(DAOFundedContractAddress2)
    t.equals(DAOFundedContractAccount2.balance, BigInt(0)) // verify our funded account now has 0 balance

    const DAORefundAccount = await vm.stateManager.getAccount(DAORefundAddress)
    // verify that the refund account gets the summed balance of the original refund account + two child DAO accounts
    const msg =
      'should transfer balance from DAO children to the Refund DAO account in the DAO fork'
    t.equal(DAORefundAccount.balance, BigInt(0x7777), msg)
  })

  t.test('should allocate to correct clique beneficiary', async (t) => {
    const common = new Common({ chain: Chain.Goerli, hardfork: Hardfork.Istanbul })
    const vm = await setupVM({ common })

    const signer = {
      address: new Address(Buffer.from('0b90087d864e82a284dca15923f3776de6bb016f', 'hex')),
      privateKey: Buffer.from(
        '64bf9cc30328b0e42387b3c82c614e6386259136235e20c1357bd11cdee86993',
        'hex'
      ),
      publicKey: Buffer.from(
        '40b2ebdf4b53206d2d3d3d59e7e2f13b1ea68305aec71d5d24cefe7f24ecae886d241f9267f04702d7f693655eb7b4aa23f30dcd0c3c5f2b970aad7c8a828195',
        'hex'
      ),
    }

    const otherUser = {
      address: new Address(Buffer.from('6f62d8382bf2587361db73ceca28be91b2acb6df', 'hex')),
      privateKey: Buffer.from(
        '2a6e9ad5a6a8e4f17149b8bc7128bf090566a11dbd63c30e5a0ee9f161309cd6',
        'hex'
      ),
      publicKey: Buffer.from(
        'ca0a55f6e81cb897aee6a1c390aa83435c41048faa0564b226cfc9f3df48b73e846377fb0fd606df073addc7bd851f22547afbbdd5c3b028c91399df802083a2',
        'hex'
      ),
    }

    // add balance to otherUser to send two txs to zero address
    await vm.stateManager.putAccount(otherUser.address, new Account(BigInt(0), BigInt(42000)))
    const tx = Transaction.fromTxData(
      { to: Address.zero(), gasLimit: 21000, gasPrice: 1 },
      { common }
    ).sign(otherUser.privateKey)

    // create block with the signer and txs
    const block = Block.fromBlockData(
      { header: { extraData: Buffer.alloc(97) }, transactions: [tx, tx] },
      { common, cliqueSigner: signer.privateKey }
    )

    await vm.runBlock({ block, skipNonce: true, skipBlockValidation: true, generate: true })
    const account = await vm.stateManager.getAccount(signer.address)
    t.equal(account.balance, BigInt(42000), 'beneficiary balance should equal the cost of the txs')
  })
})

async function runBlockAndGetAfterBlockEvent(
  vm: VM,
  runBlockOpts: RunBlockOpts
): Promise<AfterBlockEvent> {
  let results: AfterBlockEvent
  function handler(event: AfterBlockEvent) {
    results = event
  }

  try {
    vm.events.once('afterBlock', handler)
    await vm.runBlock(runBlockOpts)
  } finally {
    // We need this in case `runBlock` throws before emitting the event.
    // Otherwise we'd be leaking the listener until the next call to runBlock.
    vm.events.removeListener('afterBlock', handler)
  }

  return results!
}

tape('should correctly reflect generated fields', async (t) => {
  const vm = await VM.create()

  // We create a block with a receiptTrie and transactionsTrie
  // filled with 0s and no txs. Once we run it we should
  // get a receipt trie root of for the empty receipts set,
  // which is a well known constant.
  const buffer32Zeros = Buffer.alloc(32, 0)
  const block = Block.fromBlockData({
    header: { receiptTrie: buffer32Zeros, transactionsTrie: buffer32Zeros, gasUsed: BigInt(1) },
  })

  const results = await runBlockAndGetAfterBlockEvent(vm, {
    block,
    generate: true,
    skipBlockValidation: true,
  })

  t.ok(results.block.header.receiptTrie.equals(KECCAK256_RLP))
  t.ok(results.block.header.transactionsTrie.equals(KECCAK256_RLP))
  t.equal(results.block.header.gasUsed, BigInt(0))
})

async function runWithHf(hardfork: string) {
  const common = new Common({ chain: Chain.Mainnet, hardfork })
  const vm = await setupVM({ common })

  const blockRlp = toBuffer(testData.blocks[0].rlp)
  const block = Block.fromRLPSerializedBlock(blockRlp, { common })

  // @ts-ignore
  await setupPreConditions(vm.eei, testData)

  const res = await vm.runBlock({
    block,
    generate: true,
    skipBlockValidation: true,
  })
  return res
}

// TODO: complete on result values and add more usage scenario test cases
tape('runBlock() -> API return values', async (t) => {
  t.test('should return correct HF receipts', async (t) => {
    let res = await runWithHf('byzantium')
    t.equal(
      (res.receipts[0] as PostByzantiumTxReceipt).status,
      1,
      'should return correct post-Byzantium receipt format'
    )

    res = await runWithHf('spuriousDragon')
    t.deepEqual(
      (res.receipts[0] as PreByzantiumTxReceipt).stateRoot,
      Buffer.from('4477e2cfaf9fd2eed4f74426798b55d140f6a9612da33413c4745f57d7a97fcc', 'hex'),
      'should return correct pre-Byzantium receipt format'
    )
  })
})

tape('runBlock() -> tx types', async (t) => {
  async function simpleRun(vm: VM, transactions: TypedTransaction[], st: tape.Test) {
    const common = vm._common

    const blockRlp = toBuffer(testData.blocks[0].rlp)
    const block = Block.fromRLPSerializedBlock(blockRlp, { common, freeze: false })

    //@ts-ignore overwrite transactions
    block.transactions = transactions

    if (transactions.some((t) => t.supports(Capability.EIP1559FeeMarket))) {
      // @ts-ignore overwrite read-only property
      block.header.baseFeePerGas = BigInt(7)
    }

    //@ts-ignore
    await setupPreConditions(vm.eei, testData)

    const res = await vm.runBlock({
      block,
      skipBlockValidation: true,
      generate: true,
    })

    st.equal(
      res.gasUsed,
      res.receipts
        .map((r) => r.cumulativeBlockGasUsed)
        .reduce((prevValue: bigint, currValue: bigint) => prevValue + currValue, BigInt(0)),
      "gas used should equal transaction's total gasUsed"
    )
  }

  t.test('legacy tx', async (st) => {
    const common = new Common({ chain: Chain.Mainnet, hardfork: Hardfork.Berlin })
    const vm = await setupVM({ common })

    const address = Address.fromString('0xccfd725760a68823ff1e062f4cc97e1360e8d997')
    await setBalance(vm, address)

    const tx = Transaction.fromTxData({ gasLimit: 53000, value: 1 }, { common, freeze: false })

    tx.getSenderAddress = () => {
      return address
    }

    await simpleRun(vm, [tx], st)
  })

  t.test('access list tx', async (st) => {
    const common = new Common({ chain: Chain.Mainnet, hardfork: Hardfork.Berlin })
    const vm = await setupVM({ common })

    const address = Address.fromString('0xccfd725760a68823ff1e062f4cc97e1360e8d997')
    await setBalance(vm, address)

    const tx = AccessListEIP2930Transaction.fromTxData(
      { gasLimit: 53000, value: 1, v: 1, r: 1, s: 1 },
      { common, freeze: false }
    )

    tx.getSenderAddress = () => {
      return address
    }

    await simpleRun(vm, [tx], st)
  })

  t.test('fee market tx', async (st) => {
    const common = new Common({ chain: Chain.Mainnet, hardfork: Hardfork.London })
    const vm = await setupVM({ common })

    const address = Address.fromString('0xccfd725760a68823ff1e062f4cc97e1360e8d997')
    await setBalance(vm, address)

    const tx = FeeMarketEIP1559Transaction.fromTxData(
      { maxFeePerGas: 10, maxPriorityFeePerGas: 4, gasLimit: 100000, value: 6 },
      { common, freeze: false }
    )

    tx.getSenderAddress = () => {
      return address
    }

    await simpleRun(vm, [tx], st)
  })
})
