import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Globe, Save } from "lucide-react";

export function SettingsTab() {
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
    if (data && !form) {
      setForm({ 
        ...data, 
        quick_links_str: JSON.stringify(data.quick_links ?? [], null, 2) 
      });
    }
  }, [data, form]);

  if (!form) return <div className="p-20 text-center text-muted-foreground animate-pulse">جاري تحميل الإعدادات...</div>;

  const save = async () => {
    let links: any = [];
    try { 
      links = JSON.parse(form.quick_links_str); 
    } catch { 
      return toast.error("الروابط السريعة JSON غير صحيح، يرجى مراجعة التنسيق"); 
    }

    const { error } = await supabase.from("site_settings").update({
      whatsapp: form.whatsapp, 
      email: form.email,
      instagram_url: form.instagram_url, 
      facebook_url: form.facebook_url, 
      tiktok_url: form.tiktok_url,
      address: form.address, 
      quick_links: links,
      logo_url: form.logo_url,
      slogan: form.slogan,
      marquee_text: form.marquee_text,
      marquee_visible: form.marquee_visible,
      shipping_text: form.shipping_text,
      fast_shipping_text: form.fast_shipping_text,
      social_proof_enabled: form.social_proof_enabled,
      social_proof_real_data: form.social_proof_real_data,
    }).eq("id", "main");

    if (error) return toast.error(error.message);
    
    toast.success("تم حفظ إعدادات الموقع بنجاح");
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
            <h3 className="font-bold text-2xl">إعدادات الموقع العامة</h3>
            <p className="text-sm text-muted-foreground">تحكم في كافة بيانات التواصل والروابط الخارجية للمنصة</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {F("رابط اللوجو (Logo URL)", "logo_url", "https://...")}
          {F("الشعار اللفظي (Slogan)", "slogan", "أناقتك تبدأ من هنا")}
          {F("رقم الواتساب (مع كود الدولة بدون +)", "whatsapp", "201229344711")}
          {F("البريد الإلكتروني الرسمي", "email", "hedma@example.com")}
          {F("رابط إنستجرام", "instagram_url", "https://instagram.com/...")}
          {F("رابط فيسبوك", "facebook_url", "https://facebook.com/...")}
          {F("رابط تيك توك", "tiktok_url", "https://tiktok.com/@...")}
          {F("العنوان الفعلي", "address", "التل الكبير، الإسماعيلية")}
        </div>

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
          <div className="p-4 rounded-xl bg-accent/30 text-xs text-muted-foreground flex items-start gap-2 leading-relaxed">
             💡 <strong>تلميح:</strong> هذا الحقل مخصص للمبرمجين. تأكد من أن التنسيق عبارة عن قائمة من الأجسام التي تحتوي على <code>label</code> و <code>to</code>.
          </div>
        </div>

        <Button onClick={save} className="gradient-gold text-primary rounded-xl px-10 font-bold h-12 shadow-lg shadow-gold-gradient/10 w-full md:w-auto">
          <Save className="size-5 ml-2" /> حفظ التغييرات النهائية
        </Button>
      </div>
    </div>
  );
}
