import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, code } = await req.json();
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") || "IMTIYO <onboarding@resend.dev>";

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ ok: false, error: "Missing RESEND_API_KEY" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [email],
        subject: `IMTIYO — Tasdiqlash kodingiz: ${code}`,
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:16px;">
            <h2 style="color:#002D96;margin-bottom:8px;">IMTIYO platformasi</h2>
            <p style="color:#475569;font-size:14px;">Ro‘yxatdan o‘tishni yakunlash uchun 6 xonali tasdiqlash kodingiz:</p>
            <div style="background:#F5F8FF;padding:16px;border-radius:12px;text-align:center;font-size:28px;font-weight:800;letter-spacing:6px;color:#002D96;margin:16px 0;">
              ${code}
            </div>
            <p style="color:#94a3b8;font-size:12px;">Kod 10 daqiqa davomida amal qiladi.</p>
          </div>
        `,
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify({ ok: res.ok, data }), {
      status: res.ok ? 200 : 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});