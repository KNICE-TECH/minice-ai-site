export type Social = { id: string; label: string; href: string; handle: string };

export const socials: Social[] = [
  { id: "email", label: "Email", href: "mailto:hi@minice.ai", handle: "hi@minice.ai" },
  {
    id: "steam",
    label: "Steam",
    href: "https://store.steampowered.com/app/3853440/",
    handle: "store page",
  },
  {
    id: "github",
    label: "GitHub",
    href: "https://github.com/mihailinl",
    handle: "@mihailinl",
  },
  {
    id: "x",
    label: "X",
    href: "https://x.com/MiniceAI",
    handle: "@MiniceAI",
  },
];
