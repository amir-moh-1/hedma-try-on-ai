import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { X, MessageCircle, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/auth")({ component: Auth });

const COUNTRY_CODES = [
  { code: "+20", flag: "🇪🇬", name: "مصر", pattern: /^1[0-9]{9}$/, length: 10 },
  { code: "+966", flag: "🇸🇦", name: "السعودية", pattern: /^5[0-9]{8}$/, length: 9 },
  { code: "+971", flag: "🇦🇪", name: "الإمارات", pattern: /^5[0-9]{8}$/, length: 9 },
  { code: "+965", flag: "🇰🇼", name: "الكويت", pattern: /^[569][0-9]{7}$/, length: 8 },
  { code: "+974", flag: "🇶🇦", name: "قطر", pattern: /^[3567][0-9]{7}$/, length: 8 },
  { code: "+962", flag: "🇯🇴", name: "الأردن", pattern: /^7[0-9]{8}$/, length: 9 },
];

function suggestUsernames(base: string, fullName: string): string[] {
  const cleanBase = base.toLowerCase().replace(/[^a-z0-9_]/g, "");
  const namePart = fullName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "").slice(0, 12);
  const out = new Set<string>();
  if (cleanBase) {
    out.add(`${cleanBase}${Math.floor(Math.random() * 99 + 1)}`);
    out.add(`${cleanBase}_${new Date().getFullYear()}`);
    out.add(`real_${cleanBase}`);
  }
  if (namePart && namePart !== cleanBase) {
    out.add(namePart);
    out.add(`${namePart}_${Math.floor(Math.random() * 999 + 1)}`);
  }
  return Array.from(out).slice(0, 4);
}

