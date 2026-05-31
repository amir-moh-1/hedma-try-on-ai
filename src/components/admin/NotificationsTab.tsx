import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Send, Users, User, Bell, Search, Loader2 } from "lucide-react";

type Profile = {
  id: string;
  username: string;
  full_name: string | null;
};

type SentNotification = {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  read: boolean;
  created_at: string;
  profiles: {
    username: string;
    full_name: string | null;
  } | null;
};

export function NotificationsTab() {
  const qc = useQueryClient();
  const [recipientType, setRecipientType] = useState<"specific" | "all">("specific");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);

  // Fetch profiles for the dropdown
  const { data: profiles = [], isLoading: isLoadingProfiles } = useQuery<Profile[]>({
    queryKey: ["admin-profiles-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, full_name")
        .order("username");
      if (error) throw error;
      return data as Profile[];
    },
  });

  // Fetch recently sent notifications
  const { data: sentLogs = [], isLoading: isLoadingLogs } = useQuery<SentNotification[]>({
    queryKey: ["admin-sent-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_notifications")
        .select("id, user_id, title, content, read, created_at, profiles(username, full_name)")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as unknown as SentNotification[];
    },
  });

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      return toast.error("برجاء إدخال عنوان الرسالة");
    }
    if (recipientType === "specific" && !selectedUserId) {
      return toast.error("برجاء اختيار العميل المستهدف");
    }

    setSending(true);
    try {
      if (recipientType === "specific") {
        const { error } = await supabase.from("user_notifications").insert({
          user_id: selectedUserId,
          title,
          content: content || null,
          read: false,
        });
        if (error) throw error;
        toast.success("تم إرسال الإشعار بنجاح للعميل");
      } else {
        // Send to all
        if (profiles.length === 0) {
          throw new Error("لا يوجد عملاء لإرسال الإشعار لهم");
        }
        const rows = profiles.map((p) => ({
          user_id: p.id,
          title,
          content: content || null,
          read: false,
        }));

        // Insert in batches or single call
        const { error } = await supabase.from("user_notifications").insert(rows);
        if (error) throw error;
        toast.success(`تم إرسال الإشعار بنجاح لـ ${profiles.length} عميل`);
      }

      // Reset form
      setTitle("");
      setContent("");
      setSelectedUserId("");
      qc.invalidateQueries({ queryKey: ["admin-sent-notifications"] });
    } catch (err: any) {
      toast.error("خطأ أثناء الإرسال: " + err.message);
    } finally {
      setSending(false);
    }
  };

  const filteredProfiles = profiles.filter(
    (p) =>
      p.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-card border rounded-3xl p-6 shadow-sm border-gold-gradient/10">
        <h3 className="font-bold text-xl mb-6 flex items-center gap-2 text-gold-gradient">
          <Bell className="size-5" /> إرسال إشعار جديد
        </h3>

        <form onSubmit={handleSend} className="space-y-5">
          {/* Recipient Selector Tabs */}
          <div className="space-y-2">
            <Label className="text-sm font-bold">المستلمون</Label>
            <div className="flex bg-muted/30 p-1 rounded-xl border border-gold-gradient/10 w-fit">
              <button
                type="button"
                onClick={() => setRecipientType("specific")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  recipientType === "specific"
                    ? "gradient-gold text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <User className="size-3.5" />
                إرسال لعميل محدد
              </button>
              <button
                type="button"
                onClick={() => setRecipientType("all")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  recipientType === "all"
                    ? "gradient-gold text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Users className="size-3.5" />
                إرسال للجميع ({profiles.length})
              </button>
            </div>
          </div>

          {/* Specific User Dropdown */}
          {recipientType === "specific" && (
            <div className="space-y-2">
              <Label htmlFor="user-select" className="text-sm font-bold">
                اختر العميل
              </Label>
              <div className="relative max-w-md">
                <Search className="size-4 text-muted-foreground absolute right-3 top-3" />
                <Input
                  type="text"
                  placeholder="ابحث عن العميل بالاسم أو اسم المستخدم..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-9 rounded-xl border-gold-gradient/20 mb-2 h-10 text-sm"
                />
                <select
                  id="user-select"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-gold-gradient/20 bg-background text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D4A017]"
                >
                  <option value="">-- اختر من القائمة --</option>
                  {filteredProfiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.username} {p.full_name ? `(${p.full_name})` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Title */}
          <div className="space-y-2 max-w-md">
            <Label htmlFor="title" className="text-sm font-bold">
              عنوان الإشعار
            </Label>
            <Input
              id="title"
              placeholder="مثال: خصم 20% لفترة محدودة! 🔥"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl border-gold-gradient/20 h-10 text-sm"
            />
          </div>

          {/* Message Content */}
          <div className="space-y-2">
            <Label htmlFor="content" className="text-sm font-bold">
              محتوى الإشعار
            </Label>
            <Textarea
              id="content"
              placeholder="اكتب هنا تفاصيل الإشعار التي ستظهر للمستخدم..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="rounded-xl border-gold-gradient/20 text-sm resize-none"
            />
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            disabled={sending}
            className="gradient-gold text-primary hover:opacity-90 font-bold px-6 py-2 rounded-xl transition-all shadow-luxe"
          >
            {sending ? (
              <>
                <Loader2 className="size-4 animate-spin ml-2" />
                جاري الإرسال...
              </>
            ) : (
              <>
                <Send className="size-4 ml-2" />
                إرسال الإشعار
              </>
            )}
          </Button>
        </form>
      </div>

      {/* Log of sent notifications */}
      <div className="rounded-3xl border bg-card overflow-hidden shadow-lg border-gold-gradient/10">
        <div className="p-5 border-b bg-muted/20 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base">سجل الإشعارات المرسلة</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              آخر 50 إشعار تم إرسالهم للعملاء
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoadingLogs ? (
            <div className="py-12 text-center text-muted-foreground">
              <Loader2 className="size-8 animate-spin mx-auto text-gold-gradient mb-2" />
              <span>جاري تحميل السجل...</span>
            </div>
          ) : sentLogs.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <span>لم يتم إرسال أي إشعارات بعد.</span>
            </div>
          ) : (
            <table className="w-full text-sm text-right">
              <thead className="bg-muted/10">
                <tr className="border-b">
                  <th className="p-4">العميل المستلم</th>
                  <th className="p-4">عنوان الإشعار</th>
                  <th className="p-4">المحتوى</th>
                  <th className="p-4">تاريخ الإرسال</th>
                  <th className="p-4 text-center">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {sentLogs.map((log) => (
                  <tr key={log.id} className="border-t hover:bg-muted/5 transition-colors">
                    <td className="p-4 font-bold">
                      {log.profiles ? (
                        <>
                          <span>{log.profiles.username}</span>
                          {log.profiles.full_name && (
                            <span className="text-xs text-muted-foreground mr-1">
                              ({log.profiles.full_name})
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">مستخدم محذوف</span>
                      )}
                    </td>
                    <td className="p-4 font-medium">{log.title}</td>
                    <td className="p-4 text-xs text-muted-foreground max-w-xs truncate">
                      {log.content ?? "—"}
                    </td>
                    <td className="p-4 text-xs text-muted-foreground" dir="ltr">
                      {new Date(log.created_at).toLocaleString("ar-EG")}
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          log.read
                            ? "bg-green-500/10 text-green-500"
                            : "bg-amber-500/10 text-amber-500"
                        }`}
                      >
                        {log.read ? "مقروء" : "غير مقروء"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
