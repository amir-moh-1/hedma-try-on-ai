import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatEGP } from "@/lib/format";
import { catAr } from "@/lib/categories";
import { toast } from "sonner";
import { Search, Plus, Minus, Power, Trash2, Package, AlertTriangle, TrendingUp, Boxes, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/**
 * Smart admin inventory: shows ALL products with vendor, category, price, stock,
 * total value, status; inline +/- stock adjustment; toggle active; delete;
 * filters by search/vendor/category/status; totals header.
 */
export function SmartInventoryTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [vendorFilter, setVendorFilter] = useState<string>("all");
  const [catFilter, setCatFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "low" | "out">("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-smart-inventory"],
    queryFn: async () => {
      const { data: products } = await supabase
        .from("products")
        .select("id,name,price,category,stock,active,vendor_id,image_url,sizes,colors,created_at,updated_at")
        .order("created_at", { ascending: false });
      const ids = Array.from(new Set((products ?? []).map((p: any) => p.vendor_id)));
      const { data: profs } = ids.length
        ? await supabase.from("profiles").select("id,username,full_name,phone").in("id", ids)
        : { data: [] as any[] };
      const m = new Map((profs ?? []).map((p: any) => [p.id, p]));
      return (products ?? []).map((p: any) => ({ ...p, vendor: m.get(p.vendor_id) }));
    },
  });

  const vendors = useMemo(() => {
    const map = new Map<string, any>();
    (data ?? []).forEach((p: any) => { if (p.vendor) map.set(p.vendor.id, p.vendor); });
    return Array.from(map.values());
  }, [data]);

  const categories = useMemo(() => Array.from(new Set((data ?? []).map((p: any) => p.category))), [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data ?? []).filter((p: any) => {
      if (vendorFilter !== "all" && p.vendor_id !== vendorFilter) return false;
      if (catFilter !== "all" && p.category !== catFilter) return false;
      if (statusFilter === "active" && !p.active) return false;
      if (statusFilter === "inactive" && p.active) return false;
      if (statusFilter === "out" && p.stock !== 0) return false;
      if (statusFilter === "low" && (p.stock === 0 || p.stock >= 5)) return false;
      if (q) {
        const hay = `${p.name} ${p.vendor?.username ?? ""} ${p.vendor?.full_name ?? ""} ${catAr(p.category)} ${(p.colors ?? []).join(" ")} ${(p.sizes ?? []).join(" ")}`.toLowerCase();
        if (!hay.includes(q) && !p.name?.toLowerCase().startsWith(q)) return false;
      }
      return true;
    });
  }, [data, search, vendorFilter, catFilter, statusFilter]);

  const totals = useMemo(() => {
    const t = { products: filtered.length, stock: 0, value: 0, low: 0, out: 0, inactive: 0 };
    filtered.forEach((p: any) => {
      t.stock += p.stock || 0;
      t.value += (p.price || 0) * (p.stock || 0);
      if (p.stock === 0) t.out++;
      else if (p.stock < 5) t.low++;
      if (!p.active) t.inactive++;
    });
    return t;
  }, [filtered]);

  const adjustStock = async (p: any, delta: number) => {
    const next = Math.max(0, (p.stock || 0) + delta);
    setBusyId(p.id);
    const { error } = await supabase.from("products").update({ stock: next }).eq("id", p.id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success(`تم تحديث مخزون "${p.name}" إلى ${next}`);
    qc.invalidateQueries({ queryKey: ["admin-smart-inventory"] });
  };

  const setStock = async (p: any, value: number) => {
    const next = Math.max(0, Math.floor(value));
    if (next === p.stock) return;
    setBusyId(p.id);
    const { error } = await supabase.from("products").update({ stock: next }).eq("id", p.id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-smart-inventory"] });
  };

  const toggleActive = async (p: any) => {
    setBusyId(p.id);
    const { error } = await supabase.from("products").update({ active: !p.active }).eq("id", p.id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success(p.active ? "تم إيقاف المنتج" : "تم تفعيل المنتج");
    qc.invalidateQueries({ queryKey: ["admin-smart-inventory"] });
  };

  const removeProduct = async (p: any) => {
    if (!confirm(`حذف "${p.name}" نهائياً؟`)) return;
    setBusyId(p.id);
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    setBusyId(null);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف");
    qc.invalidateQueries({ queryKey: ["admin-smart-inventory"] });
  };

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Kpi icon={Boxes} label="منتجات" value={totals.products.toString()} />
        <Kpi icon={Package} label="إجمالي قطع" value={totals.stock.toString()} />
        <Kpi icon={TrendingUp} label="قيمة المخزون" value={formatEGP(totals.value)} accent />
        <Kpi icon={AlertTriangle} label="مخزون منخفض" value={totals.low.toString()} warn />
        <Kpi icon={AlertTriangle} label="نفد المخزون" value={totals.out.toString()} danger />
      </div>

      {/* Filters */}
      <div className="rounded-3xl border bg-card p-4 md:p-5 shadow-sm space-y-3">
        <div className="grid md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="ابحث باسم المنتج، التاجر، اللون، المقاس..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10 rounded-xl"
            />
          </div>
          <select value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)} className="h-9 px-3 rounded-xl border bg-background text-sm font-bold">
            <option value="all">كل التجار ({vendors.length})</option>
            {vendors.map((v: any) => (
              <option key={v.id} value={v.id}>{v.full_name || v.username}</option>
            ))}
          </select>
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="h-9 px-3 rounded-xl border bg-background text-sm font-bold">
            <option value="all">كل الفئات</option>
            {categories.map((c) => (
              <option key={c} value={c}>{catAr(c)}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: "all", label: "الكل" },
            { id: "active", label: "نشط" },
            { id: "inactive", label: "موقوف" },
            { id: "low", label: "مخزون منخفض" },
            { id: "out", label: "نفد" },
          ].map((s) => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id as any)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${statusFilter === s.id ? "gradient-gold text-primary border-transparent shadow" : "bg-card hover:border-foreground/30"}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl border bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-muted/30 text-xs">
              <tr>
                <th className="p-3">المنتج</th>
                <th className="p-3">التاجر</th>
                <th className="p-3">الفئة</th>
                <th className="p-3">السعر</th>
                <th className="p-3 text-center">المخزون</th>
                <th className="p-3">القيمة</th>
                <th className="p-3">الحالة</th>
                <th className="p-3 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={8} className="p-12 text-center text-muted-foreground"><Loader2 className="size-5 animate-spin inline" /> جاري التحميل...</td></tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={8} className="p-12 text-center text-muted-foreground">لا توجد منتجات تطابق الفلاتر.</td></tr>
              )}
              {filtered.map((p: any) => {
                const busy = busyId === p.id;
                const status = !p.active ? "موقوف" : p.stock === 0 ? "نفد" : p.stock < 5 ? "منخفض" : "متوفر";
                const statusColor = !p.active ? "bg-muted text-muted-foreground"
                  : p.stock === 0 ? "bg-destructive/10 text-destructive"
                  : p.stock < 5 ? "bg-orange-500/10 text-orange-600"
                  : "bg-green-500/10 text-green-600";
                return (
                  <tr key={p.id} className="border-t hover:bg-muted/10 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="size-12 rounded-lg overflow-hidden bg-muted shrink-0">
                          {p.image_url && <img src={p.image_url} alt={p.name} className="size-full object-cover" />}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold truncate max-w-[180px]">{p.name}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {(p.sizes ?? []).slice(0, 4).join("، ")} {p.colors?.length > 0 && `· ${p.colors.length} ألوان`}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-xs">
                      <div className="font-bold">{p.vendor?.full_name || "—"}</div>
                      <div className="text-muted-foreground">@{p.vendor?.username ?? "—"}</div>
                    </td>
                    <td className="p-3 text-xs font-bold">{catAr(p.category)}</td>
                    <td className="p-3 font-mono font-bold">{formatEGP(p.price)}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button size="icon" variant="outline" className="size-7 rounded-lg" disabled={busy || p.stock === 0} onClick={() => adjustStock(p, -1)}><Minus className="size-3" /></Button>
                        <input
                          type="number"
                          min={0}
                          defaultValue={p.stock}
                          key={`${p.id}-${p.stock}`}
                          onBlur={(e) => setStock(p, Number(e.target.value))}
                          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                          disabled={busy}
                          className={`w-14 h-7 text-center text-sm font-black rounded-lg border ${p.stock === 0 ? "text-destructive border-destructive/30" : p.stock < 5 ? "text-orange-600 border-orange-500/30" : "text-gold border-gold/30"} bg-background`}
                        />
                        <Button size="icon" variant="outline" className="size-7 rounded-lg" disabled={busy} onClick={() => adjustStock(p, 1)}><Plus className="size-3" /></Button>
                      </div>
                    </td>
                    <td className="p-3 font-mono font-bold text-green-600">{formatEGP((p.price || 0) * (p.stock || 0))}</td>
                    <td className="p-3">
                      <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${statusColor}`}>{status}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button size="icon" variant="ghost" disabled={busy} onClick={() => toggleActive(p)} title={p.active ? "إيقاف" : "تفعيل"}>
                          <Power className={`size-4 ${p.active ? "text-green-600" : "text-muted-foreground"}`} />
                        </Button>
                        <Button size="icon" variant="ghost" disabled={busy} onClick={() => removeProduct(p)} title="حذف">
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, accent, warn, danger }: any) {
  const tone = danger ? "text-destructive" : warn ? "text-orange-600" : accent ? "text-gold" : "text-foreground";
  return (
    <div className="rounded-2xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-black text-muted-foreground mb-2">
        <Icon className="size-3.5" /> {label}
      </div>
      <div className={`font-display text-2xl font-black ${tone}`}>{value}</div>
    </div>
  );
}
