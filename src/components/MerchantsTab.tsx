import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { formatEGP } from "@/lib/format";
import { Store, Trash2, PlusCircle } from "lucide-react";

export function MerchantsTab({ profiles }: { profiles: { id: string; username: string; roles: string[] }[] }) {
  const qc = useQueryClient();
  const { data: merchants } = useQuery({
    queryKey: ["admin-merchants"],
    queryFn: async () => {
      const { data } = await supabase.from("merchants").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  
  const { data: counts } = useQuery({
    queryKey: ["merchant-product-counts"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("merchant_id,price,stock");
      const map = new Map<string, { count: number; stockValue: number }>();
      (data ?? []).forEach((p) => {
        if (!p.merchant_id) return;
        const cur = map.get(p.merchant_id) ?? { count: 0, stockValue: 0 };
        cur.count += 1;
        cur.stockValue += Number(p.price) * Number(p.stock ?? 0);
        map.set(p.merchant_id, cur);
      });
      return map;
    },
  });

  const vendors = profiles.filter((p) => p.roles.includes("vendor") || p.roles.includes("admin"));
  const [form, setForm] = useState({ id: "", shop_name: "", whatsapp: "", location: "", logo_url: "", owner_id: "", active: true });
  const reset = () => setForm({ id: "", shop_name: "", whatsapp: "", location: "", logo_url: "", owner_id: "", active: true });

  const save = async () => {
    if (!form.shop_name || !form.owner_id) return toast.error("اسم المحل والمالك مطلوبين");
    if (form.id) {
      const { error } = await supabase.from("merchants").update({
        shop_name: form.shop_name, whatsapp: form.whatsapp, location: form.location,
        logo_url: form.logo_url, owner_id: form.owner_id, active: form.active,
      }).eq("id", form.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("merchants").insert({
        shop_name: form.shop_name, whatsapp: form.whatsapp, location: form.location,
        logo_url: form.logo_url, owner_id: form.owner_id, active: form.active,
      });
      if (error) return toast.error(error.message);
    }
    toast.success("تم الحفظ بنجاح");
    reset();
    qc.invalidateQueries({ queryKey: ["admin-merchants"] });
  };

  const del = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا المحل؟")) return;
    await supabase.from("merchants").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-merchants"] });
    toast.success("تم الحذف");
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="rounded-3xl border bg-card p-6 shadow-sm border-gold-gradient/10">
        <h3 className="font-bold text-xl mb-6 flex items-center gap-2"><PlusCircle className="size-5 text-gold-gradient" /> {form.id ? "تعديل بيانات المحل" : "إضافة محل جديد للنظام"}</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2"><Label>اسم المحل *</Label><Input className="rounded-xl h-11" value={form.shop_name} onChange={(e) => setForm({ ...form, shop_name: e.target.value })} /></div>
          <div className="space-y-2">
            <Label>المالك (تاجر) *</Label>
            <Select value={form.owner_id} onValueChange={(v) => setForm({ ...form, owner_id: v })}>
              <SelectTrigger className="rounded-xl h-11"><SelectValue placeholder="اختر التاجر" /></SelectTrigger>
              <SelectContent className="rounded-xl">{vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.username}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>واتساب التواصل</Label><Input className="rounded-xl h-11" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="201xxxxxxxxx" /></div>
          <div className="space-y-2"><Label>الموقع الجغرافي</Label><Input className="rounded-xl h-11" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          <div className="lg:col-span-2 space-y-2"><Label>رابط شعار المحل (Logo URL)</Label><Input className="rounded-xl h-11" value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} /></div>
        </div>
        
        <div className="mt-6 flex items-center justify-between">
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className={`size-5 rounded border flex items-center justify-center transition-colors ${form.active ? "bg-gold-gradient border-transparent" : "border-muted group-hover:border-gold-gradient/50"}`}>
              <input type="checkbox" className="hidden" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              {form.active && <div className="size-2 bg-primary rounded-full" />}
            </div>
            <span className="text-sm font-semibold">تفعيل المحل على المنصة</span>
          </label>
          <div className="flex gap-3">
            <Button onClick={save} className="gradient-gold text-primary rounded-xl px-8 font-bold h-11 shadow-lg shadow-gold-gradient/10">{form.id ? "حفظ التغييرات" : "إضافة المحل"}</Button>
            {form.id && <Button variant="ghost" onClick={reset} className="rounded-xl h-11">إلغاء</Button>}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(merchants ?? []).map((m: any) => {
          const c = counts?.get(m.id);
          const owner = profiles.find((p) => p.id === m.owner_id);
          return (
            <div key={m.id} className="group rounded-3xl border bg-card p-5 hover:shadow-xl hover:shadow-gold-gradient/5 transition-all duration-300 border-gold-gradient/5 hover:border-gold-gradient/20">
              <div className="flex items-center gap-4 mb-5">
                {m.logo_url ? <img src={m.logo_url} className="size-16 rounded-2xl object-cover shadow-sm" alt="" /> : <div className="size-16 rounded-2xl bg-muted grid place-items-center"><Store className="size-8 text-muted-foreground/30" /></div>}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-lg line-clamp-1 group-hover:text-gold-gradient transition-colors">{m.shop_name}</div>
                  <div className="text-xs text-muted-foreground font-semibold flex items-center gap-1">👤 المالك: {owner?.username ?? "—"}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-5">
                <div className="rounded-2xl bg-muted/30 p-3 border border-transparent hover:border-gold-gradient/10 transition-colors">
                  <div className="text-[10px] text-muted-foreground font-bold uppercase mb-1">المنتجات</div>
                  <div className="text-lg font-bold">{c?.count ?? 0}</div>
                </div>
                <div className="rounded-2xl bg-muted/30 p-3 border border-transparent hover:border-gold-gradient/10 transition-colors">
                  <div className="text-[10px] text-muted-foreground font-bold uppercase mb-1">قيمة المخزون</div>
                  <div className="text-lg font-bold text-gold-gradient">{formatEGP(c?.stockValue ?? 0)}</div>
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button className="flex-1 rounded-xl h-9 font-bold" size="sm" variant="outline" onClick={() => setForm({ id: m.id, shop_name: m.shop_name, whatsapp: m.whatsapp ?? "", location: m.location ?? "", logo_url: m.logo_url ?? "", owner_id: m.owner_id, active: m.active })}>تعديل البيانات</Button>
                <Button className="rounded-xl h-9" size="sm" variant="destructive" onClick={() => del(m.id)}><Trash2 className="size-4" /></Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
