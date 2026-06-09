import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Palette, Save, Undo2, Upload, WandSparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { defaultStorefrontThemes, normalizeStorefrontBuilder, shapeClass, splitQuickLinks, type StorefrontAudience, type StorefrontBuilderState, type StorefrontTheme } from "@/lib/storefrontConfig";
import { toast } from "sonner";
import streetHero from "@/assets/hadma-street-hero.jpg";

export function StorefrontBuilderTab() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [audience, setAudience] = useState<StorefrontAudience>("under25");
  const [state, setState] = useState<StorefrontBuilderState>(() => normalizeStorefrontBuilder(null));
  const [history, setHistory] = useState<StorefrontBuilderState[]>([]);
  const [quickLinks, setQuickLinks] = useState<any[]>([]);
  const [meta, setMeta] = useState<Record<string, any>>({});

  const { data } = useQuery({
    queryKey: ["site-settings-admin-builder"],
    queryFn: async () => (await supabase.from("site_settings").select("quick_links").eq("id", "main").maybeSingle()).data,
  });

  useEffect(() => {
    if (!data) return;
    const parsed = splitQuickLinks(data.quick_links);
    setQuickLinks(parsed.links);
    setMeta(parsed.meta);
    setState(normalizeStorefrontBuilder((parsed.meta as any).storefront_builder));
  }, [data]);

  const theme = state.drafts[audience];
  const published = state.published[audience];

  const commit = (nextTheme: StorefrontTheme) => {
    setHistory((h) => [...h.slice(-15), state]);
    setState((s) => ({ ...s, drafts: { ...s.drafts, [audience]: nextTheme }, updatedAt: new Date().toISOString() }));
  };

  const update = (patch: Partial<StorefrontTheme>) => commit({ ...theme, ...patch });

  const saveState = async (next: StorefrontBuilderState, message: string) => {
    const { error } = await supabase.from("site_settings").update({
      quick_links: { links: quickLinks, __metadata: { ...meta, storefront_builder: next } },
    }).eq("id", "main");
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["site-settings"] });
    qc.invalidateQueries({ queryKey: ["site-settings-admin-builder"] });
    toast.success(message);
  };

  const saveDraft = () => saveState(state, "تم حفظ المسودة");
  const publish = () => {
    const next = { ...state, published: { ...state.published, [audience]: theme }, updatedAt: new Date().toISOString() };
    setState(next);
    saveState(next, audience === "under25" ? "تم نشر واجهة الشباب" : "تم نشر واجهة البريميوم");
  };
  const undo = () => setHistory((h) => {
    const prev = h[h.length - 1];
    if (prev) setState(prev);
    return h.slice(0, -1);
  });

  const extractTheme = async (file: File) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 60; canvas.height = 60;
      const ctx = canvas.getContext("2d");
      ctx?.drawImage(img, 0, 0, 60, 60);
      const pixels = ctx?.getImageData(0, 0, 60, 60).data;
      if (!pixels) return;
      let r = 0, g = 0, b = 0, bright = { r: 163, g: 230, b: 53 };
      for (let i = 0; i < pixels.length; i += 16) {
        r += pixels[i]; g += pixels[i + 1]; b += pixels[i + 2];
        if (pixels[i] + pixels[i + 1] + pixels[i + 2] > bright.r + bright.g + bright.b) bright = { r: pixels[i], g: pixels[i + 1], b: pixels[i + 2] };
      }
      const n = pixels.length / 16;
      const bg = `#${[r / n, g / n, b / n].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("")}`;
      const accent = `#${[bright.r, bright.g, bright.b].map((x) => Math.round(x).toString(16).padStart(2, "0")).join("")}`;
      update({ seasonalImage: url, backgroundColor: bg, sectionColor: bg, accentColor: accent, textColor: "#F7F7F2", mutedTextColor: "#B9B9B9" });
      toast.success("AI استخرج ألوان الثيم وطبقها على المعاينة");
    };
    img.src = url;
  };

  const css = { "--p-bg": theme.backgroundColor, "--p-section": theme.sectionColor, "--p-text": theme.textColor, "--p-muted": theme.mutedTextColor, "--p-accent": theme.accentColor } as any;

  return (
    <div className="grid xl:grid-cols-[420px_1fr] gap-6 text-right">
      <aside className="rounded-3xl border bg-card p-5 space-y-5">
        <div><h2 className="font-display text-2xl font-black flex items-center gap-2"><Palette className="size-5 text-gold" /> مصمم واجهات HADMA</h2><p className="text-xs text-muted-foreground mt-1">تحكم في واجهة الشباب والبريميوم واحفظ مسودة أو انشر مباشرة.</p></div>
        <Tabs value={audience} onValueChange={(v) => setAudience(v as StorefrontAudience)}><TabsList className="w-full"><TabsTrigger value="under25" className="flex-1">٢٥ سنة أو أقل</TabsTrigger><TabsTrigger value="over25" className="flex-1">٢٦+</TabsTrigger></TabsList></Tabs>
        <div className="grid grid-cols-2 gap-3"><Field label="الخلفية" value={theme.backgroundColor} onChange={(v) => update({ backgroundColor: v })} type="color" /><Field label="الأقسام" value={theme.sectionColor} onChange={(v) => update({ sectionColor: v })} type="color" /><Field label="النص" value={theme.textColor} onChange={(v) => update({ textColor: v })} type="color" /><Field label="Accent" value={theme.accentColor} onChange={(v) => update({ accentColor: v })} type="color" /></div>
        <Field label="عنوان الهيرو" value={theme.heroTitle} onChange={(v) => update({ heroTitle: v })} />
        <div className="space-y-2"><Label>وصف الهيرو</Label><Textarea value={theme.heroSubtitle} onChange={(e) => update({ heroSubtitle: e.target.value })} /></div>
        <Field label="نص الزر" value={theme.ctaText} onChange={(v) => update({ ctaText: v })} />
        <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>شكل الكروت</Label><select value={theme.cardShape} onChange={(e) => update({ cardShape: e.target.value as any })} className="h-10 w-full rounded-xl border bg-background px-3"><option value="rounded">Rounded</option><option value="rectangle">Rectangle</option><option value="pill">Pill</option><option value="sharp">Sharp</option></select></div><Field label="@Instagram" value={theme.instagramHandle} onChange={(v) => update({ instagramHandle: v })} /></div>
        <Button variant="outline" onClick={() => fileRef.current?.click()} className="w-full rounded-xl"><Upload className="size-4 ml-2" /> Upload Seasonal Theme Image</Button><input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => e.target.files?.[0] && extractTheme(e.target.files[0])} />
        <div className="grid grid-cols-3 gap-2"><Button onClick={undo} variant="outline" disabled={!history.length}><Undo2 className="size-4" /></Button><Button onClick={saveDraft} variant="outline"><Save className="size-4 ml-1" /> مسودة</Button><Button onClick={publish} className="gradient-gold text-primary"><WandSparkles className="size-4 ml-1" /> نشر</Button></div>
      </aside>
      <section style={css} className="rounded-3xl overflow-hidden border bg-[var(--p-bg)] text-[var(--p-text)] shadow-luxe">
        <div className="p-3 border-b border-white/10 flex items-center justify-between text-xs text-[var(--p-muted)]"><span>Live Preview — Desktop/Mobile</span><span>Published: {published.heroTitle}</span></div>
        <div className="relative min-h-[520px] p-6 md:p-10 overflow-hidden"><img src={theme.seasonalImage || streetHero} alt="preview" className="absolute inset-0 size-full object-cover opacity-40" /><div className="absolute inset-0 bg-black/55" /><div className="relative max-w-xl pt-16"><div className="text-[var(--p-accent)] text-xs font-black mb-3">HADMA LIVE</div><h3 className="font-display text-5xl md:text-7xl font-black leading-tight">{theme.heroTitle}</h3><p className="mt-4 text-[var(--p-muted)] leading-8">{theme.heroSubtitle}</p><button className={`mt-6 bg-[var(--p-accent)] text-black px-7 py-3 font-black ${shapeClass(theme.cardShape)}`}>{theme.ctaText}</button></div><div className="relative mt-16 grid grid-cols-2 md:grid-cols-4 gap-3">{[1,2,3,4].map((i)=><div key={i} className={`bg-[var(--p-section)] border border-white/10 p-3 ${shapeClass(theme.cardShape)}`}><div className="aspect-[4/5] bg-white/10 mb-3" /><div className="h-3 bg-white/20 rounded" /><div className="mt-2 h-3 w-1/2 bg-[var(--p-accent)] rounded" /></div>)}</div></div>
      </section>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return <div className="space-y-2"><Label>{label}</Label><Input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="rounded-xl" /></div>;
}