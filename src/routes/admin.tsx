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
import { Trash2, Plus, Activity, Users, Tag, Package, Settings as SettingsIcon, Truck } from "lucide-react";
import { ORDER_STATUS_AR } from "@/lib/settings";

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
  const setRole = async (uid: string, role: "admin"|"vendor"|"customer", on: boolean) => {
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

      <Tabs defaultValue="users">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="users">المستخدمين والصلاحيات</TabsTrigger>
          <TabsTrigger value="products">كل المنتجات</TabsTrigger>
          <TabsTrigger value="coupons">العروض والكوبونات</TabsTrigger>
          <TabsTrigger value="activity">سجل النشاط</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <div className="rounded-2xl border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40"><tr><th className="p-3 text-right">اليوزر نيم</th><th className="p-3 text-right">التليفون</th><th className="p-3 text-right">الصلاحيات</th></tr></thead>
              <tbody>
                {(profiles ?? []).map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="p-3 font-semibold">{u.username}</td>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="products" className="mt-4">
          <div className="rounded-2xl border bg-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40"><tr><th className="p-3 text-right">المنتج</th><th className="p-3 text-right">التاجر</th><th className="p-3 text-right">السعر</th><th className="p-3 text-right">المخزون</th><th className="p-3 text-right">حالة</th></tr></thead>
              <tbody>
                {(products ?? []).map((p) => (
                  <tr key={p.id} className="border-t">
                    <td className="p-3 font-semibold"><Link to="/product/$id" params={{ id: p.id }} className="hover:text-gold-gradient">{p.name}</Link></td>
                    <td className="p-3">{p.vendor}</td>
                    <td className="p-3">{formatEGP(p.price)}</td>
                    <td className="p-3">{p.stock}</td>
                    <td className="p-3">{p.active ? "✅" : "❌"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
