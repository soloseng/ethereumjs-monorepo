import { RLP } from '@ethereumjs/rlp'
import { bufferToBigInt } from '@ethereumjs/util'
import * as tape from 'tape'
import * as td from 'testdouble'

import { Chain } from '../../../lib/blockchain'
import { Config } from '../../../lib/config'
import { SnapProtocol } from '../../../lib/net/protocol'
import { wait } from '../../integration/util'

const _accountRangeRLP =
  'f90b7c01f88aeda0000001907a67cf7ece54c42262997b2f19041a4d99466b94b8c12f225827e239cb80872386f26fc100008080eda00000107c642e29a6b613205c923ac3a4cf0cf1704ae9a8bef2784caba060f4b7cb07870e22e1219054118080eda000001d26422787b6d40c0c0c2df85757c5ad4a3e367831e932fa24f34da43d57cb80872386f26fc100008080f90aecb90214f90211a0b3f22b069c398ded55d4ce421b06f6b4d5e13cb53ad1c6220276b2b3a078937ba08a54e492e7b9ef911b4a299487a12390ccd81a087398af7106e00b81a791868da0a323a93f5791d4c39e1496e4856f9233e5e86070c722efde613219aca834bde3a0d8c11a8fc2eba0b47de9d5b207b702a8bd62609e9c2504aaa444fd2e98e31deaa0dbfc625e370fa89cb7b123550ef6fd637687b9e9a7c8556bd41bcd4226226095a094fe5f6ac37c805917beefa220d7c6b3bd50848322f6342e940cc047c9b6a8ffa074af7e57b9c59e06a2e478610d56ab39004cda3109cfd953dc8b1d168c453cbca0d58f31d0ecce773d610aa5d12f7cc2f4ca992db4ce2e154c13a12cb4bb567816a0b26a7d9776165bb52e793df6a77d4032164d788bf9954c9cac289ea0786da2fda043804bd146f583b183dc267b36bbe55f63daa36fd6cbdafce48ce451a444b4eca0fc724e8bb65724450eb3966d8672330c8e49a94c6ceaed06174a2322aafee105a02ccb0445b0a4028f167e425b57cb9462cc6caceda0c3cfb5363f08614314a77ca0c64db3edb50609b6de331f00ba1f455113d1388e9eb5f50f5420983012d62b7da0168c680c03ef3fbcc36a6c1ddd9bf7d46b5fd5ee34dd7048320223c8bbe412f9a05747d2eb930bffce317c253e3889a7db57c87dcc55f1f1f77b3d02fc82bc6bcfa0997073e1664f9cbbcfd968277856596c325a6b83887f4ad007c3b93e1133c65280b90214f90211a0b3e6ec5fa09062b280599994d38261cae87ab198ed1b3a7d7003a277ffc735dfa01bac91007228f4fa15ac9c2a4822b7d4103eafae61dd3db30eb830e31de9cddfa0809973bebc62f48fb834336800b1ce8e1b2128ee5824645464b6c09ddd381578a0f8d54e19e888fc01cd5069bfcddb7ee78a4afdec24aa03822d9fd5356a3c109fa08a61ea95c616906799398778b28f0e8a19f6569f885e4b4f1192f3e9f690cefea09aa53cd259b1df9650222dc285236399da685b7350312a3ac0a07a86bef64d5ea01596637937233489a70e114c23818e3512b3c2abf621d142c14a9b9a3afb09d1a0e8a8bcda78ae77bee956389dff38a10c8c1565bc1a85064da6cd8ba606b9aa35a04ae4b4bfbfb97f5b4e178f8c30a6d93ffd6614c8b4d0b44df31b653a3a1e4f0fa0a4e3413e6ee6c5886ed346827ee0cce05a8e4f799b005aacf002a17e6d93e5aaa09a3e6d344bbd2496bf8fa84abc96a3d5f363ba03103edff2164244bb020c52a2a0998f39835105197f860930b46adad4527f5a9ef31c4744476718b910ffc5e586a01cec4592958b5aefe25bea6a49a11089e798d96aebc2be7fce0f1772146d18aea0d7c178ed5bcf822d22f9ed3ca8c95e5144ee0a9fbae901b21da002e2c3c0415ea0a9d5c5c67326f4154449575827ab68ea47c7c8931490160a7a299f829a670476a074814ffe69da7e253de29fc7d5eb57291a67bd6f16cb52175106b7cbd3b19c8f80b90214f90211a0947eec1b645849d129fb8c65cd06bd52526fb2399d1660ee5108fc4698e809aaa02735f6cbb0e10514b1515826ae1c539850543dbe162badaf2efa51b1a353ca1ca0fde2642bcc8db8d6d6e42731eeae2045fc30b84c6efdc420ce8cee5d537b648fa071e7887ca31ae375838ceeed57165f5592a9e6cae9beb070e92a4f5d5aec5014a0f81f4b4d5e2c52373b8884b398838941df0b16177aa4ea8494b183176cf7d526a0dc6ecec073532c8f9581ece75cb4eea83a40ba0210cc10ef0fd8b27a102a028fa0426f18f1de1bc9b665e9efb45d6547e88e35a267d7ec9197ae97052d1be59ab9a0d6aad68bece934d578e18eb3acd147490bc6cc01e646f1d8618a747526eae4f5a04ffee6f8660794981b15fda1ceafef98db853bfc31c029db7cb515bb34bb5572a0da2497fed45626b94c1eb910c9eedc9c26a4ff5b56b709b96d5a567991ebe2aca021b3bfcd8aa97eb8d9a3ce258389603564f01d6f485899a9f6e0a00d85dc00dfa0339e45f0407ad527a899a2e06e17330c2cfe25b81689dcffd20c166ef256fbc6a0dafd25416aaf44a8bfa1a6bf2b0cc563f9be84b9b3b8bf307983252d7cd63c51a0191504034adb55fe0926c7c4066654739af3e1c9c4173f4d90fa2e1df62a99cca0504e2144c1a889e48cd5a6baa17e39b6a176dbf41147dd171f2673c5c9d849dba04850f33ad929cb1a07136f162e33a5df0f65c48f359637774e7c8ebabe90eb7080b90214f90211a05d16e93a6e58a13a7c7dde40d0c543b9d63d029ec0da5efb4be34cd4ce672181a089cbb0e940fb7bb395091e3b665755be6b51292fba7a7bc39904568c63a907e1a050314b93f73fed553cd9dee63dc1fe9b789f9b9e111a659ff4e4c91c8167a63ca04444bd2a1bb78a83b66a36a09076b2b49eade4e2e8c8ef91538117525893841aa0abde6220817f3608bdfec46ebed292c464ee1d2c58d0b43286b8617bb4cb49d9a07257eff6aebb380db4c75752a84c6b2d0bb86bb190cef2a58829497997262b6aa0a0d4ab9d93be97287f29637a9b16fb8a6c8cd3bc29786b64343113b95a4153ffa0f0d479377ce4c0f31185c45319f915532cea13e97d5abfc939b75b642b5b47bba0eb96a911347f5321e03f1602a041ce82ec29bb4b322faa9f999cf02bb0c7a932a047b6c76ffeb29b4e3c3c09749289213395c8b0126dbd8acee45c6d32d2a0ab5fa0ca462e8ff237f9e56698ca416fac835ed37bc90683d363effe7ec9dacb4963fba0d385f828becce3665e070b645df25dec507a7c6c3813591e3436147be0becc75a0537a7451522228feca0ceb55374615e8396229e1c7a6b0ae16fb49cd8e6ed7a9a0b96561ab484f67b604d2dc46ac170750b321334aabcfb6b212a906e1cb5b3532a09f64f7c76e201d48b4bc1fb02f7e052a5a1bf05b2c59f3c969c8d2d6b373b3dca0398a988af30676952fcf1a968ac530b30dbe32922efe8c27acb9025adcaf1a5180b90134f90131a0b2151043be015f98b1b249180bfac505781022ede708f533f373b2d612837df7a0031e6ffe32d313f0cd57b4bebbf6fcacf83c366157846040108d198129d99a5aa0bfca4f79ac9eb24bcbdbd94fc49c0ca30a6399a2071e4ab3024e1aae0159a31180808080a0f1a2c911436f5bf1aa936e140b17399f7c092ad64a8ab839057a67fc6923a318a0e648ced926c977b0dcc17452361ac43e53f839b8e485a288e93fb667573ae088a0808107d197eb28741f8cec92b6fa76957fa6928b00f4b7301d464809519258098080a02c7ac441b072bbe33030110dccfdda0de6705c4bdb2c94594e10c2fb8687c41080a0162e8104a86bd043ca2fac0c5d56181127c7b24f6c10fefb90c27064b4edeff8a0376bcbdd3b7503a144b9016159b7e2cd074c9566b843cb834123057c61adbd2e80b870f86e9e31907a67cf7ece54c42262997b2f19041a4d99466b94b8c12f225827e239b84df84b80872386f26fc10000a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470b873f871a0a75a6fa397f39292a3bb4fdb84463908c473bad9a0206bd00964adabd7a4b589808080808080808080808080a0ea5b9774dfc3fd50b359b86fa49a57fce0186593cf89d865e279413b63947bed80a0a0747bb1023533b4f9cdaa7c845609975d413348fc5f185a120037dccdf3584c80b870f86e9e2026422787b6d40c0c0c2df85757c5ad4a3e367831e932fa24f34da43d57b84df84b80872386f26fc10000a056e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421a0c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470'

