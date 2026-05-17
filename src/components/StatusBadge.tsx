import type { ProjectStatus } from "@/data/projects";
import { useI18n } from "@/hooks/useI18n";

const TONE: Record<ProjectStatus, string> = {
  live: "bg-[color:var(--bronze)]/15 text-[color:var(--bronze)] border-[color:var(--bronze)]/40",
  "in-dev": "bg-[color:var(--bronze)]/10 text-[color:var(--bronze)] border-[color:var(--bronze)]/30",
  retired: "bg-[color:var(--muted)]/10 text-[color:var(--muted)] border-[color:var(--muted)]/30",
  "coming-soon": "bg-white/5 text-[color:var(--cream)]/55 border-white/10",
};

export function StatusBadge({ status }: { status: ProjectStatus }) {
  const { t } = useI18n();
  const dot =
    status === "live" || status === "in-dev"
      ? "bg-[color:var(--bronze)]"
      : status === "retired"
        ? "bg-[color:var(--muted)]"
        : "bg-white/30";
  return (
    <span
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full border font-mono text-[10px] uppercase tracking-[0.12em] ${TONE[status]}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dot} ${status === "live" || status === "in-dev" ? "animate-pulse" : ""}`} />
      {t.projects.status[status]}
    </span>
  );
}
