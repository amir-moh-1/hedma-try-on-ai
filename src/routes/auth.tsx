import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { X, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/auth")({ component: Auth });

function Auth() {
  const { signIn, signUp, refreshRoles } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(false);
  const [li, setLi] = useState({ u: "", p: "" });
  const [su, setSu] = useState({ u: "", p: "", phone: "", full_name: "", email: "" });
  
  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotPhone, setForgotPhone] = useState("");

  // OTP Verification Modal State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");

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
    nav({ to: "/" });
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    const full_name = su.full_name.trim().replace(/\s+/g, ' ');
    const username = su.u.trim().replace(/\s+/g, ' ');
    const password = su.p.trim();
    const phone = su.phone.trim();
    const email = su.email.trim().toLowerCase();

    if (!full_name) return toast.error("الاسم الكامل مطلوب");
    if (!username || username.length < 3) return toast.error("اليوزر نيم لازم 3 حروف على الأقل");
    if (!password || password.length < 6) return toast.error("الباسورد لازم 6 حروف على الأقل");
    if (!phone) return toast.error("رقم التليفون مطلوب");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error("الإيميل مطلوب وبصيغة صحيحة");

    // Simulate sending OTP code
    const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(randomOtp);
    setShowOtpModal(true);
    toast.info("📱 تم إرسال كود التحقق التجريبي!", {
      description: `كود التحقق الخاص بك هو: ${randomOtp}`,
      duration: 8000
    });
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredOtp.trim() !== generatedOtp) {
      return toast.error("كود التحقق غير صحيح، برجاء المحاولة مرة أخرى");
    }

    const username = su.u.trim().replace(/\s+/g, ' ');
    const password = su.p.trim();
    const phone = su.phone.trim();
    const full_name = su.full_name.trim().replace(/\s+/g, ' ');
    const email = su.email.trim().toLowerCase();

    setLoading(true);
    const { error } = await signUp({ username, password, phone, full_name, email });
    setLoading(false);
    
    if (error) {
      return toast.error("ما قدرناش ننشئ الحساب", { description: error });
    }

    // Submit registration notification for admin
    await supabase.from("notifications").insert({
      title: "عضو جديد انضم للموقع 🎉",
      content: `قام المستخدم ${full_name} (@${username}) بإنشاء حساب جديد بنجاح.`,
      type: "user",
      read: false
    });

    toast.success("تم إنشاء الحساب بنجاح! 🎉");
    setShowOtpModal(false);
    setEnteredOtp("");
    nav({ to: "/" });
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPhone = forgotPhone.trim();
    if (!trimmedPhone) {
      return toast.error("برجاء إدخال رقم الهاتف أولاً");
    }
    
    setLoading(true);
    // 1. Save recovery request to database
    const { error } = await supabase.from("password_recovery_requests").insert({
      username: trimmedPhone,
      phone: trimmedPhone,
      status: "pending"
    });
    
    if (error) {
      setLoading(false);
      return toast.error("حدث خطأ أثناء تقديم الطلب: " + error.message);
    }

    // 2. Insert In-App Notification for Admin
    await supabase.from("notifications").insert({
      title: "طلب استعادة كلمة مرور جديد 🔐",
      content: `المستخدم صاحب الرقم/اليوزر (${trimmedPhone}) يطلب استعادة كلمة المرور الخاص به.`,
      type: "recovery",
      read: false
    });

    setLoading(false);
    toast.success("تم تقديم طلبك للإدارة بنجاح وجاري مراجعته ✅");

    // Open WhatsApp as secondary support action
    const textMsg = `نسيت بيانات الدخول الخاصة بي. رقم هاتفي: ${trimmedPhone}`;
    const waUrl = `https://wa.me/201229344711?text=${encodeURIComponent(textMsg)}`;
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
          <TabsList className="grid grid-cols-2 w-full"><TabsTrigger value="login">دخول</TabsTrigger><TabsTrigger value="signup">إنشاء حساب</TabsTrigger></TabsList>
          
          <TabsContent value="login" className="space-y-4 mt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label>الاسم الكامل أو اليوزر نيم أو الإيميل</Label>
                <Input value={li.u} onChange={(e) => setLi({ ...li, u: e.target.value })} required placeholder="مثال: أحمد محمد أو ahmed_m" className="rounded-xl border-gold-gradient/20" />
              </div>
              <div>
                <Label>الباسورد</Label>
                <Input type="password" value={li.p} onChange={(e) => setLi({ ...li, p: e.target.value })} required className="rounded-xl border-gold-gradient/20" />
              </div>
              
              {/* [11] Forgot password trigger link */}
              <div className="flex justify-start">
                <button 
                  type="button" 
                  onClick={() => setShowForgotModal(true)} 
                  className="text-xs font-bold text-gold-gradient hover:underline"
                >
                  نسيت كلمة السر؟
                </button>
              </div>

              <Button disabled={loading} type="submit" className="w-full gradient-gold text-primary rounded-xl font-bold shadow-luxe">
                {loading ? "..." : "دخول"}
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
                <Input value={su.u} onChange={(e) => setSu({ ...su, u: e.target.value })} required placeholder="ahmed_m" className="rounded-xl border-gold-gradient/20" />
              </div>
              <div>
                <Label>كلمة السر *</Label>
                <Input type="password" value={su.p} onChange={(e) => setSu({ ...su, p: e.target.value })} required className="rounded-xl border-gold-gradient/20" />
              </div>
              <div>
                <Label>رقم الهاتف *</Label>
                <Input value={su.phone} onChange={(e) => setSu({ ...su, phone: e.target.value })} required placeholder="01234567890" dir="ltr" className="text-left rounded-xl border-gold-gradient/20" />
              </div>
              <div>
                <Label>الإيميل *</Label>
                <Input type="email" value={su.email} onChange={(e) => setSu({ ...su, email: e.target.value })} required placeholder="you@example.com" dir="ltr" className="text-left rounded-xl border-gold-gradient/20" />
              </div>
              <Button disabled={loading} type="submit" className="w-full gradient-gold text-primary mt-4 rounded-xl font-bold shadow-luxe">
                {loading ? "..." : "إنشاء حساب"}
              </Button>
              <p className="text-[10px] text-muted-foreground text-center mt-2 leading-relaxed">
                بالضغط على "إنشاء حساب" أنت توافق على شروط الاستخدام وسياسة الخصوصية الخاصة بهدمة.
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-sm rounded-3xl p-6 shadow-luxe border border-gold-gradient/10 relative">
            <button 
              onClick={() => { setShowOtpModal(false); setEnteredOtp(""); }} 
              className="absolute top-4 left-4 text-muted-foreground hover:text-foreground"
            >
              <X className="size-5" />
            </button>
            <h3 className="font-bold text-lg mb-4 text-gold-gradient">
              رمز التحقق OTP 📱
            </h3>
            <p className="text-xs text-muted-foreground mb-4">أدخل كود التحقق المكون من 4 أرقام المرسل إلى هاتفك لإتمام التسجيل.</p>
            
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <Label>كود التحقق</Label>
                <Input 
                  value={enteredOtp} 
                  onChange={e => setEnteredOtp(e.target.value)} 
                  placeholder="xxxx" 
                  dir="ltr"
                  maxLength={4}
                  className="text-center text-xl font-bold tracking-widest rounded-xl border-gold-gradient/20" 
                  required
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full gradient-gold text-primary rounded-xl font-bold shadow-luxe">
                {loading ? "جاري التحقق..." : "تأكيد الكود وإتمام التسجيل"}
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-sm rounded-3xl p-6 shadow-luxe border border-gold-gradient/10 relative">
            <button 
              onClick={() => setShowForgotModal(false)} 
              className="absolute top-4 left-4 text-muted-foreground hover:text-foreground"
            >
              <X className="size-5" />
            </button>
            <h3 className="font-bold text-lg mb-4 text-gold-gradient flex items-center gap-2">
              استعادة كلمة المرور
            </h3>
            <p className="text-xs text-muted-foreground mb-4">أدخل رقم الهاتف المسجل أو اسم المستخدم لتقديم طلب استعادة الحساب للدعم الفني.</p>
            
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div>
                <Label>رقم الهاتف أو اسم المستخدم</Label>
                <Input 
                  value={forgotPhone} 
                  onChange={e => setForgotPhone(e.target.value)} 
                  placeholder="أدخل رقمك أو اسم المستخدم" 
                  className="rounded-xl border-gold-gradient/20" 
                  required
                />
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
