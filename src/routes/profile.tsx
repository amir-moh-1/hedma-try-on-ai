import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useAuth, logActivity } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ORDER_STATUS_AR } from "@/lib/settings";
import {
  Globe, Package, Heart, Tag, Clock, User, Lock, Save, Loader2,
  Copy, ShoppingBag, Activity, ChevronLeft, Star, Zap,
} from "lucide-react";

export const Route = createFileRoute("/profile")({ component: WorldPage });

const TABS = [
  { id: "world", label: "ط¹ط§ظ„ظ…ظٹ ًںŒچ", icon: Globe },
  { id: "orders", label: "ط·ظ„ط¨ط§طھظٹ", icon: Package },
  { id: "settings", label: "ط¥ط¹ط¯ط§ط¯ط§طھظٹ", icon: User },
];

function WorldPage() {
  const { user, profile, refreshRoles } = useAuth();
  const nav = useNavigate();
  const [activeTab, setActiveTab] = useState<"world" | "orders" | "settings">("world");

  useEffect(() => {
    if (!user) nav({ to: "/auth" });
  }, [user, nav]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      {/* Header */}
      <div className="border-b bg-card/60 backdrop-blur-xl sticky top-0 z-20">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="size-12 rounded-2xl gradient-gold flex items-center justify-center text-primary font-black text-xl shadow-luxe">
              {profile?.username?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "طں"}
            </div>
            <div>
              <div className="font-black text-lg leading-tight">
                {profile?.username || profile?.full_name || "ط£ظ‡ظ„ط§ظ‹ ط¨ظƒ"}
              </div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
            </div>
            <div className="mr-auto flex items-center gap-2">
              {TABS.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === t.id ? "gradient-gold text-primary shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
                >
                  <t.icon className="size-3.5" />
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-8">
        {activeTab === "world" && <WorldTab user={user} profile={profile} />}
        {activeTab === "orders" && <OrdersTab userId={user.id} />}
        {activeTab === "settings" && <SettingsTab user={user} profile={profile} refreshRoles={refreshRoles} />}
      </div>
    </div>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€ WORLD TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function WorldTab({ user, profile }: { user: any; profile: any }) {
  const [wishlistIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem("hedma-wishlist") || "[]"); } catch { return []; }
  });

  const { data: orders } = useQuery({
    queryKey: ["profile-orders", user.id],
    staleTime: 2 * 60_000,
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("id,total,status,created_at").eq("customer_id" as any, user.id).order("created_at", { ascending: false }).limit(5);
      return data ?? [];
    },
  });

  const { data: coupons } = useQuery({
    queryKey: ["active-coupons-profile"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase.from("product_offers").select("id,title,percent,code,ends_at").eq("active", true).gt("ends_at", new Date().toISOString()).is("product_id", null).order("percent", { ascending: false }).limit(6);
      return data ?? [];
    },
  });

  const { data: activity } = useQuery({
    queryKey: ["profile-activity", user.id],
    staleTime: 2 * 60_000,
    queryFn: async () => {
      const { data } = await supabase.from("activity_logs").select("id,action,details,created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(8);
      return data ?? [];
    },
  });

  const { data: wishlistProducts } = useQuery({
    queryKey: ["wishlist-preview", wishlistIds.join(",")],
    enabled: wishlistIds.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id,name,price,image_url").in("id", wishlistIds.slice(0, 4));
      return data ?? [];
    },
  });

  const totalSpent = (orders ?? []).reduce((sum: number, o: any) => sum + (o.total || 0), 0);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).then(() => toast.success(`طھظ… ظ†ط³ط® ط§ظ„ظƒظˆط¯: ${code}`));
  };

  return (
    <div className="space-y-8">
      {/* â”€â”€ STATS â”€â”€ */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ط·ظ„ط¨ط§طھ", value: (orders ?? []).length, icon: ShoppingBag, color: "text-blue-400" },
          { label: "ط¥ط¬ظ…ط§ظ„ظٹ ط§ظ„ظ…ط´طھط±ظٹط§طھ", value: `${totalSpent.toLocaleString()} ط¬`, icon: Zap, color: "text-gold" },
          { label: "ط§ظ„ظ…ط­ظپظˆط¸ط§طھ", value: wishlistIds.length, icon: Heart, color: "text-red-400" },
          { label: "ط¹ط±ظˆط¶ ظ…طھط§ط­ط©", value: (coupons ?? []).length, icon: Tag, color: "text-green-400" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-2xl border bg-card p-5 shadow-luxe flex flex-col gap-3">
            <Icon className={`size-5 ${color}`} />
            <div className="font-black text-2xl leading-none">{value}</div>
            <div className="text-[11px] text-muted-foreground font-semibold">{label}</div>
          </div>
        ))}
      </div>

      {/* â”€â”€ ACTIVE OFFERS â”€â”€ */}
      {(coupons ?? []).length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Tag className="size-4 text-gold" />
            <h2 className="font-black text-lg">ط§ظ„ط¹ط±ظˆط¶ ط§ظ„ظ…طھط§ط­ط© ظ„ظƒ</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {(coupons ?? []).map((c: any) => (
              <div key={c.id} className="rounded-2xl border border-gold/20 bg-gradient-to-br from-gold/5 to-transparent p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-black text-sm">{c.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      ظٹظ†طھظ‡ظٹ {new Date(c.ends_at).toLocaleDateString("ar-EG", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                  <div className="text-2xl font-black text-gold leading-none">{c.percent}%</div>
                </div>
                {c.code && (
                  <button
                    onClick={() => copyCode(c.code)}
                    className="w-full flex items-center justify-between bg-card border rounded-xl px-3 py-2 text-xs font-mono font-black hover:border-gold transition-colors group"
                  >
                    <span className="tracking-widest text-gold">{c.code}</span>
                    <Copy className="size-3.5 text-muted-foreground group-hover:text-gold transition-colors" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* â”€â”€ RECENT ORDERS â”€â”€ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Package className="size-4 text-gold" />
            <h2 className="font-black text-lg">ط¢ط®ط± ظ…ط´طھط±ظٹط§طھظٹ</h2>
          </div>
          <button onClick={() => {}} className="text-xs font-bold text-muted-foreground hover:text-gold flex items-center gap-1 transition-colors">
            ظƒظ„ ط§ظ„ط·ظ„ط¨ط§طھ <ChevronLeft className="size-3" />
          </button>
        </div>
        {(orders ?? []).length === 0 ? (
          <div className="rounded-2xl border bg-card p-10 text-center text-muted-foreground">
            <ShoppingBag className="size-10 mx-auto mb-3 opacity-30" />
            <p className="font-medium">ظ„ط§ طھظˆط¬ط¯ ط·ظ„ط¨ط§طھ ط¨ط¹ط¯</p>
            <Link to="/products" className="mt-3 inline-block text-sm font-bold text-gold hover:underline">ط§ط¨ط¯ط£ ط§ظ„طھط³ظˆظ‚</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {(orders ?? []).map((o: any) => (
              <div key={o.id} className="rounded-2xl border bg-card p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs text-muted-foreground">#{o.id.slice(0,8)}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {new Date(o.created_at).toLocaleDateString("ar-EG", { day: "numeric", month: "long" })}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-black text-sm">{(o.total || 0).toLocaleString()} ط¬</div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                    o.status === "delivered" ? "bg-green-500/15 text-green-500" :
                    o.status === "cancelled" ? "bg-red-500/15 text-red-500" :
                    "bg-gold/15 text-gold"
                  }`}>
                    {ORDER_STATUS_AR[o.status] ?? o.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* â”€â”€ WISHLIST PREVIEW â”€â”€ */}
      {(wishlistProducts ?? []).length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Heart className="size-4 text-red-400" />
              <h2 className="font-black text-lg">ط§ظ„ظ…ط­ظپظˆط¸ط§طھ</h2>
            </div>
            <Link to="/wishlist" className="text-xs font-bold text-muted-foreground hover:text-gold flex items-center gap-1 transition-colors">
              ط¹ط±ط¶ ط§ظ„ظƒظ„ <ChevronLeft className="size-3" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(wishlistProducts ?? []).map((p: any) => (
              <Link key={p.id} to={`/product/${p.id}` as any} className="rounded-2xl border bg-card overflow-hidden hover:border-gold transition-colors">
                <div className="aspect-square bg-muted overflow-hidden">
                  {p.image_url ? (
                    <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Package className="size-8" /></div>
                  )}
                </div>
                <div className="p-3">
                  <div className="text-xs font-bold truncate">{p.name}</div>
                  <div className="text-xs text-gold font-black mt-1">{p.price} ط¬</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* â”€â”€ ACTIVITY â”€â”€ */}
      {(activity ?? []).length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Activity className="size-4 text-gold" />
            <h2 className="font-black text-lg">ظ†ط´ط§ط·ظٹ ط§ظ„ط£ط®ظٹط±</h2>
          </div>
          <div className="rounded-2xl border bg-card divide-y">
            {(activity ?? []).map((a: any) => (
              <div key={a.id} className="px-4 py-3 flex items-center gap-3">
                <div className="size-8 rounded-full bg-muted flex items-center justify-center text-sm">
                  {a.action === "login" ? "ًں”‘" : a.action === "order_placed" ? "ًں“¦" : a.action === "profile_update" ? "âœڈï¸ڈ" : "ًں””"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold truncate">
                    {a.action === "login" ? "طھط³ط¬ظٹظ„ ط¯ط®ظˆظ„" :
                     a.action === "order_placed" ? "ط·ظ„ط¨ ط¬ط¯ظٹط¯" :
                     a.action === "profile_update" ? "طھط­ط¯ظٹط« ط§ظ„ط¨ظٹط§ظ†ط§طھ" :
                     a.action}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {new Date(a.created_at).toLocaleDateString("ar-EG", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€ ORDERS TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function OrdersTab({ userId }: { userId: string }) {
  const { data: orders, isLoading } = useQuery({
    queryKey: ["all-orders", userId],
    staleTime: 2 * 60_000,
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("id,total,status,created_at,items").eq("customer_id" as any, userId).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  if (isLoading) return <div className="text-center py-20 text-muted-foreground">ط¬ط§ط±ظٹ ط§ظ„طھط­ظ…ظٹظ„...</div>;

  if (!orders?.length) return (
    <div className="text-center py-20">
      <Package className="size-14 mx-auto mb-4 text-muted-foreground/30" />
      <p className="font-bold text-muted-foreground">ظ„ط§ طھظˆط¬ط¯ ط·ظ„ط¨ط§طھ ط¨ط¹ط¯</p>
      <Link to="/products" className="mt-4 inline-block gradient-gold text-primary px-8 py-3 font-bold text-sm rounded-xl">ط§ط¨ط¯ط£ ط§ظ„طھط³ظˆظ‚</Link>
    </div>
  );

  return (
    <div className="space-y-4">
      <h2 className="font-black text-xl">ظƒظ„ ط·ظ„ط¨ط§طھظٹ ({orders.length})</h2>
      {orders.map((o: any) => (
        <div key={o.id} className="rounded-2xl border bg-card p-5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="font-black text-sm">ط·ظ„ط¨ #{o.id.slice(0,8)}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {new Date(o.created_at).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" })}
              </div>
            </div>
            <div className="text-left">
              <div className="font-black">{(o.total || 0).toLocaleString()} ط¬</div>
              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full mt-1 inline-block ${
                o.status === "delivered" ? "bg-green-500/15 text-green-500" :
                o.status === "cancelled" ? "bg-red-500/15 text-red-500" :
                "bg-gold/15 text-gold"
              }`}>
                {ORDER_STATUS_AR[o.status] ?? o.status}
              </span>
            </div>
          </div>
          <Link to="/my-orders" className="text-xs font-bold text-gold hover:underline flex items-center gap-1">
            طھطھط¨ط¹ ط§ظ„ط·ظ„ط¨ <ChevronLeft className="size-3" />
          </Link>
        </div>
      ))}
    </div>
  );
}

/* â”€â”€â”€â”€â”€â”€â”€â”€â”€ SETTINGS TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function SettingsTab({ user, profile, refreshRoles }: { user: any; profile: any; refreshRoles: () => Promise<void> }) {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ username: "", full_name: "", phone: "" });
  const [passForm, setPassForm] = useState({ new_password: "", confirm_password: "" });

  useEffect(() => {
    if (profile) setForm({ username: profile.username || "", full_name: profile.full_name || "", phone: profile.phone || "" });
  }, [profile]);

  const updateProfile = async () => {
    if (!form.username.trim()) return toast.error("ط§ظ„ظٹظˆط²ط± ظ†ظٹظ… ظ…ط·ظ„ظˆط¨");
    setLoading(true);
    const { error } = await supabase.from("profiles").update({ username: form.username, full_name: form.full_name, phone: form.phone }).eq("id", user.id);
    setLoading(false);
    if (error) {
      if (error.code === "23505") toast.error("ط§ظ„ظٹظˆط²ط± ظ†ظٹظ… ط¯ظ‡ ظ…ط³طھط®ط¯ظ… ظ‚ط¨ظ„ ظƒط¯ظ‡");
      else toast.error("ط®ط·ط£: " + error.message);
    } else {
      toast.success("طھظ… طھط­ط¯ظٹط« ط¨ظٹط§ظ†ط§طھظƒ âœ…");
      await refreshRoles();
      logActivity("profile_update", { fields: ["username", "full_name", "phone"] });
    }
  };

  const updatePassword = async () => {
    if (!passForm.new_password) return toast.error("ط§ظƒطھط¨ ط§ظ„ط¨ط§ط³ظˆط±ط¯ ط§ظ„ط¬ط¯ظٹط¯");
    if (passForm.new_password !== passForm.confirm_password) return toast.error("ط§ظ„ط¨ط§ط³ظˆط±ط¯ ط؛ظٹط± ظ…طھط·ط§ط¨ظ‚");
    if (passForm.new_password.length < 6) return toast.error("ط§ظ„ط¨ط§ط³ظˆط±ط¯ ظ„ط§ط²ظ… ظ¦ ط­ط±ظˆظپ ط¹ظ„ظ‰ ط§ظ„ط£ظ‚ظ„");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: passForm.new_password });
    setLoading(false);
    if (error) toast.error("ط®ط·ط£: " + error.message);
    else {
      toast.success("طھظ… طھط؛ظٹظٹط± ط§ظ„ط¨ط§ط³ظˆط±ط¯ ًں”’");
      setPassForm({ new_password: "", confirm_password: "" });
      logActivity("password_update");
    }
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="rounded-2xl border bg-card p-6 shadow-luxe space-y-4">
        <h2 className="font-black text-lg flex items-center gap-2"><User className="size-5" /> ط§ظ„ط¨ظٹط§ظ†ط§طھ ط§ظ„ط´ط®طµظٹط©</h2>
        <div><Label>ط§ظ„ظٹظˆط²ط± ظ†ظٹظ…</Label><Input value={form.username} onChange={e => setForm({...form, username: e.target.value})} dir="ltr" className="text-left mt-1" /></div>
        <div><Label>ط§ظ„ط§ط³ظ… ط§ظ„ظƒط§ظ…ظ„</Label><Input value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="mt-1" /></div>
        <div><Label>ط±ظ‚ظ… ط§ظ„طھظ„ظٹظپظˆظ†</Label><Input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} dir="ltr" className="text-left mt-1" /></div>
        <Button onClick={updateProfile} disabled={loading} className="w-full gradient-gold text-primary">
          {loading ? <Loader2 className="size-4 animate-spin ml-2" /> : <Save className="size-4 ml-2" />} ط­ظپط¸ ط§ظ„ط¨ظٹط§ظ†ط§طھ
        </Button>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-luxe space-y-4">
        <h2 className="font-black text-lg flex items-center gap-2"><Lock className="size-5" /> طھط؛ظٹظٹط± ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±</h2>
        <div><Label>ط§ظ„ط¨ط§ط³ظˆط±ط¯ ط§ظ„ط¬ط¯ظٹط¯</Label><Input type="password" value={passForm.new_password} onChange={e => setPassForm({...passForm, new_password: e.target.value})} dir="ltr" className="text-left mt-1" /></div>
        <div><Label>طھط£ظƒظٹط¯ ط§ظ„ط¨ط§ط³ظˆط±ط¯</Label><Input type="password" value={passForm.confirm_password} onChange={e => setPassForm({...passForm, confirm_password: e.target.value})} dir="ltr" className="text-left mt-1" /></div>
        <Button onClick={updatePassword} disabled={loading} variant="outline" className="w-full border-primary/20">
          {loading ? <Loader2 className="size-4 animate-spin ml-2" /> : <Lock className="size-4 ml-2" />} طھط؛ظٹظٹط± ط§ظ„ط¨ط§ط³ظˆط±ط¯
        </Button>
      </div>
    </div>
  );
}
