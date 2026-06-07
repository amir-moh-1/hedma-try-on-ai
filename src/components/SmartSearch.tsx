import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link, useNavigate } from "@tanstack/react-router";
import { Search, X, Sparkles, Filter } from "lucide-react";
import { formatEGP } from "@/lib/format";
import { catAr } from "@/lib/categories";
import { colorHex } from "@/lib/presets";

/**
 * Smart search visible on the homepage.
 * - Live search by name / first letter / description
 * - Filter by category, color, size, max price
 * - Click a result to open the product page
 */
export function SmartSearch() {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState<string>("all");
  const [color, setColor] = useState<string>("all");
  const [size, setSize] = useState<string>("all");
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const { data: products } = useQuery({
    queryKey: ["smart-search-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id,name,price,image_url,category,stock,colors,sizes,description")
        .eq("active", true)
        .limit(500);
      return data ?? [];
    },
  });

  // Close popover on outside click
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const { allCats, allColors, allSizes, priceCap } = useMemo(() => {
    const cats = new Set<string>();
    const cols = new Set<string>();
    const szs = new Set<string>();
    let max = 0;
    (products ?? []).forEach((p: any) => {
      if (p.category) cats.add(p.category);
      (p.colors ?? []).forEach((c: string) => c && cols.add(c));
      (p.sizes ?? []).forEach((s: string) => s && szs.add(s));
      if (p.price > max) max = Number(p.price);
    });
    return {
      allCats: Array.from(cats),
      allColors: Array.from(cols),
      allSizes: Array.from(szs),
      priceCap: Math.ceil(max / 50) * 50 || 1000,
    };
  }, [products]);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    return (products ?? []).filter((p: any) => {
      if (cat !== "all" && p.category !== cat) return false;
      if (color !== "all" && !(p.colors ?? []).some((c: string) => c?.toLowerCase() === color.toLowerCase())) return false;
      if (size !== "all" && !(p.sizes ?? []).some((s: string) => s?.toLowerCase() === size.toLowerCase())) return false;
      if (maxPrice != null && Number(p.price) > maxPrice) return false;
      if (!query) return true;
      const hay = `${p.name} ${p.description ?? ""} ${(p.colors ?? []).join(" ")} ${(p.sizes ?? []).join(" ")} ${catAr(p.category)}`.toLowerCase();
      // Match anywhere, including first-letter searches like "ج"
      return hay.includes(query) || p.name?.trim().toLowerCase().startsWith(query);
    }).slice(0, 12);
  }, [products, q, cat, color, size, maxPrice]);

  const hasActiveFilter = cat !== "all" || color !== "all" || size !== "all" || maxPrice != null;

  const reset = () => {
    setCat("all"); setColor("all"); setSize("all"); setMaxPrice(null);
  };

  const goToAll = () => {
    setOpen(false);
    nav({ to: "/products", search: cat !== "all" ? ({ category: cat } as any) : ({} as any) });
  };

  return (
    <div ref={rootRef} className="relative w-full max-w-2xl mx-auto" dir="rtl">
      {/* Search bar */}
      <div className="flex items-center gap-2 bg-card border border-gold/30 rounded-2xl shadow-lg shadow-black/5 focus-within:border-gold focus-within:shadow-gold/10 transition-all overflow-hidden">
        <Search className="size-5 text-gold mr-3" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => { if (e.key === "Enter") goToAll(); }}
          placeholder="ابحث بالاسم، اللون، المقاس أو حتى أول حرف..."
          className="flex-1 bg-transparent py-4 text-sm md:text-base outline-none placeholder:text-muted-foreground/60"
        />
        {q && (
          <button onClick={() => setQ("")} className="p-2 text-muted-foreground hover:text-foreground" aria-label="مسح">
            <X className="size-4" />
          </button>
        )}
        <button
          onClick={() => setShowFilters((s) => !s)}
          className={`flex items-center gap-1 px-3 md:px-4 py-4 text-xs font-bold border-r border-gold/20 transition-colors ${showFilters || hasActiveFilter ? "bg-gold/10 text-gold" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Filter className="size-4" />
          <span className="hidden sm:inline">فلترة</span>
          {hasActiveFilter && <span className="size-1.5 rounded-full bg-gold" />}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="mt-3 bg-card border border-gold/20 rounded-2xl p-4 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm flex items-center gap-2"><Sparkles className="size-4 text-gold" /> بحث متقدم</h4>
            {hasActiveFilter && (
              <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground underline">إعادة تعيين</button>
            )}
          </div>

          {/* Categories */}
          {allCats.length > 0 && (
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">الفئة</div>
              <div className="flex flex-wrap gap-2">
                <Chip active={cat === "all"} onClick={() => setCat("all")}>الكل</Chip>
                {allCats.map((c) => (
                  <Chip key={c} active={cat === c} onClick={() => setCat(c)}>{catAr(c)}</Chip>
                ))}
              </div>
            </div>
          )}

          {/* Colors */}
          {allColors.length > 0 && (
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">اللون</div>
              <div className="flex flex-wrap gap-2">
                <Chip active={color === "all"} onClick={() => setColor("all")}>الكل</Chip>
                {allColors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition ${color === c ? "border-gold bg-gold/10" : "border-foreground/10 hover:border-foreground/30 bg-card"}`}
                  >
                    <span className="size-3 rounded-full border" style={{ background: colorHex(c) }} />
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sizes */}
          {allSizes.length > 0 && (
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">المقاس</div>
              <div className="flex flex-wrap gap-2">
                <Chip active={size === "all"} onClick={() => setSize("all")}>الكل</Chip>
                {allSizes.map((s) => (
                  <Chip key={s} active={size === s} onClick={() => setSize(s)}>{s}</Chip>
                ))}
              </div>
            </div>
          )}

          {/* Price */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">السعر الأقصى</span>
              <span className="text-xs font-bold text-gold">حتى {maxPrice ?? priceCap} ج.م</span>
            </div>
            <input
              type="range" min={0} max={priceCap} step={50}
              value={maxPrice ?? priceCap}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-[#D4A017] cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Results dropdown */}
      {open && (q || hasActiveFilter) && (
        <div className="absolute z-50 mt-3 w-full bg-card border border-gold/20 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
            {results.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                لا توجد نتائج تطابق بحثك. جرب كلمة أو مقاس مختلف.
              </div>
            ) : (
              results.map((p: any) => (
                <Link
                  key={p.id}
                  to="/product/$id"
                  params={{ id: p.id }}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 p-3 hover:bg-gold/5 transition-colors border-b border-foreground/5 last:border-b-0"
                >
                  <div className="size-14 rounded-xl overflow-hidden bg-muted/30 shrink-0">
                    {p.image_url && <img src={p.image_url} alt={p.name} className="size-full object-cover" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{p.name}</div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span>{catAr(p.category)}</span>
                      {p.sizes?.length > 0 && <span>· {p.sizes.slice(0, 3).join("، ")}</span>}
                      {p.stock === 0 && <span className="text-destructive font-bold">· نفد</span>}
                    </div>
                  </div>
                  <div className="font-display font-black text-gold whitespace-nowrap">{formatEGP(p.price)}</div>
                </Link>
              ))
            )}
          </div>
          <button
            onClick={goToAll}
            className="w-full bg-foreground text-background py-3 text-xs font-black tracking-[0.2em] uppercase hover:bg-gold hover:text-foreground transition-colors"
          >
            عرض كل المنتجات
          </button>
        </div>
      )}
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded-full text-xs font-bold border transition ${active ? "bg-gold text-foreground border-gold" : "bg-card border-foreground/10 hover:border-foreground/30"}`}
    >
      {children}
    </button>
  );
}
