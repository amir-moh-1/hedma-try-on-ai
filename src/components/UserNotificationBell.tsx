import { useEffect, useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Bell, Check, CheckCheck } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";

type UserNotification = {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  read: boolean;
  created_at: string;
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return "الآن";
  if (minutes < 60) return `منذ ${minutes} د`;
  if (hours < 24) return `منذ ${hours} س`;
  if (days < 7) return `منذ ${days} ي`;
  return new Date(dateStr).toLocaleDateString("ar-EG", {
    day: "numeric",
    month: "short",
  });
}

export function UserNotificationBell() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);

  const userId = user?.id;

  const { data: notifications = [] } = useQuery<UserNotification[]>({
    queryKey: ["user_notifications", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_notifications")
        .select("*")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as UserNotification[];
    },
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Realtime subscription
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`user-notifs-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "user_notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newNotif = payload.new as UserNotification;
          toast.info(`🔔 ${newNotif.title}`, {
            description: newNotif.content ?? undefined,
          });
          qc.invalidateQueries({ queryKey: ["user_notifications", userId] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "user_notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["user_notifications", userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, qc]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        bellRef.current &&
        !bellRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleMarkRead = async (id: string) => {
    await supabase
      .from("user_notifications")
      .update({ read: true })
      .eq("id", id);
    qc.invalidateQueries({ queryKey: ["user_notifications", userId] });
  };

  const handleMarkAllRead = async () => {
    if (!userId) return;
    const { error } = await supabase
      .from("user_notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
    if (error) {
      toast.error(error.message);
    } else {
      qc.invalidateQueries({ queryKey: ["user_notifications", userId] });
    }
  };

  if (!userId) return null;

  return (
    <div className="relative">
      {/* Bell Button */}
      <Button
        ref={bellRef}
        variant="ghost"
        size="icon"
        onClick={() => setOpen((v) => !v)}
        className="relative cursor-pointer"
        aria-label="الإشعارات"
      >
        <Bell className="size-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -left-0.5 flex h-[18px] min-w-[18px] items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-[18px] min-w-[18px] px-1 bg-red-500 text-[10px] text-white font-bold items-center justify-center">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          </span>
        )}
      </Button>

      {/* Dropdown Panel */}
      {open && (
        <div
          ref={panelRef}
          dir="rtl"
          className="absolute left-0 sm:left-auto sm:right-0 top-full mt-2 w-[calc(100vw-2rem)] sm:w-80 max-h-96 overflow-y-auto rounded-2xl border bg-card shadow-lg z-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <span className="font-bold text-sm">الإشعارات</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[11px] text-[#D4A017] hover:underline font-bold flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="size-3.5" />
                تعليم الكل كمقروء
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="py-1">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-muted-foreground flex flex-col items-center justify-center gap-2">
                <Bell className="size-8 opacity-30" />
                <span className="text-xs">لا توجد إشعارات حالياً</span>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    if (!n.read) handleMarkRead(n.id);
                  }}
                  className={`w-full text-right px-4 py-3 flex flex-col gap-1 transition-colors cursor-pointer hover:bg-muted/60 ${
                    !n.read ? "bg-[#D4A017]/5" : "opacity-75"
                  }`}
                >
                  <div className="flex items-start justify-between w-full gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      {!n.read ? (
                        <span className="shrink-0 mt-0.5 h-2 w-2 rounded-full bg-[#D4A017]" />
                      ) : (
                        <Check className="shrink-0 mt-0.5 size-3 text-muted-foreground opacity-50" />
                      )}
                      <span
                        className={`text-xs truncate ${
                          !n.read ? "font-black text-foreground" : "font-medium text-muted-foreground"
                        }`}
                      >
                        {n.title}
                      </span>
                    </div>
                    <span className="text-[9px] text-muted-foreground whitespace-nowrap shrink-0">
                      {timeAgo(n.created_at)}
                    </span>
                  </div>
                  {n.content && (
                    <p className="text-[11px] text-muted-foreground text-right pr-3.5 line-clamp-2">
                      {n.content}
                    </p>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
