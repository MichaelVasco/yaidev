// AI Image generation edge function — used by Create Images / Logos / Designs
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROMPT_AUGMENT: Record<string, string> = {
  images: "Render a high-detail, cinematic, professional image. Strong composition, accurate lighting, photoreal where appropriate.",
  logos: "Create a premium, modern, scalable LOGO design on a clean solid background. Vector-style, balanced negative space, commercial-quality branding. No mockups, just the logo mark.",
  designs: "Produce a polished commercial graphic design — branding-ready, professional typography, balanced layout, print-quality composition.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { category, prompt, variants = 3 } = await req.json();
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Missing prompt" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const augment = PROMPT_AUGMENT[category] || PROMPT_AUGMENT.images;
    const variantAngles = [
      "Concept A — bold and modern.",
      "Concept B — minimal and elegant.",
      "Concept C — vibrant and energetic.",
    ];

    const n = Math.min(Math.max(variants, 1), 3);

    const calls = Array.from({ length: n }, (_, i) =>
      fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{
            role: "user",
            content: `${prompt}\n\n${augment}\n\n${variantAngles[i] ?? ""}`,
          }],
          modalities: ["image", "text"],
        }),
      }).then(async (r) => {
        if (!r.ok) {
          const t = await r.text();
          console.error("img gen failed", r.status, t);
          return { error: r.status, body: t };
        }
        const j = await r.json();
        const url = j.choices?.[0]?.message?.images?.[0]?.image_url?.url;
        return { url };
      }),
    );

    const results = await Promise.all(calls);
    const firstErr = results.find((r: any) => r.error);
    if (firstErr && !results.some((r: any) => r.url)) {
      const s = (firstErr as any).error;
      if (s === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (s === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "Image generation failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({
      category,
      images: results.filter((r: any) => r.url).map((r: any) => r.url),
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("ai-image error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
