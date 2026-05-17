import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/hooks/useI18n";
import { useAudioCue } from "@/hooks/useAudioCue";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useIsMobile } from "@/hooks/useIsMobile";

export function Hero() {
  const { t } = useI18n();
  const audio = useAudioCue();
  const p = useScrollProgress();
  const mobile = useIsMobile();
  const fired = useRef(false);

  useEffect(() => {
    if (!fired.current && p > 0.18 && p < 0.3) {
      fired.current = true;
      audio.play();
    }
    if (p < 0.1) fired.current = false;
  }, [p, audio]);

  if (mobile) {
    return (
      <section id="hero" className="relative w-full" style={{ minHeight: "100dvh" }}>
        <div className="flex flex-col items-center px-4 pt-16 pb-10">
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="font-mono uppercase tracking-[0.32em] text-[color:var(--bronze)] text-center mb-[55dvh]"
            style={{ fontSize: "0.62rem" }}
          >
            {t.hero.eyebrow}
          </motion.p>
          <div className="w-full max-w-md mx-auto text-center">
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
              className="font-display font-bold leading-[1.1] whitespace-pre-line tracking-tight"
              style={{ fontSize: "1.75rem" }}
            >
              {t.hero.headline}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.55 }}
              className="mt-3 mx-auto text-[color:var(--cream)]/65 leading-relaxed"
              style={{ fontSize: "0.85rem" }}
            >
              {t.hero.sub}
            </motion.p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="hero"
      className="relative w-full"
      style={{ height: "100dvh" }}
    >
      <div className="absolute inset-0 flex flex-col items-center px-4 sm:px-10"
           style={{ paddingTop: "clamp(3rem, 9vmin, 7rem)", paddingBottom: "clamp(3rem, 6vh, 5rem)" }}>
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="font-mono uppercase tracking-[0.32em] text-[color:var(--bronze)] text-center"
          style={{ fontSize: "clamp(0.55rem, 1.3vmin, 0.7rem)" }}
        >
          {t.hero.eyebrow}
        </motion.p>

        {/* Mark area (lives in fixed canvas behind) */}
        <div className="flex-1" aria-hidden="true" />

        <div className="w-full max-w-3xl mx-auto text-center px-6">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            className="font-display font-bold leading-[1.05] whitespace-pre-line tracking-tight"
            style={{ fontSize: "clamp(1.25rem, 5.2vmin, 4rem)" }}
          >
            {t.hero.headline}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.55 }}
            className="max-w-xl mx-auto text-[color:var(--cream)]/65 leading-relaxed"
            style={{ marginTop: "clamp(0.5rem, 1.6vmin, 1.5rem)", fontSize: "clamp(0.78rem, 1.6vmin, 1.125rem)" }}
          >
            {t.hero.sub}
          </motion.p>
        </div>
      </div>
    </section>
  );
}
