import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Bell, Trash2, ShieldAlert } from "lucide-react";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { toast } from "sonner";

export function NotificationBell() {
  const qc = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10);
      return data ?? [];
    },
  });

  useEffect(() => {
    setUnreadCount(notifications.filter((n) => !n.read).length);
  }, [notifications]);

  useEffect(() => {
    const channel = supabase
      .channel("live-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const newNotif = payload.new as any;
          try {
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav");
            audio.volume = 0.5;
            audio.play();
          } catch {
            // Audio blocked
          }

          toast.info(`🔔 ${newNotif.title}`, {
            description: newNotif.content,
          });

          qc.invalidateQueries({ queryKey: ["notifications"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);

  const handleMarkAllRead = async () => {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("read", false);

    if (error) {
      toast.error(error.message);
    } else {
      qc.invalidateQueries({ queryKey: ["notifications"] });
    }
  };

  const handleMarkRead = async (id: string) => {
    await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  const handleClearAll = async () => {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("تم مسح جميع الإشعارات");
      qc.invalidateQueries({ queryKey: ["notifications"] });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="relative p-2 rounded-full hover:bg-muted text-foreground transition focus:outline-none cursor-pointer"
          aria-label="الإشعارات"
        >
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 left-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] text-white font-bold items-center justify-center">
                {unreadCount}
              </span>
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="center" className="w-80 max-h-96 overflow-y-auto rounded-2xl p-2 text-right z-50 bg-card border">
        <div className="flex items-center justify-between px-3 py-2 border-b">
          <span className="font-bold text-sm">الإشعارات الفورية</span>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] text-gold hover:underline font-bold cursor-pointer"
              >
                تحديد كقروء الكل
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-[10px] text-destructive hover:underline font-bold flex items-center gap-0.5 cursor-pointer"
              >
                <Trash2 className="size-2.5" /> مسح الكل
              </button>
            )}
          </div>
        </div>

        <div className="py-1">
          {notifications.map((n) => (
            <DropdownMenuItem
              key={n.id}
              onClick={() => handleMarkRead(n.id)}
              className={`flex flex-col items-start gap-1 p-3 rounded-xl cursor-pointer transition ${
                !n.read ? "bg-gold/5 font-bold" : "opacity-80"
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-black text-foreground">{n.title}</span>
                <span className="text-[9px] text-muted-foreground">
                  {new Date(n.created_at).toLocaleTimeString("ar-EG", { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {n.content && <p className="text-[11px] text-muted-foreground text-right">{n.content}</p>}
            </DropdownMenuItem>
          ))}

          {notifications.length === 0 && (
            <div className="py-8 text-center text-muted-foreground flex flex-col items-center justify-center">
              <ShieldAlert className="size-8 text-muted-foreground opacity-40 mb-2" />
              <span className="text-xs">لا توجد إشعارات جديدة حالياً</span>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
