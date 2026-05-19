import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { KernelSize } from "postprocessing";

// Bloom kicks in only for super-bright pixels (the glowing blade edges and
// flash burst) — keeps the rest of the brand-palette clean and flat.
export function PostFX() {
  return (
    <EffectComposer multisampling={0}>
      {/* Threshold pushed well above 1 so a single bright facet spec doesn't
          balloon through bloom. Only the deliberately-bright additive edge
          lines (color > 1.0 via toneMapped: false) cross the gate. */}
      <Bloom
        intensity={0.32}
        luminanceThreshold={1.9}
        luminanceSmoothing={0.35}
        kernelSize={KernelSize.SMALL}
        mipmapBlur
      />
      <Vignette eskil={false} offset={0.32} darkness={0.5} />
    </EffectComposer>
  );
}
