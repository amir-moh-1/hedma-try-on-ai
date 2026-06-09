import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { normalizeStorefrontBuilder, splitQuickLinks } from "@/lib/storefrontConfig";

export type SiteSettings = {
  whatsapp: string;
  email: string;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  address: string | null;
  quick_links: { label: string; to: string }[];
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
};

export function useSiteSettings() {
  const { data } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("id", "main").maybeSingle();
      if (!data) return DEFAULTS;

      // Smart Metadata Fallback
      const { links, meta } = splitQuickLinks(data.quick_links);
      
      return {
        whatsapp: data.whatsapp ?? DEFAULTS.whatsapp,
        email: data.email ?? DEFAULTS.email,
        instagram_url: data.instagram_url ?? "",
        facebook_url: data.facebook_url ?? "",
        tiktok_url: data.tiktok_url ?? "",
        address: data.address ?? DEFAULTS.address,
        quick_links: links,
        // Branding & Extended Settings
        logo_url: (data as any).logo_url || meta.logo_url || "",
        slogan: (data as any).slogan || meta.slogan || "",
        marquee_text: (data as any).marquee_text || meta.marquee_text || "",
        marquee_visible: (data as any).marquee_visible ?? meta.marquee_visible ?? true,
        shipping_text: (data as any).shipping_text || meta.shipping_text || "",
        fast_shipping_text: (data as any).fast_shipping_text || meta.fast_shipping_text || "",
        social_proof_enabled: (data as any).social_proof_enabled ?? meta.social_proof_enabled ?? true,
        social_proof_real_data: (data as any).social_proof_real_data ?? meta.social_proof_real_data ?? false,
        // Admin shadow data
        banned_users: meta.banned_users || {},
        user_passwords: meta.user_passwords || {},
        storefront_builder: normalizeStorefrontBuilder(meta.storefront_builder),
      } as any;
    },
    staleTime: 60_000,
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
