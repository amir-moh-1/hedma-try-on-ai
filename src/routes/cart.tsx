import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useCart, cartItemKey } from "@/lib/cart";
import { useAuth, logActivity } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatEGP } from "@/lib/format";
import { Trash2, Minus, Plus, MessageCircle, Tag } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({ component: Cart });

const WHATSAPP = "201229344711";

type Coupon = { percent: number; code: string; message: string | null };

function Cart() {
  const { items, remove, setQty, total, clear } = useCart();
  const { user, profile } = useAuth();
  const [codeInput, setCodeInput] = useState("");
  const [manualCoupon, setManualCoupon] = useState<Coupon | null>(null);

  const { data: coupons } = useQuery({
    queryKey: ["my-coupons", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("coupons").select("percent,code,message").eq("active", true);
      return (data ?? []) as Coupon[];
    },
  });

  const auto = (coupons ?? []).reduce<Coupon | null>(
    (b, c) => (c.percent > (b?.percent ?? 0) ? c : b), null
  );
  const best: Coupon | null =
    manualCoupon && manualCoupon.percent > (auto?.percent ?? 0) ? manualCoupon : auto;

  const discount = best ? Math.round((total * best.percent) / 100) : 0;
  const grand = total - discount;

  const applyCode = async () => {
    const code = codeInput.trim().toUpperCase();
    if (!code) return;
    const { data } = await supabase
      .from("coupons")
      .select("percent,code,message")
      .eq("active", true)
      .ilike("code", code)
      .maybeSingle();
    if (!data) {
      toast.error("الكود غير صحيح أو منتهي");
      return;
    }
    setManualCoupon(data as Coupon);
    toast.success(`تم تطبيق كوبون ${data.code} (-${data.percent}%) 🎉`);
  };

  const buildMessage = () => {
    const greeting = `السلام عليكم 👋\nأنا ${profile?.username ?? "عميل جديد"} من موقع Hedma هدمة 🛍️\n\nحبيت أتمم الطلب التالي:`;
    const lines = items.map((i, idx) =>
      `\n${idx + 1}) ${i.name}${i.size ? ` - مقاس ${i.size}` : ""}${i.color ? ` - لون ${i.color}` : ""}\n   الكمية: ${i.qty} × ${formatEGP(i.price)} = ${formatEGP(i.price * i.qty)}`
    ).join("");
    let footer = `\n\n💰 الإجمالي: ${formatEGP(total)}`;
    if (best) footer += `\n🎁 كوبون ${best.code} (-${best.percent}%): -${formatEGP(discount)}\n✅ السعر النهائي: ${formatEGP(grand)}`;
    footer += `\n\nياريت تأكدولي الطلب وميعاد التوصيل. شكراً 🌟`;
    return `${greeting}${lines}${footer}`;
  };

  const checkout = () => {
    if (items.length === 0) return;
    const msg = buildMessage();
    logActivity("checkout_whatsapp", { items: items.length, total: grand, coupon: best?.code });
    const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
    clear();
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl md:text-4xl font-bold mb-6">سلة المشتريات</h1>

      {items.length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center">
          <p className="text-muted-foreground mb-4">سلتك فاضية</p>
          <Button asChild className="gradient-gold text-primary"><Link to="/products">تسوّق دلوقتي</Link></Button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_360px] gap-8">
          <div className="space-y-3">
            {items.map((i) => {
              const k = cartItemKey(i);
              return (
                <div key={k} className="flex gap-4 rounded-2xl border bg-card p-3">
                  <div className="size-32 sm:size-40 rounded-xl overflow-hidden bg-muted shrink-0">
                    {i.image && <img src={i.image} className="size-full object-cover" alt={i.name} />}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col">
                    <div className="font-semibold line-clamp-2">{i.name}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {i.size && `مقاس ${i.size}`}{i.size && i.color && " • "}{i.color && `لون ${i.color}`}
                    </div>
                    <div className="font-display font-bold mt-2 text-lg">{formatEGP(i.price)}</div>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setQty(k, i.qty - 1)} className="size-8 grid place-items-center rounded-md border"><Minus className="size-3" /></button>
                        <span className="min-w-8 text-center font-semibold">{i.qty}</span>
                        <button onClick={() => setQty(k, i.qty + 1)} className="size-8 grid place-items-center rounded-md border"><Plus className="size-3" /></button>
                      </div>
                      <button onClick={() => remove(k)} className="text-muted-foreground hover:text-destructive p-2"><Trash2 className="size-4" /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <aside className="rounded-2xl border bg-card p-6 h-fit space-y-3 sticky top-20">
            <div>
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-1">
                <Tag className="size-3" /> هل لديك كود خصم؟
              </label>
              <div className="flex gap-2">
                <Input
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="مثال: HEDMA20"
                  className="uppercase"
                />
                <Button variant="outline" onClick={applyCode} type="button">تطبيق</Button>
              </div>
            </div>

            <div className="border-t pt-3 flex justify-between"><span className="text-muted-foreground">الإجمالي</span><span>{formatEGP(total)}</span></div>
            {best && (
              <div className="flex justify-between text-sm">
                <span className="text-gold-gradient font-bold">كوبون {best.code} (-{best.percent}%)</span>
                <span className="text-gold-gradient font-bold">-{formatEGP(discount)}</span>
              </div>
            )}
            <div className="border-t pt-3 flex justify-between font-bold text-lg">
              <span>السعر النهائي</span><span>{formatEGP(grand)}</span>
            </div>
            {best?.message && (
              <div className="text-xs rounded-lg bg-accent/40 p-2">{best.message}</div>
            )}
            <Button onClick={checkout} size="lg" className="w-full gradient-gold text-primary shadow-luxe">
              <MessageCircle className="size-4 ml-2" /> إتمام الطلب على واتساب
            </Button>
            <p className="text-xs text-muted-foreground text-center">هيتم تحويلك على واتساب برسالة جاهزة بالطلب</p>
          </aside>
        </div>
      )}
    </div>
  );
}
