import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { bladePoseFor } from "./bladePoseFor";
import { useProgressStore } from "@/scroll/progressStore";
import { useMousePosition } from "@/hooks/useMousePosition";
import { smoothstep } from "@/lib/math";

type Props = { index: 0 | 1 | 2; color: string; opacity?: number };
type V2 = [number, number];

const VERTS: ReadonlyArray<[V2, V2, V2]> = [
  [[-0.708, -0.458], [-0.708, 0.708], [0, 0]],
  [[0.708, -0.458], [0.708, 0.708], [0, 0]],
  [[-0.708, -0.458], [0, 0], [0.708, -0.458]],
];

// Glow color per blade — matches base hue but pushed bright for additive bloom
const GLOW_COLORS = ["#fff5e3", "#dcd9d4", "#ffb98a"];

const CELL = 0.062;
const NORMAL_JITTER = 0.85;

/* ---------- Polygon clipping (unchanged) ---------- */
function isInside(p: V2, a: V2, b: V2): boolean {
  return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) >= -1e-9;
}
function lineIntersect(p1: V2, p2: V2, a: V2, b: V2): V2 {
  const x1 = p1[0], y1 = p1[1];
  const x2 = p2[0], y2 = p2[1];
  const x3 = a[0], y3 = a[1];
  const x4 = b[0], y4 = b[1];
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 1e-12) return p2;
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  return [x1 + t * (x2 - x1), y1 + t * (y2 - y1)];
}
function clipAgainstEdge(poly: V2[], a: V2, b: V2): V2[] {
  if (poly.length === 0) return poly;
  const out: V2[] = [];
  let prev = poly[poly.length - 1]!;
  let prevInside = isInside(prev, a, b);
  for (const cur of poly) {
    const curInside = isInside(cur, a, b);
    if (curInside) {
      if (!prevInside) out.push(lineIntersect(prev, cur, a, b));
      out.push(cur);
    } else if (prevInside) {
      out.push(lineIntersect(prev, cur, a, b));
    }
    prev = cur;
    prevInside = curInside;
  }
  return out;
}
function clipToTriangle(poly: V2[], A: V2, B: V2, C: V2): V2[] {
  let p = clipAgainstEdge(poly, A, B);
  p = clipAgainstEdge(p, B, C);
  p = clipAgainstEdge(p, C, A);
  return p;
}
function asCCW(A: V2, B: V2, C: V2): [V2, V2, V2] {
  const cross = (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]);
  return cross >= 0 ? [A, B, C] : [A, C, B];
}

