import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserPlus, Loader2 } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";

// Create a secondary client so it doesn't affect the admin's session
const supabaseSecondary = createClient(
  import.meta.env.VITE_SUPABASE_URL || "",
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || ""
);

export function CreateUser() {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    phone: "",
    full_name: "",
  });

  const handleCreate = async () => {
    if (!form.username || !form.password || !form.full_name || !form.phone) {
      return toast.error("يجب إدخال كافة الحقول الإلزامية");
    }
    
    setLoading(true);
    const email = form.username.includes("@") ? form.username : `${form.username}@hedma.local`;
    
    const { data, error } = await supabaseSecondary.auth.signUp({
      email,
      password: form.password,
      options: {
        data: {
          username: form.username,
          phone: form.phone,
          full_name: form.full_name,
        }
      }
    });

    if (error) {
      toast.error("خطأ في إنشاء الحساب: " + error.message);
    } else if (data.user) {
      // Insecure: Store plain text password for admin purposes (User Request)
      await supabaseSecondary.from("profiles").update({
        full_name: form.full_name,
        phone: form.phone,
        plain_password: form.password
      }).eq("id", data.user.id);

      toast.success("تم إنشاء الحساب بنجاح ✅");
      await supabaseSecondary.auth.signOut();
      setForm({ username: "", password: "", phone: "", full_name: "" });
      qc.invalidateQueries({ queryKey: ["admin-profiles"] });
    }
    setLoading(false);
  };

  return (
    <div className="rounded-2xl border bg-card p-5 mb-6">
      <h3 className="font-bold mb-4 flex items-center gap-2"><UserPlus className="size-4" /> إضافة مستخدم جديد (تاجر / مندوب)</h3>
      <div className="grid md:grid-cols-5 gap-3 items-end">
        <div>
          <Label>اليوزر نيم</Label>
          <Input value={form.username} onChange={e => setForm({...form, username: e.target.value})} dir="ltr" className="text-left" placeholder="User123" />
        </div>
        <div>
          <Label>كلمة المرور</Label>
          <Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} dir="ltr" className="text-left" />
        </div>
        <div>
          <Label>الاسم الكامل</Label>
          <Input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} placeholder="الاسم ثلاثي" />
        </div>
        <div>
          <Label>رقم الموبايل</Label>
          <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} dir="ltr" className="text-left" placeholder="01..." />
        </div>
        <Button onClick={handleCreate} disabled={loading} className="w-full gradient-gold text-primary">
          {loading ? <Loader2 className="size-4 animate-spin ml-2" /> : <UserPlus className="size-4 ml-2" />}
          إنشاء الحساب
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground mt-3">ملحوظة: كافة الحقول أعلاه إلزامية لضمان صحة بيانات التواصل مع التجار والمناديب.</p>
    </div>
  );
}
