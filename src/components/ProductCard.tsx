import { Link } from "@tanstack/react-router";
import { formatEGP } from "@/lib/format";

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
          <span className="absolute top-3 left-3 px-2 py-1 rounded-md text-xs font-bold bg-destructive text-destructive-foreground">نفدت</span>
        )}
      </div>
      <div className="p-4">
        <div className="text-xs text-muted-foreground mb-1">{p.category}</div>
        <div className="font-semibold line-clamp-1">{p.name}</div>
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
