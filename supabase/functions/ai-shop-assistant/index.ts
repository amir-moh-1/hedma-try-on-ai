// AI Shopping Assistant — parses Arabic queries, searches products, returns suggestions.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `أنت مساعد تسوق ذكي لمتجر "هدمة" (Hedma) للملابس في مصر.
مهمتك: تفهم طلب العميل بالعامية المصرية وتستخرج فلاتر البحث (الفئة، الميزانية القصوى، اللون، المقاس) ثم تقترح منتجات.
لازم تستدعي الـ tool "search_products" مرة واحدة على الأقل، بعدها ترد رد ودي قصير (سطرين كحد أقصى) يوصف المنتجات الي لقيتها.
الفئات المتاحة: men (رجالي), women (نسائي), kids (أطفال), accessories (إكسسوارات).
ترجم الفئات من العامية: "هدية لأمي" => women, "لأبويا" => men, "لابني/بنتي" => kids.
لو الطلب ميخصش ملابس، رد بأدب إن خدمتك للملابس بس.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableKey) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const tools = [{
      type: "function",
      function: {
        name: "search_products",
        description: "ابحث في كتالوج منتجات هدمة. كل البارامترات اختيارية.",
        parameters: {
          type: "object",
          properties: {
            category: { type: "string", enum: ["men", "women", "kids", "accessories"] },
            max_price: { type: "number", description: "أقصى سعر بالجنيه" },
            min_price: { type: "number" },
            color_keyword: { type: "string", description: "اللون المطلوب بالعربي أو الإنجليزي" },
            size: { type: "string", description: "المقاس مثلاً S, M, L, XL, 40" },
            keyword: { type: "string", description: "كلمة مفتاحية في اسم المنتج" },
          },
        },
      },
    }];

    // Call Lovable AI Gateway (OpenAI-compatible)
    const aiCall = async (msgs: any[]) => {
      const ctl = new AbortController();
      const timeout = setTimeout(() => ctl.abort(), 25000);
      try {
        const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          signal: ctl.signal,
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${lovableKey}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: msgs,
            tools,
          }),
        });
        clearTimeout(timeout);
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 429) throw new Error("الخدمة مزدحمة، حاول بعد لحظات");
          if (res.status === 402) throw new Error("انتهى رصيد المساعد الذكي");
          throw new Error(data.error?.message || "AI error");
        }
        return data;
      } finally {
        clearTimeout(timeout);
      }
    };

    const convo: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.slice(-10),
    ];

    let response = await aiCall(convo);
    let products: any[] = [];

    // Handle tool calls (one round)
    const toolCalls = response.choices?.[0]?.message?.tool_calls;
    if (toolCalls?.length) {
      convo.push(response.choices[0].message);
      for (const tc of toolCalls) {
        if (tc.function?.name === "search_products") {
          const args = JSON.parse(tc.function.arguments || "{}");
          let q = supabase.from("products")
            .select("id,name,price,category,image_url,colors,sizes,stock")
            .eq("active", true)
            .gt("stock", 0)
            .limit(8);
          if (args.category) q = q.eq("category", args.category);
          if (args.max_price) q = q.lte("price", args.max_price);
          if (args.min_price) q = q.gte("price", args.min_price);
          if (args.keyword) q = q.ilike("name", `%${args.keyword}%`);
          const { data: prods } = await q;
          let result = prods ?? [];
          if (args.color_keyword) {
            const k = String(args.color_keyword).toLowerCase();
            result = result.filter((p: any) => 
              (p.colors ?? []).some((c: any) => 
                String(c?.name ?? c).toLowerCase().includes(k)
              )
            );
          }
          if (args.size) {
            result = result.filter((p: any) => (p.sizes ?? []).includes(args.size));
          }
          products = result.slice(0, 6);
          convo.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify({
              count: products.length,
              products: products.map(p => ({ id: p.id, name: p.name, price: p.price })),
            }),
          });
        }
      }
      response = await aiCall(convo);
    }

    const reply = response.choices?.[0]?.message?.content || "لقيت لك دي، عجبتك حاجة؟";

    return new Response(JSON.stringify({ reply, products }), {
      status: 200, headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("ai-shop-assistant error:", e);
    return new Response(JSON.stringify({ error: e?.message || String(e) }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
