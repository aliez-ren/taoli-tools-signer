import { HDKey } from '@scure/bip32'
import { mnemonicToSeed } from '@scure/bip39'
import { mapKeys } from 'remeda'
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
  celo,
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
  opBNB,
  optimism,
  plasma,
  polygon,
  polygonZkEvm,
  scroll,
  sonic,
  unichain,
  worldchain,
  xLayer,
  zetachain,
  zksync,
  zora,
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

const allowlist: Record<Address, Set<number>> = mapKeys(
  {
    // https://web3.okx.com/build/dev-docs/dex-api/dex-smart-contract#dex-router
    '0xF6801D319497789f934ec7F83E142a9536312B08': new Set([ethereum.id]),
    '0x49E10cAee23d198CEE1E44b2a222232A85Df62Bb': new Set([sonic.id, metis.id]),
    '0xa081120347e57EB74DE8a9bE4a0441EbcB0A35F6': new Set([zksync.id]),
    '0xC44C6550a3B13116F6fD593e1ec963d5aE78C4C8': new Set([optimism.id]),
    '0x5e11D6A2184c321e69c6443DedB980F943DB7836': new Set([polygon.id, blast.id]),
    '0xd547Eafde2410e63300Fc5308CceA0b356E7b5d8': new Set([bsc.id]),
    '0x2e84246828ddae18500bc0cf23dd8a8d1aa5cf1f': new Set([avalanche.id]),
    '0x4f61d47f5942ad214a0fe93dae2e82f4cb871d81': new Set([fantom.id]),
    '0x3608c8186fF3dCa322DeEFb8c27162162d581081': new Set([arbitrum.id]),
    '0x5Eb082A0713481d29cDCd19B2Af5736007571472': new Set([linea.id]),
    '0x1e3143b9cB44170098092e53bfbCE76E1Ce53E00': new Set([confluxESpace.id, unichain.id]),
    '0x2bD541Ab3b704F7d4c9DFf79EfaDeaa85EC034f1': new Set([base.id]),
    '0x1f16A607a7f3F3044E477abFFc8BD33952cE306b': new Set([mantle.id]),
    '0x6702E6db3d5cc50E0040E7876A48faA5a4706148': new Set([scroll.id]),
    '0x1A2bD99016233a06dbE7D69a30316dB46b7c6511': new Set([manta.id, polygonZkEvm.id]),
    '0xAE571B4937b42587a4Ab3dcd434d62b09519c831': new Set([zetachain.id]),
    '0x0F315e89c1c8ad9E75fbe434082cF790d481ACC0': new Set([merlin.id]),
    '0xC259de94F6bedDec5Ed1C024b0283082ffa50cca': new Set([xLayer.id]),
    '0xB21A65a68A6abEed1A344AEB69AF146D64B06127': new Set([cronos.id]),
    '0x509c370da4dc569f45d48a2318a54c5442bc23cf': new Set([plasma.id]),

    // https://web3.okx.com/build/dev-docs/dex-api/dex-smart-contract#token-approval
    '0x40aA958dd87FC8305b97f2BA922CDdCa374bcD7f': new Set([ethereum.id, avalanche.id]),
    '0xcc96b656b6dff0B5318d53271b82B7E7183b95D2': new Set([sonic.id]),
    '0xc67879F4065d3B9fe1C09EE990B891Aa8E3a4c2f': new Set([zksync.id]),
    '0x68D6B739D2020067D1e2F713b999dA97E4d54812': new Set([optimism.id, confluxESpace.id]),
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
    '0x2e28281Cf3D58f475cebE27bec4B8a23dFC7782c': new Set([unichain.id]),
    '0x9FD43F5E4c24543b2eBC807321E58e6D350d6a5A': new Set([plasma.id]),

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

    // https://docs.uniswap.org/contracts/v2/reference/smart-contracts/v2-deployments
    '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D': new Set([ethereum.id]),
    '0x284f11109359a7e1306c3e447ef14d38400063ff': new Set([unichain.id]),
    '0x4752ba5dbc23f44d87826276bf6fd6b1c372ad24': new Set([
      arbitrum.id,
      avalanche.id,
      bsc.id,
      base.id,
    ]),
    '0x4A7b5Da61326A6379179b40d00F57E5bbDC962c2': new Set([optimism.id]),
    '0xedf6066a2b290C185783862C7F4776A2C8077AD1': new Set([polygon.id]),
    '0xBB66Eb1c5e875933D44DAe661dbD80e5D9B03035': new Set([blast.id]),
    '0xa00F34A632630EFd15223B1968358bA4845bEEC7': new Set([zora.id]),
    '0x541aB7c31A119441eF3575F6973277DE0eF460bd': new Set([worldchain.id]),

    // https://docs.uniswap.org/contracts/v3/reference/deployments/
    '0xbb00FF08d01D300023C629E8fFfFcb65A5a578cE': new Set([avalanche.id]),
    '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45': new Set([
      arbitrum.id,
      ethereum.id,
      optimism.id,
      polygon.id,
    ]),
    '0xB971eF87ede563556b2ED4b1C0b0019111Dd85d2': new Set([bsc.id]),
    '0x2626664c2603336E57B271c5C0b26F421741e481': new Set([base.id]),
    '0x99c56385daBCE3E81d8499d0b8d0257aBC07E8A3': new Set([zksync.id]),
    '0x73855d06DE49d0fe4A9c42636Ba96c62da12FF9C': new Set([unichain.id]),
    '0x549FEB8c9bd4c12Ad2AB27022dA12492aC452B66': new Set([blast.id]),
    '0x5615CDAb10dc425a742d643d949a7F474C01abc4': new Set([celo.id]),
    '0x091AD9e2e6e5eD44c1c66dB50e49A601F9f36cF6': new Set([worldchain.id]),
    '0x7De04c96BE5159c3b5CeffC82aa176dc81281557': new Set([zora.id]),

    // https://developer.pancakeswap.finance/contracts/v2/addresses
    '0x10ED43C718714eb63d5aA57B78B54704E256024E': new Set([bsc.id]),
    '0xEfF92A263d31888d860bD50809A8D171709b7b1c': new Set([ethereum.id]),
    '0x8cFe327CEc66d1C090Dd72bd0FF11d690C33a2Eb': new Set([
      polygonZkEvm.id,
      arbitrum.id,
      linea.id,
      base.id,
      opBNB.id,
    ]),
    '0x5aEaF2883FBf30f3D62471154eDa3C0c1b05942d': new Set([zksync.id]),

    // https://developer.pancakeswap.finance/contracts/v3/addresses
    '0x1b81D678ffb9C0263b24A97847620C99d213eB14': new Set([
      bsc.id,
      ethereum.id,
      polygonZkEvm.id,
      arbitrum.id,
      linea.id,
      base.id,
      opBNB.id,
    ]),
    '0xD70C70AD87aa8D45b8D59600342FB3AEe76E3c68': new Set([zksync.id]),

    // https://github.com/aerodrome-finance/contracts
    '0xcF77a3Ba9A5CA399B7c97c74d54e5b1Beb874E43': new Set([base.id]),
  },
  (key) => getAddress(key),
)
