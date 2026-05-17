import { useEffect, useState } from "react";

export function useIsTouch() {
  const [touch, setTouch] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(pointer: coarse)").matches : false,
  );
  useEffect(() => {
    const mq = window.matchMedia("(pointer: coarse)");
    const handler = () => setTouch(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return touch;
}
