import { supabase } from "@/integrations/supabase/client";

// Untyped tables (not yet in generated types) — cast supabase to any.
const sb = supabase as any;

export type Module = "social" | "email" | "office" | "company";

export interface ServiceProfile {
  id: string;
  user_id: string;
  module: Module;
  platform: string | null;
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ServiceItem {
  id: string;
  user_id: string;
  profile_id: string | null;
  module: Module;
  type: string;
  title: string;
  content: Record<string, any>;
  status: "draft" | "pending" | "approved" | "rejected" | "published";
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ApprovalRequest {
  id: string;
  user_id: string;
  item_id: string | null;
  module: Module;
  action: string;
  status: "pending" | "approved" | "rejected";
  note: string | null;
  decided_at: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  metadata: Record<string, any>;
  created_at: string;
}

export const getProfile = async (userId: string, module: Module, platform?: string) => {
  let q = sb.from("service_profiles").select("*").eq("user_id", userId).eq("module", module);
  q = platform ? q.eq("platform", platform) : q.is("platform", null);
  const { data } = await q.maybeSingle();
  return data as ServiceProfile | null;
};

export const listProfiles = async (userId: string, module: Module) => {
  const { data } = await sb.from("service_profiles").select("*").eq("user_id", userId).eq("module", module).order("created_at", { ascending: false });
  return (data || []) as ServiceProfile[];
};

export const upsertProfile = async (userId: string, module: Module, config: Record<string, any>, platform: string | null = null) => {
  // Manual upsert because unique index uses COALESCE.
  const existing = await getProfile(userId, module, platform || undefined);
  if (existing) {
    const { data } = await sb.from("service_profiles").update({ config }).eq("id", existing.id).select().single();
    return data as ServiceProfile;
  }
  const { data } = await sb.from("service_profiles").insert({ user_id: userId, module, platform, config }).select().single();
  return data as ServiceProfile;
};

export const createItem = async (item: Partial<ServiceItem> & { user_id: string; module: Module; type: string }) => {
  const { data, error } = await sb.from("service_items").insert(item).select().single();
  if (error) throw error;
  return data as ServiceItem;
};

export const listItems = async (userId: string, module: Module, status?: string) => {
  let q = sb.from("service_items").select("*").eq("user_id", userId).eq("module", module).order("created_at", { ascending: false }).limit(50);
  if (status) q = q.eq("status", status);
  const { data } = await q;
  return (data || []) as ServiceItem[];
};

export const updateItemStatus = async (id: string, status: ServiceItem["status"]) => {
  await sb.from("service_items").update({ status }).eq("id", id);
};

export const deleteItem = async (id: string) => {
  await sb.from("service_items").delete().eq("id", id);
};

export const requestApproval = async (userId: string, module: Module, itemId: string, action: string) => {
  await sb.from("service_items").update({ status: "pending" }).eq("id", itemId);
  await sb.from("approval_requests").insert({ user_id: userId, item_id: itemId, module, action, status: "pending" });
  await sb.from("notifications").insert({
    user_id: userId, kind: "approval", title: "Approval requested",
    body: `A ${module} ${action} is awaiting your approval.`, link: `/${module === "social" ? "social" : module === "email" ? "email" : module === "office" ? "office" : "company"}?tab=approvals`,
  });
};

export const decideApproval = async (approvalId: string, itemId: string | null, decision: "approved" | "rejected", note?: string) => {
  await sb.from("approval_requests").update({ status: decision, decided_at: new Date().toISOString(), note: note || null }).eq("id", approvalId);
  if (itemId) {
    await sb.from("service_items").update({ status: decision === "approved" ? "approved" : "rejected" }).eq("id", itemId);
  }
};

export const listApprovals = async (userId: string) => {
  const { data } = await sb.from("approval_requests").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50);
  return (data || []) as ApprovalRequest[];
};

export const listNotifications = async (userId: string) => {
  const { data } = await sb.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(20);
  return (data || []) as Notification[];
};

export const markNotificationRead = async (id: string) => {
  await sb.from("notifications").update({ read: true }).eq("id", id);
};

export const markAllNotificationsRead = async (userId: string) => {
  await sb.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false);
};

export const logActivity = async (userId: string, module: Module, action: string, metadata: Record<string, any> = {}) => {
  await sb.from("activity_logs").insert({ user_id: userId, module, action, metadata });
};

export const listActivity = async (userId: string, module?: Module) => {
  let q = sb.from("activity_logs").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(50);
  if (module) q = q.eq("module", module);
  const { data } = await q;
  return (data || []) as Array<{ id: string; module: Module; action: string; metadata: any; created_at: string }>;
};

export const callAiService = async (module: Module, action: string, body: { prompt?: string; profile?: any; context?: any }) => {
  const { data, error } = await supabase.functions.invoke("ai-service", { body: { module, action, ...body } });
  if (error) throw new Error(error.message || "AI service error");
  if ((data as any)?.error) throw new Error((data as any).error);
  return (data as any).result;
};
