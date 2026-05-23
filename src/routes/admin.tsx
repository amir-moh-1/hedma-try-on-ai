import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Edit, Package } from "lucide-react";
import { toast } from "sonner";
import { formatEGP } from "@/lib/format";

// Modular Components
import { AdminSidebar } from "@/components/AdminSidebar";
import { DashboardTab } from "@/components/DashboardTab";
import { OrdersTab } from "@/components/OrdersTab";
import { CustomersTab } from "@/components/CustomersTab";
import { MerchantsTab } from "@/components/MerchantsTab";
import { ProductsTab } from "@/components/admin/ProductsTab"; // Wait, I'll build this logic inline or move it
import { CouponsTab } from "@/components/admin/CouponsTab"; // Same here
import { UsersTab } from "@/components/admin/UsersTab";
import { SettingsTab } from "@/components/SettingsTab";
import { PresetsTab } from "@/components/PresetsTab";
import { ActivityTab } from "@/components/admin/ActivityTab";
import { VendorInsightsTab } from "@/components/admin/VendorInsightsTab";
import { ProductControlTab } from "@/components/admin/ProductControlTab";
import { InventoryReportsTab } from "@/components/admin/InventoryReportsTab";
import { PasswordRecoveryTab } from "@/components/admin/PasswordRecoveryTab";

export const Route = createFileRoute("/admin")({ component: AdminPanel });

