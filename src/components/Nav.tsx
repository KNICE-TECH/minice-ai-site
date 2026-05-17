import { Link, useLocation } from "react-router-dom";
import { Wordmark } from "./Wordmark";
import { ApertureSVG } from "./ApertureSVG";
import { useI18n } from "@/hooks/useI18n";
import { scrollTo } from "@/scroll/Lenis";

export function Nav() {
  const { t } = useI18n();
  const isHome = useLocation().pathname === "/";

  const jumpTo = (selector: string) => () => {
    if (!isHome) return;
    scrollTo(selector, { offset: 0 });
  };

  return (
    <nav
      className="fixed top-0 inset-x-0 z-40 pointer-events-none"
      style={{
        backdropFilter: "blur(10px) saturate(120%)",
        WebkitBackdropFilter: "blur(10px) saturate(120%)",
        background: "linear-gradient(to bottom, rgba(10,10,10,0.55), rgba(10,10,10,0))",
        maskImage: "linear-gradient(to bottom, #000 55%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to bottom, #000 55%, transparent 100%)",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 sm:px-10 py-5 flex items-center justify-between">
        <Link
          to="/"
          onClick={(e) => {
            if (isHome) {
              e.preventDefault();
              scrollTo(0);
            }
          }}
          className="pointer-events-auto flex items-center gap-2.5"
        >
          <ApertureSVG size={26} />
          <Wordmark size="sm" />
        </Link>
        <ul className="pointer-events-auto hidden sm:flex items-center gap-7 font-mono text-[11px] uppercase tracking-[0.22em] text-[color:var(--muted)]">
          <li>
            <button type="button" onClick={jumpTo("#projects")} className="hover:text-[color:var(--cream)] transition">
              {t.nav.work}
            </button>
          </li>
          <li>
            <button type="button" onClick={jumpTo("#about")} className="hover:text-[color:var(--cream)] transition">
              {t.nav.about}
            </button>
          </li>
          <li>
            <button type="button" onClick={jumpTo("#contact")} className="hover:text-[color:var(--cream)] transition">
              {t.nav.contact}
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
