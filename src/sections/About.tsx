import { motion } from "framer-motion";
import { useI18n } from "@/hooks/useI18n";
import { useIsMobile } from "@/hooks/useIsMobile";

export function About() {
  const { t } = useI18n();
  const mobile = useIsMobile();

  if (mobile) {
    return (
      <section id="about" className="relative w-full px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.5 }}
            className="font-mono uppercase tracking-[0.32em] text-[color:var(--bronze)] mb-2"
            style={{ fontSize: "0.62rem" }}
          >
            {t.about.eyebrow}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display font-bold tracking-tight leading-[1.1] mb-4"
            style={{ fontSize: "1.55rem" }}
          >
            {t.about.headline}
          </motion.h2>
          <div className="space-y-3">
            {t.about.body.map((p, i) => (
              <motion.p
                key={p}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-10%" }}
                transition={{ duration: 0.5, delay: 0.15 + i * 0.08 }}
                className="text-[color:var(--cream)]/80 leading-relaxed"
                style={{ fontSize: "0.9rem" }}
              >
                {p}
              </motion.p>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="about"
      className="relative w-full"
      style={{ height: "120svh" }}
    >
      <div
        className="sticky top-0 w-full overflow-hidden"
        style={{ height: "100svh", transform: "translateZ(0)" }}
      >
        <div className="absolute inset-0 px-4 sm:px-10 flex items-end md:items-center pb-12 sm:pb-16 md:pb-0 pt-20 md:pt-0">
          <div className="max-w-6xl mx-auto w-full">
            <div className="max-w-2xl mx-auto md:mx-0 text-center md:text-left">
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-15%" }}
                transition={{ duration: 0.5 }}
                className="font-mono uppercase tracking-[0.32em] text-[color:var(--bronze)] mb-3"
                style={{ fontSize: "clamp(0.6rem, 1.4vmin, 0.7rem)" }}
              >
                {t.about.eyebrow}
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-15%" }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="font-display font-bold tracking-tight leading-[1.1] mb-4 sm:mb-8"
                style={{ fontSize: "clamp(1.4rem, 4.5vmin, 3rem)" }}
              >
                {t.about.headline}
              </motion.h2>
              <div className="space-y-3 sm:space-y-5">
                {t.about.body.map((p, i) => (
                  <motion.p
                    key={p}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-15%" }}
                    transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
                    className="text-[color:var(--cream)]/80 leading-relaxed"
                    style={{ fontSize: "clamp(0.85rem, 1.4vmin, 1.125rem)" }}
                  >
                    {p}
                  </motion.p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
