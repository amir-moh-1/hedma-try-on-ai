import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit, Users as UsersIcon, ShieldCheck, Trash2, Ban, UserCheck, Eye, EyeOff, Search } from "lucide-react";
import { CreateUser } from "@/components/CreateUser";
import { EditUserDialog } from "@/components/EditUserDialog";
import { toast } from "sonner";
import { useSiteSettings } from "@/lib/settings";
import { useAuth } from "@/lib/auth";

export function UsersTab({ profiles }: { profiles: any[] }) {
  const qc = useQueryClient();
  const { user: currentUser } = useAuth();
  const [editingUser, setEditingUser] = useState<any>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const settings = useSiteSettings();

  const mergedProfiles = profiles.map(p => ({
    ...p,
    is_banned: p.is_banned || settings?.banned_users?.[p.id] || false,
    plain_password: p.plain_password || settings?.user_passwords?.[p.id] || null
  }));

  const setRole = async (uid: string, role: "admin" | "vendor" | "customer" | "delivery", on: boolean) => {
    if (on) await supabase.from("user_roles").insert({ user_id: uid, role });
    else await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", role);
    qc.invalidateQueries({ queryKey: ["admin-profiles"] });
    toast.success("تم تحديث صلاحيات المستخدم بنجاح");
  };

  const toggleBan = async (uid: string, currentStatus: boolean) => {
    if (uid === currentUser?.id) {
      return toast.error("لا يمكنك حظر أو تعطيل حسابك الشخصي!");
    }

    const newStatus = !currentStatus;
    const { error } = await supabase.from("profiles").update({ is_banned: newStatus } as any).eq("id", uid);
    
    if (error && (error.message.includes("400") || error.message.includes("column"))) {
      // Shadow Storage Fallback
      const { data: s } = await supabase.from("site_settings").select("quick_links").eq("id", "main").maybeSingle();
      
      let links = [];
      let meta = {};
      
      if (s?.quick_links) {
        if (Array.isArray(s.quick_links)) {
          links = s.quick_links;
        } else {
          links = (s.quick_links as any).links || [];
          meta = (s.quick_links as any).__metadata || {};
        }
      }

      const banned = (meta as any).banned_users || {};
      
      const { error: shadowError } = await supabase.from("site_settings").update({
        quick_links: {
          links: links,
          __metadata: { ...meta, banned_users: { ...banned, [uid]: newStatus } }
        }
      }).eq("id", "main");
      
      if (shadowError) return toast.error("خطأ في الحفظ: " + shadowError.message);
      toast.success(newStatus ? "تم حظر المستخدم (وضع التوافق)" : "تم فك الحظر (وضع التوافق)");
    } else if (error) {
      return toast.error(error.message);
    } else {
      toast.success(newStatus ? "تم حظر المستخدم بنجاح" : "تم فك حظر المستخدم");
    }
    
    qc.invalidateQueries({ queryKey: ["admin-profiles"] });
    qc.invalidateQueries({ queryKey: ["site-settings"] });
  };

  const deleteUser = async (uid: string) => {
    if (uid === currentUser?.id) {
      return toast.error("لا يمكنك حذف حسابك الشخصي!");
    }

    if (!confirm("هل أنت متأكد من حذف هذا الحساب نهائياً؟ لا يمكن التراجع عن هذا الإجراء.")) return;
    const { error } = await supabase.from("profiles").delete().eq("id", uid);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-profiles"] });
    toast.success("تم حذف بيانات المستخدم من النظام");
  };

  const handlePasswordReveal = (uid: string) => {
    if (showPasswords[uid]) {
      setShowPasswords(prev => ({ ...prev, [uid]: false }));
    } else {
      setShowPasswords(prev => ({ ...prev, [uid]: true }));
      // Automatically hide password after 10 seconds as requested
      setTimeout(() => {
        setShowPasswords(prev => ({ ...prev, [uid]: false }));
      }, 10000);
    }
  };

  const ROLES_AR: Record<string, string> = {
    admin: "مدير",
    vendor: "تاجر",
    customer: "عميل",
    delivery: "مندوب"
  };

  // Filter profiles based on Search and Role Filter
  const filteredProfiles = mergedProfiles.filter(u => {
    const matchesSearch = 
      (u.username?.toLowerCase() || "").includes(q.toLowerCase()) ||
      (u.full_name?.toLowerCase() || "").includes(q.toLowerCase()) ||
      (u.phone || "").includes(q);

    const matchesRole = 
      roleFilter === "all" ||
      u.roles.includes(roleFilter);

    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-card border rounded-3xl p-6 shadow-sm border-gold-gradient/10">
         <h3 className="font-bold text-xl mb-6 flex items-center gap-2 text-gold-gradient"><UsersIcon className="size-5" /> إضافة مستخدم جديد</h3>
         <CreateUser />
      </div>

      <div className="rounded-3xl border bg-card overflow-hidden shadow-lg border-gold-gradient/10">
        <div className="p-5 border-b bg-muted/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="flex items-center gap-2">
             <ShieldCheck className="size-5 text-gold-gradient" />
             <div>
               <h3 className="font-bold text-base">إدارة الحسابات المتقدمة (Super-Admin)</h3>
               <p className="text-[10px] text-muted-foreground mt-0.5">صلاحيات كاملة: حظر / حذف / عرض كلمات المرور</p>
             </div>
           </div>
           
           {/* Search & Filter Controls */}
           <div className="flex flex-col sm:flex-row gap-3">
             <div className="relative">
               <Search className="size-4 text-muted-foreground absolute right-3 top-3" />
               <Input 
                 placeholder="ابحث بالاسم، اليوزر، أو الهاتف..." 
                 value={q} 
                 onChange={e => setQ(e.target.value)} 
                 className="pr-9 h-10 w-full sm:w-64 rounded-xl border-gold-gradient/20"
               />
             </div>

             <div className="flex bg-muted/30 p-1 rounded-xl border border-gold-gradient/10">
               {["all", "admin", "vendor", "customer", "delivery"].map((role) => (
                 <button
                   key={role}
                   onClick={() => setRoleFilter(role)}
                   className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                     roleFilter === role 
                       ? "gradient-gold text-primary shadow-sm" 
                       : "text-muted-foreground hover:text-foreground"
                   }`}
                 >
                   {role === "all" ? "الكل" : ROLES_AR[role] || role}
                 </button>
               ))}
             </div>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-muted/10">
              <tr className="border-b">
                <th className="p-4">المستخدم</th>
                <th className="p-4">الاسم الكامل</th>
                <th className="p-4">التليفون</th>
                <th className="p-4">كلمة المرور</th>
                <th className="p-4">الصلاحيات</th>
                <th className="p-4">الحالة</th>
                <th className="p-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredProfiles.map((u) => (
                <tr key={u.id} className={`border-t hover:bg-muted/5 transition-colors ${u.is_banned ? "bg-destructive/5" : ""}`}>
                  <td className="p-4">
                    <div className="font-bold">{u.username}</div>
                    <div className="text-[10px] text-muted-foreground font-mono">{u.id.slice(0,8)}</div>
                  </td>
                  <td className="p-4 text-muted-foreground">{u.full_name ?? "—"}</td>
                  <td className="p-4 font-mono text-xs" dir="ltr">{u.phone ?? "—"}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">
                        {showPasswords[u.id] ? (u.plain_password ?? "غير متوفر") : "••••••••"}
                      </span>
                      <button onClick={() => handlePasswordReveal(u.id)} className="text-muted-foreground hover:text-foreground">
                        {showPasswords[u.id] ? <EyeOff className="size-3.5 text-gold-gradient" /> : <Eye className="size-3.5" />}
                      </button>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-1 flex-wrap">
                      {(["admin", "vendor", "customer", "delivery"] as const).map((r) => {
                        const has = u.roles.includes(r);
                        return (
                          <button key={r} onClick={() => setRole(u.id, r, !has)}
                            className={`px-2 py-0.5 rounded-full text-[9px] font-black border transition-all
                              ${has ? "gradient-gold text-primary border-transparent" : "text-muted-foreground bg-muted/30 opacity-60"}`}>
                            {ROLES_AR[r]}
                          </button>
                        );
                      })}
                    </div>
                  </td>
                  <td className="p-4">
                    {u.is_banned ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/10 text-destructive font-bold flex items-center gap-1 w-fit">
                        <Ban className="size-3" /> معطل 🚫
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 font-bold flex items-center gap-1 w-fit">
                        <UserCheck className="size-3" /> نشط 🔓
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      {/* ✏️ Edit user dialog button */}
                      <Button size="icon" variant="ghost" onClick={() => setEditingUser(u)} title="تعديل" className="size-8 rounded-lg hover:bg-gold-gradient/10 hover:text-gold-gradient"><Edit className="size-4" /></Button>
                      
                      {/* 🚫 / 🔓 Ban / Re-enable toggles */}
                      {u.id !== currentUser?.id && (
                        <>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => toggleBan(u.id, !!u.is_banned)} 
                            title={u.is_banned ? "تنشيط 🔓" : "تعطيل 🚫"}
                            className={`size-8 rounded-lg ${u.is_banned ? "text-green-600 hover:bg-green-50" : "text-amber-600 hover:bg-amber-50"}`}
                          >
                            {u.is_banned ? <UserCheck className="size-4" /> : <Ban className="size-4" />}
                          </Button>

                          {/* 🗑️ Delete permanently */}
                          <Button size="icon" variant="ghost" onClick={() => deleteUser(u.id)} title="حذف نهائي" className="size-8 rounded-lg text-destructive hover:bg-destructive/10"><Trash2 className="size-4" /></Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredProfiles.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-muted-foreground">
                    لا توجد حسابات مطابقة للبحث أو الفلتر المختار.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {editingUser && <EditUserDialog user={editingUser} onClose={() => setEditingUser(null)} />}
    </div>
  );
}
