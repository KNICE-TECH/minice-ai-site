#!/usr/bin/env bash
# Build the Minice decryptor → src/wasm/pkg/.
# MODEL_KEY must be present in the environment (or in .env at repo root).

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
REPO_ROOT=$(cd "$SCRIPT_DIR/.." && pwd)

# Load .env if MODEL_KEY isn't already in the environment.
if [ -z "${MODEL_KEY:-}" ] && [ -f "$REPO_ROOT/.env" ]; then
  # shellcheck disable=SC1091
  set -a; . "$REPO_ROOT/.env"; set +a
fi

if [ -z "${MODEL_KEY:-}" ]; then
  echo "✗ MODEL_KEY is not set. Run 'bun scripts/gen-keys.ts' first."
  exit 1
fi

cd "$SCRIPT_DIR"

# wasm-pack picks up env vars and forwards them to cargo, where our
# env!("MODEL_KEY") reads at compile time. The key never goes through
# any text file inside the wasm output — it's baked into the binary's
# .rodata as parsed bytes.
exec wasm-pack build \
  --target web \
  --release \
  --out-dir "$REPO_ROOT/src/wasm/pkg" \
  --out-name decrypt
