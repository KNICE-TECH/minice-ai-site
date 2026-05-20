# Deploying minice.ai

The site ships as one Docker image — a Bun + Hono server that serves the
built SPA and gates the protected VRM asset. GitHub Actions builds and
publishes the image; Dockge on the server pulls and runs it.

```
push to main ──▶ GitHub Actions ──▶ ghcr.io/<owner>/minice-ai-site:latest
                                          │
                              Dockge "update" button
                                          │
                                    docker compose pull && up -d
```

## Keys — how they split

- **MODEL_KEY** — 32-byte hex. Encrypts `assets-src/nayu.vrm` into
  `server/assets/nayu.bin` AND is baked into the WASM decryptor at build
  time. **Build-time only.** Lives in local `.env` and as a GitHub
  Actions secret.
- **SIGNING_KEY** — 32-byte hex. Signs `/api/token` HMACs. **Runtime
  only.** Lives in local `.env` and in the Dockge stack's env.

The encrypted `server/assets/nayu.bin` IS committed to the repo — it's
AES-256-GCM ciphertext, safe to publish, and the CI build needs it. The
raw `assets-src/nayu.vrm` is gitignored and never leaves your machine.

## One-time setup

### 1. GitHub — MODEL_KEY secret

Repo → Settings → Secrets and variables → Actions → New repository
secret:

- Name: `MODEL_KEY`
- Value: the `MODEL_KEY` line from your local `.env`

It MUST match the key that encrypted the committed `nayu.bin`. If they
diverge, the WASM decrypt fails at runtime.

### 2. First image build

Push to `main` (or run the workflow manually from the Actions tab). The
workflow publishes `ghcr.io/<owner>/minice-ai-site:latest`.

If the GHCR package starts private, either make it public (Package
settings → Change visibility) or give the server a pull token. Public is
fine — the image only contains what the live site already exposes.

### 3. Server — Dockge stack

In Dockge, create a new stack named `minice`, paste `docker-compose.yml`
from this repo, and set the stack `.env`:

```
SIGNING_KEY=<the SIGNING_KEY from your local .env>
```

Deploy. The container binds `127.0.0.1:8088` — NOT exposed to the
internet, only reachable through the reverse proxy.

### 4. Reverse proxy + TLS

Point nginx / Caddy / Nginx-Proxy-Manager at `127.0.0.1:8088`. Minimal
nginx:

```nginx
server {
  server_name minice.ai;
  location / {
    proxy_pass http://127.0.0.1:8088;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

`X-Forwarded-For` / `X-Real-IP` matter — the `/api/token` rate limiter
buckets per client off them. Without them every request looks like one
IP. Get the cert with `certbot --nginx -d minice.ai`.

### 5. DNS

`A` record for `minice.ai` → server IP. `astra.minice.ai` is a separate
property, not served by this image.

## Updating the site

1. Commit + push to `main`.
2. GitHub Actions rebuilds and publishes `:latest`.
3. Hit "update" in the Dockge stack — it pulls the new image and
   recreates the container.

## Rotating keys

- **SIGNING_KEY** — change it in the Dockge stack env and redeploy.
  In-flight tokens (60s TTL) just expire. No rebuild.
- **MODEL_KEY** — heavier. Locally:
  1. Put the new key in `.env`.
  2. `bun run build:wasm` (rebakes the WASM).
  3. `bun run build:encrypt` (re-encrypts `nayu.bin`).
  4. Commit the new `server/assets/nayu.bin`.
  5. Update the `MODEL_KEY` GitHub Actions secret to match.
  6. Push — CI rebuilds with the new key.

## Local prod-like run (no server)

```bash
MODEL_KEY=$(grep '^MODEL_KEY=' .env | cut -d= -f2)
docker build --build-arg MODEL_KEY="$MODEL_KEY" -t minice-site:local .
SIGNING_KEY=$(grep '^SIGNING_KEY=' .env | cut -d= -f2)
docker run -d --name minice --restart unless-stopped \
  -e SIGNING_KEY="$SIGNING_KEY" -e NODE_ENV=production -e PORT=8080 \
  -p 127.0.0.1:8088:8080 minice-site:local
```

## Smoke test

```bash
curl -sI http://127.0.0.1:8088/                              # 200, text/html
curl -s -o /dev/null -w '%{http_code}\n' \
  http://127.0.0.1:8088/api/asset/nayu                       # 401 (no token)
curl -s -o /dev/null -w '%{http_code}\n' \
  http://127.0.0.1:8088/nayu.vrm                             # 404 (no raw model)
```

Then open the site, confirm the Astra card avatar loads, and check
DevTools → Network shows one `POST /api/token` + one
`GET /api/asset/nayu?t=…`, with no `.vrm` request anywhere.
