import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { Sparkles, Truck, ShieldCheck, Headphones, ArrowLeft } from "lucide-react";
import { CustomerPhotosGrid } from "@/components/CustomerPhotosGrid";
import { Countdown } from "@/components/Countdown";
import { AuthGate } from "@/components/AuthGate";
import { useSiteSettings } from "@/lib/settings";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const settings = useSiteSettings();

  const { data: bestSellers } = useQuery({
    queryKey: ["home-bestsellers"],
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
    { label: "تيشيرتات", icon: "👕", key: "tshirts" },
    { label: "بناطيل", icon: "👖", key: "pants" },
    { label: "كوتشيات", icon: "👟", key: "shoes" },
    { label: "إكسسوارات", icon: "🎒", key: "accessories" },
    { label: "قمصان", icon: "👔", key: "shirts" },
  ];

  return (
    <div className="bg-background text-foreground" dir="rtl">
      <AuthGate />

      {globalOffer && (
        <section className="border-b border-gold/10 bg-gradient-to-r from-gold/5 via-transparent to-gold/5">
          <div className="mx-auto max-w-7xl px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-[10px] tracking-[0.25em] uppercase font-black text-gold">{globalOffer.title}</span>
              <span className="w-8 h-px bg-gold/40" />
              <span className="font-serif text-xl md:text-2xl font-bold">خصم {globalOffer.percent}% — لفترة محدودة</span>
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
              <span className="text-gold font-black text-[10px] uppercase tracking-[0.2em]">جديد</span>
              <span className="w-1 h-1 rounded-full bg-gold/40" />
              <span className="text-[10px] font-medium opacity-60 uppercase tracking-[0.2em]">جرب اللبس بالذكاء الاصطناعي</span>
            </div>

            <h1 className="font-serif font-bold leading-[1] text-4xl sm:text-6xl md:text-8xl mb-8">
              أناقتك
              <br />
              <span className="text-gold italic">بلمسة هدمة</span>
            </h1>

            {settings?.slogan && (
              <p className="text-base md:text-lg font-serif italic text-gold/80 mb-5">{settings.slogan}</p>
            )}

            <p className="text-sm md:text-base leading-loose max-w-md opacity-70 font-light mb-10">
              اكتشف التناغم المثالي بين الفخامة والذكاء الاصطناعي. جرّب أرقى التصاميم افتراضياً قبل أن تصل إلى باب منزلك.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 max-w-md">
              <Link
                to="/products"
                className="flex-1 bg-[#1A1A1A] text-[#F5F0E8] py-5 px-8 text-xs font-bold tracking-[0.2em] uppercase text-center transition-all active:scale-95 shadow-2xl shadow-black/20 hover:shadow-gold/20 hover:bg-foreground"
              >
                تسوّق المجموعة
              </Link>
              <Link
                to="/try-on"
                className="flex-1 bg-card border border-foreground/10 py-5 px-8 text-xs font-bold tracking-[0.2em] uppercase text-center flex items-center justify-center gap-3 transition-all hover:border-gold hover:shadow-[0_10px_30px_-10px_rgba(212,160,23,0.4)]"
              >
                <Sparkles className="size-4 text-gold" />
                تجربة AI
              </Link>
            </div>
          </div>

          {/* Editorial image */}
          <div className="relative hidden md:block">
            <div className="aspect-[3/4] overflow-hidden border border-gold/10 shadow-[0_30px_80px_-20px_rgba(26,26,26,0.25)]">
              <img
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=900"
                alt="موضة هدمة"
                className="size-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 bg-card border border-gold/20 px-5 py-4 shadow-[0_20px_50px_-15px_rgba(212,160,23,0.3)]">
              <div className="text-[9px] uppercase tracking-[0.2em] text-gold font-black">Express</div>
              <div className="font-serif text-lg font-bold mt-1">شحن لكل محافظات مصر</div>
            </div>
          </div>

          {/* Mobile decorative bg */}
          <div className="md:hidden absolute -left-12 top-32 w-56 h-80 -rotate-6 opacity-30 mix-blend-multiply pointer-events-none -z-0">
            <img
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600"
              alt=""
              className="size-full object-cover border border-white/50"
            />
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="px-6 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center gap-3 mb-6">
            <span className="w-10 h-px bg-gold" />
            <h2 className="text-[10px] font-black tracking-[0.3em] uppercase text-gold">تسوق حسب الفئة</h2>
          </div>
          <div className="flex overflow-x-auto gap-3 pb-3 no-scrollbar">
            {categories.map((cat) => (
              <Link
                key={cat.key}
                to="/products"
                search={{ category: cat.key } as any}
                className="flex-none w-24 sm:w-32 px-4 sm:px-6 py-6 sm:py-8 bg-card border border-gold/5 flex flex-col items-center justify-center gap-4 transition-all hover:border-gold hover:shadow-[0_10px_30px_-10px_rgba(212,160,23,0.35)] active:scale-95"
              >
                <span className="text-3xl grayscale brightness-75 group-hover:grayscale-0">{cat.icon}</span>
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
            <h2 className="font-serif text-4xl md:text-5xl font-bold">الأكثر مبيعاً</h2>
          </div>
          <Link to="/products" className="hidden md:inline-flex items-center gap-2 text-[10px] font-black tracking-[0.2em] uppercase border-b-2 border-foreground pb-1 hover:text-gold hover:border-gold transition-colors">
            عرض الكل <ArrowLeft className="size-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {(bestSellers ?? []).map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      </section>

      {/* AI TRY-ON BANNER */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="bg-[#1A1A1A] text-[#F5F0E8] px-8 py-14 md:p-16 relative overflow-hidden border border-gold/10">
          <div className="absolute -top-10 -right-10 w-64 h-64 bg-gold/10 blur-[100px]" />
          <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-gold/5 blur-[100px]" />

          <div className="relative z-10 grid md:grid-cols-2 gap-10 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <span className="w-10 h-px bg-gold" />
                <span className="text-[9px] text-gold font-black tracking-[0.3em] uppercase">Smart Styling</span>
              </div>
              <h2 className="font-serif text-3xl md:text-5xl font-bold leading-[1.15] mb-6">
                انظر إلى مستقبلك
                <br />
                <span className="text-gold italic">قبل اقتنائه</span>
              </h2>
              <p className="text-sm text-[#F5F0E8]/60 leading-loose mb-10 max-w-md">
                محرك الذكاء الاصطناعي الخاص بنا يمنحك رؤية واقعية لمدى ملاءمة كل قطعة لشخصيتك — في ثوانٍ.
              </p>
              <Link
                to="/try-on"
                className="inline-flex items-center gap-4 bg-gold text-[#1A1A1A] px-10 py-4 text-[10px] font-black tracking-[0.25em] uppercase hover:bg-[#F5F0E8] transition-colors shadow-[0_20px_50px_-15px_rgba(212,160,23,0.6)]"
              >
                ابدأ التجربة الآن
                <ArrowLeft className="size-3" />
              </Link>
            </div>
            <div className="hidden md:block relative">
              <div className="aspect-[4/5] overflow-hidden border border-gold/20 opacity-90">
                <img
                  src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=900"
                  alt=""
                  className="size-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <CustomerPhotosGrid limit={3} />

      {/* TRUST GRID */}
      <section className="border-t border-foreground/5 bg-card/40 mt-12">
        <div className="mx-auto max-w-7xl px-6 py-16 grid grid-cols-2 md:grid-cols-4 gap-y-12 gap-x-6">
          {[
            { Icon: Truck, t: "شحن سريع", s: "خلال ٤٨ ساعة لكل محافظات مصر" },
            { Icon: ShieldCheck, t: "جودة مضمونة", s: "إرجاع واستبدال خلال ١٤ يوم" },
            { Icon: Sparkles, t: "AI Try-On", s: "جرّب اللبس بذكاء اصطناعي" },
            { Icon: Headphones, t: "دعم واتساب", s: "خدمة عملاء على مدار اليوم" },
          ].map(({ Icon, t, s }) => (
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
