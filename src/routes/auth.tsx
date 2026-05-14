import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({ component: Auth });

function Auth() {
  const { signIn, signUp, refreshRoles } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [li, setLi] = useState({ u: "", p: "" });
  const [su, setSu] = useState({ u: "", p: "", phone: "", full_name: "" });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await signIn(li.u, li.p);
    setLoading(false);
    if (error) return toast.error("بيانات غير صحيحة", { description: error });
    await refreshRoles();
    toast.success("أهلاً بك من جديد 👋");
    nav({ to: "/" });
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (su.u.length < 3) return toast.error("اليوزر نيم لازم يكون 3 حروف على الأقل");
    if (su.p.length < 6) return toast.error("الباسورد لازم 6 حروف على الأقل");
    if (!su.full_name) return toast.error("الاسم الكامل مطلوب");
    if (!su.phone) return toast.error("رقم التليفون مطلوب");
    
    setLoading(true);
    const { error } = await signUp(su.u, su.p, su.phone, su.full_name);
    setLoading(false);
    if (error) return toast.error("ما قدرناش ننشئ الحساب", { description: error });
    toast.success("تم إنشاء الحساب! 🎉");
    nav({ to: "/" });
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-3xl border bg-card p-8 shadow-luxe">
        <h1 className="font-display text-3xl font-bold text-center mb-6">
          أهلاً في <span className="text-gold-gradient">Hedma</span>
        </h1>
        <Tabs defaultValue="login">
          <TabsList className="grid grid-cols-2 w-full"><TabsTrigger value="login">دخول</TabsTrigger><TabsTrigger value="signup">إنشاء حساب</TabsTrigger></TabsList>
          <TabsContent value="login" className="space-y-3 mt-4">
            <form onSubmit={handleLogin} className="space-y-3">
              <div><Label>اليوزر نيم أو الإيميل</Label><Input value={li.u} onChange={(e) => setLi({ ...li, u: e.target.value })} required /></div>
              <div><Label>الباسورد</Label><Input type="password" value={li.p} onChange={(e) => setLi({ ...li, p: e.target.value })} required /></div>
              <Button disabled={loading} type="submit" className="w-full gradient-gold text-primary">{loading ? "..." : "دخول"}</Button>
            </form>
          </TabsContent>
          <TabsContent value="signup" className="space-y-3 mt-4">
            <form onSubmit={handleSignup} className="space-y-3">
              <div><Label>اليوزر نيم</Label><Input value={su.u} onChange={(e) => setSu({ ...su, u: e.target.value })} required /></div>
              <div><Label>الاسم الكامل</Label><Input value={su.full_name} onChange={(e) => setSu({ ...su, full_name: e.target.value })} required placeholder="مثال: أحمد محمد علي" /></div>
              <div><Label>رقم التليفون</Label><Input value={su.phone} onChange={(e) => setSu({ ...su, phone: e.target.value })} required placeholder="01234567890" /></div>
              <div><Label>الباسورد</Label><Input type="password" value={su.p} onChange={(e) => setSu({ ...su, p: e.target.value })} required /></div>
              <Button disabled={loading} type="submit" className="w-full gradient-gold text-primary mt-4">{loading ? "..." : "إنشاء حساب"}</Button>
              <p className="text-[10px] text-muted-foreground text-center mt-2 leading-relaxed">
                بالضغط على "إنشاء حساب" أنت توافق على شروط الاستخدام وسياسة الخصوصية الخاصة بهدمة.
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
