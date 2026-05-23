import { Link } from "@tanstack/react-router";
import { 
  LayoutDashboard, Package, PlusCircle, UploadCloud, ListOrdered, 
  Store, BrainCircuit, Ticket, Users, Settings, Globe, UserCircle, 
  LogOut, Menu, X, TrendingUp, Key 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useState } from "react";

export function AdminSidebar({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (t: string) => void }) {
  const { signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
    { id: "products", label: "المنتجات", icon: Package },
    { id: "product-control", label: "التحكم بالمنتجات", icon: Settings },
    { id: "add-product", label: "إضافة منتج", icon: PlusCircle, href: "/vendor" },
    { id: "presets", label: "رفع جماعي", icon: UploadCloud },
    { id: "orders", label: "الطلبيات", icon: ListOrdered },
    { id: "merchants", label: "المحلات", icon: Store },
    { id: "vendor-insights", label: "تحليل التجار", icon: TrendingUp },
    { id: "inventory", label: "الجرد والتقارير", icon: BrainCircuit },
    { id: "coupons", label: "العروض والكوبونات", icon: Ticket },
    { id: "users", label: "المستخدمين والصلاحيات", icon: Users },
    { id: "recovery", label: "استعادة الحسابات", icon: Key },
    { id: "customers", label: "العملاء", icon: UserCircle },
    { id: "settings", label: "الإعدادات", icon: Settings },
    { id: "site-settings", label: "إعدادات الموقع", icon: Globe },
    { id: "profile", label: "حسابي", icon: UserCircle, href: "/profile" },
  ];

  const handleSignOut = async () => {
    if (confirm("هل أنت متأكد من تسجيل الخروج؟")) {
      await signOut();
    }
  };

  return (
    <>
      {/* Mobile Toggle */}
      <Button 
        variant="outline" 
        size="icon" 
        className="fixed top-4 right-4 z-50 md:hidden bg-card border-gold-gradient/20"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="size-5" /> : <Menu className="size-5" />}
      </Button>

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 right-0 z-40 w-64 bg-card border-l transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isOpen ? "translate-x-0 shadow-2xl" : "translate-x-full md:translate-x-0"}
      `}>
        <div className="flex flex-col h-full p-4">
          <div className="mb-8 px-4 py-2">
            <h2 className="font-display text-2xl font-black text-gold-gradient tracking-wider">HEDMA</h2>
            <p className="text-[10px] text-muted-foreground font-bold opacity-70">لوحة التحكم - المدير الفائق</p>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              
              const content = (
                <div className="flex items-center gap-3">
                  <Icon className={`size-5 transition-colors ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                  <span className="font-semibold text-sm">{item.label}</span>
                </div>
              );

              if (item.href) {
                return (
                  <Link 
                    key={item.id} 
                    to={item.href}
                    className="group flex items-center px-4 py-3 rounded-xl transition-all duration-200 text-muted-foreground hover:bg-muted hover:text-foreground"
                  >
                    {content}
                  </Link>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setIsOpen(false); }}
                  className={`
                    w-full group flex items-center px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive 
                      ? "gradient-gold text-primary shadow-lg shadow-gold-gradient/10 scale-[1.02]" 
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"}
                  `}
                >
                  {content}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto pt-4 border-t border-muted">
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-all duration-200 font-bold"
            >
              <LogOut className="size-5" />
              <span className="text-sm">تسجيل الخروج</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
