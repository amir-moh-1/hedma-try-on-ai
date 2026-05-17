import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatEGP } from "@/lib/format";
import { toast } from "sonner";
import { Ban, CheckCircle, Package, PowerOff, ShieldAlert } from "lucide-react";

export function ProductControlTab() {
  const qc = useQueryClient();
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

  // Fetch all vendors / admins
  const { data: vendors } = useQuery({
    queryKey: ["admin-vendors"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").in("role", ["vendor", "admin"]);
      const uids = Array.from(new Set((roles ?? []).map(r => r.user_id)));
      if (uids.length === 0) return [];
      const { data: profiles } = await supabase.from("profiles").select("id, username, full_name").in("id", uids);
      return profiles ?? [];
    }
  });

  // Fetch products for selected vendor
  const { data: products } = useQuery({
    queryKey: ["admin-vendor-products", selectedVendorId],
    enabled: !!selectedVendorId,
    queryFn: async () => {
      const { data } = await supabase.from("products").select("*").eq("vendor_id", selectedVendorId!).order("created_at", { ascending: false });
      return data ?? [];
    }
  });

  const toggleActive = async (productId: string, currentActive: boolean) => {
    const nextVal = !currentActive;
    const { error } = await supabase.from("products").update({ active: nextVal }).eq("id", productId);
    if (error) return toast.error(error.message);
    toast.success(nextVal ? "تم تفعيل بيع المنتج بنجاح ✅" : "تم إيقاف بيع المنتج كلياً 🔴");
    qc.invalidateQueries({ queryKey: ["admin-vendor-products", selectedVendorId] });
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  const toggleStock = async (productId: string, currentStock: number) => {
    const nextStock = currentStock === 0 ? 10 : 0; // Toggles between out of stock (0) and in stock (10)
    const { error } = await supabase.from("products").update({ stock: nextStock }).eq("id", productId);
    if (error) return toast.error(error.message);
    toast.success(nextStock === 0 ? "تم وسم المنتج كـ (نفد من المخزون) ⚠️" : "تم توفير المخزون للمنتج ✅");
    qc.invalidateQueries({ queryKey: ["admin-vendor-products", selectedVendorId] });
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-card p-6 shadow-sm border-gold-gradient/10">
        <h3 className="font-bold text-xl mb-4 text-gold-gradient flex items-center gap-2">
          <Package className="size-5" /> التحكم بمنتجات التجار
        </h3>
        <p className="text-xs text-muted-foreground mb-6">إيقاف البيع مؤقتاً أو وسم السلع بنفاد المخزون لتاجر محدد.</p>

        <div className="max-w-xs space-y-2">
          <label className="text-sm font-semibold">اختر التاجر</label>
          <Select onValueChange={(v) => setSelectedVendorId(v)}>
            <SelectTrigger className="rounded-xl border-gold-gradient/20">
              <SelectValue placeholder="اختر التاجر لعرض منتجاته" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {(vendors ?? []).map((v) => (
                <SelectItem key={v.id} value={v.id}>
                  {v.full_name || v.username} ({v.username})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedVendorId && (
        <div className="rounded-3xl border bg-card overflow-hidden shadow-lg border-gold-gradient/10 animate-in fade-in duration-300">
          <div className="p-5 border-b bg-muted/20 flex items-center justify-between">
            <h3 className="font-bold">قائمة منتجات التاجر المختار</h3>
            <span className="text-xs bg-accent/30 px-3 py-1 rounded-full border border-gold-gradient/10 font-bold">
              إجمالي المنتجات: {products?.length ?? 0}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-muted/10">
                <tr className="border-b">
                  <th className="p-4">المنتج</th>
                  <th className="p-4">السعر</th>
                  <th className="p-4">المخزون الحالي</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4 text-center">إجراءات سريعة</th>
                </tr>
              </thead>
              <tbody>
                {(products ?? []).map((p) => {
                  const isOutOfStock = p.stock === 0;
                  return (
                    <tr key={p.id} className="border-t hover:bg-muted/5 transition-colors">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="size-12 rounded-lg bg-muted overflow-hidden shrink-0 border border-gold-gradient/10">
                            {p.image_url ? (
                              <img src={p.image_url} alt="" className="size-full object-cover" />
                            ) : (
                              <div className="size-full grid place-items-center text-[10px] text-muted-foreground">بلا صورة</div>
                            )}
                          </div>
                          <div>
                            <span className="font-bold block">{p.name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">{p.id.slice(0, 8)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono font-bold">{formatEGP(p.price)}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${isOutOfStock ? "bg-red-500/10 text-red-600" : "bg-green-500/10 text-green-600"}`}>
                          {p.stock} قطعة {isOutOfStock ? "(نفد ⚠️)" : ""}
                        </span>
                      </td>
                      <td className="p-4">
                        {p.active ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-green-600">
                            <span className="size-2 rounded-full bg-green-500" /> نشط في الواجهة
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-red-600">
                            <span className="size-2 rounded-full bg-red-500" /> موقوف مؤقتاً
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            size="sm"
                            variant={p.active ? "destructive" : "default"}
                            onClick={() => toggleActive(p.id, p.active)}
                            className={`rounded-xl px-3 font-semibold ${!p.active ? "gradient-gold text-primary" : "bg-red-600 text-white hover:bg-red-700"}`}
                          >
                            {p.active ? (
                              <><PowerOff className="size-3.5 ml-1" /> إيقاف البيع</>
                            ) : (
                              <><CheckCircle className="size-3.5 ml-1" /> تفعيل البيع</>
                            )}
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => toggleStock(p.id, p.stock)}
                            className={`rounded-xl px-3 font-semibold border-gold-gradient/20 hover:bg-gold-gradient/10`}
                          >
                            {isOutOfStock ? (
                              <><Package className="size-3.5 ml-1 text-gold-gradient" /> توفير المخزون</>
                            ) : (
                              <><ShieldAlert className="size-3.5 ml-1 text-amber-500" /> نفذ من المخزون</>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {(products ?? []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-muted-foreground">
                      لا توجد منتجات مسجلة لهذا التاجر بعد.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
