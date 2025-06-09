import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { parse } from 'smol-toml'

type Bindings = {
  AUTH: string
  ACCOUNTS: string
  TOKENS: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use(
  '/*',
  cors({
    origin: ['http://localhost:5173', 'https://taoli.tools'],
  }),
)

app.get('/', (c) => {
  const accounts = parse(c.env.ACCOUNTS)
  console.log(accounts)
  return c.text('OK')
})

export default app
