import { useEffect, useRef, type DependencyList } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * useGSAPScroll — runs a setup callback inside a gsap.context, automatically
 * cleans up all timelines/ScrollTriggers on unmount. The callback receives
 * `gsap` and the ref's current element.
 *
 * Example:
 *   const sectionRef = useRef<HTMLElement>(null);
 *   useGSAPScroll(sectionRef, (el) => {
 *     gsap.timeline({
 *       scrollTrigger: { trigger: el, start: "top top", end: "bottom bottom", scrub: 1 }
 *     }).from(el.querySelector("h1"), { opacity: 0, y: 40 });
 *   });
 */
export function useGSAPScroll<T extends HTMLElement = HTMLElement>(
  ref: React.RefObject<T | null>,
  setup: (el: T) => void,
  deps: DependencyList = [],
) {
  const ctxRef = useRef<gsap.Context | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    ctxRef.current = gsap.context(() => setup(el), el);
    // Refresh once after setup so triggers compute correctly relative to
    // current document height.
    ScrollTrigger.refresh();
    return () => {
      ctxRef.current?.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
