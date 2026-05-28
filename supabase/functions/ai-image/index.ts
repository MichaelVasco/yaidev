// AI Image generation edge function — Create Images / Logos / Designs
// Always returns HTTP 200 with structured JSON.
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const PROMPT_AUGMENT: Record<string, string> = {
  images: "Render a high-detail, cinematic, professional image. Strong composition, accurate lighting.",
  logos: "Create a premium, modern, scalable LOGO on a clean solid background. Vector-style, balanced negative space. No mockups.",
  designs: "Produce a polished commercial graphic design — branding-ready typography, balanced layout, print-quality.",
};

async function callOnce(apiKey: string, content: any[]): Promise<{ url?: string; status?: number; body?: string }> {
  try {
    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content }],
        modalities: ["image", "text"],
      }),
    });
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      console.error(`[ai-image] gateway ${r.status}:`, t.slice(0, 300));
      return { status: r.status, body: t };
    }
    const j = await r.json();
    const url = j.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    return { url };
  } catch (e) {
    console.error("[ai-image] network error:", e);
    return { status: 0, body: String(e) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const t0 = Date.now();
  try {
    let body: any;
    try { body = await req.json(); } catch {
      return json({ error: "Invalid JSON body", fallback: false });
    }
    const { category, prompt, variants = 3, attachments = [] } = body || {};
    if (!prompt) return json({ error: "Missing prompt", fallback: false });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("[ai-image] LOVABLE_API_KEY missing");
      return json({ error: "AI image service is not configured.", fallback: false });
    }

    console.log(`[ai-image] category=${category} variants=${variants} attachments=${attachments?.length || 0}`);

    const augment = PROMPT_AUGMENT[category] || PROMPT_AUGMENT.images;
    const variantAngles = [
      "Concept A — bold and modern.",
      "Concept B — minimal and elegant.",
      "Concept C — vibrant and energetic.",
    ];
    const n = Math.min(Math.max(Number(variants) || 1, 1), 3);

    const refParts: any[] = [];
    const refNotes: string[] = [];
    for (const a of (attachments as any[]).slice(0, 6)) {
      if (a?.kind === "image" && a?.dataUrl) {
        refParts.push({ type: "image_url", image_url: { url: a.dataUrl } });
        refNotes.push(`Use "${a.name}" as visual reference.`);
      } else if (a?.kind === "text" && a?.textContent) {
        refNotes.push(`Reference doc "${a.name}":\n${a.textContent.slice(0, 4000)}`);
      } else if (a) {
        refNotes.push(`Attached ${a.kind} "${a.name}".`);
      }
    }

    const results = await Promise.all(
      Array.from({ length: n }, (_, i) => {
        const content: any[] = [
          { type: "text", text: `${prompt}\n\n${augment}\n\n${variantAngles[i] ?? ""}${refNotes.length ? "\n\nReferences:\n" + refNotes.join("\n") : ""}` },
          ...refParts,
        ];
        return callOnce(LOVABLE_API_KEY, content);
      })
    );

    const urls = results.filter((r) => r.url).map((r) => r.url as string);

    if (urls.length === 0) {
      const first = results.find((r) => r.status);
      const s = first?.status ?? 500;
      if (s === 429) return json({ error: "We're getting a lot of requests right now — please try again in a moment.", fallback: true });
      if (s === 402) return json({ error: "AI credits exhausted. Please add credits to continue.", fallback: false });
      return json({ error: "Image generation failed. Please try again with a more specific prompt.", fallback: true });
    }

    console.log(`[ai-image] success urls=${urls.length} in ${Date.now() - t0}ms`);
    return json({ category, images: urls });
  } catch (e) {
    console.error("[ai-image] unexpected:", e);
    return json({ error: "Something went wrong generating your image. Please try again.", fallback: true });
  }
});
