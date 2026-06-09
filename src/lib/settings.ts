import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SiteSettings = {
  whatsapp: string;
  email: string;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  address: string | null;
  quick_links: { label: string; to: string }[];
  // Branding
  logo_url?: string;
  slogan?: string;
  // Marquee
  marquee_text?: string;
  marquee_visible?: boolean;
  // Trust texts
  shipping_text?: string;
  fast_shipping_text?: string;
  trust_shipping?: string;
  trust_quality?: string;
  trust_ai?: string;
  trust_support?: string;
  // Social proof
  social_proof_enabled?: boolean;
  social_proof_real_data?: boolean;
  // Hero texts (default)
  hero_title?: string;
  hero_subtitle?: string;
  // Youth theme texts (age <= 25)
  youth_hero_title?: string;
  youth_hero_subtitle?: string;
  youth_cta_text?: string;
  // Premium theme texts (age >= 26)
  premium_hero_title?: string;
  premium_hero_subtitle?: string;
  premium_cta_text?: string;
  // Admin internal
  banned_users?: Record<string, any>;
  user_passwords?: Record<string, any>;
};

const DEFAULTS: SiteSettings = {
  whatsapp: "201229344711",
  email: "hedma.tk@gmail.com",
  instagram_url: "",
  facebook_url: "",
  tiktok_url: "",
  address: "التل الكبير، الإسماعيلية",
  quick_links: [
    { label: "الرئيسية", to: "/" },
    { label: "المنتجات", to: "/products" },
    { label: "جرّب بالـ AI", to: "/try-on" },
    { label: "زبايننا", to: "/customers" },
    { label: "قصتنا", to: "/our-story" },
  ],
  hero_title: "أناقتك بلمسة هدمة",
  hero_subtitle: "",
  youth_hero_title: "اللبس اللي بيعبر عنك",
  youth_hero_subtitle: "ترندات جديدة كل أسبوع 🔥",
  youth_cta_text: "شوف الأحدث",
  premium_hero_title: "أناقتك بلمسة هدمة",
  premium_hero_subtitle: "مجموعة راقية لأصحاب الذوق الرفيع",
  premium_cta_text: "تسوّق المجموعة",
  trust_shipping: "شحن سريع خلال ٤٨ ساعة",
  trust_quality: "جودة مضمونة وإرجاع سهل",
  trust_ai: "جرّب اللبس بذكاء اصطناعي",
  trust_support: "دعم واتساب على مدار اليوم",
};

export function useSiteSettings(): SiteSettings {
  const { data } = useQuery({
    queryKey: ["site-settings"],
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("id", "main").maybeSingle();
      if (!data) return DEFAULTS;

      let meta: any = {};
      let links: any[] = DEFAULTS.quick_links;

      if (data.quick_links) {
        if (Array.isArray(data.quick_links)) {
          links = data.quick_links;
        } else {
          links = (data.quick_links as any).links || DEFAULTS.quick_links;
          meta = (data.quick_links as any).__metadata || {};
        }
      }

      const pick = (key: string, def?: any) =>
        (data as any)[key] ?? meta[key] ?? def;

      return {
        whatsapp: pick("whatsapp", DEFAULTS.whatsapp),
        email: pick("email", DEFAULTS.email),
        instagram_url: pick("instagram_url", ""),
        facebook_url: pick("facebook_url", ""),
        tiktok_url: pick("tiktok_url", ""),
        address: pick("address", DEFAULTS.address),
        quick_links: links,
        logo_url: pick("logo_url", ""),
        slogan: pick("slogan", ""),
        marquee_text: pick("marquee_text", ""),
        marquee_visible: pick("marquee_visible", true),
        shipping_text: pick("shipping_text", ""),
        fast_shipping_text: pick("fast_shipping_text", ""),
        social_proof_enabled: pick("social_proof_enabled", true),
        social_proof_real_data: pick("social_proof_real_data", false),
        hero_title: pick("hero_title", DEFAULTS.hero_title),
        hero_subtitle: pick("hero_subtitle", ""),
        youth_hero_title: pick("youth_hero_title", DEFAULTS.youth_hero_title),
        youth_hero_subtitle: pick("youth_hero_subtitle", DEFAULTS.youth_hero_subtitle),
        youth_cta_text: pick("youth_cta_text", DEFAULTS.youth_cta_text),
        premium_hero_title: pick("premium_hero_title", DEFAULTS.premium_hero_title),
        premium_hero_subtitle: pick("premium_hero_subtitle", DEFAULTS.premium_hero_subtitle),
        premium_cta_text: pick("premium_cta_text", DEFAULTS.premium_cta_text),
        trust_shipping: pick("trust_shipping", DEFAULTS.trust_shipping),
        trust_quality: pick("trust_quality", DEFAULTS.trust_quality),
        trust_ai: pick("trust_ai", DEFAULTS.trust_ai),
        trust_support: pick("trust_support", DEFAULTS.trust_support),
        banned_users: meta.banned_users || {},
        user_passwords: meta.user_passwords || {},
      } as SiteSettings;
    },
  });
  return data ?? DEFAULTS;
}

export const ORDER_STATUS_AR: Record<string, string> = {
  pending: "قيد المراجعة",
  approved: "تم القبول",
  assigned: "تم تعيين مندوب",
  in_transit: "في الطريق إليك",
  delivered: "تم التسليم ✅",
  cancelled: "ملغي",
};

export const ORDER_STATUS_STEPS = ["pending", "approved", "assigned", "in_transit", "delivered"] as const;
