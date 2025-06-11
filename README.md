# Taoli Tools Signer

Turn your mnemonic phrases into API server for DEX trading.
Supports multiple EVM chains and Solana.

## Features
- Self-hosted
- Multiple wallets
- Secure storage
- IP restriction
- Contract allowlist

## Supported DEXs
- [1inch](https://app.1inch.io/)
- [Jupiter](https://jup.ag/)
- [Odos](https://app.odos.xyz/)
- [OKX DEX](https://web3.okx.com/dex-swap)

## Deployment

### The Keychain file

```toml
[your-api-key] # API Key
secret = "your api secret" # API Secret
mnemonic = "" # Your mnemonic phrases
ip = ["1.2.3.4"] # IP restriction (optional)
```

Example file: [example.keychain.toml](example.keychain.toml)

### Deploy to Cloudflare Workers

1. Click [![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https%3A%2F%2Fgithub.com%2Faliez-ren%2Ftaoli-tools-signer)

2. Add secret `KEYCHAIN` to Worker: https://developers.cloudflare.com/workers/configuration/secrets/#via-the-dashboard

### Deploy to Docker Container
1. Initialize swarm service. Swarm is required by docker secret. see: https://docs.docker.com/engine/swarm/secrets/
   ```bash
   docker swarm init
   ```

2. Prepare the `keychain.toml` file and store it into docker secret.
   ```bash
   cat keychain.toml | docker secret create KEYCHAIN -
   ```

3. Delete the keychain file for security. WARNING: backup mnemonic before deletion.
   ```bash
   rm keychain.toml 
   ```

4. Pull docker image and run.
   ```bash
   docker pull ghcr.io/aliez-ren/taoli-tools-signer:latest \
     && docker service rm taoli-tools-signer \
     && docker service create --name=taoli-tools-signer --secret=KEYCHAIN -p=3000:3000 ghcr.io/aliez-ren/taoli-tools-signer:latest \
     && docker service logs -f taoli-tools-signer
   ```
