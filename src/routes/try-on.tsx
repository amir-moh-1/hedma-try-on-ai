import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Sparkles, Upload, Loader2 } from "lucide-react";

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
  const [productId, setProductId] = useState<string | undefined>(presetProduct);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: products } = useQuery({
    queryKey: ["tryon-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id,name,image_url,category").eq("active", true).not("image_url","is",null);
      return data ?? [];
    },
  });

  useEffect(() => { if (presetProduct) setProductId(presetProduct); }, [presetProduct]);

  const onFile = async (f: File | null) => {
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return toast.error("الصورة أكبر من 5MB");
    setPersonUrl(await fileToDataUrl(f));
    setResultUrl(null);
  };

  const generate = async () => {
    if (!session) return toast.error("سجّل دخول الأول عشان تستخدم الميزة");
    if (!personUrl) return toast.error("ارفع صورتك الأول");
    if (!productId) return toast.error("اختر المنتج");
    const product = products?.find((p) => p.id === productId);
    if (!product?.image_url) return toast.error("المنتج بدون صورة");
    setBusy(true); setResultUrl(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-tryon", {
        body: { personImage: personUrl, garmentImage: product.image_url, garmentName: product.name },
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="text-center mb-8">
        <span className="inline-flex items-center gap-1 text-xs font-semibold rounded-full border bg-card px-3 py-1">
          <Sparkles className="size-3.5 text-gold-gradient" /> ذكاء اصطناعي
        </span>
        <h1 className="mt-3 font-display text-4xl md:text-5xl font-bold">
          جرّب اللبس <span className="text-gold-gradient">عليك</span> قبل ما تشتري
        </h1>
        <p className="text-muted-foreground mt-2">ارفع صورتك واختر منتج، وهنوريك شكل اللبس عليك بالظبط.</p>
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
            <div className="text-sm font-semibold mb-2">٢) اختار المنتج</div>
            <div className="grid grid-cols-3 gap-2 max-h-72 overflow-auto pr-1">
              {(products ?? []).map((p) => (
                <button key={p.id} onClick={() => setProductId(p.id)}
                  className={`relative aspect-square rounded-lg overflow-hidden border-2 transition ${productId === p.id ? "border-foreground shadow-luxe" : "border-transparent hover:border-foreground/30"}`}>
                  {p.image_url && <img src={p.image_url} className="size-full object-cover" alt={p.name} />}
                </button>
              ))}
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
            <a href={resultUrl} download="hedma-tryon.png" className="mt-3 block text-center text-sm font-semibold text-gold-gradient hover:underline">حمّل الصورة</a>
          )}
        </div>
      </div>
    </div>
  );
}
