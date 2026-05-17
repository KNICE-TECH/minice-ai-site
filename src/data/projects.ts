export type ProjectStatus = "live" | "in-dev" | "retired" | "coming-soon";

export type Project = {
  id: string;
  name: string;
  status: ProjectStatus;
  tagline: string;
  blurb: string;
  href?: string;
  external?: boolean;
};

export const projects: Project[] = [
  {
    id: "astra",
    name: "Astra",
    status: "in-dev",
    tagline: "Your AI companion.",
    blurb:
      "An anime-adjacent desktop companion that lives at the edge of your screen. Built on a custom runtime, polished daily.",
    href: "https://astra.minice.ai",
    external: true,
  },
  {
    id: "stella",
    name: "Stella",
    status: "retired",
    tagline: "Where Astra came from.",
    blurb:
      "Our WinUI 3 predecessor. Stella taught us what a desktop companion should and shouldn't be — its lessons live inside Astra.",
  },
  {
    id: "horizon",
    name: "???",
    status: "coming-soon",
    tagline: "Something is forming.",
    blurb: "Locked.",
  },
  {
    id: "atlas",
    name: "???",
    status: "coming-soon",
    tagline: "Aperture is widening.",
    blurb: "Locked.",
  },
];
