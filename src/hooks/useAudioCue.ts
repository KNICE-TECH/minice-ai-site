import { useCallback, useEffect, useRef, useState } from "react";

const KEY = "minice.audio.enabled";

function makeShutterBuffer(ctx: AudioContext) {
  const sampleRate = ctx.sampleRate;
  const duration = 0.18;
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    const t = i / length;
    const envelope = Math.exp(-t * 18) * (t < 0.05 ? t / 0.05 : 1);
    const click = (Math.random() * 2 - 1) * (t < 0.02 ? 1 : 0.2);
    const body = Math.sin(2 * Math.PI * 180 * (i / sampleRate)) * 0.35;
    data[i] = (click * 0.6 + body * 0.4) * envelope * 0.45;
  }
  return buffer;
}

export function useAudioCue() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(KEY) === "1";
  });
  const ctxRef = useRef<AudioContext | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);

  const ensure = useCallback(() => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      ctxRef.current = new AC();
      bufferRef.current = makeShutterBuffer(ctxRef.current);
    }
    if (ctxRef.current.state === "suspended") ctxRef.current.resume();
  }, []);

  const play = useCallback(() => {
    if (!enabled || !ctxRef.current || !bufferRef.current) return;
    const ctx = ctxRef.current;
    const src = ctx.createBufferSource();
    src.buffer = bufferRef.current;
    const gain = ctx.createGain();
    gain.gain.value = 0.7;
    src.connect(gain).connect(ctx.destination);
    src.start();
  }, [enabled]);

  const toggle = useCallback(() => {
    setEnabled((v) => {
      const next = !v;
      try {
        localStorage.setItem(KEY, next ? "1" : "0");
      } catch {}
      if (next) ensure();
      return next;
    });
  }, [ensure]);

  useEffect(() => {
    if (enabled) ensure();
  }, [enabled, ensure]);

  return { enabled, toggle, play };
}
