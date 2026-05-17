import { Link } from "react-router-dom";
import { useI18n } from "@/hooks/useI18n";
import { useAudioCue } from "@/hooks/useAudioCue";

export function Footer() {
  const { t, locale, toggle } = useI18n();
  const audio = useAudioCue();

  return (
    <footer
      className="fixed bottom-0 inset-x-0 z-30 pointer-events-none"
      style={{
        backdropFilter: "blur(10px) saturate(120%)",
        WebkitBackdropFilter: "blur(10px) saturate(120%)",
        background: "linear-gradient(to top, rgba(10,10,10,0.55), rgba(10,10,10,0))",
        maskImage: "linear-gradient(to top, #000 55%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to top, #000 55%, transparent 100%)",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 sm:px-10 py-4 flex items-center justify-between gap-6">
        <span className="pointer-events-auto font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--muted)]/70">
          {t.footer.copyright}
        </span>
        <div className="pointer-events-auto flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--muted)]/70">
          <Link to="/privacy" className="hover:text-[color:var(--cream)] transition">
            {t.footer.privacy}
          </Link>
          <Link to="/terms" className="hover:text-[color:var(--cream)] transition">
            {t.footer.terms}
          </Link>
          <button
            type="button"
            onClick={audio.toggle}
            className="hover:text-[color:var(--cream)] transition"
            aria-pressed={audio.enabled}
          >
            {t.footer.audio} · {audio.enabled ? t.footer.audioOn : t.footer.audioOff}
          </button>
          <button
            type="button"
            onClick={toggle}
            className="hover:text-[color:var(--cream)] transition"
            aria-label="Toggle language"
          >
            {t.footer.lang} · {locale.toUpperCase()}
          </button>
        </div>
      </div>
    </footer>
  );
}
