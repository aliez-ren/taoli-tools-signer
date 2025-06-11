export type Platform<A> = (
  mnemonic: string,
  passphrase?: string,
) => Promise<{
  address: A
  signTransaction(transaction: Uint8Array): Promise<Uint8Array>
}>
