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
import { Plus, Trash2, Edit2, Save, X, Upload } from "lucide-react";
import { usePreset, colorHex, type Variant } from "@/lib/presets";

export const Route = createFileRoute("/vendor")({ component: VendorPanel });

type ProductRow = {
  id: string; vendor_id: string; merchant_id: string | null; name: string; description: string | null; price: number;
  category: string; location: string | null; sizes: string[]; colors: string[]; stock: number;
  image_url: string | null; active: boolean; variants: Variant[] | null;
};
type Merchant = { id: string; shop_name: string; owner_id: string };

const empty = {
  name: "", description: "", price: 0, category: "tshirts", location: "",
  sizes: [] as string[], colors: [] as string[], stock: 0, image_url: "", active: true,
  merchant_id: "" as string, variants: [] as Variant[],
};

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

  const { data: presetSizes = [] } = usePreset("sizes");
  const { data: presetColors = [] } = usePreset("colors");
  const { data: presetCats = [] } = usePreset("categories");

  const { data: merchants = [] } = useQuery({
    queryKey: ["merchants-list", user?.id, isAdmin],
    enabled: !!user,
    queryFn: async () => {
      let q = supabase.from("merchants").select("id,shop_name,owner_id").eq("active", true);
      if (!isAdmin) q = q.eq("owner_id", user!.id);
      const { data } = await q.order("shop_name");
      return (data ?? []) as Merchant[];
    },
  });

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

  const toggle = (arr: string[], v: string) => arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];

  const save = async () => {
    if (!form.name || !form.price) return toast.error("الاسم والسعر مطلوبين");
    const variantColors = form.variants.map((v) => v.color).filter(Boolean);
    const allColors = Array.from(new Set([...form.colors, ...variantColors]));
    const payload = {
      vendor_id: editingId ? undefined : user!.id,
      merchant_id: form.merchant_id || null,
      name: form.name, description: form.description || null,
      price: Number(form.price), category: form.category,
      location: form.location || null,
      sizes: form.sizes, colors: allColors, stock: Number(form.stock),
      image_url: form.image_url || form.variants[0]?.image_url || null,
      active: form.active,
      variants: form.variants as never,
    };
    if (editingId) {
      const { error } = await supabase.from("products").update(payload).eq("id", editingId);
      if (error) return toast.error(error.message);
      logActivity("product_update", { id: editingId, name: form.name });
      toast.success("تم التحديث");
    } else {
      const { error } = await supabase.from("products").insert(payload as never);
      if (error) return toast.error(error.message);
      logActivity("product_create", { name: form.name });
      toast.success("تم الإضافة");
    }
    reset();
    qc.invalidateQueries({ queryKey: ["vendor-products"] });
  };

  const edit = (p: ProductRow) => {
    setEditingId(p.id);
    setForm({
      name: p.name, description: p.description ?? "", price: p.price, category: p.category,
      location: p.location ?? "", sizes: p.sizes ?? [], colors: p.colors ?? [],
      stock: p.stock, image_url: p.image_url ?? "", active: p.active,
      merchant_id: p.merchant_id ?? "",
      variants: Array.isArray(p.variants) ? p.variants : [],
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

  const uploadVariants = async (files: FileList | null) => {
    if (!files || !user) return;
    setUploading(true);
    const newVars: Variant[] = [];
    for (const f of Array.from(files)) {
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${f.name}`;
      const { error } = await supabase.storage.from("hedma").upload(path, f, { upsert: false });
      if (error) { toast.error(error.message); continue; }
      const { data } = supabase.storage.from("hedma").getPublicUrl(path);
      newVars.push({ image_url: data.publicUrl, color: "" });
    }
    setForm((p) => ({
      ...p,
      variants: [...p.variants, ...newVars],
      image_url: p.image_url || newVars[0]?.image_url || "",
    }));
    setUploading(false);
    toast.success(`تم رفع ${newVars.length} صورة`);
  };

  const setVarColor = (i: number, color: string) =>
    setForm((p) => ({ ...p, variants: p.variants.map((v, j) => j === i ? { ...v, color } : v) }));

  const removeVar = (i: number) =>
    setForm((p) => ({ ...p, variants: p.variants.filter((_, j) => j !== i) }));

  if (loading) return <div className="p-10 text-center">...</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10" dir="rtl">
      <h1 className="font-display text-3xl font-bold mb-6">
        لوحة التاجر {isAdmin && <span className="text-sm text-muted-foreground">(صلاحيات مدير)</span>}
      </h1>

      <div className="rounded-2xl border bg-card p-6 mb-8 shadow-luxe space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg flex items-center gap-2">
            {editingId ? <Edit2 className="size-4" /> : <Plus className="size-4" />}
            {editingId ? "تعديل منتج" : "إضافة منتج جديد"}
          </h2>
          {editingId && <Button variant="ghost" size="sm" onClick={reset}><X className="size-4 ml-1" /> إلغاء</Button>}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <Label>المحل (التاجر)</Label>
            <select value={form.merchant_id} onChange={(e) => setForm({ ...form, merchant_id: e.target.value })}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm">
              <option value="">— بدون محل —</option>
              {merchants.map((m) => <option key={m.id} value={m.id}>{m.shop_name}</option>)}
            </select>
          </div>
          <div>
            <Label>الفئة</Label>
            {presetCats.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-1">
                {presetCats.map((c) => (
                  <button key={c} type="button" onClick={() => setForm({ ...form, category: c })}
                    className={`px-3 py-1.5 rounded-full text-xs border transition ${form.category === c ? "gradient-gold text-primary border-transparent" : "hover:border-foreground/40"}`}>
                    {c}
                  </button>
                ))}
              </div>
            ) : <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />}
          </div>
          <div><Label>اسم المنتج *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>السعر (ج.م) *</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
          <div><Label>المخزون</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} /></div>
          <div><Label>المكان</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>الوصف</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        </div>

        <div>
          <Label>المقاسات (اضغط للاختيار المتعدد)</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            {presetSizes.map((s) => {
              const sel = form.sizes.includes(s);
              return (
                <button key={s} type="button" onClick={() => setForm({ ...form, sizes: toggle(form.sizes, s) })}
                  className={`px-3 py-1.5 rounded-full text-xs border transition ${sel ? "gradient-gold text-primary border-transparent" : "hover:border-foreground/40"}`}>
                  {s}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <Label>الألوان العامة</Label>
          <div className="flex flex-wrap gap-2 mt-1">
            {presetColors.map((c) => {
              const sel = form.colors.includes(c);
              return (
                <button key={c} type="button" onClick={() => setForm({ ...form, colors: toggle(form.colors, c) })}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs border transition ${sel ? "gradient-gold text-primary border-transparent" : "hover:border-foreground/40"}`}>
                  <span className="size-3 rounded-full border" style={{ backgroundColor: colorHex(c) }} />
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border-2 border-dashed p-4 bg-muted/30">
          <Label className="font-bold flex items-center gap-2"><Upload className="size-4" /> صور المنتج (اختر عدة صور — كل صورة لون مختلف)</Label>
          <Input type="file" accept="image/*" multiple onChange={(e) => uploadVariants(e.target.files)} disabled={uploading} className="mt-2" />
          {form.variants.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              {form.variants.map((v, i) => (
                <div key={i} className="rounded-lg border bg-background p-2">
                  <div className="aspect-square rounded-md overflow-hidden bg-muted mb-2 relative">
                    <img src={v.image_url} className="size-full object-cover" alt="" />
                    <button onClick={() => removeVar(i)} className="absolute top-1 left-1 size-6 grid place-items-center rounded-full bg-destructive text-destructive-foreground">
                      <X className="size-3" />
                    </button>
                  </div>
                  <div className="text-xs mb-1 text-muted-foreground">اللون لهذه الصورة:</div>
                  <div className="flex flex-wrap gap-1">
                    {presetColors.map((c) => {
                      const sel = v.color === c;
                      return (
                        <button key={c} onClick={() => setVarColor(i, c)} title={c}
                          className={`size-6 rounded-full border-2 ${sel ? "border-foreground scale-110" : "border-border"}`}
                          style={{ backgroundColor: colorHex(c) }} />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
          متاح للبيع
        </label>

        <Button onClick={save} className="gradient-gold text-primary"><Save className="size-4 ml-1" /> {editingId ? "حفظ التعديلات" : "إضافة المنتج"}</Button>
      </div>

      <h2 className="font-bold text-lg mb-3">{isAdmin ? "كل المنتجات" : "منتجاتي"}</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(products ?? []).map((p) => (
          <div key={p.id} className="rounded-2xl border bg-card p-3 flex gap-3">
            <div className="size-24 rounded-lg overflow-hidden bg-muted shrink-0">
              {p.image_url && <img src={p.image_url} className="size-full object-cover" alt={p.name} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold line-clamp-1">{p.name}</div>
              <div className="text-xs text-muted-foreground">
                {p.category} • مخزون {p.stock} • {p.active ? "✅" : "❌"}
                {Array.isArray(p.variants) && p.variants.length > 0 && ` • ${p.variants.length} لون`}
              </div>
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
