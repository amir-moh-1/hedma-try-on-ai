import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Edit, Save, X, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

export function EditUserDialog({ user, onClose }: { user: any, onClose: () => void }) {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    username: user.username || "",
    phone: user.phone || "",
    full_name: user.full_name || "",
  });

  const handleSave = async () => {
    if (!form.username) return toast.error("اليوزر نيم مطلوب");
    
    setLoading(true);
    const { error } = await supabase.from("profiles").update({
      username: form.username,
      phone: form.phone || null,
      full_name: form.full_name || null,
    }).eq("id", user.id);

    setLoading(false);

    if (error) {
      if (error.code === "23505") toast.error("اليوزر نيم مستخدم من قبل");
      else toast.error("خطأ في الحفظ: " + error.message);
    } else {
      toast.success("تم تحديث بيانات المستخدم ✅");
      qc.invalidateQueries({ queryKey: ["admin-profiles"] });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card w-full max-w-md rounded-2xl p-6 shadow-luxe relative">
        <button onClick={onClose} className="absolute top-4 left-4 text-muted-foreground hover:text-foreground">
          <X className="size-5" />
        </button>
        <h3 className="font-bold text-lg mb-5 flex items-center gap-2"><Edit className="size-5" /> تعديل بيانات المستخدم</h3>
        
        <div className="space-y-4">
          <div>
            <Label>اليوزر نيم</Label>
            <Input value={form.username} onChange={e => setForm({...form, username: e.target.value})} dir="ltr" className="text-left" />
          </div>
          <div>
            <Label>الاسم الكامل</Label>
            <Input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} />
          </div>
          <div>
            <Label>رقم الموبايل</Label>
            <Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} dir="ltr" className="text-left" />
          </div>
          <Button onClick={handleSave} disabled={loading} className="w-full gradient-gold text-primary mt-2">
            {loading ? <Loader2 className="size-4 animate-spin ml-2" /> : <Save className="size-4 ml-2" />}
            حفظ التعديلات
          </Button>
        </div>
      </div>
    </div>
  );
}
