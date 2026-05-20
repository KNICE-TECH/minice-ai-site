type Meta = { title: string; description: string };

export const seo = {
  home: {
    title: "Minice — small, precise software that feels like a presence.",
    description:
      "Independent software studio building AI companions, desktop tools, and things we'd keep on our own machines for years.",
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
    description: "No facet here — the page you were looking for isn't part of this crystal.",
  },
} satisfies Record<string, Meta>;

export function applyMeta(meta: Meta) {
  document.title = meta.title;
  const desc = document.querySelector('meta[name="description"]');
  if (desc) desc.setAttribute("content", meta.description);
}
