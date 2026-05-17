import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { KernelSize } from "postprocessing";

// Bloom kicks in only for super-bright pixels (the glowing blade edges and
// flash burst) — keeps the rest of the brand-palette clean and flat.
export function PostFX() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        intensity={1.1}
        luminanceThreshold={1.0}
        luminanceSmoothing={0.4}
        kernelSize={KernelSize.LARGE}
        mipmapBlur
      />
      <Vignette eskil={false} offset={0.32} darkness={0.5} />
    </EffectComposer>
  );
}
