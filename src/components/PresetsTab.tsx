import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Sparkles, Save, Info } from "lucide-react";

export function PresetsTab() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["all-presets"],
    queryFn: async () => {
      const { data } = await supabase.from("input_presets").select("*");
      return data ?? [];
    },
  });

  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data) {
      const d: Record<string, string> = {};
      data.forEach((p: any) => { 
        d[p.id] = (p.values as string[]).join(", "); 
      });
      setDrafts(d);
    }
  }, [data]);

  const save = async (id: string) => {
    const values = (drafts[id] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    const { error } = await supabase.from("input_presets").upsert({ id, values: values as never });
    if (error) return toast.error(error.message);
    toast.success("تم تحديث البيانات بنجاح");
    qc.invalidateQueries({ queryKey: ["preset", id] });
    qc.invalidateQueries({ queryKey: ["all-presets"] });
  };

  const labels: Record<string, string> = { 
    sizes: "قائمة المقاسات المتاحة", 
    colors: "قائمة الألوان المتاحة", 
    categories: "تصنيفات المنتجات" 
  };

  return (
    <div className="max-w-4xl space-y-6 animate-in zoom-in-95 duration-500 pb-10">
      <div className="rounded-3xl border bg-gradient-to-br from-gold-gradient/5 to-transparent p-6 flex items-start gap-4 border-gold-gradient/10 shadow-sm">
        <div className="size-10 rounded-2xl bg-gold-gradient grid place-items-center shrink-0 shadow-lg shadow-gold-gradient/20">
          <Sparkles className="size-5 text-primary" />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-lg">الإدخال السريع والمسبق</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            من هنا تقدر تتحكم في الخيارات اللي بتظهر للتجار في صفحة إضافة منتج. 
            اكتب القيم وافصل بين كل وحدة بفاصلة (مثلاً: أحمر، أزرق، أخضر).
          </p>
        </div>
      </div>

      <div className="grid gap-6">
        {["sizes", "colors", "categories"].map((id) => (
          <div key={id} className="rounded-3xl border bg-card p-6 space-y-4 hover:border-gold-gradient/20 transition-colors shadow-sm">
            <div className="flex items-center justify-between">
              <Label className="font-black text-lg">{labels[id]}</Label>
              <div className="text-[10px] bg-muted/50 px-2 py-0.5 rounded uppercase font-bold tracking-widest text-muted-foreground">{id}</div>
            </div>
            <Textarea 
              rows={4} 
              className="rounded-2xl bg-muted/5 border-gold-gradient/5 focus-visible:ring-gold-gradient/30 p-4 text-base" 
              value={drafts[id] ?? ""} 
              onChange={(e) => setDrafts({ ...drafts, [id]: e.target.value })} 
              placeholder="اكتب القيم هنا مفصولة بفاصلة..."
            />
            <div className="flex items-center justify-between">
               <div className="text-xs text-muted-foreground flex items-center gap-1">
                 <Info className="size-3" />
                 سيتم عرض هذه القيم كأزرار اختيار سريعة.
               </div>
               <Button onClick={() => save(id)} size="sm" className="gradient-gold text-primary rounded-xl px-6 font-bold h-10 shadow-md">
                <Save className="size-4 ml-2" /> حفظ {labels[id]}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
