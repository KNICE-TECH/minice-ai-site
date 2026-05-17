import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useProgressStore } from "@/scroll/progressStore";
import { smoothstep } from "@/lib/math";

// Flat blueprint backdrop: square grid + 2 concentric circles in cream/low-opacity.
// Lives behind the aperture, never glows, gives the mark a technical "construction"
// reference plate vibe.

function buildGrid(size: number, divisions: number) {
  const positions: number[] = [];
  const step = size / divisions;
  const half = size / 2;
  for (let i = 0; i <= divisions; i++) {
    const v = -half + i * step;
    // horizontal line
    positions.push(-half, v, 0, half, v, 0);
    // vertical line
    positions.push(v, -half, 0, v, half, 0);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return geo;
}

function buildCircle(radius: number, segments: number) {
  const positions: number[] = [];
  for (let i = 0; i < segments; i++) {
    const a1 = (i / segments) * Math.PI * 2;
    const a2 = ((i + 1) / segments) * Math.PI * 2;
    positions.push(Math.cos(a1) * radius, Math.sin(a1) * radius, 0);
    positions.push(Math.cos(a2) * radius, Math.sin(a2) * radius, 0);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  return geo;
}

function buildCrosshair(reach: number) {
  const geo = new THREE.BufferGeometry();
  geo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [
        -reach, 0, 0,
        reach, 0, 0,
        0, -reach, 0,
        0, reach, 0,
      ],
      3,
    ),
  );
  return geo;
}

export function Backdrop() {
  const groupRef = useRef<THREE.Group>(null);
  const gridGeo = useMemo(() => buildGrid(3.5, 14), []);
  const c1 = useMemo(() => buildCircle(0.95, 96), []);
  const c2 = useMemo(() => buildCircle(1.55, 96), []);
  const cross = useMemo(() => buildCrosshair(1.8), []);

  useFrame((_, delta) => {
    const p = useProgressStore.getState().progress;
    // Faint at all times. Slight breathing on opening moment.
    const opening = smoothstep(0.12, 0.3, p) * (1 - smoothstep(0.4, 0.55, p));
    const seal = smoothstep(0.78, 0.92, p);
    if (!groupRef.current) return;
    const target = (0.55 + opening * 0.6) * (1 - seal * 0.5);
    // @ts-expect-error opacity exists on the underlying materials we set
    groupRef.current.children.forEach((c: THREE.LineSegments) => {
      const mat = c.material as THREE.LineBasicMaterial;
      const base = (c.userData.baseOpacity ?? 0.08) as number;
      const t = base * target;
      mat.opacity += (t - mat.opacity) * Math.min(1, delta * 4);
    });
  });

  return (
    <group ref={groupRef} position={[0, 0, -0.3]} renderOrder={-3}>
      <lineSegments geometry={gridGeo} userData={{ baseOpacity: 0.06 }}>
        <lineBasicMaterial color="#f5f4f1" transparent depthWrite={false} />
      </lineSegments>
      <lineSegments geometry={c1} userData={{ baseOpacity: 0.18 }}>
        <lineBasicMaterial color="#e8a87c" transparent depthWrite={false} />
      </lineSegments>
      <lineSegments geometry={c2} userData={{ baseOpacity: 0.1 }}>
        <lineBasicMaterial color="#f5f4f1" transparent depthWrite={false} />
      </lineSegments>
      <lineSegments geometry={cross} userData={{ baseOpacity: 0.12 }}>
        <lineBasicMaterial color="#f5f4f1" transparent depthWrite={false} />
      </lineSegments>
    </group>
  );
}
