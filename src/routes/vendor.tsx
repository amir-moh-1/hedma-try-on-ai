import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth, logActivity } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { formatEGP } from "@/lib/format";
import { Plus, Trash2, Edit2, Save, X } from "lucide-react";

export const Route = createFileRoute("/vendor")({ component: VendorPanel });

type ProductRow = {
  id: string; vendor_id: string; name: string; description: string | null; price: number;
  category: string; location: string | null; sizes: string[]; colors: string[]; stock: number;
  image_url: string | null; active: boolean;
};

const empty = { name: "", description: "", price: 0, category: "tshirts", location: "", sizes: "", colors: "", stock: 0, image_url: "", active: true };

function VendorPanel() {
  const { user, isVendor, isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({ ...empty });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isVendor)) nav({ to: "/auth" });
  }, [loading, user, isVendor, nav]);

  const { data: products } = useQuery({
    queryKey: ["vendor-products", user?.id],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase.from("products").select("*").order("created_at", { ascending: false });
      if (!isAdmin) q = q.eq("vendor_id", user!.id);
      const { data } = await q;
      return (data ?? []) as ProductRow[];
    },
  });

  const reset = () => { setForm({ ...empty }); setEditingId(null); };

  const save = async () => {
    if (!form.name || !form.price) return toast.error("الاسم والسعر مطلوبين");
    const payload = {
      vendor_id: editingId ? undefined : user!.id,
      name: form.name,
      description: form.description || null,
      price: Number(form.price),
      category: form.category,
      location: form.location || null,
      sizes: form.sizes.split(",").map((s) => s.trim()).filter(Boolean),
      colors: form.colors.split(",").map((s) => s.trim()).filter(Boolean),
      stock: Number(form.stock),
      image_url: form.image_url || null,
      active: form.active,
    };
    if (editingId) {
      const { error } = await supabase.from("products").update(payload).eq("id", editingId);
      if (error) return toast.error(error.message);
      logActivity("product_update", { id: editingId, name: form.name });
      toast.success("تم تحديث المنتج");
    } else {
      const { error } = await supabase.from("products").insert(payload as never);
      if (error) return toast.error(error.message);
      logActivity("product_create", { name: form.name });
      toast.success("تم إضافة المنتج");
    }
    reset();
    qc.invalidateQueries({ queryKey: ["vendor-products"] });
  };

  const edit = (p: ProductRow) => {
    setEditingId(p.id);
    setForm({
      name: p.name, description: p.description ?? "", price: p.price, category: p.category,
      location: p.location ?? "", sizes: p.sizes.join(", "), colors: p.colors.join(", "),
      stock: p.stock, image_url: p.image_url ?? "", active: p.active,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const del = async (id: string) => {
    if (!confirm("متأكد من حذف المنتج؟")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    logActivity("product_delete", { id });
    toast.success("تم الحذف");
    qc.invalidateQueries({ queryKey: ["vendor-products"] });
  };

  const upload = async (f: File | null) => {
    if (!f || !user) return;
    setUploading(true);
    const path = `${user.id}/${Date.now()}-${f.name}`;
    const { error } = await supabase.storage.from("hedma").upload(path, f, { upsert: false });
    if (error) { setUploading(false); return toast.error(error.message); }
    const { data } = supabase.storage.from("hedma").getPublicUrl(path);
    setForm((p) => ({ ...p, image_url: data.publicUrl }));
    setUploading(false);
    toast.success("تم رفع الصورة");
  };

  if (loading) return <div className="p-10 text-center">...</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold mb-6">لوحة التاجر {isAdmin && <span className="text-sm text-muted-foreground">(صلاحيات مدير)</span>}</h1>

      <div className="rounded-2xl border bg-card p-6 mb-8 shadow-luxe">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg flex items-center gap-2">{editingId ? <Edit2 className="size-4" /> : <Plus className="size-4" />} {editingId ? "تعديل منتج" : "إضافة منتج جديد"}</h2>
          {editingId && <Button variant="ghost" size="sm" onClick={reset}><X className="size-4 ml-1" /> إلغاء</Button>}
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div><Label>اسم المنتج *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>السعر (ج.م) *</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
          <div><Label>الفئة</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
          <div><Label>المخزون</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} /></div>
          <div><Label>المكان</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          <div><Label>المقاسات (افصل بفاصلة)</Label><Input value={form.sizes} onChange={(e) => setForm({ ...form, sizes: e.target.value })} placeholder="S, M, L, XL" /></div>
          <div><Label>الألوان (افصل بفاصلة)</Label><Input value={form.colors} onChange={(e) => setForm({ ...form, colors: e.target.value })} placeholder="أبيض, أسود" /></div>
          <div>
            <Label>صورة المنتج</Label>
            <Input type="file" accept="image/*" onChange={(e) => upload(e.target.files?.[0] ?? null)} disabled={uploading} />
            {form.image_url && <img src={form.image_url} alt="" className="mt-2 h-20 rounded-md object-cover" />}
          </div>
          <div className="md:col-span-2"><Label>الوصف</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
            متاح للبيع
          </label>
        </div>
        <Button onClick={save} className="mt-4 gradient-gold text-primary"><Save className="size-4 ml-1" /> {editingId ? "حفظ التعديلات" : "إضافة"}</Button>
      </div>

      <h2 className="font-bold text-lg mb-3">{isAdmin ? "كل المنتجات في الموقع" : "منتجاتي"}</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(products ?? []).map((p) => (
          <div key={p.id} className="rounded-2xl border bg-card p-3 flex gap-3">
            <div className="size-24 rounded-lg overflow-hidden bg-muted shrink-0">
              {p.image_url && <img src={p.image_url} className="size-full object-cover" alt={p.name} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold line-clamp-1">{p.name}</div>
              <div className="text-xs text-muted-foreground">{p.category} • مخزون {p.stock} • {p.active ? "✅" : "❌"}</div>
              <div className="font-bold mt-1">{formatEGP(p.price)}</div>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={() => edit(p)}><Edit2 className="size-3" /></Button>
                <Button size="sm" variant="destructive" onClick={() => del(p.id)}><Trash2 className="size-3" /></Button>
              </div>
            </div>
          </div>
        ))}
        {(products ?? []).length === 0 && <div className="col-span-full text-center text-muted-foreground py-10">لم تضف أي منتجات بعد</div>}
      </div>
    </div>
  );
}
