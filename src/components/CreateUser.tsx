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
    if (!form.username || !form.password) {
      return toast.error("يجب إدخال اسم المستخدم وكلمة المرور");
    }
    
    setLoading(true);
    const email = form.username.includes("@") ? form.username : `${form.username}@hedma.local`;
    
    // We use the secondary client to sign up the new user
    const { data, error } = await supabaseSecondary.auth.signUp({
      email,
      password: form.password,
      options: {
        data: {
          username: form.username,
          phone: form.phone || null,
          full_name: form.full_name || null,
        }
      }
    });

    setLoading(false);

    if (error) {
      toast.error("خطأ في إنشاء الحساب: " + error.message);
    } else {
      toast.success("تم إنشاء الحساب بنجاح ✅");
      // Optional: Since it signs in on the secondary client, we can sign it out immediately just to be clean
      await supabaseSecondary.auth.signOut();
      
      setForm({ username: "", password: "", phone: "", full_name: "" });
      qc.invalidateQueries({ queryKey: ["admin-profiles"] });
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-5 mb-6">
      <h3 className="font-bold mb-4 flex items-center gap-2"><UserPlus className="size-4" /> إضافة مستخدم جديد (تاجر / مندوب)</h3>
      <div className="grid md:grid-cols-5 gap-3 items-end">
        <div>
          <Label>اليوزر نيم</Label>
          <Input value={form.username} onChange={e => setForm({...form, username: e.target.value})} dir="ltr" className="text-left" />
        </div>
        <div>
          <Label>كلمة المرور</Label>
          <Input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} dir="ltr" className="text-left" />
        </div>
        <div>
          <Label>الاسم (اختياري)</Label>
          <Input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} />
        </div>
        <div>
          <Label>الموبايل (اختياري)</Label>
          <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} dir="ltr" className="text-left" />
        </div>
        <Button onClick={handleCreate} disabled={loading} className="w-full gradient-gold text-primary">
          {loading ? <Loader2 className="size-4 animate-spin ml-2" /> : <UserPlus className="size-4 ml-2" />}
          إضافة مستخدم
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-3">ملحوظة: يمكنك إعطاء الصلاحيات (تاجر / مندوب) للمستخدم الجديد من الجدول بالأسفل بعد إنشائه مباشرة.</p>
    </div>
  );
}
