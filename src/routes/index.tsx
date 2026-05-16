import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { Sparkles, Truck, ShieldCheck, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerPhotosGrid } from "@/components/CustomerPhotosGrid";
import { Countdown } from "@/components/Countdown";
import { AuthGate } from "@/components/AuthGate";

import { useSiteSettings } from "@/lib/settings";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const settings = useSiteSettings();
  
  // Best Sellers Query (ordered by stock level for rich catalog view)
  const { data: bestSellers } = useQuery({
    queryKey: ["home-bestsellers"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id,name,price,image_url,category,stock")
        .eq("active", true).order("stock", { ascending: false }).limit(4);
      return data ?? [];
    },
  });

  const { data: globalOffer } = useQuery({
    queryKey: ["global-offer"],
    queryFn: async () => {
      const { data } = await supabase.from("product_offers")
        .select("title,percent,ends_at").is("product_id", null).eq("active", true)
        .gt("ends_at", new Date().toISOString())
        .order("percent", { ascending: false }).limit(1).maybeSingle();
      return data;
    },
  });

  return (
    <div>
      <AuthGate />
      {globalOffer && (
        <section className="bg-gradient-to-r from-gold/15 via-gold/5 to-gold/15 border-b">
          <div className="mx-auto max-w-7xl px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase font-bold text-gold-gradient">{globalOffer.title}</div>
              <div className="font-display text-2xl font-black">خصم {globalOffer.percent}% — لفترة محدودة!</div>
            </div>
            <Countdown endsAt={globalOffer.ends_at} />
          </div>
        </section>
      )}

      {/* 1. HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-bl from-accent/40 via-background to-background" />
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-semibold mb-5">
              <Sparkles className="size-3.5 text-gold" /> جديد: جرّب اللبس بالذكاء الاصطناعي
            </span>
            <h1 className="font-display text-5xl md:text-7xl font-black leading-tight">
              <span className="text-foreground">أناقتك</span>
              <br />
              <span className="text-gold-gradient">بلمسة هدمة</span>
            </h1>
            {settings?.slogan && (
              <p className="mt-3 text-xl font-bold text-gold/80 Arabic-font">
                {settings.slogan}
              </p>
            )}
            <p className="mt-5 text-lg text-muted-foreground max-w-md">
              أحدث صيحات الموضة من تيشيرتات وبناطيل وكوتشيات. شوف اللبس عليك قبل ما تشتري بميزة الذكاء الاصطناعي.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="gradient-gold text-primary hover:opacity-90 shadow-luxe font-bold">
                <Link to="/products">تسوّق الآن</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="font-bold">
                <Link to="/try-on"><Sparkles className="size-4 ml-2" /> جرّب بالـ AI</Link>
              </Button>
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-luxe">
              <img src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=900" alt="موضة هدمة" className="size-full object-cover" />
            </div>
            <div className="absolute -bottom-5 -start-5 rounded-2xl bg-card border shadow-luxe p-4 max-w-[200px]">
              <div className="text-xs text-muted-foreground">شحن سريع</div>
              <div className="font-bold">كل محافظات مصر</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. QUICK CATEGORIES (Horizontal Scrollable Icons) */}
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex gap-4 overflow-x-auto whitespace-nowrap scrollbar-none pb-4 select-none justify-start md:justify-center">
          {[
            { label: "تيشيرتات", icon: "👕", key: "tshirts" },
            { label: "بناطيل", icon: "👖", key: "pants" },
            { label: "كوتشيات", icon: "👟", key: "shoes" },
            { label: "إكسسوارات", icon: "🎒", key: "accessories" },
            { label: "قمصان", icon: "👔", key: "shirts" },
          ].map((cat) => (
            <Link
              key={cat.key}
              to="/products"
              search={{ category: cat.key } as any}
              className="flex flex-col items-center gap-2 px-6 py-4 rounded-2xl bg-card border hover:border-gold transition-all duration-300 shadow-sm shrink-0 min-w-[100px] hover:scale-105 active:scale-95"
            >
              <span className="text-3xl">{cat.icon}</span>
              <span className="text-sm font-bold text-foreground">{cat.label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. 🔥 الأكثر مبيعاً SECTION */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-black">🔥 الأكثر مبيعاً</h2>
            <p className="text-muted-foreground mt-1">الموديلات الأكثر طلباً وإعجاباً من عملائنا</p>
          </div>
          <Link to="/products" className="text-sm font-bold text-gold hover:underline">شوف الكل ←</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {(bestSellers ?? []).map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </section>

      {/* 4. AI TRY-ON DARK BANNER */}
      <section className="mx-auto max-w-7xl px-4 py-12">
        <div className="rounded-3xl bg-[#1A1A1A] text-[#F5F0E8] border border-gold/20 p-8 md:p-12 relative overflow-hidden shadow-luxe flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-gold/5 blur-3xl pointer-events-none -z-0" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-gold/5 blur-3xl pointer-events-none -z-0" />

          <div className="space-y-4 max-w-xl z-10 text-right">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-gold/30 bg-gold/10 text-gold text-xs font-bold uppercase tracking-wider">
              <Sparkles className="size-3.5" /> ذكاء اصطناعي تفاعلي
            </span>
            <h3 className="font-display text-3xl md:text-5xl font-black leading-tight text-[#F5F0E8]">
              شوف اللبس <span className="text-gold">عليك</span> قبل ما تشتري!
            </h3>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
              ارفع صورتك واختار القطع اللي تعجبك، ومحرك الذكاء الاصطناعي الخاص بنا هيوريك الإطلالة كاملة ومظبوطة عليك في ثواني!
            </p>
          </div>
          <div className="z-10 shrink-0">
            <Button asChild size="lg" className="gradient-gold text-primary hover:opacity-90 font-bold px-8 py-6 rounded-2xl text-lg shadow-luxe">
              <Link to="/try-on">جرّب دلوقتي <Sparkles className="size-5 mr-2 animate-pulse" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 5. CUSTOMER PHOTOS (Limit 3, automatically hides if 0) */}
      <CustomerPhotosGrid limit={3} />

      {/* 6. FEATURES SECTION (PROMISES) */}
      <section className="border-t bg-card/50 mt-12">
        <div className="mx-auto max-w-7xl px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { Icon: Truck, t: "شحن سريع", s: "خلال ٤٨ ساعة لكل محافظات مصر" },
            { Icon: ShieldCheck, t: "جودة مضمونة", s: "إرجاع واستبدال خلال ١٤ يوم" },
            { Icon: Sparkles, t: "AI Try-On", s: "جرّب اللبس بذكاء اصطناعي" },
            { Icon: Headphones, t: "دعم واتساب", s: "خدمة عملاء ممتازة على مدار اليوم" },
          ].map(({ Icon, t, s }) => (
            <div key={t} className="flex flex-col items-center text-center md:flex-row md:text-right gap-4 p-4 rounded-2xl hover:bg-card/80 transition-colors duration-300">
              <div className="p-3 rounded-xl bg-gold/10 shrink-0">
                <Icon className="size-7 text-gold" />
              </div>
              <div>
                <div className="font-bold text-base">{t}</div>
                <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{s}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
