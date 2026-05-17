import { motion } from "framer-motion";
import { socials } from "@/data/socials";
import { useI18n } from "@/hooks/useI18n";
import { useIsMobile } from "@/hooks/useIsMobile";

export function Contact() {
  const { t } = useI18n();
  const mobile = useIsMobile();

  if (mobile) {
    return (
      <section id="contact" className="relative w-full px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.5 }}
            className="font-mono uppercase tracking-[0.32em] text-[color:var(--bronze)] mb-2"
            style={{ fontSize: "0.62rem" }}
          >
            {t.contact.eyebrow}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display font-bold tracking-tight"
            style={{ fontSize: "1.75rem" }}
          >
            {t.contact.headline}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.6, delay: 0.18 }}
            className="mt-1.5 text-[color:var(--muted)] mb-4"
            style={{ fontSize: "0.85rem" }}
          >
            {t.contact.sub}
          </motion.p>
          <ul className="divide-y divide-[color:var(--ink-3)] border-y border-[color:var(--ink-3)]">
            {socials.map((s, i) => (
              <motion.li
                key={s.id}
                initial={{ opacity: 0, x: -6 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-5%" }}
                transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
              >
                <a
                  href={s.href}
                  target={s.id === "email" ? undefined : "_blank"}
                  rel="noreferrer noopener"
                  className="group flex items-center justify-between py-3 hover:bg-white/[0.02] transition px-2 -mx-2 rounded gap-3"
                >
                  <span
                    className="font-mono uppercase tracking-[0.22em] text-[color:var(--muted)] w-14 flex-shrink-0"
                    style={{ fontSize: "0.6rem" }}
                  >
                    {s.label}
                  </span>
                  <span
                    className="font-display text-[color:var(--cream)] truncate text-right flex-1"
                    style={{ fontSize: "1rem" }}
                  >
                    {s.handle}
                  </span>
                  <span className="font-mono text-xs text-[color:var(--muted)] flex-shrink-0">→</span>
                </a>
              </motion.li>
            ))}
          </ul>
        </div>
      </section>
    );
  }

  return (
    <section
      id="contact"
      className="relative w-full"
      style={{ height: "120dvh" }}
    >
      <div
        className="sticky top-0 w-full overflow-hidden"
        style={{ height: "100dvh", transform: "translateZ(0)" }}
      >
        <div className="absolute inset-0 px-4 sm:px-10 flex items-end md:items-center pb-12 sm:pb-16 md:pb-0 pt-20 md:pt-0">
          <div className="max-w-6xl mx-auto w-full">
            <div className="max-w-2xl mx-auto md:mx-0 text-center md:text-left">
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-15%" }}
                transition={{ duration: 0.5 }}
                className="font-mono uppercase tracking-[0.32em] text-[color:var(--bronze)] mb-2 sm:mb-3"
                style={{ fontSize: "clamp(0.6rem, 1.4vmin, 0.7rem)" }}
              >
                {t.contact.eyebrow}
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-15%" }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-display font-bold tracking-tight"
                style={{ fontSize: "clamp(1.6rem, 5.5vmin, 3.75rem)" }}
              >
                {t.contact.headline}
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-15%" }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-2 text-[color:var(--muted)] mb-3 sm:mb-8"
                style={{ fontSize: "clamp(0.75rem, 1.4vmin, 1rem)" }}
              >
                {t.contact.sub}
              </motion.p>

              <ul className="divide-y divide-[color:var(--ink-3)] border-y border-[color:var(--ink-3)] text-left">
                {socials.map((s, i) => (
                  <motion.li
                    key={s.id}
                    initial={{ opacity: 0, x: -6 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-10%" }}
                    transition={{ duration: 0.4, delay: 0.12 + i * 0.06 }}
                  >
                    <a
                      href={s.href}
                      target={s.id === "email" ? undefined : "_blank"}
                      rel="noreferrer noopener"
                      className="group flex items-center justify-between py-2.5 sm:py-4 hover:bg-white/[0.02] transition px-2 -mx-2 rounded gap-3"
                    >
                      <span
                        className="font-mono uppercase tracking-[0.22em] text-[color:var(--muted)] group-hover:text-[color:var(--bronze)] transition w-14 sm:w-20 flex-shrink-0"
                        style={{ fontSize: "clamp(0.6rem, 1.2vmin, 0.7rem)" }}
                      >
                        {s.label}
                      </span>
                      <span
                        className="font-display text-[color:var(--cream)] truncate text-center flex-1"
                        style={{ fontSize: "clamp(0.95rem, 1.8vmin, 1.5rem)" }}
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
      </div>
    </section>
  );
}
