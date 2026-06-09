import { Link, useLocation } from "@tanstack/react-router";
import { Home, ShoppingBag, Heart, Sparkles, Globe2 } from "lucide-react";
import { useAuth } from "@/lib/auth";

export function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const path = location.pathname;

  const items = [
    { label: "الرئيسية", icon: Home, to: "/" },
    { label: "منتجات", icon: ShoppingBag, to: "/products" },
    { label: "المفضلة", icon: Heart, to: "/wishlist" },
    { label: "AI Try-On", icon: Sparkles, to: "/try-on" },
    { label: "عالمي", icon: Globe2, to: user ? "/my-world" : "/auth" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-card border-t border-border z-40 flex items-center justify-around md:hidden shadow-lg safe-bottom">
      {items.map((item) => {
        const isActive = path === item.to || (item.to === "/products" && path.startsWith("/products")) || (item.to === "/wishlist" && path === "/wishlist");
        return (
          <Link
            key={item.label}
            to={item.to as any}
            className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-all ${isActive ? "text-gold font-bold scale-105" : "text-muted-foreground hover:text-foreground"}`}
          >
            <item.icon className={`size-5 transition-transform ${isActive ? "scale-110" : ""}`} />
            <span className="text-[10px] tracking-wide font-bold">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
