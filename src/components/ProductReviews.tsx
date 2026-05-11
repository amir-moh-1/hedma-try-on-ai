import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { StarRating } from "./StarRating";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { toast } from "sonner";

export function ProductReviews({ productId }: { productId: string }) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const { data: reviews } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_reviews")
        .select("id,user_id,rating,comment,created_at")
        .eq("product_id", productId)
        .order("created_at", { ascending: false });
      const ids = Array.from(new Set((data ?? []).map((r) => r.user_id)));
      const { data: profs } = ids.length
        ? await supabase.from("profiles").select("id,username").in("id", ids)
        : { data: [] };
      const m = new Map((profs ?? []).map((p) => [p.id, p.username]));
      return (data ?? []).map((r) => ({ ...r, username: m.get(r.user_id) ?? "عميل" }));
    },
  });

  const avg = (reviews ?? []).length
    ? reviews!.reduce((s, r) => s + r.rating, 0) / reviews!.length
    : 0;
  const myReview = reviews?.find((r) => r.user_id === user?.id);

  const submit = async () => {
    if (!user) return toast.error("سجّل دخول الأول");
    setBusy(true);
    const { error } = await supabase
      .from("product_reviews")
      .upsert(
        { product_id: productId, user_id: user.id, rating, comment: comment.trim() || null },
        { onConflict: "product_id,user_id" }
      );
    setBusy(false);
    if (error) return toast.error(error.message);
    setComment("");
    toast.success("شكراً لتقييمك ⭐");
    qc.invalidateQueries({ queryKey: ["reviews", productId] });
  };

  return (
    <div className="mt-12 border-t pt-8">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold">تقييمات العملاء</h2>
          <div className="flex items-center gap-2 mt-1">
            <StarRating value={avg} />
            <span className="text-sm text-muted-foreground">
              {avg ? avg.toFixed(1) : "—"} • {reviews?.length ?? 0} تقييم
            </span>
          </div>
        </div>
      </div>

      {user && (
        <div className="rounded-2xl border bg-card p-4 mb-6">
          <div className="text-sm font-semibold mb-2">
            {myReview ? "عدّل تقييمك" : "اكتب تقييمك"}
          </div>
          <StarRating
            value={rating}
            size={28}
            onChange={setRating}
            className="mb-2"
          />
          <Textarea
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="رأيك في المنتج (اختياري)"
            maxLength={400}
          />
          <Button onClick={submit} disabled={busy} className="mt-2 gradient-gold text-primary">
            {busy ? "..." : "اعتمد التقييم"}
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {(reviews ?? []).length === 0 && (
          <div className="text-sm text-muted-foreground">لسه مفيش تقييمات — كن أول واحد.</div>
        )}
        {(reviews ?? []).map((r) => (
          <div key={r.id} className="rounded-xl border bg-card p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="font-semibold">{r.username}</div>
              <StarRating value={r.rating} />
            </div>
            {r.comment && <p className="text-sm text-muted-foreground">{r.comment}</p>}
            <div className="text-xs text-muted-foreground mt-2">
              {new Date(r.created_at).toLocaleDateString("ar-EG")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