tape('[AccountFetcher]', async (t) => {
  class PeerPool {
    idle() {}
    ban() {}
  }
  PeerPool.prototype.idle = td.func<any>()
  PeerPool.prototype.ban = td.func<any>()

  const { AccountFetcher } = await import('../../../lib/sync/fetcher/accountfetcher')

  t.test('should start/stop', async (t) => {
    const config = new Config({ maxPerRequest: 5, transports: [] })
    const pool = new PeerPool() as any
    const fetcher = new AccountFetcher({
      config,
      pool,
      root: Buffer.from(''),
      first: BigInt(1),
      count: BigInt(10),
    })
    fetcher.next = () => false
    t.notOk((fetcher as any).running, 'not started')
    void fetcher.fetch()
    t.equals((fetcher as any).in.length, 1, 'added 1 tasks')
    await wait(100)
    t.ok((fetcher as any).running, 'started')
    fetcher.destroy()
    await wait(100)
    t.notOk((fetcher as any).running, 'stopped')
    t.end()
  })

  t.test('should process', (t) => {
    const config = new Config({ transports: [] })
    const pool = new PeerPool() as any
    const fetcher = new AccountFetcher({
      config,
      pool,
      root: Buffer.from(''),
      first: BigInt(1),
      count: BigInt(10),
    })
    const fullResult: any = [
      {
        hash: Buffer.from(''),
        body: [Buffer.from(''), Buffer.from(''), Buffer.from(''), Buffer.from('')],
      },
      {
        hash: Buffer.from(''),
        body: [Buffer.from(''), Buffer.from(''), Buffer.from(''), Buffer.from('')],
      },
    ]
    const accountDataResponse: any = [
      {
        hash: Buffer.from(''),
        body: [Buffer.from(''), Buffer.from(''), Buffer.from(''), Buffer.from('')],
      },
      {
        hash: Buffer.from(''),
        body: [Buffer.from(''), Buffer.from(''), Buffer.from(''), Buffer.from('')],
      },
    ]
    accountDataResponse.completed = true
    t.deepEquals(fetcher.process({} as any, accountDataResponse), fullResult, 'got results')
    t.notOk(fetcher.process({} as any, { accountDataResponse: [] } as any), 'bad results')
    t.end()
  })

  t.test('should adopt correctly', (t) => {
    const config = new Config({ transports: [] })
    const pool = new PeerPool() as any
    const fetcher = new AccountFetcher({
      config,
      pool,
      root: Buffer.from(''),
      first: BigInt(1),
      count: BigInt(10),
    })
    const accountDataResponse: any = [
      {
        hash: Buffer.from(''),
        body: [Buffer.from(''), Buffer.from(''), Buffer.from(''), Buffer.from('')],
      },
      {
        hash: Buffer.from(''),
        body: [Buffer.from(''), Buffer.from(''), Buffer.from(''), Buffer.from('')],
      },
    ]
    accountDataResponse.completed = false
    const task = { count: BigInt(3), first: BigInt(1) }
    ;(fetcher as any).running = true
    fetcher.enqueueTask(task)
    const job = (fetcher as any).in.peek()
    let results = fetcher.process(job as any, accountDataResponse)
    t.equal((fetcher as any).in.length, 1, 'Fetcher should still have same job')
    t.equal(job?.partialResult?.length, 2, 'Should have two partial results')
    t.equal(results, undefined, 'Process should not return full results yet')

    const remainingAccountData: any = [
      {
        hash: Buffer.from(''),
        body: [Buffer.from(''), Buffer.from(''), Buffer.from(''), Buffer.from('')],
      },
    ]
    remainingAccountData.completed = true
    results = fetcher.process(job as any, remainingAccountData)
    t.equal(results?.length, 3, 'Should return full results')

    t.end()
  })

  t.test('should request correctly', async (t) => {
    const config = new Config({ transports: [] })
    const pool = new PeerPool() as any
    const fetcher = new AccountFetcher({
      config,
      pool,
      root: Buffer.from(''),
      first: BigInt(1),
      count: BigInt(3),
    })
    const partialResult: any = [
      [
        {
          hash: Buffer.from(''),
          body: [Buffer.from(''), Buffer.from(''), Buffer.from(''), Buffer.from('')],
        },
        {
          hash: Buffer.from(''),
          body: [Buffer.from(''), Buffer.from(''), Buffer.from(''), Buffer.from('')],
        },
      ],
    ]

    const task = { count: 3, first: BigInt(1) }
    const peer = {
      snap: { getAccountRange: td.func<any>() },
      id: 'random',
      address: 'random',
    }
    const job = { peer, partialResult, task }
    await fetcher.request(job as any)
    td.verify(
      job.peer.snap.getAccountRange({
        root: Buffer.from(''),
        origin: td.matchers.anything(),
        limit: td.matchers.anything(),
        bytes: BigInt(50000),
      })
    )
    t.end()
  })

  t.test('should verify proof correctly', async (t) => {
    const config = new Config({ transports: [] })
    const chain = await Chain.create({ config })
    const p = new SnapProtocol({ config, chain })
    const pool = new PeerPool() as any
    const fetcher = new AccountFetcher({
      config,
      pool,
      root: Buffer.from('39ed8daab7679c0b1b7cf3667c50108185d4d9d1431c24a1c35f696a58277f8f', 'hex'),
      first: bufferToBigInt(
        Buffer.from('0000000000000000000000000000000000000000000000000000000000000001', 'hex')
      ),
      count: bufferToBigInt(
        Buffer.from('000010c6f7a0b5ed8d36b4c7f34938583621fafc8b0079a2834d26fa3fcc9ea9', 'hex')
      ),
    })
    const task = { count: 3, first: BigInt(1) }
    const resData = RLP.decode(Buffer.from(_accountRangeRLP, 'hex')) as unknown
    const { accounts, proof } = p.decode(
      p.messages.filter((message) => message.name === 'AccountRange')[0],
      resData
    )
    const mockedGetAccountRange = td.func<any>()
    td.when(mockedGetAccountRange(td.matchers.anything())).thenReturn({
      reqId: BigInt(1),
      accounts,
      proof,
    })
    const peer = {
      snap: { getAccountRange: mockedGetAccountRange },
      id: 'random',
      address: 'random',
    }
    const job = { peer, task }
    t.ok(await fetcher.request(job as any), 'Proof verification is completed without errors')
    t.end()
  })

  t.test('should find a fetchable peer', async (t) => {
    const config = new Config({ transports: [] })
    const pool = new PeerPool() as any
    const fetcher = new AccountFetcher({
      config,
      pool,
      root: Buffer.from(''),
      first: BigInt(1),
      count: BigInt(10),
    })
    td.when((fetcher as any).pool.idle(td.matchers.anything())).thenReturn('peer0')
    t.equals(fetcher.peer(), 'peer0', 'found peer')
    t.end()
  })

  t.test('should reset td', (t) => {
    td.reset()
    t.end()
  })
})
