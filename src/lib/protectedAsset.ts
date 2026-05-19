// Client helper for the protected-asset pipeline.
//
// Flow per asset:
//   1) POST /api/token         → short-lived signed token
//   2) GET  /api/asset/:name?t → encrypted Minice CryptEnvelope v1 blob
//   3) WASM decrypt(blob)      → plain bytes (a GLB in our case)
//
// The WASM module is loaded lazily and cached for the lifetime of the
// page, so subsequent assets share the same decryptor instance.
//
// Download progress is reported through an optional callback so the
// BootSplash can keep its progress bar honest — we use Content-Length
// + a ReadableStream reader to pump bytes-read as we go.

import init, { decrypt } from "@/wasm/pkg/decrypt.js";
import wasmUrl from "@/wasm/pkg/decrypt_bg.wasm?url";

type ProgressFn = (fraction: number) => void;

let wasmReady: Promise<void> | null = null;
function ensureWasm() {
  if (!wasmReady) {
    wasmReady = init(wasmUrl).then(() => {
      /* return void */
    });
  }
  return wasmReady;
}

async function fetchToken(): Promise<string> {
  const r = await fetch("/api/token", { method: "POST" });
  if (!r.ok) throw new Error(`token failed: ${r.status}`);
  const j = (await r.json()) as { token: string; exp: number };
  return j.token;
}

async function fetchBlob(name: string, onProgress?: ProgressFn): Promise<Uint8Array> {
  const token = await fetchToken();
  const r = await fetch(`/api/asset/${name}?t=${encodeURIComponent(token)}`);
  if (!r.ok) throw new Error(`asset ${name} failed: ${r.status}`);

  // Try to stream so progress is real. If the body isn't streamable
  // (older browsers, some proxies) fall back to a single arrayBuffer().
  const total = Number(r.headers.get("content-length") ?? 0);
  const reader = r.body?.getReader?.();
  if (!reader) {
    const buf = new Uint8Array(await r.arrayBuffer());
    onProgress?.(1);
    return buf;
  }

  const chunks: Uint8Array[] = [];
  let received = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      received += value.byteLength;
      if (total > 0) onProgress?.(received / total);
    }
  }
  if (total === 0) onProgress?.(1);

  const out = new Uint8Array(received);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.byteLength;
  }
  return out;
}

export async function loadProtectedAsset(
  name: string,
  onProgress?: ProgressFn,
): Promise<ArrayBuffer> {
  // Start WASM init and download in parallel — they're independent.
  const wasmInit = ensureWasm();
  const blob = await fetchBlob(name, onProgress);
  await wasmInit;
  const plain = decrypt(blob);
  // Return a fresh ArrayBuffer (not the WASM memory view) so the
  // caller can hand it to GLTFLoader.parse without worrying about it
  // being invalidated by future WASM allocations.
  return plain.buffer.slice(
    plain.byteOffset,
    plain.byteOffset + plain.byteLength,
  ) as ArrayBuffer;
}
