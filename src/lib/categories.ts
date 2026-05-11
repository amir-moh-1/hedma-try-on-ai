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

export const catAr = (c: string) =>
  CATEGORY_AR[c?.toLowerCase()] ?? c;
