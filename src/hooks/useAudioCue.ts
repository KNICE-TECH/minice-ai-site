import { useCallback, useEffect, useRef, useState } from "react";
import { ambient } from "@/audio/ambientEngine";

const KEY = "minice.audio.enabled";
const EVT = "minice:audio-toggle";

function readEnabled(): boolean {
  if (typeof window === "undefined") return true;
  // Default ON — audio plays unless the user has explicitly turned it off.
  return localStorage.getItem(KEY) !== "0";
}

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
  const [enabled, setEnabled] = useState<boolean>(readEnabled);
  const ctxRef = useRef<AudioContext | null>(null);
  const bufferRef = useRef<AudioBuffer | null>(null);

  const ensure = useCallback(() => {
    if (!ctxRef.current) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
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
    const next = !readEnabled();
    try {
      localStorage.setItem(KEY, next ? "1" : "0");
    } catch {}
    if (next) {
      ensure();
      ambient.start();
    } else {
      ambient.stop();
    }
    window.dispatchEvent(new CustomEvent(EVT, { detail: next }));
  }, [ensure]);

  // Sync local state with the global flag — both the footer toggle and
  // (eventually) any other entry-point flip the same key, so every hook
  // instance hears about it.
  useEffect(() => {
    const onEvt = (e: Event) => {
      const v = (e as CustomEvent<boolean>).detail;
      setEnabled(v);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setEnabled(e.newValue === "1");
    };
    window.addEventListener(EVT, onEvt);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(EVT, onEvt);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    if (enabled) ensure();
  }, [enabled, ensure]);

  return { enabled, toggle, play };
}
