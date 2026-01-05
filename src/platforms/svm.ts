import { mnemonicToSeed } from '@scure/bip39'
import {
  type Address,
  createKeyPairSignerFromPrivateKeyBytes,
  getCompiledTransactionMessageCodec,
  getTransactionCodec,
  signTransaction,
  type Transaction,
  type TransactionWithLifetime,
} from '@solana/kit'
import slip10 from 'micro-key-producer/slip10.js'
import { TTSError } from '../error'
import type { Platform } from '../type'

const transactionCodec = getTransactionCodec()

const compiledTransactionMessageCodec = getCompiledTransactionMessageCodec()

export const SVM: Platform<Address> = async (mnemonic, passphrase) => {
  const seed = await mnemonicToSeed(mnemonic, passphrase)
  const { privateKey } = slip10.fromMasterSeed(seed).derive(`m/44'/501'/0'/0'`)
  const { address, keyPair } = await createKeyPairSignerFromPrivateKeyBytes(privateKey)

  return {
    address,
    async signTransaction(transaction) {
      const tx = transactionCodec.decode(transaction) as Transaction & TransactionWithLifetime

      const { instructions, staticAccounts } = compiledTransactionMessageCodec.decode(
        tx.messageBytes,
      )
      for (const instruction of instructions) {
        const programId = staticAccounts[instruction.programAddressIndex]
        if (!programId || !allowlist.has(programId)) {
          throw new TTSError('Forbidden program')
        }
      }

      const signedTransaction = await signTransaction([keyPair], tx)
      return new Uint8Array(transactionCodec.encode(signedTransaction))
    },
  }
}

const allowlist = new Set([
  'ComputeBudget111111111111111111111111111111',
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',

  // https://web3.okx.com/zh-hans/build/dev-docs/dex-api/dex-smart-contract
  'proVF4pMXVaYqmy4NjniPh4pqKNfMmsihgd4wdkCX3u',

  // https://dev.jup.ag/docs/old/additional-topics/links-and-contract-addresses
  'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
  'jupoNjAxXgZ4rjzxzPMP4oxduvQsQtZzyknqvzYNrNu',
])
