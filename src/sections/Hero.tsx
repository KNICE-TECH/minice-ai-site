import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/hooks/useI18n";
import { useAudioCue } from "@/hooks/useAudioCue";
import { useScrollProgress } from "@/hooks/useScrollProgress";
import { useInnerScroll } from "@/hooks/useInnerScroll";

export function Hero() {
  const { t } = useI18n();
  const audio = useAudioCue();
  const p = useScrollProgress();
  const fired = useRef(false);
  const textRef = useRef<HTMLDivElement>(null);
  useInnerScroll(textRef);

  useEffect(() => {
    if (!fired.current && p > 0.18 && p < 0.3) {
      fired.current = true;
      audio.play();
    }
    if (p < 0.1) fired.current = false;
  }, [p, audio]);

  return (
    <div className="absolute inset-0 px-4 sm:px-10">
      {/* Eyebrow — absolutely positioned at top */}
      <motion.p
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="absolute inset-x-0 font-mono uppercase tracking-[0.32em] text-[color:var(--bronze)] text-center"
        style={{ top: "clamp(2rem, 6vmin, 4rem)", fontSize: "clamp(0.55rem, 1.3vmin, 0.7rem)" }}
      >
        {t.hero.eyebrow}
      </motion.p>

      {/* Headline + sub — top calc'd to sit below mark, bottom clears the fixed footer.
          Container scrolls internally if content overflows on tiny viewports. */}
      <div
        ref={textRef}
        className="absolute inset-x-0 max-w-3xl mx-auto text-center px-6 overflow-y-auto"
        style={{
          top: "calc(50% + clamp(2.2rem, 22vmin, 14rem))",
          bottom: "clamp(3.5rem, 6vh, 5rem)",
        }}
      >
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
          className="font-display font-bold leading-[1.05] whitespace-pre-line tracking-tight"
          style={{ fontSize: "clamp(1.1rem, 5.2vmin, 4rem)" }}
        >
          {t.hero.headline}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.55 }}
          className="max-w-xl mx-auto text-[color:var(--cream)]/65 leading-relaxed"
          style={{ marginTop: "clamp(0.4rem, 1.4vmin, 1.5rem)", fontSize: "clamp(0.7rem, 1.5vmin, 1.125rem)" }}
        >
          {t.hero.sub}
        </motion.p>
      </div>
    </div>
  );
}
