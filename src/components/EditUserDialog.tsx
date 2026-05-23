import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Edit, Save, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const ROLES = ["admin", "vendor", "customer", "delivery"] as const;
const ROLES_AR: Record<string, string> = {
  admin: "مدير",
  vendor: "تاجر",
  customer: "عميل",
  delivery: "مندوب"
};

export function EditUserDialog({ user, onClose }: { user: any, onClose: () => void }) {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: user.username || "",
    phone: user.phone || "",
    full_name: user.full_name || "",
    password: "",
  });
  const [selectedRoles, setSelectedRoles] = useState<string[]>(user.roles || []);

  const handleRoleToggle = (r: string) => {
    setSelectedRoles(prev => 
      prev.includes(r) ? prev.filter(x => x !== r) : [...prev, r]
    );
  };

  const handleSave = async () => {
    if (!form.username) return toast.error("اليوزر نيم مطلوب");
    
    setLoading(true);
    
    // 1. Update Profile & Auth Information via RPC
    const encodeUsername = (input: string) => {
      if (input.includes("@")) return input;
      const trimmed = input.trim();
      const isNonAscii = /[^\x00-\x7F]/.test(trimmed);
      if (isNonAscii) {
        const hex = Array.from(trimmed)
          .map(char => char.charCodeAt(0).toString(16).padStart(4, '0'))
          .join('');
        return `u_hex_${hex}`;
      }
      return trimmed;
    };

    const email = form.username.includes("@")
      ? form.username
      : `${encodeUsername(form.username).toLowerCase()}@hedma.local`;

    const { data: rpcSuccess, error: rpcError } = await supabase.rpc("admin_update_user", {
      target_user_id: user.id,
      new_username: form.username.trim(),
      new_email: email,
      new_password: form.password.trim() || null,
      new_phone: form.phone.trim() || null,
      new_full_name: form.full_name.trim() || null
    });

    if (rpcError) {
      setLoading(false);
      if (rpcError.message.includes("23505") || rpcError.code === "23505") return toast.error("اليوزر نيم مستخدم من قبل");
      return toast.error("خطأ في حفظ الملف الشخصي: " + rpcError.message);
    }

    // 2. Update Roles (Sync with user_roles table)
    const { error: deleteRolesError } = await supabase.from("user_roles").delete().eq("user_id", user.id);
    if (deleteRolesError) {
      setLoading(false);
      return toast.error("خطأ في تحديث الصلاحيات: " + deleteRolesError.message);
    }

    if (selectedRoles.length > 0) {
      const inserts = selectedRoles.map(r => ({ user_id: user.id, role: r as any }));
      const { error: insertRolesError } = await supabase.from("user_roles").insert(inserts as any);
      if (insertRolesError) {
        setLoading(false);
        return toast.error("خطأ في إدخال الصلاحيات الجديدة: " + insertRolesError.message);
      }
    }

    setLoading(false);
    toast.success("تم تحديث بيانات وصلاحيات المستخدم بنجاح ✅");
    qc.invalidateQueries({ queryKey: ["admin-profiles"] });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card w-full max-w-md rounded-3xl p-6 shadow-luxe border border-gold-gradient/10 relative">
        <button onClick={onClose} className="absolute top-4 left-4 text-muted-foreground hover:text-foreground">
          <X className="size-5" />
        </button>
        <h3 className="font-bold text-lg mb-5 flex items-center gap-2 text-gold-gradient">
          <Edit className="size-5" /> تعديل بيانات وصلاحيات المستخدم
        </h3>
        
        <div className="space-y-4">
          <div>
            <Label className="font-bold">اليوزر نيم</Label>
            <Input value={form.username} onChange={e => setForm({...form, username: e.target.value})} dir="ltr" className="text-left rounded-xl border-gold-gradient/20" />
          </div>
          <div>
            <Label className="font-bold">الاسم الكامل</Label>
            <Input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="rounded-xl border-gold-gradient/20" />
          </div>
          <div>
            <Label className="font-bold">رقم الموبايل</Label>
            <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} dir="ltr" className="text-left rounded-xl border-gold-gradient/20" />
          </div>
          <div>
            <Label className="font-bold">كلمة المرور الجديدة (اختياري)</Label>
            <Input type="password" placeholder="اتركها فارغة لعدم التغيير" value={form.password} onChange={e => setForm({...form, password: e.target.value})} dir="ltr" className="text-left rounded-xl border-gold-gradient/20" />
          </div>

          <div>
            <Label className="font-bold block mb-2">تعديل الصلاحيات</Label>
            <div className="flex flex-wrap gap-2">
              {ROLES.map((r) => {
                const has = selectedRoles.includes(r);
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRoleToggle(r)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${
                      has 
                        ? "gradient-gold text-primary border-transparent shadow-sm" 
                        : "text-muted-foreground bg-muted/30 border-muted opacity-60 hover:opacity-100"
                    }`}
                  >
                    {ROLES_AR[r]}
                  </button>
                );
              })}
            </div>
          </div>

          <Button onClick={handleSave} disabled={loading} className="w-full gradient-gold text-primary mt-4 rounded-xl font-bold shadow-luxe">
            {loading ? <Loader2 className="size-4 animate-spin ml-2" /> : <Save className="size-4 ml-2" />}
            حفظ التعديلات
          </Button>
        </div>
      </div>
    </div>
  );
}
