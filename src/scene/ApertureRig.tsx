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

  // User drag-to-rotate. Accumulates as an OFFSET on top of the sway/scroll/
  // parallax behaviour, so the user can spin the mark around at will without
  // killing the ambient motion. After release the offset slowly decays back
  // toward zero so the logo eventually returns to its choreographed pose.
  const dragRot = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    let lastX = 0;
    let lastY = 0;
    let dragging = false;

    const startable = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      // Don't hijack clicks on interactive UI — buttons, links, inputs,
      // form controls, anything inside a card/article. Press has to land
      // on the bare backdrop / canvas wrapper.
      if (
        target.closest(
          'button, a, input, textarea, select, [role="button"], [role="link"], article, label, [contenteditable="true"]',
        )
      ) {
        return false;
      }
      return true;
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return; // primary button only
      if (!startable(e.target)) return;
      dragging = true;
      dragRot.current.active = true;
      lastX = e.clientX;
      lastY = e.clientY;
      document.body.style.cursor = "grabbing";
      // Disable text selection while dragging.
      document.body.style.userSelect = "none";
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      // Pixels → radians. 220 px ≈ 90° feels natural.
      dragRot.current.y += dx * (Math.PI / 220);
      dragRot.current.x += dy * (Math.PI / 220);
      // Clamp pitch so the user can't flip the mark fully upside-down
      // (the back face is intentionally minimalist).
      dragRot.current.x = clamp(dragRot.current.x, -Math.PI / 2.2, Math.PI / 2.2);
    };
    const onUp = () => {
      if (!dragging) return;
      dragging = false;
      dragRot.current.active = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, []);

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

    // Drag-rotate offset. While the user is actively dragging, the offset
    // builds up freely. After release it decays back to zero over ~5s so
    // the choreographed motion eventually reclaims the mark.
    if (!dragRot.current.active) {
      const decay = 1 - Math.min(1, delta * 0.4);
      dragRot.current.x *= decay;
      dragRot.current.y *= decay;
    }

    const targetY = baseY + mouseYaw + dragRot.current.y;
    const targetX_rot = (mobile ? gyroPitch : mousePitch) + dragRot.current.x;

    // While dragging, snap nearly instantly to the user input; otherwise
    // use the existing damped behaviour for sway/scroll/parallax.
    const snap = dragRot.current.active ? 1 : Math.max(rotDamp, mouseDamp * 0.6);
    g.rotation.y += (targetY - g.rotation.y) * snap;
    g.rotation.x +=
      (targetX_rot - g.rotation.x) * (dragRot.current.active ? 1 : mouseDamp);
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

