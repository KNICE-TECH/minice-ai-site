import { useEffect, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Blade } from "./Blade";
import { Backdrop } from "./Backdrop";
import { LightBeams } from "./LightBeams";
import { useProgressStore } from "@/scroll/progressStore";
import { useMousePosition } from "@/hooks/useMousePosition";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useDeviceOrientation } from "@/hooks/useDeviceOrientation";
import { smoothstep, lerp, clamp } from "@/lib/math";

// Max rotation cap everywhere — 30° in radians.
const MAX_ROT = Math.PI / 6;
// Hero idle oscillation: ±MAX_ROT * SWAY_AMP every SWAY_PERIOD seconds.
const SWAY_AMP = 0.55; // 55% of 30° = ±16.5°
const SWAY_PERIOD = 13;

// Mouse parallax rotation amplitude (in radians) — added on top of sway/scroll.
const MOUSE_TILT_Y = 0.32; // horizontal mouse → Y rotation (~18°)
const MOUSE_TILT_X = 0.18; // vertical mouse   → X rotation (~10°)

export function ApertureRig() {
  const ref = useRef<THREE.Group>(null);
  const elapsed = useRef(0);
  const scrollY = useRef(0);
  const mouse = useMousePosition();
  const { viewport } = useThree();
  const mobile = useIsMobile();
  const orient = useDeviceOrientation();
  // Calibration: capture starting beta/gamma so the mark sits flat in whatever
  // hand position the user opens the page (instead of jumping to absolute world tilt).
  const orientBase = useRef({ gamma: 0, beta: 0, calibrated: false });

  // Track raw scroll on mobile for side-to-side mark rotation.
  useEffect(() => {
    if (!mobile) return;
    const update = () => {
      scrollY.current = window.scrollY;
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [mobile]);

  useFrame((_, delta) => {
    const p = useProgressStore.getState().progress;
    if (!ref.current) return;
    const g = ref.current;
    const damp = Math.min(1, delta * 4);
    const rotDamp = Math.min(1, delta * 1.8);
    const mouseDamp = Math.min(1, delta * 3.5);
    elapsed.current += delta;

    // Responsive scale: limit mark to leave room for hero text above & below.
    // Height-weighted so the mark shrinks on short / landscape viewports.
    const naturalSize = 1.5;
    const heightCap = viewport.height * 0.30; // mark won't be larger than 30% of vertical world space
    const widthCap = viewport.width * 0.28;
    const targetWorld = Math.min(heightCap, widthCap);
    const responsiveScale = clamp(targetWorld / naturalSize, 0.4, 1.0);
    g.scale.setScalar(g.scale.x + (responsiveScale - g.scale.x) * damp);

    // Side-shift during About + Contact:
    // - Landscape/wide: shift mark to the right, text sits on the left.
    // - Portrait/narrow: shift mark UP into the top third, text fills bottom.
    const isPortrait = viewport.width < viewport.height * 0.9;
    const offCenter = smoothstep(0.5, 0.65, p);
    const sideShift = isPortrait ? 0 : viewport.width * 0.32;
    const upShift = isPortrait ? viewport.height * 0.16 : 0;
    const targetPosX = lerp(0, sideShift, offCenter);
    const targetPosY = 0.1 + lerp(0, upShift, offCenter);
    g.position.x += (targetPosX - g.position.x) * damp;
    g.position.y += (targetPosY - g.position.y) * damp;

    // Rotation behavior:
    //  - Hero (p ≈ 0): sway + mouse parallax
    //  - Scrolling: scroll-driven rotation + mouse parallax (dampened)
    //  - Contact (p ≈ 0.9+): no spinning, but mouse still tilts gently
    const heroWeight = 1 - smoothstep(0.0, 0.18, p);
    const contactWeight = smoothstep(0.78, 0.92, p);

    const sway = Math.sin((elapsed.current / SWAY_PERIOD) * Math.PI * 2) * MAX_ROT * SWAY_AMP;
    const scrollRot = (p * 2 - 1) * MAX_ROT;

    // Mouse-driven tilt — strongest on hero, fades a bit during projects/about/contact.
    const mouseStrength = lerp(1.0, 0.45, smoothstep(0.0, 0.55, p));
    const mouseYaw = mouse.current.x * MOUSE_TILT_Y * mouseStrength;
    const mousePitch = -mouse.current.y * MOUSE_TILT_X * mouseStrength;

    // On mobile, scroll drives a gentle side-to-side oscillation across the
    // page (sin wave: ~one full back-and-forth per viewport of scroll).
    const mobileScrollRot = mobile
      ? Math.sin(scrollY.current / 260) * MAX_ROT * 0.7
      : 0;

    // Mobile gyroscope tilt: device orientation drives the mark like a panel
    // tilting in your hand. Calibrated to the first reading so any starting
    // grip is treated as "flat". Capped to ±MAX_ROT.
    let gyroYaw = 0;
    let gyroPitch = 0;
    if (mobile && orient.current.active) {
      if (!orientBase.current.calibrated) {
        orientBase.current.gamma = orient.current.gamma;
        orientBase.current.beta = orient.current.beta;
        orientBase.current.calibrated = true;
      }
      const dGamma = orient.current.gamma - orientBase.current.gamma; // ±90 left/right
      const dBeta = orient.current.beta - orientBase.current.beta;    // ±180 front/back
      // High sensitivity — only ±12° of physical tilt hits the rotation cap.
      // Inverted so the mark turns toward the side the phone tilts down on.
      gyroYaw = clamp((-dGamma / 12) * MAX_ROT, -MAX_ROT, MAX_ROT);
      gyroPitch = clamp((-dBeta / 12) * MAX_ROT, -MAX_ROT, MAX_ROT) * 0.6;
    }

    const baseY = mobile
      ? mobileScrollRot + gyroYaw
      : sway * heroWeight +
        scrollRot * (1 - heroWeight) * (1 - contactWeight);
    const targetY = baseY + mouseYaw;
    const targetX_rot = mobile ? gyroPitch : mousePitch;

    // Apply rotation: scroll/sway use slow damping, mouse adds snappier overlay.
    g.rotation.y += (targetY - g.rotation.y) * Math.max(rotDamp, mouseDamp * 0.6);
    g.rotation.x += (targetX_rot - g.rotation.x) * mouseDamp;
  });

  return (
    <group ref={ref} position={[0, 0.1, 0]} scale={0.95}>
      <Backdrop />
      <LightBeams />
      <Blade index={0} color="#f5f4f1" />
      <Blade index={1} color="#8a8a87" />
      <Blade index={2} color="#e8a87c" />
    </group>
  );
}

