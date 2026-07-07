// YAIDEV AI Chat — used by AI Agents. Delegates to the multi-provider AI Router.
// Public contract preserved: POST { systemPrompt, messages } -> { reply } | { error, fallback }
import { routeChat, corsHeaders, jsonResponse, userIdFromAuth } from "../_shared/ai-router.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => null);
    if (!body) return jsonResponse({ error: "Invalid JSON body", fallback: false });
    const { systemPrompt, messages } = body;
    if (!Array.isArray(messages)) return jsonResponse({ error: "messages array required", fallback: false });

    const userId = await userIdFromAuth(req);
    const r = await routeChat({
      feature: "ai-chat", task: "chat",
      messages: [
        { role: "system", content: systemPrompt || "You are a helpful AI agent." },
        ...messages,
      ],
      userId,
    });
    console.log(`[ai-chat] ok via ${r.provider}/${r.model}`);
    return jsonResponse({ reply: r.text });
  } catch (e: any) {
    const msg = e?.message || "AI chat failed";
    console.error("[ai-chat] fatal:", msg);
    if (msg.toLowerCase().includes("all ai providers failed"))
      return jsonResponse({ error: "AI chat is temporarily unreachable. Please try again.", fallback: true });
    return jsonResponse({ error: msg, fallback: true });
  }
});
