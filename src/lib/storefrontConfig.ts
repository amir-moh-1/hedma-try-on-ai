export type StorefrontAudience = "under25" | "over25";
export type CardShape = "rounded" | "rectangle" | "pill" | "sharp";

export type StorefrontTheme = {
  heroTitle: string;
  heroSubtitle: string;
  ctaText: string;
  backgroundColor: string;
  sectionColor: string;
  textColor: string;
  mutedTextColor: string;
  accentColor: string;
  cardShape: CardShape;
  logoUrl: string;
  logoAlign: "start" | "center" | "end";
  logoOffsetX: number;
  logoOffsetY: number;
  seasonalImage: string;
  instagramHandle: string;
};

export type StorefrontBuilderState = {
  drafts: Record<StorefrontAudience, StorefrontTheme>;
  published: Record<StorefrontAudience, StorefrontTheme>;
  updatedAt?: string;
};

export const defaultStorefrontThemes: Record<StorefrontAudience, StorefrontTheme> = {
  under25: {
    heroTitle: "أسلوبك يعبر عنك",
    heroSubtitle: "ستريت وير بطابع جريء، خامات قوية، وتفاصيل نيون تليق بجيلك.",
    ctaText: "تسوق الآن",
    backgroundColor: "#121212",
    sectionColor: "#1A1A1A",
    textColor: "#F7F7F2",
    mutedTextColor: "#A3A3A3",
    accentColor: "#A3E635",
    cardShape: "rounded",
    logoUrl: "",
    logoAlign: "center",
    logoOffsetX: 0,
    logoOffsetY: 0,
    seasonalImage: "",
    instagramHandle: "@hadma.wear",
  },
  over25: {
    heroTitle: "أناقة هادئة بتفاصيل فاخرة",
    heroSubtitle: "اختيارات كلاسيكية، خامات ناعمة، ومظهر بريميوم يناسب كل يوم.",
    ctaText: "اكتشف المجموعة",
    backgroundColor: "#F5F0E8",
    sectionColor: "#FFFFFF",
    textColor: "#1A1A1A",
    mutedTextColor: "#7C7468",
    accentColor: "#D4A017",
    cardShape: "rectangle",
    logoUrl: "",
    logoAlign: "center",
    logoOffsetX: 0,
    logoOffsetY: 0,
    seasonalImage: "",
    instagramHandle: "@hadma.wear",
  },
};

export function normalizeStorefrontBuilder(value: unknown): StorefrontBuilderState {
  const raw = (value && typeof value === "object" ? value : {}) as Partial<StorefrontBuilderState>;
  return {
    drafts: {
      under25: { ...defaultStorefrontThemes.under25, ...(raw.drafts?.under25 ?? {}) },
      over25: { ...defaultStorefrontThemes.over25, ...(raw.drafts?.over25 ?? {}) },
    },
    published: {
      under25: { ...defaultStorefrontThemes.under25, ...(raw.published?.under25 ?? {}) },
      over25: { ...defaultStorefrontThemes.over25, ...(raw.published?.over25 ?? {}) },
    },
    updatedAt: raw.updatedAt,
  };
}

export function shapeClass(shape: CardShape) {
  if (shape === "sharp") return "rounded-none";
  if (shape === "rectangle") return "rounded-md";
  if (shape === "pill") return "rounded-[2rem]";
  return "rounded-2xl";
}

export function splitQuickLinks(value: unknown) {
  const defaultLinks = [
    { label: "الرئيسية", to: "/" },
    { label: "المنتجات", to: "/products" },
    { label: "جرّب بالـ AI", to: "/try-on" },
    { label: "زبايننا", to: "/customers" },
    { label: "قصتنا", to: "/our-story" },
  ];
  if (Array.isArray(value)) return { links: value, meta: {} as Record<string, unknown> };
  const objectValue = value && typeof value === "object" ? (value as any) : {};
  return {
    links: Array.isArray(objectValue.links) ? objectValue.links : defaultLinks,
    meta: objectValue.__metadata && typeof objectValue.__metadata === "object" ? objectValue.__metadata : {},
  };
}