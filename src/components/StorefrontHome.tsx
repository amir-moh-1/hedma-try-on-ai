import { Link } from "@tanstack/react-router";
import { ArrowLeft, BadgeCheck, CreditCard, Instagram, ShieldCheck, ShoppingBag, Sparkles, Truck, Zap } from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { SmartSearch } from "@/components/SmartSearch";
import { Countdown } from "@/components/Countdown";
import { useSiteSettings } from "@/lib/settings";
import { useStorefrontAudience } from "@/lib/useStorefrontAudience";
import { defaultStorefrontThemes, shapeClass } from "@/lib/storefrontConfig";
import streetHero from "@/assets/hadma-street-hero.jpg";
import type { CSSProperties } from "react";

export function StorefrontHome({ bestSellers = [], globalOffer }: { bestSellers?: any[]; globalOffer?: any }) {
  const settings = useSiteSettings() as any;
  const { audience, setAudience, chosen } = useStorefrontAudience("under25");
  const theme = settings.storefront_builder?.published?.[audience] ?? defaultStorefrontThemes[audience];
  const isYouth = audience === "under25";
  const heroImage = isYouth ? streetHero : (theme.seasonalImage || streetHero);
  const radius = shapeClass(theme.cardShape);
  const categories = ["تيشيرتات", "هوديز", "بناطيل", "كوتشيات", "إكسسوارات"];
  const css = {
    "--sf-bg": theme.backgroundColor,
    "--sf-section": theme.sectionColor,
    "--sf-text": theme.textColor,
    "--sf-muted": theme.mutedTextColor,
    "--sf-accent": theme.accentColor,
  } as CSSProperties;

  return (
    <div style={css} className="bg-[var(--sf-bg)] text-[var(--sf-text)]" dir="rtl">
      {!chosen && (
        <section className="border-b border-white/10 bg-[var(--sf-section)] px-4 py-3">
          <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs font-bold text-[var(--sf-muted)]">اختار عالمك عشان نعرضلك الواجهة الأنسب</span>
            <div className="flex gap-2">
              <button onClick={() => setAudience("under25")} className="rounded-full bg-[var(--sf-accent)] px-4 py-2 text-xs font-black text-black">٢٥ أو أقل</button>
              <button onClick={() => setAudience("over25")} className="rounded-full border border-white/20 px-4 py-2 text-xs font-black">٢٦+</button>
            </div>
          </div>
        </section>
      )}

      {globalOffer && (
        <section className="border-b border-white/10 bg-[var(--sf-section)]">
          <div className="mx-auto max-w-7xl px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 font-black"><Zap className="size-5 text-[var(--sf-accent)]" /> خصم {globalOffer.percent}% على أول طلب</div>
            <Countdown endsAt={globalOffer.ends_at} />
          </div>
        </section>
      )}

      <section className="relative min-h-[72vh] overflow-hidden">
        <img src={heroImage} alt="HADMA streetwear" className="absolute inset-0 size-full object-cover opacity-70" />
        <div className="absolute inset-0 bg-gradient-to-l from-black/90 via-black/45 to-black/10" />
        <div className="relative mx-auto max-w-7xl px-5 py-16 md:py-28 min-h-[72vh] flex items-center">
          <div className="max-w-xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-4 py-2 text-[10px] font-black tracking-[0.25em] text-[var(--sf-accent)]">HADMA DROP</div>
            <h1 className="font-display text-5xl md:text-8xl font-black leading-[1.05] text-white">{theme.heroTitle}</h1>
            <p className="mt-5 max-w-md text-sm md:text-base leading-8 text-white/75">{theme.heroSubtitle}</p>
            <Link to="/products" className={`mt-8 inline-flex items-center gap-3 bg-[var(--sf-accent)] px-8 py-4 text-sm font-black text-black shadow-2xl ${radius}`}>{theme.ctaText}<ArrowLeft className="size-4" /></Link>
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-8 px-4"><div className="mx-auto max-w-7xl"><SmartSearch /></div></section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="flex gap-4 overflow-x-auto pb-3 no-scrollbar">
          {categories.map((c) => <div key={c} className="flex-none text-center"><div className="mx-auto grid size-20 place-items-center rounded-full bg-zinc-900 border border-white/10 text-white"><ShoppingBag className="size-7" /></div><div className="mt-2 text-xs font-bold text-[var(--sf-muted)]">{c}</div></div>)}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between"><h2 className="flex items-center gap-2 font-display text-3xl font-black"><Zap className="size-6 text-[var(--sf-accent)]" /> الأكثر مبيعاً</h2><Link to="/products" className="text-xs font-black text-[var(--sf-accent)]">عرض الكل</Link></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">{bestSellers.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10"><div className={`grid md:grid-cols-2 overflow-hidden bg-[var(--sf-section)] border border-white/10 ${radius}`}><div className="p-8 md:p-12"><div className="text-[var(--sf-accent)] font-black mb-3">خصم على أول طلب</div><h2 className="font-display text-4xl font-black">10% لأول تجربة مع هدمة</h2></div><div className="grid grid-cols-2 gap-4 p-6 bg-black/30">{[{I:CreditCard,t:"دفع آمن"},{I:BadgeCheck,t:"منتجات أصلية"},{I:Truck,t:"توصيل سريع"},{I:ShieldCheck,t:"ضمان جودة"}].map(({I,t})=><div key={t} className="flex items-center gap-2 text-sm font-bold"><I className="size-5 text-[var(--sf-accent)]" />{t}</div>)}</div></div></section>

      <section className="mx-auto max-w-7xl px-4 py-12"><div className="mb-5 flex items-center justify-between"><h2 className="font-display text-3xl font-black">{theme.instagramHandle}</h2><Instagram className="size-6 text-[var(--sf-accent)]" /></div><div className="grid grid-cols-2 md:grid-cols-5 gap-3">{bestSellers.slice(0,5).map((p)=><div key={p.id} className={`aspect-[4/5] overflow-hidden bg-[var(--sf-section)] ${radius}`}>{p.image_url && <img src={p.image_url} alt={p.name} loading="lazy" className="size-full object-cover grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition" />}</div>)}</div></section>
    </div>
  );
}