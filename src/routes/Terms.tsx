import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "@/hooks/useI18n";
import { applyMeta, seo } from "@/lib/seo";

export default function Terms() {
  const { t } = useI18n();
  useEffect(() => applyMeta(seo.terms), []);
  return (
    <main className="relative z-10 min-h-screen px-6 sm:px-10 py-32">
      <div className="max-w-2xl mx-auto">
        <Link
          to="/"
          className="font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted)] hover:text-[color:var(--cream)] transition"
        >
          ← home
        </Link>
        <h1 className="mt-8 font-display font-bold text-4xl sm:text-5xl">{t.terms.title}</h1>
        <p className="mt-8 text-[color:var(--cream)]/80 leading-relaxed">{t.terms.body}</p>
      </div>
    </main>
  );
}
