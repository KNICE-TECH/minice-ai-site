import { useEffect, useState } from "react";

// Mobile breakpoint: ≤ 768px width. We use width rather than touch alone so
// touchscreen laptops still get the desktop scroll-jacked experience.
const QUERY = "(max-width: 768px)";

export function useIsMobile() {
  const [mobile, setMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia(QUERY).matches : false,
  );
  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const handler = () => setMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return mobile;
}
