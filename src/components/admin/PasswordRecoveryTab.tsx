import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Key, Check, X, Phone, User, ShieldAlert, Loader2 } from "lucide-react";

export function PasswordRecoveryTab() {
  const qc = useQueryClient();
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [resettingUser, setResettingUser] = useState<{ id: string; username: string; email: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");

  const { data: requests, isLoading } = useQuery({
    queryKey: ["admin-recovery-requests"],
    queryFn: async () => {
      const { data } = await supabase
        .from("password_recovery_requests")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const handleUpdateStatus = async (id: string, status: "resolved" | "rejected") => {
    setUpdatingId(id);
    const { error } = await supabase
      .from("password_recovery_requests")
      .update({ status })
      .eq("id", id);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(status === "resolved" ? "تم قبول الطلب وحله بنجاح" : "تم رفض الطلب");
      qc.invalidateQueries({ queryKey: ["admin-recovery-requests"] });
    }
    setUpdatingId(null);
  };

  const handleResetPasswordDirect = async (username: string) => {
    toast.info("جاري البحث عن ملف المستخدم...");
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, username, email, full_name")
      .eq("username", username)
      .maybeSingle();

    if (!profile) {
      toast.error(`لم يتم العثور على مستخدم باسم "${username}"`);
      return;
    }

    setResettingUser({
      id: profile.id,
      username: profile.username,
      email: profile.email || `${username}@hedma.local`,
    });
    setNewPassword("");
  };

  const executePasswordReset = async () => {
    if (!resettingUser) return;
    if (!newPassword.trim() || newPassword.length < 6) {
      toast.error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    toast.info("جاري تحديث كلمة المرور...");
    
    const { data, error } = await supabase.rpc("admin_update_user", {
      target_user_id: resettingUser.id,
      new_username: resettingUser.username,
      new_email: resettingUser.email,
      new_password: newPassword,
    });

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("تم تحديث كلمة المرور بنجاح! 🎉");
      
      await supabase
        .from("password_recovery_requests")
        .update({ status: "resolved" })
        .eq("username", resettingUser.username)
        .eq("status", "pending");
        
      qc.invalidateQueries({ queryKey: ["admin-recovery-requests"] });
      setResettingUser(null);
    }
  };

  return (
    <div className="space-y-6">
      {resettingUser && (
        <div className="rounded-3xl border bg-card p-6 shadow-md border-gold-gradient/30 animate-in fade-in duration-300">
          <h3 className="font-bold text-lg mb-2 flex items-center gap-2 text-gold">
            <Key className="size-5" /> تغيير كلمة المرور للمستخدم: {resettingUser.username}
          </h3>
          <p className="text-xs text-muted-foreground mb-4">سيتم تغيير كلمة المرور المشفرة مباشرة وتحديث الجلسات.</p>
          
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-xs font-bold text-muted-foreground block">كلمة المرور الجديدة</label>
              <Input
                type="text"
                placeholder="أدخل كلمة مرور قوية (6 أحرف فأكثر)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-xl border-gold-gradient/20 animate-none"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={executePasswordReset} className="gradient-gold text-primary font-bold rounded-xl h-10 px-5">حفظ كلمة المرور</Button>
              <Button variant="ghost" onClick={() => setResettingUser(null)} className="rounded-xl h-10">إلغاء</Button>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-3xl border bg-card overflow-hidden shadow-lg border-gold-gradient/10">
        <div className="p-5 border-b bg-muted/20 flex items-center justify-between">
          <h3 className="font-bold text-lg flex items-center gap-2">🔑 طلبات استعادة الحسابات</h3>
          <span className="text-xs bg-accent/40 px-3 py-1 rounded-full font-bold">إجمالي الطلبات: {requests?.length ?? 0}</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-muted/10">
              <tr className="border-b">
                <th className="p-4">اسم المستخدم</th>
                <th className="p-4">الهاتف</th>
                <th className="p-4">التاريخ</th>
                <th className="p-4">الحالة</th>
                <th className="p-4 text-center">العمليات</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-muted-foreground">
                    <Loader2 className="size-8 animate-spin mx-auto text-gold" />
                    <span className="text-xs block mt-2">جاري تحميل الطلبات...</span>
                  </td>
                </tr>
              ) : (requests ?? []).map((r) => {
                const isPending = r.status === "pending";
                return (
                  <tr key={r.id} className="border-t hover:bg-muted/5 transition-colors">
                    <td className="p-4 font-bold flex items-center gap-2">
                      <User className="size-4 text-gold-gradient" />
                      {r.username}
                    </td>
                    <td className="p-4 font-mono">
                      {r.phone ? (
                        <a href={`https://wa.me/${r.phone}`} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1 text-emerald-600 font-bold">
                          <Phone className="size-3" />
                          <span dir="ltr">{r.phone}</span>
                        </a>
                      ) : "—"}
                    </td>
                    <td className="p-4 text-muted-foreground text-xs">
                      {new Date(r.created_at).toLocaleString("ar-EG")}
                    </td>
                    <td className="p-4">
                      {r.status === "pending" && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 border border-yellow-500/20 font-bold">قيد الانتظار</span>
                      )}
                      {r.status === "resolved" && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 border border-green-500/20 font-bold">تم الحل ✅</span>
                      )}
                      {r.status === "rejected" && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 border border-red-500/20 font-bold">مرفوض</span>
                      )}
                    </td>
                    <td className="p-4 flex gap-2 justify-center">
                      {isPending && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs border-green-500 text-green-500 hover:bg-green-500/10"
                            disabled={updatingId === r.id}
                            onClick={() => handleUpdateStatus(r.id, "resolved")}
                          >
                            <Check className="size-3 ml-1" /> قبول
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs border-red-500 text-red-500 hover:bg-red-500/10"
                            disabled={updatingId === r.id}
                            onClick={() => handleUpdateStatus(r.id, "rejected")}
                          >
                            <X className="size-3 ml-1" /> رفض
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        className="h-8 text-xs gradient-gold text-primary font-bold"
                        onClick={() => handleResetPasswordDirect(r.username)}
                      >
                        <Key className="size-3 ml-1" /> تحديث كلمة المرور
                      </Button>
                    </td>
                  </tr>
                );
              })}

              {(requests ?? []).length === 0 && !isLoading && (
                <tr>
                  <td colSpan={5} className="p-16 text-center text-muted-foreground">
                    <ShieldAlert className="size-12 mx-auto text-muted-foreground opacity-50 mb-3" />
                    لا توجد طلبات استعادة كلمة المرور حالياً.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
