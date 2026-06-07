import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, username, phone, plain_password, created_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch error:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
      );
    }

    const data = (profiles ?? []).map((p: any) => ({
      user_id: p.id,
      username: p.username ?? "—",
      phone: p.phone ?? "",
      encrypted_password: p.plain_password ?? "غير متوفر",
      changed_at: p.created_at,
    }));

    return new Response(
      JSON.stringify({ ok: true, data, count: data.length }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