function buildFacetedGeometry(index: 0 | 1 | 2) {
  const [Araw, Braw, Craw] = VERTS[index];
  const [A, B, C] = asCCW(Araw, Braw, Craw);
  const xs = [A[0], B[0], C[0]];
  const ys = [A[1], B[1], C[1]];
  const minX = Math.floor(Math.min(...xs) / CELL) * CELL;
  const maxX = Math.ceil(Math.max(...xs) / CELL) * CELL;
  const minY = Math.floor(Math.min(...ys) / CELL) * CELL;
  const maxY = Math.ceil(Math.max(...ys) / CELL) * CELL;

  const positions: number[] = [];
  const normals: number[] = [];

  const randomNormal = (): [number, number, number] => {
    const ang = Math.random() * Math.PI * 2;
    const mag = Math.random() * NORMAL_JITTER;
    const nx = Math.cos(ang) * mag;
    const ny = Math.sin(ang) * mag;
    const nz = Math.sqrt(Math.max(0.001, 1 - nx * nx - ny * ny));
    return [nx, ny, nz];
  };
  const pushTri = (p1: V2, p2: V2, p3: V2, n: [number, number, number]) => {
    for (const p of [p1, p2, p3]) {
      positions.push(p[0], p[1], 0);
      normals.push(n[0], n[1], n[2]);
    }
  };
  const emitClippedQuad = (corners: V2[]) => {
    const tri1: V2[] = [corners[0]!, corners[1]!, corners[2]!];
    const tri2: V2[] = [corners[0]!, corners[2]!, corners[3]!];
    for (const triPoly of [tri1, tri2]) {
      const clipped = clipToTriangle(triPoly, A, B, C);
      if (clipped.length < 3) continue;
      const n = randomNormal();
      for (let i = 1; i < clipped.length - 1; i++) {
        pushTri(clipped[0]!, clipped[i]!, clipped[i + 1]!, n);
      }
    }
  };

  for (let y = minY; y < maxY; y += CELL) {
    for (let x = minX; x < maxX; x += CELL) {
      emitClippedQuad([
        [x, y],
        [x + CELL, y],
        [x + CELL, y + CELL],
        [x, y + CELL],
      ]);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  return geo;
}

/** Edge geometry — the 3 triangle perimeter edges as line segments (z slightly forward
 *  so they sit above the faceted surface). */
function buildEdgeGeometry(index: 0 | 1 | 2) {
  const [A, B, C] = VERTS[index];
  const z = 0.005;
  const positions = new Float32Array([
    A[0], A[1], z, B[0], B[1], z,
    B[0], B[1], z, C[0], C[1], z,
    C[0], C[1], z, A[0], A[1], z,
  ]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return geo;
}

export function Blade({ index, color, opacity = 1 }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const edgeMatRef = useRef<THREE.LineBasicMaterial>(null);
  const mouse = useMousePosition();

  const geometry = useMemo(() => buildFacetedGeometry(index), [index]);
  const edgeGeometry = useMemo(() => buildEdgeGeometry(index), [index]);
  const baseColor = useMemo(() => new THREE.Color(color), [color]);
  const glowColor = useMemo(() => new THREE.Color(GLOW_COLORS[index]), [index]);

  useFrame((_, delta) => {
    const progress = useProgressStore.getState().progress;
    const pose = bladePoseFor(progress, index);
    if (!groupRef.current) return;
    const g = groupRef.current;
    const damp = Math.min(1, delta * 6);

    g.rotation.z += (pose.spinZ - g.rotation.z) * damp;
    const heroRest = Math.max(0, 1 - progress * 12);
    const mx = mouse.current.x * 0.05 * heroRest;
    const my = mouse.current.y * 0.04 * heroRest;
    g.position.x += (pose.posX + mx - g.position.x) * damp;
    g.position.y += (pose.posY + my - g.position.y) * damp;
    g.position.z += (pose.posZ - g.position.z) * damp;
    g.scale.setScalar(g.scale.x + (pose.scale - g.scale.x) * damp);

    if (matRef.current) {
      const targetOpacity = pose.opacity * opacity;
      matRef.current.opacity += (targetOpacity - matRef.current.opacity) * damp;
    }

    // Edge glow: cracks of light through the seams just before/during the split.
    // Lights up right after the boom ignites (~0.02) and fades as blades fan out.
    if (edgeMatRef.current) {
      const opening = smoothstep(0.06, 0.12, progress) * (1 - smoothstep(0.45, 0.60, progress));
      const sealing = smoothstep(0.85, 0.90, progress) * (1 - smoothstep(0.92, 0.96, progress));
      const baseShimmer = 0.08; // always-on faint outline
      const targetIntensity = baseShimmer + opening * 4.5 + sealing * 1.5;
      const cur = edgeMatRef.current.opacity;
      edgeMatRef.current.opacity = cur + (targetIntensity - cur) * Math.min(1, delta * 8);
    }
  });

  return (
    <group ref={groupRef}>
      <mesh geometry={geometry}>
        <meshStandardMaterial
          ref={matRef}
          color={baseColor}
          emissive={baseColor}
          emissiveIntensity={0.22}
          metalness={0.85}
          roughness={0.42}
          envMapIntensity={1.3}
          side={THREE.DoubleSide}
          transparent
          opacity={opacity}
          depthWrite={false}
        />
      </mesh>
      {/* Bright glowing edges — "cracks of light" during the iris opening.
          Additive + high color = triggers Bloom for the Xbox-style glow halo. */}
      <lineSegments geometry={edgeGeometry}>
        <lineBasicMaterial
          ref={edgeMatRef}
          color={glowColor}
          transparent
          opacity={0}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </lineSegments>
    </group>
  );
}
