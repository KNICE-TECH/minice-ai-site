import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useProgressStore } from "@/scroll/progressStore";
import { smoothstep } from "@/lib/math";

/* ---------- Tiny triangle shard geometry ---------- */
function buildShardGeometry() {
  const geo = new THREE.BufferGeometry();
  const verts = new Float32Array([
    0, 0.6, 0,
    -0.52, -0.3, 0,
    0.52, -0.3, 0,
  ]);
  geo.setAttribute("position", new THREE.BufferAttribute(verts, 3));
  geo.computeVertexNormals();
  return geo;
}

const SHARD_COUNT = 48;
type ShardSeed = {
  axis: THREE.Vector3;
  angle: number;
  speed: number;
  spinSpeed: THREE.Vector3;
  scale: number;
  delay: number;
  color: THREE.Color;
};

function makeSeeds(): ShardSeed[] {
  const cream = new THREE.Color("#fff2d8");
  const bronze = new THREE.Color("#e8a87c");
  const out: ShardSeed[] = [];
  for (let i = 0; i < SHARD_COUNT; i++) {
    // Spherical random direction (slight bias toward XY plane for camera focus)
    const phi = Math.random() * Math.PI * 2;
    const theta = (Math.random() - 0.5) * 0.6; // small Z-elevation
    const dir = new THREE.Vector3(
      Math.cos(phi) * Math.cos(theta),
      Math.sin(phi) * Math.cos(theta),
      Math.sin(theta),
    ).normalize();
    out.push({
      axis: dir,
      angle: 0,
      speed: 0.9 + Math.random() * 2.0,
      spinSpeed: new THREE.Vector3(
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 14,
      ),
      scale: 0.07 + Math.random() * 0.12,
      delay: Math.random() * 0.35,
      color: Math.random() < 0.55 ? cream : bronze,
    });
  }
  return out;
}

/* ---------- Expanding ring geometry ---------- */
function buildRingGeometry(innerR: number, outerR: number, segments = 64) {
  return new THREE.RingGeometry(innerR, outerR, segments);
}

/* ---------- Central flash shader ---------- */
const FLASH_VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
const FLASH_FRAG = `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    float d = distance(vUv, vec2(0.5));
    float core = smoothstep(0.16, 0.0, d);
    float halo = smoothstep(0.5, 0.05, d);
    float v = (core * 1.6 + halo * 0.55) * uIntensity;
    gl_FragColor = vec4(uColor * v, v);
  }
`;

export function LightBeams() {
  const groupRef = useRef<THREE.Group>(null);
  const shardsRef = useRef<THREE.InstancedMesh>(null);
  const flashRef = useRef<THREE.ShaderMaterial>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const elapsed = useRef(0);

  const shardGeo = useMemo(() => buildShardGeometry(), []);
  const seeds = useMemo(() => makeSeeds(), []);
  const flashGeo = useMemo(() => new THREE.PlaneGeometry(1.8, 1.8), []);
  const ringGeo1 = useMemo(() => buildRingGeometry(0.95, 1.0, 96), []);
  const ringGeo2 = useMemo(() => buildRingGeometry(0.97, 1.0, 96), []);
  const flashUniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color("#fff2d8") },
      uIntensity: { value: 0 },
    }),
    [],
  );

  // Reusable matrix
  const tmpMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tmpPos = useMemo(() => new THREE.Vector3(), []);
  const tmpQuat = useMemo(() => new THREE.Quaternion(), []);
  const tmpScale = useMemo(() => new THREE.Vector3(), []);
  const tmpEuler = useMemo(() => new THREE.Euler(), []);

  useFrame((_, delta) => {
    elapsed.current += delta;
    const p = useProgressStore.getState().progress;

    // Sharp burst centered around p≈0.22
    const burst = smoothstep(0.13, 0.22, p) * (1 - smoothstep(0.22, 0.4, p));
    const flash = smoothstep(0.16, 0.22, p) * (1 - smoothstep(0.22, 0.3, p));

    if (flashRef.current) {
      const u = flashRef.current.uniforms;
      const target = flash * 1.8;
      u.uIntensity.value += (target - u.uIntensity.value) * Math.min(1, delta * 12);
    }

    // Rings: expand outward from center as burst fires
    if (ring1Ref.current) {
      const s = burst * 3.5;
      const op = burst * (1 - smoothstep(0.22, 0.4, p)) * 0.8;
      ring1Ref.current.scale.setScalar(s + 0.001);
      (ring1Ref.current.material as THREE.MeshBasicMaterial).opacity = op;
    }
    if (ring2Ref.current) {
      const s = burst * 2.4;
      const op = burst * (1 - smoothstep(0.22, 0.4, p)) * 0.55;
      ring2Ref.current.scale.setScalar(s + 0.001);
      (ring2Ref.current.material as THREE.MeshBasicMaterial).opacity = op;
    }

    // Shards: each instance flies outward along its random direction, spins.
    if (shardsRef.current) {
      const inst = shardsRef.current;
      for (let i = 0; i < SHARD_COUNT; i++) {
        const s = seeds[i];
        // Per-shard progress with stagger delay
        const local = Math.max(0, burst - s.delay * 0.5);
        const dist = local * s.speed;
        tmpPos.copy(s.axis).multiplyScalar(dist);
        // Spin: continuous rotation
        const t = elapsed.current;
        tmpEuler.set(
          s.spinSpeed.x * t,
          s.spinSpeed.y * t,
          s.spinSpeed.z * t,
        );
        tmpQuat.setFromEuler(tmpEuler);
        // Scale fades in fast then out as it flies
        const sScale = s.scale * local * (1 - Math.max(0, local - 0.7) * 1.3);
        tmpScale.setScalar(Math.max(0, sScale));
        tmpMatrix.compose(tmpPos, tmpQuat, tmpScale);
        inst.setMatrixAt(i, tmpMatrix);
      }
      inst.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]} renderOrder={-1}>
      {/* Triangle shards bursting outward in 3D */}
      <instancedMesh ref={shardsRef} args={[shardGeo, undefined, SHARD_COUNT]}>
        <meshBasicMaterial
          attach="material"
          color="#fff2d8"
          transparent
          opacity={0.95}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
          blending={THREE.AdditiveBlending}
        />
      </instancedMesh>

      {/* Two expanding rings (shockwaves) */}
      <mesh ref={ring1Ref} position={[0, 0, -0.05]}>
        <primitive object={ringGeo1} attach="geometry" />
        <meshBasicMaterial
          color="#fff2d8"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={ring2Ref} position={[0, 0, -0.04]}>
        <primitive object={ringGeo2} attach="geometry" />
        <meshBasicMaterial
          color="#e8a87c"
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      {/* Central flash disc */}
      <mesh geometry={flashGeo} position={[0, 0, -0.1]}>
        <shaderMaterial
          ref={flashRef}
          uniforms={flashUniforms}
          vertexShader={FLASH_VERT}
          fragmentShader={FLASH_FRAG}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
