// Send messages/photos to Telegram from Claude Code
// Secrets: TG_BOT_TOKEN (from Supabase vault)
// ADMIN_CHAT_ID is hardcoded (not a secret — it's a user ID)

const TG_BOT = Deno.env.get("TG_BOT_TOKEN")!;
const ADMIN_CHAT_ID = 6817651166;
const AUTH_TOKEN = Deno.env.get("CLAUDE_TG_AUTH")!; // simple shared secret to prevent abuse

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function tgApi(method: string, body: Record<string, unknown>) {
  const res = await fetch(`https://api.telegram.org/bot${TG_BOT}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  // Auth check — Bearer token must match CLAUDE_TG_AUTH secret
  const auth = req.headers.get("authorization") || "";
  if (auth !== `Bearer ${AUTH_TOKEN}`) {
    return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { text, photo, caption } = body;

    let result;
    if (photo) {
      // Send photo (URL)
      result = await tgApi("sendPhoto", {
        chat_id: ADMIN_CHAT_ID,
        photo,
        caption: caption || "",
        parse_mode: "HTML",
      });
    } else if (text) {
      // Send text message
      result = await tgApi("sendMessage", {
        chat_id: ADMIN_CHAT_ID,
        text,
        parse_mode: "HTML",
      });
    } else {
      return new Response(
        JSON.stringify({ error: "Provide 'text' or 'photo'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, result }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
