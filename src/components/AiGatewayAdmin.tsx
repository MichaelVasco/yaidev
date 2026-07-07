import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, RefreshCw, Zap, Activity } from "lucide-react";

interface Provider {
  slug: string; name: string; enabled: boolean; priority: number; weight: number;
  health_status: string; cooldown_until: string | null; consecutive_failures: number;
}
interface Model {
  id: string; provider_slug: string; model_id: string; display_name: string;
  context_window: number | null; enabled: boolean;
  cost_input_per_1k: number; cost_output_per_1k: number; task_tags: string[];
}
interface Overview {
  providers: Provider[]; models: Model[];
  config: { failover?: any; task_profiles?: Record<string, string[]> };
  recentLogs: any[];
  stats24h: {
    totalRequests: number; successRate: number; totalTokens: number; totalCostUsd: number;
    byProvider: Record<string, { requests: number; success: number; avgLatencyMs: number; successRate: number; tokens: number; cost: number }>;
  };
}

const AiGatewayAdmin = () => {
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: res, error } = await supabase.functions.invoke("ai-admin", { body: { action: "overview" } });
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    if (!res?.ok) { toast.error(res?.error || "Failed"); return; }
    setData(res as Overview);
  };
  useEffect(() => { load(); }, []);

  const updateProvider = async (slug: string, patch: Partial<Provider>) => {
    const { data: res, error } = await supabase.functions.invoke("ai-admin", {
      body: { action: "update_provider", slug, patch },
    });
    if (error || !res?.ok) { toast.error(error?.message || res?.error || "Failed"); return; }
    toast.success(`Updated ${slug}`);
    load();
  };
  const resetProvider = async (slug: string) => {
    const { data: res, error } = await supabase.functions.invoke("ai-admin", {
      body: { action: "reset_provider", slug },
    });
    if (error || !res?.ok) { toast.error(error?.message || res?.error || "Failed"); return; }
    toast.success(`Reset ${slug}`); load();
  };
  const updateModel = async (id: string, patch: Partial<Model>) => {
    const { data: res, error } = await supabase.functions.invoke("ai-admin", {
      body: { action: "update_model", id, patch },
    });
    if (error || !res?.ok) { toast.error(error?.message || res?.error || "Failed"); return; }
    load();
  };

  if (!data) {
    return <div className="flex items-center gap-2 text-muted-foreground text-sm"><Loader2 className="animate-spin" size={14}/>Loading AI gateway…</div>;
  }

  const s = data.stats24h;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MiniStat label="Requests (24h)" value={String(s.totalRequests)} />
        <MiniStat label="Success rate" value={`${(s.successRate * 100).toFixed(1)}%`} />
        <MiniStat label="Tokens (24h)" value={s.totalTokens.toLocaleString()} />
        <MiniStat label="Est. cost (24h)" value={`$${s.totalCostUsd.toFixed(4)}`} />
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-heading font-bold text-foreground flex items-center gap-2"><Zap size={16} className="text-primary"/>Providers</h3>
          <button onClick={load} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1" disabled={loading}>
            <RefreshCw size={12} className={loading ? "animate-spin" : ""}/>Refresh
          </button>
        </div>
        <div className="bg-card border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-3">Provider</th>
                <th className="text-left p-3">Enabled</th>
                <th className="text-left p-3">Priority</th>
                <th className="text-left p-3">Weight</th>
                <th className="text-left p-3">Health</th>
                <th className="text-left p-3">24h · req / ok / avg ms</th>
                <th className="text-left p-3">24h cost</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.providers.map(p => {
                const bp = s.byProvider[p.slug];
                const cooling = p.cooldown_until && new Date(p.cooldown_until).getTime() > Date.now();
                return (
                  <tr key={p.slug} className="border-t border-border">
                    <td className="p-3">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-[11px] text-muted-foreground">{p.slug}</div>
                    </td>
                    <td className="p-3">
                      <input type="checkbox" checked={p.enabled} onChange={e => updateProvider(p.slug, { enabled: e.target.checked })} />
                    </td>
                    <td className="p-3">
                      <input type="number" defaultValue={p.priority} onBlur={e => {
                        const v = parseInt(e.target.value, 10);
                        if (v !== p.priority) updateProvider(p.slug, { priority: v });
                      }} className="w-16 px-2 py-1 rounded bg-background border border-border text-sm" />
                    </td>
                    <td className="p-3">
                      <input type="number" defaultValue={p.weight} onBlur={e => {
                        const v = parseInt(e.target.value, 10);
                        if (v !== p.weight) updateProvider(p.slug, { weight: v });
                      }} className="w-16 px-2 py-1 rounded bg-background border border-border text-sm" />
                    </td>
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        cooling ? "bg-destructive/15 text-destructive" :
                        p.health_status === "healthy" ? "bg-teal/15 text-teal" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {cooling ? "cooling down" : p.health_status}
                      </span>
                      {p.consecutive_failures > 0 && <div className="text-[10px] text-destructive mt-1">{p.consecutive_failures} recent failures</div>}
                    </td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {bp ? `${bp.requests} / ${bp.success} / ${bp.avgLatencyMs}ms` : "—"}
                    </td>
                    <td className="p-3 text-xs">{bp ? `$${bp.cost.toFixed(4)}` : "—"}</td>
                    <td className="p-3">
                      <button onClick={() => resetProvider(p.slug)} className="text-xs text-primary hover:underline">Reset</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="font-heading font-bold text-foreground mb-2">Model Catalog</h3>
        <div className="bg-card border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-3">Provider</th>
                <th className="text-left p-3">Model</th>
                <th className="text-left p-3">Context</th>
                <th className="text-left p-3">Cost /1k in · out</th>
                <th className="text-left p-3">Tags</th>
                <th className="text-left p-3">Enabled</th>
              </tr>
            </thead>
            <tbody>
              {data.models.map(m => (
                <tr key={m.id} className="border-t border-border">
                  <td className="p-3 text-xs uppercase text-muted-foreground">{m.provider_slug}</td>
                  <td className="p-3"><div className="font-medium">{m.display_name}</div><div className="text-[11px] text-muted-foreground">{m.model_id}</div></td>
                  <td className="p-3 text-xs">{m.context_window ? m.context_window.toLocaleString() : "—"}</td>
                  <td className="p-3 text-xs">${Number(m.cost_input_per_1k).toFixed(4)} · ${Number(m.cost_output_per_1k).toFixed(4)}</td>
                  <td className="p-3 text-[11px] text-muted-foreground">{(m.task_tags || []).join(", ")}</td>
                  <td className="p-3"><input type="checkbox" checked={m.enabled} onChange={e => updateModel(m.id, { enabled: e.target.checked })} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="font-heading font-bold text-foreground mb-2 flex items-center gap-2"><Activity size={16} className="text-primary"/>Recent activity</h3>
        <div className="bg-card border border-border rounded-xl overflow-x-auto">
          <table className="w-full text-xs min-w-[720px]">
            <thead className="bg-muted/40 uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="text-left p-2">When</th>
                <th className="text-left p-2">Feature</th>
                <th className="text-left p-2">Provider · Model</th>
                <th className="text-left p-2">Attempt</th>
                <th className="text-left p-2">Latency</th>
                <th className="text-left p-2">Tokens</th>
                <th className="text-left p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {data.recentLogs.slice(0, 40).map((l: any) => (
                <tr key={l.id} className="border-t border-border">
                  <td className="p-2 text-muted-foreground">{new Date(l.created_at).toLocaleTimeString()}</td>
                  <td className="p-2">{l.feature}</td>
                  <td className="p-2">{l.provider_slug} · {l.model_id}</td>
                  <td className="p-2">{l.attempt}</td>
                  <td className="p-2">{l.latency_ms ?? "—"} ms</td>
                  <td className="p-2">{l.total_tokens ?? "—"}</td>
                  <td className={`p-2 font-semibold ${l.success ? "text-teal" : "text-destructive"}`}>
                    {l.success ? "ok" : (l.error || "failed").slice(0, 40)}
                  </td>
                </tr>
              ))}
              {data.recentLogs.length === 0 && <tr><td colSpan={7} className="p-4 text-center text-muted-foreground">No AI requests yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const MiniStat = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-card border border-border rounded-xl p-3">
    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
    <div className="font-heading font-bold text-xl text-foreground mt-1">{value}</div>
  </div>
);

export default AiGatewayAdmin;
