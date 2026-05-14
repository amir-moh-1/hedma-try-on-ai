import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Edit, Users as UsersIcon, ShieldCheck } from "lucide-react";
import { CreateUser } from "@/components/CreateUser";
import { EditUserDialog } from "@/components/EditUserDialog";
import { toast } from "sonner";

export function UsersTab({ profiles }: { profiles: any[] }) {
  const qc = useQueryClient();
  const [editingUser, setEditingUser] = useState<any>(null);

  const setRole = async (uid: string, role: "admin" | "vendor" | "customer" | "delivery", on: boolean) => {
    if (on) await supabase.from("user_roles").insert({ user_id: uid, role });
    else await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", role);
    qc.invalidateQueries({ queryKey: ["admin-profiles"] });
    toast.success("تم تحديث صلاحيات المستخدم بنجاح");
  };

  const ROLES_AR: Record<string, string> = {
    admin: "مدير",
    vendor: "تاجر",
    customer: "عميل",
    delivery: "مندوب"
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-card border rounded-3xl p-6 shadow-sm border-gold-gradient/10">
         <h3 className="font-bold text-xl mb-6 flex items-center gap-2 text-gold-gradient"><UsersIcon className="size-5" /> إضافة مستخدم جديد</h3>
         <CreateUser />
      </div>

      <div className="rounded-3xl border bg-card overflow-hidden shadow-lg">
        <div className="p-5 border-b bg-muted/20 flex items-center gap-2">
           <ShieldCheck className="size-5 text-gold-gradient" />
           <h3 className="font-bold">قائمة المستخدمين والصلاحيات</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-muted/10">
              <tr>
                <th className="p-4">المستخدم</th>
                <th className="p-4">الاسم الكامل</th>
                <th className="p-4">التليفون</th>
                <th className="p-4">الصلاحيات الحالية</th>
                <th className="p-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((u) => (
                <tr key={u.id} className="border-t hover:bg-muted/5 transition-colors">
                  <td className="p-4 font-bold">{u.username}</td>
                  <td className="p-4 text-muted-foreground">{u.full_name ?? "—"}</td>
                  <td className="p-4 font-mono text-xs" dir="ltr">{u.phone ?? "—"}</td>
                  <td className="p-4">
                    <div className="flex gap-1.5 flex-wrap">
                      {(["admin", "vendor", "customer", "delivery"] as const).map((r) => {
                        const has = u.roles.includes(r);
                        return (
                          <button
                            key={r}
                            onClick={() => setRole(u.id, r, !has)}
                            className={`
                              px-3 py-1 rounded-full text-[10px] font-black border transition-all duration-200
                              ${has 
                                ? "gradient-gold text-primary border-transparent shadow-sm" 
                                : "text-muted-foreground hover:border-gold-gradient/30 bg-muted/30"}
                            `}
                          >
                            {ROLES_AR[r]}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={() => setEditingUser(u)}
                      className="rounded-xl hover:bg-gold-gradient/10 hover:text-gold-gradient"
                    >
                      <Edit className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {editingUser && <EditUserDialog user={editingUser} onClose={() => setEditingUser(null)} />}
    </div>
  );
}
