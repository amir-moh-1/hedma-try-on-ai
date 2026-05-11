import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function CustomerPhotosGrid({ limit }: { limit?: number }) {
  const { data: photos } = useQuery({
    queryKey: ["customer-photos", limit],
    queryFn: async () => {
      let q = supabase
        .from("customer_photos")
        .select("id,image_url,caption,user_id,created_at")
        .eq("approved", true)
        .order("created_at", { ascending: false });
      if (limit) q = q.limit(limit);
      const { data } = await q;
      const ids = Array.from(new Set((data ?? []).map((r) => r.user_id)));
      const { data: profs } = ids.length
        ? await supabase.from("profiles").select("id,username").in("id", ids)
        : { data: [] };
      const m = new Map((profs ?? []).map((p) => [p.id, p.username]));
      return (data ?? []).map((p) => ({ ...p, username: m.get(p.user_id) ?? "عميل" }));
    },
  });

  if (!photos || photos.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12">
      <div className="text-center mb-6">
        <h2 className="font-display text-3xl md:text-4xl font-bold">
          زبايننا بيلبسوا <span className="text-gold-gradient">هدمة</span>
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">
          صور حقيقية من عملائنا. عايز صورتك هنا؟ ارفعها من حسابك.
        </p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {photos.map((p) => (
          <div key={p.id} className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-muted group">
            <img src={p.image_url} alt={p.caption ?? p.username} className="size-full object-cover group-hover:scale-105 transition duration-700" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition" />
            <div className="absolute bottom-0 right-0 left-0 p-3 text-white opacity-0 group-hover:opacity-100 transition">
              <div className="text-sm font-bold">{p.username}</div>
              {p.caption && <div className="text-xs">{p.caption}</div>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
