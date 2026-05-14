import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { Sparkles, Truck, ShieldCheck, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerPhotosGrid } from "@/components/CustomerPhotosGrid";
import { Countdown } from "@/components/Countdown";
import { AuthGate } from "@/components/AuthGate";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { data: products } = useQuery({
    queryKey: ["home-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id,name,price,image_url,category,stock")
        .eq("active", true).order("created_at", { ascending: false }).limit(8);
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
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-bl from-accent/40 via-background to-background" />
        <div className="mx-auto max-w-7xl px-4 py-16 md:py-24 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-xs font-semibold mb-5">
              <Sparkles className="size-3.5 text-gold-gradient" /> جديد: جرّب اللبس بالذكاء الاصطناعي
            </span>
            <h1 className="font-display text-5xl md:text-7xl font-black leading-tight">
              <span className="text-foreground">أناقتك</span>
              <br />
              <span className="text-gold-gradient">بلمسة هدمة</span>
            </h1>
            <p className="mt-5 text-lg text-muted-foreground max-w-md">
              أحدث صيحات الموضة من تيشيرتات وبناطيل وكوتشيات. شوف اللبس عليك قبل ما تشتري بميزة الذكاء الاصطناعي.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="gradient-gold text-primary hover:opacity-90 shadow-luxe">
                <Link to="/products">تسوّق الآن</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
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

      {/* PROMISES */}
      <section className="border-y bg-card/50">
        <div className="mx-auto max-w-7xl px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { Icon: Truck, t: "شحن سريع", s: "خلال ٤٨ ساعة" },
            { Icon: ShieldCheck, t: "جودة مضمونة", s: "إرجاع خلال ١٤ يوم" },
            { Icon: Sparkles, t: "AI Try-On", s: "جرّب اللبس عليك" },
            { Icon: Headphones, t: "دعم واتساب", s: "متاح طول اليوم" },
          ].map(({ Icon, t, s }) => (
            <div key={t} className="flex items-center gap-3">
              <Icon className="size-8 text-gold-gradient" />
              <div><div className="font-bold">{t}</div><div className="text-xs text-muted-foreground">{s}</div></div>
            </div>
          ))}
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl md:text-4xl font-bold">أحدث المنتجات</h2>
            <p className="text-muted-foreground mt-1">منتجات منتقاة بعناية من تجارنا</p>
          </div>
          <Link to="/products" className="text-sm font-semibold text-gold-gradient hover:underline">شوف الكل ←</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {(products ?? []).map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
      </section>
    </div>
  );
}
