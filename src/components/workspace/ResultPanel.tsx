import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Bot, ExternalLink, Maximize2, Monitor, RefreshCw, Send, Share2, Smartphone, Tablet,
} from "lucide-react";
import { buildPreviewDoc, projectUrl, type WorkspaceSession } from "@/lib/workspace-api";
import { supabase } from "@/integrations/supabase/client";

type Device = "desktop" | "tablet" | "mobile";
const WIDTH: Record<Device, string> = { desktop: "100%", tablet: "768px", mobile: "390px" };

export default function ResultPanel({ session, running }: { session: WorkspaceSession; running: boolean }) {
  const [device, setDevice] = useState<Device>("desktop");
  const [nonce, setNonce] = useState(0);
  const doc = useMemo(
    () => buildPreviewDoc(session.files, session.result?.previewFile),
    [session.files, session.result],
  );
  const isInteractive = session.category === "agents" || session.category === "models";

  return (
    <section className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
      <header className="px-5 py-3 border-b border-border flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Monitor size={15} className="text-teal" />
          <h2 className="font-heading font-semibold text-sm tracking-wide uppercase text-muted-foreground">Final result part</h2>
        </div>
        <div className="flex items-center gap-1">
          {!isInteractive && (["desktop", "tablet", "mobile"] as Device[]).map((d) => (
            <button key={d} onClick={() => setDevice(d)} title={d}
              className={`p-1.5 rounded-md transition ${device === d ? "bg-blue text-white" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
              {d === "desktop" ? <Monitor size={13} /> : d === "tablet" ? <Tablet size={13} /> : <Smartphone size={13} />}
            </button>
          ))}
          <button onClick={() => setNonce((n) => n + 1)} title="Refresh"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50"><RefreshCw size={13} /></button>
          <button title="Open in new tab" disabled={!doc}
            onClick={() => { if (!doc) return; const w = window.open("", "_blank"); w?.document.write(doc); w?.document.close(); }}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30"><ExternalLink size={13} /></button>
          <button title="Full screen" disabled={!doc}
            onClick={() => document.getElementById("yaidev-preview-frame")?.requestFullscreen?.()}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 disabled:opacity-30"><Maximize2 size={13} /></button>
          <button title="Share" onClick={() => { navigator.clipboard.writeText(projectUrl(session)); toast.success("Link copied"); }}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50"><Share2 size={13} /></button>
        </div>
      </header>

      <div className="flex-1 bg-muted/20 p-3 flex justify-center min-h-[420px]">
        {isInteractive ? (
          <InteractiveTester session={session} />
        ) : doc ? (
          <iframe
            id="yaidev-preview-frame"
            key={nonce}
            title="Project preview"
            srcDoc={doc}
            sandbox="allow-scripts allow-forms allow-modals allow-popups"
            className="bg-white rounded-xl border border-border shadow-sm h-[520px] transition-all"
            style={{ width: WIDTH[device], maxWidth: "100%" }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center text-center text-muted-foreground text-sm gap-2 py-16">
            <Monitor size={26} className="opacity-40" />
            <p>{running ? "Waiting for the AI to finish building…" : "The live result appears here after generation."}</p>
          </div>
        )}
      </div>
    </section>
  );
}

/** Real test harness for AI agents and AI models — talks to the YAIDEV AI backend. */
function InteractiveTester({ session }: { session: WorkspaceSession }) {
  const [input, setInput] = useState("");
  const [log, setLog] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [busy, setBusy] = useState(false);

  const systemFile = session.files.find((f) => /system_prompt|config\.json|serve\.py|model\.py/i.test(f.path));

  const send = async () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    setLog((l) => [...l, { role: "user", text }]);
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-chat", {
        body: {
          messages: [
            { role: "system", content: `You are the ${session.category === "agents" ? "AI agent" : "AI model"} "${session.project_name}" built by YAIDEV.\n\nSpecification:\n${(systemFile?.content || session.prompt).slice(0, 6000)}\n\nRespond exactly as this system would.` },
            ...log.map((m) => ({ role: m.role, content: m.text })),
            { role: "user", content: text },
          ],
        },
      });
      if (error) throw new Error(error.message);
      const reply = (data as any)?.reply || (data as any)?.message || (data as any)?.error || "No response.";
      setLog((l) => [...l, { role: "assistant", text: String(reply) }]);
    } catch (e: any) {
      setLog((l) => [...l, { role: "assistant", text: `Could not reach the AI engine: ${e.message}` }]);
    } finally { setBusy(false); }
  };

  return (
    <div className="w-full max-w-2xl flex flex-col h-[520px] bg-card border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-2 border-b border-border flex items-center gap-2 text-xs text-muted-foreground">
        <Bot size={13} className="text-purple" /> Test {session.project_name || "your build"} live
      </div>
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {log.length === 0 && (
          <p className="text-xs text-muted-foreground">
            {session.category === "agents" ? "Ask the agent a question a real customer would ask." : "Enter a sample input to see the model's output."}
          </p>
        )}
        {log.map((m, i) => (
          <div key={i} className={`text-sm max-w-[85%] rounded-xl px-3 py-2 ${m.role === "user" ? "ml-auto bg-blue text-white" : "bg-muted/60 text-foreground"}`}>
            {m.text}
          </div>
        ))}
        {busy && <p className="text-xs text-muted-foreground">Thinking…</p>}
      </div>
      <div className="p-2 border-t border-border flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Type a test message…"
          className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm outline-none focus:border-blue/50" />
        <button onClick={send} disabled={busy || !input.trim()}
          className="px-3 rounded-lg bg-blue text-white disabled:opacity-40"><Send size={14} /></button>
      </div>
    </div>
  );
}
