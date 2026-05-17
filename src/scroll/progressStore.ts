import { create } from "zustand";
import { mapRange } from "@/lib/math";
import { SECTION_RANGES, type SectionId } from "./sections";

type ProgressState = {
  progress: number;
  set: (p: number) => void;
  sectionProgress: (id: SectionId) => number;
};

export const useProgressStore = create<ProgressState>((set, get) => ({
  progress: 0,
  set: (p) => set({ progress: p }),
  sectionProgress: (id) => {
    const [a, b] = SECTION_RANGES[id];
    return mapRange(get().progress, a, b, 0, 1, true);
  },
}));

export function getProgress() {
  return useProgressStore.getState().progress;
}

export function getSectionProgress(id: SectionId) {
  return useProgressStore.getState().sectionProgress(id);
}
