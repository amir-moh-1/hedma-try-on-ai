// Idempotent bootstrap: creates admin Hooka17 + 10 vendors. Safe to call repeatedly.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN = { username: "Hooka17", password: "Hij@kam16", role: "admin" as const };
const VENDORS = Array.from({ length: 10 }, (_, i) => ({
  username: `vendor${i + 1}`,
  password: `Vendor@${1000 + i + 1}`,
  role: "vendor" as const,
}));

const emailFor = (u: string) => `${u.toLowerCase()}@hedma.local`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const all = [ADMIN, ...VENDORS];
    const out: { username: string; password: string; role: string; status: string }[] = [];

    for (const u of all) {
      const email = emailFor(u.username);
      const { data: existing } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
      const found = existing?.users.find((x) => x.email === email);
      let userId = found?.id;
      let status = "exists";

      if (!found) {
        const { data, error } = await supabase.auth.admin.createUser({
          email,
          password: u.password,
          email_confirm: true,
          user_metadata: { username: u.username, full_name: u.username },
        });
        if (error) {
          out.push({ ...u, status: `error: ${error.message}` });
          continue;
        }
        userId = data.user!.id;
        status = "created";
      }

      // Ensure profile (in case trigger missed)
      await supabase.from("profiles").upsert({ id: userId!, username: u.username }, { onConflict: "id" });
      // Set the requested role (in addition to default 'customer' added by trigger)
      await supabase.from("user_roles").upsert(
        { user_id: userId!, role: u.role },
        { onConflict: "user_id,role" },
      );
      out.push({ ...u, status });
    }

    return new Response(JSON.stringify({ ok: true, users: out }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
