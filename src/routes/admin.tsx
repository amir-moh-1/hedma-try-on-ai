import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { formatEGP } from "@/lib/format";
import { Trash2, Plus, Activity, Users, Tag, Package, Settings as SettingsIcon, Truck, Store, Sparkles, FileText, Edit } from "lucide-react";
import { ORDER_STATUS_AR } from "@/lib/settings";
import { OffersManager } from "@/components/OffersManager";
import { CreateUser } from "@/components/CreateUser";
import { EditUserDialog } from "@/components/EditUserDialog";
import { CustomersTab } from "@/components/CustomersTab";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export const Route = createFileRoute("/admin")({ component: AdminPanel });

function AdminPanel() {
  const { user, isAdmin, loading } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) nav({ to: "/auth" });
  }, [loading, user, isAdmin, nav]);

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"], enabled: isAdmin,
    queryFn: async () => {
      const [{ count: products }, { count: users }, { count: coupons }, { count: logs }] = await Promise.all([
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("coupons").select("*", { count: "exact", head: true }).eq("active", true),
        supabase.from("activity_logs").select("*", { count: "exact", head: true }),
      ]);
      return { products: products ?? 0, users: users ?? 0, coupons: coupons ?? 0, logs: logs ?? 0 };
    },
  });

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

  const { data: coupons } = useQuery({
    queryKey: ["admin-coupons"], enabled: isAdmin,
    queryFn: async () => {
      const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });
      const userIds = Array.from(new Set((data ?? []).map((c) => c.user_id)));
      const { data: profs } = userIds.length
        ? await supabase.from("profiles").select("id,username").in("id", userIds)
        : { data: [] };
      const m = new Map((profs ?? []).map((p) => [p.id, p.username]));
      return (data ?? []).map((c) => ({ ...c, username: m.get(c.user_id) ?? "—" }));
    },
  });

  const { data: logs } = useQuery({
    queryKey: ["admin-logs"], enabled: isAdmin,
    queryFn: async () => {
      const { data } = await supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(100);
      const userIds = Array.from(new Set((data ?? []).map((l) => l.user_id).filter(Boolean) as string[]));
      const { data: profs } = userIds.length
        ? await supabase.from("profiles").select("id,username").in("id", userIds)
        : { data: [] };
      const m = new Map((profs ?? []).map((p) => [p.id, p.username]));
      return (data ?? []).map((l) => ({ ...l, username: l.user_id ? (m.get(l.user_id) ?? "—") : "زائر" }));
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

  const [editingUser, setEditingUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("orders");

  const [coupon, setCoupon] = useState({ username: "", percent: 10, code: "", message: "خصم خاص ليك من Hedma 🎁" });
  const addCoupon = async () => {
    if (!coupon.username || !coupon.percent || !coupon.code) return toast.error("املأ كل الحقول");
    const { data: prof } = await supabase.from("profiles").select("id").eq("username", coupon.username).maybeSingle();
    if (!prof) return toast.error("المستخدم ده مش موجود");
    const { error } = await supabase.from("coupons").insert({ user_id: prof.id, percent: coupon.percent, code: coupon.code, message: coupon.message, active: true });
    if (error) return toast.error(error.message);
    toast.success("تم إضافة الكوبون");
    setCoupon({ ...coupon, username: "", code: "" });
    qc.invalidateQueries({ queryKey: ["admin-coupons"] });
  };
  const toggleCoupon = async (id: string, active: boolean) => {
    await supabase.from("coupons").update({ active: !active }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-coupons"] });
  };
  const deleteCoupon = async (id: string) => {
    await supabase.from("coupons").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-coupons"] });
  };
  const setRole = async (uid: string, role: "admin"|"vendor"|"customer"|"delivery", on: boolean) => {
    if (on) await supabase.from("user_roles").insert({ user_id: uid, role });
    else await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", role);
    qc.invalidateQueries({ queryKey: ["admin-profiles"] });
    toast.success("تم تحديث الصلاحيات");
  };

  if (loading || !isAdmin) return <div className="p-10 text-center">...</div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-3xl font-bold">لوحة المدير</h1>
        <Link to="/vendor" className="text-sm font-semibold text-gold-gradient hover:underline">لوحة المنتجات الكاملة ←</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { Icon: Package, t: "المنتجات", v: stats?.products },
          { Icon: Users, t: "المستخدمين", v: stats?.users },
          { Icon: Tag, t: "كوبونات نشطة", v: stats?.coupons },
          { Icon: Activity, t: "نشاطات مسجلة", v: stats?.logs },
        ].map(({ Icon, t, v }) => (
          <div key={t} className="rounded-2xl border bg-card p-4 flex items-center gap-3">
            <Icon className="size-8 text-gold-gradient" />
            <div><div className="text-2xl font-bold">{v ?? "—"}</div><div className="text-xs text-muted-foreground">{t}</div></div>
          </div>
        ))}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="orders">الطلبيات</TabsTrigger>
          <TabsTrigger value="users">المستخدمين والصلاحيات</TabsTrigger>
          <TabsTrigger value="customers">العملاء</TabsTrigger>
          <TabsTrigger value="merchants">المحلات</TabsTrigger>
          <TabsTrigger value="products">كل المنتجات</TabsTrigger>
          <TabsTrigger value="presets">الإدخال السريع</TabsTrigger>
          <TabsTrigger value="coupons">العروض والكوبونات</TabsTrigger>
          <TabsTrigger value="settings">إعدادات الموقع</TabsTrigger>
          <TabsTrigger value="activity">سجل النشاط</TabsTrigger>
        </TabsList>

        <TabsContent value="orders" className="mt-4"><OrdersTab profiles={profiles ?? []} /></TabsContent>
        <TabsContent value="settings" className="mt-4"><SettingsTab /></TabsContent>
        <TabsContent value="merchants" className="mt-4"><MerchantsTab profiles={profiles ?? []} /></TabsContent>
        <TabsContent value="presets" className="mt-4"><PresetsTab /></TabsContent>
        <TabsContent value="customers" className="mt-4">
          <CustomersTab setCouponTab={(username) => {
            setCoupon({ ...coupon, username });
            setActiveTab("coupons");
          }} />
        </TabsContent>

        <TabsContent value="users" className="mt-4">
          <CreateUser />
          <div className="rounded-2xl border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40"><tr><th className="p-3 text-right">اليوزر نيم</th><th className="p-3 text-right">الاسم</th><th className="p-3 text-right">التليفون</th><th className="p-3 text-right">الصلاحيات</th><th className="p-3">إجراء</th></tr></thead>
              <tbody>
                {(profiles ?? []).map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="p-3 font-semibold">{u.username}</td>
                    <td className="p-3">{u.full_name ?? "—"}</td>
                    <td className="p-3">{u.phone ?? "—"}</td>
                    <td className="p-3 flex gap-2 flex-wrap">
                      {(["admin","vendor","customer","delivery"] as const).map((r) => {
                        const has = u.roles.includes(r);
                        return (
                          <button key={r} onClick={() => setRole(u.id, r, !has)}
                            className={`px-2 py-0.5 rounded-md text-xs border ${has ? "gradient-gold text-primary border-transparent" : "text-muted-foreground hover:border-foreground/30"}`}>{r}</button>
                        );
                      })}
                    </td>
                    <td className="p-3">
                      <Button size="sm" variant="ghost" onClick={() => setEditingUser(u)}><Edit className="size-4" /></Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {editingUser && <EditUserDialog user={editingUser} onClose={() => setEditingUser(null)} />}
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <div className="space-y-6">
            {Object.entries((products ?? []).reduce((acc: any, p: any) => {
              const vendor = p.vendor || "غير محدد";
              if (!acc[vendor]) acc[vendor] = [];
              acc[vendor].push(p);
              return acc;
            }, {})).map(([vendor, vendorProducts]: [string, any]) => (
              <div key={vendor} className="rounded-2xl border bg-card overflow-hidden">
                <div className="bg-muted/50 p-4 border-b font-bold flex items-center justify-between">
                  <span>🛍️ تاجر: {vendor}</span>
                  <span className="text-sm font-normal text-muted-foreground">عدد المنتجات: {vendorProducts.length}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/20"><tr><th className="p-3 text-right w-1/2">المنتج</th><th className="p-3 text-right">السعر</th><th className="p-3 text-right">المخزون</th><th className="p-3 text-right">حالة</th></tr></thead>
                    <tbody>
                      {vendorProducts.map((p: any) => (
                        <tr key={p.id} className="border-t hover:bg-muted/10 transition-colors">
                          <td className="p-3 font-semibold"><Link to="/product/$id" params={{ id: p.id }} className="hover:text-gold-gradient">{p.name}</Link></td>
                          <td className="p-3">{formatEGP(p.price)}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded-md font-bold ${p.stock === 0 ? "bg-destructive/10 text-destructive" : p.stock < 5 ? "bg-amber-500/10 text-amber-600" : "text-muted-foreground"}`}>
                              {p.stock}
                              {p.stock === 0 && " (نفد)"}
                              {p.stock > 0 && p.stock < 5 && " (منخفض)"}
                            </span>
                          </td>
                          <td className="p-3">{p.active ? "✅" : "❌"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
            {(!products || products.length === 0) && <div className="p-10 text-center text-muted-foreground border rounded-2xl">لا توجد منتجات</div>}
          </div>
        </TabsContent>

        <TabsContent value="coupons" className="mt-4 space-y-6">
          <div className="rounded-2xl border bg-card p-5">
            <h3 className="font-bold mb-3 flex items-center gap-2"><Plus className="size-4" /> إضافة كوبون لمستخدم</h3>
            <div className="grid md:grid-cols-4 gap-3">
              <div><Label>اليوزر نيم</Label><Input value={coupon.username} onChange={(e) => setCoupon({ ...coupon, username: e.target.value })} /></div>
              <div><Label>الكود</Label><Input value={coupon.code} onChange={(e) => setCoupon({ ...coupon, code: e.target.value.toUpperCase() })} placeholder="HEDMA10" /></div>
              <div><Label>نسبة الخصم %</Label><Input type="number" value={coupon.percent} onChange={(e) => setCoupon({ ...coupon, percent: Number(e.target.value) })} /></div>
              <div className="md:col-span-1 flex items-end"><Button onClick={addCoupon} className="w-full gradient-gold text-primary">إضافة</Button></div>
              <div className="md:col-span-4"><Label>رسالة شكر</Label><Textarea rows={2} value={coupon.message} onChange={(e) => setCoupon({ ...coupon, message: e.target.value })} /></div>
            </div>
          </div>
          <div className="rounded-2xl border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40"><tr><th className="p-3 text-right">المستخدم</th><th className="p-3 text-right">الكود</th><th className="p-3 text-right">الخصم</th><th className="p-3 text-right">حالة</th><th className="p-3"></th></tr></thead>
              <tbody>
                {(coupons ?? []).map((c) => (
                  <tr key={c.id} className="border-t">
                    <td className="p-3 font-semibold">{c.username}</td>
                    <td className="p-3 font-mono">{c.code}</td>
                    <td className="p-3">{c.percent}%</td>
                    <td className="p-3"><button onClick={() => toggleCoupon(c.id, c.active)}>{c.active ? "✅ نشط" : "⏸️ موقوف"}</button></td>
                    <td className="p-3"><Button size="sm" variant="ghost" onClick={() => deleteCoupon(c.id)}><Trash2 className="size-3 text-destructive" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <OffersManager />
        </TabsContent>

        <TabsContent value="activity" className="mt-4">
          <div className="rounded-2xl border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40"><tr><th className="p-3 text-right">الوقت</th><th className="p-3 text-right">المستخدم</th><th className="p-3 text-right">النشاط</th><th className="p-3 text-right">التفاصيل</th></tr></thead>
              <tbody>
                {(logs ?? []).map((l) => (
                  <tr key={l.id} className="border-t">
                    <td className="p-3 text-xs text-muted-foreground ltr text-right">{new Date(l.created_at).toLocaleString("ar-EG")}</td>
                    <td className="p-3 font-semibold">{l.username}</td>
                    <td className="p-3"><span className="px-2 py-0.5 rounded-md bg-accent text-xs">{l.action}</span></td>
                    <td className="p-3 text-xs text-muted-foreground font-mono ltr text-right">{JSON.stringify(l.details)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function OrdersTab({ profiles }: { profiles: { id: string; username: string; roles: string[] }[] }) {
  const qc = useQueryClient();
  const { data: orders } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
    refetchInterval: 15_000,
  });
  const agents = profiles.filter((p) => p.roles.includes("delivery") || p.roles.includes("admin"));
  
  const update = async (id: string, patch: any, oldStatus: string, items: any[]) => {
    if (patch.status && (patch.status === "in_transit" || patch.status === "delivered") && 
        (oldStatus === "pending" || oldStatus === "approved" || oldStatus === "assigned")) {
      // Deduct stock
      for (const item of items) {
        const { data: p } = await supabase.from("products").select("stock").eq("id", item.id).single();
        if (p && p.stock >= item.qty) {
          await supabase.from("products").update({ stock: p.stock - item.qty }).eq("id", item.id);
        }
      }
      toast.info("تم خصم الكميات من المخزون بنجاح");
    }
  
    const { error } = await supabase.from("orders").update(patch).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("تم تحديث الطلب"); qc.invalidateQueries({ queryKey: ["admin-orders"] }); qc.invalidateQueries({ queryKey: ["admin-products"] }); }
  };

  const generateInvoice = async (order: any) => {
    toast.info("جاري تحضير الفاتورة...");
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.top = "-9999px";
    container.style.left = "-9999px";
    container.style.width = "800px";
    container.style.backgroundColor = "white";
    container.style.padding = "40px";
    container.style.direction = "rtl";
    container.style.fontFamily = "Cairo, system-ui, sans-serif";
    container.style.color = "black";
    
    const itemsHTML = ((order.items as any[]) ?? []).map(i => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px;">${i.name}</td>
        <td style="padding: 12px;">${i.size || "-"}</td>
        <td style="padding: 12px;">${i.color || "-"}</td>
        <td style="padding: 12px; font-weight: bold;">${i.qty}</td>
        <td style="padding: 12px;" dir="ltr">${formatEGP(i.price)}</td>
        <td style="padding: 12px;" dir="ltr">${formatEGP(i.price * i.qty)}</td>
      </tr>
    `).join("");

    container.innerHTML = `
      <div style="border: 2px solid #f3f4f6; padding: 30px; border-radius: 16px;">
        <h1 style="text-align: center; color: #b8860b; font-size: 32px; margin-bottom: 5px; font-weight: 800;">فاتورة هدمة (HEDMA)</h1>
        <p style="text-align: center; color: #666; margin-bottom: 30px;">أناقتك تبدأ من هنا</p>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #f3f4f6; padding-bottom: 20px;">
          <div>
            <p style="margin: 5px 0;"><strong>رقم الطلب:</strong> <span dir="ltr">#${order.id.slice(0, 8)}</span></p>
            <p style="margin: 5px 0;"><strong>التاريخ:</strong> <span dir="ltr">${new Date(order.created_at).toLocaleString("ar-EG")}</span></p>
          </div>
          <div style="text-align: left;">
            <p style="margin: 5px 0;"><strong>العميل:</strong> ${order.customer_name || "-"}</p>
            <p style="margin: 5px 0;"><strong>الهاتف:</strong> <span dir="ltr">${order.customer_phone || "-"}</span></p>
            <p style="margin: 5px 0;"><strong>العنوان:</strong> ${order.customer_address || "-"}</p>
          </div>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; text-align: right;">
          <thead style="background-color: #f9fafb; border-bottom: 2px solid #e5e7eb;">
            <tr>
              <th style="padding: 12px;">المنتج</th>
              <th style="padding: 12px;">المقاس</th>
              <th style="padding: 12px;">اللون</th>
              <th style="padding: 12px;">الكمية</th>
              <th style="padding: 12px;">السعر</th>
              <th style="padding: 12px;">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>
        
        <div style="text-align: left; font-size: 18px; background-color: #f9fafb; padding: 20px; border-radius: 12px; display: inline-block; float: left; min-width: 250px;">
          ${order.discount > 0 ? `<div style="display: flex; justify-content: space-between; margin-bottom: 10px;"><span>الخصم:</span> <span dir="ltr" style="color: #ef4444;">-${formatEGP(order.discount)}</span></div>` : ""}
          <div style="display: flex; justify-content: space-between; border-top: 1px solid #e5e7eb; padding-top: 10px; font-size: 24px; color: #b8860b; font-weight: bold;">
            <span>الإجمالي النهائي:</span> <span dir="ltr">${formatEGP(order.total - (order.discount || 0))}</span>
          </div>
        </div>
        <div style="clear: both;"></div>
        
        <div style="text-align: center; margin-top: 50px; color: #9ca3af; font-size: 14px;">
          <p>شكراً لتسوقك من هدمة! نتمنى أن تنال منتجاتنا إعجابك.</p>
        </div>
      </div>
    `;

    document.body.appendChild(container);
    
    try {
      const canvas = await html2canvas(container, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`invoice_hedma_${order.id.slice(0, 8)}.pdf`);
      toast.success("تم تحميل الفاتورة بنجاح");
    } catch (err) {
      toast.error("حدث خطأ أثناء توليد الفاتورة");
      console.error(err);
    } finally {
      document.body.removeChild(container);
    }
  };
  return (
    <div className="space-y-3">
      {(orders ?? []).length === 0 && (
        <div className="rounded-2xl border bg-card p-8 text-center text-muted-foreground">لا توجد طلبيات</div>
      )}
      {(orders ?? []).map((o: any) => {
        const items = (o.items as any[]) ?? [];
        return (
          <div key={o.id} className="rounded-2xl border bg-card p-4">
            <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
              <div>
                <div className="font-mono text-xs text-muted-foreground">#{o.id.slice(0,8)}</div>
                <div className="font-bold">{o.customer_name ?? "—"} • {o.customer_phone ?? "—"}</div>
                <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString("ar-EG")}</div>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <div>
                  <div className="font-display font-bold text-lg">{formatEGP(Number(o.total) - Number(o.discount))}</div>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-accent">{ORDER_STATUS_AR[o.status as keyof typeof ORDER_STATUS_AR]}</span>
                </div>
                <Button size="sm" variant="outline" onClick={() => generateInvoice(o)} className="h-7 text-xs">
                  <FileText className="size-3 ml-1" /> PDF فاتورة
                </Button>
              </div>
            </div>
            {o.customer_address && <div className="text-xs text-muted-foreground mb-2">📍 {o.customer_address}</div>}
            <ul className="text-xs text-muted-foreground mb-3">
              {items.map((i: any, idx: number) => (
                <li key={idx}>• {i.name} × {i.qty}</li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2 items-center mt-3 border-t pt-3">
              <Select value={o.status} onValueChange={(v) => update(o.id, { status: v }, o.status, items)}>
                <SelectTrigger className="w-[170px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(ORDER_STATUS_AR).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={o.delivery_agent_id ?? "none"} onValueChange={(v) => update(o.id, { delivery_agent_id: v === "none" ? null : v, status: v === "none" ? o.status : "assigned" }, o.status, items)}>
                <SelectTrigger className="w-[200px]"><Truck className="size-3 ml-1" /><SelectValue placeholder="مندوب التوصيل" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— بدون مندوب —</SelectItem>
                  {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.username}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SettingsTab() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["site-settings-admin"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("id", "main").maybeSingle();
      return data;
    },
  });
  const [form, setForm] = useState<any>(null);
  useEffect(() => {
    if (data && !form) setForm({ ...data, quick_links_str: JSON.stringify(data.quick_links ?? [], null, 2) });
  }, [data, form]);
  if (!form) return <div className="p-6 text-center">...</div>;
  const save = async () => {
    let links: any = [];
    try { links = JSON.parse(form.quick_links_str); }
    catch { return toast.error("الروابط السريعة JSON غير صحيح"); }
    const { error } = await supabase.from("site_settings").update({
      whatsapp: form.whatsapp, email: form.email,
      instagram_url: form.instagram_url, facebook_url: form.facebook_url, tiktok_url: form.tiktok_url,
      address: form.address, quick_links: links,
    }).eq("id", "main");
    if (error) return toast.error(error.message);
    toast.success("تم حفظ الإعدادات");
    qc.invalidateQueries({ queryKey: ["site-settings"] });
    qc.invalidateQueries({ queryKey: ["site-settings-admin"] });
  };
  const F = (label: string, key: string, placeholder = "") => (
    <div><Label>{label}</Label><Input value={form[key] ?? ""} placeholder={placeholder} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></div>
  );
  return (
    <div className="rounded-2xl border bg-card p-6 space-y-4">
      <h3 className="font-bold flex items-center gap-2"><SettingsIcon className="size-4" /> إعدادات الموقع العامة</h3>
      <div className="grid md:grid-cols-2 gap-3">
        {F("رقم الواتساب (مع كود الدولة بدون +)", "whatsapp", "201229344711")}
        {F("الإيميل", "email", "hedma@example.com")}
        {F("رابط إنستجرام", "instagram_url", "https://instagram.com/...")}
        {F("رابط فيسبوك", "facebook_url", "https://facebook.com/...")}
        {F("رابط تيك توك", "tiktok_url", "https://tiktok.com/@...")}
        {F("العنوان", "address", "التل الكبير، الإسماعيلية")}
      </div>
      <div>
        <Label>الروابط السريعة (JSON)</Label>
        <Textarea rows={8} className="font-mono text-xs ltr text-left" value={form.quick_links_str} onChange={(e) => setForm({ ...form, quick_links_str: e.target.value })} />
        <p className="text-xs text-muted-foreground mt-1">مثال: <code>{`[{"label":"الرئيسية","to":"/"}]`}</code></p>
      </div>
      <Button onClick={save} className="gradient-gold text-primary">حفظ التغييرات</Button>
    </div>
  );
}

function MerchantsTab({ profiles }: { profiles: { id: string; username: string; roles: string[] }[] }) {
  const qc = useQueryClient();
  const { data: merchants } = useQuery({
    queryKey: ["admin-merchants"],
    queryFn: async () => {
      const { data } = await supabase.from("merchants").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
  });
  const { data: counts } = useQuery({
    queryKey: ["merchant-product-counts"],
    queryFn: async () => {
      const { data } = await supabase.from("products").select("merchant_id,price,stock");
      const map = new Map<string, { count: number; stockValue: number }>();
      (data ?? []).forEach((p) => {
        if (!p.merchant_id) return;
        const cur = map.get(p.merchant_id) ?? { count: 0, stockValue: 0 };
        cur.count += 1;
        cur.stockValue += Number(p.price) * Number(p.stock ?? 0);
        map.set(p.merchant_id, cur);
      });
      return map;
    },
  });
  const vendors = profiles.filter((p) => p.roles.includes("vendor") || p.roles.includes("admin"));
  const [form, setForm] = useState({ id: "", shop_name: "", whatsapp: "", location: "", logo_url: "", owner_id: "", active: true });
  const reset = () => setForm({ id: "", shop_name: "", whatsapp: "", location: "", logo_url: "", owner_id: "", active: true });

  const save = async () => {
    if (!form.shop_name || !form.owner_id) return toast.error("اسم المحل والمالك مطلوبين");
    if (form.id) {
      const { error } = await supabase.from("merchants").update({
        shop_name: form.shop_name, whatsapp: form.whatsapp, location: form.location,
        logo_url: form.logo_url, owner_id: form.owner_id, active: form.active,
      }).eq("id", form.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("merchants").insert({
        shop_name: form.shop_name, whatsapp: form.whatsapp, location: form.location,
        logo_url: form.logo_url, owner_id: form.owner_id, active: form.active,
      });
      if (error) return toast.error(error.message);
    }
    toast.success("تم");
    reset();
    qc.invalidateQueries({ queryKey: ["admin-merchants"] });
    qc.invalidateQueries({ queryKey: ["merchants-list"] });
  };
  const del = async (id: string) => {
    if (!confirm("حذف المحل؟")) return;
    await supabase.from("merchants").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-merchants"] });
  };
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-5 space-y-3">
        <h3 className="font-bold flex items-center gap-2"><Store className="size-4" /> {form.id ? "تعديل محل" : "إضافة محل جديد"}</h3>
        <div className="grid md:grid-cols-2 gap-3">
          <div><Label>اسم المحل *</Label><Input value={form.shop_name} onChange={(e) => setForm({ ...form, shop_name: e.target.value })} /></div>
          <div>
            <Label>المالك (تاجر) *</Label>
            <Select value={form.owner_id} onValueChange={(v) => setForm({ ...form, owner_id: v })}>
              <SelectTrigger><SelectValue placeholder="اختر التاجر" /></SelectTrigger>
              <SelectContent>{vendors.map((v) => <SelectItem key={v.id} value={v.id}>{v.username}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>واتساب المحل</Label><Input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="201xxxxxxxxx" /></div>
          <div><Label>الموقع</Label><Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>رابط اللوجو</Label><Input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} /></div>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> نشط</label>
        <div className="flex gap-2">
          <Button onClick={save} className="gradient-gold text-primary">{form.id ? "حفظ" : "إضافة"}</Button>
          {form.id && <Button variant="ghost" onClick={reset}>إلغاء</Button>}
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {(merchants ?? []).map((m: any) => {
          const c = counts?.get(m.id);
          const owner = profiles.find((p) => p.id === m.owner_id);
          return (
            <div key={m.id} className="rounded-2xl border bg-card p-4">
              <div className="flex items-center gap-3">
                {m.logo_url ? <img src={m.logo_url} className="size-12 rounded-lg object-cover" alt="" /> : <div className="size-12 rounded-lg bg-muted grid place-items-center"><Store className="size-5" /></div>}
                <div className="flex-1 min-w-0">
                  <div className="font-bold line-clamp-1">{m.shop_name}</div>
                  <div className="text-xs text-muted-foreground">المالك: {owner?.username ?? "—"}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                <div className="rounded-lg bg-muted/40 p-2"><div className="text-muted-foreground">المنتجات</div><div className="font-bold">{c?.count ?? 0}</div></div>
                <div className="rounded-lg bg-muted/40 p-2"><div className="text-muted-foreground">قيمة المخزون</div><div className="font-bold">{formatEGP(c?.stockValue ?? 0)}</div></div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={() => setForm({ id: m.id, shop_name: m.shop_name, whatsapp: m.whatsapp ?? "", location: m.location ?? "", logo_url: m.logo_url ?? "", owner_id: m.owner_id, active: m.active })}>تعديل</Button>
                <Button size="sm" variant="destructive" onClick={() => del(m.id)}><Trash2 className="size-3" /></Button>
              </div>
            </div>
          );
        })}
        {(merchants ?? []).length === 0 && <div className="col-span-full text-center text-muted-foreground py-10">لا توجد محلات</div>}
      </div>
    </div>
  );
}

function PresetsTab() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["all-presets"],
    queryFn: async () => {
      const { data } = await supabase.from("input_presets").select("*");
      return data ?? [];
    },
  });
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  useEffect(() => {
    if (data) {
      const d: Record<string, string> = {};
      data.forEach((p: any) => { d[p.id] = (p.values as string[]).join(", "); });
      setDrafts(d);
    }
  }, [data]);
  const save = async (id: string) => {
    const values = (drafts[id] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    const { error } = await supabase.from("input_presets").upsert({ id, values: values as never });
    if (error) return toast.error(error.message);
    toast.success("تم الحفظ");
    qc.invalidateQueries({ queryKey: ["preset", id] });
    qc.invalidateQueries({ queryKey: ["all-presets"] });
  };
  const labels: Record<string, string> = { sizes: "المقاسات", colors: "الألوان", categories: "الفئات" };
  return (
    <div className="space-y-4">
      <div className="rounded-xl border bg-accent/30 p-4 text-sm flex items-start gap-2">
        <Sparkles className="size-4 mt-0.5" />
        <div>عدّل القيم اللي هتظهر كأزرار جاهزة في صفحة إضافة المنتج. افصل بين كل قيمة بفاصلة.</div>
      </div>
      {["sizes", "colors", "categories"].map((id) => (
        <div key={id} className="rounded-2xl border bg-card p-4 space-y-2">
          <Label className="font-bold">{labels[id]}</Label>
          <Textarea rows={3} value={drafts[id] ?? ""} onChange={(e) => setDrafts({ ...drafts, [id]: e.target.value })} />
          <Button onClick={() => save(id)} size="sm" className="gradient-gold text-primary">حفظ {labels[id]}</Button>
        </div>
      ))}
    </div>
  );
}
