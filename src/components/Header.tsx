import { Link, useNavigate } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { Button } from "./ui/button";
import { ShoppingBag, User, LayoutDashboard, LogOut, Sparkles, Store, Truck, Package } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "./ui/dropdown-menu";

export function Header() {
  const { user, profile, isAdmin, isVendor, isDelivery, signOut } = useAuth();
  const { count } = useCart();
  const nav = useNavigate();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between gap-4">
        <Logo />
        <nav className="hidden md:flex items-center gap-5 text-sm font-medium">
          <Link to="/" className="hover:text-gold-gradient transition" activeProps={{ className: "text-foreground font-bold" }}>الرئيسية</Link>
          <Link to="/products" className="hover:text-gold-gradient transition">المنتجات</Link>
          <Link to="/try-on" className="flex items-center gap-1 hover:text-gold-gradient transition">
            <Sparkles className="size-4" /> جرّبها بالـ AI
          </Link>
          <Link to="/customers" className="hover:text-gold-gradient transition">زبايننا</Link>
          <Link to="/our-story" className="hover:text-gold-gradient transition">قصتنا</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => nav({ to: "/cart" })} aria-label="السلة" className="relative">
            <ShoppingBag className="size-5" />
            {count > 0 && (
              <span className="absolute -top-1 -left-1 grid place-items-center min-w-5 h-5 px-1 rounded-full text-[11px] font-bold gradient-gold text-primary">{count}</span>
            )}
          </Button>
          {!user ? (
            <Button onClick={() => nav({ to: "/auth" })} className="gradient-gold text-primary hover:opacity-90">دخول</Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2"><User className="size-4" />{profile?.username ?? "حسابي"}</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {isAdmin && (
                  <DropdownMenuItem onClick={() => nav({ to: "/admin" })}><LayoutDashboard className="size-4 ml-2" /> لوحة المدير</DropdownMenuItem>
                )}
                {isVendor && (
                  <DropdownMenuItem onClick={() => nav({ to: "/vendor" })}><Store className="size-4 ml-2" /> لوحة التاجر</DropdownMenuItem>
                )}
                {isDelivery && (
                  <DropdownMenuItem onClick={() => nav({ to: "/delivery" })}><Truck className="size-4 ml-2" /> لوحة التوصيل</DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => nav({ to: "/my-orders" })}><Package className="size-4 ml-2" /> طلباتي</DropdownMenuItem>
                <DropdownMenuItem onClick={() => nav({ to: "/cart" })}><ShoppingBag className="size-4 ml-2" /> سلتي</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}><LogOut className="size-4 ml-2" /> تسجيل الخروج</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
