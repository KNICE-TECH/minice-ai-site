import { lazy, Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { Project } from "@/data/projects";
import { StatusBadge } from "./StatusBadge";
import { useI18n } from "@/hooks/useI18n";
import { bootSignal } from "@/lib/bootSignal";

const VRMAvatar = lazy(() =>
  import("./VRMAvatar").then((m) => ({ default: m.VRMAvatar })),
);

type Props = { project: Project };

export function AstraFeatureCard({ project }: Props) {
  const { t } = useI18n();
  const [shouldMount, setShouldMount] = useState(false);

  // Start loading the VRM (lazy chunk + 6.3 MB .vrm) as soon as the boot splash
  // is about to hide. We mark the work as requested immediately so the splash
  // knows to wait for vrm ready. Mount on the next idle frame after document
  // load so React commit + critical assets finish first.
  useEffect(() => {
    let cancelled = false;
    bootSignal.markRequested();

    const ric: (cb: () => void) => number =
      (window as unknown as { requestIdleCallback?: (cb: () => void) => number })
        .requestIdleCallback ?? ((cb) => window.setTimeout(cb, 200));

    const arm = () => {
      if (cancelled) return;
      ric(() => {
        if (!cancelled) setShouldMount(true);
      });
    };

    if (document.readyState === "complete") {
      arm();
    } else {
      window.addEventListener("load", arm, { once: true });
    }
    const cap = window.setTimeout(() => {
      if (!cancelled) setShouldMount(true);
    }, 1500);
    return () => {
      cancelled = true;
      window.removeEventListener("load", arm);
      window.clearTimeout(cap);
    };
  }, []);

  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
      className="group relative overflow-hidden rounded-3xl border border-[color:var(--bronze)]/25 bg-[color:var(--ink-2)]/70 backdrop-blur-md"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-24 w-[420px] h-[420px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(208,160,90,0.22), transparent 70%)",
          filter: "blur(28px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-20 w-[360px] h-[360px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(208,160,90,0.10), transparent 70%)",
          filter: "blur(32px)",
        }}
      />

      <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-0">
        <div className="lg:col-span-5 relative min-h-[280px] sm:min-h-[360px] lg:min-h-[420px] border-b lg:border-b-0 lg:border-r border-white/5">
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
              maskImage:
                "radial-gradient(ellipse at 50% 50%, black 35%, transparent 80%)",
              WebkitMaskImage:
                "radial-gradient(ellipse at 50% 50%, black 35%, transparent 80%)",
            }}
          />
          {shouldMount ? (
            <Suspense
              fallback={
                <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] uppercase tracking-[.22em] text-white/40">
                  loading vrm…
                </div>
              }
            >
              <VRMAvatar url="/nayu.vrm" />
            </Suspense>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] uppercase tracking-[.22em] text-white/30">
              vrm · idle
            </div>
          )}
          <div className="pointer-events-none absolute top-4 left-4 font-mono text-[10px] uppercase tracking-[.22em] text-[color:var(--muted)] flex items-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[color:var(--bronze)] animate-pulse" />
            live · vrm
          </div>
          <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[.22em] text-white/45">
            <span>click · cycle emotion</span>
            <span>nayu.vrm</span>
          </div>
        </div>

        <div className="lg:col-span-7 p-5 sm:p-8 lg:p-10 flex flex-col">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <span className="inline-flex items-center gap-2 font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-[color:var(--bronze)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[color:var(--bronze)]" />
              flagship
            </span>
            <StatusBadge status={project.status} />
          </div>

          <div className="flex items-baseline gap-3 mb-3">
            <h3
              className="font-display font-bold leading-none"
              style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)" }}
            >
              {project.name}
            </h3>
            <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
              /{project.id}
            </span>
          </div>

          <p
            className="text-[color:var(--cream)]/90 mb-4 sm:mb-5"
            style={{ fontSize: "clamp(1.05rem, 1.6vw, 1.35rem)" }}
          >
            {project.tagline}
          </p>
          <p className="text-[color:var(--muted)] text-sm sm:text-base leading-relaxed max-w-[58ch] mb-6 sm:mb-8">
            {project.blurb}
          </p>

          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8 border-y border-white/5 py-4 sm:py-5">
            <Stat label="latency" value="142" unit="ms" />
            <Stat label="memory" value="<1" unit="gb" />
            <Stat label="runtime" value="rust" unit="" />
          </div>

          <div className="mt-auto flex flex-wrap items-center gap-3">
            {project.href && (
              <a
                href={project.href}
                target={project.external ? "_blank" : undefined}
                rel={project.external ? "noreferrer noopener" : undefined}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[color:var(--bronze)] text-[color:var(--ink)] font-mono text-[12px] uppercase tracking-[0.14em] hover:bg-[color:var(--bronze)]/85 transition"
              >
                {t.projects.learnMore} <span>→</span>
              </a>
            )}
            <a
              href="https://astra.minice.ai"
              target="_blank"
              rel="noreferrer noopener"
              className="btn-ghost"
            >
              astra.minice.ai
            </a>
          </div>
        </div>
      </div>
    </motion.article>
  );
}

function Stat({
  label,
  value,
  unit,
}: { label: string; value: string; unit: string }) {
  return (
    <div>
      <div className="font-display font-bold leading-none flex items-baseline gap-1">
        <span style={{ fontSize: "clamp(1.5rem, 2.6vw, 2rem)" }}>{value}</span>
        {unit && (
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
            {unit}
          </span>
        )}
      </div>
      <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
        {label}
      </div>
    </div>
  );
}
