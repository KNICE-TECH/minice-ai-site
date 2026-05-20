import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { bladePoseFor } from "./bladePoseFor";
import { useProgressStore } from "@/scroll/progressStore";
import { useMousePosition } from "@/hooks/useMousePosition";
import { smoothstep } from "@/lib/math";

type Props = {
  index: 0 | 1 | 2;
  color: string;
  opacity?: number;
  // Low-end GPUs: drop the transmission render pass (it's a full extra
  // scene render per frame). The crystal falls back to a frosted-glass
  // look — emissive + envMap reflection only — which is far cheaper and
  // still reads as a faceted gem rather than flat plastic.
  lowEnd?: boolean;
};
type V2 = [number, number];

const VERTS: ReadonlyArray<[V2, V2, V2]> = [
  [[-0.708, -0.458], [-0.708, 0.708], [0, 0]],
  [[0.708, -0.458], [0.708, 0.708], [0, 0]],
  [[-0.708, -0.458], [0, 0], [0.708, -0.458]],
];

// Glow color per blade — matches base hue but pushed bright for additive bloom
const GLOW_COLORS = ["#fff5e3", "#dcd9d4", "#ffb98a"];

const CELL = 0.062;
// Per-cell Z displacement. Each grid cell pushes forward in Z by a random
// amount inside this range, creating real crystalline relief instead of
// fake bump-mapped flatness. Normals are then computed from the actual
// geometry (per-triangle), so light interacts with genuine facets — the
// shard refracts/reflects like a cut crystal, not a painted plane.
const DEPTH = 0.055;

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

/** Vertex positions where the CELL × CELL grid crosses the edge P→Q, in
 *  order from P to Q (inclusive of both endpoints). buildFacetedGeometry's
 *  clipper produces exactly these intersection points along the silhouette,
 *  so if the slab side wall steps through the same list, the wall's front
 *  edge vertices line up perfectly with the front face — no T-junctions,
 *  no gaps, no Z-fighting. */
