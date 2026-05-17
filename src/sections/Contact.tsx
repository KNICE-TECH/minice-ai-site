import { useRef } from "react";
import { motion } from "framer-motion";
import { socials } from "@/data/socials";
import { useI18n } from "@/hooks/useI18n";
import { useInnerScroll } from "@/hooks/useInnerScroll";

export function Contact() {
  const { t } = useI18n();
  const scrollRef = useRef<HTMLDivElement>(null);
  useInnerScroll(scrollRef);

  return (
    <div className="absolute inset-0 px-6 sm:px-10">
      <div
        ref={scrollRef}
        className="absolute inset-x-0 md:!top-0 md:flex md:items-center max-w-6xl mx-auto px-2 sm:px-6 overflow-y-auto"
        style={{ top: "52vh", bottom: "5.5rem" }}
      >
        <div className="max-w-2xl mx-auto md:mx-0 text-center md:text-left w-full">
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="font-mono uppercase tracking-[0.32em] text-[color:var(--bronze)] mb-2 sm:mb-3"
            style={{ fontSize: "clamp(0.6rem, 1.4vmin, 0.7rem)" }}
          >
            {t.contact.eyebrow}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display font-bold tracking-tight"
            style={{ fontSize: "clamp(1.5rem, 5.2vmin, 3.5rem)" }}
          >
            {t.contact.headline}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-2 text-[color:var(--muted)] mb-3 sm:mb-8"
            style={{ fontSize: "clamp(0.7rem, 1.4vmin, 1rem)" }}
          >
            {t.contact.sub}
          </motion.p>

          <ul className="divide-y divide-[color:var(--ink-3)] border-y border-[color:var(--ink-3)] text-left">
            {socials.map((s, i) => (
              <motion.li
                key={s.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.12 + i * 0.06 }}
              >
                <a
                  href={s.href}
                  target={s.id === "email" ? undefined : "_blank"}
                  rel="noreferrer noopener"
                  className="group flex items-center justify-between py-2 sm:py-4 hover:bg-white/[0.02] transition px-2 -mx-2 rounded gap-3"
                >
                  <span className="font-mono uppercase tracking-[0.22em] text-[color:var(--muted)] group-hover:text-[color:var(--bronze)] transition w-12 sm:w-20 flex-shrink-0" style={{ fontSize: "clamp(0.55rem, 1.2vmin, 0.7rem)" }}>
                    {s.label}
                  </span>
                  <span
                    className="font-display text-[color:var(--cream)] truncate text-center flex-1"
                    style={{ fontSize: "clamp(0.85rem, 1.7vmin, 1.5rem)" }}
                  >
                    {s.handle}
                  </span>
                  <span className="font-mono text-xs sm:text-sm text-[color:var(--muted)] group-hover:text-[color:var(--bronze)] group-hover:translate-x-1 transition flex-shrink-0">
                    →
                  </span>
                </a>
              </motion.li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
