// Stable viewport height for scroll-driven choreography.
//
// On mobile, window.innerHeight changes every time the browser URL bar
// hides/shows during a scroll. Feeding that into scroll-progress math
// makes animations (the logo boom) jump mid-timeline, and sizing
// sections off it makes content reflow ("teleport").
//
// `svh` (small viewport height) is a FIXED CSS length — it equals the
// viewport with the URL bar shown and never changes on bar toggle, only
// on a real orientation change. We probe `100svh` once and cache it.

let cached = 0;

function probe(): number {
  if (typeof document === "undefined") return 0;
  const el = document.createElement("div");
  el.style.cssText =
    "position:fixed;left:0;top:0;width:0;height:100svh;visibility:hidden;pointer-events:none";
  document.body.appendChild(el);
  const h = el.getBoundingClientRect().height;
  el.remove();
  // Fallback for the rare browser without svh support.
  return h || window.innerHeight;
}

/** Viewport height in px that is stable against URL-bar show/hide.
 *  Recomputed only on orientation change. */
export function stableViewportHeight(): number {
  if (cached === 0) {
    cached = probe();
    window.addEventListener("orientationchange", () => {
      // The new dimensions settle a couple of frames after the event.
      window.setTimeout(() => {
        cached = probe();
      }, 300);
    });
  }
  return cached;
}