function silhouettePoints(P: V2, Q: V2): V2[] {
  const dx = Q[0] - P[0];
  const dy = Q[1] - P[1];
  const stops: Array<{ t: number; xy: V2 }> = [
    { t: 0, xy: P },
    { t: 1, xy: Q },
  ];

  if (Math.abs(dx) > 1e-9) {
    const kMin = Math.ceil(Math.min(P[0], Q[0]) / CELL);
    const kMax = Math.floor(Math.max(P[0], Q[0]) / CELL);
    for (let k = kMin; k <= kMax; k++) {
      const x = k * CELL;
      const t = (x - P[0]) / dx;
      if (t > 1e-5 && t < 1 - 1e-5) stops.push({ t, xy: [x, P[1] + dy * t] });
    }
  }

  if (Math.abs(dy) > 1e-9) {
    const mMin = Math.ceil(Math.min(P[1], Q[1]) / CELL);
    const mMax = Math.floor(Math.max(P[1], Q[1]) / CELL);
    for (let m = mMin; m <= mMax; m++) {
      const y = m * CELL;
      const t = (y - P[1]) / dy;
      if (t > 1e-5 && t < 1 - 1e-5) stops.push({ t, xy: [P[0] + dx * t, y] });
    }
  }

  // Cell DIAGONAL crossings (slope +1, y − x = i·CELL). Each cell quad
  // is split into two sub-triangles along this diagonal in the front-
  // face builder, so when the silhouette edge crosses one, the clipper
  // makes a vertex there — the slab wall must follow suit, otherwise
  // the wall gets a T-junction at that point.
  const denomD = dy - dx;
  if (Math.abs(denomD) > 1e-9) {
    const c1 = P[1] - P[0];
    const c2 = Q[1] - Q[0];
    const iMin = Math.ceil(Math.min(c1, c2) / CELL);
    const iMax = Math.floor(Math.max(c1, c2) / CELL);
    for (let i = iMin; i <= iMax; i++) {
      const c = i * CELL;
      const t = (c - c1) / denomD;
      if (t > 1e-5 && t < 1 - 1e-5) {
        stops.push({ t, xy: [P[0] + dx * t, P[1] + dy * t] });
      }
    }
  }

  stops.sort((a, b) => a.t - b.t);
  // De-dup near-coincident t (vertical and horizontal grid lines crossing
  // at the same edge point).
  const out: V2[] = [stops[0]!.xy];
  for (let i = 1; i < stops.length; i++) {
    if (stops[i]!.t - stops[i - 1]!.t > 1e-5) out.push(stops[i]!.xy);
  }
  return out;
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

  const pushTri = (
    p1: V2,
    p2: V2,
    p3: V2,
    z1: number,
    z2: number,
    z3: number,
  ) => {
    positions.push(p1[0], p1[1], z1);
    positions.push(p2[0], p2[1], z2);
    positions.push(p3[0], p3[1], z3);
  };

  // Centroid-biased baseline so the blade reads as a cut gem viewed from
  // the side: middle pokes out, edges fall away.
  const ridgeZ = (px: number, py: number) => {
    const distFromCenter = Math.hypot(px, py);
    const ridge = Math.max(0, 1 - distFromCenter * 1.2);
    return ridge * DEPTH * 0.55;
  };

  // Deterministic per-position noise. Same (x,y) → same Z, ALWAYS.
  // Two adjacent triangles sharing a vertex therefore agree on its Z,
  // so the surface is gap-free — but adjacent vertices get unrelated
  // values, so each triangle is its own tilted facet. That's what
  // brings back the sparkle without producing the black-line cracks.
  const hash2 = (x: number, y: number) => {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return s - Math.floor(s); // 0..1
  };
  // Noise is forward-biased (0..+0.5*DEPTH) so the displaced front face
  // never dips below z=0 — it always sits on top of the back slab,
  // which lives in z ∈ [-SLAB_DEPTH, 0]. No Z-fighting, no holes.
  const noiseZ = (px: number, py: number) => hash2(px, py) * DEPTH * 0.5;

  const zAt = (px: number, py: number) => ridgeZ(px, py) + noiseZ(px, py);

  const emitClippedQuad = (corners: V2[]) => {
    const tri1: V2[] = [corners[0]!, corners[1]!, corners[2]!];
    const tri2: V2[] = [corners[0]!, corners[2]!, corners[3]!];
    for (const triPoly of [tri1, tri2]) {
      const clipped = clipToTriangle(triPoly, A, B, C);
      if (clipped.length < 3) continue;
      for (let i = 1; i < clipped.length - 1; i++) {
        const v0 = clipped[0]!;
        const v1 = clipped[i]!;
        const v2 = clipped[i + 1]!;
        pushTri(v0, v1, v2, zAt(v0[0], v0[1]), zAt(v1[0], v1[1]), zAt(v2[0], v2[1]));
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
  // Compute normals from the actual triangle geometry — since every
  // triangle has its own three vertices (no sharing in our build), each
  // gets a flat per-face normal, giving the crisp crystalline facet
  // look instead of smoothed-over plastic.
  geo.computeVertexNormals();
  return geo;
}

// How thick the back slab is. Visible only from oblique angles — gives
// the blade real volume so it stops reading as a 2D paper triangle.
const SLAB_DEPTH = 0.045;

// Which edges of each blade (in the asCCW-reordered vertex list) are
// INTERNAL seams shared with another blade vs. OUTER (M silhouette).
// All three sides get a wall now — inner walls are flat planes and
// outer walls are faceted with random outward bulge. Inner walls of
// two adjacent blades are coplanar but face opposite directions
// (FrontSide), so each blade closes cleanly and shared seams meet
// without double-walling.
//
// Vertex order after asCCW (computed by hand from VERTS):
//   blade 0 (left)   : A=(-0.708,-0.458), B=(0,0),         C=(-0.708, 0.708)
//                      A→B inner (shared with bottom).
//   blade 1 (right)  : A=(0.708,-0.458),  B=(0.708,0.708), C=(0,0)
//                      C→A inner (shared with bottom).
//   blade 2 (bottom) : A=(-0.708,-0.458), B=(0.708,-0.458),C=(0,0)
//                      B→C and C→A inner (shared with right and left).
const INNER_EDGES: Record<0 | 1 | 2, ReadonlyArray<number>> = {
  0: [0],
  1: [2],
  2: [1, 2],
};

/** Slab with FACETED outer side walls + flat back. Inner (shared) edges
 *  intentionally have no wall — adjacent blades occupy that space. */
function buildSlabGeometry(index: 0 | 1 | 2) {
  const [Araw, Braw, Craw] = VERTS[index];
  const [A, B, C] = asCCW(Araw, Braw, Craw);
  const Z_BACK = -SLAB_DEPTH;
  const positions: number[] = [];

  const pushTri = (
    v1: [number, number, number],
    v2: [number, number, number],
    v3: [number, number, number],
  ) => {
    positions.push(v1[0], v1[1], v1[2]);
    positions.push(v2[0], v2[1], v2[2]);
    positions.push(v3[0], v3[1], v3[2]);
  };

  // Same z function as the front face — guarantees the slab's top edge
  // mates exactly with the displaced facets sitting on top of it.
  const hash2 = (x: number, y: number) => {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const ridgeZ = (px: number, py: number) => {
    const d = Math.hypot(px, py);
    return Math.max(0, 1 - d * 1.2) * DEPTH * 0.55;
  };
  const noiseZ = (px: number, py: number) => hash2(px, py) * DEPTH * 0.5;
  const zFront = (px: number, py: number) => ridgeZ(px, py) + noiseZ(px, py);

  const verts: ReadonlyArray<[number, number]> = [A, B, C];

  // Outer wall bulge — pushes the BACK vertex outward perpendicular to
  // the edge. The FRONT vertex sits exactly on the silhouette (no
  // displacement), giving a clean 90° join between the front face and
  // every wall. Adjacent segments share their xy on the silhouette so
  // the bulge — derived from a deterministic hash of position — also
  // matches at shared vertices and the wall stays seam-tight.
  const BULGE = 0.025;
  const bulgeAt = (px: number, py: number) =>
    (hash2(px * 1.7, py * 1.7) - 0.5) * BULGE;

  // All back vertices, collected in CCW order around the perimeter so
  // we can fan-triangulate the back face after the wall loop. With
  // outer-wall bulge the back outline isn't a clean triangle anymore;
  // it's wavy. The back face has to track that outline or you get
  // visible gaps at the perimeter when viewed from behind.
  const backRing: V2[] = [];

  for (let ei = 0; ei < 3; ei++) {
    const isInner = INNER_EDGES[index].includes(ei);
    const P = verts[ei]!;
    const Q = verts[(ei + 1) % 3]!;
    const ex = Q[0] - P[0];
    const ey = Q[1] - P[1];
    const elen = Math.hypot(ex, ey) || 1;
    // Outward in XY (rotated −90° from edge tangent) — points away
    // from the triangle's interior given the CCW vertex order.
    const outX = ey / elen;
    const outY = -ex / elen;

    const pts = silhouettePoints(P, Q);
    for (let i = 0; i < pts.length - 1; i++) {
      const [fx1, fy1] = pts[i]!;
      const [fx2, fy2] = pts[i + 1]!;
      const fz1 = zFront(fx1, fy1);
      const fz2 = zFront(fx2, fy2);

      // Inner walls are perfectly flat planes (back vertex sits at
      // exactly front xy → wall is fully perpendicular). Outer walls
      // get bulge but ONLY on the back vertex — front edge stays on
      // the silhouette so the top edge is still a true 90° corner
      // against the front face. Bulge is forced to zero at edge
      // endpoints (the M corners) so adjacent walls — whether outer
      // or inner — share their back vertex at the corner and seal.
      const atStart = i === 0;
      const atEnd = i === pts.length - 2;
      const b1 = isInner || atStart ? 0 : bulgeAt(fx1, fy1);
      const b2 = isInner || atEnd ? 0 : bulgeAt(fx2, fy2);

      const bx1 = fx1 + outX * b1;
      const by1 = fy1 + outY * b1;
      const bx2 = fx2 + outX * b2;
      const by2 = fy2 + outY * b2;

      // Outward normal points along +(outX, outY).
      pushTri([fx1, fy1, fz1], [bx2, by2, Z_BACK], [fx2, fy2, fz2]);
      pushTri([fx1, fy1, fz1], [bx1, by1, Z_BACK], [bx2, by2, Z_BACK]);

      // Collect back vertices in order; skip the second one if it's
      // the start of the next edge (avoid duplicating corner verts).
      if (i === 0) backRing.push([bx1, by1]);
      backRing.push([bx2, by2]);
    }
    // Drop the trailing vertex — it's the corner that the next edge
    // will re-emit as its starting vertex. Keeps the ring distinct.
    backRing.pop();
  }

  // Back face: fan-triangulate from the blade centroid using the real
  // back-edge ring (so any outer bulge is matched at the perimeter).
  // Winding chosen so the right-hand normal points into −Z (away from
  // the camera, "behind" the slab).
  const cxy: V2 = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3];
  for (let i = 0; i < backRing.length; i++) {
    const v1 = backRing[i]!;
    const v2 = backRing[(i + 1) % backRing.length]!;
    pushTri(
      [cxy[0], cxy[1], Z_BACK],
      [v2[0], v2[1], Z_BACK],
      [v1[0], v1[1], Z_BACK],
    );
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  // Flat per-triangle normals — every wall segment its own facet.
  geo.computeVertexNormals();
  return geo;
}

/** Edge geometry — the 3 triangle perimeter edges as line segments. Z is
 *  pushed forward enough to clear the new crystalline relief (DEPTH) so
 *  the bright outlines aren't occluded by raised front-face cells. */
function buildEdgeGeometry(index: 0 | 1 | 2) {
  const [A, B, C] = VERTS[index];
  const z = DEPTH + 0.005;
  const positions = new Float32Array([
    A[0], A[1], z, B[0], B[1], z,
    B[0], B[1], z, C[0], C[1], z,
    C[0], C[1], z, A[0], A[1], z,
  ]);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  return geo;
}

export function Blade({ index, color, opacity = 1, lowEnd = false }: Props) {
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const slabMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const edgeMatRef = useRef<THREE.LineBasicMaterial>(null);
  const mouse = useMousePosition();

  // Attenuation = the colour light picks up as it travels through the
  // crystal. Saturated tints + short distance pull contrast back from the
  // washed-out transmission look. Each blade gets its own pigment so the
  // three shards read as distinct hues, not generic glass.
  //
  //   index 0 — front (cream)  : warm ivory, the "lit" face of the M
  //   index 1 — left (cool ivory): a notch cooler to separate from front
  //   index 2 — bottom (bronze): the signature accent, deeper saturation
  const attenuationColor = useMemo(() => {
    if (index === 0) return new THREE.Color("#fff1d6");
    if (index === 1) return new THREE.Color("#d8d0c0");
    return new THREE.Color("#b06a2c");
  }, [index]);

  const geometry = useMemo(() => buildFacetedGeometry(index), [index]);
  const slabGeometry = useMemo(() => buildSlabGeometry(index), [index]);
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
      if (slabMatRef.current) {
        slabMatRef.current.opacity = matRef.current.opacity;
      }
    }

    // Edge glow: cracks of light through the seams just before/during the split.
    // Lights up right after the boom ignites (~0.02) and fades as blades fan out.
    if (edgeMatRef.current) {
      const opening = smoothstep(0.06, 0.12, progress) * (1 - smoothstep(0.55, 0.70, progress));
      const sealing = smoothstep(0.85, 0.90, progress) * (1 - smoothstep(0.92, 0.96, progress));
      const baseShimmer = 0.08; // always-on faint outline
      const targetIntensity = baseShimmer + opening * 4.5 + sealing * 1.5;
      const cur = edgeMatRef.current.opacity;
      edgeMatRef.current.opacity = cur + (targetIntensity - cur) * Math.min(1, delta * 8);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Back slab: extruded triangle with a small bevel. Lives at z ≤ 0 so
          it sits BEHIND the faceted front. Same crystal material — when
          viewed at an oblique angle you see real side walls, not paper. */}
      <mesh geometry={slabGeometry}>
        <meshPhysicalMaterial
          ref={slabMatRef}
          color={baseColor}
          emissive={baseColor}
          // lowEnd: brighter emissive compensates for the lost transmission.
          emissiveIntensity={lowEnd ? 0.7 : 0.45}
          metalness={0}
          roughness={0.16}
          // transmission=0 on low-end skips the costly transmission pass.
          transmission={lowEnd ? 0 : 0.55}
          thickness={1.3}
          ior={1.6}
          attenuationColor={attenuationColor}
          attenuationDistance={0.5}
          clearcoat={1}
          clearcoatRoughness={0.08}
          envMapIntensity={1.6}
          specularIntensity={0.9}
          /* Front-face only — normals now point outward correctly, so
             rendering the back face would just show the lit interior
             of the wall through the front, which looks wrong. */
          side={THREE.FrontSide}
          transparent
          opacity={opacity}
          depthWrite={false}
        />
      </mesh>
      <mesh geometry={geometry}>
        {/* Physical glass: transmission samples the scene behind the mesh (via
            the Environment), thickness drives how much refraction bends light,
            ior 1.5 ≈ window glass / 1.6 = crystal. The faceted normals from
            buildFacetedGeometry break the surface into many tiny refracting
            facets so light scatters across each shard like a real crystal,
            not a single flat pane. Clearcoat adds the polished surface
            highlight on top of the transmission. */}
        <meshPhysicalMaterial
          ref={matRef}
          color={baseColor}
          emissive={baseColor}
          /* Emissive carries colour even where transmission would otherwise
             show the dark background — kills the "black holes" between
             tilted facets without making the material look painted.
             On low-end (no transmission) it's pushed brighter so the
             frosted fallback still glows. */
          emissiveIntensity={lowEnd ? 0.72 : 0.55}
          metalness={0}
          /* Tightened glossy crystal — with real per-triangle normals,
             this gives crisp facet sparkles when tilt catches a light. */
          roughness={0.11}
          /* transmission=0 on low-end GPUs drops the per-frame extra
             render pass; the facets still read via emissive + envMap. */
          transmission={lowEnd ? 0 : 0.55}
          thickness={1.1}
          ior={1.6}
          attenuationColor={attenuationColor}
          attenuationDistance={0.5}
          clearcoat={1}
          /* Sharp clearcoat so the polished top layer pings highlights
             across the tilted facets — that's the "sparkle" effect. */
          clearcoatRoughness={0.06}
          envMapIntensity={1.8}
          specularIntensity={0.9}
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
