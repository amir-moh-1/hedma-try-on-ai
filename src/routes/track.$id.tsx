import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useSiteSettings, ORDER_STATUS_AR, ORDER_STATUS_STEPS } from "@/lib/settings";
import { formatEGP } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Check, MessageCircle, Truck, MapPin, Phone } from "lucide-react";

export const Route = createFileRoute("/track/$id")({ component: Track });

function Track() {
  const { id } = Route.useParams();
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const { whatsapp } = useSiteSettings();

  useEffect(() => { if (!loading && !user) nav({ to: "/auth" }); }, [loading, user, nav]);

  const { data: order, refetch } = useQuery({
    queryKey: ["order", id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
      return data;
    },
    refetchInterval: 10_000,
  });

  useEffect(() => {
    const ch = supabase.channel(`order-${id}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` }, () => refetch())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, refetch]);

  if (!order) return <div className="p-10 text-center">جاري التحميل...</div>;

  const items = (order.items as any[]) ?? [];
  const currentIdx = ORDER_STATUS_STEPS.indexOf(order.status as any);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold mb-2">تتبع الطلب</h1>
      <p className="text-muted-foreground mb-6">رقم الطلب: <span className="font-mono">#{order.id.slice(0,8)}</span></p>

      {order.status === "cancelled" ? (
        <div className="rounded-2xl border bg-destructive/10 p-6 mb-6 text-center font-bold text-destructive">تم إلغاء الطلب</div>
      ) : (
        <div className="rounded-2xl border bg-card p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs text-muted-foreground">الحالة الحالية</div>
              <div className="font-bold text-xl text-gold-gradient">{ORDER_STATUS_AR[order.status]}</div>
            </div>
            <Truck className="size-10 text-gold-gradient" />
          </div>
          <div className="relative">
            <div className="absolute right-4 top-4 bottom-4 w-0.5 bg-muted" />
            <div className="absolute right-4 top-4 w-0.5 gradient-gold transition-all" style={{ height: `${(currentIdx / (ORDER_STATUS_STEPS.length - 1)) * 100}%` }} />
            <ul className="space-y-4">
              {ORDER_STATUS_STEPS.map((s, idx) => {
                const done = idx <= currentIdx;
                return (
                  <li key={s} className="flex items-center gap-3 relative">
                    <div className={`size-8 rounded-full grid place-items-center shrink-0 ${done ? "gradient-gold text-primary" : "bg-muted text-muted-foreground"}`}>
                      {done ? <Check className="size-4" /> : <span className="text-xs">{idx + 1}</span>}
                    </div>
                    <span className={done ? "font-semibold" : "text-muted-foreground"}>{ORDER_STATUS_AR[s]}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          {order.tracking_note && (
            <div className="mt-4 rounded-lg bg-accent/40 p-3 text-sm"><span className="font-bold">ملاحظة من المندوب: </span>{order.tracking_note}</div>
          )}
        </div>
      )}

      <div className="rounded-2xl border bg-card p-6 mb-4">
        <h3 className="font-bold mb-3">منتجات الطلب</h3>
        <ul className="space-y-2 text-sm">
          {items.map((i: any, idx: number) => (
            <li key={idx} className="flex justify-between border-b last:border-0 pb-2">
              <span>{i.name} {i.size && `(${i.size})`} × {i.qty}</span>
              <span className="font-semibold">{formatEGP(i.price * i.qty)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 pt-3 border-t flex justify-between font-bold">
          <span>الإجمالي</span><span>{formatEGP(Number(order.total) - Number(order.discount))}</span>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 mb-4 space-y-2 text-sm">
        {order.customer_phone && <div className="flex items-center gap-2"><Phone className="size-4" /> {order.customer_phone}</div>}
        {order.customer_address && <div className="flex items-center gap-2"><MapPin className="size-4" /> {order.customer_address}</div>}
      </div>

      <Button asChild className="w-full gradient-gold text-primary">
        <a href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(`استفسار عن الطلب #${order.id.slice(0,8)}`)}`} target="_blank" rel="noreferrer">
          <MessageCircle className="size-4 ml-2" /> تواصل عن الطلب
        </a>
      </Button>
    </div>
  );
}
