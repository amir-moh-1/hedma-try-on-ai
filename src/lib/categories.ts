export const CATEGORY_AR: Record<string, string> = {
  tshirts: "تيشيرتات",
  "t-shirts": "تيشيرتات",
  shirts: "قمصان",
  pants: "بناطيل",
  jeans: "جينز",
  shoes: "كوتشيات",
  sneakers: "كوتشيات",
  accessories: "إكسسوارات",
  belts: "أحزمة",
  jackets: "جواكت",
  hoodies: "هودي",
  shorts: "شورتات",
  other: "متنوع",
  all: "الكل",
};

export const CATEGORY_COLORS: Record<string, { bg: string, text: string, border: string }> = {
  tshirts: { bg: "bg-amber-50 dark:bg-amber-950/20", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200/50 dark:border-amber-900/30" },
  "t-shirts": { bg: "bg-amber-50 dark:bg-amber-950/20", text: "text-amber-700 dark:text-amber-400", border: "border-amber-200/50 dark:border-amber-900/30" },
  shirts: { bg: "bg-rose-50 dark:bg-rose-950/20", text: "text-rose-700 dark:text-rose-400", border: "border-rose-200/50 dark:border-rose-900/30" },
  pants: { bg: "bg-blue-50 dark:bg-blue-950/20", text: "text-blue-700 dark:text-blue-400", border: "border-blue-200/50 dark:border-blue-900/30" },
  jeans: { bg: "bg-sky-50 dark:bg-sky-950/20", text: "text-sky-700 dark:text-sky-400", border: "border-sky-200/50 dark:border-sky-900/30" },
  shoes: { bg: "bg-emerald-50 dark:bg-emerald-950/20", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-200/50 dark:border-emerald-900/30" },
  sneakers: { bg: "bg-emerald-50 dark:bg-emerald-950/20", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-200/50 dark:border-emerald-900/30" },
  accessories: { bg: "bg-purple-50 dark:bg-purple-950/20", text: "text-purple-700 dark:text-purple-400", border: "border-purple-200/50 dark:border-purple-900/30" },
  belts: { bg: "bg-indigo-50 dark:bg-indigo-950/20", text: "text-indigo-700 dark:text-indigo-400", border: "border-indigo-200/50 dark:border-indigo-900/30" },
  jackets: { bg: "bg-orange-50 dark:bg-orange-950/20", text: "text-orange-700 dark:text-orange-400", border: "border-orange-200/50 dark:border-orange-900/30" },
  hoodies: { bg: "bg-teal-50 dark:bg-teal-950/20", text: "text-teal-700 dark:text-teal-400", border: "border-teal-200/50 dark:border-teal-900/30" },
  shorts: { bg: "bg-cyan-50 dark:bg-cyan-950/20", text: "text-cyan-700 dark:text-cyan-400", border: "border-cyan-200/50 dark:border-cyan-900/30" },
  other: { bg: "bg-gray-50 dark:bg-gray-900/40", text: "text-gray-700 dark:text-gray-400", border: "border-gray-200/50 dark:border-gray-800/30" },
  all: { bg: "bg-primary/5", text: "text-primary", border: "border-primary/10" }
};

export const catAr = (c: string) =>
  CATEGORY_AR[c?.toLowerCase()] ?? c;

export const getCategoryBadge = (c: string) => {
  const norm = (c ?? "").toLowerCase().trim();
  return CATEGORY_COLORS[norm] ?? { bg: "bg-yellow-50 dark:bg-yellow-950/20", text: "text-yellow-700 dark:text-yellow-400", border: "border-yellow-200/50 dark:border-yellow-900/30" };
};
