import { useRef } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/hooks/useI18n";
import { useInnerScroll } from "@/hooks/useInnerScroll";

export function About() {
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
            className="font-mono uppercase tracking-[0.32em] text-[color:var(--bronze)] mb-3"
            style={{ fontSize: "clamp(0.6rem, 1.4vmin, 0.7rem)" }}
          >
            {t.about.eyebrow}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-display font-bold tracking-tight leading-[1.1] mb-4 sm:mb-8"
            style={{ fontSize: "clamp(1.35rem, 4.5vmin, 3rem)" }}
          >
            {t.about.headline}
          </motion.h2>
          <div className="space-y-3 sm:space-y-5">
            {t.about.body.map((p, i) => (
              <motion.p
                key={p}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
                className="text-[color:var(--cream)]/80 leading-relaxed"
                style={{ fontSize: "clamp(0.8rem, 1.4vmin, 1.125rem)" }}
              >
                {p}
              </motion.p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
