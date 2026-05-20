// One-off: connect to the phone's Chrome (adb-forwarded CDP on :9222),
// find the minice tab, check the app is alive, measure rAF FPS.
// Run: bun scripts/phone-fps.ts

const list = (await (await fetch("http://localhost:9222/json")).json()) as Array<{
  url: string;
  webSocketDebuggerUrl?: string;
}>;
const page = list.find((p) => p.url.includes("localhost:8088"));
if (!page?.webSocketDebuggerUrl) {
  console.error("minice tab not found on phone Chrome");
  process.exit(1);
}

const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pending = new Map<number, (v: unknown) => void>();
function send(method: string, params: unknown = {}) {
  return new Promise<unknown>((resolve) => {
    const msgId = ++id;
    pending.set(msgId, resolve);
    ws.send(JSON.stringify({ id: msgId, method, params }));
  });
}
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data as string);
  if (m.id && pending.has(m.id)) {
    pending.get(m.id)!(m.result);
    pending.delete(m.id);
  }
});

await new Promise((r) => ws.addEventListener("open", r));

async function evaluate(expression: string, awaitPromise = false) {
  const r = (await send("Runtime.evaluate", {
    expression,
    awaitPromise,
    returnByValue: true,
  })) as { result?: { value?: unknown }; exceptionDetails?: unknown };
  if (r.exceptionDetails) return { error: JSON.stringify(r.exceptionDetails) };
  return { value: r.result?.value };
}

// 1. App alive?
const dom = await evaluate(`JSON.stringify({
  canvases: document.querySelectorAll('canvas').length,
  rootChildren: document.getElementById('root')?.childElementCount ?? -1,
  bodyLen: document.body.innerText.length,
  title: document.title,
})`);
console.log("DOM:", dom.value ?? dom.error);

// 2. FPS over 4 seconds via requestAnimationFrame.
const fps = await evaluate(
  `new Promise((resolve) => {
    let frames = 0;
    const t0 = performance.now();
    function tick() {
      frames++;
      const dt = performance.now() - t0;
      if (dt >= 4000) {
        resolve(JSON.stringify({ frames, seconds: +(dt/1000).toFixed(2), fps: +(frames/(dt/1000)).toFixed(1) }));
      } else {
        requestAnimationFrame(tick);
      }
    }
    requestAnimationFrame(tick);
  })`,
  true,
);
console.log("FPS:", fps.value ?? fps.error);

// 3. WebGL renderer string — tells us which GPU path.
const gl = await evaluate(`(() => {
  const c = document.querySelector('canvas');
  if (!c) return 'no canvas';
  const g = c.getContext('webgl2') || c.getContext('webgl');
  if (!g) return 'no webgl ctx';
  const dbg = g.getExtension('WEBGL_debug_renderer_info');
  return dbg ? g.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'renderer hidden';
})()`);
console.log("GPU:", gl.value ?? gl.error);

ws.close();
process.exit(0);
