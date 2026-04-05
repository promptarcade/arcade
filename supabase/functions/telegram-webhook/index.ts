import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const TG_BOT = Deno.env.get("TG_BOT_TOKEN")!;
const SUPA_URL = Deno.env.get("SUPABASE_URL")!;
const SUPA_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ADMIN_CHAT_ID = 6817651166;

const supabase = createClient(SUPA_URL, SUPA_KEY);

async function tgApi(method: string, body: Record<string, unknown>) {
  await fetch(`https://api.telegram.org/bot${TG_BOT}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function reply(chatId: number, text: string) {
  await tgApi("sendMessage", { chat_id: chatId, text, parse_mode: "HTML" });
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "apikey, authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("OK", { status: 200, headers: corsHeaders });
  }

  try {
    const update = await req.json();

    // Handle suggestion notification from website
    if (update.notify && update.suggestion) {
      const s = update.suggestion;
      const typeEmoji: Record<string, string> = { suggestion: "\uD83D\uDCA1", improvement: "\u2B50", bug: "\uD83D\uDC1B" };
      await tgApi("sendMessage", {
        chat_id: ADMIN_CHAT_ID,
        text: `${typeEmoji[s.type] || ""} New ${s.type}\nGame: ${s.game}\n\n${s.message}\n\nID: ${s.id}`,
        reply_markup: {
          inline_keyboard: [[
            { text: "\u2705 Approve", callback_data: `approve:${s.id}` },
            { text: "\u274C Reject", callback_data: `reject:${s.id}` },
          ]]
        }
      });
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    // Handle callback queries (Approve/Reject suggestion buttons)
    if (update.callback_query) {
      const cb = update.callback_query;
      const [action, sid] = (cb.data || "").split(":");

      if ((action === "approve" || action === "reject") && sid) {
        const newStatus = action === "approve" ? "approved" : "rejected";

        const { error } = await supabase
          .from("suggestions")
          .update({ status: newStatus })
          .eq("id", sid);

        if (error) {
          await tgApi("answerCallbackQuery", {
            callback_query_id: cb.id,
            text: `Error: ${error.message}`,
          });
        } else {
          await tgApi("answerCallbackQuery", {
            callback_query_id: cb.id,
            text: action === "approve" ? "Approved!" : "Rejected.",
          });
          const emoji = action === "approve" ? "\u2705" : "\u274C";
          const label = action === "approve" ? "APPROVED" : "REJECTED";
          await tgApi("editMessageText", {
            chat_id: cb.message.chat.id,
            message_id: cb.message.message_id,
            text: `${cb.message.text}\n\n${emoji} ${label}`,
          });
        }
      }
    }

    // Handle text messages (commands)
    if (update.message && update.message.text) {
      const chatId = update.message.chat.id;
      const text = update.message.text.trim();

      // Only accept commands from admin
      if (chatId !== ADMIN_CHAT_ID) {
        await reply(chatId, "Sorry, this bot only accepts commands from the admin.");
        return new Response("OK", { status: 200, headers: corsHeaders });
      }

      // /build <description> — queue a new game
      if (text.startsWith("/build ")) {
        const description = text.slice(7).trim();
        if (description.length < 5) {
          await reply(chatId, "\u274C Please provide a description.\n\nExample: <code>/build Space racing game with power-ups and AI opponents</code>");
          return new Response("OK", { status: 200, headers: corsHeaders });
        }

        const { data, error } = await supabase
          .from("game_requests")
          .insert({ description })
          .select()
          .single();

        if (error) {
          await reply(chatId, `\u274C Error: ${error.message}`);
        } else {
          await reply(chatId, `\u2705 <b>Game request queued!</b>\n\n<b>ID:</b> ${data.id.slice(0, 8)}\n<b>Description:</b> ${description}\n\nOpen Claude Code and say: <code>check for game requests</code>`);
        }
      }

      // /status — show pending requests
      else if (text === "/status") {
        const { data, error } = await supabase
          .from("game_requests")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(10);

        if (error) {
          await reply(chatId, `\u274C Error: ${error.message}`);
        } else if (!data || data.length === 0) {
          await reply(chatId, "\uD83D\uDCED No game requests found.");
        } else {
          const lines = data.map((r: any) => {
            const status = r.status === "pending" ? "\u23F3" : r.status === "building" ? "\uD83D\uDD28" : r.status === "published" ? "\u2705" : "\u274C";
            const name = r.game_name ? ` (<b>${r.game_name}</b>)` : "";
            return `${status} ${r.description.slice(0, 60)}${name}\n   <i>${r.status}</i> — ${new Date(r.created_at).toLocaleDateString()}`;
          });
          await reply(chatId, `<b>Game Requests:</b>\n\n${lines.join("\n\n")}`);
        }
      }

      // /cancel <id prefix> — cancel a pending request
      else if (text.startsWith("/cancel ")) {
        const idPrefix = text.slice(8).trim();
        const { data } = await supabase.rpc("find_game_request_by_prefix", { prefix: idPrefix });
        const match = Array.isArray(data) ? data[0] : data;
        if (match && match.status === "pending") {
          await supabase.from("game_requests").update({ status: "rejected" }).eq("id", match.id);
          await reply(chatId, `\u274C Cancelled: ${match.description.slice(0, 60)}`);
        } else {
          await reply(chatId, `\u274C No pending request found matching "${idPrefix}"`);
        }
      }

      // /suggestions — show pending community suggestions
      else if (text === "/suggestions") {
        const { data } = await supabase
          .from("suggestions")
          .select("*")
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(10);

        if (!data || data.length === 0) {
          await reply(chatId, "\u2705 No pending suggestions to review.");
        } else {
          await reply(chatId, `<b>${data.length} pending suggestions.</b> They'll appear as notification messages with Approve/Reject buttons.`);
          // Resend each as a notification with buttons
          for (const s of data) {
            const typeEmoji = { suggestion: "\uD83D\uDCA1", improvement: "\u2B50", bug: "\uD83D\uDC1B" } as any;
            await tgApi("sendMessage", {
              chat_id: chatId,
              text: `${typeEmoji[s.type] || ""} ${s.type} — ${s.game}\n\n${s.message}\n\nID: ${s.id}`,
              reply_markup: {
                inline_keyboard: [[
                  { text: "\u2705 Approve", callback_data: `approve:${s.id}` },
                  { text: "\u274C Reject", callback_data: `reject:${s.id}` },
                ]]
              }
            });
          }
        }
      }

      // /done <id prefix> — mark a suggestion as implemented
      else if (text.startsWith("/done ")) {
        const idPrefix = text.slice(6).trim();
        const { data } = await supabase.rpc("find_suggestion_by_prefix", { prefix: idPrefix });
        const match = Array.isArray(data) ? data[0] : data;
        if (match && match.status === "approved") {
          await supabase.from("suggestions").update({ status: "implemented" }).eq("id", match.id);
          await reply(chatId, `\u2705 Marked as implemented: ${match.message.slice(0, 60)}`);
        } else if (match) {
          await reply(chatId, `\u274C That suggestion is "${match.status}", not approved.`);
        } else {
          await reply(chatId, `\u274C No suggestion found matching "${idPrefix}"`);
        }
      }

      // /delete <id prefix> — delete a suggestion (any status)
      else if (text.startsWith("/delete ")) {
        const idPrefix = text.slice(8).trim();
        const { data, error } = await supabase.rpc("delete_suggestion_by_prefix", { prefix: idPrefix });
        if (error) {
          await reply(chatId, `\u274C Error: ${error.message}`);
        } else if (data === "NOT_FOUND") {
          await reply(chatId, `\u274C No suggestion found matching "${idPrefix}"`);
        } else {
          await reply(chatId, `\uD83D\uDDD1 Deleted: "${(data as string).slice(0, 60)}"`);
        }
      }

      // /list — show all approved suggestions with IDs
      else if (text === "/list") {
        const { data } = await supabase
          .from("suggestions")
          .select("*")
          .in("status", ["approved", "implemented"])
          .order("votes", { ascending: false })
          .limit(20);

        if (!data || data.length === 0) {
          await reply(chatId, "\uD83D\uDCED No approved suggestions.");
        } else {
          const lines = data.map((s: any) => {
            const impl = s.status === "implemented" ? " \u2705" : "";
            return `<code>${s.id.slice(0, 8)}</code> [${s.votes}\u2B06] ${s.message.slice(0, 50)}${impl}`;
          });
          await reply(chatId, `<b>Suggestions:</b>\n\n${lines.join("\n")}\n\nUse /delete &lt;id&gt; to remove`);
        }
      }

      // /help
      else if (text === "/help" || text === "/start") {
        await reply(chatId, `<b>Prompt Arcade Bot</b> \uD83C\uDFAE\n\n<b>Commands:</b>\n/build &lt;description&gt; — Queue a new game\n/status — Show recent game requests\n/cancel &lt;id&gt; — Cancel a pending request\n/suggestions — Review pending suggestions\n/list — Show all approved suggestions with IDs\n/delete &lt;id&gt; — Delete a suggestion\n/done &lt;id&gt; — Mark as implemented\n/help — Show this message`);
      }

      else {
        await reply(chatId, "Unknown command. Send /help for available commands.");
      }
    }
  } catch (e) {
    console.error("Webhook error:", e);
  }

  return new Response("OK", { status: 200, headers: corsHeaders });
});
