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

## The Keychain file

```toml
[your-api-key] # API Key
secret = "your api secret" # API Secret (at least 32 characters)
mnemonic = "" # Your mnemonic phrases
ip = ["1.2.3.4"] # IP restriction (optional)
```

Example file: [example.keychain.toml](example.keychain.toml).
⚠️WARNING: DO NOT use the mnemonic in the example file or your assets may lose.

The minium length of secret is 32 characters. So the example is illegal in production.

## Deployment

Two deployment methods, choose one on your own.

### Deploy to Cloudflare Workers

1. Click [![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https%3A%2F%2Fgithub.com%2Faliez-ren%2Ftaoli-tools-signer)

2. Add secret `KEYCHAIN` to Worker: https://developers.cloudflare.com/workers/configuration/secrets/#via-the-dashboard
  <img width="1462" alt="image" src="https://github.com/user-attachments/assets/27b83187-0398-4af5-84cf-d65c8e0569f0" />

3. Copy your `workers.dev` domain.
  <img width="1188" alt="image" src="https://github.com/user-attachments/assets/ee1329ea-c975-4513-8e4e-67a4abd89c64" />

4. In this case, `Signer URL` is `https://taoli-tools-signer.example.workers.dev/simple-name` and `Signer Secret` is `your api secret`.

### Deploy to Docker Container
1. Initialize docker swarm. Swarm is required by docker secret. see: https://docs.docker.com/engine/swarm/secrets/
   ```bash
   docker swarm init
   ```

2. Prepare `keychain.toml` and store it into docker secret.
   ```bash
   cat keychain.toml | docker secret create KEYCHAIN -
   ```

3. Delete `keychain.toml` for security.
   ⚠️WARNING: backup before deletion.
   ```bash
   rm keychain.toml 
   ```

4. Generate self-signed TLS certificate and store it into docker secret.
   ```bash
   openssl req -new -newkey rsa:4096 -x509 -sha256 -days 365 -nodes -subj /CN=localhost -addext 'subjectAltName=DNS:localhost,IP:127.0.0.1' -out CERT.pem -keyout KEY.pem
   cat CERT.pem | docker secret create CERT.pem -
   cat KEY.pem | docker secret create KEY.pem -
   ```

5. Delete `KEY.pem` for security.
   ⚠️WARNING: backup before deletion.
   ```bash
   rm KEY.pem
   ```

6. Trust `CERT.pem` in your browser. chrome://certificate-manager/localcerts/usercerts

7. Create internal network
   ```bash
   docker network create --driver overlay --internal nonet
   ```

8. Pull docker image and run.
   ```bash
   docker pull ghcr.io/aliez-ren/taoli-tools-signer:latest
   docker service rm taoli-tools-signer
   docker service create --name=taoli-tools-signer --secret=KEYCHAIN --secret=CERT.pem --secret=KEY.pem -p=443:443 --network nonet ghcr.io/aliez-ren/taoli-tools-signer:latest
   docker service logs -f taoli-tools-signer
   ```

9. In this case, `Signer URL` is `https://localhost/your-api-key` and `Signer Secret` is `your api secret`.

## Work with Taoli Tools

See [Taoli Tools Document](https://renzholy.notion.site/Taoli-Tools-Signer-20f64b000c2580eda7f2f6fbb357da94)
