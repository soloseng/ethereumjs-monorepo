[@ethereumjs/statemanager](../README.md) / BaseStateManager

# Class: BaseStateManager

Abstract BaseStateManager class for the non-storage-backend
related functionality parts of a StateManager like keeping
track of accessed storage (`EIP-2929`) or touched accounts
(`EIP-158`).

This is not a full StateManager implementation in itself but
can be used to ease implementing an own StateManager.

Note that the implementation is pretty new (October 2021)
and we cannot guarantee a stable interface yet.

## Hierarchy

- **`BaseStateManager`**

  ↳ [`EthersStateManager`](EthersStateManager.md)

  ↳ [`DefaultStateManager`](DefaultStateManager.md)

## Table of contents

### Constructors

- [constructor](BaseStateManager.md#constructor)

### Properties

- [\_cache](BaseStateManager.md#_cache)
- [\_debug](BaseStateManager.md#_debug)

### Methods

- [accountIsEmpty](BaseStateManager.md#accountisempty)
- [checkpoint](BaseStateManager.md#checkpoint)
- [commit](BaseStateManager.md#commit)
- [deleteAccount](BaseStateManager.md#deleteaccount)
- [flush](BaseStateManager.md#flush)
- [getAccount](BaseStateManager.md#getaccount)
- [getContractStorage](BaseStateManager.md#getcontractstorage)
- [modifyAccountFields](BaseStateManager.md#modifyaccountfields)
- [putAccount](BaseStateManager.md#putaccount)
- [putContractCode](BaseStateManager.md#putcontractcode)
- [putContractStorage](BaseStateManager.md#putcontractstorage)
- [revert](BaseStateManager.md#revert)

## Constructors

### constructor

• **new BaseStateManager**(`_opts`)

Needs to be called from the subclass constructor

#### Parameters

| Name | Type |
| :------ | :------ |
| `_opts` | `DefaultStateManagerOpts` |

#### Defined in

[baseStateManager.ts:38](https://github.com/ethereumjs/ethereumjs-monorepo/blob/master/packages/statemanager/src/baseStateManager.ts#L38)

## Properties

### \_cache

• **\_cache**: `Cache`

#### Defined in

[baseStateManager.ts:23](https://github.com/ethereumjs/ethereumjs-monorepo/blob/master/packages/statemanager/src/baseStateManager.ts#L23)

___

### \_debug

• **\_debug**: `Debugger`

#### Defined in

[baseStateManager.ts:22](https://github.com/ethereumjs/ethereumjs-monorepo/blob/master/packages/statemanager/src/baseStateManager.ts#L22)

## Methods

### accountIsEmpty

▸ **accountIsEmpty**(`address`): `Promise`<`boolean`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `Address` |

#### Returns

`Promise`<`boolean`\>

#### Defined in

[baseStateManager.ts:97](https://github.com/ethereumjs/ethereumjs-monorepo/blob/master/packages/statemanager/src/baseStateManager.ts#L97)

___

### checkpoint

▸ **checkpoint**(): `Promise`<`void`\>

Checkpoints the current state of the StateManager instance.
State changes that follow can then be committed by calling
`commit` or `reverted` by calling rollback.

Partial implementation, called from the subclass.

#### Returns

`Promise`<`void`\>

#### Defined in

[baseStateManager.ts:113](https://github.com/ethereumjs/ethereumjs-monorepo/blob/master/packages/statemanager/src/baseStateManager.ts#L113)

___

### commit

▸ **commit**(): `Promise`<`void`\>

Commits the current change-set to the instance since the
last call to checkpoint.

Partial implementation, called from the subclass.

#### Returns

`Promise`<`void`\>

#### Defined in

[baseStateManager.ts:123](https://github.com/ethereumjs/ethereumjs-monorepo/blob/master/packages/statemanager/src/baseStateManager.ts#L123)

___

### deleteAccount

▸ **deleteAccount**(`address`): `Promise`<`void`\>

Deletes an account from state under the provided `address`. The account will also be removed from the state trie.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `address` | `Address` | Address of the account which should be deleted |

#### Returns

`Promise`<`void`\>

#### Defined in

[baseStateManager.ts:90](https://github.com/ethereumjs/ethereumjs-monorepo/blob/master/packages/statemanager/src/baseStateManager.ts#L90)

___

### flush

▸ **flush**(): `Promise`<`void`\>

#### Returns

`Promise`<`void`\>

#### Defined in

[baseStateManager.ts:139](https://github.com/ethereumjs/ethereumjs-monorepo/blob/master/packages/statemanager/src/baseStateManager.ts#L139)

___

### getAccount

▸ **getAccount**(`address`): `Promise`<`Account`\>

Gets the account associated with `address`. Returns an empty account if the account does not exist.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `address` | `Address` | Address of the `account` to get |

#### Returns

`Promise`<`Account`\>

#### Defined in

[baseStateManager.ts:49](https://github.com/ethereumjs/ethereumjs-monorepo/blob/master/packages/statemanager/src/baseStateManager.ts#L49)

___

### getContractStorage

▸ `Abstract` **getContractStorage**(`address`, `key`): `Promise`<`Buffer`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `Address` |
| `key` | `Buffer` |

#### Returns

`Promise`<`Buffer`\>

#### Defined in

[baseStateManager.ts:103](https://github.com/ethereumjs/ethereumjs-monorepo/blob/master/packages/statemanager/src/baseStateManager.ts#L103)

___

### modifyAccountFields

▸ **modifyAccountFields**(`address`, `accountFields`): `Promise`<`void`\>

Gets the account associated with `address`, modifies the given account
fields, then saves the account into state. Account fields can include
`nonce`, `balance`, `storageRoot`, and `codeHash`.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `address` | `Address` | Address of the account to modify |
| `accountFields` | `Partial`<`Pick`<`Account`, ``"nonce"`` \| ``"balance"`` \| ``"storageRoot"`` \| ``"codeHash"``\>\> | Object containing account fields and values to modify |

#### Returns

`Promise`<`void`\>

#### Defined in

[baseStateManager.ts:77](https://github.com/ethereumjs/ethereumjs-monorepo/blob/master/packages/statemanager/src/baseStateManager.ts#L77)

___

### putAccount

▸ **putAccount**(`address`, `account`): `Promise`<`void`\>

Saves an account into state under the provided `address`.

#### Parameters

| Name | Type | Description |
| :------ | :------ | :------ |
| `address` | `Address` | Address under which to store `account` |
| `account` | `Account` | The account to store |

#### Returns

`Promise`<`void`\>

#### Defined in

[baseStateManager.ts:59](https://github.com/ethereumjs/ethereumjs-monorepo/blob/master/packages/statemanager/src/baseStateManager.ts#L59)

___

### putContractCode

▸ `Abstract` **putContractCode**(`address`, `value`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `Address` |
| `value` | `Buffer` |

#### Returns

`Promise`<`void`\>

#### Defined in

[baseStateManager.ts:102](https://github.com/ethereumjs/ethereumjs-monorepo/blob/master/packages/statemanager/src/baseStateManager.ts#L102)

___

### putContractStorage

▸ `Abstract` **putContractStorage**(`address`, `key`, `value`): `Promise`<`void`\>

#### Parameters

| Name | Type |
| :------ | :------ |
| `address` | `Address` |
| `key` | `Buffer` |
| `value` | `Buffer` |

#### Returns

`Promise`<`void`\>

#### Defined in

[baseStateManager.ts:104](https://github.com/ethereumjs/ethereumjs-monorepo/blob/master/packages/statemanager/src/baseStateManager.ts#L104)

___

### revert

▸ **revert**(): `Promise`<`void`\>

Reverts the current change-set to the instance since the
last call to checkpoint.

Partial implementation , called from the subclass.

#### Returns

`Promise`<`void`\>

#### Defined in

[baseStateManager.ts:134](https://github.com/ethereumjs/ethereumjs-monorepo/blob/master/packages/statemanager/src/baseStateManager.ts#L134)
