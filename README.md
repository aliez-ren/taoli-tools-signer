# Taoli Tools Signer

## Features
- Self-hosted
- Multiple wallets
- Secret protection
- IP restriction
- Contract Allowlist

## Deploy to Cloudflare Workers

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https%3A%2F%2Fgithub.com%2Faliez-ren%2Ftaoli-tools-signer)

- https://developers.cloudflare.com/workers/configuration/secrets/

## Deploy to Docker Container

```bash
docker pull ghcr.io/aliez-ren/taoli-tools-signer:latest \
  && docker rm -f taoli-tools-signer \
  && docker run -d --restart=always --name=taoli-tools-signer ghcr.io/aliez-ren/taoli-tools-signer:latest \
  && docker logs -f taoli-tools-signer
```

- https://docs.docker.com/engine/swarm/secrets/
