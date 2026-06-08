// Send OTP code via email (Resend) and store hashed in otp_codes table
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { email, purpose = "signup" } = await req.json();
    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Rate limit: max 3 codes per email in 5 minutes
    const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("otp_codes")
      .select("id", { count: "exact", head: true })
      .eq("email", email.toLowerCase())
      .gte("created_at", since);
    if ((count ?? 0) >= 3) {
      return new Response(JSON.stringify({ error: "تجاوزت عدد المحاولات، حاول بعد دقائق" }), {
        status: 429, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Invalidate previous unused codes for same email/purpose
    await supabase.from("otp_codes").update({ consumed: true })
      .eq("email", email.toLowerCase()).eq("purpose", purpose).eq("consumed", false);

    // Store new code
    const { error: insErr } = await supabase.from("otp_codes").insert({
      email: email.toLowerCase(),
      code,
      purpose,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });
    if (insErr) throw insErr;

    // Send email via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY missing - cannot send email");
      return new Response(JSON.stringify({
        error: "خدمة إرسال الإيميل غير مُفعّلة. تواصل مع الإدارة.",
      }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const html = `
      <div style="font-family: 'Cairo', Arial, sans-serif; max-width:480px; margin:0 auto; background:#fff; border-radius:16px; padding:32px; border:1px solid #eee;">
        <h1 style="color:#1a1a1a; font-size:24px; margin:0 0 8px;">رمز التحقق - Hedma</h1>
        <p style="color:#666; font-size:14px; margin:0 0 24px;">استخدم الرمز التالي لإتمام التسجيل في هدمة:</p>
        <div style="background:#000; color:#CCFF00; text-align:center; font-size:36px; font-weight:900; letter-spacing:8px; padding:24px; border-radius:12px; margin:16px 0;">
          ${code}
        </div>
        <p style="color:#888; font-size:12px; margin-top:24px;">الرمز صالح لمدة 10 دقائق. لو ما طلبتش الرمز ده، تجاهل الإيميل.</p>
        <p style="color:#aaa; font-size:11px; margin-top:16px;">© Hedma - هدمة</p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify({
        from: "Hedma <onboarding@resend.dev>",
        to: [email],
        subject: `رمز التحقق: ${code}`,
        html,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("Resend error:", data);
      return new Response(JSON.stringify({
        error: "ما قدرناش نبعت الإيميل: " + (data.message || "خطأ غير معروف"),
      }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-otp-email error:", e);
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
