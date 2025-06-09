import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { parse } from 'smol-toml'
import { accountsSchema } from './schema'

type Bindings = {
  ACCOUNTS: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use(
  '/*',
  cors({
    origin: ['http://localhost:5173', 'https://taoli.tools'],
  }),
)

app.get('/', async (c) => {
  try {
    await accountsSchema.parseAsync(parse(c.env.ACCOUNTS))
    return c.text('OK')
  } catch {
    return c.text('ERR', 500)
  }
})

export default app
