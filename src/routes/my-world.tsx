import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Activity, Gift, Package, ShoppingBag, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { formatEGP } from "@/lib/format";
import { ORDER_STATUS_AR } from "@/lib/settings";

export const Route = createFileRoute("/my-world")({ component: MyWorld });

function MyWorld() {
  const { user, loading, profile } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/auth" });
  }, [loading, user, nav]);

  const { data: offers } = useQuery({
    queryKey: ["my-world-offers"],
    queryFn: async () => {
      const { data } = await supabase.from("coupons").select("code,percent,message,active").eq("active", true).order("percent", { ascending: false }).limit(6);
      return data ?? [];
    },
  });

  const { data: orders } = useQuery({
    queryKey: ["my-world-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("id,total,discount,status,items,created_at").eq("customer_id", user!.id).order("created_at", { ascending: false }).limit(5);
      return data ?? [];
    },
  });

  const totalSpent = (orders ?? []).reduce((sum: number, o: any) => sum + Number(o.total ?? 0) - Number(o.discount ?? 0), 0);
  const itemsCount = (orders ?? []).reduce((sum: number, o: any) => sum + (((o.items as any[]) ?? []).length || 0), 0);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 space-y-8" dir="rtl">
      <section className="rounded-3xl bg-card border p-6 md:p-8 shadow-luxe overflow-hidden relative">
        <div className="absolute inset-y-0 left-0 w-1/3 bg-gold/10 blur-3xl" />
        <div className="relative">
          <p className="text-xs font-black text-gold mb-2">عالمي في HADMA</p>
          <h1 className="font-display text-3xl md:text-5xl font-black">أهلاً {profile?.full_name || profile?.username || "بيك"}</h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-2xl">العروض الخاصة، نشاطك، مشترياتك السابقة، وكل حاجة تخص رحلتك في هدمة في مكان واحد.</p>
        </div>
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={ShoppingBag} label="طلباتك" value={(orders ?? []).length.toString()} />
        <Stat icon={Package} label="منتجات اشتريتها" value={itemsCount.toString()} />
        <Stat icon={Gift} label="قيمة مشتريات" value={formatEGP(totalSpent)} />
        <Stat icon={Activity} label="نشاطك" value="متابع" />
      </section>

      <section className="grid lg:grid-cols-[1fr_1.2fr] gap-6">
        <div className="rounded-3xl border bg-card p-5">
          <h2 className="font-display text-2xl font-bold mb-4 flex items-center gap-2"><Sparkles className="size-5 text-gold" /> عروض المدير ليك</h2>
          <div className="space-y-3">
            {(offers ?? []).length === 0 ? <div className="text-sm text-muted-foreground">لا توجد عروض حالياً</div> : offers?.map((c: any) => (
              <div key={c.code} className="rounded-2xl gradient-gold text-primary p-4">
                <div className="font-black text-lg">{c.code} — خصم {c.percent}%</div>
                <div className="text-xs font-semibold opacity-80">{c.message || "استخدم الكود عند الشراء"}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border bg-card p-5">
          <h2 className="font-display text-2xl font-bold mb-4">مشترياتك السابقة</h2>
          <div className="space-y-3">
            {(orders ?? []).length === 0 ? <div className="text-sm text-muted-foreground">لسه مفيش مشتريات — ابدأ رحلتك من المنتجات.</div> : orders?.map((o: any) => (
              <Link key={o.id} to="/track/$id" params={{ id: o.id }} className="block rounded-2xl border p-4 hover:bg-muted/30 transition">
                <div className="flex items-center justify-between gap-3">
                  <div><div className="font-bold">طلب #{o.id.slice(0, 8)}</div><div className="text-xs text-muted-foreground">{((o.items as any[]) ?? []).length} منتج • {new Date(o.created_at).toLocaleDateString("ar-EG")}</div></div>
                  <div className="text-left"><div className="font-black text-gold">{formatEGP(Number(o.total) - Number(o.discount))}</div><div className="text-[10px] text-muted-foreground">{ORDER_STATUS_AR[o.status] ?? o.status}</div></div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return <div className="rounded-2xl border bg-card p-4"><Icon className="size-5 text-gold mb-3" /><div className="font-display text-xl font-black">{value}</div><div className="text-xs text-muted-foreground">{label}</div></div>;
}