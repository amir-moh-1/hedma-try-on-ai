import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { useAuth } from "@/lib/auth";
import { useMemo, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { catAr } from "@/lib/categories";

export const Route = createFileRoute("/products")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      category: (search.category as string) || undefined,
    };
  },
  component: Products,
});

function ProductSkeleton() {
  return (
    <div className="animate-pulse flex flex-col gap-3">
      <div className="aspect-[4/5] rounded-3xl bg-muted" />
      <div className="h-5 bg-muted rounded-xl w-3/4" />
      <div className="h-4 bg-muted rounded-lg w-1/3" />
    </div>
  );
}

function Products() {
  const { user } = useAuth();
  const { category: urlCat } = Route.useSearch();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<string>("newest");

  // Sync state if URL query changes
  useEffect(() => {
    if (urlCat) {
      setCat(urlCat);
    }
  }, [urlCat]);

  const { data: products, isLoading } = useQuery({
    queryKey: ["all-products"],
    queryFn: async () => {
      const { data } = await supabase.from("products")
        .select("id,name,price,image_url,category,stock,colors,description,created_at,variants")
        .eq("active", true);
      return (data ?? []).map((p: any) => {
        const variants = Array.isArray(p.variants) ? p.variants : [];
        const secondary_image_url = variants.find((v: any) => v?.image_url && v.image_url !== p.image_url)?.image_url ?? null;
        return { ...p, secondary_image_url };
      });
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
  
  const cats = useMemo(() => {
    return ["all", ...Array.from(new Set((products ?? []).map((p) => p.category)))];
  }, [products]);

  const priceCap = useMemo(() => {
    const max = Math.max(0, ...(products ?? []).map((p) => Number(p.price)));
    return Math.ceil(max / 100) * 100 || 1000;
  }, [products]);
  
  const effectiveMax = maxPrice ?? priceCap;

  const filtered = useMemo(() => {
    return (products ?? []).filter((p) => {
      const searchStr = `${p.name} ${p.category} ${p.description || ""} ${p.colors?.join(" ") || ""}`.toLowerCase();
      const query = q.toLowerCase();
      
      return (
        (cat === "all" || p.category === cat) &&
        searchStr.includes(query) &&
        Number(p.price) <= effectiveMax
      );
    });
  }, [products, cat, q, effectiveMax]);

  const sortedAndFiltered = useMemo(() => {
    let list = [...filtered];
    if (sortBy === "cheapest") {
      list.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === "expensive") {
      list.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === "bestsellers") {
      list.sort((a, b) => Number(b.stock) - Number(a.stock));
    } else { // "newest"
      list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }
    return list;
  }, [filtered, sortBy]);

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
        <div className="flex flex-col sm:flex-row gap-2">
          <Input placeholder="ابحث عن منتج..." value={q} onChange={(e) => setQ(e.target.value)} className="sm:w-64" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-10 px-3 rounded-lg border border-input bg-background text-sm font-bold focus:outline-none focus:ring-2 focus:ring-gold"
          >
            <option value="newest">⏰ الأحدث</option>
            <option value="cheapest">📈 الأرخص</option>
            <option value="expensive">📉 الأغلى</option>
            <option value="bestsellers">🔥 الأكثر مبيعاً</option>
          </select>
        </div>
      </div>

      {/* Categories Horizontal Scroll Row */}
      <div className="flex flex-row overflow-x-auto whitespace-nowrap scrollbar-none gap-2 pb-3 mb-6 select-none max-w-full">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`px-5 py-2 rounded-full text-sm font-bold border shrink-0 transition ${
              cat === c ? "gradient-gold text-primary border-transparent shadow-md scale-105" : "hover:border-foreground/30 bg-card"
            }`}
          >
            {catAr(c)}
          </button>
        ))}
      </div>

      {/* Price Range Filter */}
      <div className="mb-8 rounded-2xl border bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <label className="text-sm font-semibold whitespace-nowrap">السعر الأقصى:</label>
        <input
          type="range" min={0} max={priceCap} step={50}
          value={effectiveMax}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="flex-1 accent-foreground"
        />
        <div className="text-sm font-bold text-gold min-w-24 text-center">
          حتى {effectiveMax} ج.م
        </div>
        {maxPrice != null && (
          <button onClick={() => setMaxPrice(null)} className="text-xs text-muted-foreground hover:text-foreground underline">
            إعادة تعيين
          </button>
        )}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => <ProductSkeleton key={i} />)
        ) : sortedAndFiltered.length === 0 ? (
          <div className="col-span-full text-center text-muted-foreground py-16">لا توجد نتائج</div>
        ) : (
          sortedAndFiltered.map((p) => (
            <ProductCard key={p.id} p={{
              ...p,
              discountedPrice: bestPercent > 0 ? Math.round(p.price * (1 - bestPercent / 100)) : null,
            }} />
          ))
        )}
      </div>
    </div>
  );
}
