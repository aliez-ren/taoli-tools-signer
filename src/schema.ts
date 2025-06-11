import { z } from 'zod/v4'

export const keySchema = z.object({
  secret: z.string(),
  mnemonic: z.string(),
  passphrase: z.string().optional(),
})

export const keychainSchema = z.record(z.string(), keySchema)

export const platformSchame = z.enum(['EVM', 'SVM'])
