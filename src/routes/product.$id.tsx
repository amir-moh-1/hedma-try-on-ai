import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, logActivity } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { formatEGP } from "@/lib/format";
import { toast } from "sonner";
import { ShoppingBag, Sparkles, MapPin, Package, AlertTriangle, Plus, X } from "lucide-react";
import { catAr, getCategoryBadge } from "@/lib/categories";
import { ProductReviews } from "@/components/ProductReviews";
import { Countdown } from "@/components/Countdown";
import { RelatedProducts } from "@/components/RelatedProducts";
import { colorHex, type Variant } from "@/lib/presets";

export const Route = createFileRoute("/product/$id")({ component: ProductDetail });

function ProductDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const { add } = useCart();
  const nav = useNavigate();
  const [size, setSize] = useState<string | undefined>();
  const [color, setColor] = useState<string | undefined>();

  // IntersectionObserver states
  const [showSticky, setShowSticky] = useState(false);
  const mainBtnRef = useRef<HTMLDivElement | null>(null);

  // Size Modal Calculator states
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [height, setHeight] = useState<string>("");
  const [weight, setWeight] = useState<string>("");
  const [calculatedSize, setCalculatedSize] = useState<string | null>(null);

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

  // Complete the Look recommendation algorithm (3-4 items)
  const { data: completeTheLook } = useQuery({
    queryKey: ["complete-look", p?.category, p?.id],
    enabled: !!p,
    queryFn: async () => {
      if (!p) return [];
      const { data: allProds } = await supabase
        .from("products")
        .select("id,name,price,image_url,category,stock")
        .eq("active", true)
        .neq("id", p.id);

      const prods = allProds ?? [];
      let recs: any[] = [];
      const cat = p.category?.toLowerCase();

      if (cat === "tshirts" || cat === "t-shirts") {
        const pants = prods.filter((x) => x.category?.toLowerCase() === "pants" || x.category?.toLowerCase() === "jeans");
        const shoes = prods.filter((x) => x.category?.toLowerCase() === "shoes" || x.category?.toLowerCase() === "sneakers");
        recs = [...pants.slice(0, 2), ...shoes.slice(0, 2)];
      } else if (cat === "pants" || cat === "jeans") {
        const tshirts = prods.filter((x) => x.category?.toLowerCase() === "tshirts" || x.category?.toLowerCase() === "t-shirts" || x.category?.toLowerCase() === "shirts");
        const acc = prods.filter((x) => x.category?.toLowerCase() === "accessories");
        recs = [...tshirts.slice(0, 2), ...acc.slice(0, 2)];
      } else if (cat === "shoes" || cat === "sneakers") {
        const tshirts = prods.filter((x) => x.category?.toLowerCase() === "tshirts" || x.category?.toLowerCase() === "t-shirts");
        const pants = prods.filter((x) => x.category?.toLowerCase() === "pants" || x.category?.toLowerCase() === "jeans");
        recs = [...tshirts.slice(0, 2), ...pants.slice(0, 2)];
      } else {
        const distinctCats = Array.from(new Set(prods.map((x) => x.category))).filter((c) => c !== p.category);
        distinctCats.forEach((c) => {
          const matched = prods.filter((x) => x.category === c);
          recs = [...recs, ...matched.slice(0, 1)];
        });
      }

      if (recs.length < 4) {
        const fill = prods.filter((x) => !recs.map((r) => r.id).includes(x.id)).slice(0, 4 - recs.length);
        recs = [...recs, ...fill];
      }

      return recs.slice(0, 4);
    },
  });

  // Sticky Intersection observer trigger
  useEffect(() => {
    if (!p) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowSticky(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );
    const target = mainBtnRef.current;
    if (target) {
      observer.observe(target);
    }
    return () => {
      if (target) observer.unobserve(target);
    };
  }, [p]);

  if (!p) return <div className="mx-auto max-w-7xl p-10 text-center text-muted-foreground">جاري التحميل...</div>;

  const variants: Variant[] = Array.isArray(p.variants) ? (p.variants as Variant[]) : [];
  const variantColors = variants.map((v) => v.color).filter(Boolean);
  const allColors = variantColors.length > 0 ? Array.from(new Set([...variantColors, ...p.colors])) : p.colors;
  const matchedVariant = color ? variants.find((v) => v.color === color) : undefined;
  const displayImage = matchedVariant?.image_url ?? p.image_url;
  const galleryImages = Array.from(new Set([
    ...(p.image_url ? [p.image_url] : []),
    ...variants.map((v) => v.image_url),
  ]));

  const offerPercent = offer?.percent ?? 0;
  const totalPercent = Math.max(bestPercent, offerPercent);
  const finalPrice = totalPercent > 0 ? Math.round(p.price * (1 - totalPercent / 100)) : p.price;

  const handleAdd = () => {
    if (p.sizes.length > 0 && !size) {
      toast.error("اختر مقاس");
      return;
    }
    if (allColors.length > 0 && !color) {
      toast.error("اختر لون");
      return;
    }
    add({ id: p.id, name: p.name, price: finalPrice, image: displayImage ?? undefined, size, color });
    logActivity("add_to_cart", { product_id: p.id, name: p.name });
    toast.success("شكراً ليك! ✨ المنتج اتضاف للسلة");
  };

  const handleCalculateSize = () => {
    const h = Number(height);
    const w = Number(weight);
    if (!h || !w) {
      toast.error("يرجى إدخال الطول والوزن بشكل صحيح");
      return;
    }
    let res = "XL";
    if (h < 165 || w < 60) {
      res = "S";
    } else if (h < 175 || w < 75) {
      res = "M";
    } else if (h < 183 || w < 90) {
      res = "L";
    }
    setCalculatedSize(res);
    toast.success(`مقاسك المقترح هو: ${res} ✨`);
  };

  const handleSelectCalculated = () => {
    if (calculatedSize) {
      const matchedSize = p.sizes.find(
        (s: string) => s.toUpperCase() === calculatedSize.toUpperCase()
      );
      if (matchedSize) {
        setSize(matchedSize);
        toast.success(`تم اختيار المقاس ${matchedSize}`);
      } else {
        toast.error(`المقاس المقترح ${calculatedSize} غير متوفر لهذا المنتج. يرجى اختيار مقاس آخر.`);
      }
      setShowSizeModal(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 relative">
      <div className="grid md:grid-cols-2 gap-10">
        <div>
          <div className="rounded-3xl overflow-hidden bg-muted aspect-[4/5] shadow-luxe">
            {displayImage && <img src={displayImage} alt={p.name} loading="lazy" className="size-full object-cover transition-opacity duration-300" />}
          </div>
          {galleryImages.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-none">
              {galleryImages.map((img) => {
                const v = variants.find((x) => x.image_url === img);
                const sel = displayImage === img;
                return (
                  <button key={img} onClick={() => v && setColor(v.color)}
                    className={`size-16 rounded-lg overflow-hidden border-2 shrink-0 transition ${sel ? "border-foreground" : "border-transparent opacity-70 hover:opacity-100"}`}>
                    <img src={img} alt="" loading="lazy" className="size-full object-cover" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div>
          <div className="text-sm text-muted-foreground mb-2">{catAr(p.category)}</div>
          <h1 className="font-display text-3xl md:text-4xl font-bold">{p.name}</h1>
          <div className="mt-4 flex items-baseline gap-3 flex-wrap">
            {totalPercent > 0 ? (
              <>
                <span className="font-display text-3xl font-bold text-gold">{formatEGP(finalPrice)}</span>
                <span className="text-lg text-muted-foreground line-through">{formatEGP(p.price)}</span>
                <span className="px-2 py-0.5 rounded-md text-xs font-bold gradient-gold text-primary">-{totalPercent}%</span>
              </>
            ) : (
              <span className="font-display text-3xl font-bold">{formatEGP(p.price)}</span>
            )}
          </div>

          {offer && (
            <div className="mt-4 rounded-2xl border border-gold/40 bg-gold/5 p-4">
              <div className="text-sm font-bold mb-2">⏰ {offer.title} — العرض ينتهي خلال:</div>
              <Countdown endsAt={offer.ends_at} />
            </div>
          )}

          <p className="mt-5 text-muted-foreground leading-relaxed">{p.description}</p>

          <div className="mt-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
            {p.location && <span className="inline-flex items-center gap-1"><MapPin className="size-4" /> {p.location}</span>}
            <span className="inline-flex items-center gap-1">
              <Package className="size-4" /> 
              {p.stock === 0 ? (
                <span className="text-red-600 font-bold">نفذ المخزون ⚠️ (هيتوفر قريباً)</span>
              ) : (
                `متاح: ${p.stock}`
              )}
            </span>
          </div>

          {p.stock > 0 && p.stock <= 5 && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-600/10 text-red-600 px-3 py-1.5 text-sm font-bold">
              <AlertTriangle className="size-4" /> فضل {p.stock} قطع بس!
            </div>
          )}

          {p.stock === 0 && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-600/10 text-red-600 px-3 py-1.5 text-sm font-bold">
              <AlertTriangle className="size-4" /> نفذ المخزون ⚠️ هيتوفر قريباً
            </div>
          )}

          {/* Sizes and Size Guide Calculator */}
          {p.sizes.length > 0 && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-2">
                <div className="text-sm font-semibold">المقاس</div>
                <button
                  onClick={() => setShowSizeModal(true)}
                  className="text-xs text-gold font-bold hover:underline flex items-center gap-1"
                >
                  📏 مش عارف مقاسك؟
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {p.sizes.map((s: string) => (
                  <button key={s} onClick={() => setSize(s)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${size === s ? "gradient-gold text-primary border-transparent" : "hover:border-foreground/40"}`}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {allColors.length > 0 && (
            <div className="mt-5">
              <div className="text-sm font-semibold mb-2">اللون {color && <span className="text-muted-foreground font-normal">({color})</span>}</div>
              <div className="flex flex-wrap gap-2">
                {allColors.map((c: string) => {
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

          <div ref={mainBtnRef} className="mt-8 flex flex-wrap gap-3">
            <Button onClick={handleAdd} disabled={p.stock === 0} size="lg" className="gradient-gold text-primary hover:opacity-90 shadow-luxe font-bold">
              <ShoppingBag className="size-4 ml-2" /> {p.stock === 0 ? "نفد المخزون ⚠️ | هيتوفر قريباً" : "أضف للسلة"}
            </Button>
            <Button variant="outline" size="lg" className="font-bold" onClick={() => nav({ to: "/try-on", search: { product: p.id } as never })}>
              <Sparkles className="size-4 ml-2" /> جرّبه عليك بالـ AI
            </Button>
          </div>
        </div>
      </div>

      {/* Complete the Look Matching Recommendation Section */}
      {completeTheLook && completeTheLook.length > 0 && (
        <section className="mt-16 border-t pt-10">
          <div className="text-right mb-6">
            <h2 className="font-display text-2xl md:text-3xl font-black">👗 أكمل اللبسة (تنسيقات مقترحة)</h2>
            <p className="text-muted-foreground mt-1 text-sm">قطع تناسب اختيارك لتكتمل إطلالتك المميزة</p>
          </div>
          <div className="flex gap-4 overflow-x-auto whitespace-nowrap scrollbar-none pb-4 select-none max-w-full">
            {completeTheLook.map((item) => (
              <div key={item.id} className="w-[180px] sm:w-[220px] rounded-2xl bg-card border p-3 shrink-0 flex flex-col justify-between shadow-sm hover:shadow-md transition">
                <Link to="/product/$id" params={{ id: item.id }} className="block aspect-[4/5] rounded-xl overflow-hidden bg-muted relative mb-2">
                  <img src={item.image_url ?? ""} alt={item.name} className="size-full object-cover" />
                  {item.stock > 0 && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        add({ id: item.id, name: item.name, price: item.price, image: item.image_url ?? undefined });
                        toast.success("اتضاف للسلة ✅", { description: item.name });
                      }}
                      className="absolute bottom-2 left-2 size-8 rounded-full gradient-gold text-primary grid place-items-center shadow-md hover:scale-110 active:scale-95 transition"
                    >
                      <Plus className="size-4.5 font-bold" />
                    </button>
                  )}
                </Link>
                <div>
                  <div className="mb-1 flex">
                    <span className={`text-[9px] px-2 py-0.5 rounded-full font-black border ${getCategoryBadge(item.category).bg} ${getCategoryBadge(item.category).text} ${getCategoryBadge(item.category).border}`}>
                      {catAr(item.category)}
                    </span>
                  </div>
                  <div className="font-bold text-xs line-clamp-1 mb-1">{item.name}</div>
                  <div className="font-display text-sm font-black text-gold">{formatEGP(item.price)}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <RelatedProducts currentProductId={p.id} currentCategory={p.category} vendorId={p.vendor_id} />
      <ProductReviews productId={id} />

      {/* Mobile Sticky Add-to-Cart bar */}
      {showSticky && (
        <div className="fixed bottom-16 left-0 right-0 z-40 bg-card border-t border-border p-3 shadow-2xl flex items-center justify-between animate-fade-in md:hidden">
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-muted-foreground">السعر</span>
            <span className="font-display font-black text-gold text-lg">{formatEGP(finalPrice)}</span>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleAdd}
              disabled={p.stock === 0}
              size="sm"
              className="gradient-gold text-primary font-bold px-4 hover:opacity-90 shadow-luxe"
            >
              {p.stock === 0 ? "نفد المخزون ⚠️" : "أضف للسلة"}
            </Button>
          </div>
        </div>
      )}

      {/* Interactive Size Guide Modal */}
      {showSizeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border rounded-3xl p-6 shadow-2xl text-right relative animate-scale-up">
            <button
              onClick={() => setShowSizeModal(false)}
              className="absolute top-4 left-4 p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition"
            >
              <X className="size-5" />
            </button>
            <h3 className="font-display text-xl font-black mb-1">📏 حاسبة المقاس التفاعلية</h3>
            <p className="text-xs text-muted-foreground mb-5">دخل طولك ووزنك وهنحسبلك المقاس الأنسب بناءً على مؤشراتك البدنية</p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1.5 text-foreground">الطول (بالسنتيمتر):</label>
                <input
                  type="number"
                  placeholder="مثال: 175"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-input bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-gold text-right"
                />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1.5 text-foreground">الوزن (بالكيلوجرام):</label>
                <input
                  type="number"
                  placeholder="مثال: 70"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl border border-input bg-background text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-gold text-right"
                />
              </div>
            </div>

            <Button
              onClick={handleCalculateSize}
              className="w-full mt-6 gradient-gold text-primary font-bold py-3 rounded-xl shadow-luxe"
            >
              احسب مقاسي ✨
            </Button>

            {calculatedSize && (
              <div className="mt-5 p-4 rounded-2xl bg-gold/5 border border-gold/20 flex flex-col items-center">
                <span className="text-xs text-muted-foreground">المقاس المقترح ليك</span>
                <span className="text-3xl font-black text-gold mt-1">{calculatedSize}</span>
                <Button
                  onClick={handleSelectCalculated}
                  className="mt-3 gradient-gold text-primary font-bold px-6 py-2 rounded-xl text-xs"
                >
                  اختار هذا المقاس وتطبيق
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
