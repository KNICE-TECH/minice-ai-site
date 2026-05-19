import { Hono } from "hono";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { serveStatic } from "hono/bun";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { tokenRoute } from "./routes/token";
import { assetRoute } from "./routes/asset";

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, "..");
const DIST = join(REPO, "dist");

// In production the platform feeds env vars; in dev we also load .env
// for convenience so `bun --watch server/index.ts` Just Works.
if (process.env.NODE_ENV !== "production") {
  const envPath = join(REPO, ".env");
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split(/\r?\n/)) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
    }
  }
}

const app = new Hono();

app.use("*", logger());
app.use("*", secureHeaders());

app.route("/api/token", tokenRoute);
app.route("/api/asset", assetRoute);

// Serve the built SPA. In dev (NODE_ENV !== production) we skip this
// because Vite handles statics and proxies /api to us — see vite.config.ts.
if (process.env.NODE_ENV === "production") {
  app.use("/*", serveStatic({ root: "./dist" }));
  // SPA fallback — any non-/api, non-file route returns index.html.
  // But requests for a missing FILE (i.e. anything with an extension) get a
  // real 404. That way someone probing `/nayu.vrm` doesn't get HTML back
  // and accidentally see status 200 in their tooling.
  app.notFound((c) => {
    const url = new URL(c.req.url);
    const last = url.pathname.split("/").pop() ?? "";
    if (last.includes(".")) return c.text("not found", 404);
    const indexPath = join(DIST, "index.html");
    if (existsSync(indexPath)) {
      return c.html(readFileSync(indexPath, "utf8"));
    }
    return c.text("not found", 404);
  });
}

const port = Number(process.env.PORT ?? 8080);
console.log(`▶ minice api ready on :${port}  (mode=${process.env.NODE_ENV ?? "development"})`);

export default {
  port,
  fetch: app.fetch,
};
