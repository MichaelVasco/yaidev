// AI Chat — used by YAIDEV AI Agents. Always returns HTTP 200 with structured JSON.
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    let body: any;
    try { body = await req.json(); } catch {
      return json({ error: "Invalid JSON body", fallback: false });
    }
    const { systemPrompt, messages } = body || {};
    if (!Array.isArray(messages)) {
      return json({ error: "messages array required", fallback: false });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[ai-chat] LOVABLE_API_KEY missing");
      return json({ error: "AI chat is not configured.", fallback: false });
    }

    console.log(`[ai-chat] messages=${messages.length}`);

    let res: Response;
    try {
      res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: systemPrompt || "You are a helpful AI agent." },
            ...messages,
          ],
        }),
      });
    } catch (e) {
      console.error("[ai-chat] network error:", e);
      return json({ error: "AI chat is temporarily unreachable. Please try again.", fallback: true });
    }

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.error(`[ai-chat] gateway ${res.status}:`, t.slice(0, 300));
      if (res.status === 429) return json({ error: "Too many messages right now — please try again shortly.", fallback: true });
      if (res.status === 402) return json({ error: "AI credits exhausted.", fallback: false });
      if (res.status >= 500) return json({ error: "AI service hiccup — please try again.", fallback: true });
      return json({ error: `AI chat failed (${res.status}).`, fallback: false });
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content ?? "";
    return json({ reply });
  } catch (e) {
    console.error("[ai-chat] unexpected:", e);
    return json({ error: "Something went wrong. Please try again.", fallback: true });
  }
});
