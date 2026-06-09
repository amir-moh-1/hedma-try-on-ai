import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Palette, Wand2, Upload, Save, Eye, RotateCcw, Zap, Globe,
  Check, X, Smartphone, Monitor, ChevronDown, Sparkles,
  RefreshCw, Play,
} from "lucide-react";

type Segment = "youth" | "premium";
type ViewMode = "desktop" | "mobile";

const SEGMENT_PRESETS: Record<Segment, { accent: string; bg: string; textAccent: string; name: string }> = {
  youth: { accent: "#A3E635", bg: "#121212", textAccent: "#A3E635", name: "Street Wear" },
  premium: { accent: "#D4A017", bg: "#F5F0E8", textAccent: "#D4A017", name: "Premium" },
};

const COLOR_PALETTES = [
  { name: "Street Neon", colors: ["#A3E635","#22D3EE","#F97316","#EC4899","#8B5CF6"] },
  { name: "Urban Night", colors: ["#6366F1","#8B5CF6","#EC4899","#F43F5E","#EAB308"] },
  { name: "Premium Gold", colors: ["#D4A017","#B8860B","#DAA520","#C0A35E","#FFD700"] },
  { name: "Minimal", colors: ["#1A1A1A","#444444","#888888","#CCCCCC","#F5F5F5"] },
];

function extractDominantColors(file: File): Promise<string[]> {
  return new Promise((resolve) => {
    const img = new Image();
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    img.onload = () => {
      canvas.width = 64;
      canvas.height = 64;
      ctx.drawImage(img, 0, 0, 64, 64);
      const data = ctx.getImageData(0, 0, 64, 64).data;
      const colorMap: Record<string, number> = {};
      for (let i = 0; i < data.length; i += 16) {
        const r = Math.round(data[i] / 32) * 32;
        const g = Math.round(data[i+1] / 32) * 32;
        const b = Math.round(data[i+2] / 32) * 32;
        const hex = `#${r.toString(16).padStart(2,"0")}${g.toString(16).padStart(2,"0")}${b.toString(16).padStart(2,"0")}`;
        colorMap[hex] = (colorMap[hex] || 0) + 1;
      }
      const sorted = Object.entries(colorMap).sort((a,b) => b[1]-a[1]).slice(0,5).map(([c]) => c);
      resolve(sorted);
    };
    img.src = URL.createObjectURL(file);
  });
}

const DRAFT_KEY = "hedma:storefront-builder-draft";

function loadDraft(seg: Segment) {
  try { return JSON.parse(localStorage.getItem(`${DRAFT_KEY}:${seg}`) || "null"); } catch { return null; }
}
function saveDraft(seg: Segment, data: any) {
  try { localStorage.setItem(`${DRAFT_KEY}:${seg}`, JSON.stringify(data)); } catch {}
}

