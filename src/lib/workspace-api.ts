// YAIDEV Universal Processing Workspace — service layer.
// The UI talks ONLY to these functions, never to a model or table directly.
// Swapping in a different YAIDEV backend engine later means changing this file only.
import { supabase } from "@/integrations/supabase/client";

export type Category =
  | "websites" | "apps" | "software" | "games" | "robots" | "agents" | "models";

export type RunState = "queued" | "processing" | "running" | "completed" | "failed";
export type ActivityStatus = "pending" | "processing" | "completed" | "warning" | "error";

export interface ProjectFile { path: string; language: string; content: string }
export interface ActivityItem { id: string; label: string; stage: string; status: ActivityStatus; detail?: string }
export interface ProjectVersion { n: number; label: string; at: string; files: ProjectFile[] }

export interface WorkspaceSession {
  id: string;
  user_id: string;
  category: Category;
  prompt: string;
  project_name: string | null;
  slug: string | null;
  favicon_url: string | null;
  custom_domain: string | null;
  domain_status: string;
  ssl_status: string;
  stage: string;
  progress: number;
  state: string;
  deployment_status: string;
  files: ProjectFile[];
  activity: ActivityItem[];
  versions: ProjectVersion[];
  result: any;
  metadata: any;
  created_at: string;
  updated_at: string;
}

export const CATEGORY_LABEL: Record<Category, string> = {
  websites: "Website", apps: "Mobile App", software: "Desktop Software",
  games: "Game", robots: "Robot", agents: "AI Agent", models: "AI Model",
};

export const STAGES = [
  "planning", "architecture", "coding", "dependencies", "database",
  "integrations", "testing", "fixing", "optimization", "deployment", "completed",
] as const;

export function slugify(s: string): string {
  return (s || "project").toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "").slice(0, 40) || "project";
}

/** Public YAIDEV workspace URL for a project. Never hard-coded per project. */
export function projectUrl(s: Pick<WorkspaceSession, "slug" | "id" | "category" | "custom_domain">): string {
  if (s.custom_domain) return `https://${s.custom_domain}`;
  const base = s.slug || slugify(s.id.slice(0, 8));
  const suffix = s.category === "websites" ? "yaidev.app" : "workspace.yaidev.app";
  return `https://${base}.${suffix}`;
}

function normalize(row: any): WorkspaceSession {
  return {
    ...row,
    files: Array.isArray(row.files) ? row.files : [],
    activity: Array.isArray(row.activity) ? row.activity : [],
    versions: Array.isArray(row.versions) ? row.versions : [],
  } as WorkspaceSession;
}

export async function createSession(category: Category, prompt: string, userId: string, attachments: any[] = []) {
  const { data, error } = await supabase.from("build_sessions").insert({
    user_id: userId,
    category,
    prompt: prompt.trim(),
    state: "queued",
    stage: "queued",
    metadata: { attachments },
  } as any).select("id").single();
  if (error) throw new Error(error.message);
  return (data as any).id as string;
}

export async function getSession(id: string): Promise<WorkspaceSession | null> {
  const { data, error } = await supabase.from("build_sessions").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalize(data) : null;
}

export async function listSessions(userId: string): Promise<WorkspaceSession[]> {
  const { data } = await supabase.from("build_sessions").select("*")
    .eq("user_id", userId).order("updated_at", { ascending: false }).limit(30);
  return (data || []).map(normalize);
}

async function call(action: string, payload: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("ai-workspace", { body: { action, ...payload } });
  if (error) throw new Error(error.message || "Workspace engine unreachable");
  const res = data as any;
  if (!res?.ok) {
    const err: any = new Error(res?.error || "Workspace request failed");
    err.requiresPayment = !!res?.requiresPayment;
    err.requiresAuth = !!res?.requiresAuth;
    throw err;
  }
  return res;
}

export const workspaceApi = {
  plan: (session_id: string) => call("plan", { session_id }),
  generate: (session_id: string) => call("generate", { session_id }),
  patch: (session_id: string, instruction: string) => call("patch", { session_id, instruction }),
  setMeta: (session_id: string, patch: { project_name?: string; favicon_url?: string | null }) =>
    call("meta", { session_id, ...patch }),
  connectDomain: (session_id: string, domain: string) => call("domain", { session_id, op: "connect", domain }),
  verifyDomain: (session_id: string) => call("domain", { session_id, op: "verify" }),
  disconnectDomain: (session_id: string) => call("domain", { session_id, op: "disconnect" }),
};

/** Build a self-contained HTML document for the Final Result preview. */
export function buildPreviewDoc(files: ProjectFile[], previewFile?: string): string | null {
  if (!files.length) return null;
  const find = (p: string) => files.find((f) => f.path.toLowerCase() === p.toLowerCase());
  const html =
    (previewFile ? find(previewFile) : null) ||
    find("index.html") || find("preview/index.html") || find("public/index.html") ||
    files.find((f) => f.path.endsWith(".html"));
  if (!html) return null;

  let doc = html.content;
  // Inline local stylesheets and scripts so the preview renders without a server.
  doc = doc.replace(/<link[^>]+href=["']([^"']+\.css)["'][^>]*>/gi, (m, href) => {
    const css = files.find((f) => f.path.endsWith(String(href).replace(/^\.?\//, "")));
    return css ? `<style>\n${css.content}\n</style>` : m;
  });
  doc = doc.replace(/<script[^>]+src=["']([^"']+\.js)["'][^>]*>\s*<\/script>/gi, (m, src) => {
    const js = files.find((f) => f.path.endsWith(String(src).replace(/^\.?\//, "")));
    return js ? `<script>\n${js.content}\n</script>` : m;
  });
  return doc;
}

/** Turn a flat file list into a nested tree for the explorer. */
export interface TreeNode { name: string; path: string; children?: TreeNode[]; file?: ProjectFile }
export function buildTree(files: ProjectFile[]): TreeNode[] {
  const root: TreeNode[] = [];
  for (const f of [...files].sort((a, b) => a.path.localeCompare(b.path))) {
    const parts = f.path.split("/");
    let level = root;
    parts.forEach((part, i) => {
      const isLeaf = i === parts.length - 1;
      const path = parts.slice(0, i + 1).join("/");
      let node = level.find((n) => n.name === part && !!n.children === !isLeaf);
      if (!node) {
        node = isLeaf ? { name: part, path, file: f } : { name: part, path, children: [] };
        level.push(node);
      }
      if (!isLeaf) level = node.children!;
    });
  }
  return root;
}

export async function downloadProject(name: string, files: ProjectFile[]) {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  files.forEach((f) => zip.file(f.path, f.content));
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slugify(name)}-yaidev.zip`;
  a.click();
  URL.revokeObjectURL(url);
}
