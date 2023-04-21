[@ethereumjs/tx](../README.md) / TransactionFactory

# Class: TransactionFactory

## Table of contents

### Methods

- [fromBlockBodyData](TransactionFactory.md#fromblockbodydata)
- [fromEthersProvider](TransactionFactory.md#fromethersprovider)
- [fromSerializedData](TransactionFactory.md#fromserializeddata)
- [fromTxData](TransactionFactory.md#fromtxdata)

## Methods

### fromBlockBodyData

▸ `Static` **fromBlockBodyData**(`data`, `txOptions?`): [`TypedTransaction`](../README.md#typedtransaction)

When decoding a BlockBody, in the transactions field, a field is either:
A Buffer (a TypedTransaction - encoded as TransactionType || rlp(TransactionPayload))
A Buffer[] (Legacy Transaction)
This method returns the right transaction.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `data` | `Buffer` \| `Buffer`[] | A Buffer or Buffer[] |
| `txOptions` | [`TxOptions`](../interfaces/TxOptions.md) | The transaction options |

#### Returns

[`TypedTransaction`](../README.md#typedtransaction)

#### Defined in

[transactionFactory.ts:88](https://github.com/ethereumjs/ethereumjs-monorepo/blob/master/packages/tx/src/transactionFactory.ts#L88)

___

### fromEthersProvider

▸ `Static` **fromEthersProvider**(`provider`, `txHash`, `txOptions?`): `Promise`<[`TypedTransaction`](../README.md#typedtransaction)\>

Method to retrieve a transaction from the provider

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `provider` | `string` \| `JsonRpcProvider` | An Ethers JsonRPCProvider |
| `txHash` | `string` | Transaction hash |
| `txOptions?` | [`TxOptions`](../interfaces/TxOptions.md) | The transaction options |

#### Returns

`Promise`<[`TypedTransaction`](../README.md#typedtransaction)\>

the transaction specified by `txHash`

#### Defined in

[transactionFactory.ts:106](https://github.com/ethereumjs/ethereumjs-monorepo/blob/master/packages/tx/src/transactionFactory.ts#L106)

___

### fromSerializedData

▸ `Static` **fromSerializedData**(`data`, `txOptions?`): [`TypedTransaction`](../README.md#typedtransaction)

This method tries to decode serialized data.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `data` | `Buffer` | The data Buffer |
| `txOptions` | [`TxOptions`](../interfaces/TxOptions.md) | The transaction options |

#### Returns

[`TypedTransaction`](../README.md#typedtransaction)

#### Defined in

[transactionFactory.ts:54](https://github.com/ethereumjs/ethereumjs-monorepo/blob/master/packages/tx/src/transactionFactory.ts#L54)

___

### fromTxData

▸ `Static` **fromTxData**(`txData`, `txOptions?`): [`TypedTransaction`](../README.md#typedtransaction)

Create a transaction from a `txData` object

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `txData` | [`FeeMarketEIP1559TxData`](../interfaces/FeeMarketEIP1559TxData.md) \| [`AccessListEIP2930TxData`](../interfaces/AccessListEIP2930TxData.md) \| [`TxData`](../README.md#txdata) | The transaction data. The `type` field will determine which transaction type is returned (if undefined, creates a legacy transaction) |
| `txOptions` | [`TxOptions`](../interfaces/TxOptions.md) | Options to pass on to the constructor of the transaction |

#### Returns

[`TypedTransaction`](../README.md#typedtransaction)

#### Defined in

[transactionFactory.ts:27](https://github.com/ethereumjs/ethereumjs-monorepo/blob/master/packages/tx/src/transactionFactory.ts#L27)
