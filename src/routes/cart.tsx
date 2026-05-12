import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useCart, cartItemKey } from "@/lib/cart";
import { useAuth, logActivity } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/lib/settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatEGP } from "@/lib/format";
import { Trash2, Minus, Plus, MessageCircle, Tag } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/cart")({ component: Cart });

type Coupon = { percent: number; code: string; message: string | null };

function Cart() {
  const { items, remove, setQty, total, clear } = useCart();
  const { user, profile } = useAuth();
  const { whatsapp } = useSiteSettings();
  const nav = useNavigate();
  const [codeInput, setCodeInput] = useState("");
  const [manualCoupon, setManualCoupon] = useState<Coupon | null>(null);
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    if (!data) { toast.error("الكود غير صحيح أو منتهي"); return; }
    setManualCoupon(data as Coupon);
    toast.success(`تم تطبيق كوبون ${data.code} (-${data.percent}%) 🎉`);
  };

  const buildMessage = (orderId?: string) => {
    const greeting = `السلام عليكم 👋\nأنا ${profile?.username ?? "عميل جديد"} من موقع Hedma هدمة 🛍️\n\nحبيت أتمم الطلب التالي:`;
    const lines = items.map((i, idx) =>
      `\n${idx + 1}) ${i.name}${i.size ? ` - مقاس ${i.size}` : ""}${i.color ? ` - لون ${i.color}` : ""}\n   الكمية: ${i.qty} × ${formatEGP(i.price)} = ${formatEGP(i.price * i.qty)}`
    ).join("");
    let footer = `\n\n💰 الإجمالي: ${formatEGP(total)}`;
    if (best) footer += `\n🎁 كوبون ${best.code} (-${best.percent}%): -${formatEGP(discount)}\n✅ السعر النهائي: ${formatEGP(grand)}`;
    if (phone) footer += `\n📞 تليفون: ${phone}`;
    if (address) footer += `\n📍 العنوان: ${address}`;
    if (orderId) footer += `\n\n🔖 رقم الطلب: #${orderId.slice(0, 8)}\n🔗 تتبع الطلب: ${window.location.origin}/track/${orderId}`;
    footer += `\n\nياريت تأكدولي الطلب وميعاد التوصيل. شكراً 🌟`;
    return `${greeting}${lines}${footer}`;
  };

  const checkout = async () => {
    if (items.length === 0) return;
    if (!user) {
      toast.info("سجّل دخولك عشان نقدر نتتبع الطلب ليك");
      nav({ to: "/auth" });
      return;
    }
    setSubmitting(true);
    let orderId: string | undefined;
    const { data: ord, error } = await supabase
      .from("orders")
      .insert({
        customer_id: user.id,
        customer_name: profile?.full_name ?? profile?.username ?? null,
        customer_phone: phone || null,
        customer_address: address || null,
        items: items as never,
        total,
        discount,
        coupon_code: best?.code ?? null,
        status: "pending",
      })
      .select("id")
      .maybeSingle();
    if (error || !ord) {
      toast.error("حصل خطأ في حفظ الطلب، هنحولك على واتساب على طول");
    } else {
      orderId = ord.id;
      toast.success("تم تسجيل طلبك 🌟 هتقدر تتبعه من حسابك");
    }
    const msg = buildMessage(orderId);
    logActivity("checkout_whatsapp", { order_id: orderId, items: items.length, total: grand, coupon: best?.code });
    const url = `https://wa.me/${whatsapp}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank");
    clear();
    setSubmitting(false);
    if (orderId) nav({ to: "/track/$id", params: { id: orderId } });
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
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">📞 تليفون التواصل</label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01xxxxxxxxx" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">📍 عنوان التوصيل</label>
              <Textarea rows={2} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="المنطقة والشارع ورقم العمارة" />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1 mb-1">
                <Tag className="size-3" /> هل لديك كود خصم؟
              </label>
              <div className="flex gap-2">
                <Input value={codeInput} onChange={(e) => setCodeInput(e.target.value)} placeholder="مثال: HEDMA20" className="uppercase" />
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
            {best?.message && <div className="text-xs rounded-lg bg-accent/40 p-2">{best.message}</div>}
            <Button onClick={checkout} size="lg" disabled={submitting} className="w-full gradient-gold text-primary shadow-luxe">
              <MessageCircle className="size-4 ml-2" /> {submitting ? "جاري الإرسال..." : "إتمام الطلب على واتساب"}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              {user ? "هنحفظلك الطلب وتقدر تتبعه من حسابك" : "سجّل دخولك عشان نتتبع الطلب ليك"}
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}
