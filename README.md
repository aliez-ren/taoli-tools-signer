# Taoli Tools Signer

## Features
- Self-hosted
- Multiple wallets
- Secret protection
- IP restriction
- Contract Allowlist

## Configuration
see [example.keychain.toml](example.keychain.toml)

## Deploy to Cloudflare Workers

1. Click [![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https%3A%2F%2Fgithub.com%2Faliez-ren%2Ftaoli-tools-signer)
2. Add secret `KEYCHAIN` to Worker: https://developers.cloudflare.com/workers/configuration/secrets/#via-the-dashboard

## Deploy to Docker Container

```bash
docker swarm init

cat keychain.toml | docker secret create KEYCHAIN -

docker pull ghcr.io/aliez-ren/taoli-tools-signer:latest \
  && docker rm -f taoli-tools-signer \
  && docker run -d --restart=always --name=taoli-tools-signer --secret=KEYCHAIN ghcr.io/aliez-ren/taoli-tools-signer:latest \
  && docker logs -f taoli-tools-signer
```

- https://docs.docker.com/engine/swarm/secrets/
