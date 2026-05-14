import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatEGP } from "@/lib/format";
import { Link } from "@tanstack/react-router";
import { Package, Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export function ProductsTab({ products }: { products: any[] }) {
  const [search, setSearch] = useState("");

  const filtered = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.vendor.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between bg-card p-4 rounded-3xl border border-gold-gradient/5">
        <div className="relative w-full max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input 
            placeholder="ابحث عن منتج أو تاجر..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="pr-10 rounded-xl"
          />
        </div>
        <div className="text-sm font-bold text-muted-foreground">إجمالي المنتجات: {products.length}</div>
      </div>

      <div className="rounded-3xl border bg-card overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-muted/30">
              <tr>
                <th className="p-4">المنتج</th>
                <th className="p-4">التاجر</th>
                <th className="p-4">السعر</th>
                <th className="p-4">المخزون</th>
                <th className="p-4">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t hover:bg-muted/5 transition-colors">
                  <td className="p-4">
                    <Link to="/product/$id" params={{ id: p.id }} className="font-bold hover:text-gold-gradient transition-colors">
                      {p.name}
                    </Link>
                  </td>
                  <td className="p-4 text-muted-foreground font-semibold">{p.vendor}</td>
                  <td className="p-4 font-display font-black text-gold-gradient">{formatEGP(p.price)}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-lg font-black ${p.stock < 5 ? "bg-destructive/10 text-destructive shadow-sm shadow-destructive/10" : "bg-muted/50 text-muted-foreground"}`}>
                      {p.stock} {p.stock === 0 ? "(نفد)" : p.stock < 5 ? "(منخفض)" : ""}
                    </span>
                  </td>
                  <td className="p-4 font-bold">{p.active ? "✅ نشط" : "❌ معطل"}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="p-20 text-center text-muted-foreground">لا توجد منتجات تطابق بحثك</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
