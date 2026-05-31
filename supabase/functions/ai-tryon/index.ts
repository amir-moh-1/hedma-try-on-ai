// AI Virtual Try-On using Lovable AI (Nano Banana / Gemini image edit)
// Supports multiple garments combined onto one person.
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type Garment = { name: string; image: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const body = await req.json();
    const personImage: string | undefined = body.personImage;
    // Backwards compat: single garmentImage/garmentName OR new garments[]
    let garments: Garment[] = body.garments ?? [];
    if ((!garments || garments.length === 0) && body.garmentImage) {
      garments = [{ name: body.garmentName ?? "garment", image: body.garmentImage }];
    }
    if (!personImage || garments.length === 0) {
      return new Response(JSON.stringify({ error: "personImage and at least one garment required" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const garmentList = garments.map((g, i) => `${i + 2}) ${g.name}`).join("\n");
    const prompt = `Photo 1 is the person. The remaining photos are clothing items to dress the person in:
${garmentList}

Combine ALL the garments naturally on the same person in a single output image. Layer them realistically (e.g. shirt under jacket, belt over pants). Keep the person's face, body shape, pose, and background unchanged. Use realistic fabric, lighting, and shadows. Output a single photorealistic image.`;

    const content: Array<{ type: string; text?: string; image_url?: { url: string } }> = [
      { type: "text", text: prompt },
      { type: "image_url", image_url: { url: personImage } },
      ...garments.map((g) => ({ type: "image_url" as const, image_url: { url: g.image } })),
    ];

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        modalities: ["image", "text"],
        messages: [{ role: "user", content }],
      }),
    });

    if (r.status === 429) return new Response(JSON.stringify({ error: "Rate limit. Try again shortly." }), { status: 429, headers: { ...cors, "Content-Type": "application/json" } });
    if (r.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }), { status: 402, headers: { ...cors, "Content-Type": "application/json" } });
    if (!r.ok) {
      const t = await r.text();
      return new Response(JSON.stringify({ error: `AI gateway error: ${t}` }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const data = await r.json();
    let img = data.choices?.[0]?.message?.images?.[0]?.image_url?.url || 
              (data.choices?.[0]?.message?.content && Array.isArray(data.choices[0].message.content) && 
               data.choices[0].message.content.find(c => c.type === "image_url" || c.image_url)?.image_url?.url) ||
              data.choices?.[0]?.message?.content ||
              data.images?.[0]?.url ||
              data.images?.[0]?.image_url?.url;
    
    if (typeof img === "object" && img !== null) {
      img = img.url || img.image_url?.url;
    }
    
    if (!img) return new Response(JSON.stringify({ error: "No image returned" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
    return new Response(JSON.stringify({ image: img }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
