import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ORDER_STATUS_AR } from "@/lib/settings";
import { formatEGP } from "@/lib/format";

export const Route = createFileRoute("/my-orders")({ component: MyOrders });

function MyOrders() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  useEffect(() => { if (!loading && !user) nav({ to: "/auth" }); }, [loading, user, nav]);

  const { data: orders } = useQuery({
    queryKey: ["my-orders", user?.id], enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").eq("customer_id", user!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold mb-6">طلباتي</h1>
      {(orders ?? []).length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center text-muted-foreground">ماعندكش طلبات لسه</div>
      ) : (
        <div className="space-y-3">
          {(orders ?? []).map((o) => (
            <Link key={o.id} to="/track/$id" params={{ id: o.id }} className="block rounded-2xl border bg-card p-4 hover:shadow-luxe transition">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-xs text-muted-foreground">#{o.id.slice(0,8)}</div>
                  <div className="font-bold">{((o.items as any[]) ?? []).length} منتج • {formatEGP(Number(o.total) - Number(o.discount))}</div>
                  <div className="text-xs text-muted-foreground mt-1">{new Date(o.created_at).toLocaleString("ar-EG")}</div>
                </div>
                <span className="px-3 py-1 rounded-full bg-accent text-xs font-bold">{ORDER_STATUS_AR[o.status]}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
