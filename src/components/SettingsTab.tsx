import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Globe, Save, Upload, Loader2, Image as ImageIcon, Palette, Type, Zap } from "lucide-react";

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-sm space-y-5">
      <h3 className="font-bold text-lg flex items-center gap-2">
        <Icon className="size-5 text-gold" />
        {title}
      </h3>
      {children}
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm font-bold">{label}</Label>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SettingsTab() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [activeSection, setActiveSection] = useState("branding");

  const { data } = useQuery({
    queryKey: ["site-settings-admin"],
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("id", "main").maybeSingle();
      return data;
    },
  });

  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    if (data && !form) {
      const meta = (data.quick_links as any)?.__metadata || {};
      const links = Array.isArray(data.quick_links)
        ? data.quick_links
        : ((data.quick_links as any)?.links || []);
      setForm({
        ...data,
        logo_url: (data as any).logo_url || meta.logo_url || "",
        slogan: (data as any).slogan || meta.slogan || "",
        marquee_text: (data as any).marquee_text || meta.marquee_text || "",
        marquee_visible: (data as any).marquee_visible ?? meta.marquee_visible ?? true,
        shipping_text: (data as any).shipping_text || meta.shipping_text || "",
        fast_shipping_text: (data as any).fast_shipping_text || meta.fast_shipping_text || "",
        social_proof_enabled: (data as any).social_proof_enabled ?? meta.social_proof_enabled ?? true,
        social_proof_real_data: (data as any).social_proof_real_data ?? meta.social_proof_real_data ?? false,
        // Age-based theme texts
        youth_hero_title: (data as any).youth_hero_title || meta.youth_hero_title || "اللبس اللي بيعبر عنك",
        youth_hero_subtitle: (data as any).youth_hero_subtitle || meta.youth_hero_subtitle || "ترندات جديدة كل أسبوع 🔥",
        youth_cta_text: (data as any).youth_cta_text || meta.youth_cta_text || "شوف الأحدث",
        premium_hero_title: (data as any).premium_hero_title || meta.premium_hero_title || "أناقتك بلمسة هدمة",
        premium_hero_subtitle: (data as any).premium_hero_subtitle || meta.premium_hero_subtitle || "مجموعة راقية لأصحاب الذوق الرفيع",
        premium_cta_text: (data as any).premium_cta_text || meta.premium_cta_text || "تسوّق المجموعة",
        // Homepage texts
        hero_title: (data as any).hero_title || meta.hero_title || "أناقتك بلمسة هدمة",
        hero_subtitle: (data as any).hero_subtitle || meta.hero_subtitle || "",
        trust_shipping: (data as any).trust_shipping || meta.trust_shipping || "شحن سريع خلال ٤٨ ساعة",
        trust_quality: (data as any).trust_quality || meta.trust_quality || "جودة مضمونة وإرجاع سهل",
        trust_ai: (data as any).trust_ai || meta.trust_ai || "جرّب اللبس بذكاء اصطناعي",
        trust_support: (data as any).trust_support || meta.trust_support || "دعم واتساب على مدار اليوم",
        quick_links_str: JSON.stringify(links, null, 2),
      });
    }
  }, [data, form]);

  if (!form) {
    return (
      <div className="p-20 text-center text-muted-foreground animate-pulse">
        <Loader2 className="size-8 animate-spin mx-auto mb-3" />
        جاري تحميل الإعدادات...
      </div>
    );
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("يرجى اختيار ملف صورة صالح");
    if (file.size > 2 * 1024 * 1024) return toast.error("حجم الصورة يجب أن لا يتعدى 2MB");
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `branding/logo-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("branding").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("branding").getPublicUrl(path);
      setForm({ ...form, logo_url: publicUrl });
      toast.success("تم رفع اللوجو بنجاح ✨");
    } catch (err: any) {
      toast.error("فشل رفع اللوجو: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const F = (label: string, key: string, placeholder = "", type = "text") => (
    <Field label={label}>
      <Input
        type={type}
        className="rounded-xl h-10"
        value={form[key] ?? ""}
        placeholder={placeholder}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      />
    </Field>
  );

  const Toggle = (label: string, key: string) => (
    <label className="flex items-center gap-3 cursor-pointer">
      <input type="checkbox" checked={form[key] ?? false}
        onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
        className="size-4 accent-[color:var(--color-gold)] rounded" />
      <span className="text-sm font-semibold">{label}</span>
    </label>
  );

  const save = async () => {
    let links: any = [];
    try { links = JSON.parse(form.quick_links_str); }
    catch { return toast.error("الروابط السريعة JSON غير صحيح"); }

    const extendedData: any = {
      logo_url: form.logo_url,
      slogan: form.slogan,
      marquee_text: form.marquee_text,
      marquee_visible: form.marquee_visible,
      shipping_text: form.shipping_text,
      fast_shipping_text: form.fast_shipping_text,
      social_proof_enabled: form.social_proof_enabled,
      social_proof_real_data: form.social_proof_real_data,
      youth_hero_title: form.youth_hero_title,
      youth_hero_subtitle: form.youth_hero_subtitle,
      youth_cta_text: form.youth_cta_text,
      premium_hero_title: form.premium_hero_title,
      premium_hero_subtitle: form.premium_hero_subtitle,
      premium_cta_text: form.premium_cta_text,
      hero_title: form.hero_title,
      hero_subtitle: form.hero_subtitle,
      trust_shipping: form.trust_shipping,
      trust_quality: form.trust_quality,
      trust_ai: form.trust_ai,
      trust_support: form.trust_support,
    };

    const coreUpdate: any = {
      whatsapp: form.whatsapp,
      email: form.email,
      instagram_url: form.instagram_url,
      facebook_url: form.facebook_url,
      tiktok_url: form.tiktok_url,
      address: form.address,
      quick_links: links,
    };

    const { error: fullError } = await supabase.from("site_settings").update({
      ...coreUpdate, ...extendedData,
    }).eq("id", "main");

    if (!fullError) {
      toast.success("تم حفظ كافة الإعدادات ✨");
    } else {
      const { error: fallbackError } = await supabase.from("site_settings").update({
        ...coreUpdate,
        quick_links: { links, __metadata: extendedData },
      }).eq("id", "main");
      if (fallbackError) return toast.error("خطأ في الحفظ: " + fallbackError.message);
      toast.success("تم الحفظ ✨");
    }

    qc.invalidateQueries({ queryKey: ["site-settings"] });
    qc.invalidateQueries({ queryKey: ["site-settings-admin"] });
  };

  const SECTIONS = [
    { id: "branding", label: "الهوية البصرية", icon: Globe },
    { id: "texts", label: "نصوص الموقع", icon: Type },
    { id: "age-themes", label: "نصوص حسب السن", icon: Palette },
    { id: "advanced", label: "إعدادات متقدمة", icon: Zap },
  ];

  return (
    <div className="max-w-4xl space-y-0 pb-10 animate-in fade-in duration-300">
      {/* Section Tabs */}
      <div className="flex overflow-x-auto gap-1 pb-1 mb-6 border-b no-scrollbar">
        {SECTIONS.map(s => {
          const Icon = s.icon;
          return (
            <button key={s.id} onClick={() => setActiveSection(s.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-bold whitespace-nowrap border-b-2 -mb-px transition ${
                activeSection === s.id ? "border-gold text-gold" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}>
              <Icon className="size-4" />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* ===== BRANDING ===== */}
      {activeSection === "branding" && (
        <div className="space-y-5">
          <Section title="الهوية البصرية" icon={Globe}>
            <div className="flex flex-col md:flex-row items-start gap-6">
              <div className="flex-1 space-y-4">
                <Field label="لوجو الموقع">
                  <div className="flex gap-2">
                    <Input className="rounded-xl h-10 font-mono text-xs bg-muted/5" value={form.logo_url ?? ""} readOnly placeholder="رابط اللوجو..." />
                    <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading} className="h-10 px-4 rounded-xl shrink-0">
                      {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4 ml-1" />}
                      رفع
                    </Button>
                    <input type="file" ref={fileRef} hidden accept="image/*" onChange={handleFileUpload} />
                  </div>
                </Field>
                {F("الشعار اللفظي (Slogan)", "slogan", "أناقتك تبدأ من هنا")}
              </div>
              <div className="size-28 rounded-2xl border-2 border-dashed border-gold/20 grid place-items-center bg-muted/5 overflow-hidden shrink-0">
                {form.logo_url ? <img src={form.logo_url} className="size-full object-contain p-2" alt="" /> : <ImageIcon className="size-8 text-muted-foreground/30" />}
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4 pt-2 border-t">
              {F("رقم الواتساب (بدون +)", "whatsapp", "201229344711")}
              {F("البريد الإلكتروني", "email", "hedma@example.com")}
              {F("إنستجرام", "instagram_url", "https://instagram.com/...")}
              {F("فيسبوك", "facebook_url", "https://facebook.com/...")}
              {F("تيك توك", "tiktok_url", "https://tiktok.com/@...")}
              {F("العنوان", "address", "التل الكبير، الإسماعيلية")}
            </div>
          </Section>
        </div>
      )}

      {/* ===== TEXTS ===== */}
      {activeSection === "texts" && (
        <div className="space-y-5">
          <Section title="الشريط المتحرك العلوي" icon={Type}>
            {F("نص الشريط المتحرك", "marquee_text", "شحن سريع لجميع المحافظات 🚚")}
            {Toggle("إظهار الشريط العلوي", "marquee_visible")}
          </Section>

          <Section title="عنوان الصفحة الرئيسية" icon={Type}>
            {F("العنوان الرئيسي", "hero_title", "أناقتك بلمسة هدمة")}
            {F("العنوان الفرعي", "hero_subtitle", "")}
          </Section>

          <Section title="نصوص الثقة (أسفل الصفحة)" icon={Type}>
            <div className="grid md:grid-cols-2 gap-4">
              {F("الشحن", "trust_shipping", "شحن سريع خلال ٤٨ ساعة")}
              {F("الجودة", "trust_quality", "جودة مضمونة وإرجاع سهل")}
              {F("الذكاء الاصطناعي", "trust_ai", "جرّب اللبس بذكاء اصطناعي")}
              {F("الدعم", "trust_support", "دعم واتساب على مدار اليوم")}
            </div>
          </Section>

          <Section title="الشحن والتوصيل" icon={Type}>
            {F("نص الشحن القصير", "shipping_text", "شحن لجميع المحافظات")}
            {F("نص السرعة", "fast_shipping_text", "شحن سريع وآمن")}
          </Section>

          <Section title="Social Proof" icon={Type}>
            {Toggle("تفعيل نافذة «اشترى فلان من...»", "social_proof_enabled")}
            {Toggle("استخدام بيانات حقيقية من الطلبات", "social_proof_real_data")}
          </Section>
        </div>
      )}

      {/* ===== AGE THEMES ===== */}
      {activeSection === "age-themes" && (
        <div className="space-y-5">
          <div className="p-4 rounded-2xl bg-green-50 border border-green-200 text-green-800 text-sm dark:bg-green-950 dark:border-green-800 dark:text-green-200">
            <strong>🟢 واجهة الشباب (Youth 0–25):</strong> تظهر باللون الأخضر للعملاء من عمر 8 إلى 25 سنة تلقائياً.
          </div>
          <Section title="نصوص واجهة الشباب (Youth)" icon={Palette}>
            <div className="grid md:grid-cols-2 gap-4">
              {F("العنوان الرئيسي", "youth_hero_title", "اللبس اللي بيعبر عنك")}
              {F("العنوان الفرعي", "youth_hero_subtitle", "ترندات جديدة كل أسبوع 🔥")}
              {F("نص زرار الاستعراض", "youth_cta_text", "شوف الأحدث")}
            </div>
            <div className="mt-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <p className="text-xs font-bold text-green-700 dark:text-green-300">معاينة:</p>
              <p className="font-display text-xl font-black mt-1">{form.youth_hero_title || "—"}</p>
              <p className="text-sm text-muted-foreground">{form.youth_hero_subtitle || "—"}</p>
              <span className="mt-2 inline-block px-4 py-1 bg-green-500 text-white text-xs font-bold rounded-full">{form.youth_cta_text || "—"}</span>
            </div>
          </Section>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm dark:bg-amber-950 dark:border-amber-800 dark:text-amber-200">
            <strong>🥇 واجهة البريميوم (Premium 26+):</strong> تظهر بالذهبي الدافئ للعملاء من عمر 26 سنة فأكثر.
          </div>
          <Section title="نصوص واجهة البريميوم (Premium)" icon={Palette}>
            <div className="grid md:grid-cols-2 gap-4">
              {F("العنوان الرئيسي", "premium_hero_title", "أناقتك بلمسة هدمة")}
              {F("العنوان الفرعي", "premium_hero_subtitle", "مجموعة راقية لأصحاب الذوق الرفيع")}
              {F("نص زرار الاستعراض", "premium_cta_text", "تسوّق المجموعة")}
            </div>
            <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs font-bold text-amber-700 dark:text-amber-300">معاينة:</p>
              <p className="font-display text-xl font-black mt-1">{form.premium_hero_title || "—"}</p>
              <p className="text-sm text-muted-foreground">{form.premium_hero_subtitle || "—"}</p>
              <span className="mt-2 inline-block px-4 py-1 bg-amber-600 text-white text-xs font-bold rounded-full">{form.premium_cta_text || "—"}</span>
            </div>
          </Section>
        </div>
      )}

      {/* ===== ADVANCED ===== */}
      {activeSection === "advanced" && (
        <div className="space-y-5">
          <Section title="الروابط السريعة (Quick Links)" icon={Zap}>
            <p className="text-xs text-muted-foreground">تنسيق JSON — كل رابط يحتاج &quot;label&quot; و&quot;to&quot;</p>
            <Textarea
              rows={12}
              className="font-mono text-xs ltr text-left rounded-2xl bg-muted/5 p-4"
              value={form.quick_links_str}
              onChange={(e) => setForm({ ...form, quick_links_str: e.target.value })}
            />
          </Section>
        </div>
      )}

      {/* Save Button */}
      <div className="pt-4 sticky bottom-0 bg-background/80 backdrop-blur-sm pb-2">
        <Button onClick={save} className="gradient-gold text-primary rounded-xl px-10 font-bold h-12 shadow-lg w-full md:w-auto">
          <Save className="size-5 ml-2" /> حفظ التغييرات
        </Button>
      </div>
    </div>
  );
}
