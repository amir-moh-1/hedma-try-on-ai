import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatEGP } from "@/lib/format";
import { TrendingUp, Package, ShoppingCart, DollarSign, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function VendorInsightsTab() {
  const [search, setSearch] = useState("");

  const { data: insights, isLoading } = useQuery({
    queryKey: ["admin-vendor-insights"],
    queryFn: async () => {
      // 1. Get all vendors (profiles with vendor role or simply all users who added products)
      const { data: vendors } = await supabase.from("profiles").select("id, username, full_name");
      
      // 2. Get all products
      const { data: products } = await supabase.from("products").select("id, vendor_id, price, stock");
      
      // 3. Get all orders
      const { data: orders } = await supabase.from("orders").select("items, status, total, discount").eq("status", "delivered");

      const vendorStats = vendors?.map(v => {
        const vProducts = products?.filter(p => p.vendor_id === v.id) || [];
        const productIds = new Set(vProducts.map(p => p.id));
        
        // Calculate sales for this vendor by checking order items
        let vSales = 0;
        let vOrdersCount = 0;
        
        orders?.forEach(o => {
          const items = (o.items as any[]) || [];
          const vendorItems = items.filter(i => productIds.has(i.id));
          if (vendorItems.length > 0) {
            vOrdersCount++;
            vSales += vendorItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
          }
        });

        return {
          id: v.id,
          username: v.username,
          full_name: v.full_name || "—",
          productCount: vProducts.length,
          totalSales: vSales,
          ordersCount: vOrdersCount,
          totalStock: vProducts.reduce((acc, p) => acc + p.stock, 0)
        };
      }).filter(v => v.productCount > 0) || [];

      return vendorStats;
    }
  });

  const filtered = insights?.filter(v => 
    v.username.toLowerCase().includes(search.toLowerCase()) || 
    v.full_name.toLowerCase().includes(search.toLowerCase())
  ) || [];

  if (isLoading) return <div className="p-20 text-center text-muted-foreground animate-pulse">جاري تحليل بيانات التجار...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center justify-between bg-card p-6 rounded-3xl border shadow-sm border-gold-gradient/5">
        <div className="relative w-full max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            placeholder="ابحث عن تاجر بالاسم أو اليوزر نيم..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="pr-10 rounded-xl" 
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((v) => (
          <div key={v.id} className="rounded-3xl border bg-card p-6 shadow-lg hover:shadow-xl transition-all border-gold-gradient/5 group">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="font-bold text-xl mb-1">{v.full_name}</h3>
                <p className="text-xs text-gold-gradient font-black">@{v.username}</p>
              </div>
              <div className="size-12 rounded-2xl bg-gold-gradient/10 grid place-items-center group-hover:bg-gold-gradient group-hover:text-primary transition-colors">
                <TrendingUp className="size-6 text-gold-gradient group-hover:text-primary" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-muted/30 p-4 rounded-2xl">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold mb-1">
                  <Package className="size-3" /> المنتجات
                </div>
                <div className="text-xl font-black">{v.productCount} <span className="text-[10px] font-normal">صنف</span></div>
              </div>
              <div className="bg-muted/30 p-4 rounded-2xl">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold mb-1">
                  <ShoppingCart className="size-3" /> المبيعات
                </div>
                <div className="text-xl font-black">{v.ordersCount} <span className="text-[10px] font-normal">طلب</span></div>
              </div>
              <div className="bg-muted/30 p-4 rounded-2xl col-span-2">
                <div className="flex items-center gap-2 text-muted-foreground text-xs font-bold mb-1">
                  <DollarSign className="size-3" /> إجمالي الأرباح (تقريبياً)
                </div>
                <div className="text-2xl font-display font-black text-gold-gradient">{formatEGP(v.totalSales)}</div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t flex items-center justify-between text-xs text-muted-foreground font-bold">
               <span>إجمالي القطع في المخزن:</span>
               <span className="text-foreground">{v.totalStock} قطعة</span>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full p-20 text-center text-muted-foreground">لا يوجد تجار حالياً يطابقون البحث.</div>
        )}
      </div>
    </div>
  );
}
