// AI Virtual Try-On using Lovable AI (Nano Banana / Gemini image edit)
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const { personImage, garmentImage, garmentName } = await req.json();
    if (!personImage || !garmentImage) {
      return new Response(JSON.stringify({ error: "personImage and garmentImage required" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY missing" }), {
        status: 500, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const prompt = `Take the person from the first image and dress them realistically in the clothing item shown in the second image (${garmentName || "garment"}). Keep the person's face, body shape, pose, and background unchanged. The clothing should fit naturally with realistic fabric, lighting, and shadows. Output a single photorealistic image.`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        modalities: ["image", "text"],
        messages: [{
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: personImage } },
            { type: "image_url", image_url: { url: garmentImage } },
          ],
        }],
      }),
    });

    if (r.status === 429) return new Response(JSON.stringify({ error: "Rate limit. Try again shortly." }), { status: 429, headers: { ...cors, "Content-Type": "application/json" } });
    if (r.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Settings → Workspace → Usage." }), { status: 402, headers: { ...cors, "Content-Type": "application/json" } });
    if (!r.ok) {
      const t = await r.text();
      return new Response(JSON.stringify({ error: `AI gateway error: ${t}` }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const data = await r.json();
    const img = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!img) return new Response(JSON.stringify({ error: "No image returned" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
    return new Response(JSON.stringify({ image: img }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
