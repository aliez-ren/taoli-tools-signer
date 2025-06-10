const encoder = new TextEncoder()

export async function hmacSha256(
  secret: string,
  body: ArrayBuffer,
): Promise<ArrayBuffer> {
  const keyData = encoder.encode(secret)
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: { name: 'SHA-256' } },
    false,
    ['sign'],
  )
  return crypto.subtle.sign('HMAC', key, body)
}
