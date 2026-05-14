import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatEGP } from "@/lib/format";
import { Gift, Search, User, Clock, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CustomersTab({ setCouponTab }: { setCouponTab: (username: string) => void }) {
  const [search, setSearch] = useState("");

  const { data: customers, isLoading } = useQuery({
    queryKey: ["admin-customers-crm"],
    queryFn: async () => {
      // 1. Get all profiles
      const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (!profiles) return [];

      // 2. Get all orders
      const { data: orders } = await supabase.from("orders").select("customer_id, total, discount, status, created_at");
      
      // 3. Get last activity from logs
      const { data: logs } = await supabase.from("activity_logs").select("user_id, created_at").order("created_at", { ascending: false });

      const map = new Map<string, any>();
      
      profiles.forEach(p => {
        const userOrders = orders?.filter(o => o.customer_id === p.id) || [];
        const successOrders = userOrders.filter(o => o.status === "delivered");
        const totalSpent = successOrders.reduce((acc, o) => acc + (o.total - (o.discount || 0)), 0);
        const lastLog = logs?.find(l => l.user_id === p.id);

        map.set(p.id, {
          id: p.id,
          username: p.username,
          full_name: p.full_name || "—",
          phone: p.phone || "—",
          orderCount: userOrders.length,
          successOrderCount: successOrders.length,
          totalSpent,
          lastSeen: lastLog?.created_at || p.created_at,
          joinedAt: p.created_at
        });
      });

      return Array.from(map.values());
    }
  });

  const filtered = customers?.filter(c => 
    c.username.toLowerCase().includes(search.toLowerCase()) || 
    c.full_name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  ) || [];

  if (isLoading) return <div className="p-20 text-center text-muted-foreground animate-pulse">جاري تحميل سجل العملاء الشامل...</div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between bg-card p-6 rounded-3xl border shadow-sm border-gold-gradient/5">
        <div className="relative w-full max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            placeholder="ابحث بالاسم، اليوزر نيم، أو رقم التليفون..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="pr-10 rounded-xl" 
          />
        </div>
        <div className="text-sm text-muted-foreground font-bold">إجمالي المسجلين: {customers?.length} مستخدم</div>
      </div>

      <div className="rounded-3xl border bg-card overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-muted/30">
              <tr>
                <th className="p-4"><div className="flex items-center gap-2"><User className="size-4" /> العميل</div></th>
                <th className="p-4">اسم المستخدم</th>
                <th className="p-4">رقم التليفون</th>
                <th className="p-4"><div className="flex items-center gap-2"><Clock className="size-4" /> آخر ظهور</div></th>
                <th className="p-4"><div className="flex items-center gap-2"><ShoppingCart className="size-4" /> الطلبات</div></th>
                <th className="p-4">إجمالي الإنفاق</th>
                <th className="p-4 text-center">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t hover:bg-muted/5 transition-colors">
                  <td className="p-4">
                    <div className="font-bold">{c.full_name}</div>
                    <div className="text-[10px] text-muted-foreground">انضم في: {new Date(c.joinedAt).toLocaleDateString("ar-EG")}</div>
                  </td>
                  <td className="p-4 font-mono text-xs text-gold-gradient font-black">{c.username}</td>
                  <td className="p-4 font-mono text-xs" dir="ltr">{c.phone}</td>
                  <td className="p-4 text-xs text-muted-foreground">
                    {new Date(c.lastSeen).toLocaleString("ar-EG")}
                  </td>
                  <td className="p-4">
                    <div className="text-xs font-bold">{c.successOrderCount} / {c.orderCount} طلب</div>
                    <div className="w-16 h-1 bg-muted rounded-full mt-1 overflow-hidden">
                       <div className="h-full bg-gold-gradient" style={{ width: `${(c.successOrderCount / (c.orderCount || 1)) * 100}%` }} />
                    </div>
                  </td>
                  <td className="p-4 font-display font-black text-lg">{formatEGP(c.totalSpent)}</td>
                  <td className="p-4 text-center">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setCouponTab(c.username)} 
                      className="rounded-xl border-gold-gradient/20 hover:bg-gold-gradient/10 h-9"
                    >
                      <Gift className="size-4 ml-2 text-gold-gradient" /> خصم يدوي
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="p-20 text-center text-muted-foreground">لا يوجد مستخدمون يطابقون بحثك</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