function AdminPanel() {
  const { user, isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) nav({ to: "/auth" });
  }, [loading, user, isAdmin, nav]);

  const [activeTab, setActiveTab] = useState("dashboard");

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
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id,name,price,category,stock,active,vendor_id,created_at").order("created_at",{ascending:false});
      const ids = Array.from(new Set((data ?? []).map((p) => p.vendor_id)));
      const { data: profs } = ids.length ? await supabase.from("profiles").select("id,username").in("id", ids) : { data: [] };
      const m = new Map((profs ?? []).map((p) => [p.id, p.username]));
      return (data ?? []).map((p) => ({ ...p, vendor: m.get(p.vendor_id) ?? "—" }));
    },
  });

  if (loading || !isAdmin) return <div className="h-screen w-full flex items-center justify-center bg-background"><div className="animate-spin size-8 border-4 border-gold-gradient border-t-transparent rounded-full" /></div>;

  return (
    <div className="flex h-screen overflow-hidden bg-background" dir="rtl">
      {/* Professional Sidebar */}
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto bg-muted/5 custom-scrollbar">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b px-8 py-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-black uppercase tracking-tight">
              {activeTab === "dashboard" && "لوحة التحكم"}
              {activeTab === "products" && "المنتجات"}
              {activeTab === "product-control" && "التحكم بالمنتجات"}
              {activeTab === "orders" && "الطلبيات"}
              {activeTab === "merchants" && "المحلات والتجار"}
              {activeTab === "users" && "المستخدمين والصلاحيات"}
              {activeTab === "recovery" && "استعادة الحسابات"}
              {activeTab === "customers" && "قاعدة العملاء"}
              {activeTab === "inventory" && "الجرد والتقارير"}
              {activeTab === "vendor-insights" && "تحليل أداء التجار"}
              {activeTab === "coupons" && "العروض والكوبونات"}
              {activeTab === "presets" && "رفع جماعي مسبق"}
              {activeTab === "settings" && "الإعدادات"}
              {activeTab === "site-settings" && "إعدادات الموقع"}
            </h1>
            <p className="text-xs text-muted-foreground mt-1 font-semibold">مرحباً {user?.user_metadata?.username || user?.email} - المدير الفائق 🔥</p>
          </div>
          
          <div className="flex items-center gap-3">
             <Link to="/" className="text-xs font-bold px-4 py-2 rounded-xl bg-accent hover:bg-accent/70 transition-colors">معاينة الموقع</Link>
          </div>
        </header>

        <div className="p-8">
          {activeTab === "dashboard" && <DashboardTab />}
          {activeTab === "orders" && <OrdersTab profiles={profiles ?? []} />}
          {activeTab === "merchants" && <MerchantsTab profiles={profiles ?? []} />}
          {activeTab === "customers" && <CustomersTab setCouponTab={(u) => { setActiveTab("coupons"); }} />}
          {activeTab === "settings" && <SettingsTab />}
          {activeTab === "site-settings" && <SettingsTab />}
          {activeTab === "vendor-insights" && <VendorInsightsTab />}
          {activeTab === "presets" && <PresetsTab />}
          
          {activeTab === "users" && (
            <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
               <UsersTab profiles={profiles ?? []} />
            </div>
          )}

          {activeTab === "products" && (
            <div className="space-y-6 animate-in fade-in duration-500">
               <ProductsTab products={products ?? []} />
            </div>
          )}

          {activeTab === "product-control" && (
            <div className="space-y-6 animate-in fade-in duration-500">
              <ProductControlTab />
            </div>
          )}

          {activeTab === "inventory" && (
             <div className="space-y-6 animate-in fade-in duration-500">
               <InventoryReportsTab />
             </div>
          )}

          {activeTab === "recovery" && (
             <div className="space-y-6 animate-in fade-in duration-500">
               <PasswordRecoveryTab />
             </div>
          )}

          {activeTab === "coupons" && (
            <div className="animate-in zoom-in-95 duration-500">
               <CouponsTab />
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

// Inline Helper Components for simplicity in this file
function ProductsTable({ products }: { products: any[] }) {
  return (
    <div className="rounded-3xl border bg-card overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-right">
          <thead className="bg-muted/30">
            <tr>
              <th className="p-4">المنتج</th>
              <th className="p-4">التاجر</th>
              <th className="p-4">السعر</th>
              <th className="p-4">المخزون</th>
              <th className="p-4">الحالة</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t hover:bg-muted/10 transition-colors">
                <td className="p-4 font-bold"><Link to="/product/$id" params={{ id: p.id }} className="hover:text-gold-gradient">{p.name}</Link></td>
                <td className="p-4 text-muted-foreground">{p.vendor}</td>
                <td className="p-4 font-display">{formatEGP(p.price)}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-md font-bold ${p.stock < 5 ? "bg-destructive/10 text-destructive" : ""}`}>
                    {p.stock} {p.stock === 0 ? "(نفد)" : p.stock < 5 ? "(منخفض)" : ""}
                  </span>
                </td>
                <td className="p-4">{p.active ? "✅ نشط" : "❌ معطل"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InventoryView({ products }: { products: any[] }) {
  const grouped = products.reduce((acc: any, p: any) => {
    const v = p.vendor || "غير محدد";
    if (!acc[v]) acc[v] = [];
    acc[v].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-8 animate-in slide-up duration-500">
      {Object.entries(grouped).map(([vendor, items]: [string, any]) => (
        <div key={vendor} className="rounded-3xl border bg-card overflow-hidden shadow-md">
          <div className="bg-gold-gradient/10 p-5 border-b flex items-center justify-between">
            <h3 className="font-bold text-lg flex items-center gap-2">🛍️ تاجر: {vendor}</h3>
            <span className="text-xs bg-card px-3 py-1 rounded-full font-bold">إجمالي السلع: {items.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead>
                <tr className="bg-muted/20">
                  <th className="p-4">المنتج</th>
                  <th className="p-4">سعر الجملة</th>
                  <th className="p-4">سعر البيع</th>
                  <th className="p-4">الخصم (%)</th>
                  <th className="p-4 text-center">الكمية المتاحة</th>
                  <th className="p-4">الربح المتوقع</th>
                  <th className="p-4">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p: any) => {
                  const wholesale = p.variants?.wholesale_price || 0;
                  const discount = p.variants?.discount_percent || 0;
                  const profit = (p.price - (p.price * (discount/100))) - wholesale;
                  
                  return (
                    <tr key={p.id} className="border-t hover:bg-muted/5 transition-colors">
                      <td className="p-4 font-semibold">{p.name}</td>
                      <td className="p-4 font-mono">{formatEGP(wholesale)}</td>
                      <td className="p-4 font-mono">{formatEGP(p.price)}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 bg-destructive/10 text-destructive rounded-full font-bold">{discount}%</span>
                      </td>
                      <td className="p-4 text-center">
                         <span className={`text-lg font-black ${p.stock < 5 ? "text-destructive underline decoration-wavy" : "text-gold-gradient"}`}>{p.stock}</span>
                      </td>
                      <td className="p-4 font-bold text-green-600">{formatEGP(profit)}</td>
                      <td className="p-4">
                         {p.stock === 0 ? (
                           <span className="flex items-center gap-1 text-destructive font-bold"><X className="size-3" /> نفد تماماً</span>
                         ) : p.stock < 5 ? (
                           <span className="flex items-center gap-1 text-orange-500 font-bold"><Package className="size-3" /> مخزون حرج</span>
                         ) : (
                           <span className="text-green-500 font-bold">🟢 متوفر</span>
                         )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
