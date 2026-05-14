import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth, logActivity } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { User, Lock, Save, Loader2 } from "lucide-react";

export const Route = createFileRoute("/profile")({ component: Profile });

function Profile() {
  const { user, profile, refreshRoles } = useAuth();
  const nav = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: "",
    full_name: "",
    phone: "",
  });
  const [passForm, setPassForm] = useState({
    new_password: "",
    confirm_password: "",
  });

  useEffect(() => {
    if (!user) {
      nav({ to: "/auth" });
      return;
    }
    if (profile) {
      setForm({
        username: profile.username || "",
        full_name: profile.full_name || "",
        phone: profile.phone || "",
      });
    }
  }, [user, profile, nav]);

  const updateProfile = async () => {
    if (!user) return;
    if (!form.username.trim()) return toast.error("اليوزر نيم مطلوب");
    
    setLoading(true);
    const { error } = await supabase.from("profiles").update({
      username: form.username,
      full_name: form.full_name,
      phone: form.phone,
    }).eq("id", user.id);

    setLoading(false);
    
    if (error) {
      if (error.code === "23505") toast.error("اليوزر نيم ده مستخدم قبل كده، جرب واحد تاني");
      else toast.error("حصل خطأ: " + error.message);
    } else {
      toast.success("تم تحديث بياناتك بنجاح");
      await refreshRoles();
      logActivity("profile_update", { fields: ["username", "full_name", "phone"] });
    }
  };

  const updatePassword = async () => {
    if (!passForm.new_password) return toast.error("اكتب الباسورد الجديد");
    if (passForm.new_password !== passForm.confirm_password) return toast.error("الباسورد غير متطابق");
    if (passForm.new_password.length < 6) return toast.error("الباسورد لازم يكون 6 حروف أو أكتر");

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: passForm.new_password
    });
    setLoading(false);

    if (error) {
      toast.error("خطأ في تحديث الباسورد: " + error.message);
    } else {
      toast.success("تم تغيير الباسورد بنجاح 🔒");
      setPassForm({ new_password: "", confirm_password: "" });
      logActivity("password_update");
    }
  };

  if (!user || !profile) return <div className="p-10 text-center">جاري التحميل...</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 space-y-8">
      <h1 className="font-display text-3xl font-bold flex items-center gap-2">
        <User className="size-8" /> إعدادات الحساب
      </h1>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="rounded-2xl border bg-card p-6 shadow-luxe space-y-4">
            <h2 className="font-bold text-lg mb-4">البيانات الشخصية</h2>
            
            <div>
              <Label>اليوزر نيم (مطلوب)</Label>
              <Input value={form.username} onChange={e => setForm({...form, username: e.target.value})} dir="ltr" className="text-left" />
            </div>
            
            <div>
              <Label>الاسم بالكامل</Label>
              <Input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} />
            </div>

            <div>
              <Label>رقم التليفون</Label>
              <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} dir="ltr" className="text-left" />
            </div>

            <Button onClick={updateProfile} disabled={loading} className="w-full gradient-gold text-primary mt-2">
              {loading ? <Loader2 className="size-4 animate-spin ml-2" /> : <Save className="size-4 ml-2" />}
              حفظ البيانات
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border bg-card p-6 shadow-luxe space-y-4">
            <h2 className="font-bold text-lg mb-4 flex items-center gap-2"><Lock className="size-5" /> تغيير كلمة المرور</h2>
            
            <div>
              <Label>الباسورد الجديد</Label>
              <Input type="password" value={passForm.new_password} onChange={e => setPassForm({...passForm, new_password: e.target.value})} dir="ltr" className="text-left" />
            </div>
            
            <div>
              <Label>تأكيد الباسورد</Label>
              <Input type="password" value={passForm.confirm_password} onChange={e => setPassForm({...passForm, confirm_password: e.target.value})} dir="ltr" className="text-left" />
            </div>

            <Button onClick={updatePassword} disabled={loading} variant="outline" className="w-full border-primary/20 mt-2">
              {loading ? <Loader2 className="size-4 animate-spin ml-2" /> : <Lock className="size-4 ml-2" />}
              تغيير الباسورد
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
