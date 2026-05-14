import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "./ProductCard";
import { useState } from "react";
import { Button } from "./ui/button";
import { ShoppingBag, CheckCircle2, Plus } from "lucide-react";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

export function RelatedProducts({ currentProductId, currentCategory, vendorId }: { currentProductId: string, currentCategory: string, vendorId: string }) {
  const { add } = useCart();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { data: products } = useQuery({
    queryKey: ["related-products", currentProductId, vendorId],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .eq("vendor_id", vendorId)
        .neq("id", currentProductId)
        .order("created_at", { ascending: false })
        .limit(10);
        
      if (!data) return [];
      
      const differentCat = data.filter(p => p.category !== currentCategory);
      const sameCat = data.filter(p => p.category === currentCategory);
      
      return [...differentCat, ...sameCat].slice(0, 4);
    },
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const addSelected = () => {
    if (selectedIds.length === 0) return;
    const selectedProducts = products?.filter(p => selectedIds.includes(p.id)) || [];
    selectedProducts.forEach(p => {
      add({ id: p.id, name: p.name, price: p.price, image: p.image_url ?? undefined });
    });
    toast.success(`تمت إضافة ${selectedIds.length} قطع إلى السلة بنجاح ✨`);
    setSelectedIds([]);
  };

  if (!products || products.length === 0) return null;

  return (
    <div className="mt-16 border-t pt-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="font-display text-3xl font-black">أكمل أناقتك</h2>
          <p className="text-sm text-muted-foreground mt-1 font-semibold">قطع مختارة تليق بذوقك الرفيع</p>
        </div>
        {selectedIds.length > 0 && (
          <Button onClick={addSelected} className="gradient-gold text-primary shadow-luxe font-black rounded-xl h-12 px-8 scale-105 transition-transform">
            <Plus className="size-5 ml-2" /> إضافة المختار ({selectedIds.length}) للسلة
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {products.map((p) => {
          const isSelected = selectedIds.includes(p.id);
          return (
            <div key={p.id} className="relative group">
              <div 
                onClick={() => toggleSelect(p.id)}
                className={`absolute top-3 right-3 z-10 size-8 rounded-xl border-2 cursor-pointer transition-all duration-300 flex items-center justify-center
                  ${isSelected ? "bg-gold-gradient border-transparent shadow-lg scale-110" : "bg-card/80 border-gold-gradient/20 hover:border-gold-gradient opacity-0 group-hover:opacity-100"}`}
              >
                {isSelected ? <CheckCircle2 className="size-5 text-primary" /> : <Plus className="size-5 text-gold-gradient" />}
              </div>
              <div className={`${isSelected ? "ring-2 ring-gold-gradient ring-offset-4 rounded-3xl" : ""} transition-all duration-300`}>
                <ProductCard p={p} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
