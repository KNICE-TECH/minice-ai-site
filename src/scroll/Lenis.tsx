import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useIsTouch } from "@/hooks/useIsTouch";

gsap.registerPlugin(ScrollTrigger);

// Module-level Lenis instance so anchors / nav can call scrollTo.
let lenisRef: Lenis | null = null;

export function scrollTo(target: number | string | HTMLElement, opts?: { duration?: number; offset?: number }) {
  if (lenisRef) {
    lenisRef.scrollTo(target, { duration: opts?.duration ?? 1.1, offset: opts?.offset ?? 0 });
  } else if (typeof target === "string") {
    const el = document.querySelector(target);
    el?.scrollIntoView({ behavior: "smooth" });
  } else if (typeof target === "number") {
    window.scrollTo({ top: target, behavior: "smooth" });
  }
}

export function getLenis() {
  return lenisRef;
}

/**
 * LenisProvider — initializes Lenis on desktop, bridges to GSAP's ticker so
 * ScrollTrigger updates on every Lenis frame. On touch devices, falls back
 * to native scroll (Lenis disabled entirely — Safari handles momentum best).
 * On reduced-motion, also disabled.
 */
export function LenisProvider({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const touch = useIsTouch();

  useEffect(() => {
    // No smooth scroll on touch or reduced motion — let the OS handle it.
    if (reduced || touch) {
      // Still need ScrollTrigger to track native scroll
      ScrollTrigger.defaults({ markers: false });
      return;
    }

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t: number) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      // wheel only — touch uses native (Safari momentum)
      smoothWheel: true,
    });
    lenisRef = lenis;

    // Industry-standard bridge: Lenis emits scroll, ScrollTrigger refreshes; Lenis RAF runs in GSAP's ticker.
    const onScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onScroll);
    const tickerCallback = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    // Refresh ScrollTrigger when viewport changes (address-bar show/hide, rotate, etc.)
    const onResize = () => ScrollTrigger.refresh();
    window.addEventListener("resize", onResize);

    return () => {
      lenis.off("scroll", onScroll);
      gsap.ticker.remove(tickerCallback);
      lenis.destroy();
      lenisRef = null;
      window.removeEventListener("resize", onResize);
    };
  }, [reduced, touch]);

  return <>{children}</>;
}
