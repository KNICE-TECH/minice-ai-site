import { useFrame, useThree } from "@react-three/fiber";
import { useProgressStore } from "@/scroll/progressStore";
import { cameraPoseFor } from "./bladePoseFor";
import type { PerspectiveCamera } from "three";

export function CameraRig() {
  const { camera } = useThree();

  useFrame((_, delta) => {
    const p = useProgressStore.getState().progress;
    const pose = cameraPoseFor(p);
    const cam = camera as PerspectiveCamera;
    cam.position.z += (pose.z - cam.position.z) * Math.min(1, delta * 4);
    if (cam.fov !== pose.fov) {
      cam.fov += (pose.fov - cam.fov) * Math.min(1, delta * 4);
      cam.updateProjectionMatrix();
    }
  });

  return null;
}
