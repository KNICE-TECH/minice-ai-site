import { useCallback, useEffect, useState } from "react";
import { copy, type Locale } from "@/data/copy";

const KEY = "minice.locale";

function detect(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem(KEY) as Locale | null;
  if (stored === "en" || stored === "ru") return stored;
  return navigator.language?.toLowerCase().startsWith("ru") ? "ru" : "en";
}

const listeners = new Set<(l: Locale) => void>();
let current: Locale = typeof window !== "undefined" ? detect() : "en";

export function useI18n() {
  const [locale, setLocale] = useState<Locale>(current);

  useEffect(() => {
    const handler = (l: Locale) => setLocale(l);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  const toggle = useCallback(() => {
    current = current === "en" ? "ru" : "en";
    try {
      localStorage.setItem(KEY, current);
      document.documentElement.lang = current;
    } catch {}
    listeners.forEach((fn) => fn(current));
  }, []);

  const set = useCallback((l: Locale) => {
    current = l;
    try {
      localStorage.setItem(KEY, current);
      document.documentElement.lang = current;
    } catch {}
    listeners.forEach((fn) => fn(current));
  }, []);

  return { locale, t: copy[locale], toggle, set };
}
