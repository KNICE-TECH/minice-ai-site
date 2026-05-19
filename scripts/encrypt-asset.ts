// Encrypt protected source assets and emit Minice CryptEnvelope v1
// blobs into server/assets/<name>.bin. Keep the container format in
// sync with wasm/src/lib.rs — any change there must be mirrored here.
//
// Sources are whitelisted (no globbing): each entry maps an input
// path to an output name. Add new protected assets here.

import {
  createCipheriv,
  randomBytes as nodeRandomBytes,
} from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const REPO = join(import.meta.dir, "..");
const ASSETS_OUT = join(REPO, "server", "assets");

// name → source path. Add more protected files here as needed.
const SOURCES: Record<string, string> = {
  nayu: join(REPO, "assets-src", "nayu.vrm"),
};

const MAGIC = Buffer.from("MNCE", "ascii"); // 4 bytes
const VERSION = 1;
const HEADER_LEN = 12;
const NONCE_LEN = 12;
const TAG_LEN = 16;

function loadEnv() {
  const envPath = join(REPO, ".env");
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z_]+)=(.*)$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}
loadEnv();

const keyHex = process.env.MODEL_KEY;
if (!keyHex || keyHex.length !== 64) {
  console.error("✗ MODEL_KEY missing or wrong length (need 64 hex chars).");
  console.error("  Run: bun scripts/gen-keys.ts");
  process.exit(1);
}
const KEY = Buffer.from(keyHex, "hex");

mkdirSync(ASSETS_OUT, { recursive: true });

let failures = 0;
for (const [name, src] of Object.entries(SOURCES)) {
  if (!existsSync(src)) {
    console.error(`✗ source missing for "${name}": ${src}`);
    failures++;
    continue;
  }
  const plain = readFileSync(src);
  const nonce = nodeRandomBytes(NONCE_LEN);
  const cipher = createCipheriv("aes-256-gcm", KEY, nonce);
  const ct = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag(); // 16 bytes

  // Header layout — keep aligned with wasm/src/lib.rs
  const header = Buffer.alloc(HEADER_LEN);
  MAGIC.copy(header, 0);
  header.writeUInt8(VERSION, 4);
  header.writeUInt8(0, 5); // flags
  header.writeUInt16BE(0, 6); // reserved
  header.writeUInt32BE(plain.length, 8);

  // aes-gcm in the Rust crate expects ciphertext || tag (the standard
  // AEAD wire layout). Node returns them separately, so concat.
  const out = Buffer.concat([header, nonce, ct, tag]);

  const outPath = join(ASSETS_OUT, `${name}.bin`);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, out);

  console.log(
    `✓ ${name}: ${plain.length.toLocaleString()} B plain → ${out.length.toLocaleString()} B enc → ${outPath}`,
  );
}

if (failures > 0) {
  console.error(`\n${failures} source(s) missing — see above.`);
  process.exit(2);
}
