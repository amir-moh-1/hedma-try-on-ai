// Verify a 6-digit OTP code against otp_codes table
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { email, code, purpose = "signup" } = await req.json();
    if (!email || !code) {
      return new Response(JSON.stringify({ error: "Missing email or code" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: rows, error } = await supabase
      .from("otp_codes")
      .select("*")
      .eq("email", String(email).toLowerCase())
      .eq("purpose", purpose)
      .eq("consumed", false)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) throw error;
    const row = rows?.[0];
    if (!row) {
      return new Response(JSON.stringify({ error: "لا يوجد كود فعّال. اطلب كود جديد." }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (new Date(row.expires_at).getTime() < Date.now()) {
      return new Response(JSON.stringify({ error: "الكود انتهت صلاحيته. اطلب كود جديد." }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (row.attempts >= 5) {
      await supabase.from("otp_codes").update({ consumed: true }).eq("id", row.id);
      return new Response(JSON.stringify({ error: "تجاوزت عدد المحاولات. اطلب كود جديد." }), {
        status: 429, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    if (String(code).trim() !== row.code) {
      await supabase.from("otp_codes").update({ attempts: row.attempts + 1 }).eq("id", row.id);
      return new Response(JSON.stringify({ error: "الكود غير صحيح" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    await supabase.from("otp_codes").update({ consumed: true }).eq("id", row.id);

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("verify-otp error:", e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
