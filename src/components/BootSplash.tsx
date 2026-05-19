import { useEffect, useState } from "react";
import { bootSignal } from "@/lib/bootSignal";

// Fullscreen splash that hides the initial JS/asset spike and waits for the
// VRM model to be fully loaded + GPU-warmed. Hide conditions:
//   • document.readyState 'complete'
//   • minimum dwell elapsed (avoid a single-frame flash on cached loads)
//   • no heavy work was requested  OR  heavy work signalled ready
//
// A *stall* cap fires only if no progress has been observed for a long time,
// so slow networks aren't punished — only genuinely broken loads.
export function BootSplash({
  minDurationMs = 600,
  stallMs = 15000,
  absoluteCapMs = 45000,
}: {
  minDurationMs?: number;
  stallMs?: number;
  absoluteCapMs?: number;
}) {
  const [phase, setPhase] = useState<"visible" | "fading" | "hidden">("visible");
  const [progress, setProgressPct] = useState(0);

  useEffect(() => {
    const start = performance.now();
    const FADE_MS = 450;
    let timer = 0;
    let unsub: (() => void) | null = null;
    let triggered = false;

    const beginFade = () => {
      if (triggered) return;
      triggered = true;
      setPhase("fading");
      window.setTimeout(() => setPhase("hidden"), FADE_MS);
    };

    const evaluate = () => {
      const now = performance.now();
      const elapsed = now - start;
      const sig = bootSignal.get();
      setProgressPct(sig.progress);

      const docReady = document.readyState === "complete";
      const minOk = elapsed >= minDurationMs;
      const noHeavy = !sig.requested;
      const heavyReady = sig.ready;

      if (docReady && minOk && (noHeavy || heavyReady)) {
        beginFade();
        return;
      }

      // Stall cap: bail if the heavy load was requested but progress has been
      // frozen for stallMs. This catches genuinely broken loads without
      // punishing slow networks.
      if (sig.requested && !heavyReady) {
        const idle = now - (sig.lastProgressAt || start);
        if (idle >= stallMs) {
          beginFade();
          return;
        }
      }

      // Absolute cap as final safety net.
      if (elapsed >= absoluteCapMs) {
        beginFade();
        return;
      }

      window.clearTimeout(timer);
      timer = window.setTimeout(evaluate, 250);
    };

    if (document.readyState !== "complete") {
      window.addEventListener("load", evaluate, { once: true });
    }
    unsub = bootSignal.subscribe(evaluate);
    evaluate();

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("load", evaluate);
      unsub?.();
    };
  }, [minDurationMs, stallMs, absoluteCapMs]);

  if (phase === "hidden") return null;

  const pct = Math.round(progress * 100);

  return (
    <div
      aria-hidden={phase !== "visible"}
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{
        background: "var(--ink)",
        opacity: phase === "fading" ? 0 : 1,
        transition: "opacity 450ms cubic-bezier(.2,.8,.2,1)",
        pointerEvents: phase === "fading" ? "none" : "auto",
      }}
    >
      <div className="flex flex-col items-center gap-6 w-[220px]">
        <svg
          width="56"
          height="56"
          viewBox="0 0 96 96"
          fill="none"
          aria-label="Minice"
          className="animate-[boot-pulse_1.6s_ease-in-out_infinite]"
        >
          <path d="M 14 78 L 14 22 L 48 56 Z" fill="#f5f4f1" />
          <path d="M 82 78 L 82 22 L 48 56 Z" fill="#f5f4f1" opacity="0.55" />
          <path d="M 14 78 L 48 56 L 82 78 Z" fill="#e8a87c" />
        </svg>

        <div
          className="w-full h-[2px] rounded-full overflow-hidden"
          style={{ background: "rgba(255,255,255,0.08)" }}
        >
          <div
            className="h-full origin-left"
            style={{
              width: `${Math.max(4, pct)}%`,
              background: "var(--bronze, #e8a87c)",
              transition: "width 220ms cubic-bezier(.2,.8,.2,1)",
            }}
          />
        </div>

        <span className="font-mono uppercase tracking-[0.32em] text-[10px] text-[color:var(--muted)]">
          {progress > 0 ? `loading · ${pct}%` : "minice · booting"}
        </span>
      </div>

      <style>{`
        @keyframes boot-pulse {
          0%, 100% { opacity: .55; transform: scale(1); }
          50%      { opacity: 1;   transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
}
