import { useState, useEffect, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Globe, Save, Upload, Loader2, Image as ImageIcon } from "lucide-react";

export function SettingsTab() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

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
      const links = Array.isArray(data.quick_links) ? data.quick_links : ((data.quick_links as any)?.links || []);
      
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
        quick_links_str: JSON.stringify(links, null, 2) 
      });
    }
  }, [data, form]);

  if (!form) return <div className="p-20 text-center text-muted-foreground animate-pulse">جاري تحميل الإعدادات...</div>;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) return toast.error("يرجى اختيار ملف صورة صالح");
    if (file.size > 2 * 1024 * 1024) return toast.error("حجم الصورة يجب أن لا يتعدى 2MB");

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `branding/logo-${Date.now()}.${ext}`;
      
      const { error: uploadError } = await supabase.storage
        .from("branding")
        .upload(path, file, { upsert: true });

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

  const save = async () => {
    let links: any = [];
    try { 
      links = JSON.parse(form.quick_links_str); 
    } catch { 
      return toast.error("الروابط السريعة JSON غير صحيح، يرجى مراجعة التنسيق"); 
    }

    const extendedData = {
      logo_url: form.logo_url,
      slogan: form.slogan,
      marquee_text: form.marquee_text,
      marquee_visible: form.marquee_visible,
      shipping_text: form.shipping_text,
      fast_shipping_text: form.fast_shipping_text,
      social_proof_enabled: form.social_proof_enabled,
      social_proof_real_data: form.social_proof_real_data,
    };

    // Prepare core update
    const coreUpdate: any = {
      whatsapp: form.whatsapp, 
      email: form.email,
      instagram_url: form.instagram_url, 
      facebook_url: form.facebook_url, 
      tiktok_url: form.tiktok_url,
      address: form.address, 
      quick_links: links,
    };

    // Try to update core + extended in one go first
    const { error: fullError } = await supabase.from("site_settings").update({
      ...coreUpdate,
      ...extendedData
    }).eq("id", "main");

    if (!fullError) {
      toast.success("تم حفظ كافة إعدادات الموقع بنجاح ✨");
    } else {
      // If fails with 400, use metadata fallback
      console.warn("Falling back to metadata storage due to missing columns");
      const fallbackUpdate = {
        ...coreUpdate,
        quick_links: {
          links: links,
          __metadata: extendedData
        }
      };
      const { error: fallbackError } = await supabase.from("site_settings").update(fallbackUpdate).eq("id", "main");
      if (fallbackError) return toast.error("خطأ في الحفظ: " + fallbackError.message);
      
      toast.success("تم الحفظ بنجاح (وضع التوافق) ✨");
      toast.info("ملاحظة: نوصي بتشغيل كود SQL لتحديث قاعدة البيانات للأداء الأمثل.");
    }

    qc.invalidateQueries({ queryKey: ["site-settings"] });
    qc.invalidateQueries({ queryKey: ["site-settings-admin"] });
  };

  const F = (label: string, key: string, placeholder = "") => (
    <div className="space-y-2">
      <Label className="text-sm font-bold text-muted-foreground">{label}</Label>
      <Input 
        className="rounded-xl h-11 border-gold-gradient/10 focus-visible:ring-gold-gradient/30 bg-muted/5" 
        value={form[key] ?? ""} 
        placeholder={placeholder} 
        onChange={(e) => setForm({ ...form, [key]: e.target.value })} 
      />
    </div>
  );

  return (
    <div className="max-w-4xl space-y-8 animate-in slide-in-from-right-4 duration-500 pb-10">
      <div className="rounded-3xl border bg-card p-8 shadow-sm border-gold-gradient/10">
        <div className="flex items-center gap-4 mb-8">
          <div className="size-12 rounded-2xl bg-gold-gradient/10 grid place-items-center">
            <Globe className="size-6 text-gold-gradient" />
          </div>
          <div>
            <h3 className="font-bold text-2xl">إعدادات الهوية البصرية (Branding)</h3>
            <p className="text-sm text-muted-foreground">تحكم في اللوجو، الشعار، والبيانات العامة للموقع</p>
          </div>
        </div>

        <div className="space-y-6 mb-10 border-b pb-8">
           <div className="flex flex-col md:flex-row items-start gap-8">
              <div className="space-y-4 flex-1">
                <Label className="text-sm font-bold">لوجو الموقع (الرئيسي)</Label>
                <div className="flex items-center gap-3">
                  <Input 
                    className="rounded-xl h-11 bg-muted/5 font-mono text-xs" 
                    value={form.logo_url ?? ""} 
                    readOnly 
                    placeholder="رابط اللوجو سيظهر هنا..."
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="h-11 px-6 rounded-xl border-gold-gradient/20 hover:bg-gold-gradient/10 shrink-0"
                  >
                    {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4 ml-2" />}
                    رفع ملف
                  </Button>
                  <input type="file" ref={fileRef} hidden accept="image/*" onChange={handleFileUpload} />
                </div>
                <p className="text-[10px] text-muted-foreground">يفضل استخدام صورة شفافة (PNG) بأبعاد مربعة أو مستطيلة بنسبة 1:1 أو 3:1.</p>
              </div>

              <div className="size-32 rounded-3xl border-2 border-dashed border-gold-gradient/20 grid place-items-center bg-muted/5 overflow-hidden shrink-0">
                {form.logo_url ? (
                  <img src={form.logo_url} className="size-full object-contain p-2" alt="Preview" />
                ) : (
                  <ImageIcon className="size-8 text-muted-foreground/30" />
                )}
              </div>
           </div>

           <div className="grid md:grid-cols-2 gap-6">
              {F("الشعار اللفظي (Slogan)", "slogan", "أناقتك تبدأ من هنا")}
              <div className="p-4 rounded-2xl bg-gold-gradient/5 border border-gold-gradient/10 text-[11px] leading-relaxed">
                 ℹ️ <strong>ملاحظة:</strong> الشعار اللفظي سيظهر تحت اللوجو في الهيدر والفوتر بوضوح ويدعم اللغة العربية تماماً.
              </div>
           </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {F("رقم الواتساب (مع كود الدولة بدون +)", "whatsapp", "201229344711")}
          {F("البريد الإلكتروني الرسمي", "email", "hedma@example.com")}
          {F("رابط إنستجرام", "instagram_url", "https://instagram.com/...")}
          {F("رابط فيسبوك", "facebook_url", "https://facebook.com/...")}
          {F("رابط تيك توك", "tiktok_url", "https://tiktok.com/@...")}
          {F("العنوان الفعلي", "address", "التل الكبير، الإسماعيلية")}
        </div>

        {/* ... Rest of the component (Marquee, Social Proof, etc.) ... */}
        <div className="grid md:grid-cols-2 gap-6 mb-8 border-t pt-8">
          <div className="space-y-4">
            <h4 className="font-bold text-lg flex items-center gap-2">📢 الشريط المتحرك (Marquee)</h4>
            {F("نص الشريط المتحرك", "marquee_text", "شحن سريع لجميع المحافظات 🚚")}
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={form.marquee_visible ?? true} 
                onChange={(e) => setForm({ ...form, marquee_visible: e.target.checked })}
                className="accent-gold"
              />
              <span className="text-sm font-semibold">إظهار الشريط العلوي</span>
            </label>
          </div>
          <div className="space-y-4">
            <h4 className="font-bold text-lg flex items-center gap-2">✨ نصوص الثقة (Social Proof)</h4>
            {F("نص الشحن", "shipping_text", "شحن لجميع المحافظات")}
            {F("نص السرعة", "fast_shipping_text", "شحن سريع وآمن")}
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={form.social_proof_enabled ?? true} 
                onChange={(e) => setForm({ ...form, social_proof_enabled: e.target.checked })}
                className="accent-gold"
              />
              <span className="text-sm font-semibold">تفعيل نافذة "اشترى فلان من.."</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input 
                type="checkbox" 
                checked={form.social_proof_real_data ?? false} 
                onChange={(e) => setForm({ ...form, social_proof_real_data: e.target.checked })}
                className="accent-gold"
              />
              <span className="text-sm font-semibold">استخدام بيانات حقيقية من الطلبات</span>
            </label>
          </div>
        </div>

        <div className="space-y-3 mb-8 border-t pt-8">
          <Label className="text-sm font-bold text-muted-foreground">الروابط السريعة (تنسيق JSON)</Label>
          <Textarea 
            rows={10} 
            className="font-mono text-xs ltr text-left rounded-2xl border-gold-gradient/10 bg-muted/5 focus-visible:ring-gold-gradient/30 p-4" 
            value={form.quick_links_str} 
            onChange={(e) => setForm({ ...form, quick_links_str: e.target.value })} 
          />
        </div>

        <Button onClick={save} className="gradient-gold text-primary rounded-xl px-10 font-bold h-12 shadow-lg shadow-gold-gradient/10 w-full md:w-auto">
          <Save className="size-5 ml-2" /> حفظ التغييرات النهائية
        </Button>
      </div>
    </div>
  );
}
