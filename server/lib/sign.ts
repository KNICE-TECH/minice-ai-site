// HMAC-SHA256 token sign/verify. Wire format:
//   `${expEpochMs}.${randomHex}.${sigBase64Url}`
// Single string, URL-safe — fits in a query param.
//
// The signature covers `${exp}.${rand}` so an attacker can't:
//  • extend the expiry (changing `exp` invalidates the sig)
//  • replay an old-token signature with a new exp
//
// `rand` is a per-issue 8-byte nonce — purely to make tokens look
// distinct in logs and keep them non-guessable. Not stateful.

import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const SECRET = process.env.SIGNING_KEY ?? "";
if (!SECRET || SECRET.length !== 64) {
  console.error("✗ SIGNING_KEY missing/wrong length. Run bun scripts/gen-keys.ts");
}
const SECRET_BUF = Buffer.from(SECRET, "hex");

function b64url(buf: Buffer): string {
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function fromB64url(s: string): Buffer {
  const pad = s.length % 4 ? 4 - (s.length % 4) : 0;
  return Buffer.from(
    s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad),
    "base64",
  );
}

function sign(payload: string): string {
  return b64url(createHmac("sha256", SECRET_BUF).update(payload).digest());
}

export function issueToken(ttlMs = 60_000): { token: string; exp: number } {
  const exp = Date.now() + ttlMs;
  const rand = randomBytes(8).toString("hex");
  const payload = `${exp}.${rand}`;
  const sig = sign(payload);
  return { token: `${payload}.${sig}`, exp };
}

export type VerifyResult =
  | { ok: true; exp: number }
  | { ok: false; reason: "shape" | "sig" | "expired" };

export function verifyToken(token: string): VerifyResult {
  const parts = token.split(".");
  if (parts.length !== 3) return { ok: false, reason: "shape" };
  const [expStr, rand, sig] = parts;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || !rand || !sig) return { ok: false, reason: "shape" };

  const expected = sign(`${expStr}.${rand}`);
  const a = fromB64url(sig);
  const b = fromB64url(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "sig" };
  }
  if (Date.now() > exp) return { ok: false, reason: "expired" };
  return { ok: true, exp };
}
