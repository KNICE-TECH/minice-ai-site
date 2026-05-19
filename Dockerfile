# syntax=docker/dockerfile:1.7

# ─────────────────────────────────────────────────────────────────────
# Stage 1 — wasm
#   Build the Rust → WASM decrypt module. MODEL_KEY is baked in at
#   compile time (build.rs parses it to a 32-byte constant). The hex
#   string never enters the binary, only the parsed bytes.
# ─────────────────────────────────────────────────────────────────────
FROM rust:1.83-slim AS wasm
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl ca-certificates pkg-config build-essential \
    && rm -rf /var/lib/apt/lists/* \
    && rustup target add wasm32-unknown-unknown \
    && cargo install wasm-pack --locked

WORKDIR /app
COPY wasm/Cargo.toml wasm/build.rs ./wasm/
COPY wasm/src ./wasm/src

ARG MODEL_KEY
RUN test -n "$MODEL_KEY" || (echo "MODEL_KEY build arg required" && exit 1)

# wasm-pack reads MODEL_KEY through cargo's env passthrough.
RUN MODEL_KEY=$MODEL_KEY wasm-pack build \
    --target web --release \
    --out-dir /out/wasm/pkg --out-name decrypt \
    ./wasm

# ─────────────────────────────────────────────────────────────────────
# Stage 2 — build (frontend + encrypted asset)
#   Encrypts the .vrm source with the same MODEL_KEY, runs `vite build`
#   with the WASM artefacts from stage 1 vendored into src/wasm/pkg.
# ─────────────────────────────────────────────────────────────────────
FROM oven/bun:1.3 AS build
WORKDIR /app

# Install deps first for layer caching.
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Now bring in the source.
COPY . .

# Bring in the WASM artefact from stage 1.
COPY --from=wasm /out/wasm/pkg ./src/wasm/pkg

# Encrypt the source asset, then build the SPA.
ARG MODEL_KEY
RUN test -n "$MODEL_KEY" || (echo "MODEL_KEY build arg required" && exit 1)
RUN MODEL_KEY=$MODEL_KEY bun scripts/encrypt-asset.ts
RUN bun run build:web

# ─────────────────────────────────────────────────────────────────────
# Stage 3 — runtime
#   Tiny final image. Carries:
#     • Bun runtime
#     • server/ (Hono code)
#     • dist/ (built SPA)
#     • server/assets/*.bin (encrypted blobs)
#   Source .vrm never enters this image.
# ─────────────────────────────────────────────────────────────────────
FROM oven/bun:1.3-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production && bun pm cache rm

COPY --from=build /app/dist             ./dist
COPY --from=build /app/server           ./server

EXPOSE 8080
CMD ["bun", "server/index.ts"]
