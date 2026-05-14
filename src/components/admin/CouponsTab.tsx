import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Ticket, Trash2, Gift, Activity } from "lucide-react";
import { OffersManager } from "@/components/OffersManager";

export function CouponsTab() {
  const qc = useQueryClient();
  const { data: coupons } = useQuery({
    queryKey: ["admin-coupons-tab"],
    queryFn: async () => {
      const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
      const userIds = Array.from(new Set((data ?? []).map((c) => c.user_id)));
      const { data: profs } = userIds.length
        ? await supabase.from("profiles").select("id,username").in("id", userIds)
        : { data: [] };
      const m = new Map((profs ?? []).map((p) => [p.id, p.username]));
      return (data ?? []).map((c) => ({ ...c, username: m.get(c.user_id) ?? "—" }));
    },
  });

  const [coupon, setCoupon] = useState({ username: "", percent: 10, code: "", message: "خصم خاص ليك من Hedma 🎁" });

  const addCoupon = async () => {
    if (!coupon.username || !coupon.percent || !coupon.code) return toast.error("يرجى ملء كافة الحقول");
    const { data: prof } = await supabase.from("profiles").select("id").eq("username", coupon.username).maybeSingle();
    if (!prof) return toast.error("عذراً، هذا المستخدم غير مسجل في النظام");
    
    const { error } = await supabase.from("coupons").insert({ 
      user_id: prof.id, 
      percent: coupon.percent, 
      code: coupon.code, 
      message: coupon.message, 
      active: true 
    });
    
    if (error) return toast.error(error.message);
    toast.success("تم إصدار الكوبون بنجاح");
    setCoupon({ ...coupon, username: "", code: "" });
    qc.invalidateQueries({ queryKey: ["admin-coupons-tab"] });
  };

  const toggleCoupon = async (id: string, active: boolean) => {
    await supabase.from("coupons").update({ active: !active }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-coupons-tab"] });
  };

  const deleteCoupon = async (id: string) => {
    if (!confirm("حذف الكوبون؟")) return;
    await supabase.from("coupons").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-coupons-tab"] });
  };

  return (
    <div className="space-y-10 animate-in zoom-in-95 duration-500">
      <div className="bg-card border rounded-3xl p-8 shadow-sm border-gold-gradient/10">
        <h3 className="font-bold text-xl mb-6 flex items-center gap-2 text-gold-gradient"><Plus className="size-5" /> إصدار كوبون خصم جديد</h3>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="space-y-2"><Label className="text-xs font-bold text-muted-foreground">اسم المستخدم (Username)</Label><Input className="rounded-xl h-11" value={coupon.username} onChange={(e) => setCoupon({ ...coupon, username: e.target.value })} placeholder="مثال: ahmed123" /></div>
          <div className="space-y-2"><Label className="text-xs font-bold text-muted-foreground">كود الخصم</Label><Input className="rounded-xl h-11" value={coupon.code} onChange={(e) => setCoupon({ ...coupon, code: e.target.value.toUpperCase() })} placeholder="HEDMA15" /></div>
          <div className="space-y-2"><Label className="text-xs font-bold text-muted-foreground">نسبة الخصم %</Label><Input className="rounded-xl h-11" type="number" value={coupon.percent} onChange={(e) => setCoupon({ ...coupon, percent: Number(e.target.value) })} /></div>
          <div className="flex items-end"><Button onClick={addCoupon} className="w-full gradient-gold text-primary rounded-xl h-11 font-black shadow-lg shadow-gold-gradient/10">إصدار الكوبون</Button></div>
          <div className="md:col-span-4 space-y-2"><Label className="text-xs font-bold text-muted-foreground">رسالة الكوبون للعميل</Label><Textarea rows={2} className="rounded-2xl" value={coupon.message} onChange={(e) => setCoupon({ ...coupon, message: e.target.value })} /></div>
        </div>
      </div>

      <div className="rounded-3xl border bg-card overflow-hidden shadow-lg">
        <div className="p-5 border-b bg-muted/20 flex items-center gap-2">
           <Ticket className="size-5 text-gold-gradient" />
           <h3 className="font-bold">سجل الكوبونات المصدرة</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-muted/10">
              <tr>
                <th className="p-4">المستخدم</th>
                <th className="p-4">الكود</th>
                <th className="p-4">قيمة الخصم</th>
                <th className="p-4">الحالة</th>
                <th className="p-4 text-center">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {coupons?.map((c) => (
                <tr key={c.id} className="border-t hover:bg-muted/5 transition-colors">
                  <td className="p-4 font-bold">{c.username}</td>
                  <td className="p-4 font-mono font-black text-gold-gradient">{c.code}</td>
                  <td className="p-4"><span className="px-3 py-1 bg-accent rounded-full font-bold">%{c.percent}</span></td>
                  <td className="p-4">
                    <button 
                      onClick={() => toggleCoupon(c.id, c.active)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${c.active ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}
                    >
                      {c.active ? "✅ نشط" : "⏸️ موقوف"}
                    </button>
                  </td>
                  <td className="p-4 text-center">
                    <Button size="icon" variant="ghost" onClick={() => deleteCoupon(c.id)} className="rounded-xl hover:bg-destructive/10 text-destructive">
                       <Trash2 className="size-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="pt-6">
        <div className="flex items-center gap-2 mb-6">
           <Activity className="size-5 text-gold-gradient" />
           <h3 className="font-bold text-xl">إدارة العروض المتقدمة</h3>
        </div>
        <OffersManager />
      </div>
    </div>
  );
}
