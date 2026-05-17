import { useEffect, useRef, type ReactNode } from "react";
import { useProgressStore } from "@/scroll/progressStore";

type Props = {
  id: string;
  range: [number, number];
  // Portion of the range used for entry / exit. Both fades happen INSIDE the
  // range so adjacent stages never overlap on screen — old section fully exits
  // before the new one starts entering.
  enter?: number;
  exit?: number;
  children: ReactNode;
};

export function Stage({ id, range, enter = 0.32, exit = 0.32, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const [start, end] = range;
    const duration = end - start;
    const enterEnd = start + duration * enter;
    const exitStart = end - duration * exit;

    const apply = (p: number) => {
      const el = ref.current;
      if (!el) return;
      let opacity = 0;
      let translateY = 0;
      let scale = 1;

      if (p < start || p > end) {
        // Off-screen.
        opacity = 0;
        translateY = p < start ? 40 : -40;
        scale = 0.98;
      } else if (p < enterEnd) {
        // Fading in (translate up from below).
        const t = (p - start) / (enterEnd - start);
        opacity = t;
        translateY = (1 - t) * 40;
        scale = 0.98 + 0.02 * t;
      } else if (p > exitStart) {
        // Fading out (translate up to above).
        const t = (p - exitStart) / (end - exitStart);
        opacity = 1 - t;
        translateY = -40 * t;
        scale = 1 - 0.02 * t;
      } else {
        opacity = 1;
        translateY = 0;
        scale = 1;
      }

      el.style.opacity = String(opacity);
      el.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
      el.style.pointerEvents = opacity > 0.5 ? "auto" : "none";
      el.style.visibility = opacity > 0.01 ? "visible" : "hidden";
    };

    apply(useProgressStore.getState().progress);
    const unsub = useProgressStore.subscribe((state) => apply(state.progress));
    return unsub;
  }, [range, enter, exit]);

  return (
    <div
      id={id}
      ref={ref}
      className="absolute inset-0 w-full h-full"
      style={{ opacity: 0, willChange: "opacity, transform" }}
    >
      {children}
    </div>
  );
}