function Auth() {
  const { signIn, signUp, refreshRoles } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [li, setLi] = useState({ u: "", p: "" });
  const [su, setSu] = useState({ u: "", p: "", phone: "", full_name: "", email: "", age: "" });
  const [countryCode, setCountryCode] = useState(COUNTRY_CODES[0]);

  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [usernameSuggestions, setUsernameSuggestions] = useState<string[]>([]);

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotPhone, setForgotPhone] = useState("");

  const [showOtpModal, setShowOtpModal] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpEmail, setOtpEmail] = useState("");

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  useEffect(() => {
    const uname = su.u.trim();
    if (uname.length < 3) {
      setUsernameStatus("idle");
      setUsernameSuggestions([]);
      return;
    }
    setUsernameStatus("checking");
    const handle = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", uname)
        .maybeSingle();
      if (data) {
        setUsernameStatus("taken");
        setUsernameSuggestions(suggestUsernames(uname, su.full_name));
      } else {
        setUsernameStatus("available");
        setUsernameSuggestions([]);
      }
    }, 500);
    return () => clearTimeout(handle);
  }, [su.u, su.full_name]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const ident = li.u.trim().replace(/\s+/g, ' ');
    const password = li.p.trim();
    if (!ident) return toast.error("ادخل اليوزر أو الاسم الكامل أو الإيميل");
    if (!password) return toast.error("الباسورد مطلوب");
    setLoading(true);
    const { error } = await signIn(ident, password);
    setLoading(false);
    if (error) return toast.error("بيانات غير صحيحة", { description: error });
    await refreshRoles();
    toast.success("أهلاً بك من جديد 👋");
    const last = (() => { try { return localStorage.getItem("hedma:last_route"); } catch { return null; } })();
    nav({ to: (last && last !== "/auth" ? last : "/") as any });
  };

  const sendOtpCode = async (email: string) => {
    const { data, error } = await supabase.functions.invoke("send-otp-email", {
      body: { email, purpose: "signup" },
    });
    if (error || data?.error) {
      throw new Error(data?.error || error?.message || "تعذّر إرسال الكود");
    }
    return true;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const full_name = su.full_name.trim().replace(/\s+/g, ' ');
    const username = su.u.trim().replace(/\s+/g, ' ');
    const password = su.p.trim();
    const phone = su.phone.trim().replace(/^0+/, "");
    const email = su.email.trim().toLowerCase();
    const age = parseInt(su.age, 10);

    if (!full_name) return toast.error("الاسم الكامل مطلوب");
    if (!username || username.length < 3) return toast.error("اليوزر نيم لازم 3 حروف على الأقل");
    if (usernameStatus === "taken") return toast.error("اليوزر نيم مستخدم بالفعل، اختر اقتراح من اللي تحت");
    if (!password || password.length < 6) return toast.error("الباسورد لازم 6 حروف على الأقل");
    if (!phone) return toast.error("رقم الهاتف مطلوب");
    if (!countryCode.pattern.test(phone)) return toast.error(`رقم ${countryCode.name} غير صحيح`);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error("الإيميل مطلوب وبصيغة صحيحة");
    if (!age || age < 8 || age > 100) return toast.error("ادخل عمر صحيح (8-100)");

    setLoading(true);
    try {
      await sendOtpCode(email);
      setOtpEmail(email);
      setShowOtpModal(true);
      setResendCooldown(60);
      toast.success("📧 تم إرسال كود التحقق على إيميلك");
    } catch (err: any) {
      toast.error(err.message || "فشل إرسال الكود");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || !otpEmail) return;
    try {
      await sendOtpCode(otpEmail);
      setResendCooldown(60);
      toast.success("📧 تم إرسال كود جديد");
    } catch (err: any) {
      toast.error(err.message || "فشل إرسال الكود");
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = enteredOtp.trim();
    if (code.length !== 6) return toast.error("الكود لازم 6 أرقام");

    setOtpLoading(true);
    const { data: vd, error: ve } = await supabase.functions.invoke("verify-otp", {
      body: { email: otpEmail, code, purpose: "signup" },
    });
    if (ve || vd?.error) {
      setOtpLoading(false);
      return toast.error(vd?.error || "الكود غير صحيح");
    }

    const username = su.u.trim().replace(/\s+/g, ' ');
    const password = su.p.trim();
    const phone = `${countryCode.code}${su.phone.trim().replace(/^0+/, "")}`;
    const full_name = su.full_name.trim().replace(/\s+/g, ' ');
    const age = parseInt(su.age, 10);

    const { error } = await signUp({ username, password, phone, full_name, email: otpEmail });
    if (error) {
      setOtpLoading(false);
      return toast.error("ما قدرناش ننشئ الحساب", { description: error });
    }

    const { data: userRes } = await supabase.auth.getUser();
    if (userRes?.user) {
      await supabase.from("profiles").update({
        age, country_code: countryCode.code,
      } as any).eq("id", userRes.user.id);

      const theme = age <= 25 ? "youth" : "premium";
      try { localStorage.setItem("hedma:storefront-theme", theme); } catch {}
    }

    await supabase.from("notifications").insert({
      title: "عضو جديد انضم للموقع 🎉",
      content: `${full_name} (@${username}) - العمر: ${age}`,
      type: "user", read: false,
    });

    setOtpLoading(false);
    toast.success("تم إنشاء الحساب بنجاح! 🎉");
    setShowOtpModal(false);
    setEnteredOtp("");
    nav({ to: "/" });
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPhone = forgotPhone.trim();
    if (!trimmedPhone) return toast.error("برجاء إدخال رقم الهاتف أولاً");

    setLoading(true);
    const { error } = await supabase.from("password_recovery_requests").insert({
      username: trimmedPhone, phone: trimmedPhone, status: "pending",
    });
    if (error) {
      setLoading(false);
      return toast.error("حدث خطأ: " + error.message);
    }
    await supabase.from("notifications").insert({
      title: "طلب استعادة كلمة مرور 🔐",
      content: `طلب من: ${trimmedPhone}`,
      type: "recovery", read: false,
    });
    setLoading(false);
    toast.success("تم تقديم طلبك للإدارة ✅");
    const waUrl = `https://wa.me/201229344711?text=${encodeURIComponent(`نسيت بيانات الدخول. رقمي: ${trimmedPhone}`)}`;
    window.open(waUrl, "_blank");
    setShowForgotModal(false);
    setForgotPhone("");
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12 relative">
      <div className="rounded-3xl border bg-card p-8 shadow-luxe border-gold-gradient/10">
        <h1 className="font-display text-3xl font-bold text-center mb-6">
          أهلاً في <span className="text-gold-gradient">Hedma</span>
        </h1>
        <Tabs defaultValue="login">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="login">دخول</TabsTrigger>
            <TabsTrigger value="signup">إنشاء حساب</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4 mt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label>الاسم الكامل أو اليوزر نيم أو الإيميل</Label>
                <Input value={li.u} onChange={(e) => setLi({ ...li, u: e.target.value })} required placeholder="مثال: ahmed_m" className="rounded-xl border-gold-gradient/20" />
              </div>
              <div>
                <Label>الباسورد</Label>
                <Input type="password" value={li.p} onChange={(e) => setLi({ ...li, p: e.target.value })} required className="rounded-xl border-gold-gradient/20" />
              </div>
              <div className="flex justify-start">
                <button type="button" onClick={() => setShowForgotModal(true)} className="text-xs font-bold text-gold-gradient hover:underline">
                  نسيت كلمة السر؟
                </button>
              </div>
              <Button disabled={loading} type="submit" className="w-full gradient-gold text-primary rounded-xl font-bold shadow-luxe">
                {loading ? <Loader2 className="size-4 animate-spin mx-auto" /> : "دخول"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4 mt-4">
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <Label>الاسم الكامل *</Label>
                <Input value={su.full_name} onChange={(e) => setSu({ ...su, full_name: e.target.value })} required placeholder="أحمد محمد علي" className="rounded-xl border-gold-gradient/20" />
              </div>
              <div>
                <Label>اليوزر نيم *</Label>
                <div className="relative">
                  <Input value={su.u} onChange={(e) => setSu({ ...su, u: e.target.value })} required placeholder="ahmed_m" className="rounded-xl border-gold-gradient/20 pl-9" dir="ltr" />
                  <div className="absolute left-2 top-1/2 -translate-y-1/2">
                    {usernameStatus === "checking" && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                    {usernameStatus === "available" && <CheckCircle2 className="size-4 text-green-600" />}
                    {usernameStatus === "taken" && <AlertCircle className="size-4 text-destructive" />}
                  </div>
                </div>
                {usernameStatus === "taken" && usernameSuggestions.length > 0 && (
                  <div className="mt-2 p-2 rounded-lg bg-destructive/5 border border-destructive/20">
                    <p className="text-[11px] text-destructive font-bold mb-2">اليوزر دا مستخدم. جرّب:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {usernameSuggestions.map(s => (
                        <button key={s} type="button" onClick={() => setSu({ ...su, u: s })} className="text-xs px-2 py-1 rounded-md bg-card border hover:gradient-gold hover:text-primary transition" dir="ltr">
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <Label>كلمة السر *</Label>
                <Input type="password" value={su.p} onChange={(e) => setSu({ ...su, p: e.target.value })} required className="rounded-xl border-gold-gradient/20" />
              </div>
              <div>
                <Label>العمر *</Label>
                <Input type="number" min={8} max={100} value={su.age} onChange={(e) => setSu({ ...su, age: e.target.value })} required placeholder="25" className="rounded-xl border-gold-gradient/20" />
                <p className="text-[10px] text-muted-foreground mt-1">يستخدم لاقتراح الواجهة المناسبة لك</p>
              </div>
              <div>
                <Label>رقم الهاتف *</Label>
                <div className="flex gap-2">
                  <select
                    value={countryCode.code}
                    onChange={(e) => {
                      const c = COUNTRY_CODES.find(x => x.code === e.target.value);
                      if (c) setCountryCode(c);
                    }}
                    className="h-10 px-2 rounded-xl border border-gold-gradient/20 bg-background text-sm font-bold shrink-0"
                  >
                    {COUNTRY_CODES.map(c => (
                      <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                    ))}
                  </select>
                  <Input
                    value={su.phone}
                    onChange={(e) => setSu({ ...su, phone: e.target.value.replace(/[^\d]/g, "") })}
                    required
                    placeholder={countryCode.code === "+20" ? "1012345678" : "5xxxxxxxx"}
                    maxLength={countryCode.length}
                    dir="ltr"
                    className="text-left rounded-xl border-gold-gradient/20 flex-1"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{countryCode.length} أرقام بدون الصفر</p>
              </div>
              <div>
                <Label>الإيميل *</Label>
                <Input type="email" value={su.email} onChange={(e) => setSu({ ...su, email: e.target.value })} required placeholder="you@example.com" dir="ltr" className="text-left rounded-xl border-gold-gradient/20" />
                <p className="text-[10px] text-muted-foreground mt-1">هنبعت كود التحقق على الإيميل ده</p>
              </div>
              <Button disabled={loading || usernameStatus === "taken" || usernameStatus === "checking"} type="submit" className="w-full gradient-gold text-primary mt-4 rounded-xl font-bold shadow-luxe">
                {loading ? <Loader2 className="size-4 animate-spin mx-auto" /> : "إرسال كود التحقق"}
              </Button>
              <p className="text-[10px] text-muted-foreground text-center mt-2 leading-relaxed">
                بالضغط على "إنشاء حساب" أنت توافق على شروط الاستخدام وسياسة الخصوصية الخاصة بهدمة.
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </div>

      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-sm rounded-3xl p-6 shadow-luxe border border-gold-gradient/10 relative">
            <button onClick={() => { setShowOtpModal(false); setEnteredOtp(""); }} className="absolute top-4 left-4 text-muted-foreground hover:text-foreground">
              <X className="size-5" />
            </button>
            <h3 className="font-bold text-lg mb-2 text-gold-gradient">رمز التحقق 📧</h3>
            <p className="text-xs text-muted-foreground mb-4">
              بعتنا كود مكون من 6 أرقام على <span className="font-bold" dir="ltr">{otpEmail}</span>
            </p>

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <Label>الكود</Label>
                <Input
                  value={enteredOtp}
                  onChange={e => setEnteredOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="------"
                  dir="ltr"
                  maxLength={6}
                  inputMode="numeric"
                  autoFocus
                  className="text-center text-2xl font-bold tracking-[0.5em] rounded-xl border-gold-gradient/20"
                  required
                />
              </div>

              <Button type="submit" disabled={otpLoading} className="w-full gradient-gold text-primary rounded-xl font-bold shadow-luxe">
                {otpLoading ? <Loader2 className="size-4 animate-spin mx-auto" /> : "تأكيد وإنشاء الحساب"}
              </Button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={resendCooldown > 0}
                className="w-full text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendCooldown > 0 ? `إعادة الإرسال خلال ${resendCooldown}ث` : "إعادة إرسال الكود"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-sm rounded-3xl p-6 shadow-luxe border border-gold-gradient/10 relative">
            <button onClick={() => setShowForgotModal(false)} className="absolute top-4 left-4 text-muted-foreground hover:text-foreground">
              <X className="size-5" />
            </button>
            <h3 className="font-bold text-lg mb-4 text-gold-gradient">استعادة كلمة المرور</h3>
            <p className="text-xs text-muted-foreground mb-4">أدخل رقم الهاتف أو اليوزر نيم.</p>
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div>
                <Label>رقم الهاتف أو اليوزر نيم</Label>
                <Input value={forgotPhone} onChange={e => setForgotPhone(e.target.value)} placeholder="أدخل رقمك" className="rounded-xl border-gold-gradient/20" required />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm">
                <MessageCircle className="size-4" /> تقديم الطلب وتواصل واتساب 💬
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
