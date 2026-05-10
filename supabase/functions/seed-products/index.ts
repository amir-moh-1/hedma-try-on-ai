// Seed 12 demo products, distributed across the admin and the first 3 vendors. Idempotent.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ITEMS = [
  { name: "تيشيرت كلاسيك أبيض", description: "قطن مصري 100% مريح للاستخدام اليومي.", price: 350, category: "tshirts", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800", sizes: ["S","M","L","XL"], colors: ["أبيض","أسود"], stock: 25 },
  { name: "تيشيرت أوفر سايز", description: "تصميم عصري واسع.", price: 420, category: "tshirts", image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800", sizes: ["M","L","XL"], colors: ["أسود","رمادي"], stock: 18 },
  { name: "بنطلون جينز سليم", description: "جينز أزرق غامق بقصة سليم.", price: 950, category: "pants", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800", sizes: ["30","32","34","36"], colors: ["أزرق غامق"], stock: 12 },
  { name: "بنطلون كارجو", description: "بنطلون كارجو متعدد الجيوب.", price: 880, category: "pants", image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800", sizes: ["M","L","XL"], colors: ["زيتي","بيج"], stock: 14 },
  { name: "كوتشي رياضي أبيض", description: "خفيف ومريح للجري والمشي.", price: 1450, category: "shoes", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800", sizes: ["41","42","43","44"], colors: ["أبيض/أحمر"], stock: 8 },
  { name: "كوتشي شيك أسود", description: "لمظهر أنيق ورياضي.", price: 1690, category: "shoes", image: "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800", sizes: ["41","42","43"], colors: ["أسود"], stock: 6 },
  { name: "هودي شتوي", description: "هودي ثقيل بطبعة بسيطة.", price: 850, category: "hoodies", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800", sizes: ["M","L","XL"], colors: ["كحلي","أسود"], stock: 20 },
  { name: "جاكيت دنيم", description: "جاكيت جينز كلاسيك.", price: 1250, category: "jackets", image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800", sizes: ["M","L","XL"], colors: ["أزرق"], stock: 9 },
  { name: "شورت رياضي", description: "خامة قطنية ناعمة.", price: 320, category: "shorts", image: "https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800", sizes: ["M","L","XL"], colors: ["أسود","رمادي"], stock: 22 },
  { name: "قميص رسمي", description: "قميص قطن مكوي للمناسبات.", price: 720, category: "shirts", image: "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800", sizes: ["M","L","XL"], colors: ["أبيض","سماوي"], stock: 15 },
  { name: "كاب أنيق", description: "كاب بتطريز Hedma.", price: 220, category: "accessories", image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800", sizes: ["مقاس واحد"], colors: ["أسود","بيج"], stock: 30 },
  { name: "حزام جلد طبيعي", description: "حزام جلد فاخر.", price: 480, category: "accessories", image: "https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=800", sizes: ["M","L"], colors: ["بني","أسود"], stock: 17 },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { count } = await supabase.from("products").select("*", { count: "exact", head: true });
    if ((count ?? 0) > 0) {
      return new Response(JSON.stringify({ ok: true, skipped: true, message: "products already seeded" }), { headers: { ...cors, "Content-Type": "application/json" } });
    }
    // Get vendor ids: admin + first 3 vendors
    const usernames = ["Hooka17", "vendor1", "vendor2", "vendor3"];
    const { data: profs } = await supabase.from("profiles").select("id, username").in("username", usernames);
    if (!profs || profs.length === 0) {
      return new Response(JSON.stringify({ error: "No bootstrap users found. Call bootstrap-users first." }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }
    const ids = profs.map(p => p.id);
    const rows = ITEMS.map((it, i) => ({
      vendor_id: ids[i % ids.length],
      name: it.name,
      description: it.description,
      price: it.price,
      category: it.category,
      location: "القاهرة - وسط البلد",
      sizes: it.sizes,
      colors: it.colors,
      stock: it.stock,
      image_url: it.image,
      active: true,
    }));
    const { error } = await supabase.from("products").insert(rows);
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
    return new Response(JSON.stringify({ ok: true, inserted: rows.length }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
