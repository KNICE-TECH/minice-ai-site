import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ApertureSVG } from "@/components/ApertureSVG";
import { useI18n } from "@/hooks/useI18n";
import { applyMeta, seo } from "@/lib/seo";

export default function NotFound() {
  const { t } = useI18n();
  useEffect(() => applyMeta(seo.notFound), []);
  return (
    <main className="relative z-10 min-h-screen flex items-center justify-center px-6">
      <div className="text-center">
        <div className="inline-flex"><ApertureSVG size={72} spin /></div>
        <h1 className="mt-10 font-display font-bold text-4xl sm:text-6xl">{t.notFound.headline}</h1>
        <p className="mt-5 text-[color:var(--muted)] max-w-md mx-auto">{t.notFound.body}</p>
        <Link to="/" className="btn-ghost mt-10 inline-flex">
          ← {t.notFound.cta}
        </Link>
      </div>
    </main>
  );
}
