// One-shot key generator. Run with `bun scripts/gen-keys.ts`.
// Prints MODEL_KEY (32 bytes, hex — used by AES-256-GCM) and
// SIGNING_KEY (32 bytes, hex — used by HMAC-SHA256 for tokens).
// Writes them into .env at the repo root if .env doesn't already
// contain those keys. Never overwrites an existing key.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { join } from "node:path";

const ENV_PATH = join(import.meta.dir, "..", ".env");

function hex(bytes: number) {
  return randomBytes(bytes).toString("hex");
}

const existing = existsSync(ENV_PATH) ? readFileSync(ENV_PATH, "utf8") : "";

const want = {
  MODEL_KEY: hex(32),
  SIGNING_KEY: hex(32),
  PORT: "8080",
  NODE_ENV: "development",
};

const lines: string[] = [];
const has = (k: string) => new RegExp(`^${k}=`, "m").test(existing);

if (existing.trim().length > 0 && !existing.endsWith("\n")) lines.push("");

for (const [k, v] of Object.entries(want)) {
  if (has(k)) {
    console.log(`• ${k} already present in .env — keeping existing value`);
    continue;
  }
  lines.push(`${k}=${v}`);
  console.log(`✓ ${k}=${v}`);
}

if (lines.length === 0) {
  console.log("Nothing to do — all keys already exist in .env");
  process.exit(0);
}

writeFileSync(ENV_PATH, existing + lines.join("\n") + "\n");
console.log(`\nWrote → ${ENV_PATH}`);
console.log("Add .env to .gitignore if it isn't already.");
