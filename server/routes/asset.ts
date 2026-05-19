import { Hono } from "hono";
import { existsSync, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { verifyToken } from "../lib/sign";

// Resolve the assets dir relative to THIS file so it works both when
// run from source (server/routes/asset.ts) and from a built tree —
// in both cases ../assets sits next to the routes/ folder.
const ASSETS_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "assets");

// Only names that match the whitelist are servable. Prevents path
// traversal and limits the surface to what we explicitly publish.
const NAME_RE = /^[a-z0-9_-]{1,32}$/;

export const assetRoute = new Hono();

assetRoute.get("/:name", async (c) => {
  const name = c.req.param("name");
  if (!NAME_RE.test(name)) {
    return c.json({ error: "bad_name" }, 400);
  }
  const token = c.req.query("t");
  if (!token) {
    return c.json({ error: "missing_token" }, 401);
  }
  const v = verifyToken(token);
  if (!v.ok) {
    return c.json({ error: v.reason }, 401);
  }

  const path = join(ASSETS_DIR, `${name}.bin`);
  if (!existsSync(path)) {
    return c.json({ error: "not_found" }, 404);
  }

  const stat = statSync(path);
  const file = Bun.file(path);

  // Stream the bytes back. Generic content-type, no filename — the
  // browser has no hint that this is an asset, let alone a model.
  return new Response(file.stream(), {
    headers: {
      "content-type": "application/octet-stream",
      "content-length": String(stat.size),
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
});
