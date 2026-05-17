import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingBag, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

export function SocialProofPopup() {
  const [visible, setVisible] = useState(false);
  const [currentOrder, setCurrentOrder] = useState<any>(null);

  const { data: settings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("id", "main").maybeSingle();
      return data as any;
    },
  });

  const { data: realOrders } = useQuery({
    queryKey: ["recent-orders-social"],
    enabled: !!settings?.social_proof_real_data,
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("customer_name, customer_address, created_at").order("created_at", { ascending: false }).limit(10);
      return data;
    },
  });

  const mockData = [
    { customer_name: "أحمد م.", customer_address: "القاهرة", created_at: new Date().toISOString() },
    { customer_name: "سارة خ.", customer_address: "الإسكندرية", created_at: new Date().toISOString() },
    { customer_name: "محمد ع.", customer_address: "المنصورة", created_at: new Date().toISOString() },
    { customer_name: "ليلى س.", customer_address: "الجيزة", created_at: new Date().toISOString() },
  ];

  useEffect(() => {
    if (settings?.social_proof_enabled === false) return;

    const interval = setInterval(() => {
      if (!visible) {
        const source = settings?.social_proof_real_data && realOrders?.length ? realOrders : mockData;
        const random = source[Math.floor(Math.random() * source.length)];
        setCurrentOrder(random);
        setVisible(true);
        
        setTimeout(() => setVisible(false), 5000);
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [settings, realOrders, visible]);

  if (!currentOrder || !visible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 animate-in slide-in-from-left-10 duration-500">
      <div className="bg-card border shadow-luxe rounded-2xl p-4 flex items-center gap-4 min-w-[280px] relative">
        <button 
          onClick={() => setVisible(false)}
          className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
        >
          <X className="size-3" />
        </button>
        <div className="size-12 rounded-xl bg-gold-gradient grid place-items-center shrink-0">
          <ShoppingBag className="size-6 text-primary" />
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-0.5">طلب جديد!</div>
          <div className="text-sm font-bold">اشترى {currentOrder.customer_name}</div>
          <div className="text-[10px] text-muted-foreground">من {currentOrder.customer_address} • {formatDistanceToNow(new Date(currentOrder.created_at), { addSuffix: true, locale: ar })}</div>
        </div>
      </div>
    </div>
  );
}
