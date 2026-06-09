import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { Sparkles, Truck, ShieldCheck, Headphones, ArrowLeft } from "lucide-react";
import { CustomerPhotosGrid } from "@/components/CustomerPhotosGrid";
import { Countdown } from "@/components/Countdown";
import { SmartSearch } from "@/components/SmartSearch";
import { useSiteSettings } from "@/lib/settings";
import { useStorefrontTheme } from "@/lib/storefront-theme";
import { useTheme } from "@/components/ThemeProvider";
import { YouthStorefront } from "@/components/YouthStorefront";
import { AgeSelector } from "@/components/AgeSelector";
import { useEffect } from "react";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const settings = useSiteSettings();
  const { storefrontTheme: theme } = useStorefrontTheme();
  const { setTheme } = useTheme();

  // Force dark mode for youth segment
  useEffect(() => {
    if (theme === "youth") setTheme("dark");
  }, [theme, setTheme]);

  // Show age selector first time
  const needsAgeSelector = theme === "default";

  // Pick hero text based on current storefront theme
  const heroTitle = theme === "youth"
    ? (settings.youth_hero_title || "ط§ظ„ظ„ط¨ط³ ط§ظ„ظ„ظٹ ط¨ظٹط¹ط¨ط± ط¹ظ†ظƒ")
    : (settings.premium_hero_title || "ط£ظ†ط§ظ‚طھظƒ ط¨ظ„ظ…ط³ط© ظ‡ط¯ظ…ط©");
  const heroSubtitle = theme === "youth"
    ? (settings.youth_hero_subtitle || "")
    : (settings.premium_hero_subtitle || "");
  const ctaText = theme === "youth"
    ? (settings.youth_cta_text || "ط´ظˆظپ ط§ظ„ط£ط­ط¯ط«")
    : (settings.premium_cta_text || "طھط³ظˆظ‘ظ‚ ط§ظ„ظ…ط¬ظ…ظˆط¹ط©");

  const { data: bestSellers } = useQuery({
    queryKey: ["home-bestsellers"],
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id,name,price,image_url,category,stock")
        .eq("active", true)
        .order("stock", { ascending: false })
        .limit(4);
      return data ?? [];
    },
  });

  const { data: globalOffer } = useQuery({
    queryKey: ["global-offer"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("product_offers")
        .select("title,percent,ends_at")
        .is("product_id", null)
        .eq("active", true)
        .gt("ends_at", new Date().toISOString())
        .order("percent", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const categories = [
    { label: "طھظٹط´ظٹط±طھط§طھ", icon: "ًں‘•", key: "tshirts" },
    { label: "ط¨ظ†ط§ط·ظٹظ„", icon: "ًں‘–", key: "pants" },
    { label: "ظƒظˆطھط´ظٹط§طھ", icon: "ًں‘ں", key: "shoes" },
    { label: "ط¥ظƒط³ط³ظˆط§ط±ط§طھ", icon: "ًںژ’", key: "accessories" },
    { label: "ظ‚ظ…طµط§ظ†", icon: "ًں‘”", key: "shirts" },
  ];

  const trustItems = [
    { Icon: Truck, t: settings.trust_shipping || "ط´ط­ظ† ط³ط±ظٹط¹", s: "ط®ظ„ط§ظ„ ظ¤ظ¨ ط³ط§ط¹ط© ظ„ظƒظ„ ظ…ط­ط§ظپط¸ط§طھ ظ…طµط±" },
    { Icon: ShieldCheck, t: settings.trust_quality || "ط¬ظˆط¯ط© ظ…ط¶ظ…ظˆظ†ط©", s: "ط¥ط±ط¬ط§ط¹ ظˆط§ط³طھط¨ط¯ط§ظ„ ط®ظ„ط§ظ„ ظ،ظ¤ ظٹظˆظ…" },
    { Icon: Sparkles, t: settings.trust_ai || "AI Try-On", s: "ط¬ط±ظ‘ط¨ ط§ظ„ظ„ط¨ط³ ط¨ط°ظƒط§ط، ط§طµط·ظ†ط§ط¹ظٹ" },
    { Icon: Headphones, t: settings.trust_support || "ط¯ط¹ظ… ظˆط§طھط³ط§ط¨", s: "ط®ط¯ظ…ط© ط¹ظ…ظ„ط§ط، ط¹ظ„ظ‰ ظ…ط¯ط§ط± ط§ظ„ظٹظˆظ…" },
  ];

  // Age selector overlay (first-time visit)
  if (needsAgeSelector) {
    return <AgeSelector />;
  }

  // â”€â”€ YOUTH STOREFRONT â”€â”€
  if (theme === "youth") {
    return <YouthStorefront />;
  }

  // â”€â”€ PREMIUM / DEFAULT STOREFRONT â”€â”€
  return (
    <div className="bg-background text-foreground" dir="rtl">
      {globalOffer && (
        <section className="border-b border-gold/10 bg-gradient-to-r from-gold/5 via-transparent to-gold/5">
          <div className="mx-auto max-w-7xl px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-[10px] tracking-[0.25em] uppercase font-black text-gold">{globalOffer.title}</span>
              <span className="w-8 h-px bg-gold/40" />
              <span className="font-serif text-xl md:text-2xl font-bold">ط®طµظ… {globalOffer.percent}% â€” ظ„ظپطھط±ط© ظ…ط­ط¯ظˆط¯ط©</span>
            </div>
            <Countdown endsAt={globalOffer.ends_at} />
          </div>
        </section>
      )}

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 pt-14 pb-20 md:py-28 grid md:grid-cols-2 gap-10 items-center">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 mb-6 px-3 py-1.5 bg-card border border-gold/20 rounded-full">
              <span className="text-gold font-black text-[10px] uppercase tracking-[0.2em]">
                {(theme as string) === "youth" ? "طھط±ظ†ط¯" : "ط¬ط¯ظٹط¯"}
              </span>
              <span className="w-1 h-1 rounded-full bg-gold/40" />
              <span className="text-[10px] font-medium opacity-60 uppercase tracking-[0.2em]">ط¬ط±ظ‘ط¨ ط§ظ„ظ„ط¨ط³ ط¨ط§ظ„ط°ظƒط§ط، ط§ظ„ط§طµط·ظ†ط§ط¹ظٹ</span>
            </div>

            <h1 className="font-serif font-bold leading-[1] text-4xl sm:text-6xl md:text-8xl mb-6">
              {heroTitle.includes("\n") ? (
                heroTitle.split("\n").map((line, i) => (
                  <span key={i} className={i > 0 ? "text-gold italic block" : "block"}>
                    {line}
                  </span>
                ))
              ) : (
                <>
                  <span className="block">{heroTitle.split(" ").slice(0, Math.ceil(heroTitle.split(" ").length / 2)).join(" ")}</span>
                  <span className="text-gold italic block">{heroTitle.split(" ").slice(Math.ceil(heroTitle.split(" ").length / 2)).join(" ")}</span>
                </>
              )}
            </h1>

            {(heroSubtitle || settings?.slogan) && (
              <p className="text-base md:text-lg font-serif italic text-gold/80 mb-5">
                {heroSubtitle || settings.slogan}
              </p>
            )}

            <p className="text-sm md:text-base leading-loose max-w-md opacity-70 font-light mb-10">
              ط§ظƒطھط´ظپ ط§ظ„طھظ†ط§ط؛ظ… ط§ظ„ظ…ط«ط§ظ„ظٹ ط¨ظٹظ† ط§ظ„ظپط®ط§ظ…ط© ظˆط§ظ„ط°ظƒط§ط، ط§ظ„ط§طµط·ظ†ط§ط¹ظٹ. ط¬ط±ظ‘ط¨ ط£ط±ظ‚ظ‰ ط§ظ„طھطµط§ظ…ظٹظ… ط§ظپطھط±ط§ط¶ظٹط§ظ‹ ظ‚ط¨ظ„ ط£ظ† طھطµظ„ ط¥ظ„ظ‰ ط¨ط§ط¨ ظ…ظ†ط²ظ„ظƒ.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 max-w-md">
              <Link
                to="/products"
                className="flex-1 gradient-gold text-primary py-5 px-8 text-xs font-bold tracking-[0.2em] uppercase text-center transition-all active:scale-95 shadow-lg"
              >
                {ctaText}
              </Link>
              <Link
                to="/try-on"
                className="flex-1 bg-card border border-foreground/10 py-5 px-8 text-xs font-bold tracking-[0.2em] uppercase text-center flex items-center justify-center gap-3 transition-all hover:border-gold hover:shadow-[0_10px_30px_-10px_rgba(212,160,23,0.4)]"
              >
                <Sparkles className="size-4 text-gold" />
                طھط¬ط±ط¨ط© AI
              </Link>
            </div>
          </div>

          {/* Editorial image */}
          <div className="relative hidden md:block">
            <div className="aspect-[3/4] overflow-hidden border border-gold/10 shadow-[0_30px_80px_-20px_rgba(26,26,26,0.25)]">
              <img
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=900"
                alt="ظ…ظˆط¶ط© ظ‡ط¯ظ…ط©"
                className="size-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-card border border-gold/20 px-5 py-4 shadow-[0_20px_50px_-15px_rgba(212,160,23,0.3)]">
              <div className="text-[9px] uppercase tracking-[0.2em] text-gold font-black">Express</div>
              <div className="font-serif text-lg font-bold mt-1">ط´ط­ظ† ظ„ظƒظ„ ظ…ط­ط§ظپط¸ط§طھ ظ…طµط±</div>
            </div>
          </div>

          {/* Mobile decorative bg */}
          <div className="md:hidden absolute -left-12 top-32 w-56 h-80 -rotate-6 opacity-30 mix-blend-multiply pointer-events-none -z-0">
            <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600" alt="" className="size-full object-cover border border-white/50" />
          </div>
        </div>
      </section>

      {/* SMART SEARCH */}
      <section className="px-6 -mt-8 md:-mt-12 relative z-20">
        <div className="mx-auto max-w-7xl">
          <SmartSearch />
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-px bg-gold" />
            <h2 className="text-[10px] font-black tracking-[0.3em] uppercase text-gold">طھط³ظˆظ‚ ط­ط³ط¨ ط§ظ„ظپط¦ط©</h2>
          </div>
          <div className="flex overflow-x-auto gap-3 pb-3 no-scrollbar">
            {categories.map((cat) => (
              <Link
                key={cat.key}
                to="/products"
                search={{ category: cat.key } as any}
                className="flex-none w-24 sm:w-32 px-4 sm:px-6 py-6 sm:py-8 bg-card border border-gold/5 flex flex-col items-center justify-center gap-4 transition-all hover:border-gold hover:shadow-[0_10px_30px_-10px_rgba(212,160,23,0.35)] active:scale-95"
              >
                <span className="text-3xl">{cat.icon}</span>
                <span className="text-[10px] font-black tracking-[0.2em] uppercase whitespace-nowrap">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* BEST SELLERS */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-px bg-gold" />
              <span className="text-[10px] font-black tracking-[0.3em] uppercase text-gold">Best Sellers</span>
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold">ط§ظ„ط£ظƒط«ط± ظ…ط¨ظٹط¹ط§ظ‹</h2>
          </div>
          <Link to="/products" className="hidden md:inline-flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase border-b-2 border-foreground pb-1 hover:text-gold hover:border-gold transition-colors">
            ط¹ط±ط¶ ط§ظ„ظƒظ„ <ArrowLeft className="size-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {(bestSellers ?? []).map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
        <div className="mt-8 text-center md:hidden">
          <Link to="/products" className="inline-flex items-center gap-2 gradient-gold text-primary px-8 py-3 font-bold text-xs tracking-[0.15em] uppercase rounded-full">
            ط¹ط±ط¶ ظƒظ„ ط§ظ„ظ…ظ†طھط¬ط§طھ <ArrowLeft className="size-3" />
          </Link>
        </div>
      </section>

      {/* AI TRY-ON BANNER */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="bg-foreground text-background px-8 py-14 md:p-16 relative overflow-hidden border border-gold/10">
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-gold/10 blur-[100px]" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-gold/5 blur-[100px]" />

          <div className="relative z-10 grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="w-10 h-px bg-gold" />
                <span className="text-[9px] text-gold font-black tracking-[0.3em] uppercase">Smart Styling</span>
              </div>
              <h2 className="font-serif text-3xl md:text-5xl font-bold leading-[1.15] mb-6">
                ط§ظ†ط¸ط± ط¥ظ„ظ‰ ظ…ط³طھظ‚ط¨ظ„ظƒ
                <br />
                <span className="text-gold italic">ظ‚ط¨ظ„ ط§ظ‚طھظ†ط§ط¦ظ‡</span>
              </h2>
              <p className="text-sm opacity-60 leading-loose mb-10 max-w-md">
                ظ…ط­ط±ظƒ ط§ظ„ط°ظƒط§ط، ط§ظ„ط§طµط·ظ†ط§ط¹ظٹ ط§ظ„ط®ط§طµ ط¨ظ†ط§ ظٹظ…ظ†ط­ظƒ ط±ط¤ظٹط© ظˆط§ظ‚ط¹ظٹط© ظ„ظ…ط¯ظ‰ ظ…ظ„ط§ط،ظ…ط© ظƒظ„ ظ‚ط·ط¹ط© ظ„ط´ط®طµظٹطھظƒ â€” ظپظٹ ط«ظˆط§ظ†ظچ.
              </p>
              <Link
                to="/try-on"
                className="inline-flex items-center gap-4 bg-gold text-foreground px-10 py-4 text-[10px] font-black tracking-[0.25em] uppercase hover:opacity-90 transition shadow-[0_20px_50px_-15px_rgba(212,160,23,0.6)]"
              >
                ط§ط¨ط¯ط£ ط§ظ„طھط¬ط±ط¨ط© ط§ظ„ط¢ظ†
                <ArrowLeft className="size-3" />
              </Link>
            </div>
            <div className="hidden md:block relative">
              <div className="aspect-[4/5] overflow-hidden border border-gold/20 opacity-90">
                <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900" alt="" className="size-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <CustomerPhotosGrid limit={3} />

      {/* TRUST GRID */}
      <section className="border-t border-foreground/5 bg-card/40 mt-12">
        <div className="mx-auto max-w-7xl px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-y-12 gap-x-6">
          {trustItems.map(({ Icon, t, s }) => (
            <div key={t} className="flex flex-col items-center text-center gap-4">
              <div className="size-12 border border-gold/30 flex items-center justify-center text-gold">
                <Icon className="size-5" />
              </div>
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.2em] mb-2">{t}</div>
                <div className="text-[10px] text-muted-foreground leading-relaxed max-w-[150px]">{s}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
