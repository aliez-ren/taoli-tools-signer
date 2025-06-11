import { HDKey } from '@scure/bip32'
import { mnemonicToSeed } from '@scure/bip39'
import { type Address, fromHex, parseTransaction, toHex } from 'viem'
import { hdKeyToAccount } from 'viem/accounts'
import type { Platform } from '../type'

export const EVM: Platform<Address> = async (mnemonic, passphrase) => {
  const seed = await mnemonicToSeed(mnemonic, passphrase)
  const account = hdKeyToAccount(HDKey.fromMasterSeed(seed))

  return {
    address: account.address,
    async signTransaction(transaction) {
      const tx = parseTransaction(toHex(transaction))
      const signedTransaction = await account.signTransaction(tx)
      return fromHex(signedTransaction, 'bytes')
    },
  }
}
