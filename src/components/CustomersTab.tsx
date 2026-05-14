import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatEGP } from "@/lib/format";
import { Gift, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CustomersTab({ setCouponTab }: { setCouponTab: (username: string) => void }) {
  const [search, setSearch] = useState("");

  const { data: customers, isLoading } = useQuery({
    queryKey: ["admin-customers-stats"],
    queryFn: async () => {
      // Get all delivered orders to calculate lifetime value
      const { data: orders } = await supabase.from("orders").select("customer_id, customer_name, customer_phone, total, discount").eq("status", "delivered");
      
      if (!orders) return [];

      const map = new Map<string, any>();
      
      orders.forEach(o => {
        const key = o.customer_id || o.customer_phone || o.customer_name || "مجهول";
        if (!map.has(key)) {
          map.set(key, {
            id: o.customer_id,
            name: o.customer_name || "غير محدد",
            phone: o.customer_phone || "غير محدد",
            orderCount: 0,
            totalSpent: 0
          });
        }
        
        const c = map.get(key);
        c.orderCount += 1;
        c.totalSpent += (o.total - (o.discount || 0));
      });

      return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
    }
  });

  const filtered = customers?.filter(c => c.name.includes(search) || c.phone.includes(search)) || [];

  if (isLoading) return <div className="p-10 text-center text-muted-foreground">جاري تحميل بيانات العملاء...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between bg-card p-4 rounded-2xl border">
        <div className="relative w-full max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="ابحث باسم العميل أو رقم التليفون..." value={search} onChange={e => setSearch(e.target.value)} className="pr-9" />
        </div>
        <div className="text-sm text-muted-foreground font-semibold">إجمالي العملاء: {customers?.length}</div>
      </div>

      <div className="rounded-2xl border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/20">
              <tr>
                <th className="p-3 text-right">اسم العميل</th>
                <th className="p-3 text-right">رقم التليفون</th>
                <th className="p-3 text-right">عدد الطلبات (الناجحة)</th>
                <th className="p-3 text-right">إجمالي المدفوعات</th>
                <th className="p-3 text-right">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={i} className="border-t hover:bg-muted/10 transition-colors">
                  <td className="p-3 font-semibold">{c.name}</td>
                  <td className="p-3" dir="ltr">{c.phone}</td>
                  <td className="p-3">
                    <span className="px-2 py-1 bg-accent rounded-full text-xs font-bold">{c.orderCount} طلب</span>
                  </td>
                  <td className="p-3 font-display font-bold text-gold-gradient">{formatEGP(c.totalSpent)}</td>
                  <td className="p-3">
                    <Button size="sm" variant="outline" onClick={() => setCouponTab(c.name)} className="h-8 border-gold-gradient/30 hover:bg-gold-gradient/10">
                      <Gift className="size-3 ml-1 text-gold-gradient" /> إنشاء كوبون خصم
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">لا يوجد عملاء يطابقون البحث</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
