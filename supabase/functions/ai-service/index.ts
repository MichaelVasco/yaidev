// Unified AI service for: social, email, office, company managers.
// Always returns HTTP 200 with structured JSON.
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

const SYSTEMS: Record<string, string> = {
  "social.post": `You are an elite social media strategist. Given a brand profile and a prompt, output a single JSON object:
{"title":string,"caption":string,"hashtags":string[],"hook":string,"cta":string,"variations":[{"caption":string,"hashtags":string[]}],"bestTime":string,"contentType":string,"platformTips":string,"imagePrompt":string}
Be on-brand, platform-aware, never generic.`,
  "social.campaign": `You are an elite marketing campaign strategist. Output JSON:
{"name":string,"objective":string,"audience":string,"channels":string[],"weeks":[{"week":number,"theme":string,"posts":[{"day":string,"platform":string,"caption":string,"hashtags":string[],"cta":string}]}],"kpis":string[],"budget":string}`,
  "social.reply": `You are a social customer-care expert. Given an incoming message, output JSON:
{"sentiment":string,"intent":string,"reply":string,"alternatives":string[],"escalate":boolean,"reason":string}`,
  "social.growth": `You are an elite social growth strategist. Output JSON:
{"summary":string,"strategies":[{"title":string,"why":string,"steps":string[],"timeframe":string,"effort":string}],"contentMix":[{"type":string,"percent":number}],"experiments":string[]}`,

  "email.draft": `You are an elite executive email writer. Output JSON:
{"subject":string,"preview":string,"body":string,"tone":string,"recommendedSendTime":string,"followUpInDays":number,"signatureSuggestion":string}`,
  "email.summary": `You summarize emails for busy executives. Output JSON:
{"summary":string,"category":string,"priority":"low"|"medium"|"high"|"urgent","actionItems":string[],"suggestedReply":string,"followUpNeeded":boolean}`,
  "email.triage": `You triage an inbox. Given a list of emails, output JSON:
{"urgent":[{"id":string,"reason":string}],"important":[{"id":string,"reason":string}],"informational":[{"id":string}],"spammy":[{"id":string}],"summary":string}`,

  "office.word": `You are an expert technical/business writer. Output JSON:
{"title":string,"document":string,"sections":[{"heading":string,"body":string}],"styleNotes":string,"wordCount":number}
document = full formatted plain text.`,
  "office.excel": `You are an Excel/data analyst. Output JSON:
{"title":string,"sheetName":string,"columns":string[],"rows":(string|number)[][],"formulas":[{"cell":string,"formula":string,"purpose":string}],"chartSuggestions":string[],"insights":string[]}`,
  "office.powerpoint": `You are a presentation designer. Output JSON:
{"title":string,"slides":[{"n":number,"title":string,"bullets":string[],"speakerNotes":string,"visualSuggestion":string}],"theme":string,"durationMinutes":number}`,
  "office.outlook": `You draft Outlook-ready emails. Output JSON:
{"subject":string,"body":string,"recipients":string[],"importance":"low"|"normal"|"high","followUp":string}`,
  "office.onenote": `You generate structured OneNote pages. Output JSON:
{"title":string,"sections":[{"heading":string,"notes":string[],"tasks":string[]}],"summary":string,"tags":string[]}`,
  "office.access": `You design simple databases. Output JSON:
{"databaseName":string,"tables":[{"name":string,"fields":[{"name":string,"type":string,"primaryKey":boolean,"notes":string}]}],"relationships":[{"from":string,"to":string,"type":string}],"queries":[{"name":string,"sql":string,"purpose":string}]}`,
  "office.teams": `You draft Teams channel messages. Output JSON:
{"channel":string,"message":string,"tone":string,"mentions":string[],"followUps":string[]}`,

  "company.daily": `You are an elite CEO advisor. Output a daily strategic recommendation as JSON:
{"date":string,"executiveSummary":string,"recommendations":[{"area":string,"title":string,"why":string,"actions":string[],"expectedImpact":string,"priority":"low"|"medium"|"high"}],"kpisToWatch":string[],"risks":string[],"opportunities":string[]}`,
  "company.growth": `You are an elite growth & profitability consultant. Output JSON:
{"growthScore":number,"profitabilityForecast":string,"revenueForecast":[{"month":string,"low":number,"base":number,"high":number}],"riskAssessment":[{"risk":string,"severity":string,"mitigation":string}],"marketOpportunities":string[],"fundingReadiness":{"score":number,"gaps":string[],"nextSteps":string[]},"strategicRoadmap":[{"quarter":string,"focus":string,"initiatives":string[]}]}`,
  "company.kpis": `You define executive KPIs. Output JSON:
{"kpis":[{"name":string,"target":string,"current":string,"frequency":string,"why":string}],"dashboardSuggestion":string}`,
};

async function callGateway(apiKey: string, payload: unknown, attempt = 1): Promise<Response> {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok && [502, 503, 504].includes(res.status) && attempt < 2) {
    await new Promise((r) => setTimeout(r, 800));
    return callGateway(apiKey, payload, attempt + 1);
  }
  return res;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    let body: any;
    try { body = await req.json(); } catch { return json({ error: "Invalid JSON body" }); }

    const { module: mod, action, prompt, profile, context } = body || {};
    const key = `${mod}.${action}`;
    if (!SYSTEMS[key]) return json({ error: `Unknown action: ${key}` });
    if (!prompt && !context) return json({ error: "Missing prompt or context" });

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "AI service not configured." });

    const userText = [
      profile ? `Profile / setup:\n${JSON.stringify(profile, null, 2)}` : "",
      context ? `Context:\n${typeof context === "string" ? context : JSON.stringify(context, null, 2)}` : "",
      prompt ? `Request:\n${prompt}` : "",
    ].filter(Boolean).join("\n\n");

    const res = await callGateway(apiKey, {
      model: "google/gemini-2.5-pro",
      messages: [
        { role: "system", content: SYSTEMS[key] + "\n\nReturn ONLY valid JSON. No markdown fences." },
        { role: "user", content: userText },
      ],
      response_format: { type: "json_object" },
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.error(`[ai-service] ${key} gateway ${res.status}:`, t.slice(0, 300));
      if (res.status === 429) return json({ error: "Rate limited — please retry shortly.", fallback: true });
      if (res.status === 402) return json({ error: "AI credits exhausted. Please add credits." });
      return json({ error: `AI request failed (${res.status}).`, fallback: true });
    }
    const data = await res.json();
    const content = data.choices?.[0]?.message?.content ?? "{}";
    let parsed: any;
    try { parsed = JSON.parse(content); }
    catch { const m = content.match(/\{[\s\S]*\}/); parsed = m ? JSON.parse(m[0]) : { raw: content }; }

    return json({ module: mod, action, result: parsed });
  } catch (e) {
    console.error("[ai-service] error", e);
    return json({ error: "Something went wrong. Please try again.", fallback: true });
  }
});
