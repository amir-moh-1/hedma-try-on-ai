import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "./ProductCard";

export function RelatedProducts({ currentProductId, currentCategory, vendorId }: { currentProductId: string, currentCategory: string, vendorId: string }) {
  const { data: products } = useQuery({
    queryKey: ["related-products", currentProductId, vendorId],
    queryFn: async () => {
      // Find products from the same vendor but ideally different categories for "Complete Your Look"
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .eq("vendor_id", vendorId)
        .neq("id", currentProductId)
        .order("created_at", { ascending: false })
        .limit(10);
        
      if (!data) return [];
      
      // Try to prioritize different categories first
      const differentCat = data.filter(p => p.category !== currentCategory);
      const sameCat = data.filter(p => p.category === currentCategory);
      
      return [...differentCat, ...sameCat].slice(0, 4);
    },
  });

  if (!products || products.length === 0) return null;

  return (
    <div className="mt-16 border-t pt-10">
      <h2 className="font-display text-2xl font-bold mb-6 text-center">أكمل أناقتك</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} p={p} />
        ))}
      </div>
    </div>
  );
}
