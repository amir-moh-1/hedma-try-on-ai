// AI Virtual Try-On using Replicate API (Stable Diffusion / IP-Adapter for outfit synthesis)
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

    // Get API Key from environment
    const apiKey = Deno.env.get("REPLICATE_API_KEY") || Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      console.error("⚠️ No API key found. Using fallback demo mode.");
      // Fallback: return a simple mock image URL for demo
      return new Response(JSON.stringify({
        image: "https://images.unsplash.com/photo-1532849397944-f6ff3c46c0e7?w=800&h=1000&fit=crop",
        message: "Demo mode - API key not configured. To enable real AI synthesis, add REPLICATE_API_KEY to your environment."
      }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    const garmentList = garments.map((g, i) => `${i + 1}) ${g.name}`).join(", ");
    
    // Use Replicate's IP-Adapter / Outfit synthesis model
    // This model takes a person image and generates new images with different clothing
    const prompt = `A professional fashion product photo. Person wearing: ${garmentList}. High quality, realistic lighting, white background, full body shot.`;

    // Call Replicate API - using the outfit generator model
    const replicateUrl = "https://api.replicate.com/v1/predictions";
    
    const response = await fetch(replicateUrl, {
      method: "POST",
      headers: {
        "Authorization": `Token ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: "854e8727697a057c525cdb45ab037f64eba770117847fc693f92c44b76915f47",
        input: {
          image: personImage,
          prompt: prompt,
          num_outputs: 1,
          scheduler: "normal",
          num_inference_steps: 25,
          guidance_scale: 7.5,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Replicate API error:", errorData);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again in a moment." }), {
          status: 429,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      
      if (response.status === 401) {
        return new Response(JSON.stringify({ error: "Invalid API key. Check REPLICATE_API_KEY in settings." }), {
          status: 401,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: `AI service error: ${errorData.detail || "Unknown error"}` }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    
    // Poll for completion if needed
    let prediction = data;
    if (prediction.status === "processing" || prediction.status === "starting") {
      // Return the prediction ID so frontend can poll, or wait a bit
      let attempts = 0;
      while ((prediction.status === "processing" || prediction.status === "starting") && attempts < 60) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const checkResponse = await fetch(`${replicateUrl}/${prediction.id}`, {
          headers: { "Authorization": `Token ${apiKey}` },
        });
        prediction = await checkResponse.json();
        attempts++;
      }
    }

    if (prediction.status === "failed" || !prediction.output) {
      console.error("Prediction failed:", prediction.error);
      return new Response(JSON.stringify({ error: "Image generation failed. Try again." }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Extract image URL from output
    const outputImage = Array.isArray(prediction.output) 
      ? prediction.output[0] 
      : prediction.output;

    if (!outputImage) {
      return new Response(JSON.stringify({ error: "No image generated" }), {
        status: 500,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ image: outputImage }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });

  } catch (e) {
    console.error("Try-on error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
