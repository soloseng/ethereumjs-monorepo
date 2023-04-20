@ethereumjs/block

# @ethereumjs/block

## Table of contents

### Classes

- [Block](classes/Block.md)
- [BlockHeader](classes/BlockHeader.md)

### Interfaces

- [BlockData](interfaces/BlockData.md)
- [BlockOptions](interfaces/BlockOptions.md)
- [HeaderData](interfaces/HeaderData.md)
- [JsonBlock](interfaces/JsonBlock.md)
- [JsonHeader](interfaces/JsonHeader.md)
- [JsonRpcBlock](interfaces/JsonRpcBlock.md)

### Type Aliases

- [BlockBodyBuffer](README.md#blockbodybuffer)
- [BlockBuffer](README.md#blockbuffer)
- [BlockHeaderBuffer](README.md#blockheaderbuffer)
- [TransactionsBuffer](README.md#transactionsbuffer)
- [UncleHeadersBuffer](README.md#uncleheadersbuffer)
- [WithdrawalsBuffer](README.md#withdrawalsbuffer)

## Type Aliases

### BlockBodyBuffer

Ƭ **BlockBodyBuffer**: [[`TransactionsBuffer`](README.md#transactionsbuffer), [`UncleHeadersBuffer`](README.md#uncleheadersbuffer), WithdrawalsBuffer?]

#### Defined in

[types.ts:128](https://github.com/ethereumjs/ethereumjs-monorepo/blob/master/packages/block/src/types.ts#L128)

___

### BlockBuffer

Ƭ **BlockBuffer**: [[`BlockHeaderBuffer`](README.md#blockheaderbuffer), [`TransactionsBuffer`](README.md#transactionsbuffer), [`UncleHeadersBuffer`](README.md#uncleheadersbuffer)] \| [[`BlockHeaderBuffer`](README.md#blockheaderbuffer), [`TransactionsBuffer`](README.md#transactionsbuffer), [`UncleHeadersBuffer`](README.md#uncleheadersbuffer), [`WithdrawalsBuffer`](README.md#withdrawalsbuffer)]

#### Defined in

[types.ts:124](https://github.com/ethereumjs/ethereumjs-monorepo/blob/master/packages/block/src/types.ts#L124)

___

### BlockHeaderBuffer

Ƭ **BlockHeaderBuffer**: `Buffer`[]

#### Defined in

[types.ts:127](https://github.com/ethereumjs/ethereumjs-monorepo/blob/master/packages/block/src/types.ts#L127)

___

### TransactionsBuffer

Ƭ **TransactionsBuffer**: `Buffer`[][] \| `Buffer`[]

TransactionsBuffer can be an array of serialized txs for Typed Transactions or an array of Buffer Arrays for legacy transactions.

#### Defined in

[types.ts:132](https://github.com/ethereumjs/ethereumjs-monorepo/blob/master/packages/block/src/types.ts#L132)

___

### UncleHeadersBuffer

Ƭ **UncleHeadersBuffer**: `Buffer`[][]

#### Defined in

[types.ts:133](https://github.com/ethereumjs/ethereumjs-monorepo/blob/master/packages/block/src/types.ts#L133)

___

### WithdrawalsBuffer

Ƭ **WithdrawalsBuffer**: `WithdrawalBuffer`[]

#### Defined in

[types.ts:122](https://github.com/ethereumjs/ethereumjs-monorepo/blob/master/packages/block/src/types.ts#L122)
