import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Activity, Clock, User, Info } from "lucide-react";

export function ActivityTab() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["admin-activity-logs"],
    queryFn: async () => {
      const { data } = await supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(200);
      const userIds = Array.from(new Set((data ?? []).map((l) => l.user_id).filter(Boolean) as string[]));
      const { data: profs } = userIds.length
        ? await supabase.from("profiles").select("id,username").in("id", userIds)
        : { data: [] };
      const m = new Map((profs ?? []).map((p) => [p.id, p.username]));
      return (data ?? []).map((l) => ({ ...l, username: l.user_id ? (m.get(l.user_id) ?? "—") : "زائر" }));
    },
    refetchInterval: 30_000,
  });

  if (isLoading) return <div className="p-20 text-center animate-pulse">جاري تحميل سجل النشاط...</div>;

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="rounded-3xl border bg-card overflow-hidden shadow-lg border-gold-gradient/5">
        <div className="p-5 border-b bg-muted/20 flex items-center gap-2">
           <Activity className="size-5 text-gold-gradient" />
           <h3 className="font-bold">سجل العمليات الأخير</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-muted/10">
              <tr>
                <th className="p-4 flex items-center gap-2 font-bold"><Clock className="size-3 text-muted-foreground" /> الوقت</th>
                <th className="p-4 font-bold"><User className="size-3 text-muted-foreground" /> المستخدم</th>
                <th className="p-4 font-bold">العملية</th>
                <th className="p-4 font-bold"><Info className="size-3 text-muted-foreground" /> التفاصيل</th>
              </tr>
            </thead>
            <tbody>
              {logs?.map((l) => (
                <tr key={l.id} className="border-t hover:bg-muted/5 transition-colors">
                  <td className="p-4 text-xs text-muted-foreground font-mono ltr text-right">{new Date(l.created_at).toLocaleString("ar-EG")}</td>
                  <td className="p-4 font-black text-gold-gradient">{l.username}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-lg bg-accent/50 text-[10px] font-black uppercase tracking-tight">
                      {l.action}
                    </span>
                  </td>
                  <td className="p-4 text-[10px] text-muted-foreground font-mono max-w-xs truncate" dir="ltr">
                    {JSON.stringify(l.details)}
                  </td>
                </tr>
              ))}
              {logs?.length === 0 && (
                <tr><td colSpan={4} className="p-20 text-center text-muted-foreground">لا توجد سجلات مسجلة حتى الآن</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
