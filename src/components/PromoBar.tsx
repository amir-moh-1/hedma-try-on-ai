import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function PromoBar() {
  const { data: settings } = useQuery({
    queryKey: ["site-settings"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("id", "main").maybeSingle();
      return data as any;
    },
  });

  if (settings?.marquee_visible === false) return null;

  const messages = settings?.marquee_text 
    ? [settings.marquee_text] 
    : [
        "🎉 عرض افتتاح: خصم 20% على أول أوردر — استخدم كود HEDMA20",
        "🚚 شحن سريع لكل محافظات مصر خلال 48 ساعة",
        "✨ جرّب اللبس عليك بالذكاء الاصطناعي قبل ما تشتري",
        "💬 لأي استفسار كلّمنا على واتساب على طول",
      ];
      
  const loop = [...messages, ...messages, ...messages, ...messages];
  
  return (
    <div className="relative overflow-hidden gradient-gold text-primary text-xs md:text-sm font-semibold">
      <div className="flex whitespace-nowrap animate-marquee py-2">
        {loop.map((m, i) => (
          <span key={i} className="px-8 shrink-0">{m}</span>
        ))}
      </div>
    </div>
  );
}
