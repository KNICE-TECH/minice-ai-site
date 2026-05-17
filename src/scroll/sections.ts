export type SectionId = "hero" | "iris" | "projects" | "about" | "contact";

export const SECTION_RANGES: Record<SectionId, [number, number]> = {
  hero: [0.0, 0.22],
  iris: [0.22, 0.3],
  projects: [0.25, 0.5],
  about: [0.55, 0.75],
  contact: [0.8, 1.0],
};
