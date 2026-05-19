import { useEffect } from "react";
import { ambient } from "./ambientEngine";
import { useProgressStore } from "@/scroll/progressStore";
import { bootSignal } from "@/lib/bootSignal";

const KEY = "minice.audio.enabled";

export function AmbientBridge() {
  // Strategy: try to autoplay the moment the page is ready. Browsers that
  // allow it (cached Media Engagement Index, returning visitors, etc.) get
  // music immediately. Browsers that block autoplay get a persistent gesture
  // fallback that keeps retrying on every user interaction until playback
  // actually starts — so a click that happens AFTER initial load still kicks
  // it in, instead of being missed by a one-shot listener.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(KEY) === "0") return;

    let cancelled = false;
    const events = [
      "pointerdown",
      "keydown",
      "touchstart",
      "wheel",
      "click",
    ] as const;

    const cleanup: Array<() => void> = [];
    const removeGestures = () => {
      for (const e of events) window.removeEventListener(e, onGesture);
    };

    const tryStart = async () => {
      if (cancelled) return;
      await ambient.start();
      if (ambient.isStarted) removeGestures();
    };

    const onGesture = () => {
      void tryStart();
    };

    // Preload + decode the MP3 immediately so the first successful start()
    // is instant (no fetch/decode pause).
    void ambient.preload();

    // Attempt right away. May silently fail if autoplay is blocked.
    void tryStart();

    // Attempt again the moment the boot splash signals ready — by then the
    // page has fully painted and we may have a fresh shot at autoplay.
    const unsubBoot = bootSignal.subscribe(() => {
      if (bootSignal.get().ready) void tryStart();
    });
    cleanup.push(unsubBoot);

    // Persistent gesture listeners — NOT { once: true }. They self-remove
    // only once ambient.isStarted flips true, so a click that lands minutes
    // after page load still starts the bed.
    for (const e of events) {
      window.addEventListener(e, onGesture, { passive: true });
    }
    cleanup.push(removeGestures);

    return () => {
      cancelled = true;
      for (const fn of cleanup) fn();
    };
  }, []);

  // Scroll progress -> filter cutoff. Opens the veil as the user moves through
  // the page, closes it again at the bottom.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const p = useProgressStore.getState().progress; // 0..1
      // Bell shape — quiet at the edges, fullest around the projects/about band.
      const bell = 1 - Math.abs(p - 0.55) * 1.8;
      ambient.setIntensity(Math.max(0, Math.min(1, bell)));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Tab hidden -> fade out so we're not droning into nothing.
  useEffect(() => {
    const onVis = () => {
      if (document.hidden) {
        ambient.stop();
      } else if (localStorage.getItem(KEY) !== "0") {
        ambient.start();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return null;
}
