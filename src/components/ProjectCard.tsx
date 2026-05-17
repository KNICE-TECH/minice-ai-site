import { motion } from "framer-motion";
import type { Project } from "@/data/projects";
import { StatusBadge } from "./StatusBadge";
import { useI18n } from "@/hooks/useI18n";

type Props = { project: Project; onLineage?: () => void; index: number };

export function ProjectCard({ project, onLineage, index }: Props) {
  const { t } = useI18n();
  const locked = project.status === "coming-soon";

  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.7, delay: index * 0.08, ease: [0.2, 0.8, 0.2, 1] }}
      whileHover={{ y: -6 }}
      className={`group relative overflow-hidden rounded-2xl border border-white/8 bg-[color:var(--ink-2)]/60 backdrop-blur-md p-4 sm:p-7 ${locked ? "" : "hover:border-[color:var(--bronze)]/50"} transition-colors`}
    >
      <div className="flex items-center justify-between mb-3 sm:mb-6">
        <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
          /{project.id}
        </span>
        <StatusBadge status={project.status} />
      </div>

      <h3
        className={`font-display font-bold mb-2 sm:mb-3 ${locked ? "blur-sm select-none" : ""}`}
        style={{ fontSize: "clamp(1.5rem, 3vw, 2.25rem)" }}
      >
        {project.name}
      </h3>
      <p
        className={`text-[color:var(--cream)]/80 text-sm sm:text-base mb-2 sm:mb-4 ${locked ? "blur-[2px]" : ""}`}
      >
        {project.tagline}
      </p>
      <p
        className={`text-[color:var(--muted)] text-xs sm:text-sm leading-relaxed mb-4 sm:mb-7 line-clamp-3 sm:line-clamp-none ${locked ? "blur-[3px] select-none" : ""}`}
      >
        {project.blurb}
      </p>

      <div className="flex items-center gap-3">
        {project.href && !locked && (
          <a
            href={project.href}
            target={project.external ? "_blank" : undefined}
            rel={project.external ? "noreferrer noopener" : undefined}
            className="btn-ghost"
          >
            {t.projects.learnMore} →
          </a>
        )}
        {project.id === "stella" && onLineage && (
          <button type="button" onClick={onLineage} className="btn-ghost">
            {t.projects.lineage}
          </button>
        )}
        {locked && (
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">
            {t.projects.locked}
          </span>
        )}
      </div>

      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-transparent group-hover:ring-[color:var(--bronze)]/20 transition" />
    </motion.article>
  );
}
