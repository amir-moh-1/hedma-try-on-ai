import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sparkles, Upload, Loader2, MessageCircle, Check, X } from "lucide-react";
import { catAr } from "@/lib/categories";

const WHATSAPP = "201229344711";

type SearchParams = { product?: string };

export const Route = createFileRoute("/try-on")({
  validateSearch: (s: Record<string, unknown>): SearchParams => ({ product: s.product as string | undefined }),
  component: TryOn,
});

const fileToDataUrl = (f: File) => new Promise<string>((res, rej) => {
  const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(f);
});

function TryOn() {
  const { product: presetProduct } = Route.useSearch();
  const { session } = useAuth();
  const [personUrl, setPersonUrl] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>(presetProduct ? [presetProduct] : []);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [catFilter, setCatFilter] = useState<string>("all");
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: products } = useQuery({
    queryKey: ["tryon-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id,name,image_url,category").eq("active", true).not("image_url", "is", null);
      return data ?? [];
    },
  });

  // Pull selected items from cart on first load (so user finds his picks)
  useEffect(() => {
    try {
      const raw = localStorage.getItem("hedma_cart_v1");
      if (raw && !presetProduct) {
        const cart = JSON.parse(raw) as { id: string }[];
        const ids = Array.from(new Set(cart.map((c) => c.id)));
        if (ids.length > 0) setSelected(ids.slice(0, 4));
      }
    } catch { /* noop */ }
  }, [presetProduct]);

  const cats = useMemo(() => ["all", ...Array.from(new Set((products ?? []).map((p) => p.category)))], [products]);
  const filtered = (products ?? []).filter((p) => catFilter === "all" || p.category === catFilter);

  const toggle = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) {
        toast.info("الحد الأقصى 4 قطع في المرة الواحدة");
        return prev;
      }
      return [...prev, id];
    });
  };

  const onFile = async (f: File | null) => {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return toast.error("الصورة أكبر من 5MB");
    setPersonUrl(await fileToDataUrl(f));
    setResultUrl(null);
  };

  const generate = async () => {
    if (!session) return toast.error("سجّل دخول الأول عشان تستخدم الميزة");
    if (!personUrl) return toast.error("ارفع صورتك الأول");
    if (selected.length === 0) return toast.error("اختر منتج واحد على الأقل");
    const garments = selected
      .map((id) => products?.find((p) => p.id === id))
      .filter((p): p is NonNullable<typeof p> => !!p && !!p.image_url)
      .map((p) => ({ name: p.name, image: p.image_url! }));
    setBusy(true); setResultUrl(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-tryon", {
        body: { personImage: personUrl, garments },
      });
      if (error) throw error;
      const d = data as { image?: string; error?: string };
      if (d.error) throw new Error(d.error);
      if (!d.image) throw new Error("لم يتم توليد الصورة");
      setResultUrl(d.image);
      toast.success("اتجهزت الصورة ✨");
    } catch (e) {
      toast.error("حصل خطأ", { description: e instanceof Error ? e.message : "" });
    } finally { setBusy(false); }
  };

  const shareWhatsApp = () => {
    const names = selected
      .map((id) => products?.find((p) => p.id === id)?.name)
      .filter(Boolean)
      .join("، ");
    const msg = `جرّبت اللبس عليّ من Hedma هدمة 🛍️✨\n\nالقطع: ${names}\n\nشوف الموقع: https://hedma-try-on-ai.lovable.app`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1 text-xs font-semibold rounded-full border bg-card px-3 py-1">
          <Sparkles className="size-3.5 text-gold-gradient" /> ذكاء اصطناعي
        </span>
        <h1 className="mt-3 font-display text-4xl md:text-5xl font-bold">
          جرّب اللبس <span className="text-gold-gradient">عليك</span> قبل ما تشتري
        </h1>
        <p className="text-muted-foreground mt-2">ارفع صورتك واختر لحد 4 قطع (تيشيرت + بنطلون + جزمة + إكسسوار) ونوريك الإطلالة كاملة.</p>
        <div className="mt-4 inline-block bg-gold-gradient/10 border border-gold-gradient/20 rounded-2xl p-4 text-xs md:text-sm font-semibold max-w-2xl mx-auto">
          💡 <span className="text-primary">"عشان تاخد أفضل استفادة، ياريت ترفع صورتك كاملة بوضوح أو ترفع الجزء اللي عايز تلبسه. ولو حصل خطأ حاول تاني ماتقلقش."</span>
        </div>
      </div>

      {/* 3-Step Try-On Stepper */}
      <div className="max-w-3xl mx-auto mb-10 bg-card border border-gold-gradient/10 p-5 rounded-3xl shadow-sm">
        <div className="flex items-center justify-between relative">
          
          {/* Line Connecting Steps */}
          <div className="absolute top-1/2 left-4 right-4 h-0.5 -translate-y-1/2 bg-muted -z-0" />
          
          {/* Step 1 */}
          <div className="flex flex-col items-center z-10 bg-card px-2">
            <div className={`size-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
              personUrl 
                ? "bg-green-500 text-white" 
                : "bg-gold-gradient text-primary font-black scale-110 shadow-luxe"
            }`}>
              {personUrl ? "✓" : "١"}
            </div>
            <span className={`text-xs font-bold mt-2 ${personUrl ? "text-green-600 font-bold" : "text-gold-gradient font-black"}`}>ارفع صورتك</span>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col items-center z-10 bg-card px-2">
            <div className={`size-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
              !personUrl 
                ? "bg-muted text-muted-foreground" 
                : selected.length > 0 
                  ? "bg-green-500 text-white" 
                  : "bg-gold-gradient text-primary font-black scale-110 shadow-luxe"
            }`}>
              {personUrl && selected.length > 0 ? "✓" : "٢"}
            </div>
            <span className={`text-xs font-bold mt-2 ${
              !personUrl 
                ? "text-muted-foreground" 
                : selected.length > 0 
                  ? "text-green-600 font-bold" 
                  : "text-gold-gradient font-black"
            }`}>اختار القطع</span>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col items-center z-10 bg-card px-2">
            <div className={`size-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${
              !personUrl || selected.length === 0 
                ? "bg-muted text-muted-foreground" 
                : resultUrl 
                  ? "bg-green-500 text-white" 
                  : "bg-gold-gradient text-primary font-black scale-110 shadow-luxe animate-pulse"
            }`}>
              {resultUrl ? "✓" : "٣"}
            </div>
            <span className={`text-xs font-bold mt-2 ${
              !personUrl || selected.length === 0 
                ? "text-muted-foreground" 
                : resultUrl 
                  ? "text-green-600 font-bold" 
                  : "text-gold-gradient font-black"
            }`}>شوف النتيجة</span>
          </div>

        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border bg-card p-5 space-y-4">
          <div>
            <div className="text-sm font-semibold mb-2">١) صورتك (واقف كامل)</div>
            <button onClick={() => fileRef.current?.click()}
              className="w-full aspect-[4/5] rounded-xl border-2 border-dashed grid place-items-center bg-muted/30 hover:bg-muted/60 overflow-hidden">
              {personUrl ? <img src={personUrl} className="size-full object-cover" alt="" /> : (
                <div className="text-center text-muted-foreground"><Upload className="size-8 mx-auto mb-2" /><div>اضغط لرفع صورة</div><div className="text-xs">JPG/PNG حتى 5MB</div></div>
              )}
            </button>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
          </div>

          <div>
            <div className="text-sm font-semibold mb-2 flex items-center justify-between">
              <span>٢) اختار القطع <span className="text-muted-foreground font-normal">({selected.length}/4)</span></span>
              {selected.length > 0 && (
                <button onClick={() => setSelected([])} className="text-xs text-muted-foreground hover:text-destructive">إفراغ الاختيار</button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {cats.map((c) => (
                <button key={c} onClick={() => setCatFilter(c)}
                  className={`px-2.5 py-1 rounded-full text-xs border transition ${catFilter === c ? "gradient-gold text-primary border-transparent" : "hover:border-foreground/30"}`}>
                  {catAr(c)}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-auto pr-1">
              {filtered.map((p) => {
                const isSel = selected.includes(p.id);
                return (
                  <button key={p.id} onClick={() => toggle(p.id)}
                    className={`relative aspect-square rounded-lg overflow-hidden border-2 transition ${isSel ? "border-foreground shadow-luxe" : "border-transparent hover:border-foreground/30"}`}>
                    {p.image_url && <img src={p.image_url} className="size-full object-cover" alt={p.name} />}
                    {isSel && (
                      <span className="absolute top-1 right-1 size-5 grid place-items-center rounded-full gradient-gold text-primary">
                        <Check className="size-3" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <Button onClick={generate} disabled={busy} size="lg" className="w-full gradient-gold text-primary shadow-luxe">
            {busy ? <><Loader2 className="size-4 ml-2 animate-spin" /> جاري التوليد...</> : <><Sparkles className="size-4 ml-2" /> ولّد الصورة</>}
          </Button>
        </div>

        <div className="rounded-2xl border bg-card p-5">
          <div className="text-sm font-semibold mb-2">النتيجة</div>
          <div className="aspect-[4/5] rounded-xl bg-muted/40 grid place-items-center overflow-hidden">
            {busy && <Loader2 className="size-10 animate-spin text-gold-gradient" />}
            {!busy && resultUrl && <img src={resultUrl} className="size-full object-cover" alt="نتيجة" />}
            {!busy && !resultUrl && <div className="text-muted-foreground text-sm text-center px-4">هتظهر الصورة هنا بعد التوليد</div>}
          </div>
          {resultUrl && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <a href={resultUrl} download="hedma-tryon.png" className="text-center text-sm font-semibold rounded-lg border py-2 hover:bg-accent">حمّل الصورة</a>
              <button onClick={shareWhatsApp} className="flex items-center justify-center gap-1 text-sm font-bold rounded-lg bg-[#25D366] text-white py-2 hover:opacity-90">
                <MessageCircle className="size-4" /> شارك على واتساب
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
