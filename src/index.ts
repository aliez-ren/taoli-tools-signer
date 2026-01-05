import { Hono } from 'hono'
import { getRuntimeKey } from 'hono/adapter'
import { getConnInfo as getWorkerdConnInfo } from 'hono/cloudflare-workers'
import { cors } from 'hono/cors'
import memoize from 'memoize'
import { parse } from 'smol-toml'
import type { z } from 'zod/v4'
import { TTSError } from './error'
import { hmacSha256 } from './hmac'
import { EVM } from './platforms/evm'
import { SVM } from './platforms/svm'
import { keychainSchema, type keySchema, platformSchema } from './schema'

type Bindings = {
  KEYCHAIN: string
}

declare module 'hono' {
  interface ContextVariableMap {
    key: z.TypeOf<typeof keySchema>
    body: Uint8Array
  }
}

const runtimeKey = getRuntimeKey()

const app = new Hono<{ Bindings: Bindings }>()

app.use(
  '/*',
  cors({
    origin: ['http://localhost:5173', 'https://taoli.tools'],
    allowHeaders: ['X-SIG'],
    allowMethods: ['OPTIONS', 'GET', 'POST'],
  }),
)

app.use('/*', async (c, next) => {
  try {
    return await next()
  } catch (err) {
    return c.text(`TTS: ${err instanceof TTSError ? err.message : 'Server error'}`, 500)
  }
})

app.use('/:key/*', async (c, next) => {
  const keychain = await getKeyChain(c.env)
  const key = keychain[c.req.param('key')]
  if (!key) {
    return c.text('TTS: Key not found', 404)
  }

  const sig = c.req.header('X-SIG')
  if (!sig) {
    return c.text('TTS: No signature', 401)
  }

  const getConnInfo =
    runtimeKey === 'workerd'
      ? getWorkerdConnInfo
      : runtimeKey === 'bun'
        ? (await import('hono/bun')).getConnInfo
        : undefined
  const info = getConnInfo?.(c)
  const ips = typeof key.ip === 'string' ? [key.ip] : (key.ip ?? [])
  if (ips.length > 0 && (!info || !ips.find((ip) => ip === info.remote.address))) {
    return c.text('TTS: Restricted IP', 403)
  }

  const body = await c.req.arrayBuffer()
  if (sig !== Buffer.from(await hmacSha256(key.secret, body)).toString('base64')) {
    return c.text('TTS: Wrong signature', 403)
  }

  c.set('key', key)
  c.set('body', new Uint8Array(body))
  return await next()
})

app.get('/', async (c) => {
  const keychain = await getKeyChain(c.env)
  return c.text(`KEYCHAIN: ${Object.keys(keychain).length}`)
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
  const { signTransaction } = await { EVM, SVM }[platform](key.mnemonic, key.passphrase)
  const signedTransaction = await signTransaction(transaction)
  return c.body(new Uint8Array(signedTransaction))
})

const getKeyChain = memoize(
  async (env: Bindings) =>
    keychainSchema.parse(
      parse(
        runtimeKey === 'workerd'
          ? env.KEYCHAIN
          : runtimeKey === 'bun' && typeof Bun !== 'undefined'
            ? await Bun.file('/run/secrets/KEYCHAIN').text()
            : '',
      ),
    ),
  { cacheKey: JSON.stringify },
)

export default runtimeKey === 'bun' && typeof Bun !== 'undefined'
  ? {
      port: 443,
      fetch: app.fetch,
      tls: {
        cert: Bun.file('/run/secrets/CERT.pem'),
        key: Bun.file('/run/secrets/KEY.pem'),
      },
    }
  : app
