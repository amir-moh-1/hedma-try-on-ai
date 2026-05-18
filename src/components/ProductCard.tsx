import { Link } from "@tanstack/react-router";
import { formatEGP } from "@/lib/format";
import { catAr } from "@/lib/categories";
import { useCart } from "@/lib/cart";
import { Plus, Heart } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useWishlistIds, useWishlistToggle } from "@/lib/wishlist";

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
  const hasDiscount = p.discountedPrice != null && p.discountedPrice < p.price;
  const finalPrice = hasDiscount ? p.discountedPrice! : p.price;
  const { add } = useCart();

  // Wishlist via Supabase
  const { data: wishlistIds } = useWishlistIds();
  const toggleWishlist = useWishlistToggle();
  const inWishlist = !!wishlistIds?.has(p.id);

  const onHeartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(p.id, inWishlist);
  };

  // Build image carousel from main + secondary
  const images = [p.image_url, p.secondary_image_url].filter(Boolean) as string[];
  const [activeImg, setActiveImg] = useState(0);
  const [paused, setPaused] = useState(false);
  const cardRef = useRef<HTMLAnchorElement>(null);

  // Auto-scroll every 2.5s when multiple images and not paused
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

  // Badge Logic
  const isOutOfStock = p.stock === 0;
  const isLastItems = p.stock > 0 && p.stock < 3;
  const isNew = p.created_at && (new Date().getTime() - new Date(p.created_at).getTime()) < 7 * 24 * 60 * 60 * 1000;
  const isPopular = p.stock >= 3 && (hasDiscount || p.price > 400);

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

        {/* Corner Badges */}
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

        {/* Direct gold Plus button */}
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
        <div className="text-[10px] text-muted-foreground mb-0.5">{catAr(p.category)}</div>
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
