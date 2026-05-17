import * as THREE from "three";

// Procedural pixelated normal map — creates random per-pixel surface bumps
// that catch light and produce a metallic micro-faceted shimmer.
// Cached so all blades share the same texture instance.
let _normalMap: THREE.CanvasTexture | null = null;

export function getBladeNormalMap(cells = 28, strength = 0.85): THREE.CanvasTexture {
  if (_normalMap) return _normalMap;
  const c = document.createElement("canvas");
  c.width = c.height = cells;
  const ctx = c.getContext("2d")!;
  const img = ctx.createImageData(cells, cells);
  for (let i = 0; i < cells * cells; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * strength;
    const nx = Math.cos(a) * r;
    const ny = Math.sin(a) * r;
    const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
    img.data[i * 4 + 0] = Math.round((nx * 0.5 + 0.5) * 255);
    img.data[i * 4 + 1] = Math.round((ny * 0.5 + 0.5) * 255);
    img.data[i * 4 + 2] = Math.round((nz * 0.5 + 0.5) * 255);
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.NearestFilter;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.needsUpdate = true;
  _normalMap = tex;
  return tex;
}
