type Meta = { title: string; description: string };

export const seo = {
  home: {
    title: "Minice — an aperture onto what software can be.",
    description: "Independent software studio. AI companions, tools, and frames onto what software can be.",
  },
  privacy: {
    title: "Privacy — Minice",
    description: "Privacy policy for minice.ai and the Minice studio.",
  },
  terms: {
    title: "Terms — Minice",
    description: "Terms of use for minice.ai and the Minice studio.",
  },
  notFound: {
    title: "404 — Minice",
    description: "The aperture closed on this page.",
  },
} satisfies Record<string, Meta>;

export function applyMeta(meta: Meta) {
  document.title = meta.title;
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute("content", meta.description);
}
