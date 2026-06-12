import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { listNotifications, markAllNotificationsRead, markNotificationRead, type Notification } from "@/lib/service-api";
import { Link } from "react-router-dom";

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);

  const reload = async () => {
    if (!user) return;
    setItems(await listNotifications(user.id));
  };

  useEffect(() => { reload(); const t = setInterval(reload, 20000); return () => clearInterval(t); }, [user?.id]);

  const unread = items.filter(i => !i.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="relative h-9 w-9 rounded-full border border-border bg-card flex items-center justify-center hover:border-blue/40 transition"
        aria-label="Notifications"
      >
        <Bell size={16} className="text-foreground" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-white text-[10px] font-bold flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-auto bg-card border border-border rounded-xl shadow-xl z-50">
            <div className="flex items-center justify-between p-3 border-b border-border sticky top-0 bg-card">
              <span className="font-semibold text-sm">Notifications</span>
              <button
                onClick={async () => { if (user) { await markAllNotificationsRead(user.id); reload(); } }}
                className="text-xs text-blue hover:underline flex items-center gap-1"
              >
                <Check size={12} /> Mark all read
              </button>
            </div>
            {items.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">No notifications</div>
            ) : items.map(n => (
              <Link
                key={n.id}
                to={n.link || "#"}
                onClick={async () => { await markNotificationRead(n.id); reload(); setOpen(false); }}
                className={`block p-3 border-b border-border hover:bg-muted/50 ${!n.read ? "bg-blue/5" : ""}`}
              >
                <div className="flex items-start gap-2">
                  {!n.read && <span className="mt-1.5 h-2 w-2 rounded-full bg-blue shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                    {n.body && <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString()}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
