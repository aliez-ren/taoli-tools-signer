import { HDKey } from '@scure/bip32'
import { mnemonicToSeed } from '@scure/bip39'
import {
  type Address,
  decodeFunctionData,
  erc20Abi,
  fromHex,
  getAddress,
  parseTransaction,
  toHex,
} from 'viem'
import { hdKeyToAccount } from 'viem/accounts'
import {
  arbitrum,
  aurora,
  avalanche,
  base,
  blast,
  bsc,
  confluxESpace,
  cronos,
  mainnet as ethereum,
  fantom,
  fraxtal,
  gnosis,
  kaia,
  linea,
  manta,
  mantle,
  merlin,
  metis,
  mode,
  okc,
  optimism,
  polygon,
  polygonZkEvm,
  scroll,
  sei,
  sonic,
  unichain,
  xLayer,
  zetachain,
  zksync,
} from 'viem/chains'
import { TTSError } from '../error'
import type { Platform } from '../type'

export const EVM: Platform<Address> = async (mnemonic, passphrase) => {
  const seed = await mnemonicToSeed(mnemonic, passphrase)
  const account = hdKeyToAccount(HDKey.fromMasterSeed(seed))

  return {
    address: account.address,
    async signTransaction(transaction) {
      const tx = parseTransaction(toHex(transaction))

      if (!tx.data || !tx.to) {
        throw new TTSError('Invalid transaction')
      }

      if (tx.value && tx.value !== BigInt(0)) {
        throw new TTSError('Forbidden value')
      }

      const chainId = tx.chainId ?? ethereum.id
      if (!allowlist[getAddress(tx.to)]?.has(chainId)) {
        try {
          const data = decodeFunctionData({ abi: erc20Abi, data: tx.data })
          if (
            data.functionName !== 'approve' ||
            !allowlist[getAddress(data.args[0])]?.has(chainId)
          ) {
            throw new TTSError('Forbidden approval')
          }
        } catch {
          throw new TTSError('Forbidden to')
        }
      }

      const signedTransaction = await account.signTransaction(tx)
      return fromHex(signedTransaction, 'bytes')
    },
  }
}

