# syntax=docker/dockerfile:1.7

# ─────────────────────────────────────────────────────────────────────
# Stage 1 — wasm
#   Build the Rust → WASM decrypt module. MODEL_KEY is baked in at
#   compile time (build.rs parses it to a 32-byte constant). The hex
#   string never enters the binary, only the parsed bytes.
# ─────────────────────────────────────────────────────────────────────
# rust:1-slim tracks the latest stable 1.x — needs to be ≥1.85 because
# current wasm-pack pulls clap_builder, which requires the edition2024
# Cargo feature. Pinning to 1.83 broke the build with that exact error.
FROM rust:1-slim AS wasm
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
# Stage 2 — build (frontend)
#   Runs `vite build` with the WASM artefacts from stage 1 vendored into
#   src/wasm/pkg. The encrypted asset (server/assets/nayu.bin) is NOT
#   produced here — it is committed to the repo already (safe: it's
#   AES-256-GCM ciphertext). The raw .vrm never enters the build context
#   so this works from a public repo / clean CI checkout.
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
