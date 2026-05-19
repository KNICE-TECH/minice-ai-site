import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ProjectCard } from "@/components/ProjectCard";
import { AstraFeatureCard } from "@/components/AstraFeatureCard";
import { StellaModal } from "@/components/StellaModal";
import { projects } from "@/data/projects";
import { useI18n } from "@/hooks/useI18n";

// Natural document flow — NO sticky pinning, NO fixed 100dvh container.
// Earlier revisions pinned this section inside a 100/120/240dvh sticky child
// with `overflow-hidden`; that repeatedly clipped the bottom row of cards
// whenever viewport height < content height. The section now sizes itself to
// its content + padding, so cards can never be cut off, regardless of
// viewport size or how much content lives inside.
export function Projects() {
  const { t } = useI18n();
  const [stellaOpen, setStellaOpen] = useState(false);

  const astra = useMemo(() => projects.find((p) => p.id === "astra"), []);
  const rest = useMemo(() => projects.filter((p) => p.id !== "astra"), []);

  return (
    <section
      id="projects"
      className="relative w-full px-4 sm:px-10 py-16 sm:py-24 lg:py-28"
    >
      <div className="max-w-6xl mx-auto w-full">
        <header className="mb-6 sm:mb-8">
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.5 }}
            className="font-mono uppercase tracking-[0.32em] text-[color:var(--bronze)] mb-2 sm:mb-3"
            style={{ fontSize: "clamp(0.6rem, 1.4vmin, 0.7rem)" }}
          >
            {t.projects.eyebrow}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display font-bold tracking-tight"
            style={{ fontSize: "clamp(1.5rem, 4.5vmin, 2.5rem)" }}
          >
            {t.projects.headline}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mt-2 sm:mt-3 text-[color:var(--muted)]"
            style={{ fontSize: "clamp(0.85rem, 1.3vmin, 1rem)" }}
          >
            {t.projects.sub}
          </motion.p>
        </header>

        {astra && (
          <div className="mb-5 sm:mb-6">
            <AstraFeatureCard project={astra} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-5">
          {rest.map((p, i) => (
            <ProjectCard
              key={p.id}
              project={p}
              index={i}
              onLineage={p.id === "stella" ? () => setStellaOpen(true) : undefined}
            />
          ))}
        </div>
      </div>

      <StellaModal open={stellaOpen} onClose={() => setStellaOpen(false)} />
    </section>
  );
}
