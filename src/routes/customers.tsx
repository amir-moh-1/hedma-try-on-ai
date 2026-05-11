import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Upload, Trash2, Clock, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: "زبايننا بيلبسوا هدمة — Hedma" },
      { name: "description", content: "صور حقيقية من عملاء Hedma وهم لابسين هدمة. شاركنا صورتك واكسب 5% خصم." },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [caption, setCaption] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data: photos } = useQuery({
    queryKey: ["customer-photos-all"],
    queryFn: async () => {
      const { data } = await supabase
        .from("customer_photos")
        .select("id,image_url,caption,user_id,approved,created_at")
        .order("created_at", { ascending: false });
      const ids = Array.from(new Set((data ?? []).map((r) => r.user_id)));
      const { data: profs } = ids.length
        ? await supabase.from("profiles").select("id,username").in("id", ids)
        : { data: [] };
      const m = new Map((profs ?? []).map((p) => [p.id, p.username]));
      return (data ?? []).map((p) => ({ ...p, username: m.get(p.user_id) ?? "عميل" }));
    },
  });

  const approved = (photos ?? []).filter((p) => p.approved);
  const mine = (photos ?? []).filter((p) => p.user_id === user?.id);

  const upload = async (file: File) => {
    if (!user) return toast.error("سجّل دخول الأول");
    if (!consent) return toast.error("لازم توافق على نشر الصورة");
    if (file.size > 5 * 1024 * 1024) return toast.error("الصورة أكبر من 5MB");
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("customer-photos")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("customer-photos").getPublicUrl(path);
      const { error: insErr } = await supabase.from("customer_photos").insert({
        user_id: user.id,
        image_url: pub.publicUrl,
        caption: caption.trim() || null,
        consent: true,
        approved: false,
      });
      if (insErr) throw insErr;
      toast.success("شكراً! الصورة هتظهر بعد الموافقة من الإدارة");
      setCaption("");
      qc.invalidateQueries({ queryKey: ["customer-photos-all"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "حصل خطأ");
    } finally {
      setBusy(false);
    }
  };

  const removeMine = async (id: string, image_url: string) => {
    await supabase.from("customer_photos").delete().eq("id", id);
    const path = image_url.split("/customer-photos/")[1];
    if (path) await supabase.storage.from("customer-photos").remove([path]);
    qc.invalidateQueries({ queryKey: ["customer-photos-all"] });
    toast.success("تم الحذف");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="font-display text-4xl md:text-5xl font-bold">
          زبايننا بيلبسوا <span className="text-gold-gradient">هدمة</span>
        </h1>
        <p className="text-muted-foreground mt-2">صور حقيقية من عملائنا — انضم لـ +500 زبون في التل الكبير 🇪🇬</p>
      </div>

      {/* Upload */}
      <div className="rounded-2xl border bg-card p-6 mb-10 max-w-2xl mx-auto">
        <h2 className="font-bold mb-3">شاركنا صورتك</h2>
        {!user ? (
          <p className="text-sm text-muted-foreground">
            <Link to="/auth" className="text-gold-gradient font-bold hover:underline">سجّل دخول</Link>
            {" "}عشان ترفع صورة.
          </p>
        ) : (
          <div className="space-y-3">
            <Input value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="تعليق قصير (اختياري) — مثلاً: تيشيرت كلاسيك، مقاسي تمام" maxLength={120} />
            <label className="flex items-start gap-2 text-sm cursor-pointer">
              <Checkbox checked={consent} onCheckedChange={(v) => setConsent(!!v)} className="mt-0.5" />
              <span className="text-muted-foreground">
                أوافق إن صورتي تتخزن في موقع Hedma وتظهر للزوار في قسم "زبايننا بيلبسوا هدمة". أعرف إن الإدارة لازم توافق على الصورة قبل ما تظهر، وأقدر أحذفها في أي وقت.
              </span>
            </label>
            <Button
              onClick={() => fileRef.current?.click()}
              disabled={busy || !consent}
              className="gradient-gold text-primary"
            >
              <Upload className="size-4 ml-2" /> {busy ? "جاري الرفع..." : "ارفع صورتك"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f);
                e.target.value = "";
              }}
            />
          </div>
        )}
      </div>

      {/* My photos status */}
      {user && mine.length > 0 && (
        <div className="mb-10">
          <h3 className="font-bold mb-3">صوري</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {mine.map((p) => (
              <div key={p.id} className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-muted">
                <img src={p.image_url} alt="" className="size-full object-cover" />
                <div className="absolute top-2 right-2 px-2 py-1 rounded-md text-xs font-bold bg-card/90 backdrop-blur flex items-center gap-1">
                  {p.approved ? (
                    <><CheckCircle2 className="size-3 text-green-600" /> ظاهرة</>
                  ) : (
                    <><Clock className="size-3 text-yellow-600" /> بانتظار الموافقة</>
                  )}
                </div>
                <button onClick={() => removeMine(p.id, p.image_url)} className="absolute top-2 left-2 size-8 grid place-items-center rounded-full bg-card/90 backdrop-blur text-destructive">
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Approved gallery */}
      <div>
        <h3 className="font-bold mb-3">معرض الزبائن</h3>
        {approved.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">لسه مفيش صور — كن أول واحد 🎉</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {approved.map((p) => (
              <div key={p.id} className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-muted group">
                <img src={p.image_url} alt={p.caption ?? p.username} loading="lazy" className="size-full object-cover group-hover:scale-105 transition duration-700" />
                <div className="absolute bottom-0 right-0 left-0 p-3 bg-gradient-to-t from-black/80 to-transparent text-white">
                  <div className="text-sm font-bold">{p.username}</div>
                  {p.caption && <div className="text-xs line-clamp-2">{p.caption}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
