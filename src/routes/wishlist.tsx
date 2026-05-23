import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { Heart, ShoppingBag } from "lucide-react";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "المفضلة — Hedma هدمة" },
      { name: "description", content: "تصفح ملابسك المفضلة التي قمت بحفظها في متجر هدمة للوصول السريع إليها." },
    ],
  }),
  component: Wishlist,
});

function Wishlist() {
  const [wishlistIds, setWishlistIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("hedma-wishlist") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleWishlistChange = () => {
      try {
        setWishlistIds(JSON.parse(localStorage.getItem("hedma-wishlist") || "[]"));
      } catch {
        setWishlistIds([]);
      }
    };

    window.addEventListener("wishlist-change", handleWishlistChange);
    window.addEventListener("storage", handleWishlistChange);
    return () => {
      window.removeEventListener("wishlist-change", handleWishlistChange);
      window.removeEventListener("storage", handleWishlistChange);
    };
  }, []);

  const { data: products, isLoading } = useQuery({
    queryKey: ["wishlist-products", wishlistIds],
    enabled: wishlistIds.length > 0,
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id,name,price,image_url,category,stock,created_at,secondary_image_url")
        .in("id", wishlistIds)
        .eq("active", true);
      return data ?? [];
    },
  });

  const displayProducts = wishlistIds.length > 0 ? (products ?? []) : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Heart className="size-8 text-red-500 fill-red-500" />
        <h1 className="font-display text-3xl md:text-4xl font-bold">المنتجات المفضلة</h1>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse flex flex-col gap-3">
              <div className="aspect-[4/5] rounded-3xl bg-muted" />
              <div className="h-5 bg-muted rounded-xl w-3/4" />
              <div className="h-4 bg-muted rounded-lg w-1/3" />
            </div>
          ))}
        </div>
      ) : displayProducts.length === 0 ? (
        <div className="rounded-3xl border bg-card p-16 text-center max-w-lg mx-auto">
          <Heart className="size-16 mx-auto mb-4 text-muted-foreground opacity-60" />
          <h2 className="font-display text-xl font-bold mb-2">قائمة المفضلة فارغة</h2>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            لم تقم بإضافة أي منتجات إلى المفضلة بعد. تصفح المتجر وأضف ما يعجبك بضغطة زر.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 gradient-gold text-primary font-bold px-6 py-3 rounded-xl shadow-luxe hover:opacity-90 transition"
          >
            <ShoppingBag className="size-4" /> تصفح المنتجات الآن
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 animate-fade-in">
          {displayProducts.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
