import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PresetKey = "sizes" | "colors" | "categories";

export function usePreset(key: PresetKey) {
  return useQuery({
    queryKey: ["preset", key],
    queryFn: async () => {
      const { data } = await supabase.from("input_presets").select("values").eq("id", key).maybeSingle();
      return ((data?.values as string[]) ?? []) as string[];
    },
    staleTime: 60_000,
  });
}

export const COLOR_HEX: Record<string, string> = {
  أسود: "#000000", ابيض: "#ffffff", أبيض: "#ffffff",
  أحمر: "#dc2626", احمر: "#dc2626",
  أزرق: "#2563eb", ازرق: "#2563eb",
  أخضر: "#16a34a", اخضر: "#16a34a",
  أصفر: "#facc15", بني: "#92400e",
  رمادي: "#6b7280", بيج: "#d4b896",
  وردي: "#ec4899", بنفسجي: "#7c3aed", كحلي: "#1e3a8a",
};
export const colorHex = (c: string) => COLOR_HEX[c.trim()] ?? "#94a3b8";

export type Variant = { image_url: string; color: string };
