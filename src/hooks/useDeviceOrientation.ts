import { useEffect, useRef } from "react";

export type Orientation = {
  /** Left-right tilt in degrees, -90 (left) to 90 (right) */
  gamma: number;
  /** Front-back tilt in degrees, -180 to 180 */
  beta: number;
  /** True once a real deviceorientation event has arrived */
  active: boolean;
};

type IOSDeviceOrientationEvent = typeof DeviceOrientationEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

/**
 * Live device orientation values, refreshed on every event.
 * On iOS Safari 13+ permission must be requested from a user gesture —
 * we wire a one-time tap listener on document for that.
 */
export function useDeviceOrientation() {
  const ref = useRef<Orientation>({ gamma: 0, beta: 0, active: false });

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("DeviceOrientationEvent" in window)) return;

    const handle = (e: DeviceOrientationEvent) => {
      if (e.gamma == null && e.beta == null) return;
      ref.current.gamma = e.gamma ?? 0;
      ref.current.beta = e.beta ?? 0;
      ref.current.active = true;
    };

    const attach = () => {
      window.addEventListener("deviceorientation", handle, true);
    };

    const Cls = window.DeviceOrientationEvent as IOSDeviceOrientationEvent;
    if (typeof Cls.requestPermission === "function") {
      // iOS — needs a user gesture before we can subscribe.
      const onFirstTap = () => {
        Cls.requestPermission!()
          .then((state) => {
            if (state === "granted") attach();
          })
          .catch(() => {});
        document.removeEventListener("touchend", onFirstTap);
        document.removeEventListener("click", onFirstTap);
      };
      document.addEventListener("touchend", onFirstTap, { once: true });
      document.addEventListener("click", onFirstTap, { once: true });
      return () => {
        document.removeEventListener("touchend", onFirstTap);
        document.removeEventListener("click", onFirstTap);
        window.removeEventListener("deviceorientation", handle, true);
      };
    }

    attach();
    return () => window.removeEventListener("deviceorientation", handle, true);
  }, []);

  return ref;
}