export function StorefrontBuilderTab() {
  const qc = useQueryClient();
  const [segment, setSegment] = useState<Segment>("youth");
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");
  const [extracting, setExtracting] = useState(false);
  const [extractedColors, setExtractedColors] = useState<string[] | null>(null);
  const [themePreviewImg, setThemePreviewImg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const preset = SEGMENT_PRESETS[segment];

  const getInitial = useCallback((seg: Segment) => {
    const draft = loadDraft(seg);
    const p = SEGMENT_PRESETS[seg];
    return draft ?? {
      heroTitle: seg === "youth" ? "ط£ط³ظ„ظˆط¨ظƒ ظٹط¹ط¨ط± ط¹ظ†ظƒ" : "ط£ظ†ط§ظ‚طھظƒ ط¨ظ„ظ…ط³ط© ظ‡ط¯ظ…ط©",
      heroSubtitle: seg === "youth" ? "ط§ظƒطھط´ظپ ط£ط­ط¯ط« ط§ظ„طھط±ظ†ط¯ط§طھ" : "ظ…ط¬ظ…ظˆط¹ط© ط±ط§ظ‚ظٹط© ظ„ط£طµط­ط§ط¨ ط§ظ„ط°ظˆظ‚ ط§ظ„ط±ظپظٹط¹",
      ctaText: seg === "youth" ? "طھط³ظˆظ‚ ط§ظ„ط¢ظ†" : "طھط³ظˆظ‘ظ‚ ط§ظ„ظ…ط¬ظ…ظˆط¹ط©",
      accentColor: p.accent,
      bgColor: p.bg,
      showCategories: true,
      showBestSellers: true,
      showPromoBanner: true,
      showInstagram: true,
    };
  }, []);

  const [settings, setSettings] = useState(() => getInitial(segment));
  const [history, setHistory] = useState<any[]>([]);

  const handleSegmentChange = (seg: Segment) => {
    setSegment(seg);
    setSettings(getInitial(seg));
    setExtractedColors(null);
    setThemePreviewImg(null);
  };

  const update = (patch: Partial<typeof settings>) => {
    setHistory(h => [...h.slice(-10), settings]);
    setSettings((s: any) => ({ ...s, ...patch }));
  };

  const undo = () => {
    if (history.length === 0) return;
    setSettings(history[history.length - 1]);
    setHistory(h => h.slice(0,-1));
    toast.info("طھظ… ط§ظ„طھط±ط§ط¬ط¹");
  };

  const handleSaveDraft = () => {
    saveDraft(segment, settings);
    toast.success("طھظ… ط­ظپط¸ ط§ظ„ظ…ط³ظˆط¯ط© âœ…");
  };

  const { data: siteSettings } = useQuery({
    queryKey: ["site-settings"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase.from("site_settings").select("*").eq("id", "main").maybeSingle();
      return data;
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      const fieldMap = segment === "youth" ? {
        youth_hero_title: settings.heroTitle,
        youth_hero_subtitle: settings.heroSubtitle,
        youth_cta_text: settings.ctaText,
      } : {
        premium_hero_title: settings.heroTitle,
        premium_hero_subtitle: settings.heroSubtitle,
        premium_cta_text: settings.ctaText,
      };

      const existing = siteSettings as any;
      let meta: any = {};
      if (existing?.quick_links && !Array.isArray(existing.quick_links)) {
        meta = (existing.quick_links as any).__metadata || {};
      }

      const metaKey = segment === "youth" ? "youth_accent_color" : "premium_accent_color";
      meta[metaKey] = settings.accentColor;

      const { error } = await supabase.from("site_settings").upsert({
        id: "main",
        ...fieldMap,
        quick_links: existing?.quick_links ?? [],
      } as any, { onConflict: "id" });

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site-settings"] });
      saveDraft(segment, settings);
      toast.success(`ًںڑ€ طھظ… ظ†ط´ط± ط¥ط¹ط¯ط§ط¯ط§طھ ${preset.name} ظ„ظ„ط¹ظ…ظ„ط§ط،!`);
    },
    onError: (e: any) => toast.error("ط®ط·ط£ ظپظٹ ط§ظ„ظ†ط´ط±: " + e.message),
  });

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) return;
    setExtractedColors(null);
    setThemePreviewImg(URL.createObjectURL(file));
    setExtracting(true);
    const colors = await extractDominantColors(file);
    setExtractedColors(colors);
    setExtracting(false);
    toast.success(`طھظ… ط§ط³طھط®ط±ط§ط¬ ${colors.length} ظ„ظˆظ† ظ…ظ† ط§ظ„طµظˆط±ط© ًںژ¨`);
  };

  const applyExtractedColor = (color: string, field: "accentColor" | "bgColor") => {
    update({ [field]: color });
    toast.success("طھظ… طھط·ط¨ظٹظ‚ ط§ظ„ظ„ظˆظ† âœ…");
  };

  const heroKey = segment === "youth" ? "youth_hero_title" : "premium_hero_title";

  return (
    <div className="space-y-6" dir="rtl">
      {/* â”€â”€ HEADER â”€â”€ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-black text-2xl flex items-center gap-2">
            <Palette className="size-6 text-gold" /> ظ…طµظ…ظ… ط§ظ„ظ…طھط¬ط± ط§ظ„ظ…ط±ط¦ظٹ
          </h2>
          <p className="text-sm text-muted-foreground mt-1">طµظ…ظ‘ظ… طھط¬ط±ط¨ط© ط§ظ„ط¹ظ…ظ„ط§ط، ظ„ظƒظ„ ظپط¦ط© ط¹ظ…ط±ظٹط© ط¨ط¯ظˆظ† ظƒظˆط¯</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={undo} disabled={history.length === 0}>
            <RotateCcw className="size-3.5 ml-1" /> طھط±ط§ط¬ط¹
          </Button>
          <Button variant="outline" size="sm" onClick={handleSaveDraft}>
            <Save className="size-3.5 ml-1" /> ط­ظپط¸ ظ…ط³ظˆط¯ط©
          </Button>
          <Button size="sm" className="gradient-gold text-primary" onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending}>
            {publishMutation.isPending ? <RefreshCw className="size-3.5 ml-1 animate-spin" /> : <Play className="size-3.5 ml-1" />}
            ظ†ط´ط± ط§ظ„ط¢ظ†
          </Button>
        </div>
      </div>

      {/* â”€â”€ SEGMENT TOGGLE â”€â”€ */}
      <div className="grid grid-cols-2 gap-3 max-w-md">
        {(["youth","premium"] as Segment[]).map(seg => (
          <button
            key={seg}
            onClick={() => handleSegmentChange(seg)}
            className={`rounded-2xl border-2 p-4 text-right transition-all ${segment === seg ? "border-gold shadow-luxe" : "border-border hover:border-gold/50"}`}
          >
            <div className="font-black text-sm">{SEGMENT_PRESETS[seg].name}</div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {seg === "youth" ? "ط¹ظ…ط± ظ¢ظ¥ ط³ظ†ط© ظˆط£ظ‚ظ„" : "ط¹ظ…ط± ظ¢ظ¦ ط³ظ†ط© ظˆط£ظƒط¨ط±"}
            </div>
            {segment === seg && <div className="mt-2 size-2 rounded-full bg-gold" />}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-[380px_1fr] gap-6">
        {/* â”€â”€ LEFT: CONTROLS â”€â”€ */}
        <div className="space-y-5">

          {/* Hero Text */}
          <div className="rounded-2xl border bg-card p-5 space-y-4">
            <h3 className="font-black text-sm flex items-center gap-2"><Sparkles className="size-4 text-gold" /> ظ†طµ ط§ظ„ظ‡ظٹط±ظˆ</h3>
            <div>
              <Label className="text-xs">ط§ظ„ط¹ظ†ظˆط§ظ† ط§ظ„ط±ط¦ظٹط³ظٹ</Label>
              <Input value={settings.heroTitle} onChange={e => update({ heroTitle: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">ط§ظ„ط¹ظ†ظˆط§ظ† ط§ظ„ظپط±ط¹ظٹ</Label>
              <Input value={settings.heroSubtitle} onChange={e => update({ heroSubtitle: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">ظ†طµ ط²ط± ط§ظ„ظ€ CTA</Label>
              <Input value={settings.ctaText} onChange={e => update({ ctaText: e.target.value })} className="mt-1" />
            </div>
          </div>

          {/* Colors */}
          <div className="rounded-2xl border bg-card p-5 space-y-4">
            <h3 className="font-black text-sm flex items-center gap-2"><Palette className="size-4 text-gold" /> ط§ظ„ط£ظ„ظˆط§ظ†</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">ظ„ظˆظ† ط§ظ„ط¥ط¨ط±ط§ط²</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" value={settings.accentColor} onChange={e => update({ accentColor: e.target.value })} className="w-10 h-9 rounded-lg border cursor-pointer" />
                  <Input value={settings.accentColor} onChange={e => update({ accentColor: e.target.value })} className="font-mono text-xs h-9" maxLength={7} />
                </div>
              </div>
              <div>
                <Label className="text-xs">ظ„ظˆظ† ط§ظ„ط®ظ„ظپظٹط©</Label>
                <div className="flex items-center gap-2 mt-1">
                  <input type="color" value={settings.bgColor} onChange={e => update({ bgColor: e.target.value })} className="w-10 h-9 rounded-lg border cursor-pointer" />
                  <Input value={settings.bgColor} onChange={e => update({ bgColor: e.target.value })} className="font-mono text-xs h-9" maxLength={7} />
                </div>
              </div>
            </div>

            {/* Preset palettes */}
            <div>
              <Label className="text-xs mb-2 block">ط¨ط§ظ„ظٹطھط§طھ ط¬ط§ظ‡ط²ط©</Label>
              <div className="space-y-2">
                {COLOR_PALETTES.map(pal => (
                  <div key={pal.name} className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground w-20 shrink-0">{pal.name}</span>
                    <div className="flex gap-1">
                      {pal.colors.map(c => (
                        <button
                          key={c}
                          onClick={() => update({ accentColor: c })}
                          title={c}
                          style={{ background: c }}
                          className={`w-7 h-7 rounded-lg border-2 transition-all hover:scale-110 ${settings.accentColor === c ? "border-white shadow-md" : "border-transparent"}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section Visibility */}
          <div className="rounded-2xl border bg-card p-5 space-y-3">
            <h3 className="font-black text-sm flex items-center gap-2"><Eye className="size-4 text-gold" /> ط§ظ„ط£ظ‚ط³ط§ظ…</h3>
            {[
              { key: "showCategories", label: "ظ‚ط³ظ… ط§ظ„ظپط¦ط§طھ" },
              { key: "showBestSellers", label: "ط§ظ„ط£ظƒط«ط± ظ…ط¨ظٹط¹ط§ظ‹" },
              { key: "showPromoBanner", label: "ط¨ط§ظ†ط± ط§ظ„ط®طµظ…" },
              { key: "showInstagram", label: "ظ‚ط³ظ… ط§ظ„ط§ظ†ط³طھط¬ط±ط§ظ…" },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center justify-between cursor-pointer group">
                <span className="text-sm font-medium group-hover:text-gold transition-colors">{label}</span>
                <div
                  onClick={() => update({ [key]: !(settings as any)[key] })}
                  className={`w-11 h-6 rounded-full transition-all relative cursor-pointer ${(settings as any)[key] ? "bg-gold" : "bg-muted"}`}
                >
                  <div className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${(settings as any)[key] ? "left-0.5" : "right-0.5"}`} />
                </div>
              </label>
            ))}
          </div>

          {/* AI Theme Generator */}
          <div className="rounded-2xl border bg-card p-5 space-y-4">
            <h3 className="font-black text-sm flex items-center gap-2">
              <Wand2 className="size-4 text-gold" /> ظ…ظˆظ„ظ‘ط¯ ط§ظ„ط«ظٹظ… ط¨ط§ظ„ط°ظƒط§ط، ط§ظ„ط§طµط·ظ†ط§ط¹ظٹ
            </h3>
            <p className="text-xs text-muted-foreground">ط§ط±ظپط¹ طµظˆط±ط© ظ…ظˆط³ظ…ظٹط© ظˆط³ظٹط³طھط®ط±ط¬ ط§ظ„ط°ظƒط§ط، ط§ظ„ط§طµط·ظ†ط§ط¹ظٹ ط£ظ„ظˆط§ظ† ط§ظ„ط«ظٹظ… طھظ„ظ‚ط§ط¦ظٹط§ظ‹</p>

            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])} />

            {themePreviewImg ? (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden aspect-video bg-muted">
                  <img src={themePreviewImg} alt="ط«ظٹظ… ط§ظ„طµظˆط±ط©" className="w-full h-full object-cover" />
                  <button onClick={() => { setThemePreviewImg(null); setExtractedColors(null); }} className="absolute top-2 left-2 size-7 bg-black/60 rounded-full flex items-center justify-center text-white">
                    <X className="size-3.5" />
                  </button>
                </div>

                {extracting && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <RefreshCw className="size-3.5 animate-spin" />
                    ط¬ط§ط±ظٹ ط§ط³طھط®ط±ط§ط¬ ط§ظ„ط£ظ„ظˆط§ظ†...
                  </div>
                )}

                {extractedColors && (
                  <div>
                    <div className="text-xs font-bold mb-2">ط§ظ„ط£ظ„ظˆط§ظ† ط§ظ„ظ…ط³طھط®ط±ط¬ط© â€” ط§ط¶ط؛ط· ظ„طھط·ط¨ظٹظ‚:</div>
                    <div className="flex gap-2 flex-wrap">
                      {extractedColors.map((c, i) => (
                        <div key={c} className="flex flex-col items-center gap-1">
                          <button
                            style={{ background: c }}
                            onClick={() => applyExtractedColor(c, i === 0 ? "bgColor" : "accentColor")}
                            className="w-10 h-10 rounded-xl border-2 border-white/20 hover:scale-110 transition-all shadow-md"
                            title={c}
                          />
                          <span className="text-[9px] font-mono text-muted-foreground">{c}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => extractedColors[0] && update({ bgColor: extractedColors[0] })}>
                        طھط·ط¨ظٹظ‚ ظƒط®ظ„ظپظٹط©
                      </Button>
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => extractedColors[1] && update({ accentColor: extractedColors[1] })}>
                        طھط·ط¨ظٹظ‚ ظƒظ„ظˆظ† ط¥ط¨ط±ط§ط²
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                className="w-full rounded-xl border-2 border-dashed border-border hover:border-gold transition-colors p-6 flex flex-col items-center gap-2 text-muted-foreground hover:text-gold"
              >
                <Upload className="size-6" />
                <span className="text-xs font-bold">ط§ط±ظپط¹ طµظˆط±ط© ظ…ظˆط³ظ…ظٹط©</span>
                <span className="text-[10px]">PNG, JPG ط­طھظ‰ 10MB</span>
              </button>
            )}
          </div>
        </div>

        {/* â”€â”€ RIGHT: PREVIEW â”€â”€ */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm">ظ…ط¹ط§ظٹظ†ط© ط­ظٹط©</h3>
            <div className="flex items-center border rounded-xl overflow-hidden">
              <button
                onClick={() => setViewMode("desktop")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all ${viewMode === "desktop" ? "bg-gold text-primary" : "text-muted-foreground hover:bg-muted"}`}
              >
                <Monitor className="size-3.5" /> ط¯ظٹط³ظƒطھظˆط¨
              </button>
              <button
                onClick={() => setViewMode("mobile")}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold transition-all ${viewMode === "mobile" ? "bg-gold text-primary" : "text-muted-foreground hover:bg-muted"}`}
              >
                <Smartphone className="size-3.5" /> ظ…ظˆط¨ط§ظٹظ„
              </button>
            </div>
          </div>

          <div className={`border rounded-2xl overflow-hidden bg-muted/30 ${viewMode === "mobile" ? "max-w-sm mx-auto" : ""}`}>
            {/* Simulated browser bar */}
            <div className="flex items-center gap-2 px-4 py-2 bg-card border-b">
              <div className="flex gap-1.5">
                <div className="size-3 rounded-full bg-red-400" />
                <div className="size-3 rounded-full bg-yellow-400" />
                <div className="size-3 rounded-full bg-green-400" />
              </div>
              <div className="flex-1 bg-muted rounded-lg px-3 py-1 text-[10px] text-muted-foreground font-mono">
                hadma.store/
              </div>
            </div>

            {/* Preview content */}
            <div
              dir="rtl"
              style={{
                background: settings.bgColor,
                minHeight: "400px",
                padding: "1.5rem",
                transition: "background 0.3s",
              }}
            >
              {/* Hero preview */}
              <div style={{
                background: segment === "youth" ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.6)",
                border: `2px solid ${settings.accentColor}33`,
                borderRadius: "12px", padding: "2rem",
                marginBottom: "1rem",
              }}>
                <div style={{ color: segment === "youth" ? "#888" : "#666", fontSize: "11px", marginBottom: "0.5rem" }}>
                  {settings.heroSubtitle}
                </div>
                <div style={{
                  color: segment === "youth" ? "#fff" : "#1a1a1a",
                  fontSize: "clamp(1.2rem, 3vw, 1.8rem)",
                  fontWeight: "900", lineHeight: "1.2", marginBottom: "1rem",
                }}>
                  {settings.heroTitle}
                </div>
                <div style={{
                  display: "inline-block",
                  background: settings.accentColor,
                  color: segment === "youth" ? "#000" : "#fff",
                  padding: "10px 24px", borderRadius: "6px",
                  fontSize: "12px", fontWeight: "900",
                }}>
                  {settings.ctaText} â†گ
                </div>
              </div>

              {/* Categories preview */}
              {settings.showCategories && (
                <div style={{
                  background: segment === "youth" ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
                  borderRadius: "12px", padding: "1rem",
                  marginBottom: "1rem", display: "flex", gap: "0.75rem",
                  overflowX: "auto",
                }}
                  className="no-scrollbar">
                  {["طھظٹط´ظٹط±طھط§طھ","ظ‡ظˆط¯ظٹط²","ط¨ظ†ط·ظ„ظˆظ†ط§طھ","ط£ط­ط°ظٹط©"].map(cat => (
                    <div key={cat} style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: "6px" }}>
                      <div style={{
                        width: "48px", height: "48px", borderRadius: "50%",
                        background: segment === "youth" ? "#2a2a2a" : "#e5dcd0",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem",
                      }}>ًں‘•</div>
                      <span style={{ fontSize: "9px", color: segment === "youth" ? "#aaa" : "#555", fontWeight: "700" }}>{cat}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Products preview */}
              {settings.showBestSellers && (
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ color: settings.accentColor, fontSize: "13px", fontWeight: "900", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "6px" }}>
                    âڑ، ط§ظ„ط£ظƒط«ط± ظ…ط¨ظٹط¹ط§ظ‹
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
                    {[1,2,3].map(i => (
                      <div key={i} style={{
                        background: segment === "youth" ? "#1e1e1e" : "#fff",
                        border: `1px solid ${segment === "youth" ? "#2a2a2a" : "#e5e5e5"}`,
                        borderRadius: "10px", overflow: "hidden",
                      }}>
                        <div style={{ aspectRatio: "1", background: segment === "youth" ? "#2a2a2a" : "#f0f0f0" }} />
                        <div style={{ padding: "8px" }}>
                          <div style={{ color: segment === "youth" ? "#ccc" : "#333", fontSize: "9px", marginBottom: "4px" }}>ظ…ظ†طھط¬ {i}</div>
                          <div style={{ color: settings.accentColor, fontSize: "10px", fontWeight: "900" }}>ظ¢ظ©ظ© ط¬</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Status badge */}
              <div style={{
                background: settings.accentColor + "22",
                border: `1px solid ${settings.accentColor}44`,
                borderRadius: "8px", padding: "8px 12px",
                display: "flex", alignItems: "center", gap: "6px",
              }}>
                <Check style={{ color: settings.accentColor, width: "14px", height: "14px" }} />
                <span style={{ color: settings.accentColor, fontSize: "10px", fontWeight: "700" }}>
                  ظ…ط¹ط§ظٹظ†ط©: {SEGMENT_PRESETS[segment].name}
                </span>
              </div>
            </div>
          </div>

          {/* Action info */}
          <div className="rounded-xl border bg-card p-4 text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-2 font-bold text-foreground">
              <Zap className="size-3.5 text-gold" /> طھط¹ظ„ظٹظ…ط§طھ ط§ظ„ظ†ط´ط±
            </div>
            <p>â€¢ "ط­ظپط¸ ظ…ط³ظˆط¯ط©" â€” ظٹط­ظپط¸ ط§ظ„طھط¹ط¯ظٹظ„ط§طھ ظ…ط­ظ„ظٹط§ظ‹ ط¨ط¯ظˆظ† ظ†ط´ط±</p>
            <p>â€¢ "ظ†ط´ط± ط§ظ„ط¢ظ†" â€” ظٹط­ط¯ظ‘ط« طھط¬ط±ط¨ط© ط§ظ„ط¹ظ…ظ„ط§ط، ظپظˆط±ط§ظ‹ ظ„ظپط¦ط© {SEGMENT_PRESETS[segment].name}</p>
            <p>â€¢ "طھط±ط§ط¬ط¹" â€” ظٹط±ط¬ط¹ ظ„ط¢ط®ط± طھط¹ط¯ظٹظ„ ظ‚ط¨ظ„ ط§ظ„طھط؛ظٹظٹط± ط§ظ„ط£ط®ظٹط±</p>
          </div>
        </div>
      </div>
    </div>
  );
}
