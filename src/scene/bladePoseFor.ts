import { smoothstep, lerp } from "@/lib/math";

export type BladePose = {
  spinZ: number;
  posX: number;
  posY: number;
  posZ: number;
  scale: number;
  opacity: number;
};

// Outward translation directions for each blade.
const OUTWARD: ReadonlyArray<[number, number]> = [
  [-1, 0.25],
  [1, 0.25],
  [0, -1],
];

// Per-blade stagger — bronze blade leads, cream/gray follow.
const STAGGER = [0.04, 0.04, 0.0];

// easeOutBack: subtle overshoot — blades pass their open position then settle.
const easeOutBack = (t: number) => {
  const c1 = 1.45;
  const c3 = c1 + 1;
  return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2;
};

// Per-blade in-plane spin direction during open phase (radians)
const OPEN_SPIN = [-0.25, 0.25, 0.45];

export function bladePoseFor(progress: number, index: 0 | 1 | 2): BladePose {
  // Layout: Hero 100dvh (0–0.167) | Projects 300dvh (0.167–0.667)
  //         | About 150dvh (0.667–0.917) | Contact 150dvh (0.917–1.0)
  const sBase = 0.13 + STAGGER[index];
  const openRaw = smoothstep(sBase, sBase + 0.13, progress); // iris opens early in Projects pin
  const open = easeOutBack(openRaw);
  const fanned = smoothstep(0.25, 0.55, progress);            // mid Projects
  const reformLens = smoothstep(0.55, 0.68, progress);        // late Projects → About
  const seal = smoothstep(0.86, 0.94, progress);              // About → Contact
  const tail = smoothstep(0.95, 1.0, progress);

  let spinZ = 0;
  let posX = 0;
  let posY = 0;
  let posZ = 0;
  let scale = 1;
  let opacity = 1;

  // OPEN: translate outward + push forward in Z + spin slightly
  const [ox, oy] = OUTWARD[index];
  const openDist = 1.05;
  posX = ox * openDist * open;
  posY = oy * openDist * open;
  // Z-pop: blades come toward the camera as they part, then settle
  // (peaks above 1.0 due to easeOutBack overshoot, then relaxes)
  const zPeak = 0.55;
  posZ = zPeak * open * (1 - 0.5 * Math.max(0, open - 1));
  // Spin during open
  spinZ = OPEN_SPIN[index] * open;
  // Slight grow during open (drama), then return
  scale = 1 + 0.06 * open * (1 - Math.max(0, open - 1));

  // FANNED: push further to viewport edges (suppresses Z pop)
  const fanDist = 1.55;
  const fanDeg = [-0.4, 0.4, 0];
  const fanT = fanned * (1 - reformLens);
  posX = lerp(posX, ox * fanDist, fanT);
  posY = lerp(posY, oy * fanDist, fanT);
  posZ = lerp(posZ, 0, fanT);
  spinZ = lerp(spinZ, fanDeg[index], fanT);
  scale = lerp(scale, 0.85, fanT);

  // LENS: gather + stack in Z
  posX = lerp(posX, 0, reformLens);
  posY = lerp(posY, 0, reformLens);
  posZ = lerp(posZ, -index * 0.06, reformLens);
  spinZ = lerp(spinZ, 0, reformLens);
  scale = lerp(scale, 1.05, reformLens);
  opacity = lerp(1, index === 2 ? 0.6 : 0.5, reformLens);

  // SEAL: tight pose
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
  const irisOpen = smoothstep(0.13, 0.28, progress);
  const aboutBand = smoothstep(0.66, 0.80, progress);
  const contactBand = smoothstep(0.92, 0.98, progress);

  const dolly = irisOpen * (1 - smoothstep(0.25, 0.4, progress));
  const z = lerp(4.6, 5.4, irisOpen) - 1.2 * dolly - 0.3 * aboutBand + 0.15 * contactBand;
  const fov = lerp(32, 44, irisOpen) + 6 * dolly;

  return { z, fov, focusZ: z - 2 };
}
