import { useEffect, useRef } from "react";
import { useProgressStore } from "@/scroll/progressStore";
import { scrollTo } from "@/scroll/Lenis";

const STOPS: Array<{ id: string; label: string; selector: string }> = [
  { id: "hero", label: "01", selector: "#hero" },
  { id: "projects", label: "02", selector: "#projects" },
  { id: "about", label: "03", selector: "#about" },
  { id: "contact", label: "04", selector: "#contact" },
];

export function ProgressRail() {
  const fillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const apply = (p: number) => {
      if (fillRef.current) {
        fillRef.current.style.transform = `scaleY(${p})`;
      }
    };
    apply(useProgressStore.getState().progress);
    return useProgressStore.subscribe((s) => apply(s.progress));
  }, []);

  return (
    <div className="fixed right-6 sm:right-8 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-4 pointer-events-auto">
      <div className="relative h-44 w-px bg-[color:var(--ink-3)] overflow-hidden">
        <div
          ref={fillRef}
          className="absolute inset-0 origin-top bg-[color:var(--bronze)]"
          style={{ transform: "scaleY(0)", transition: "transform 100ms linear" }}
        />
      </div>
      <ul className="flex flex-col items-center gap-2.5">
        {STOPS.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => scrollTo(s.selector)}
              className="font-mono text-[9px] uppercase tracking-[0.18em] text-[color:var(--muted)] hover:text-[color:var(--bronze)] transition"
              aria-label={`Go to ${s.id}`}
            >
              {s.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
