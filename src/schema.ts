import { z } from 'zod/v4'

export const accountSchema = z.object({
  secret: z.string(),
  mnemonic: z.string(),
  passphrase: z.string().optional(),
})

export const accountsSchema = z.record(z.string(), accountSchema)

export const platformSchame = z.enum(['EVM', 'SVM'])
