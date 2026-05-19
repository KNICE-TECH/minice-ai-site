import { Hono } from "hono";
import { issueToken } from "../lib/sign";
import { take } from "../lib/rateLimit";

const TOKENS_PER_HOUR = 60;
const TTL_MS = 60_000; // 60-second tokens — short enough to kill hotlinks

export const tokenRoute = new Hono();

tokenRoute.post("/", (c) => {
  // Trust the platform proxy in production (Cloudflare / nginx).
  // Falls back to the socket address in local dev.
  const ip =
    c.req.header("cf-connecting-ip") ??
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ??
    c.req.header("x-real-ip") ??
    "local";

  const verdict = take(ip, TOKENS_PER_HOUR);
  if (!verdict.allowed) {
    return c.json(
      { error: "rate_limited", reset: verdict.reset },
      429,
      { "Retry-After": String(Math.ceil((verdict.reset - Date.now()) / 1000)) },
    );
  }

  const { token, exp } = issueToken(TTL_MS);
  return c.json({ token, exp }, 200, {
    "Cache-Control": "no-store",
  });
});
