# Deploying minice.ai to a Docker VPS

The site is a single Docker image: a Bun + Hono server that serves the
built SPA and gates the protected VRM asset. No external services.

## 0. One-time: generate production secrets

The dev `.env` keys must NOT be reused in production — they've been
handled in plaintext during development.

On the **build machine** (or locally, then transfer):

```bash
# Generates fresh MODEL_KEY + SIGNING_KEY into .env if absent.
# To force-rotate, delete the two lines from .env first.
bun scripts/gen-keys.ts
```

- `MODEL_KEY` — encrypts the VRM and is baked into the WASM at build
  time. Build-time secret.
- `SIGNING_KEY` — signs `/api/token` HMACs. Runtime secret.

Keep `.env` off git (it already is, via `.gitignore`) and out of any
shared channel. Treat it like an SSH key.

## 1. Build the image

`MODEL_KEY` is a **build arg** — it both encrypts `assets-src/nayu.vrm`
and is compiled into the WASM decryptor:

```bash
MODEL_KEY=$(grep '^MODEL_KEY=' .env | cut -d= -f2)
docker build --build-arg MODEL_KEY="$MODEL_KEY" -t minice-site:prod .
```

The 3-stage build:
1. `rust:1.83-slim` → `wasm-pack` builds the decryptor.
2. `oven/bun:1.3` → encrypts the VRM, runs `vite build`.
3. `oven/bun:1.3-slim` → runtime image (Bun + server + dist + blobs).

The source `.vrm` never lands in the final image — only the encrypted
`server/assets/nayu.bin`.

## 2. Ship the image to the VPS

Either build directly on the VPS, or build locally and transfer:

```bash
# Option A — build on the VPS (needs Docker there).
# Option B — transfer a local build:
docker save minice-site:prod | gzip | ssh user@vps 'gunzip | docker load'
```

## 3. Run on the VPS

`SIGNING_KEY` is read at **runtime** — pass it via env file. `MODEL_KEY`
is NOT needed at runtime (it's already baked into the image artifacts).

Create `/opt/minice/.env` on the VPS:

```
SIGNING_KEY=<the SIGNING_KEY value>
NODE_ENV=production
PORT=8080
```

Then:

```bash
docker run -d --name minice \
  --env-file /opt/minice/.env \
  -p 127.0.0.1:8080:8080 \
  --restart unless-stopped \
  minice-site:prod
```

Bind to `127.0.0.1` so the container is only reachable through the
reverse proxy, not directly from the internet.

## 4. Reverse proxy + TLS

Put nginx (or Caddy) in front for HTTPS on `minice.ai`. Minimal nginx:

```nginx
server {
  server_name minice.ai;
  location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

`X-Forwarded-For` / `X-Real-IP` matter — the `/api/token` rate limiter
reads them to bucket per client. Without them every request looks like
one IP and the limiter would throttle everyone together.

Get the cert with `certbot --nginx -d minice.ai`.

## 5. DNS

Point an `A` record for `minice.ai` (and `www` if wanted) at the VPS
IP. `astra.minice.ai` is a separate property — not served by this
image.

## Updating the site later

```bash
git pull
MODEL_KEY=$(grep '^MODEL_KEY=' .env | cut -d= -f2)
docker build --build-arg MODEL_KEY="$MODEL_KEY" -t minice-site:prod .
docker stop minice && docker rm minice
docker run -d --name minice --env-file /opt/minice/.env \
  -p 127.0.0.1:8080:8080 --restart unless-stopped minice-site:prod
```

Rotating `MODEL_KEY` requires a full rebuild (re-encrypts the VRM +
recompiles the WASM). Rotating `SIGNING_KEY` only needs a container
restart with the new env — existing tokens (60s TTL) just expire.

## Quick post-deploy smoke test

```bash
curl -sI https://minice.ai/                       # 200, text/html
curl -s -o /dev/null -w '%{http_code}\n' \
  https://minice.ai/api/asset/nayu                 # 401 (no token)
curl -s -o /dev/null -w '%{http_code}\n' \
  https://minice.ai/nayu.vrm                       # 404 (no raw model)
```

Then open the site, confirm the Astra card's avatar loads, and check
DevTools → Network shows one `POST /api/token` + one
`GET /api/asset/nayu?t=…` and no `.vrm` request anywhere.
