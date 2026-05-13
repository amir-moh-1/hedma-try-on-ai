import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, logActivity } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatEGP } from "@/lib/format";
import { toast } from "sonner";
import { ShoppingBag, Sparkles, MapPin, Package, AlertTriangle } from "lucide-react";
import { catAr } from "@/lib/categories";
import { ProductReviews } from "@/components/ProductReviews";
import { Countdown } from "@/components/Countdown";
import { colorHex, type Variant } from "@/lib/presets";

export const Route = createFileRoute("/product/$id")({ component: ProductDetail });

function ProductDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const { add } = useCart();
  const nav = useNavigate();
  const [size, setSize] = useState<string | undefined>();
  const [color, setColor] = useState<string | undefined>();

  const { data: p } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
      return data;
    },
  });

  const { data: coupons } = useQuery({
    queryKey: ["my-coupons", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("coupons").select("percent").eq("active", true);
      return data ?? [];
    },
  });
  const bestPercent = (coupons ?? []).reduce((m, c) => Math.max(m, c.percent), 0);

  const { data: offer } = useQuery({
    queryKey: ["product-offer", id],
    queryFn: async () => {
      const nowIso = new Date().toISOString();
      const { data } = await supabase
        .from("product_offers")
        .select("id,title,percent,ends_at,product_id")
        .eq("active", true)
        .gt("ends_at", nowIso)
        .or(`product_id.eq.${id},product_id.is.null`)
        .order("percent", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  if (!p) return <div className="mx-auto max-w-7xl p-10 text-center text-muted-foreground">جاري التحميل...</div>;

  const offerPercent = offer?.percent ?? 0;
  const totalPercent = Math.max(bestPercent, offerPercent);
  const finalPrice = totalPercent > 0 ? Math.round(p.price * (1 - totalPercent / 100)) : p.price;

  const handleAdd = () => {
    if (p.sizes.length > 0 && !size) return toast.error("اختر مقاس");
    if (p.colors.length > 0 && !color) return toast.error("اختر لون");
    add({ id: p.id, name: p.name, price: finalPrice, image: p.image_url ?? undefined, size, color });
    logActivity("add_to_cart", { product_id: p.id, name: p.name });
    toast.success("شكراً ليك! ✨ المنتج اتضاف للسلة");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="grid md:grid-cols-2 gap-10">
        <div className="rounded-3xl overflow-hidden bg-muted aspect-[4/5] shadow-luxe">
          {p.image_url && <img src={p.image_url} alt={p.name} className="size-full object-cover" />}
        </div>
        <div>
          <div className="text-sm text-muted-foreground mb-2">{catAr(p.category)}</div>
          <h1 className="font-display text-3xl md:text-4xl font-bold">{p.name}</h1>
          <div className="mt-4 flex items-baseline gap-3 flex-wrap">
            {totalPercent > 0 ? (
              <>
                <span className="font-display text-3xl font-bold text-gold-gradient">{formatEGP(finalPrice)}</span>
                <span className="text-lg text-muted-foreground line-through">{formatEGP(p.price)}</span>
                <span className="px-2 py-0.5 rounded-md text-xs font-bold gradient-gold text-primary">-{totalPercent}%</span>
              </>
            ) : (
              <span className="font-display text-3xl font-bold">{formatEGP(p.price)}</span>
            )}
          </div>

          {offer && (
            <div className="mt-4 rounded-2xl border-2 border-gold/40 bg-gold/5 p-4">
              <div className="text-sm font-bold mb-2">⏰ {offer.title} — العرض ينتهي خلال:</div>
              <Countdown endsAt={offer.ends_at} />
            </div>
          )}

          <p className="mt-5 text-muted-foreground leading-relaxed">{p.description}</p>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {p.location && <span className="inline-flex items-center gap-1"><MapPin className="size-4" /> {p.location}</span>}
            <span className="inline-flex items-center gap-1"><Package className="size-4" /> متاح: {p.stock}</span>
          </div>

          {p.stock > 0 && p.stock <= 5 && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-destructive/10 text-destructive px-3 py-1.5 text-sm font-bold">
              <AlertTriangle className="size-4" /> فضل {p.stock} قطع بس!
            </div>
          )}

          {p.sizes.length > 0 && (
            <div className="mt-6">
              <div className="text-sm font-semibold mb-2">المقاس</div>
              <div className="flex flex-wrap gap-2">
                {p.sizes.map((s: string) => (
                  <button key={s} onClick={() => setSize(s)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${size === s ? "gradient-gold text-primary border-transparent" : "hover:border-foreground/40"}`}>{s}</button>
                ))}
              </div>
            </div>
          )}
          {p.colors.length > 0 && (
            <div className="mt-5">
              <div className="text-sm font-semibold mb-2">اللون {color && <span className="text-muted-foreground font-normal">({color})</span>}</div>
              <div className="flex flex-wrap gap-2">
                {p.colors.map((c: string) => {
                  const sel = color === c;
                  return (
                    <button key={c} onClick={() => setColor(c)} aria-label={c} title={c}
                      className={`size-10 rounded-full border-2 transition ${sel ? "border-foreground scale-110 shadow-luxe" : "border-border hover:scale-105"}`}
                      style={{ backgroundColor: colorHex(c) }} />
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            <Button onClick={handleAdd} disabled={p.stock === 0} size="lg" className="gradient-gold text-primary hover:opacity-90 shadow-luxe">
              <ShoppingBag className="size-4 ml-2" /> {p.stock === 0 ? "نفد المخزون" : "أضف للسلة"}
            </Button>
            <Button variant="outline" size="lg" onClick={() => nav({ to: "/try-on", search: { product: p.id } as never })}>
              <Sparkles className="size-4 ml-2" /> جرّبه عليك بالـ AI
            </Button>
          </div>
        </div>
      </div>

      <ProductReviews productId={id} />
    </div>
  );
}
