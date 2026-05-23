import { useState } from "react";
import { formatEGP } from "@/lib/format";
import { Link } from "@tanstack/react-router";
import { Search, ShoppingBag, Eye, AlertTriangle, Check, X, ShieldAlert } from "lucide-react";
import { Input } from "@/components/ui/input";

export function ProductsTab({ products }: { products: any[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive" | "low_stock">("all");

  const filtered = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.vendor.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && p.active) ||
      (statusFilter === "inactive" && !p.active) ||
      (statusFilter === "low_stock" && p.stock < 5);

    return matchesSearch && matchesStatus;
  });

  const activeCount = products.filter((p) => p.active).length;
  const lowStockCount = products.filter((p) => p.stock < 5).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Quick Statistics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-gold-gradient/10 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs text-muted-foreground font-bold">إجمالي المنتجات</span>
          <span className="text-2xl font-black mt-2 text-foreground">{products.length}</span>
        </div>
        <div className="bg-card border border-gold-gradient/10 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs text-muted-foreground font-bold">نشط في المعرض</span>
          <span className="text-2xl font-black mt-2 text-green-600">{activeCount}</span>
        </div>
        <div className="bg-card border border-gold-gradient/10 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs text-muted-foreground font-bold">موقوف مؤقتاً</span>
          <span className="text-2xl font-black mt-2 text-red-600">{products.length - activeCount}</span>
        </div>
        <div className="bg-card border border-gold-gradient/10 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
          <span className="text-xs text-muted-foreground font-bold">مخزون منخفض (&lt;5)</span>
          <span className="text-2xl font-black mt-2 text-amber-500">{lowStockCount}</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between bg-card p-4 rounded-3xl border border-gold-gradient/5">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="ابحث باسم المنتج أو التاجر..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pr-10 rounded-xl border-gold-gradient/20 focus:border-gold-gradient"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex bg-muted/40 p-1 rounded-xl border border-gold-gradient/10 w-fit self-start md:self-auto overflow-x-auto">
          {[
            { id: "all", label: "الكل" },
            { id: "active", label: "نشط" },
            { id: "inactive", label: "معطل" },
            { id: "low_stock", label: "مخزون منخفض" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === tab.id
                  ? "gradient-gold text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid (Mobile-First Card Layout) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => {
          const isLowStock = p.stock < 5;
          return (
            <div
              key={p.id}
              className="bg-card border border-gold-gradient/10 rounded-3xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between gap-4"
            >
              {/* Product Info */}
              <div className="flex gap-3">
                <div className="size-16 rounded-2xl bg-muted overflow-hidden shrink-0 border border-gold-gradient/5">
                  {p.image_url ? (
                    <img src={p.image_url} alt="" className="size-full object-cover" />
                  ) : (
                    <div className="size-full grid place-items-center text-[10px] text-muted-foreground font-bold">
                      بلا صورة
                    </div>
                  )}
                </div>
                <div className="min-w-0 space-y-1">
                  <Link
                    to="/product/$id"
                    params={{ id: p.id }}
                    className="font-bold text-sm block hover:text-gold-gradient transition-colors truncate"
                  >
                    {p.name}
                  </Link>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-muted-foreground">بواسطة:</span>
                    <span className="text-[11px] font-bold text-foreground">{p.vendor}</span>
                  </div>
                  <div className="text-xs font-bold text-gold-gradient">{formatEGP(p.price)}</div>
                </div>
              </div>

              {/* Status and Action Buttons */}
              <div className="flex items-center justify-between border-t border-muted pt-3">
                <div className="flex gap-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      p.active
                        ? "bg-green-500/10 text-green-600"
                        : "bg-red-500/10 text-red-600"
                    }`}
                  >
                    {p.active ? <Check className="size-3" /> : <X className="size-3" />}
                    {p.active ? "نشط" : "معطل"}
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      p.stock === 0
                        ? "bg-red-500/10 text-red-600"
                        : isLowStock
                        ? "bg-amber-500/10 text-amber-600"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isLowStock && <AlertTriangle className="size-3" />}
                    {p.stock === 0 ? "نفد" : isLowStock ? `منخفض (${p.stock})` : `${p.stock} قطعة`}
                  </span>
                </div>

                <Link
                  to="/product/$id"
                  params={{ id: p.id }}
                  className="text-xs text-gold-gradient hover:underline font-bold flex items-center gap-1"
                >
                  <Eye className="size-3.5" />
                  عرض المنتج
                </Link>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="col-span-full py-16 text-center text-muted-foreground bg-card border border-gold-gradient/10 rounded-3xl">
            <ShoppingBag className="size-10 mx-auto opacity-20 mb-2" />
            <span className="text-sm">لا توجد منتجات تطابق بحثك أو تصنيفك الحالي.</span>
          </div>
        )}
      </div>
    </div>
  );
}
