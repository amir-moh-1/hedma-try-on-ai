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
  { code: "+20", flag: "ًں‡ھًں‡¬", name: "ظ…طµط±", pattern: /^1[0-9]{9}$/, length: 10 },
  { code: "+966", flag: "ًں‡¸ًں‡¦", name: "ط§ظ„ط³ط¹ظˆط¯ظٹط©", pattern: /^5[0-9]{8}$/, length: 9 },
  { code: "+971", flag: "ًں‡¦ًں‡ھ", name: "ط§ظ„ط¥ظ…ط§ط±ط§طھ", pattern: /^5[0-9]{8}$/, length: 9 },
  { code: "+965", flag: "ًں‡°ًں‡¼", name: "ط§ظ„ظƒظˆظٹطھ", pattern: /^[569][0-9]{7}$/, length: 8 },
  { code: "+974", flag: "ًں‡¶ًں‡¦", name: "ظ‚ط·ط±", pattern: /^[3567][0-9]{7}$/, length: 8 },
  { code: "+962", flag: "ًں‡¯ًں‡´", name: "ط§ظ„ط£ط±ط¯ظ†", pattern: /^7[0-9]{8}$/, length: 9 },
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
  const [pendingSignupData, setPendingSignupData] = useState<any>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  useEffect(() => {
    const uname = su.u.trim();
    if (uname.length < 3) { setUsernameStatus("idle"); setUsernameSuggestions([]); return; }
    setUsernameStatus("checking");
    const handle = setTimeout(async () => {
      const { data } = await supabase.from("profiles").select("id").eq("username", uname).maybeSingle();
      if (data) { setUsernameStatus("taken"); setUsernameSuggestions(suggestUsernames(uname, su.full_name)); }
      else { setUsernameStatus("available"); setUsernameSuggestions([]); }
    }, 500);
    return () => clearTimeout(handle);
  }, [su.u, su.full_name]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const ident = li.u.trim().replace(/\s+/g, ' ');
    const password = li.p.trim();
    if (!ident) return toast.error("ط§ط¯ط®ظ„ ط§ظ„ظٹظˆط²ط± ط£ظˆ ط§ظ„ط§ط³ظ… ط§ظ„ظƒط§ظ…ظ„ ط£ظˆ ط§ظ„ط¥ظٹظ…ظٹظ„");
    if (!password) return toast.error("ط§ظ„ط¨ط§ط³ظˆط±ط¯ ظ…ط·ظ„ظˆط¨");
    setLoading(true);
    const { error } = await signIn(ident, password);
    setLoading(false);
    if (error) return toast.error("ط¨ظٹط§ظ†ط§طھ ط؛ظٹط± طµط­ظٹط­ط©", { description: error });
    await refreshRoles();
    toast.success("ط£ظ‡ظ„ط§ظ‹ ط¨ظƒ ظ…ظ† ط¬ط¯ظٹط¯ ًں‘‹");
    const last = (() => { try { return localStorage.getItem("hedma:last_route"); } catch { return null; } })();
    const dest = (last && last !== "/auth" ? last : "/");
    setTimeout(() => window.location.replace(dest), 300);
  };

  // Attempt to send OTP â€” returns true if sent, false if unavailable
  const trySendOtp = async (email: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke("send-otp-email", {
        body: { email, purpose: "signup" },
      });
      if (error || data?.error) return false;
      return true;
    } catch {
      return false;
    }
  };

  // Core signup logic (used both with and without OTP)
  const performSignup = async (data: {
    full_name: string; username: string; password: string;
    phone: string; email: string; age: number; country_code: string;
  }) => {
    const { error } = await signUp({
      username: data.username,
      password: data.password,
      phone: data.phone,
      full_name: data.full_name,
      email: data.email,
    });
    if (error) { toast.error("ظ…ط§ ظ‚ط¯ط±ظ†ط§ط´ ظ†ظ†ط´ط¦ ط§ظ„ط­ط³ط§ط¨", { description: error }); return false; }

    const { data: userRes } = await supabase.auth.getUser();
    if (userRes?.user) {
      await supabase.from("profiles").update({
        age: data.age, country_code: data.country_code,
      } as any).eq("id", userRes.user.id);
      const theme = data.age <= 25 ? "youth" : "premium";
      try { localStorage.setItem("hedma:storefront-theme", theme); } catch {}
    }

    try {
    await supabase.from("notifications").insert({
      title: "ط¹ط¶ظˆ ط¬ط¯ظٹط¯ ط§ظ†ط¶ظ… ظ„ظ„ظ…ظˆظ‚ط¹ ًںژ‰",
      content: `${data.full_name} (@${data.username}) - ط§ظ„ط¹ظ…ط±: ${data.age}`,
      type: "user", read: false,
      });
    } catch {}

    toast.success("طھظ… ط¥ظ†ط´ط§ط، ط§ظ„ط­ط³ط§ط¨ ط¨ظ†ط¬ط§ط­! ًںژ‰");
    setTimeout(() => window.location.replace("/"), 400);
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

    if (!full_name) return toast.error("ط§ظ„ط§ط³ظ… ط§ظ„ظƒط§ظ…ظ„ ظ…ط·ظ„ظˆط¨");
    if (!username || username.length < 3) return toast.error("ط§ظ„ظٹظˆط²ط± ظ†ظٹظ… ظ„ط§ط²ظ… 3 ط­ط±ظˆظپ ط¹ظ„ظ‰ ط§ظ„ط£ظ‚ظ„");
    if (usernameStatus === "taken") return toast.error("ط§ظ„ظٹظˆط²ط± ظ†ظٹظ… ظ…ط³طھط®ط¯ظ… ط¨ط§ظ„ظپط¹ظ„طŒ ط§ط®طھط± ط§ظ‚طھط±ط§ط­ ظ…ظ† ط§ظ„ظ„ظٹ طھط­طھ");
    if (!password || password.length < 6) return toast.error("ط§ظ„ط¨ط§ط³ظˆط±ط¯ ظ„ط§ط²ظ… 6 ط­ط±ظˆظپ ط¹ظ„ظ‰ ط§ظ„ط£ظ‚ظ„");
    if (!phone) return toast.error("ط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ ظ…ط·ظ„ظˆط¨");
    if (!countryCode.pattern.test(phone)) return toast.error(`ط±ظ‚ظ… ${countryCode.name} ط؛ظٹط± طµط­ظٹط­`);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return toast.error("ط§ظ„ط¥ظٹظ…ظٹظ„ ظ…ط·ظ„ظˆط¨ ظˆط¨طµظٹط؛ط© طµط­ظٹط­ط©");
    if (!age || age < 8 || age > 100) return toast.error("ط§ط¯ط®ظ„ ط¹ظ…ط± طµط­ظٹط­ (8-100)");

    const signupData = {
      full_name, username, password,
      phone: `${countryCode.code}${phone}`,
      email, age, country_code: countryCode.code,
    };

    setLoading(true);
    try {
      // Try to send OTP first
      const otpSent = await trySendOtp(email);
      if (otpSent) {
        // OTP sent successfully â€” show verification modal
        setOtpEmail(email);
        setPendingSignupData(signupData);
        setShowOtpModal(true);
        setResendCooldown(60);
        toast.success("ًں“§ طھظ… ط¥ط±ط³ط§ظ„ ظƒظˆط¯ ط§ظ„طھط­ظ‚ظ‚ ط¹ظ„ظ‰ ط¥ظٹظ…ظٹظ„ظƒ");
      } else {
        // OTP unavailable â€” proceed with direct signup (no email verification)
        toast.info("ًں“‌ ط³ظٹطھظ… ط¥ظ†ط´ط§ط، ط­ط³ط§ط¨ظƒ ظ…ط¨ط§ط´ط±ط©");
        await performSignup(signupData);
      }
    } catch {
      toast.error("ط­ط¯ط« ط®ط·ط£طŒ ط­ط§ظˆظ„ ظ…ط±ط© ط£ط®ط±ظ‰");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0 || !otpEmail) return;
    const sent = await trySendOtp(otpEmail);
    if (sent) { setResendCooldown(60); toast.success("ًں“§ طھظ… ط¥ط±ط³ط§ظ„ ظƒظˆط¯ ط¬ط¯ظٹط¯"); }
    else toast.error("طھط¹ط°ظ‘ط± ط¥ط¹ط§ط¯ط© ط§ظ„ط¥ط±ط³ط§ظ„طŒ ط­ط§ظˆظ„ ظ„ط§ط­ظ‚ط§ظ‹");
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = enteredOtp.trim();
    if (code.length !== 6) return toast.error("ط§ظ„ظƒظˆط¯ ظ„ط§ط²ظ… 6 ط£ط±ظ‚ط§ظ…");

    setOtpLoading(true);
    const { data: vd, error: ve } = await supabase.functions.invoke("verify-otp", {
      body: { email: otpEmail, code, purpose: "signup" },
    });
    if (ve || vd?.error) {
      setOtpLoading(false);
      return toast.error(vd?.error || "ط§ظ„ظƒظˆط¯ ط؛ظٹط± طµط­ظٹط­");
    }

    if (!pendingSignupData) { setOtpLoading(false); return toast.error("ط¨ظٹط§ظ†ط§طھ ط§ظ„طھط³ط¬ظٹظ„ ظپظ‚ط¯طھطŒ ط£ط¹ط¯ ط§ظ„ظ…ط­ط§ظˆظ„ط©"); }
    const ok = await performSignup(pendingSignupData);
    setOtpLoading(false);
    if (ok) { setShowOtpModal(false); setEnteredOtp(""); setPendingSignupData(null); }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPhone = forgotPhone.trim();
    if (!trimmedPhone) return toast.error("ط¨ط±ط¬ط§ط، ط¥ط¯ط®ط§ظ„ ط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ ط£ظˆظ„ط§ظ‹");
    setLoading(true);
    const { error } = await supabase.from("password_recovery_requests").insert({
      username: trimmedPhone, phone: trimmedPhone, status: "pending",
    });
    if (error) { setLoading(false); return toast.error("ط­ط¯ط« ط®ط·ط£: " + error.message); }
    await supabase.from("notifications").insert({
      title: "ط·ظ„ط¨ ط§ط³طھط¹ط§ط¯ط© ظƒظ„ظ…ط© ظ…ط±ظˆط± ًں”گ",
      content: `ط·ظ„ط¨ ظ…ظ†: ${trimmedPhone}`, type: "recovery", read: false,
    });
    setLoading(false);
    toast.success("طھظ… طھظ‚ط¯ظٹظ… ط·ظ„ط¨ظƒ ظ„ظ„ط¥ط¯ط§ط±ط© âœ…");
    const waUrl = `https://wa.me/201229344711?text=${encodeURIComponent(`ظ†ط³ظٹطھ ط¨ظٹط§ظ†ط§طھ ط§ظ„ط¯ط®ظˆظ„. ط±ظ‚ظ…ظٹ: ${trimmedPhone}`)}`;
    window.open(waUrl, "_blank");
    setShowForgotModal(false);
    setForgotPhone("");
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12 relative">
      <div className="rounded-3xl border bg-card p-8 shadow-luxe border-gold/10">
        <h1 className="font-display text-3xl font-bold text-center mb-6">
          ط£ظ‡ظ„ط§ظ‹ ظپظٹ <span className="text-gold-gradient">Hedma</span>
        </h1>
        <Tabs defaultValue="login">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="login">ط¯ط®ظˆظ„</TabsTrigger>
            <TabsTrigger value="signup">ط¥ظ†ط´ط§ط، ط­ط³ط§ط¨</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="space-y-4 mt-4">
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Label>ط§ظ„ط§ط³ظ… ط§ظ„ظƒط§ظ…ظ„ ط£ظˆ ط§ظ„ظٹظˆط²ط± ظ†ظٹظ… ط£ظˆ ط§ظ„ط¥ظٹظ…ظٹظ„</Label>
                <Input value={li.u} onChange={(e) => setLi({ ...li, u: e.target.value })} required placeholder="ظ…ط«ط§ظ„: ahmed_m" className="rounded-xl" />
              </div>
              <div>
                <Label>ط§ظ„ط¨ط§ط³ظˆط±ط¯</Label>
                <Input type="password" value={li.p} onChange={(e) => setLi({ ...li, p: e.target.value })} required className="rounded-xl" />
              </div>
              <div className="flex justify-start">
                <button type="button" onClick={() => setShowForgotModal(true)} className="text-xs font-bold text-gold hover:underline">
                  ظ†ط³ظٹطھ ظƒظ„ظ…ط© ط§ظ„ط³ط±طں
                </button>
              </div>
              <Button disabled={loading} type="submit" className="w-full gradient-gold text-primary rounded-xl font-bold shadow-luxe">
                {loading ? <Loader2 className="size-4 animate-spin mx-auto" /> : "ط¯ط®ظˆظ„"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="signup" className="space-y-4 mt-4">
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <Label>ط§ظ„ط§ط³ظ… ط§ظ„ظƒط§ظ…ظ„ *</Label>
                <Input value={su.full_name} onChange={(e) => setSu({ ...su, full_name: e.target.value })} required placeholder="ط£ط­ظ…ط¯ ظ…ط­ظ…ط¯ ط¹ظ„ظٹ" className="rounded-xl" />
              </div>
              <div>
                <Label>ط§ظ„ظٹظˆط²ط± ظ†ظٹظ… *</Label>
                <div className="relative">
                  <Input value={su.u} onChange={(e) => setSu({ ...su, u: e.target.value })} required placeholder="ahmed_m" className="rounded-xl pl-9" dir="ltr" />
                  <div className="absolute left-2 top-1/2 -translate-y-1/2">
                    {usernameStatus === "checking" && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                    {usernameStatus === "available" && <CheckCircle2 className="size-4 text-green-600" />}
                    {usernameStatus === "taken" && <AlertCircle className="size-4 text-destructive" />}
                  </div>
                </div>
                {usernameStatus === "taken" && usernameSuggestions.length > 0 && (
                  <div className="mt-2 p-2 rounded-lg bg-destructive/5 border border-destructive/20">
                    <p className="text-[11px] text-destructive font-bold mb-2">ط§ظ„ظٹظˆط²ط± ط¯ط§ ظ…ط³طھط®ط¯ظ…. ط¬ط±ظ‘ط¨:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {usernameSuggestions.map(s => (
                        <button key={s} type="button" onClick={() => setSu({ ...su, u: s })} className="text-xs px-2 py-1 rounded-md bg-card border hover:gradient-gold hover:text-primary transition" dir="ltr">{s}</button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div>
                <Label>ظƒظ„ظ…ط© ط§ظ„ط³ط± *</Label>
                <Input type="password" value={su.p} onChange={(e) => setSu({ ...su, p: e.target.value })} required className="rounded-xl" />
              </div>
              <div>
                <Label>ط§ظ„ط¹ظ…ط± *</Label>
                <Input type="number" min={8} max={100} value={su.age} onChange={(e) => setSu({ ...su, age: e.target.value })} required placeholder="25" className="rounded-xl" />
                <p className="text-[10px] text-muted-foreground mt-1">ظٹط³طھط®ط¯ظ… ظ„ط§ظ‚طھط±ط§ط­ ط§ظ„ظˆط§ط¬ظ‡ط© ط§ظ„ظ…ظ†ط§ط³ط¨ط© ظ„ظƒ (ط´ط¨ط§ط¨ / ط¨ط±ظٹظ…ظٹظˆظ…)</p>
              </div>
              <div>
                <Label>ط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ *</Label>
                <div className="flex gap-2">
                  <select
                    value={countryCode.code}
                    onChange={(e) => { const c = COUNTRY_CODES.find(x => x.code === e.target.value); if (c) setCountryCode(c); }}
                    className="h-10 px-2 rounded-xl border border-input bg-background text-sm font-bold shrink-0"
                  >
                    {COUNTRY_CODES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                  </select>
                  <Input
                    value={su.phone}
                    onChange={(e) => setSu({ ...su, phone: e.target.value.replace(/[^\d]/g, "") })}
                    required placeholder={countryCode.code === "+20" ? "1012345678" : "5xxxxxxxx"}
                    maxLength={countryCode.length} dir="ltr" className="text-left rounded-xl flex-1"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">{countryCode.length} ط£ط±ظ‚ط§ظ… ط¨ط¯ظˆظ† ط§ظ„طµظپط±</p>
              </div>
              <div>
                <Label>ط§ظ„ط¥ظٹظ…ظٹظ„ *</Label>
                <Input type="email" value={su.email} onChange={(e) => setSu({ ...su, email: e.target.value })} required placeholder="you@example.com" dir="ltr" className="text-left rounded-xl" />
                <p className="text-[10px] text-muted-foreground mt-1">ظ‡ظ†ط­ط§ظˆظ„ ظ†ط¨ط¹طھ ظƒظˆط¯ طھط­ظ‚ظ‚ â€” ظ„ظˆ ظ…ط´ ظˆطµظ„ ظ‡ظٹطھظ… ط§ظ„طھط³ط¬ظٹظ„ طھظ„ظ‚ط§ط¦ظٹط§ظ‹</p>
              </div>
              <Button disabled={loading || usernameStatus === "taken" || usernameStatus === "checking"} type="submit" className="w-full gradient-gold text-primary mt-4 rounded-xl font-bold shadow-luxe">
                {loading ? <Loader2 className="size-4 animate-spin mx-auto" /> : "ط¥ظ†ط´ط§ط، ط§ظ„ط­ط³ط§ط¨"}
              </Button>
              <p className="text-[10px] text-muted-foreground text-center mt-2 leading-relaxed">
                ط¨ط§ظ„ط¶ط؛ط· ط¹ظ„ظ‰ "ط¥ظ†ط´ط§ط، ط§ظ„ط­ط³ط§ط¨" ط£ظ†طھ طھظˆط§ظپظ‚ ط¹ظ„ظ‰ ط´ط±ظˆط· ط§ظ„ط§ط³طھط®ط¯ط§ظ… ظˆط³ظٹط§ط³ط© ط§ظ„ط®طµظˆطµظٹط© ط§ظ„ط®ط§طµط© ط¨ظ‡ط¯ظ…ط©.
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-sm rounded-3xl p-6 shadow-luxe border border-gold/10 relative">
            <button onClick={() => { setShowOtpModal(false); setEnteredOtp(""); }} className="absolute top-4 left-4 text-muted-foreground hover:text-foreground">
              <X className="size-5" />
            </button>
            <h3 className="font-bold text-lg mb-2 text-gold-gradient">ط±ظ…ط² ط§ظ„طھط­ظ‚ظ‚ ًں“§</h3>
            <p className="text-xs text-muted-foreground mb-4">
              ط¨ط¹طھظ†ط§ ظƒظˆط¯ ظ…ظƒظˆظ† ظ…ظ† 6 ط£ط±ظ‚ط§ظ… ط¹ظ„ظ‰ <span className="font-bold" dir="ltr">{otpEmail}</span>
            </p>
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <Label>ط§ظ„ظƒظˆط¯</Label>
                <Input
                  value={enteredOtp}
                  onChange={e => setEnteredOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="------" dir="ltr" maxLength={6} inputMode="numeric" autoFocus
                  className="text-center text-2xl font-bold tracking-[0.5em] rounded-xl"
                  required
                />
              </div>
              <Button type="submit" disabled={otpLoading} className="w-full gradient-gold text-primary rounded-xl font-bold shadow-luxe">
                {otpLoading ? <Loader2 className="size-4 animate-spin mx-auto" /> : "طھط£ظƒظٹط¯ ظˆط¥ظ†ط´ط§ط، ط§ظ„ط­ط³ط§ط¨"}
              </Button>
              <button type="button" onClick={handleResendOtp} disabled={resendCooldown > 0}
                className="w-full text-xs text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed">
                {resendCooldown > 0 ? `ط¥ط¹ط§ط¯ط© ط§ظ„ط¥ط±ط³ط§ظ„ ط®ظ„ط§ظ„ ${resendCooldown}ط«` : "ط¥ط¹ط§ط¯ط© ط¥ط±ط³ط§ظ„ ط§ظ„ظƒظˆط¯"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-300">
          <div className="bg-card w-full max-w-sm rounded-3xl p-6 shadow-luxe border border-gold/10 relative">
            <button onClick={() => setShowForgotModal(false)} className="absolute top-4 left-4 text-muted-foreground hover:text-foreground">
              <X className="size-5" />
            </button>
            <h3 className="font-bold text-lg mb-4 text-gold-gradient">ط§ط³طھط¹ط§ط¯ط© ظƒظ„ظ…ط© ط§ظ„ظ…ط±ظˆط±</h3>
            <p className="text-xs text-muted-foreground mb-4">ط£ط¯ط®ظ„ ط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ ط£ظˆ ط§ظ„ظٹظˆط²ط± ظ†ظٹظ….</p>
            <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
              <div>
                <Label>ط±ظ‚ظ… ط§ظ„ظ‡ط§طھظپ ط£ظˆ ط§ظ„ظٹظˆط²ط± ظ†ظٹظ…</Label>
                <Input value={forgotPhone} onChange={e => setForgotPhone(e.target.value)} placeholder="ط£ط¯ط®ظ„ ط±ظ‚ظ…ظƒ" className="rounded-xl" required />
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-sm">
                <MessageCircle className="size-4" /> طھظ‚ط¯ظٹظ… ط§ظ„ط·ظ„ط¨ ظˆطھظˆط§طµظ„ ظˆط§طھط³ط§ط¨ ًں’¬
              </Button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
