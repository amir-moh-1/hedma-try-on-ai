import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatEGP } from "@/lib/format";
import { Package, Users, Tag, Activity, ShoppingBag, Clock } from "lucide-react";
import { ORDER_STATUS_AR } from "@/lib/settings";

export function DashboardTab() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats-home"],
    queryFn: async () => {
      const [{ count: products }, { count: users }, { count: merchants }, { data: orders }] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("merchants").select("*", { count: "exact", head: true }),
        supabase.from("orders").select("total, discount"),
      ]);
      
      const totalRevenue = (orders ?? []).reduce((acc, o) => acc + (Number(o.total) - Number(o.discount || 0)), 0);
      
      return { 
        products: products ?? 0, 
        users: users ?? 0, 
        merchants: merchants ?? 0, 
        revenue: totalRevenue,
        ordersCount: orders?.length ?? 0
      };
    },
  });

  const { data: latestOrders } = useQuery({
    queryKey: ["admin-latest-orders"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(5);
      return data ?? [];
    },
  });

  const cards = [
    { label: "الإيرادات", value: formatEGP(stats?.revenue ?? 0), icon: Package, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "التجار", value: stats?.merchants ?? 0, icon: ShoppingBag, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "الطلبات", value: stats?.ordersCount ?? 0, icon: Clock, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "المنتجات", value: stats?.products ?? 0, icon: Tag, color: "text-amber-500", bg: "bg-amber-500/10" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c, i) => (
          <div key={i} className="rounded-2xl border bg-card p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-shadow">
            <div>
              <div className="text-sm text-muted-foreground font-semibold mb-1">{c.label}</div>
              <div className="text-2xl font-bold">{c.value}</div>
            </div>
            <div className={`size-12 rounded-xl ${c.bg} grid place-items-center`}>
              <c.icon className={`size-6 ${c.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
          <h3 className="font-bold flex items-center gap-2"><Activity className="size-4" /> آخر الطلبات</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-muted/10">
              <tr>
                <th className="p-4">رقم الطلب</th>
                <th className="p-4">العميل</th>
                <th className="p-4">المبلغ</th>
                <th className="p-4">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {latestOrders?.map((o) => (
                <tr key={o.id} className="border-t hover:bg-muted/5 transition-colors">
                  <td className="p-4 font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</td>
                  <td className="p-4 font-semibold">{o.customer_name || "—"}</td>
                  <td className="p-4 font-display font-bold">{formatEGP(Number(o.total) - Number(o.discount || 0))}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded-full bg-accent text-[10px] font-bold">
                      {ORDER_STATUS_AR[o.status as keyof typeof ORDER_STATUS_AR] || o.status}
                    </span>
                  </td>
                </tr>
              ))}
              {latestOrders?.length === 0 && (
                <tr><td colSpan={4} className="p-10 text-center text-muted-foreground">لا توجد طلبات بعد</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
