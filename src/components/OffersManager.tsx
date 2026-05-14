import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Tag } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function OffersManager() {
  const qc = useQueryClient();
  const [offer, setOffer] = useState({ title: "", percent: 15, days: 1, product_id: "all" });

  const { data: offers } = useQuery({
    queryKey: ["admin-offers"],
    queryFn: async () => {
      const { data } = await supabase.from("product_offers").select("*, products(name)").order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: products } = useQuery({
    queryKey: ["admin-products-slim"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id, name").eq("active", true).order("name");
      return data ?? [];
    },
  });

  const addOffer = async () => {
    if (!offer.title || !offer.percent || !offer.days) return toast.error("املأ كل الحقول");
    
    const ends_at = new Date();
    ends_at.setDate(ends_at.getDate() + offer.days);
    
    const payload = {
      title: offer.title,
      percent: offer.percent,
      ends_at: ends_at.toISOString(),
      active: true,
      product_id: offer.product_id === "all" ? null : offer.product_id
    };

    const { error } = await supabase.from("product_offers").insert(payload);
    if (error) return toast.error(error.message);
    
    toast.success("تم إضافة العرض بنجاح");
    setOffer({ ...offer, title: "", percent: 15 });
    qc.invalidateQueries({ queryKey: ["admin-offers"] });
  };

  const toggleOffer = async (id: string, active: boolean) => {
    await supabase.from("product_offers").update({ active: !active }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-offers"] });
  };

  const deleteOffer = async (id: string) => {
    if (!confirm("حذف العرض؟")) return;
    await supabase.from("product_offers").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-offers"] });
  };

  return (
    <div className="space-y-6 mt-8">
      <div className="rounded-2xl border bg-card p-5">
        <h3 className="font-bold mb-3 flex items-center gap-2"><Tag className="size-4" /> إدارة العروض الحصرية</h3>
        <div className="grid md:grid-cols-4 gap-3">
          <div><Label>اسم العرض</Label><Input value={offer.title} onChange={(e) => setOffer({ ...offer, title: e.target.value })} placeholder="عرض الصيف الشتوي" /></div>
          <div><Label>نسبة الخصم %</Label><Input type="number" value={offer.percent} onChange={(e) => setOffer({ ...offer, percent: Number(e.target.value) })} /></div>
          <div><Label>المدة (بالأيام)</Label><Input type="number" value={offer.days} onChange={(e) => setOffer({ ...offer, days: Number(e.target.value) })} /></div>
          <div className="md:col-span-1 flex items-end"><Button onClick={addOffer} className="w-full gradient-gold text-primary"><Plus className="size-4 ml-1"/> إضافة</Button></div>
          <div className="md:col-span-4">
            <Label>المنتج المشمول (اختياري)</Label>
            <Select value={offer.product_id} onValueChange={(v) => setOffer({ ...offer, product_id: v })}>
              <SelectTrigger><SelectValue placeholder="اختر المنتج" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل المنتجات</SelectItem>
                {(products ?? []).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/40"><tr><th className="p-3 text-right">العنوان</th><th className="p-3 text-right">الخصم</th><th className="p-3 text-right">المنتج</th><th className="p-3 text-right">ينتهي في</th><th className="p-3 text-right">حالة</th><th className="p-3"></th></tr></thead>
          <tbody>
            {(offers ?? []).map((o) => (
              <tr key={o.id} className="border-t">
                <td className="p-3 font-semibold">{o.title}</td>
                <td className="p-3">{o.percent}%</td>
                <td className="p-3">{o.products?.name ?? "الكل"}</td>
                <td className="p-3" dir="ltr">{new Date(o.ends_at).toLocaleString("ar-EG")}</td>
                <td className="p-3"><button onClick={() => toggleOffer(o.id, o.active)}>{o.active ? "✅ نشط" : "⏸️ موقوف"}</button></td>
                <td className="p-3"><Button size="sm" variant="ghost" onClick={() => deleteOffer(o.id)}><Trash2 className="size-3 text-destructive" /></Button></td>
              </tr>
            ))}
            {(offers ?? []).length === 0 && <tr><td colSpan={6} className="p-4 text-center text-muted-foreground">لا توجد عروض حالياً</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
