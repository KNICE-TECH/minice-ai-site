import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import { useI18n } from "@/hooks/useI18n";

type Props = { open: boolean; onClose: () => void };

export function StellaModal({ open, onClose }: Props) {
  const { t } = useI18n();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
            className="relative max-w-xl w-full rounded-2xl border border-[color:var(--ink-3)] bg-[color:var(--ink-2)] p-8"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Stella lineage"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-2xl">{t.stellaModal.title}</h3>
              <button
                type="button"
                onClick={onClose}
                className="font-mono text-xs uppercase tracking-[0.18em] text-[color:var(--muted)] hover:text-[color:var(--cream)] transition"
              >
                {t.stellaModal.close} ✕
              </button>
            </div>
            <div className="space-y-4">
              {t.stellaModal.body.map((p) => (
                <p key={p} className="text-[color:var(--cream)]/80 leading-relaxed">
                  {p}
                </p>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
