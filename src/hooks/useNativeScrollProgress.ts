import { useEffect } from "react";
import Lenis from "lenis";
import { useProgressStore } from "@/scroll/progressStore";
import { useReducedMotion } from "./useReducedMotion";
import { useIsTouch } from "./useIsTouch";
import { clamp } from "@/lib/math";

// Module-level Lenis reference so external callers can drive scrollTo.
let lenisRef: Lenis | null = null;

export function scrollToProgress(p: number) {
  if (typeof window === "undefined") return;
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const y = clamp(p, 0, 1) * max;
  if (lenisRef) lenisRef.scrollTo(y, { duration: 1.2 });
  else window.scrollTo({ top: y, behavior: "smooth" });
}

export function useNativeScrollProgress() {
  const reduced = useReducedMotion();
  const touch = useIsTouch();

  useEffect(() => {
    const setProgress = useProgressStore.getState().set;

    const compute = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight || 1;
      setProgress(clamp(window.scrollY / max, 0, 1));
    };

    compute();
    window.addEventListener("scroll", compute, { passive: true });
    window.addEventListener("resize", compute);

    let lenis: Lenis | null = null;
    let raf = 0;
    if (!reduced) {
      lenis = new Lenis({
        duration: 1.1,
        easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
        smoothWheel: !touch,
        lerp: 0.1,
      });
      lenisRef = lenis;
      const loop = (time: number) => {
        lenis!.raf(time);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    }

    return () => {
      window.removeEventListener("scroll", compute);
      window.removeEventListener("resize", compute);
      if (lenis) {
        cancelAnimationFrame(raf);
        lenis.destroy();
        lenisRef = null;
      }
    };
  }, [reduced, touch]);
}
