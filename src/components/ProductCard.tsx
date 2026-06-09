import { Link } from "@tanstack/react-router";
import { formatEGP } from "@/lib/format";
import { catAr, getCategoryBadge } from "@/lib/categories";
import { useCart } from "@/lib/cart";
import { Plus, Heart, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useWishlistIds, useWishlistToggle } from "@/lib/wishlist";
import { useStorefrontTheme } from "@/lib/storefront-theme";

export type ProductCardData = {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  secondary_image_url?: string | null;
  category: string;
  stock: number;
  created_at?: string | null;
  discountedPrice?: number | null;
};

export function ProductCard({ p }: { p: ProductCardData }) {
  const { user } = useAuth();
  const { storefrontTheme } = useStorefrontTheme();
  const hasDiscount = p.discountedPrice != null && p.discountedPrice < p.price;
  const finalPrice = hasDiscount ? p.discountedPrice! : p.price;
  const { add } = useCart();

  const discountPct = hasDiscount
    ? Math.round(((p.price - p.discountedPrice!) / p.price) * 100)
    : 0;

  const { data: dbWishlistIds } = useWishlistIds();
  const toggleDbWishlist = useWishlistToggle();
  const [localWishlist, setLocalWishlist] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("hedma-wishlist") || "[]");
    } catch {
      return [];
    }
  });

  const inWishlist = user ? !!dbWishlistIds?.has(p.id) : localWishlist.includes(p.id);

  const onHeartClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (user) {
      await toggleDbWishlist(p.id, inWishlist);
    } else {
      try {
        const list = JSON.parse(localStorage.getItem("hedma-wishlist") || "[]");
        let newList;
        if (list.includes(p.id)) {
          newList = list.filter((id: string) => id !== p.id);
          toast.success("تم الحذف من المفضلة ❤️");
        } else {
          newList = [...list, p.id];
          toast.success("تم الإضافة للمفضلة ❤️");
        }
        localStorage.setItem("hedma-wishlist", JSON.stringify(newList));
        setLocalWishlist(newList);
        window.dispatchEvent(new Event("wishlist-change"));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const images = [p.image_url, p.secondary_image_url].filter(Boolean) as string[];
  const [activeImg, setActiveImg] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (images.length < 2 || paused) return;
    const id = setInterval(() => {
      setActiveImg((prev) => (prev + 1) % images.length);
    }, 2500);
    return () => clearInterval(id);
  }, [images.length, paused]);

  let touchStartX = 0;
  const handleTouchStart = (e: React.TouchEvent) => {
    setPaused(true);
    touchStartX = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40 && images.length > 1) {
      setActiveImg((prev) => (prev + 1) % images.length);
    }
    setTimeout(() => setPaused(false), 1500);
  };

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (p.stock === 0) return;
    add({ id: p.id, name: p.name, price: finalPrice, image: p.image_url ?? undefined });
    toast.success("اتضاف للسلة ✅", { description: p.name });
  };

  const isOutOfStock = p.stock === 0;
  const isLastItems = p.stock > 0 && p.stock < 3;
  const isNew = p.created_at && (new Date().getTime() - new Date(p.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000;
  const isPopular = p.stock >= 3 && (hasDiscount || p.price > 400);

  // ===== YOUTH THEME CARD =====
  if (storefrontTheme === "youth") {
    return (
      <Link
        to="/product/$id" params={{ id: p.id }}
        className="group block rounded-2xl overflow-hidden bg-card border-2 border-border hover:border-[#22C55E] hover:shadow-[0_8px_30px_-8px_rgba(34,197,94,0.4)] transition-all duration-300 relative"
      >
        <div
          className="aspect-[4/5] overflow-hidden bg-muted relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {images.length > 0 ? (
            images.map((src, i) => (
              <img
                key={src + i}
                src={src}
                alt={p.name}
                loading="lazy"
                className={`absolute inset-0 size-full object-cover transition-opacity duration-700 ${activeImg === i ? "opacity-100" : "opacity-0"}`}
              />
            ))
          ) : (
            <div className="size-full grid place-items-center text-muted-foreground text-xs">لا توجد صورة</div>
          )}

          {/* Youth: vibrant discount badge */}
          {hasDiscount && (
            <span className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full text-[11px] font-black bg-[#22C55E] text-white shadow-lg">
              -{discountPct}%
            </span>
          )}

          {/* Stock badges */}
          {isOutOfStock ? (
            <span className="absolute top-3 left-3 z-10 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white">نفذ</span>
          ) : isLastItems ? (
            <span className="absolute top-3 left-3 z-10 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">⏳ آخر قطع</span>
          ) : isNew ? (
            <span className="absolute top-3 left-3 z-10 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#22C55E] text-white">⚡ جديد</span>
          ) : isPopular ? (
            <span className="absolute top-3 left-3 z-10 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-lime-400 text-[#052E16]">🔥 رائج</span>
          ) : null}

          {/* Heart */}
          <button
            onClick={onHeartClick}
            aria-label="أضف للمفضلة"
            className="absolute bottom-3 right-3 z-20 grid place-items-center size-8 rounded-full bg-card/90 backdrop-blur-sm shadow-md hover:scale-110 active:scale-95 transition"
          >
            <Heart className={`size-4 ${inWishlist ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
          </button>

          {/* Quick add */}
          {p.stock > 0 && (
            <button
              onClick={quickAdd}
              aria-label="أضف للسلة"
              className="absolute bottom-3 left-3 z-20 grid place-items-center size-9 rounded-full bg-[#22C55E] text-white shadow-lg hover:scale-110 active:scale-95 transition-all opacity-90 md:opacity-0 md:group-hover:opacity-100"
            >
              <Plus className="size-5 font-bold" />
            </button>
          )}

          {images.length > 1 && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-1 z-10 opacity-0">
              {images.map((_, i) => (
                <span key={i} className={`size-1.5 rounded-full transition-all duration-300 ${activeImg === i ? "bg-[#22C55E] scale-125" : "bg-white/50"}`} />
              ))}
            </div>
          )}
        </div>

        <div className="p-3">
          <div className="mb-1.5 flex">
            <span className="text-[9px] px-2 py-0.5 rounded-full font-black border border-[#22C55E]/30 bg-[#DCFCE7] text-[#14532D]">
              {catAr(p.category)}
            </span>
          </div>
          <div className="font-bold text-sm line-clamp-1 text-foreground">{p.name}</div>
          {p.stock === 0 && (
            <div className="text-[10px] font-semibold text-red-500 mt-0.5">هيتوفر قريباً</div>
          )}
          <div className="mt-2 flex items-baseline gap-2">
            {hasDiscount ? (
              <>
                <span className="font-display text-base font-black text-[#16A34A]">{formatEGP(p.discountedPrice!)}</span>
                <span className="text-xs text-muted-foreground line-through">{formatEGP(p.price)}</span>
              </>
            ) : (
              <span className="font-display text-base font-black text-foreground">{formatEGP(p.price)}</span>
            )}
          </div>
          {p.stock > 0 && (
            <button
              onClick={quickAdd}
              className="mt-2 w-full flex items-center justify-center gap-2 py-1.5 rounded-xl bg-[#22C55E] text-white text-xs font-bold hover:bg-[#16A34A] transition active:scale-95 md:hidden"
            >
              <ShoppingBag className="size-3.5" />
              أضف للسلة
            </button>
          )}
        </div>
      </Link>
    );
  }

  // ===== PREMIUM THEME CARD =====
  if (storefrontTheme === "premium") {
    return (
      <Link
        to="/product/$id" params={{ id: p.id }}
        className="group block rounded-sm overflow-hidden bg-card border border-[#E8D5B8] hover:border-[#B8860B] hover:shadow-[0_12px_40px_-12px_rgba(184,134,11,0.25)] transition-all duration-300 relative"
      >
        <div
          className="aspect-[4/5] overflow-hidden bg-muted relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {images.length > 0 ? (
            images.map((src, i) => (
              <img
                key={src + i}
                src={src}
                alt={p.name}
                loading="lazy"
                className={`absolute inset-0 size-full object-cover transition-opacity duration-700 ${activeImg === i ? "opacity-100" : "opacity-0"}`}
              />
            ))
          ) : (
            <div className="size-full grid place-items-center text-muted-foreground text-xs">لا توجد صورة</div>
          )}

          {/* Premium: refined discount label */}
          {hasDiscount && (
            <span className="absolute top-3 right-3 z-10 px-2.5 py-0.5 text-[10px] font-bold bg-[#B8860B] text-white">
              -{discountPct}%
            </span>
          )}

          {isOutOfStock ? (
            <span className="absolute top-3 left-3 z-10 px-2 py-0.5 text-[10px] font-semibold bg-foreground/80 text-background">نفذ</span>
          ) : isLastItems ? (
            <span className="absolute top-3 left-3 z-10 px-2 py-0.5 text-[10px] font-semibold bg-amber-700/80 text-white">آخر قطع</span>
          ) : isNew ? (
            <span className="absolute top-3 left-3 z-10 px-2 py-0.5 text-[10px] font-semibold border border-[#B8860B] text-[#B8860B] bg-card/80">جديد</span>
          ) : null}

          <button
            onClick={onHeartClick}
            aria-label="أضف للمفضلة"
            className="absolute top-3 left-3 z-20 grid place-items-center size-8 rounded-full bg-card/80 backdrop-blur-sm shadow-sm hover:scale-110 active:scale-95 transition"
          >
            <Heart className={`size-4 ${inWishlist ? "fill-red-500 text-red-500" : "text-muted-foreground"}`} />
          </button>
        </div>

        <div className="p-4">
          <div className="text-[9px] tracking-[0.15em] uppercase text-muted-foreground mb-1.5 font-semibold">
            {catAr(p.category)}
          </div>
          <div className="font-serif text-sm font-bold line-clamp-2 text-foreground leading-snug">{p.name}</div>
          {p.stock === 0 && (
            <div className="text-[10px] text-muted-foreground mt-0.5">هيتوفر قريباً</div>
          )}
          <div className="mt-2 flex items-baseline gap-2">
            {hasDiscount ? (
              <>
                <span className="text-base font-bold text-[#B8860B]">{formatEGP(p.discountedPrice!)}</span>
                <span className="text-xs text-muted-foreground line-through">{formatEGP(p.price)}</span>
              </>
            ) : (
              <span className="text-base font-bold text-foreground">{formatEGP(p.price)}</span>
            )}
          </div>
          {p.stock > 0 && (
            <button
              onClick={quickAdd}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2 border border-[#B8860B] text-[#B8860B] text-xs font-semibold tracking-wide hover:bg-[#B8860B] hover:text-white transition-colors active:scale-95 rounded-sm"
            >
              <ShoppingBag className="size-3.5" />
              أضف للسلة
            </button>
          )}
        </div>
      </Link>
    );
  }

  // ===== DEFAULT / STANDARD CARD =====
  return (
    <Link
      to="/product/$id" params={{ id: p.id }}
      className="group block rounded-2xl overflow-hidden bg-card border hover:shadow-luxe transition-all duration-300 relative"
    >
      <div
        className="aspect-[4/5] overflow-hidden bg-muted relative"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {images.length > 0 ? (
          images.map((src, i) => (
            <img
              key={src + i}
              src={src}
              alt={p.name}
              loading="lazy"
              className={`absolute inset-0 size-full object-cover transition-opacity duration-700 ${activeImg === i ? "opacity-100" : "opacity-0"}`}
            />
          ))
        ) : (
          <div className="size-full grid place-items-center text-muted-foreground">لا توجد صورة</div>
        )}

        {images.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10 bg-black/40 px-2 py-0.5 rounded-full">
            {images.map((_, i) => (
              <span key={i} className={`size-1.5 rounded-full transition-all duration-300 ${activeImg === i ? "bg-[#D4A017] scale-125" : "bg-[#F5F0E8]/50"}`} />
            ))}
          </div>
        )}

        <button
          onClick={onHeartClick}
          aria-label="أضف للمفضلة"
          className="absolute top-3 right-3 z-20 grid place-items-center size-8 rounded-full bg-card/80 backdrop-blur-sm text-foreground shadow-md hover:scale-110 active:scale-95 transition"
        >
          <Heart className={`size-4 transition-colors ${inWishlist ? "fill-red-500 text-red-500" : "text-muted-foreground hover:text-red-500"}`} />
        </button>

        {isOutOfStock ? (
          <span className="absolute top-3 left-3 z-10 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-red-600 text-white shadow-md">⚠️ نفذ</span>
        ) : isLastItems ? (
          <span className="absolute top-3 left-3 z-10 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-amber-600 text-white shadow-md">⏳ آخر قطع</span>
        ) : isNew ? (
          <span className="absolute top-3 left-3 z-10 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-600 text-white shadow-md">⚡ جديد</span>
        ) : isPopular ? (
          <span className="absolute top-3 left-3 z-10 px-2.5 py-0.5 rounded-lg text-[10px] font-bold gradient-gold text-primary shadow-md">🔥 رائج</span>
        ) : hasDiscount ? (
          <span className="absolute top-3 left-3 z-10 px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-gold text-primary shadow-md">خصم خاص</span>
        ) : null}

        {p.stock > 0 && (
          <button
            onClick={quickAdd}
            aria-label="أضف للسلة"
            className="absolute bottom-3 left-3 z-20 grid place-items-center size-9 rounded-full gradient-gold text-primary shadow-luxe hover:scale-110 active:scale-95 transition-all opacity-90 md:opacity-0 md:group-hover:opacity-100"
          >
            <Plus className="size-5 font-bold" />
          </button>
        )}
      </div>

      <div className="p-3">
        <div className="mb-1 flex">
          <span className={`text-[9px] px-2 py-0.5 rounded-full font-black border ${getCategoryBadge(p.category).bg} ${getCategoryBadge(p.category).text} ${getCategoryBadge(p.category).border}`}>
            {catAr(p.category)}
          </span>
        </div>
        <div className="font-bold text-sm line-clamp-1 text-foreground">{p.name}</div>
        {p.stock === 0 && (
          <div className="text-[10px] font-semibold text-red-500 mt-0.5">هيتوفر قريباً</div>
        )}
        <div className="mt-1.5 flex items-baseline gap-2">
          {hasDiscount ? (
            <>
              <span className="font-display text-base font-black text-gold">{formatEGP(p.discountedPrice!)}</span>
              <span className="text-xs text-muted-foreground line-through">{formatEGP(p.price)}</span>
            </>
          ) : (
            <span className="font-display text-base font-black text-foreground">{formatEGP(p.price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
