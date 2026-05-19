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
    headline: "Small, precise software\nthat feels\nlike a presence.",
    sub: "An independent studio building AI companions, desktop tools, and things we'd keep on our own machines for years.",
    cta: "See the work",
  },
  projects: {
    eyebrow: "Work",
    headline: "Cut from one crystal.",
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
      "Minice is two names folded into one — Knice and Miha, collided into a single word. The studio is one crystal; every product is a facet of it — the same idea seen from a new angle. The cut matters more than the stone.",
      "We move slowly on purpose. We ship things we'd keep on our own machines for years — software that feels less like a tool and more like a presence.",
    ],
  },
  stellaModal: {
    title: "Stella — archived 2025",
    body: [
      "Stella was our first assistant. Python, 2023. Rough, local, and ours — a small persistent presence we used every day, more than a chatbot in a window.",
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
    headline: "No facet here.",
    body: "The page you were looking for isn't part of this crystal — or never was.",
    cta: "Back to home",
  },
  privacy: {
    title: "Privacy",
    body:
      "Minice doesn't collect personal data on this website — no cookies, no trackers, no analytics. Our products, such as Astra, have their own privacy policies, available inside each app.",
  },
  terms: {
    title: "Terms",
    body:
      "This website is provided as-is, for informational purposes.\n\nThe Minice name, logo, and written copy belong to Minice. The 3D character model shown on this site (Nayu) is the work of 有坂みと (Mito Arisaka) and is used under license — it is not a Minice asset, and may not be downloaded, extracted, or redistributed.\n\nEach Minice product has its own terms, bundled with that product.",
  },
};

const ru: Copy = {
  nav: { work: "Работы", about: "Студия", contact: "Контакты" },
  hero: {
    eyebrow: "Minice — студия / ai · 2026",
    headline: "Маленький точный софт,\nкоторый ощущается\nкак присутствие.",
    sub: "Независимая студия. Делаем AI-компаньонов, десктоп-инструменты и вещи, которые сами держали бы на своих машинах годами.",
    cta: "Посмотреть работы",
  },
  projects: {
    eyebrow: "Работы",
    headline: "Грани одного кристалла.",
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
      "Minice — это два имени, сложенные в одно: Knice и Miha. Студия — это кристалл, а каждый продукт — его грань, та же идея под новым углом. Огранка важнее камня.",
      "Мы движемся медленно намеренно. Делаем то, что сами бы держали на своих машинах годами — софт, который ощущается не инструментом, а присутствием.",
    ],
  },
  stellaModal: {
    title: "Stella — архив 2025",
    body: [
      "Stella была нашим первым ассистентом. Python, 2023. Сырая, локальная и наша — маленькое постоянное присутствие, которым мы пользовались каждый день, не чат-бот в окошке.",
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
    headline: "Нет такой грани.",
    body: "Страница, которую вы искали, не часть этого кристалла — или никогда не была.",
    cta: "На главную",
  },
  privacy: {
    title: "Приватность",
    body:
      "Minice не собирает персональные данные на этом сайте — никаких куки, трекеров, аналитики. У наших продуктов, например Astra, есть собственные политики приватности, доступные внутри каждого приложения.",
  },
  terms: {
    title: "Условия",
    body:
      "Сайт предоставляется как есть, в информационных целях.\n\nНазвание Minice, логотип и тексты принадлежат Minice. 3D-модель персонажа на этом сайте (Nayu) — работа 有坂みと (Mito Arisaka), используется по лицензии. Это не ассет Minice, её нельзя скачивать, извлекать или распространять.\n\nУ каждого продукта Minice свои условия, поставляемые вместе с продуктом.",
  },
};

export const copy: Record<Locale, Copy> = { en, ru };
