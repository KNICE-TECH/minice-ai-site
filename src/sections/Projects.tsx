import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ProjectCard } from "@/components/ProjectCard";
import { StellaModal } from "@/components/StellaModal";
import { projects } from "@/data/projects";
import { useI18n } from "@/hooks/useI18n";
import { useProgressStore } from "@/scroll/progressStore";
import { clamp } from "@/lib/math";

// Projects stage range from Home.tsx — keep in sync
const STAGE_START = 0.25;
const STAGE_END = 0.55;
// Within the stage, reserve enter+exit fade portions; pin-scroll happens in middle
const PIN_START = STAGE_START + (STAGE_END - STAGE_START) * 0.32; // ~0.346
const PIN_END = STAGE_END - (STAGE_END - STAGE_START) * 0.32;     // ~0.454

export function Projects() {
  const { t } = useI18n();
  const [stellaOpen, setStellaOpen] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  // Pin-scroll: as the page progress moves through PIN_START..PIN_END, translate
  // the inner content up by the overflow distance so all cards become visible.
  useEffect(() => {
    const apply = (p: number) => {
      const scroller = scrollerRef.current;
      const inner = innerRef.current;
      if (!scroller || !inner) return;
      const overflow = Math.max(0, inner.offsetHeight - scroller.offsetHeight);
      const t = clamp((p - PIN_START) / (PIN_END - PIN_START), 0, 1);
      inner.style.transform = `translateY(${-t * overflow}px)`;
    };
    apply(useProgressStore.getState().progress);
    const unsub = useProgressStore.subscribe((s) => apply(s.progress));
    const ro = new ResizeObserver(() => apply(useProgressStore.getState().progress));
    if (scrollerRef.current) ro.observe(scrollerRef.current);
    if (innerRef.current) ro.observe(innerRef.current);
    return () => {
      unsub();
      ro.disconnect();
    };
  }, []);

  return (
    <div
      ref={scrollerRef}
      className="absolute inset-0 flex flex-col px-4 sm:px-10 pt-20 sm:pt-28 pb-12 sm:pb-16 overflow-hidden"
    >
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col overflow-hidden">
        <div ref={innerRef} className="will-change-transform" style={{ transition: "none" }}>
          <header className="mb-6 sm:mb-8">
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="font-mono uppercase tracking-[0.32em] text-[color:var(--bronze)] mb-2 sm:mb-3"
              style={{ fontSize: "clamp(0.6rem, 1.4vmin, 0.7rem)" }}
            >
              {t.projects.eyebrow}
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-display font-bold tracking-tight"
              style={{ fontSize: "clamp(1.5rem, 4.5vmin, 2.5rem)" }}
            >
              {t.projects.headline}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.18 }}
              className="mt-2 sm:mt-3 text-[color:var(--muted)]"
              style={{ fontSize: "clamp(0.8rem, 1.3vmin, 1rem)" }}
            >
              {t.projects.sub}
            </motion.p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-5">
            {projects.map((p, i) => (
              <ProjectCard
                key={p.id}
                project={p}
                index={i}
                onLineage={p.id === "stella" ? () => setStellaOpen(true) : undefined}
              />
            ))}
          </div>
        </div>
      </div>

      <StellaModal open={stellaOpen} onClose={() => setStellaOpen(false)} />
    </div>
  );
}
