import { mnemonicToSeed } from '@scure/bip39'
import { createKeyPairSignerFromPrivateKeyBytes } from '@solana/kit'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import slip10 from 'micro-key-producer/slip10.js'
import { parse } from 'smol-toml'
import { toHex } from 'viem'
import { privateKeyToAddress } from 'viem/accounts'
import type { z } from 'zod/v4'
import { hmacSha256 } from './hmac'
import { type accountSchema, accountsSchema, platformSchame } from './schema'

type Bindings = {
  ACCOUNTS: string
}

declare module 'hono' {
  interface ContextVariableMap {
    account: z.TypeOf<typeof accountSchema>
  }
}

const app = new Hono<{ Bindings: Bindings }>()

app.use(
  '/*',
  cors({
    origin: ['http://localhost:5173', 'https://taoli.tools'],
  }),
)

app.use('/*', async (c, next) => {
  try {
    return await next()
  } catch {
    return c.text('Server error', 500)
  }
})

app.use('/:account/*', async (c, next) => {
  const accounts = accountsSchema.parse(parse(c.env.ACCOUNTS))
  const account = accounts[c.req.param('account')]
  if (!account) {
    return c.text('Account not found', 404)
  }

  const sig = c.req.header('X-SIG')
  if (!sig) {
    return c.text('No signature', 401)
  }

  const body = await c.req.arrayBuffer()
  if (
    sig !==
    Buffer.from(await hmacSha256(account.secret, body)).toString('base64')
  ) {
    return c.text('Wrong signature', 403)
  }

  c.set('account', account)
  return await next()
})

app.get('/', (c) => {
  const accounts = accountsSchema.parse(parse(c.env.ACCOUNTS))
  return c.text(`Accounts: ${Object.keys(accounts)}`)
})

app.get('/:account/:platform', async (c) => {
  const account = c.get('account')
  const platform = platformSchame.parse(c.req.param('platform'))
  const seed = await mnemonicToSeed(account.mnemonic, account.passphrase)
  if (platform === 'evm') {
    const privateKey = toHex(
      slip10.fromMasterSeed(seed).derive(`m/44'/60'/0'/0'`).privateKey,
    )
    const address = privateKeyToAddress(privateKey)
    return c.text(address)
  }
  if (platform === 'svm') {
    const { privateKey } = slip10
      .fromMasterSeed(seed)
      .derive(`m/44'/501'/0'/0'`)
    const keyPair = await createKeyPairSignerFromPrivateKeyBytes(privateKey)
    return c.text(keyPair.address)
  }
  return c.text('Wrong platform', 400)
})

app.post('/:account/:platform', (c) => {
  const account = c.get('account')
  const platform = platformSchame.parse(c.req.param('platform'))
  return c.text('OK')
})

export default app
