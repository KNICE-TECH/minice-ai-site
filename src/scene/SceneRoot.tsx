import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Environment } from "@react-three/drei";
import { ApertureRig } from "./ApertureRig";
import { CameraRig } from "./cameraRig";
import { PostFX } from "./PostFX";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useGPUTier } from "@/hooks/useGPUTier";
import { useProgressStore } from "@/scroll/progressStore";
import { smoothstep, lerp } from "@/lib/math";

export function SceneRoot() {
  const reduced = useReducedMotion();
  const tier = useGPUTier();
  const lowEnd = tier <= 1;
  const isHome = useLocation().pathname === "/";
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!reduced) return;
    useProgressStore.getState().set(0);
  }, [reduced]);

  // Blur the whole 3D canvas while project cards are visible so they pop above
  // the busy mark. Subscribed via DOM ref to avoid re-renders.
  useEffect(() => {
    if (!isHome) return;
    const apply = (p: number) => {
      const el = wrapRef.current;
      if (!el) return;
      // Ramp up around the Projects stage [0.25–0.55].
      const blurAmt =
        smoothstep(0.22, 0.3, p) * (1 - smoothstep(0.5, 0.58, p)) * 14; // up to 14px
      const dim = lerp(1, 0.55, smoothstep(0.22, 0.32, p) * (1 - smoothstep(0.5, 0.58, p)));
      el.style.filter = blurAmt > 0.1 ? `blur(${blurAmt.toFixed(2)}px)` : "none";
      el.style.opacity = String(dim);
    };
    apply(useProgressStore.getState().progress);
    return useProgressStore.subscribe((s) => apply(s.progress));
  }, [isHome]);

  return (
    <div
      ref={wrapRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 50%, #141414 0%, #0a0a0a 70%)",
        opacity: isHome ? 1 : 0.18,
        filter: isHome ? "none" : "blur(2px)",
        transform: isHome ? "none" : "translateX(20%)",
        transition: isHome
          ? "filter 240ms ease, opacity 240ms ease"
          : "opacity 600ms ease, filter 600ms ease, transform 600ms ease",
      }}
    >
      <Canvas
        dpr={lowEnd ? 1 : [1, 2]}
        frameloop={reduced ? "never" : "always"}
        camera={{ position: [0, 0, 5.2], fov: 35, near: 0.1, far: 50 }}
        gl={{ antialias: !lowEnd, powerPreference: "high-performance" }}
      >
        <color attach="background" args={["#0a0a0a"]} />
        <Environment preset="apartment" environmentIntensity={0.35} />
        <hemisphereLight args={["#fff5e3", "#e8a87c", 0.35]} />
        <pointLight position={[2.5, 1.8, 4]} intensity={22} distance={10} decay={1.4} color="#fff1de" />
        <pointLight position={[-2.5, -1.5, 4]} intensity={16} distance={10} decay={1.4} color="#e8a87c" />
        <ambientLight intensity={0.25} color="#f5f4f1" />
        <Suspense fallback={null}>
          <ApertureRig />
        </Suspense>
        <CameraRig />
        {!lowEnd && !reduced && <PostFX />}
      </Canvas>
    </div>
  );
}
