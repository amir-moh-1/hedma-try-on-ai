import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export function useWishlistIds() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["wishlist", user?.id ?? "anon"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("wishlist" as any).select("product_id").eq("user_id", user!.id);
      return new Set((data ?? []).map((r: any) => r.product_id as string));
    },
  });
}

export function useWishlistToggle() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return async (productId: string, currentlyIn: boolean) => {
    if (!user) {
      toast.error("سجل دخول الأول عشان تضيف للمفضلة");
      return;
    }
    if (currentlyIn) {
      await supabase.from("wishlist" as any).delete().eq("user_id", user.id).eq("product_id", productId);
      toast.success("تم الحذف من المفضلة");
    } else {
      await supabase.from("wishlist" as any).insert({ user_id: user.id, product_id: productId } as any);
      toast.success("تم الإضافة للمفضلة ❤️");
    }
    qc.invalidateQueries({ queryKey: ["wishlist", user.id] });
  };
}
