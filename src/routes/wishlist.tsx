import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { ProductCard } from "@/components/ProductCard";
import { Heart } from "lucide-react";

export const Route = createFileRoute("/wishlist")({ component: WishlistPage });

function WishlistPage() {
  const { user } = useAuth();
  const { data: items, isLoading } = useQuery({
    queryKey: ["wishlist-page", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data: w } = await supabase.from("wishlist" as any).select("product_id").eq("user_id", user!.id);
      const ids = (w ?? []).map((r: any) => r.product_id);
      if (!ids.length) return [];
      const { data: p } = await supabase
        .from("products")
        .select("id,name,price,image_url,category,stock,variants,created_at")
        .in("id", ids);
      return (p ?? []).map((prod: any) => {
        const variants = Array.isArray(prod.variants) ? prod.variants : [];
        const secondary_image_url = variants.find((v: any) => v?.image_url && v.image_url !== prod.image_url)?.image_url ?? null;
        return { ...prod, secondary_image_url };
      });
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Heart className="size-6 text-red-500 fill-red-500" />
        <h1 className="font-serif text-3xl md:text-4xl font-bold">المفضلة</h1>
      </div>
      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground animate-pulse">جاري التحميل...</div>
      ) : !items || items.length === 0 ? (
        <div className="py-24 text-center">
          <Heart className="size-16 mx-auto mb-4 text-muted-foreground/40" />
          <p className="text-muted-foreground">مفيش منتجات في المفضلة لسه — اضغط على ❤️ على أي منتج علشان تحفظه هنا</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {items.map((p: any) => <ProductCard key={p.id} p={p} />)}
        </div>
      )}
    </div>
  );
}
