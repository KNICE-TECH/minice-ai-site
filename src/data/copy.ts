export type Locale = "en" | "ru";

type Copy = {
  nav: { work: string; about: string; contact: string };
  hero: {
    eyebrow: string;
    headline: string;
    sub: string;
    cta: string;
  };
  projects: {
    eyebrow: string;
    headline: string;
    sub: string;
    learnMore: string;
    lineage: string;
    locked: string;
    status: { live: string; "in-dev": string; retired: string; "coming-soon": string };
  };
  about: {
    eyebrow: string;
    headline: string;
    body: string[];
  };
  stellaModal: {
    title: string;
    body: string[];
    close: string;
  };
  contact: {
    eyebrow: string;
    headline: string;
    sub: string;
  };
  footer: {
    copyright: string;
    privacy: string;
    terms: string;
    audio: string;
    audioOn: string;
    audioOff: string;
    lang: string;
  };
  notFound: { headline: string; body: string; cta: string };
  privacy: { title: string; body: string };
  terms: { title: string; body: string };
};

const en: Copy = {
  nav: { work: "Work", about: "Studio", contact: "Contact" },
  hero: {
    eyebrow: "Minice — studio / ai · 2026",
    headline: "An aperture\nonto what software\ncan be.",
    sub: "Independent software studio building AI companions, desktop tools, and small precise things.",
    cta: "See the work",
  },
  projects: {
    eyebrow: "Work",
    headline: "Three blades. One aperture.",
    sub: "Live, archived, and what's forming next.",
    learnMore: "Learn more",
    lineage: "Read lineage",
    locked: "Locked",
    status: {
      live: "Live",
      "in-dev": "In Development",
      retired: "Archived",
      "coming-soon": "Coming",
    },
  },
  about: {
    eyebrow: "Studio",
    headline: "A small indie team. Two developers. Long horizons.",
    body: [
      // TODO: real origin story — Knice + Mihailin → Minice.
      "Minice came from two names colliding — Knice and Mihailin folded into one word. The aperture is our reminder: every product is a frame, and the frame matters more than the picture.",
      "We move slowly on purpose. We ship things we'd keep on our own machines for years. Software that feels less like a tool and more like a presence.",
    ],
  },
  stellaModal: {
    title: "Stella — archived 2025",
    body: [
      // TODO: real lineage story for Stella.
      "Stella was our WinUI 3 desktop companion. She taught us that a companion isn't a chatbot in a window — she's a small, persistent presence with her own rhythm.",
      "Astra inherits everything Stella got right and corrects what she didn't. Stella is retired now, but every Astra build carries her fingerprints.",
    ],
    close: "Close",
  },
  contact: {
    eyebrow: "Contact",
    headline: "Say hello.",
    sub: "We read every message. No forms — pick a channel.",
  },
  footer: {
    copyright: "© 2026 Minice",
    privacy: "Privacy",
    terms: "Terms",
    audio: "Audio",
    audioOn: "ON",
    audioOff: "OFF",
    lang: "Lang",
  },
  notFound: {
    headline: "Aperture closed.",
    body: "The page you were looking for isn't here — or never was.",
    cta: "Back to home",
  },
  privacy: {
    title: "Privacy",
    body:
      "Minice does not collect personal data on this website. No cookies, no trackers, no analytics. Product apps (such as Astra) have their own privacy policies, linked from inside the product.",
  },
  terms: {
    title: "Terms",
    body:
      "This website is provided as-is for informational purposes. Brand assets, names, and copy belong to Minice. Product terms are bundled with each product.",
  },
};

const ru: Copy = {
  nav: { work: "Работы", about: "Студия", contact: "Контакты" },
  hero: {
    eyebrow: "Minice — студия / ai · 2026",
    headline: "Диафрагма,\nчерез которую видно,\nкаким бывает софт.",
    sub: "Независимая студия. Делаем AI-компаньонов, десктоп-инструменты и маленькие точные вещи.",
    cta: "Посмотреть работы",
  },
  projects: {
    eyebrow: "Работы",
    headline: "Три лепестка. Одна диафрагма.",
    sub: "Живое, архивное и то, что формируется.",
    learnMore: "Подробнее",
    lineage: "История",
    locked: "Закрыто",
    status: {
      live: "Live",
      "in-dev": "В разработке",
      retired: "Архив",
      "coming-soon": "Скоро",
    },
  },
  about: {
    eyebrow: "Студия",
    headline: "Маленькая инди-команда. Двое. Долгий горизонт.",
    body: [
      "Minice — это два имени, сложенные в одно: Knice + Mihailin. Диафрагма — наше напоминание: каждый продукт это рамка, и рамка важнее картинки.",
      "Мы движемся медленно намеренно. Делаем то, что сами бы держали на своих машинах годами. Софт, который ощущается не инструментом, а присутствием.",
    ],
  },
  stellaModal: {
    title: "Stella — архив 2025",
    body: [
      "Stella была нашим WinUI 3 десктоп-компаньоном. Она научила нас, что компаньон — не чат-бот в окошке, а маленькое постоянное присутствие со своим ритмом.",
      "Astra наследует всё, что Stella делала правильно, и исправляет то, что нет. Stella в архиве, но каждая сборка Astra несёт её отпечатки.",
    ],
    close: "Закрыть",
  },
  contact: {
    eyebrow: "Контакты",
    headline: "Напишите.",
    sub: "Читаем каждое сообщение. Никаких форм — выберите канал.",
  },
  footer: {
    copyright: "© 2026 Minice",
    privacy: "Приватность",
    terms: "Условия",
    audio: "Звук",
    audioOn: "ВКЛ",
    audioOff: "ВЫКЛ",
    lang: "Язык",
  },
  notFound: {
    headline: "Диафрагма закрылась.",
    body: "Страница, которую вы искали, здесь не живёт — или никогда не жила.",
    cta: "На главную",
  },
  privacy: {
    title: "Приватность",
    body:
      "Minice не собирает персональные данные на этом сайте. Никаких куки, трекеров, аналитики. У продуктовых приложений (например, Astra) свои политики, доступные изнутри продукта.",
  },
  terms: {
    title: "Условия",
    body:
      "Сайт предоставляется как есть, в информационных целях. Бренд, названия и тексты принадлежат Minice. Условия использования продуктов поставляются вместе с каждым продуктом.",
  },
};

export const copy: Record<Locale, Copy> = { en, ru };
