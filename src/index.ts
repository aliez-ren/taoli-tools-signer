import { mnemonicToSeed } from '@scure/bip39'
import {
  createKeyPairSignerFromPrivateKeyBytes,
  getBase58Encoder,
} from '@solana/kit'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import slip10 from 'micro-key-producer/slip10.js'
import { parse } from 'smol-toml'
import { fromHex, toHex } from 'viem'
import { privateKeyToAddress } from 'viem/accounts'
import { accountsSchema, platformSchame } from './schema'

type Bindings = {
  ACCOUNTS: string
}

const base58Encoder = getBase58Encoder()

const app = new Hono<{ Bindings: Bindings }>()

app.use(
  '/*',
  cors({
    origin: ['http://localhost:5173', 'https://taoli.tools'],
  }),
)

app.get('/', (c) => {
  try {
    accountsSchema.parse(parse(c.env.ACCOUNTS))
    return c.text('OK')
  } catch {
    return c.text('ERR', 500)
  }
})

app.get('/:name/:platform', async (c) => {
  try {
    const accounts = accountsSchema.parse(parse(c.env.ACCOUNTS))
    const platform = platformSchame.parse(c.req.param('platform'))
    const account = accounts[c.req.param('name')]
    if (!account) {
      return c.text('Account not found', 404)
    }
    const seed = await mnemonicToSeed(account.mnemonic, account.passphrase)
    if (platform === 'evm') {
      const privateKey = toHex(
        slip10.fromMasterSeed(seed).derive(`m/44'/60'/0'/0'`).privateKey,
      )
      const account = privateKeyToAddress(privateKey)
      return c.body(fromHex(account, 'bytes'))
    }
    if (platform === 'svm') {
      const privateKey = slip10
        .fromMasterSeed(seed)
        .derive(`m/44'/501'/0'/0'`).privateKey
      const keyPair = await createKeyPairSignerFromPrivateKeyBytes(privateKey)
      return c.body(new Uint8Array(base58Encoder.encode(keyPair.address)))
    }
    return c.text('OK')
  } catch {
    return c.text('ERR', 500)
  }
})

app.post('/:name/:platform', (c) => {
  try {
    const accounts = accountsSchema.parse(parse(c.env.ACCOUNTS))
    const platform = platformSchame.parse(c.req.param('platform'))
    const account = accounts[c.req.param('name')]

    return c.text('OK')
  } catch {
    return c.text('ERR', 500)
  }
})

export default app
