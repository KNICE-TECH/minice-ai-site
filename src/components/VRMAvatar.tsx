import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { VRMLoaderPlugin, VRMUtils, type VRM } from "@pixiv/three-vrm";
import { bootSignal } from "@/lib/bootSignal";
import { loadProtectedAsset } from "@/lib/protectedAsset";

type VRMAvatarProps = {
  url: string;
  className?: string;
};

const EMOTIONS = ["neutral", "happy", "angry", "sad", "relaxed", "surprised"] as const;

export function VRMAvatar({ url, className }: VRMAvatarProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [emotion, setEmotion] = useState<(typeof EMOTIONS)[number]>("neutral");
  const emotionRef = useRef<(typeof EMOTIONS)[number]>("neutral");

  useEffect(() => {
    emotionRef.current = emotion;
  }, [emotion]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let raf = 0;
    let vrm: VRM | null = null;
    let mx = 0;
    let my = 0;
    let tx = 0;
    let ty = 0;

    let nextBlinkAt = 2 + Math.random() * 3;
    let blinkStart = -1;
    const BLINK_DURATION = 0.16;
    let elapsed = 0;

    const emotionWeights: Record<string, number> = {
      neutral: 1,
      happy: 0,
      angry: 0,
      sad: 0,
      relaxed: 0,
      surprised: 0,
    };
    const EMOTION_LERP = 14.0;

    // Canvas can measure 0 on the first synchronous read if its parent hasn't
    // laid out yet. Guard with sane minimums so the renderer initialises and
    // the ResizeObserver below catches the real size on the next frame.
    const w = Math.max(canvas.clientWidth, 320);
    const h = Math.max(canvas.clientHeight, 320);

    // Render at a low DPR until the model finishes parsing; bump to the target
    // quality after load so we don't pay the high-res cost during the GLB spike.
    const QUALITY = 0.8;
    const targetDPR = Math.min(window.devicePixelRatio, 2) * QUALITY;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(0.6);
    renderer.setSize(w, h, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    let signalled = false;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(24, w / h, 0.1, 30);
    camera.position.set(0, 1.5, 1.25);
    camera.lookAt(0, 1.2, 0);

    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const accent = new THREE.DirectionalLight(0xd4a574, 1.1);
    accent.position.set(2, 3, 2);
    scene.add(accent);
    const cool = new THREE.DirectionalLight(0xe8d4b8, 0.55);
    cool.position.set(-2.5, 1, 1.5);
    scene.add(cool);
    const key = new THREE.DirectionalLight(0xffffff, 0.8);
    key.position.set(0, 2, 3);
    scene.add(key);

    // KTX2 textures inside the GLB still go through three's loader, but the
    // GLB itself comes from the protected pipeline (token + encrypted blob +
    // WASM decrypt) — never as a raw .vrm URL. The LoadingManager exists
    // only to keep the KTX2 loader's progress events flowing.
    const manager = new THREE.LoadingManager();
    manager.onError = (u) => {
      if (disposed) return;
      console.error("KTX2 asset failed", u);
    };

    const ktx2Loader = new KTX2Loader(manager)
      .setTranscoderPath("/vendor/basis/")
      .detectSupport(renderer);

    const loader = new GLTFLoader(manager);
    loader.setKTX2Loader(ktx2Loader);
    loader.register((parser) => new VRMLoaderPlugin(parser));

    // Defer the heavy work into idle time so the React commit + any in-flight
    // scroll/layout settles before the network fetch + WASM decrypt spike.
    const ric: (cb: () => void) => number =
      (window as unknown as { requestIdleCallback?: (cb: () => void) => number })
        .requestIdleCallback ?? ((cb) => window.setTimeout(cb, 200));

    // The `url` prop is now a *name* (e.g. "nayu") passed to the protected
    // pipeline, not a fetchable URL. Strip a leading slash for backward
    // compatibility with the previous API.
    const assetName = url.replace(/^\/+/, "").replace(/\.[a-z0-9]+$/i, "");

    const startLoad = async () => {
      if (disposed) return;
      try {
        // Fetch the encrypted blob and decrypt in WASM. Progress here is
        // download-only (0..0.8); transcode + parse + compile cover the rest.
        const plain = await loadProtectedAsset(assetName, (p) => {
          if (disposed) return;
          setProgress(p);
          bootSignal.setProgress(p * 0.8);
        });
        if (disposed) return;

        // parse() takes the GLB bytes directly — no URL ever hits the wire
        // for the actual model. KTX2 transcode + texture upload happen here.
        bootSignal.setProgress(0.85);
        loader.parse(
          plain,
          "",
          (gltf) => {
            if (disposed) return;
            const loaded = gltf.userData.vrm as VRM | undefined;
            if (!loaded) {
              setError("not a VRM file");
              return;
            }
            VRMUtils.removeUnnecessaryVertices(gltf.scene);
            VRMUtils.combineSkeletons(gltf.scene);

            const humanoid = loaded.humanoid;
            const leftUpperArm = humanoid?.getNormalizedBoneNode("leftUpperArm");
            const rightUpperArm = humanoid?.getNormalizedBoneNode("rightUpperArm");
            const leftLowerArm = humanoid?.getNormalizedBoneNode("leftLowerArm");
            const rightLowerArm = humanoid?.getNormalizedBoneNode("rightLowerArm");
            if (leftUpperArm) leftUpperArm.rotation.z = -1.3;
            if (rightUpperArm) rightUpperArm.rotation.z = 1.3;
            if (leftLowerArm) leftLowerArm.rotation.z = -0.15;
            if (rightLowerArm) rightLowerArm.rotation.z = 0.15;

            scene.add(loaded.scene);
            vrm = loaded;
            renderer.setPixelRatio(targetDPR);
            const cw = Math.max(canvas.clientWidth, 320);
            const ch = Math.max(canvas.clientHeight, 320);
            renderer.setSize(cw, ch, false);
            camera.aspect = cw / ch;
            camera.updateProjectionMatrix();

            // Pre-warm: compile materials + upload textures to the GPU now,
            // synchronously, so the FIRST visible frame doesn't pay that cost.
            try {
              renderer.compile(scene, camera);
            } catch (e) {
              console.warn("compile failed", e);
            }

            renderer.render(scene, camera);
            setProgress(1);
            setLoading(false);

            if (!signalled) {
              bootSignal.markReady();
              signalled = true;
            }
          },
          (err) => {
            if (disposed) return;
            console.error("VRM parse failed", err);
            setError("parse failed");
            bootSignal.markReady();
            signalled = true;
          },
        );
      } catch (err) {
        if (disposed) return;
        console.error("VRM load failed", err);
        setError("load failed");
        bootSignal.markReady();
        signalled = true;
      }
    };
    ric(() => {
      void startLoad();
    });

    function onMove(e: MouseEvent) {
      if (!canvas) return;
      const r = canvas.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      mx = (e.clientX - cx) / r.width;
      my = (e.clientY - cy) / r.height;
    }
    window.addEventListener("mousemove", onMove);

    const clock = new THREE.Clock();
    function loop() {
      if (disposed) return;
      const dt = clock.getDelta();
      elapsed += dt;
      tx += (mx - tx) * 0.06;
      ty += (my - ty) * 0.06;

      if (vrm) {
        const MAX = Math.PI / 2;
        const TILT_MAX = Math.PI / 6;
        const total = Math.max(-MAX, Math.min(MAX, tx * 1.5));
        const tilt = Math.max(-TILT_MAX, Math.min(TILT_MAX, ty * 0.8));
        vrm.scene.rotation.y = total * 0.3;
        const head = vrm.humanoid?.getNormalizedBoneNode("head");
        if (head) {
          head.rotation.y = total * 0.7;
          head.rotation.x = tilt;
        }

        const em = vrm.expressionManager;
        if (em) {
          const active = emotionRef.current;
          const k = 1 - Math.exp(-EMOTION_LERP * dt);
          for (const name of EMOTIONS) {
            const target = name === active ? 1 : 0;
            emotionWeights[name] += (target - emotionWeights[name]) * k;
            em.setValue(name, emotionWeights[name]);
          }

          if (blinkStart < 0 && elapsed >= nextBlinkAt) {
            blinkStart = elapsed;
          }
          let blinkWeight = 0;
          if (blinkStart >= 0) {
            const p = (elapsed - blinkStart) / BLINK_DURATION;
            if (p >= 1) {
              blinkStart = -1;
              nextBlinkAt = elapsed + 2.5 + Math.random() * 3;
            } else {
              blinkWeight = p < 0.5 ? p * 2 : (1 - p) * 2;
            }
          }
          em.setValue("blink", blinkWeight);
        }

        vrm.update(dt);
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    }
    loop();

    const ro = new ResizeObserver(() => {
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;
      renderer.setSize(W, H, false);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    });
    ro.observe(canvas);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      ro.disconnect();
      if (vrm) {
        scene.remove(vrm.scene);
        VRMUtils.deepDispose(vrm.scene);
      }
      ktx2Loader.dispose();
      renderer.dispose();
    };
  }, [url]);

  function cycleEmotion() {
    setEmotion((prev) => {
      const idx = EMOTIONS.indexOf(prev);
      return EMOTIONS[(idx + 1) % EMOTIONS.length];
    });
  }

  return (
    <div className={`relative select-none w-full h-full ${className ?? ""}`}>
      <canvas
        ref={canvasRef}
        onClick={cycleEmotion}
        className="absolute inset-0 w-full h-full cursor-pointer"
      />
      {(loading || error) && (
        <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] uppercase tracking-[.22em] text-white/45 pointer-events-none">
          {error
            ? `vrm · ${error}`
            : progress > 0
              ? `vrm · ${Math.round(progress * 100)}%`
              : "loading vrm…"}
        </div>
      )}
    </div>
  );
}
