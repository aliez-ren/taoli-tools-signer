import { z } from 'zod/v4'

export const keySchema = z.object({
  secret: z.string(),
  ip: z.array(z.string()).or(z.string()).optional(),
  mnemonic: z.string(),
  passphrase: z.string().optional(),
})

export const keychainSchema = z.record(z.string(), keySchema)

export const platformSchema = z.enum(['EVM', 'SVM'])
