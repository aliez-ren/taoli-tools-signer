import { Hono } from 'hono'
import { getRuntimeKey } from 'hono/adapter'
import { getConnInfo as getWorkerdConnInfo } from 'hono/cloudflare-workers'
import { cors } from 'hono/cors'
import { parse } from 'smol-toml'
import type { z } from 'zod/v4'
import { hmacSha256 } from './hmac'
import { EVM } from './platforms/evm'
import { SVM } from './platforms/svm'
import { type keySchema, keychainSchema, platformSchema } from './schema'

type Bindings = {
  KEYCHAIN: string
}

declare module 'hono' {
  interface ContextVariableMap {
    key: z.TypeOf<typeof keySchema>
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

app.use('/:key/*', async (c, next) => {
  const keychain = keychainSchema.parse(parse(c.env.KEYCHAIN))
  const key = keychain[c.req.param('key')]
  if (!key) {
    return c.text('Key not found', 404)
  }

  const sig = c.req.header('X-SIG')
  if (!sig) {
    return c.text('No signature', 401)
  }

  const runtimeKey = getRuntimeKey()
  const getConnInfo =
    runtimeKey === 'workerd'
      ? getWorkerdConnInfo
      : runtimeKey === 'bun'
        ? (await import('hono/bun')).getConnInfo
        : undefined
  const info = getConnInfo?.(c)
  const ips = typeof key.ip === 'string' ? [key.ip] : (key.ip ?? [])
  if (
    ips.length > 0 &&
    (!info || !ips.find((ip) => ip === info.remote.address))
  ) {
    return c.text('Restricted IP', 403)
  }

  const body = await c.req.arrayBuffer()
  if (
    sig !== Buffer.from(await hmacSha256(key.secret, body)).toString('base64')
  ) {
    return c.text('Wrong signature', 403)
  }

  c.set('key', key)
  c.set('body', new Uint8Array(body))
  return await next()
})

app.get('/', (c) => {
  const keychain = keychainSchema.parse(parse(c.env.KEYCHAIN))
  return c.text(`Keys: ${Object.keys(keychain)}`)
})

app.get('/:key/:platform', async (c) => {
  const key = c.get('key')
  const platform = platformSchema.parse(c.req.param('platform'))
  const { address } = await { EVM, SVM }[platform](key.mnemonic, key.passphrase)
  return c.text(address)
})

app.post('/:key/:platform', async (c) => {
  const key = c.get('key')
  const transaction = c.get('body')
  const platform = platformSchema.parse(c.req.param('platform'))
  const { signTransaction } = await { EVM, SVM }[platform](
    key.mnemonic,
    key.passphrase,
  )
  const signedTransaction = await signTransaction(transaction)
  return c.body(signedTransaction)
})

export default app
