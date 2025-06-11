import { mnemonicToSeed } from '@scure/bip39'
import {
  type Address,
  createKeyPairSignerFromPrivateKeyBytes,
  getTransactionCodec,
  signTransaction,
} from '@solana/kit'
import slip10 from 'micro-key-producer/slip10.js'
import type { Platform } from '../type'

const transactionCodec = getTransactionCodec()

export const SVM: Platform<Address> = async (mnemonic, passphrase) => {
  const seed = await mnemonicToSeed(mnemonic, passphrase)
  const { privateKey } = slip10.fromMasterSeed(seed).derive(`m/44'/501'/0'/0'`)
  const { address, keyPair } =
    await createKeyPairSignerFromPrivateKeyBytes(privateKey)

  return {
    address,
    async signTransaction(transaction) {
      const tx = await signTransaction(
        [keyPair],
        transactionCodec.decode(transaction),
      )
      return new Uint8Array(transactionCodec.encode(tx))
    },
  }
}
