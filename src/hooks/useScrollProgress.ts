import { useProgressStore } from "@/scroll/progressStore";
import type { SectionId } from "@/scroll/sections";
import { SECTION_RANGES } from "@/scroll/sections";
import { mapRange } from "@/lib/math";

export function useScrollProgress(): number {
  return useProgressStore((s) => s.progress);
}

export function useSectionProgress(id: SectionId): number {
  return useProgressStore((s) => {
    const [a, b] = SECTION_RANGES[id];
    return mapRange(s.progress, a, b, 0, 1, true);
  });
}
