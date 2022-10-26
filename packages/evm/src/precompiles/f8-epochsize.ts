// import BN from 'bn.js'
import { PrecompileInput } from './types'
import { OOGResult, ExecResult } from '../evm'
import { bigIntToBuffer, setLengthLeft } from '@ethereumjs/util'

export default function (opts: PrecompileInput): ExecResult {
  const gasUsed = BigInt(1000)
  if (opts.gasLimit < gasUsed) {
    return OOGResult(opts.gasLimit)
  }

  // const sizeBuf = new BN(100).toArrayLike(Buffer, 'be', 32)
  const sizeBuf = bigIntToBuffer(BigInt(100))
  return {
    returnValue: setLengthLeft(sizeBuf, 32),
    executionGasUsed: gasUsed,
  }
}
