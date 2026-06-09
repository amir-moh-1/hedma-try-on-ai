import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard, Package, ListOrdered, Ticket, Users,
  Settings, LogOut, Menu, X, Bell, ChevronDown, Store, Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useState } from "react";

type MenuItem =
  | { id: string; label: string; icon: any; href?: string; divider?: false }
  | { divider: true; label: string };

export function AdminSidebar({ activeTab, setActiveTab }: { activeTab: string; setActiveTab: (t: string) => void }) {
  const { signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const menu: MenuItem[] = [
    { id: "dashboard", label: "لوحة التحكم", icon: LayoutDashboard },

    { divider: true, label: "المنتجات" },
    { id: "products", label: "قائمة المنتجات", icon: Package },
    { id: "inventory-merchants", label: "الجرد والتجار", icon: Store },
    { id: "coupons", label: "العروض والكوبونات", icon: Ticket },

    { divider: true, label: "العمليات" },
    { id: "orders", label: "الطلبيات", icon: ListOrdered },
    { id: "notifications", label: "الإشعارات والتنبيهات", icon: Bell },

    { divider: true, label: "المستخدمون" },
    { id: "users", label: "المستخدمين والصلاحيات", icon: Users },
    { id: "passwords", label: "كلمات المرور", icon: Settings },

    { divider: true, label: "الموقع" },
    { id: "storefront-builder", label: "مصمم المتجر المرئي", icon: Palette },
    { id: "settings", label: "إعدادات الموقع", icon: Settings },
    { id: "add-product", label: "لوحة التاجر →", icon: Package, href: "/vendor" },
  ];

  const handleSignOut = async () => {
    if (confirm("هل أنت متأكد من تسجيل الخروج؟")) await signOut();
  };

  const handleClick = (id: string) => {
    setActiveTab(id);
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Toggle */}
      <Button
        variant="outline" size="icon"
        className="fixed top-4 right-4 z-50 md:hidden bg-card border-gold/20"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </Button>

      <aside className={`
        fixed inset-y-0 right-0 z-40 w-60 bg-card border-l transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 flex flex-col
        ${isOpen ? "translate-x-0 shadow-2xl" : "translate-x-full md:translate-x-0"}
      `}>
        {/* Logo */}
        <div className="px-5 py-5 border-b shrink-0">
          <h2 className="font-display text-2xl font-black text-gold-gradient tracking-wider">HEDMA</h2>
          <p className="text-[10px] text-muted-foreground font-bold opacity-70 mt-0.5">المدير الفائق 🔥</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          {menu.map((item, idx) => {
            if (item.divider) {
              return (
                <div key={`div-${idx}`} className="px-3 pt-4 pb-1">
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{item.label}</span>
                </div>
              );
            }

            const Icon = item.icon;
            const isActive = activeTab === item.id;

            if (item.href) {
              return (
                <Link key={item.id} to={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition">
                  <Icon className="size-4 shrink-0" />
                  <span className="font-semibold">{item.label}</span>
                </Link>
              );
            }

            return (
              <button key={item.id}
                onClick={() => handleClick(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition text-right ${
                  isActive
                    ? "gradient-gold text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <Icon className={`size-4 shrink-0 ${isActive ? "text-primary" : ""}`} />
                <span className="font-semibold">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="shrink-0 p-3 border-t">
          <Link to="/" className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-muted-foreground hover:bg-muted transition font-semibold mb-1">
            <Package className="size-4 shrink-0" />
            معاينة الموقع
          </Link>
          <button onClick={handleSignOut}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition font-bold">
            <LogOut className="size-4 shrink-0" />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {isOpen && (
        <div className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden" onClick={() => setIsOpen(false)} />
      )}
    </>
  );
}
