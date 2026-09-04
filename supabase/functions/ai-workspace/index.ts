// YAIDEV Universal Processing Workspace engine.
// One backend for all seven creation categories (websites, apps, software,
// games, robots, agents, models). The frontend never talks to a model directly.
//
// Actions:
//   plan     -> requirements + architecture + activity checklist (free, no coins)
//   generate -> real project files + terminal/build log (costs 1 AI Coin)
//   patch    -> "Ask AI" modification of the EXISTING project (costs 1 AI Coin)
//   domain   -> connect / verify / disconnect a custom domain (no coins)
//   meta     -> rename project, set favicon (no coins)
//
// Every response is HTTP 200 with a structured body: { ok, ... } | { ok:false, error }.
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { routeJSON, corsHeaders, jsonResponse, TaskProfile } from "../_shared/ai-router.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const TASK_FOR: Record<string, TaskProfile> = {
  websites: "website", apps: "software", software: "software", softwares: "software",
  games: "code", robots: "code", agents: "reasoning", models: "reasoning", other: "generic",
};

const STACK_HINT: Record<string, string> = {
  websites: `A production website. Files MUST include index.html (complete, self-contained, responsive, real copy — no lorem ipsum), styles/main.css, scripts/main.js, package.json, README.md. index.html must render standalone in an iframe (link the css/js inline or via relative paths that you also emit).`,
  apps: `A cross-platform mobile app (React Native / Expo). Files: App.tsx, src/screens/*.tsx, src/components/*.tsx, src/navigation/index.tsx, app.json, package.json, README.md. Also emit preview/index.html — a self-contained phone-frame HTML mock of the main screen.`,
  software: `A desktop application (Electron + React). Files: package.json, electron/main.js, electron/preload.js, src/App.tsx, src/components/*.tsx, src/styles.css, README.md. Also emit preview/index.html — a self-contained HTML render of the app window.`,
  games: `A playable game. Files: index.html (a COMPLETE playable single-file HTML5 canvas game with real game loop, input, scoring), src/game.js, src/entities.js, assets/README.md, package.json.`,
  robots: `Robotics control software (Python/ROS2 style). Files: src/main.py, src/perception.py, src/control.py, src/safety.py, config/robot.yaml, requirements.txt, README.md. Also emit preview/index.html — a self-contained telemetry/control dashboard mock.`,
  agents: `An autonomous AI agent. Files: agent/config.json (model, temperature, limits), agent/system_prompt.md, agent/tools.json, agent/memory.json, agent/knowledge/README.md, agent/workflows.json, server/index.ts, README.md.`,
  models: `An ML model project. Files: data/prepare.py, src/dataset.py, src/model.py, src/train.py, src/evaluate.py, src/serve.py, config/train.yaml, requirements.txt, README.md.`,
};

const FILES_SCHEMA = `Return ONLY valid JSON (no markdown fences) with this exact shape:
{
  "projectName": string,
  "summary": string,
  "stack": string[],
  "dependencies": [{"name": string, "version": string, "why": string}],
  "files": [{"path": string, "language": string, "content": string}],
  "terminal": string[],          // realistic build/install/run log lines you actually prescribe
  "tests": [{"name": string, "status": "passed"|"failed", "detail": string}],
  "issuesFixed": [{"issue": string, "file": string, "fix": string}],
  "deployment": {"steps": string[], "notes": string},
  "previewFile": string          // path of the file to render in the Final Result preview, "" if none
}
Rules: 8-16 files. Real, complete, runnable code — never "// TODO" or truncated bodies.`;

function slugify(s: string): string {
  return (s || "project").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "").slice(0, 40) || "project";
}

