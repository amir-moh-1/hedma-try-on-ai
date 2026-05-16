import { Link } from "@tanstack/react-router";
import { formatEGP } from "@/lib/format";
import { catAr } from "@/lib/categories";
import { useCart } from "@/lib/cart";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";

export type ProductCardData = {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category: string;
  stock: number;
  discountedPrice?: number | null;
};

export function ProductCard({ p }: { p: ProductCardData }) {
  const hasDiscount = p.discountedPrice != null && p.discountedPrice < p.price;
  const finalPrice = hasDiscount ? p.discountedPrice! : p.price;
  const { add } = useCart();

  const quickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (p.stock === 0) return;
    add({ id: p.id, name: p.name, price: finalPrice, image: p.image_url ?? undefined });
    toast.success("اتضاف للسلة ✅", { description: p.name });
  };

  return (
    <Link
      to="/product/$id" params={{ id: p.id }}
      className="group block rounded-2xl overflow-hidden bg-card border hover:shadow-luxe transition-all duration-300"
    >
      <div className="aspect-[4/5] overflow-hidden bg-muted relative">
        {p.image_url ? (
          <img src={p.image_url} alt={p.name} loading="lazy"
            className="size-full object-cover group-hover:scale-105 transition duration-700" />
        ) : <div className="size-full grid place-items-center text-muted-foreground">لا توجد صورة</div>}
        {hasDiscount && (
          <span className="absolute top-3 right-3 px-2 py-1 rounded-md text-xs font-bold gradient-gold text-primary shadow-luxe">خصم خاص</span>
        )}
        {p.stock === 0 && (
          <span className="absolute top-3 left-3 px-2 py-1 rounded-md text-xs font-bold bg-destructive text-destructive-foreground">نفذ المخزون ⚠️</span>
        )}
        {p.stock > 0 && (
          <button
            onClick={quickAdd}
            aria-label="أضف للسلة"
            className="absolute bottom-3 left-3 grid place-items-center size-10 rounded-full gradient-gold text-primary shadow-luxe opacity-0 group-hover:opacity-100 hover:scale-110 transition md:opacity-100"
          >
            <ShoppingBag className="size-5" />
          </button>
        )}
      </div>
      <div className="p-4">
        <div className="text-xs text-muted-foreground mb-1">{catAr(p.category)}</div>
        <div className="font-semibold line-clamp-1">{p.name}</div>
        {p.stock === 0 && (
          <div className="text-xs font-bold text-red-600 mt-0.5">هيتوفر قريباً</div>
        )}
        <div className="mt-2 flex items-baseline gap-2">
          {hasDiscount ? (
            <>
              <span className="font-display text-lg font-bold text-gold-gradient">{formatEGP(p.discountedPrice!)}</span>
              <span className="text-sm text-muted-foreground line-through">{formatEGP(p.price)}</span>
            </>
          ) : (
            <span className="font-display text-lg font-bold">{formatEGP(p.price)}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
