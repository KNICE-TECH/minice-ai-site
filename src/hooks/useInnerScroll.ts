import { useEffect, type RefObject } from "react";

/**
 * Lets a scrollable element consume wheel/touch events until it reaches its
 * own scroll boundary, then releases events so the page (Lenis) can scroll on.
 *
 * Usage: pass a ref to the element with `overflow-y: auto`.
 */
export function useInnerScroll(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const isAtTop = () => el.scrollTop <= 0;
    const isAtBottom = () => el.scrollTop + el.clientHeight >= el.scrollHeight - 1;

    const onWheel = (e: WheelEvent) => {
      // Element must actually have overflow content
      if (el.scrollHeight <= el.clientHeight) return;
      const goingDown = e.deltaY > 0;
      const goingUp = e.deltaY < 0;
      const canScrollInside =
        (goingDown && !isAtBottom()) || (goingUp && !isAtTop());
      if (canScrollInside) {
        e.preventDefault();
        e.stopPropagation();
        el.scrollTop += e.deltaY;
      }
      // else: let event bubble — Lenis (on window) picks it up for page scroll
    };

    // Touch: track Y delta; if we'd scroll past our boundary, release to page
    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]!.clientY;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (el.scrollHeight <= el.clientHeight) return;
      const y = e.touches[0]!.clientY;
      const dy = touchY - y; // positive = scrolling down
      touchY = y;
      const goingDown = dy > 0;
      const goingUp = dy < 0;
      const canScrollInside =
        (goingDown && !isAtBottom()) || (goingUp && !isAtTop());
      if (canScrollInside) {
        e.stopPropagation();
        // Native browser handles touch scroll on overflow:auto elements;
        // we only stop propagation so Lenis doesn't double-scroll the page.
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
    };
  }, [ref]);
}
