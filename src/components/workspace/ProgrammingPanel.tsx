import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  AlertTriangle, Check, ChevronDown, ChevronRight, Circle, Copy, Download, File as FileIcon,
  Folder, FolderOpen, Loader2, Package, Search, Terminal as TerminalIcon,
} from "lucide-react";
import {
  buildTree, downloadProject, type ActivityItem, type ProjectFile, type TreeNode, type WorkspaceSession,
} from "@/lib/workspace-api";

interface Props {
  session: WorkspaceSession;
  activity: ActivityItem[];
  running: boolean;
}

type Tab = "code" | "terminal" | "deps" | "activity";

export default function ProgrammingPanel({ session, activity, running }: Props) {
  const files = session.files;
  const [tab, setTab] = useState<Tab>("code");
  const [active, setActive] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!active && files.length) setActive(files[0].path);
  }, [files, active]);

  const filtered = useMemo(
    () => (query ? files.filter((f) => f.path.toLowerCase().includes(query.toLowerCase())) : files),
    [files, query],
  );
  const tree = useMemo(() => buildTree(filtered), [filtered]);
  const current = files.find((f) => f.path === active) || null;
  const meta = session.result || {};

  return (
    <section className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col min-h-[520px]">
      <header className="px-5 py-3 border-b border-border flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <TerminalIcon size={15} className="text-purple" />
          <h2 className="font-heading font-semibold text-sm tracking-wide uppercase text-muted-foreground">Programming part</h2>
          {running && <Loader2 size={13} className="animate-spin text-blue" />}
        </div>
        <div className="flex items-center gap-1">
          {(["code", "terminal", "deps", "activity"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-2.5 py-1 rounded-md text-xs capitalize transition ${tab === t ? "bg-blue text-white" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"}`}>
              {t === "deps" ? "Dependencies" : t}
            </button>
          ))}
          {files.length > 0 && (
            <button onClick={() => downloadProject(session.project_name || "project", files)}
              className="ml-1 px-2.5 py-1 rounded-md text-xs border border-border text-muted-foreground hover:text-foreground flex items-center gap-1">
              <Download size={12} /> Download
            </button>
          )}
        </div>
      </header>

      {tab === "code" && (
        <div className="grid md:grid-cols-[minmax(180px,240px),1fr] flex-1 min-h-0">
          <aside className="border-b md:border-b-0 md:border-r border-border flex flex-col max-h-56 md:max-h-none">
            <div className="p-2 border-b border-border flex items-center gap-1.5">
              <Search size={12} className="text-muted-foreground" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search files"
                className="bg-transparent text-xs outline-none w-full" />
            </div>
            <div className="overflow-auto p-1.5 flex-1">
              {files.length === 0 && <p className="text-xs text-muted-foreground p-2">No files yet.</p>}
              <Tree nodes={tree} depth={0} active={active} onSelect={setActive} open={open} setOpen={setOpen} />
            </div>
          </aside>

          <div className="flex flex-col min-h-0">
            <div className="px-3 py-1.5 border-b border-border flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground truncate">{current?.path || "—"}</span>
              {current && (
                <button onClick={() => { navigator.clipboard.writeText(current.content); toast.success("Code copied"); }}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                  <Copy size={11} /> Copy
                </button>
              )}
            </div>
            <pre className="flex-1 overflow-auto p-4 text-[12px] leading-relaxed font-mono text-foreground/90 bg-muted/20 max-h-[460px]">
              {current?.content || (running ? "AI is generating source code…" : "Generate the project to see source code here.")}
            </pre>
          </div>
        </div>
      )}

      {tab === "terminal" && (
        <div className="p-4 font-mono text-[12px] leading-relaxed overflow-auto max-h-[460px] bg-muted/20 flex-1">
          {(meta.terminal || []).length === 0 && <p className="text-muted-foreground">No build output yet.</p>}
          {(meta.terminal || []).map((line: string, i: number) => (
            <p key={i} className="text-foreground/80">$ {line}</p>
          ))}
          {(meta.tests || []).map((t: any, i: number) => (
            <p key={`t${i}`} className={t.status === "passed" ? "text-teal" : "text-destructive"}>
              {t.status === "passed" ? "✓" : "✕"} {t.name} — {t.detail}
            </p>
          ))}
          {(meta.issuesFixed || []).map((x: any, i: number) => (
            <p key={`f${i}`} className="text-purple">⚠ {x.issue} → fixed in {x.file}: {x.fix}</p>
          ))}
        </div>
      )}

      {tab === "deps" && (
        <div className="p-4 space-y-2 overflow-auto max-h-[460px] flex-1">
          {(meta.stack || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {(meta.stack || []).map((s: string) => (
                <span key={s} className="text-[11px] px-2 py-0.5 rounded-full bg-blue/10 text-blue">{s}</span>
              ))}
            </div>
          )}
          {(meta.dependencies || []).length === 0 && <p className="text-xs text-muted-foreground">No dependencies configured yet.</p>}
          {(meta.dependencies || []).map((d: any) => (
            <div key={d.name} className="flex items-start gap-2 text-xs border-b border-border/60 pb-2">
              <Package size={13} className="text-teal mt-0.5 shrink-0" />
              <div>
                <span className="font-mono text-foreground">{d.name}</span>
                <span className="text-muted-foreground"> {d.version}</span>
                <p className="text-muted-foreground">{d.why}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "activity" && (
        <div className="p-4 space-y-1.5 overflow-auto max-h-[460px] flex-1">
          {activity.length === 0 && <p className="text-xs text-muted-foreground">The AI activity log appears here once the build starts.</p>}
          {activity.map((a) => <ActivityRow key={a.id} item={a} />)}
        </div>
      )}
    </section>
  );
}

export function ActivityRow({ item }: { item: ActivityItem }) {
  const icon = item.status === "completed" ? <Check size={13} className="text-teal" />
    : item.status === "processing" ? <Loader2 size={13} className="animate-spin text-blue" />
    : item.status === "warning" ? <AlertTriangle size={13} className="text-purple" />
    : item.status === "error" ? <AlertTriangle size={13} className="text-destructive" />
    : <Circle size={13} className="text-muted-foreground/50" />;
  return (
    <div className="flex items-center gap-2 text-xs">
      {icon}
      <span className={item.status === "pending" ? "text-muted-foreground" : "text-foreground"}>{item.label}</span>
      <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">{item.stage}</span>
    </div>
  );
}

function Tree({ nodes, depth, active, onSelect, open, setOpen }: {
  nodes: TreeNode[]; depth: number; active: string | null;
  onSelect: (p: string) => void; open: Record<string, boolean>; setOpen: (o: Record<string, boolean>) => void;
}) {
  return (
    <ul>
      {nodes.map((n) => {
        const isOpen = open[n.path] ?? depth < 1;
        return (
          <li key={n.path}>
            <button
              onClick={() => (n.children ? setOpen({ ...open, [n.path]: !isOpen }) : onSelect(n.path))}
              style={{ paddingLeft: 6 + depth * 12 }}
              className={`w-full text-left flex items-center gap-1 py-1 pr-2 rounded text-xs transition ${active === n.path ? "bg-blue/10 text-blue" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"}`}
            >
              {n.children
                ? <>{isOpen ? <ChevronDown size={11} /> : <ChevronRight size={11} />}{isOpen ? <FolderOpen size={12} /> : <Folder size={12} />}</>
                : <FileIcon size={12} className="ml-3" />}
              <span className="truncate">{n.name}</span>
            </button>
            {n.children && isOpen && (
              <Tree nodes={n.children} depth={depth + 1} active={active} onSelect={onSelect} open={open} setOpen={setOpen} />
            )}
          </li>
        );
      })}
    </ul>
  );
}

export type { ProjectFile };
