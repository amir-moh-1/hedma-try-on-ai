import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/products")({ component: Products });

function Products() {
  const { user } = useAuth();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");

  const { data: products } = useQuery({
    queryKey: ["all-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products")
        .select("id,name,price,image_url,category,stock")
        .eq("active", true).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: coupons } = useQuery({
    queryKey: ["my-coupons", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("coupons").select("percent,code,message").eq("active", true);
      return data ?? [];
    },
  });

  const bestPercent = (coupons ?? []).reduce((m, c) => Math.max(m, c.percent), 0);
  const cats = ["all", ...Array.from(new Set((products ?? []).map((p) => p.category)))];
  const filtered = (products ?? []).filter((p) =>
    (cat === "all" || p.category === cat) && p.name.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      {bestPercent > 0 && (
        <div className="mb-6 rounded-2xl gradient-gold text-primary p-4 shadow-luxe">
          <div className="font-bold">🎁 عرض خاص ليك</div>
          <div className="text-sm">عندك خصم {bestPercent}% على كل المنتجات. السعر النهائي بيظهر مع الخصم.</div>
        </div>
      )}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h1 className="font-display text-3xl md:text-4xl font-bold">كل المنتجات</h1>
        <div className="flex gap-2">
          <Input placeholder="ابحث عن منتج..." value={q} onChange={(e) => setQ(e.target.value)} className="md:w-64" />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-6">
        {cats.map((c) => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-4 py-1.5 rounded-full text-sm border transition ${cat === c ? "gradient-gold text-primary border-transparent" : "hover:border-foreground/30"}`}>
            {c === "all" ? "الكل" : c}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {filtered.map((p) => (
          <ProductCard key={p.id} p={{
            ...p,
            discountedPrice: bestPercent > 0 ? Math.round(p.price * (1 - bestPercent / 100)) : null,
          }} />
        ))}
        {filtered.length === 0 && <div className="col-span-full text-center text-muted-foreground py-16">لا توجد نتائج</div>}
      </div>
    </div>
  );
}
