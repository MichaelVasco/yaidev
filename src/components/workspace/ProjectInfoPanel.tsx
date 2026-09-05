import { useRef, useState } from "react";
import { toast } from "sonner";
import {
  Check, Copy, ExternalLink, Globe, Image as ImageIcon, Link2, Loader2,
  Pencil, Share2, ShieldCheck, Trash2, Upload,
} from "lucide-react";
import {
  CATEGORY_LABEL, projectUrl, workspaceApi, type WorkspaceSession,
} from "@/lib/workspace-api";

interface Props {
  session: WorkspaceSession;
  onChange: (patch: Partial<WorkspaceSession>) => void;
}

const STATUS_STYLE: Record<string, string> = {
  not_connected: "bg-muted text-muted-foreground",
  connecting: "bg-purple/10 text-purple",
  verifying: "bg-purple/10 text-purple",
  connected: "bg-teal/10 text-teal",
  error: "bg-destructive/10 text-destructive",
};

export default function ProjectInfoPanel({ session, onChange }: Props) {
  const [name, setName] = useState(session.project_name || "");
  const [editing, setEditing] = useState(false);
  const [domain, setDomain] = useState(session.custom_domain || "");
  const [dns, setDns] = useState<{ type: string; name: string; value: string }[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const url = projectUrl(session);
  const devUrl = projectUrl({ ...session, custom_domain: null });

  const saveName = async () => {
    if (!name.trim()) return setEditing(false);
    setBusy("name");
    try {
      const res = await workspaceApi.setMeta(session.id, { project_name: name.trim() });
      onChange({ project_name: res.patch.project_name, slug: res.patch.slug });
      setEditing(false);
    } catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
  };

  const onFavicon = async (file: File) => {
    if (file.size > 512 * 1024) return toast.error("Please choose an image under 512 KB");
    const dataUrl = await new Promise<string>((res) => {
      const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(file);
    });
    setBusy("favicon");
    try {
      await workspaceApi.setMeta(session.id, { favicon_url: dataUrl });
      onChange({ favicon_url: dataUrl });
      toast.success("Icon updated");
    } catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
  };

  const removeFavicon = async () => {
    setBusy("favicon");
    try {
      await workspaceApi.setMeta(session.id, { favicon_url: null });
      onChange({ favicon_url: null });
    } catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Link copied");
  };

  const share = async (text: string) => {
    if (navigator.share) { try { await navigator.share({ title: session.project_name || "YAIDEV project", url: text }); return; } catch { /* cancelled */ } }
    copy(text);
  };

  const connect = async () => {
    setBusy("domain");
    try {
      const res = await workspaceApi.connectDomain(session.id, domain);
      setDns(res.dns || []);
      onChange({ custom_domain: res.domain, domain_status: res.domain_status, ssl_status: res.ssl_status });
      toast.success("Add the records below at your domain provider, then verify.");
    } catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
  };

  const verify = async () => {
    setBusy("domain");
    try {
      const res = await workspaceApi.verifyDomain(session.id);
      onChange({ domain_status: res.domain_status, ssl_status: res.ssl_status });
      res.domain_status === "connected" ? toast.success(res.message) : toast.info(res.message);
    } catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
  };

  const disconnect = async () => {
    setBusy("domain");
    try {
      await workspaceApi.disconnectDomain(session.id);
      onChange({ custom_domain: null, domain_status: "not_connected", ssl_status: "inactive" });
      setDomain(""); setDns([]);
    } catch (e: any) { toast.error(e.message); } finally { setBusy(null); }
  };

  return (
    <section className="bg-card border border-border rounded-2xl overflow-hidden">
      <header className="px-5 py-3 border-b border-border flex items-center gap-2">
        <Globe size={15} className="text-blue" />
        <h2 className="font-heading font-semibold text-sm tracking-wide uppercase text-muted-foreground">Project information</h2>
      </header>

      <div className="grid md:grid-cols-3 gap-px bg-border">
        {/* Identity + favicon */}
        <div className="bg-card p-5 space-y-4">
          <div className="flex items-start gap-3">
            <button
              onClick={() => fileRef.current?.click()}
              className="h-14 w-14 shrink-0 rounded-xl border border-dashed border-border bg-muted/40 flex items-center justify-center overflow-hidden hover:border-blue/50 transition"
              title="Add favicon / project icon"
            >
              {busy === "favicon"
                ? <Loader2 size={16} className="animate-spin text-muted-foreground" />
                : session.favicon_url
                  ? <img src={session.favicon_url} alt="Project icon" className="h-full w-full object-cover" />
                  : <ImageIcon size={18} className="text-muted-foreground" />}
            </button>
            <div className="min-w-0 flex-1">
              {editing ? (
                <div className="flex items-center gap-2">
                  <input
                    autoFocus value={name} onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveName()}
                    className="w-full bg-muted/50 border border-border rounded-lg px-2 py-1 text-sm outline-none focus:border-blue/50"
                  />
                  <button onClick={saveName} className="text-teal"><Check size={16} /></button>
                </div>
              ) : (
                <button onClick={() => setEditing(true)} className="flex items-center gap-1.5 group text-left">
                  <span className="font-heading font-bold text-base text-foreground truncate">
                    {session.project_name || "Untitled project"}
                  </span>
                  <Pencil size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100" />
                </button>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                {CATEGORY_LABEL[session.category] || session.category} · {session.state}
              </p>
              <div className="flex gap-2 mt-2">
                <button onClick={() => fileRef.current?.click()} className="text-[11px] flex items-center gap-1 text-muted-foreground hover:text-foreground">
                  <Upload size={11} /> {session.favicon_url ? "Change icon" : "Add favicon"}
                </button>
                {session.favicon_url && (
                  <button onClick={removeFavicon} className="text-[11px] flex items-center gap-1 text-muted-foreground hover:text-destructive">
                    <Trash2 size={11} /> Remove
                  </button>
                )}
              </div>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFavicon(f); e.target.value = ""; }} />
        </div>

        {/* Website / workspace link */}
        <div className="bg-card p-5 space-y-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
            {session.category === "websites" ? "Website link" : "Workspace link"}
          </p>
          <a href={url} target="_blank" rel="noreferrer"
            className="block text-sm font-mono text-blue hover:underline break-all">
            {url.replace(/^https:\/\//, "")}
          </a>
          <div className="flex flex-wrap gap-1.5">
            <Action icon={<ExternalLink size={12} />} label="Open" onClick={() => window.open(url, "_blank")} />
            <Action icon={<Copy size={12} />} label="Copy" onClick={() => copy(url)} />
            <Action icon={<Share2 size={12} />} label="Share" onClick={() => share(url)} />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Live once the project is deployed. Development address: <span className="font-mono">{devUrl.replace(/^https:\/\//, "")}</span>
          </p>
        </div>

        {/* Link domain */}
        <div className="bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">Link domain</p>
            <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${STATUS_STYLE[session.domain_status] || STATUS_STYLE.not_connected}`}>
              {session.domain_status.replace("_", " ")}
            </span>
          </div>
          <div className="flex gap-2">
            <input
              value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="yourdomain.com"
              className="flex-1 min-w-0 bg-muted/50 border border-border rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-blue/50"
            />
            <button onClick={connect} disabled={!domain.trim() || busy === "domain"}
              className="px-3 rounded-lg bg-blue text-white text-xs font-medium disabled:opacity-40 flex items-center gap-1">
              {busy === "domain" ? <Loader2 size={12} className="animate-spin" /> : <Link2 size={12} />} Connect
            </button>
          </div>
          {session.custom_domain && (
            <div className="flex flex-wrap items-center gap-1.5">
              <Action icon={<ShieldCheck size={12} />} label="Verify" onClick={verify} />
              <Action icon={<Trash2 size={12} />} label="Disconnect" onClick={disconnect} />
              <span className="text-[11px] text-muted-foreground">SSL: {session.ssl_status}</span>
            </div>
          )}
          {dns.length > 0 && (
            <div className="rounded-lg bg-muted/40 border border-border p-2.5 space-y-1">
              <p className="text-[11px] font-medium text-foreground">Add these records at your domain provider:</p>
              {dns.map((r) => (
                <p key={r.type + r.name} className="text-[11px] font-mono text-muted-foreground break-all">
                  {r.type} · {r.name} · {r.value}
                </p>
              ))}
              <p className="text-[11px] text-muted-foreground">Changes can take up to 72 hours to take effect.</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Action({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-1 px-2 py-1 rounded-md border border-border text-[11px] text-muted-foreground hover:text-foreground hover:border-blue/40 transition">
      {icon}{label}
    </button>
  );
}