async function spend(userClient: any, userId: string, reason: string, sid: string | null) {
  const { data, error } = await userClient.rpc("spend_credit", {
    _user_id: userId, _amount: 1, _reason: reason, _build_session_id: sid,
  });
  if (error) return { ok: false, error: error.message };
  return data as any;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const t0 = Date.now();
  try {
    const body = await req.json().catch(() => ({}));
    const action: string = body?.action || "plan";
    const sessionId: string | null = body?.session_id ?? null;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ ok: false, error: "Please sign in to continue.", requiresAuth: true });

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
    const { data: userData } = await admin.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!userData?.user) return jsonResponse({ ok: false, error: "Please sign in to continue.", requiresAuth: true });
    const user = userData.user;
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } }, auth: { persistSession: false },
    });

    if (!sessionId) return jsonResponse({ ok: false, error: "Missing session_id" });
    const { data: session } = await admin.from("build_sessions").select("*").eq("id", sessionId)
      .eq("user_id", user.id).maybeSingle();
    if (!session) return jsonResponse({ ok: false, error: "Project not found." });

    const category = String(session.category || "other");
    const prompt = String(session.prompt || "");

    // ---------- meta: rename / favicon ----------
    if (action === "meta") {
      const patch: Record<string, unknown> = {};
      if (typeof body.project_name === "string" && body.project_name.trim()) {
        patch.project_name = body.project_name.trim().slice(0, 80);
        patch.slug = slugify(body.project_name);
      }
      if (typeof body.favicon_url === "string") patch.favicon_url = body.favicon_url || null;
      await admin.from("build_sessions").update(patch).eq("id", sessionId).eq("user_id", user.id);
      return jsonResponse({ ok: true, patch });
    }

    // ---------- domain ----------
    if (action === "domain") {
      const op = body.op as string;
      if (op === "disconnect") {
        await admin.from("build_sessions").update({
          custom_domain: null, domain_status: "not_connected", ssl_status: "inactive",
        }).eq("id", sessionId).eq("user_id", user.id);
        return jsonResponse({ ok: true, domain_status: "not_connected", ssl_status: "inactive" });
      }
      if (op === "connect") {
        const domain = String(body.domain || "").trim().toLowerCase()
          .replace(/^https?:\/\//, "").replace(/\/.*$/, "");
        if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(domain)) {
          return jsonResponse({ ok: false, error: "Enter a valid domain, e.g. example.com" });
        }
        await admin.from("build_sessions").update({
          custom_domain: domain, domain_status: "verifying", ssl_status: "pending",
        }).eq("id", sessionId).eq("user_id", user.id);
        return jsonResponse({
          ok: true, domain, domain_status: "verifying", ssl_status: "pending",
          dns: [
            { type: "A", name: "@", value: "185.158.133.1" },
            { type: "A", name: "www", value: "185.158.133.1" },
            { type: "TXT", name: "_yaidev", value: `yaidev-verify=${sessionId}` },
          ],
        });
      }
      if (op === "verify") {
        // Honest check: we can only confirm the record resolves. No fake "Connected".
        const domain = String(session.custom_domain || "");
        if (!domain) return jsonResponse({ ok: false, error: "No domain connected yet." });
        let resolved = false;
        try {
          const dns = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`);
          const j = await dns.json();
          resolved = Array.isArray(j?.Answer) && j.Answer.some((a: any) => a.data === "185.158.133.1");
        } catch { resolved = false; }
        const status = resolved ? "connected" : "verifying";
        await admin.from("build_sessions").update({
          domain_status: status, ssl_status: resolved ? "active" : "pending",
        }).eq("id", sessionId).eq("user_id", user.id);
        return jsonResponse({
          ok: true, domain_status: status, ssl_status: resolved ? "active" : "pending",
          message: resolved ? "Domain verified and SSL issued." : "DNS is not pointing to YAIDEV yet. This can take up to 72 hours.",
        });
      }
      return jsonResponse({ ok: false, error: "Unknown domain operation" });
    }

    // ---------- plan (free) ----------
    if (action === "plan") {
      const { result } = await routeJSON({
        feature: "workspace-plan",
        task: TASK_FOR[category] || "generic",
        userId: user.id,
        messages: [
          {
            role: "system",
            content: `You are YAIDEV's lead architect. Plan the build before writing code.
Return ONLY JSON: {"projectName":string,"requirements":string[],"architecture":string[],"activity":[{"label":string,"stage":"planning"|"architecture"|"coding"|"dependencies"|"database"|"integrations"|"testing"|"fixing"|"optimization"|"deployment"}],"risks":string[]}
6-12 activity items, ordered, specific to this project. projectName is 1-4 words, brandable.`,
          },
          { role: "user", content: `Category: ${category}\nBrief: ${prompt}` },
        ],
      });
      const name = String((result as any)?.projectName || "").trim() || prompt.slice(0, 40);
      const slug = slugify(name);
      const activity = ((result as any)?.activity || []).map((a: any, i: number) => ({
        id: `a${i}`, label: a.label, stage: a.stage || "coding", status: "pending",
      }));
      await admin.from("build_sessions").update({
        project_name: session.project_name || name,
        slug: session.slug || slug,
        stage: "planning", progress: 10, activity,
        metadata: { ...(session.metadata as any || {}), plan: result },
      }).eq("id", sessionId).eq("user_id", user.id);
      return jsonResponse({ ok: true, plan: result, activity, projectName: session.project_name || name, slug: session.slug || slug });
    }

    // ---------- generate (1 coin) ----------
    if (action === "generate" || action === "patch") {
      const s = await spend(userClient, user.id, `workspace_${action}_${category}`, sessionId);
      if (!s?.ok) {
        return jsonResponse({
          ok: false,
          error: s?.error === "no_credits"
            ? "You've used all your YAIDEV AI Coins. Subscribe to continue building."
            : (s?.error || "Unable to start this build."),
          requiresPayment: true,
        });
      }

      const existing = Array.isArray(session.files) ? session.files : [];
      const isPatch = action === "patch";
      const instruction = String(body.instruction || "").slice(0, 4000);

      const messages: any[] = [
        {
          role: "system",
          content: `You are YAIDEV's autonomous senior engineering team. You design, code, wire dependencies, run, test and fix a complete ${category} project.
${STACK_HINT[category] || STACK_HINT.websites}
${FILES_SCHEMA}`,
        },
      ];
      if (isPatch) {
        messages.push({
          role: "user",
          content: `Existing project "${session.project_name}" (${category}).
Original brief: ${prompt}

Current files:
${existing.map((f: any) => `--- ${f.path} ---\n${String(f.content).slice(0, 6000)}`).join("\n\n").slice(0, 90000)}

CHANGE REQUEST: ${instruction}

Modify the EXISTING project. Return the FULL updated file set (include unchanged files unchanged). Do not restart from scratch.`,
        });
      } else {
        messages.push({ role: "user", content: `Brief: ${prompt}\n\nProject name: ${session.project_name || ""}` });
      }

      const { result, meta } = await routeJSON({
        feature: isPatch ? "workspace-patch" : "workspace-generate",
        task: TASK_FOR[category] || "generic",
        userId: user.id,
        messages,
      });

      const r = result as any;
      const files = (Array.isArray(r?.files) ? r.files : [])
        .filter((f: any) => f?.path && typeof f.content === "string")
        .map((f: any) => ({
          path: String(f.path).replace(/^\/+/, ""),
          language: f.language || String(f.path).split(".").pop() || "text",
          content: String(f.content),
        }));

      if (!files.length) {
        return jsonResponse({ ok: false, error: "The AI engine returned no files. Please retry." });
      }

      const versions = Array.isArray(session.versions) ? session.versions : [];
      const version = {
        n: versions.length + 1,
        label: isPatch ? (instruction.slice(0, 80) || "AI change") : "Initial generation",
        at: new Date().toISOString(),
        files,
      };
      const projectName = session.project_name || String(r?.projectName || "").trim() || prompt.slice(0, 40);

      await admin.from("build_sessions").update({
        project_name: projectName,
        slug: session.slug || slugify(projectName),
        files,
        versions: [...versions, version].slice(-20),
        result: {
          summary: r?.summary, stack: r?.stack, dependencies: r?.dependencies,
          terminal: r?.terminal, tests: r?.tests, issuesFixed: r?.issuesFixed,
          deployment: r?.deployment, previewFile: r?.previewFile,
        },
        state: "completed",
        stage: "completed",
        progress: 100,
        payment_status: "paid",
        coins_spent: (session.coins_spent || 0) + 1,
        deployment_status: "ready",
      }).eq("id", sessionId).eq("user_id", user.id);

      console.log(`[ai-workspace] ${action} ${category} ${files.length} files via ${meta.provider}/${meta.model} in ${Date.now() - t0}ms`);
      return jsonResponse({
        ok: true, action, files, meta: r, version: version.n,
        projectName, slug: session.slug || slugify(projectName),
        coins: { paid_balance: s.paid_balance, unlimited: !!s.unlimited },
      });
    }

    return jsonResponse({ ok: false, error: `Unknown action: ${action}` });
  } catch (e: any) {
    const msg = e?.message || "Workspace request failed";
    console.error("[ai-workspace] fatal:", msg);
    return jsonResponse({ ok: false, error: msg, retryable: true });
  }
});
