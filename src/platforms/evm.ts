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
import type { Platform } from '../type'

export const EVM: Platform<Address> = async (mnemonic, passphrase) => {
  const seed = await mnemonicToSeed(mnemonic, passphrase)
  const account = hdKeyToAccount(HDKey.fromMasterSeed(seed))

  return {
    address: account.address,
    async signTransaction(transaction) {
      const tx = parseTransaction(toHex(transaction))

      if (!tx.data || !tx.to) {
        throw new Error('Invalid transaction')
      }

      if (tx.value && tx.value !== BigInt(0)) {
        throw new Error('Forbidden value')
      }

      const chainId = tx.chainId ?? ethereum.id
      if (!allowlist[getAddress(tx.to)]?.has(chainId)) {
        try {
          const data = decodeFunctionData({ abi: erc20Abi, data: tx.data })
          if (
            data.functionName !== 'approve' ||
            !allowlist[getAddress(data.args[0])]?.has(chainId)
          ) {
            throw new Error('Forbidden approval')
          }
        } catch {
          throw new Error('Forbidden to')
        }
      }

      const signedTransaction = await account.signTransaction(tx)
      return fromHex(signedTransaction, 'bytes')
    },
  }
}

const allowlist: Record<Address, Set<number>> = {
  // https://web3.okx.com/build/dev-docs/dex-api/dex-get-aggregator-supported-chains
  '0x40aA958dd87FC8305b97f2BA922CDdCa374bcD7f': new Set([
    avalanche.id,
    ethereum.id,
  ]),
  '0x3B86917369B83a6892f553609F3c2F439C184e31': new Set([polygon.id]),
  '0x70cBb871E8f30Fc8Ce23609E9E0Ea87B6b222F58': new Set([
    arbitrum.id,
    cronos.id,
    fantom.id,
    okc.id,
  ]),
  '0x2c34A2Fb1d0b4f55de51E1d0bDEfaDDce6b7cDD6': new Set([bsc.id]),
  '0x68D6B739D2020067D1e2F713b999dA97E4d54812': new Set([
    confluxESpace.id,
    optimism.id,
  ]),
  '0xc67879F4065d3B9fe1C09EE990B891Aa8E3a4c2f': new Set([zksync.id]),
  '0x57df6092665eb6058DE53939612413ff4B09114E': new Set([
    base.id,
    linea.id,
    manta.id,
    mantle.id,
    metis.id,
    polygonZkEvm.id,
    scroll.id,
  ]),
  '0x8b773D83bc66Be128c60e07E17C8901f7a64F000': new Set([merlin.id, xLayer.id]),
  '0x03B5ACdA01207824cc7Bc21783Ee5aa2B8d1D2fE': new Set([zetachain.id]),
  '0x5fD2Dc91FF1dE7FF4AEB1CACeF8E9911bAAECa68': new Set([blast.id]),
  '0xd321ab5589d3e8fa5df985ccfef625022e2dd910': new Set([sonic.id]),
  '0xbd0EBE49779E154E5042B34D5BcfBc498e4B3249': new Set([mode.id]),
  '0x801D8ED849039007a7170830623180396492c7ED': new Set([sei.id]),
  '0x2e28281Cf3D58f475cebE27bec4B8a23dFC7782c': new Set([unichain.id]),

  // https://web3.okx.com/zh-hans/build/dev-docs/dex-api/dex-smart-contract
  '0x6088d94C5a40CEcd3ae2D4e0710cA687b91c61d0': new Set([
    ethereum.id,
    arbitrum.id,
  ]),
  '0x9b9efa5Efa731EA9Bbb0369E91fA17Abf249CFD4': new Set([
    avalanche.id,
    base.id,
    bsc.id,
    manta.id,
    mode.id,
    optimism.id,
    polygon.id,
    scroll.id,
    sonic.id,
    zetachain.id,
  ]),
  '0x5058C498864795689fe41fB54f29a8B71F0A7201': new Set([zksync.id]),
  '0xd30D8CA2E7715eE6804a287eB86FAfC0839b1380': new Set([
    okc.id,
    fantom.id,
    mantle.id,
    blast.id,
    polygonZkEvm.id,
    merlin.id,
    xLayer.id,
    mode.id,
    sei.id,
  ]),
  '0x06f183D52D92c13a5f2B989B8710BA7F00bd6f87': new Set([linea.id, metis.id]),
  '0x8feB9E84b7E9DC86adc6cD6Eb554C5B4355c8405': new Set([confluxESpace.id]),
  '0xA3d7C702e6Fa835504B4a9649F422d1DdC6995E3': new Set([unichain.id]),
  '0xbC92122fDa4061FF3f6C068d2cc7e6c0bd81bA00': new Set([ethereum.id]),
  '0xD59d6b26C2593ED0D56bA6170a449dF1e394B65A': new Set([base.id]),
  '0x76D43a252300955E6bd17A6992201fc02f0E5C10': new Set([bsc.id]),
  '0x0b59f6798c467136819f2B276fa03032cC0A4653': new Set([arbitrum.id]),

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
