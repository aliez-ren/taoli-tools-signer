import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { parse } from 'smol-toml'
import type { z } from 'zod/v4'
import { hmacSha256 } from './hmac'
import { EVM } from './platforms/evm'
import { SVM } from './platforms/svm'
import { type accountSchema, accountsSchema, platformSchame } from './schema'

type Bindings = {
  ACCOUNTS: string
}

declare module 'hono' {
  interface ContextVariableMap {
    account: z.TypeOf<typeof accountSchema>
    body: Uint8Array
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
  c.set('body', new Uint8Array(body))
  return await next()
})

app.get('/', (c) => {
  const accounts = accountsSchema.parse(parse(c.env.ACCOUNTS))
  return c.text(`Accounts: ${Object.keys(accounts)}`)
})

app.get('/:account/:platform', async (c) => {
  const account = c.get('account')
  const platform = platformSchame.parse(c.req.param('platform'))
  const { address } = await { EVM, SVM }[platform](
    account.mnemonic,
    account.passphrase,
  )
  return c.text(address)
})

app.post('/:account/:platform', async (c) => {
  const account = c.get('account')
  const transaction = c.get('body')
  const platform = platformSchame.parse(c.req.param('platform'))
  const { signTransaction } = await { EVM, SVM }[platform](
    account.mnemonic,
    account.passphrase,
  )
  const signedTransaction = await signTransaction(transaction)
  return c.body(signedTransaction)
})

export default app
