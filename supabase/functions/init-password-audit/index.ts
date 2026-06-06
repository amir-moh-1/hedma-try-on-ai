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

    // Check if table exists
    const { data: tables } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "password_audit_log");

    if (!tables || tables.length === 0) {
      // Create the table
      const { error: createError } = await supabase.rpc("create_password_audit_table", {});
      
      if (createError && !createError.message.includes("already exists")) {
        console.error("Create error:", createError);
      }
    }

    return new Response(
      JSON.stringify({ ok: true, message: "Password audit system initialized" }),
      { headers: { ...cors, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Init error:", error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }
});
