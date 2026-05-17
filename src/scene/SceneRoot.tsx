import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Environment } from "@react-three/drei";
import { ApertureRig } from "./ApertureRig";
import { CameraRig } from "./cameraRig";
import { PostFX } from "./PostFX";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useGPUTier } from "@/hooks/useGPUTier";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useProgressStore } from "@/scroll/progressStore";

export function SceneRoot() {
  const reduced = useReducedMotion();
  const tier = useGPUTier();
  const lowEnd = tier <= 1;
  const mobile = useIsMobile();
  const isHome = useLocation().pathname === "/";
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!reduced) return;
    useProgressStore.getState().set(0);
  }, [reduced]);

  // Mobile home: the 3D mark stays crisp through Hero and Projects (Project
  // cards already provide their own backdrop-blur for separation). Once the
  // user scrolls past Projects, the mark softly fades to a blurred backdrop.
  useEffect(() => {
    if (!isHome || !mobile) {
      const el = wrapRef.current;
      if (el && isHome) {
        el.style.filter = "";
        el.style.opacity = "";
      }
      return;
    }
    const apply = () => {
      const el = wrapRef.current;
      if (!el) return;
      const projects = document.getElementById("projects");
      if (!projects) {
        el.style.filter = "none";
        el.style.opacity = "1";
        return;
      }
      const projEnd = projects.offsetTop + projects.offsetHeight;
      const vh = window.innerHeight;
      const y = window.scrollY;
      // Start blur the moment About begins entering the viewport (y = projEnd − vh)
      // and reach full strength by the time Projects has fully scrolled away (y = projEnd).
      const t = Math.min(1, Math.max(0, (y - (projEnd - vh)) / vh));
      const blur = t * 6;           // gentle soft-focus, mark still legible
      const op = 1 - t * 0.35;      // dim to 0.65 opacity at peak
      el.style.filter = blur > 0.1 ? `blur(${blur.toFixed(1)}px)` : "none";
      el.style.opacity = String(op);
    };
    apply();
    window.addEventListener("scroll", apply, { passive: true });
    window.addEventListener("resize", apply);
    return () => {
      window.removeEventListener("scroll", apply);
      window.removeEventListener("resize", apply);
    };
  }, [isHome, mobile]);

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