const allowlist: Record<Address, Set<number>> = {
  // https://web3.okx.com/build/dev-docs/dex-api/dex-smart-contract#dex-router
  '0xDd5E9B947c99Aa60bab00ca4631Dce63b49983E7': new Set([ethereum.id]),
  '0x8feB9E84b7E9DC86adc6cD6Eb554C5B4355c8405': new Set([sonic.id, mode.id]),
  '0x108bfC6aa49718a1f9669FC0Ccd1a21d0D30c8E0': new Set([zksync.id]),
  '0x06f183D52D92c13a5f2B989B8710BA7F00bd6f87': new Set([
    optimism.id,
    scroll.id,
  ]),
  '0x6733Eb2E75B1625F1Fe5f18aD2cB2BaBDA510d19': new Set([
    polygon.id,
    okc.id,
    avalanche.id,
    mantle.id,
    blast.id,
    merlin.id,
    xLayer.id,
    sei.id,
  ]),
  '0xA2604105e84DAe6eccEa41E61123AB8d9B3AfD75': new Set([bsc.id]),
  '0x79f7C6C6dc16Ed3154E85A8ef9c1Ef31CEFaEB19': new Set([fantom.id, cronos.id]),
  '0x69C236E021F5775B0D0328ded5EaC708E3B869DF': new Set([
    arbitrum.id,
    confluxESpace.id,
    base.id,
    polygonZkEvm.id,
  ]),
  '0xcF76984119C7f6ae56fAfE680d39C08278b7eCF4': new Set([linea.id]),
  '0x7A7AD9aa93cd0A2D0255326E5Fb145CEc14997FF': new Set([
    manta.id,
    zetachain.id,
  ]),
  '0xC589a4eD6A9fc3354d7eeF88bA87b51AFC272783': new Set([metis.id]),
  '0x9FD43F5E4c24543b2eBC807321E58e6D350d6a5A': new Set([unichain.id]),

  // https://web3.okx.com/build/dev-docs/dex-api/dex-smart-contract#token-approval
  '0x40aA958dd87FC8305b97f2BA922CDdCa374bcD7f': new Set([
    ethereum.id,
    avalanche.id,
  ]),
  '0xd321ab5589d3e8fa5df985ccfef625022e2dd910': new Set([sonic.id]),
  '0xc67879F4065d3B9fe1C09EE990B891Aa8E3a4c2f': new Set([zksync.id]),
  '0x68D6B739D2020067D1e2F713b999dA97E4d54812': new Set([
    optimism.id,
    confluxESpace.id,
  ]),
  '0x3B86917369B83a6892f553609F3c2F439C184e31': new Set([polygon.id]),
  '0x2c34A2Fb1d0b4f55de51E1d0bDEfaDDce6b7cDD6': new Set([bsc.id]),
  '0x70cBb871E8f30Fc8Ce23609E9E0Ea87B6b222F58': new Set([
    okc.id,
    fantom.id,
    arbitrum.id,
    cronos.id,
  ]),
  '0x57df6092665eb6058DE53939612413ff4B09114E': new Set([
    linea.id,
    base.id,
    mantle.id,
    scroll.id,
    manta.id,
    metis.id,
    polygonZkEvm.id,
  ]),
  '0x5fD2Dc91FF1dE7FF4AEB1CACeF8E9911bAAECa68': new Set([blast.id]),
  '0x03B5ACdA01207824cc7Bc21783Ee5aa2B8d1D2fE': new Set([zetachain.id]),
  '0x8b773D83bc66Be128c60e07E17C8901f7a64F000': new Set([merlin.id, xLayer.id]),
  '0xbd0EBE49779E154E5042B34D5BcfBc498e4B3249': new Set([mode.id]),
  '0x801D8ED849039007a7170830623180396492c7ED': new Set([sei.id]),
  '0x2e28281Cf3D58f475cebE27bec4B8a23dFC7782c': new Set([unichain.id]),

  // https://portal.1inch.dev/documentation/contracts/aggregation-protocol/aggregation-introduction
  '0x111111125421cA6dc452d289314280a0f8842A65': new Set([
    arbitrum.id,
    aurora.id,
    avalanche.id,
    bsc.id,
    base.id,
    ethereum.id,
    fantom.id,
    gnosis.id,
    kaia.id,
    linea.id,
    optimism.id,
    polygon.id,
  ]),
  '0x6fd4383cB451173D5f9304F041C7BCBf27d561fF': new Set([zksync.id]),

  // https://docs.odos.xyz/build/contracts
  '0xCf5540fFFCdC3d510B18bFcA6d2b9987b0772559': new Set([ethereum.id]),
  '0xCa423977156BB05b13A2BA3b76Bc5419E2fE9680': new Set([optimism.id]),
  '0x89b8AA89FDd0507a99d334CBe3C808fAFC7d850E': new Set([bsc.id]),
  '0x4E3288c9ca110bCC82bf38F09A7b425c095d92Bf': new Set([polygon.id]),
  '0xaC041Df48dF9791B0654f1Dbbf2CC8450C5f2e9D': new Set([sonic.id]),
  '0xD0c22A5435F4E8E5770C1fAFb5374015FC12F7cD': new Set([fantom.id]),
  '0x56c85a254DD12eE8D9C04049a4ab62769Ce98210': new Set([fraxtal.id]),
  '0x4bBa932E9792A2b917D47830C93a9BC79320E4f7': new Set([zksync.id]),
  '0xD9F4e85489aDCD0bAF0Cd63b4231c6af58c26745': new Set([mantle.id]),
  '0x19cEeAd7105607Cd444F5ad10dd51356436095a1': new Set([base.id]),
  '0x7E15EB462cdc67Cf92Af1f7102465a8F8c784874': new Set([mode.id]),
  '0xa669e7A0d4b3e4Fa48af2dE86BD4CD7126Be4e13': new Set([arbitrum.id]),
  '0x88de50B233052e4Fb783d4F6db78Cc34fEa3e9FC': new Set([avalanche.id]),
  '0x2d8879046f1559E53eb052E949e9544bCB72f414': new Set([linea.id]),
  '0xbFe03C9E20a9Fc0b37de01A172F207004935E0b1': new Set([scroll.id]),
}
