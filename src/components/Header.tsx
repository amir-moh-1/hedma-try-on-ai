import { Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Logo } from "./Logo";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { Button } from "./ui/button";
import { NotificationBell } from "./NotificationBell";
import { UserNotificationBell } from "./UserNotificationBell";
import { ShoppingBag, Heart, User, LayoutDashboard, LogOut, Sparkles, Store, Truck, Package, Settings, Moon, Sun, Globe } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "./ui/dropdown-menu";
import { useTheme } from "./ThemeProvider";

export function Header() {
  const { user, profile, isAdmin, isVendor, isDelivery, signOut } = useAuth();
  const { count } = useCart();
  const nav = useNavigate();
  const { theme, setTheme } = useTheme();
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    const updateCount = () => {
      try {
        const list = JSON.parse(localStorage.getItem("hedma-wishlist") || "[]");
        setWishlistCount(list.length);
      } catch {
        setWishlistCount(0);
      }
    };
    updateCount();
    window.addEventListener("wishlist-change", updateCount);
    window.addEventListener("storage", updateCount);
    return () => {
      window.removeEventListener("wishlist-change", updateCount);
      window.removeEventListener("storage", updateCount);
    };
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
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
        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="ghost" size="icon" className="size-8 sm:size-9" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="size-4 sm:size-5" /> : <Moon className="size-4 sm:size-5" />}
          </Button>
          {/* [4] Admin notification bell (global notifications) */}
          {isAdmin && <NotificationBell />}
          {/* [4] User notification bell (per-user notifications from admin) */}
          {user && <UserNotificationBell />}
          <Button variant="ghost" size="icon" className="relative size-8 sm:size-9" onClick={() => nav({ to: "/wishlist" })} aria-label="المفضلة">
            <Heart className="size-4 sm:size-5" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -left-1 grid place-items-center min-w-4 h-4 sm:min-w-5 sm:h-5 px-0.5 sm:px-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-red-500 text-white">{wishlistCount}</span>
            )}
          </Button>
          <Button variant="ghost" size="icon" className="relative size-8 sm:size-9" onClick={() => nav({ to: "/cart" })} aria-label="السلة">
            <ShoppingBag className="size-4 sm:size-5" />
            {count > 0 && (
              <span className="absolute -top-1 -left-1 grid place-items-center min-w-4 h-4 sm:min-w-5 sm:h-5 px-0.5 sm:px-1 rounded-full text-[10px] sm:text-[11px] font-bold gradient-gold text-primary">{count}</span>
            )}
          </Button>
          {!user ? (
            <Button onClick={() => nav({ to: "/auth" })} className="gradient-gold text-primary hover:opacity-90 text-xs sm:text-sm px-3 sm:px-4 h-8 sm:h-9">دخول</Button>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-1 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 px-2 sm:px-3">
                  <User className="size-3.5 sm:size-4" />
                  <span className="hidden sm:inline max-w-[80px] truncate">{profile?.username ?? "حسابي"}</span>
                  <span className="sm:hidden">حسابي</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52 sm:w-56">
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
                <DropdownMenuItem onClick={() => nav({ to: "/profile" })}><Globe className="size-4 ml-2" /> عالمي</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => nav({ to: "/profile" })}><Settings className="size-4 ml-2" /> إعدادات الحساب</DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()}><LogOut className="size-4 ml-2" /> تسجيل الخروج</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
