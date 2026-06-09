import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Edit, Package, X } from "lucide-react";
import { toast } from "sonner";
import { formatEGP } from "@/lib/format";

// Modular Components
import { AdminSidebar } from "@/components/AdminSidebar";
import { DashboardTab } from "@/components/DashboardTab";
import { OrdersTab } from "@/components/OrdersTab";
import { CustomersTab } from "@/components/CustomersTab";
import { MerchantsTab } from "@/components/MerchantsTab";
import { ProductsTab } from "@/components/admin/ProductsTab";
import { CouponsTab } from "@/components/admin/CouponsTab";
import { UsersTab } from "@/components/admin/UsersTab";
import { SettingsTab } from "@/components/SettingsTab";
import { PresetsTab } from "@/components/PresetsTab";
import { ActivityTab } from "@/components/admin/ActivityTab";
import { VendorInsightsTab } from "@/components/admin/VendorInsightsTab";
import { ProductControlTab } from "@/components/admin/ProductControlTab";
import { InventoryReportsTab } from "@/components/admin/InventoryReportsTab";
import { PasswordRecoveryTab } from "@/components/admin/PasswordRecoveryTab";
import { NotificationsTab } from "@/components/admin/NotificationsTab";
// New tabs from Replit
import { PasswordManagerTab } from "@/components/admin/PasswordManagerTab";
import { MergedInventoryMerchantsTab } from "@/components/admin/MergedInventoryMerchantsTab";
import { StorefrontBuilderTab } from "@/components/admin/StorefrontBuilderTab";

export const Route = createFileRoute("/admin")({ component: AdminPanel });

const TAB_LABELS: Record<string, string> = {
  dashboard: "لوحة التحكم",
  products: "قائمة المنتجات",
  "product-control": "التحكم بالمنتجات",
  "inventory-merchants": "الجرد والتجار",
  orders: "الطلبيات",
  merchants: "المحلات والتجار",
  users: "المستخدمين والصلاحيات",
  recovery: "استعادة الحسابات",
  passwords: "كلمات المرور",
  notifications: "إرسال إشعار",
  customers: "قاعدة العملاء",
  inventory: "الجرد والتقارير",
  "vendor-insights": "تحليل أداء التجار",
  coupons: "العروض والكوبونات",
  presets: "رفع جماعي مسبق",
  settings: "الإعدادات",
  "site-settings": "إعدادات الموقع",
  "storefront-builder": "مصمم المتجر المرئي",
};

function AdminPanel() {
  const { user, isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) nav({ to: "/auth" });
  }, [loading, user, isAdmin, nav]);

  const { data: profiles } = useQuery({
    queryKey: ["admin-profiles"], enabled: isAdmin,
    queryFn: async () => {
      const [{ data: p }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("id,username,phone,full_name,created_at"),
        supabase.from("user_roles").select("user_id,role"),
      ]);
      const roleMap = new Map<string, string[]>();
      (r ?? []).forEach((x) => { const arr = roleMap.get(x.user_id) ?? []; arr.push(x.role); roleMap.set(x.user_id, arr); });
      return (p ?? []).map((u) => ({ ...u, roles: roleMap.get(u.id) ?? [] }));
    },
  });

  const { data: products } = useQuery({
    queryKey: ["admin-products"], enabled: isAdmin,
    staleTime: 2 * 60_000,
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id,name,price,category,stock,active,vendor_id,created_at,image_url").order("created_at",{ascending:false});
      const ids = Array.from(new Set((data ?? []).map((p) => p.vendor_id)));
      const { data: profs } = ids.length ? await supabase.from("profiles").select("id,username").in("id", ids) : { data: [] };
      const m = new Map((profs ?? []).map((p) => [p.id, p.username]));
      return (data ?? []).map((p) => ({ ...p, vendor: m.get(p.vendor_id) ?? "—" }));
    },
  });

  if (loading || !isAdmin) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="animate-spin size-8 border-4 border-gold border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background" dir="rtl">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="flex-1 overflow-y-auto bg-muted/5 custom-scrollbar">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b px-4 md:px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-black tracking-tight">
              {TAB_LABELS[activeTab] ?? "لوحة التحكم"}
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              مرحباً {user?.user_metadata?.username || user?.email} 👋
            </p>
          </div>
          <Link to="/" className="text-xs font-bold px-4 py-2 rounded-xl bg-accent hover:bg-accent/70 transition-colors">
            معاينة الموقع ↗
          </Link>
        </header>

        <div className="p-4 md:p-8">
          {activeTab === "dashboard" && <DashboardTab />}
          {activeTab === "orders" && <OrdersTab profiles={profiles ?? []} />}
          {activeTab === "merchants" && <MerchantsTab profiles={profiles ?? []} />}
          {activeTab === "customers" && <CustomersTab setCouponTab={(u) => { setActiveTab("coupons"); }} />}
          {activeTab === "settings" && <SettingsTab />}
          {activeTab === "site-settings" && <SettingsTab />}
          {activeTab === "vendor-insights" && <VendorInsightsTab />}
          {activeTab === "presets" && <PresetsTab />}

          {activeTab === "users" && (
            <div className="animate-in slide-in-from-left-4 duration-300">
               <UsersTab profiles={profiles ?? []} />
            </div>
          )}

          {activeTab === "products" && (
            <div className="animate-in fade-in duration-300">
               <ProductsTab products={products ?? []} />
            </div>
          )}

          {activeTab === "product-control" && (
            <div className="animate-in fade-in duration-300">
              <ProductControlTab />
            </div>
          )}

          {activeTab === "inventory" && (
             <div className="animate-in fade-in duration-300">
               <InventoryReportsTab />
             </div>
          )}

          {activeTab === "inventory-merchants" && (
            <div className="animate-in fade-in duration-300">
              <MergedInventoryMerchantsTab profiles={profiles ?? []} />
            </div>
          )}

          {activeTab === "recovery" && (
             <div className="animate-in fade-in duration-300">
               <PasswordRecoveryTab />
             </div>
          )}

          {activeTab === "passwords" && (
            <div className="animate-in fade-in duration-300">
              <PasswordManagerTab />
            </div>
          )}

          {activeTab === "notifications" && (
             <div className="animate-in fade-in duration-300">
               <NotificationsTab />
             </div>
          )}

          {activeTab === "coupons" && (
            <div className="animate-in zoom-in-95 duration-300">
               <CouponsTab />
            </div>
          )}

          {activeTab === "storefront-builder" && (
            <div className="animate-in fade-in duration-300">
              <StorefrontBuilderTab />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}