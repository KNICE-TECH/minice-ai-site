import { smoothstep, lerp } from "@/lib/math";

export type BladePose = {
  spinZ: number;
  posX: number;
  posY: number;
  posZ: number;
  scale: number;
  opacity: number;
};

const OUTWARD: ReadonlyArray<[number, number]> = [
  [-1, 0.25],
  [1, 0.25],
  [0, -1],
];

const STAGGER = [0.03, 0.03, 0.0];

const easeOutBack = (t: number) => {
  const c1 = 1.45;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
};

const OPEN_SPIN = [-0.25, 0.25, 0.45];

export function bladePoseFor(progress: number, index: 0 | 1 | 2): BladePose {
  // Section progress map (total scroll 440dvh):
  //   Hero scroll-out  0.000 – 0.227
  //   Projects pin     0.227 – 0.682
  //   About            0.682 – 0.909
  //   Contact          0.909 – 1.000
  // Blades start moving AFTER the boom has ignited (boom peak ~p=0.05) so
  // the flight is driven by a visible shockwave instead of preceding it.
  const sBase = 0.06 + STAGGER[index];
  const openRaw = smoothstep(sBase, sBase + 0.16, progress);    // fully open ~p=0.22-0.25
  const open = easeOutBack(openRaw);
  const fanned = smoothstep(0.24, 0.55, progress);              // mid Projects pin
  const reformLens = smoothstep(0.58, 0.68, progress);          // Projects exit → About
  const seal = smoothstep(0.88, 0.94, progress);                // About → Contact
  const tail = smoothstep(0.96, 1.0, progress);

  let spinZ = 0;
  let posX = 0;
  let posY = 0;
  let posZ = 0;
  let scale = 1;
  let opacity = 1;

  const [ox, oy] = OUTWARD[index];
  const openDist = 1.05;
  posX = ox * openDist * open;
  posY = oy * openDist * open;
  const zPeak = 0.55;
  posZ = zPeak * open * (1 - 0.5 * Math.max(0, open - 1));
  spinZ = OPEN_SPIN[index] * open;
  scale = 1 + 0.06 * open * (1 - Math.max(0, open - 1));

  const fanDist = 1.55;
  const fanDeg = [-0.4, 0.4, 0];
  const fanT = fanned * (1 - reformLens);
  posX = lerp(posX, ox * fanDist, fanT);
  posY = lerp(posY, oy * fanDist, fanT);
  posZ = lerp(posZ, 0, fanT);
  spinZ = lerp(spinZ, fanDeg[index], fanT);
  scale = lerp(scale, 0.85, fanT);

  posX = lerp(posX, 0, reformLens);
  posY = lerp(posY, 0, reformLens);
  posZ = lerp(posZ, -index * 0.06, reformLens);
  spinZ = lerp(spinZ, 0, reformLens);
  scale = lerp(scale, 1.05, reformLens);
  opacity = lerp(1, index === 2 ? 0.6 : 0.5, reformLens);

  posX = lerp(posX, 0, seal);
  posY = lerp(posY, 0, seal);
  posZ = lerp(posZ, 0, seal);
  spinZ = lerp(spinZ, 0, seal);
  scale = lerp(scale, 0.9, seal);
  opacity = lerp(opacity, 1, seal);

  scale = lerp(scale, 0.95, tail);

  return { spinZ, posX, posY, posZ, scale, opacity };
}

export function cameraPoseFor(progress: number) {
  const irisOpen = smoothstep(0.04, 0.22, progress);
  const aboutBand = smoothstep(0.68, 0.82, progress);
  const contactBand = smoothstep(0.94, 0.98, progress);

  const dolly = irisOpen * (1 - smoothstep(0.22, 0.35, progress));
  const z = lerp(4.6, 5.4, irisOpen) - 1.2 * dolly - 0.3 * aboutBand + 0.15 * contactBand;
  const fov = lerp(32, 44, irisOpen) + 6 * dolly;

  return { z, fov, focusZ: z - 2 };
}
