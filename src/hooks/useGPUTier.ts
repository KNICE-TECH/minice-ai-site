import { useEffect, useState } from "react";
import { getGPUTier } from "detect-gpu";

export function useGPUTier() {
  const [tier, setTier] = useState<number>(2);
  useEffect(() => {
    let cancelled = false;
    getGPUTier()
      .then((result) => {
        if (!cancelled) setTier(result.tier ?? 2);
      })
      .catch(() => {
        if (!cancelled) setTier(1);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return tier;
}
