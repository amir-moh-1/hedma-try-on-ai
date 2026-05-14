import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatEGP } from "@/lib/format";
import { MapPin, ShoppingBag, X } from "lucide-react";
import { useLocation } from "@tanstack/react-router";

// List of random Egyptian cities for fallback
const CITIES = [
  "التل الكبير", "القاهرة", "الإسكندرية", "المنصورة", "طنطا", 
  "الإسماعيلية", "الزقازيق", "بورسعيد", "السويس", "بنها"
];

export function SocialProofPopup() {
  const [visible, setVisible] = useState(false);
  const [data, setData] = useState<{ name: string; city: string; price: number; image?: string } | null>(null);
  const location = useLocation();

  useEffect(() => {
    // Only show on product or products pages (or index)
    if (location.pathname.includes("/admin") || location.pathname.includes("/vendor") || location.pathname.includes("/auth")) {
      return;
    }

    const fetchRandomPurchase = async () => {
      try {
        // Try to get a real recent order item
        const { data: orders } = await supabase
          .from("orders")
          .select("items, customer_address")
          .order("created_at", { ascending: false })
          .limit(10);

        let itemData = null;
        
        if (orders && orders.length > 0) {
          // Pick a random order
          const randomOrder = orders[Math.floor(Math.random() * orders.length)];
          const items = randomOrder.items as any[];
          
          if (items && items.length > 0) {
            const randomItem = items[Math.floor(Math.random() * items.length)];
            
            // Extract city from address if possible, otherwise use fallback
            let city = CITIES[Math.floor(Math.random() * CITIES.length)];
            if (randomOrder.customer_address) {
              const match = CITIES.find(c => randomOrder.customer_address!.includes(c));
              if (match) city = match;
            }

            itemData = {
              name: randomItem.name,
              price: randomItem.price,
              city,
              image: randomItem.image
            };
          }
        }

        // If no orders yet, use fallback data
        if (!itemData) {
          const { data: products } = await supabase
            .from("products")
            .select("name, price, image_url")
            .eq("active", true)
            .limit(20);
            
          if (products && products.length > 0) {
            const randomProduct = products[Math.floor(Math.random() * products.length)];
            itemData = {
              name: randomProduct.name,
              price: randomProduct.price,
              city: CITIES[Math.floor(Math.random() * CITIES.length)],
              image: randomProduct.image_url
            };
          }
        }

        if (itemData) {
          setData(itemData);
          setVisible(true);
          
          // Hide after 5 seconds
          setTimeout(() => {
            setVisible(false);
          }, 5000);
        }
      } catch (err) {
        console.error("Social proof error", err);
      }
    };

    // Show popup every 30-45 seconds
    const intervalId = setInterval(() => {
      fetchRandomPurchase();
    }, Math.floor(Math.random() * 15000) + 30000);

    // Initial delay before showing the first one
    const timeoutId = setTimeout(() => {
      fetchRandomPurchase();
    }, 10000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
    };
  }, [location.pathname]);

  if (!visible || !data) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-500 max-w-sm w-full md:w-auto" dir="rtl">
      <div className="rounded-2xl border bg-background/95 backdrop-blur-md p-3 shadow-luxe flex gap-3 items-center relative overflow-hidden group">
        <button 
          onClick={() => setVisible(false)}
          className="absolute top-2 left-2 size-5 grid place-items-center rounded-full bg-muted/50 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="size-3" />
        </button>
        
        <div className="size-14 rounded-lg bg-muted overflow-hidden shrink-0 border">
          {data.image ? (
            <img src={data.image} alt="" className="size-full object-cover" loading="lazy" />
          ) : (
            <div className="size-full grid place-items-center text-muted-foreground"><ShoppingBag className="size-6" /></div>
          )}
        </div>
        
        <div className="flex-1 min-w-0 pr-1">
          <div className="text-xs text-muted-foreground flex items-center gap-1 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse inline-block"></span>
            شخص من <span className="font-bold text-foreground">{data.city}</span> اشترى الآن
          </div>
          <div className="font-semibold text-sm line-clamp-1">{data.name}</div>
          <div className="text-xs font-bold text-gold-gradient mt-0.5">{formatEGP(data.price)}</div>
        </div>
      </div>
    </div>
  );
}
