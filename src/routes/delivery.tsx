import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ORDER_STATUS_AR } from "@/lib/settings";
import { formatEGP } from "@/lib/format";
import { toast } from "sonner";
import { Truck, MapPin, Phone } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/delivery")({ component: DeliveryPanel });

function DeliveryPanel() {
  const { user, isDelivery, loading } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();
  useEffect(() => { if (!loading && (!user || !isDelivery)) nav({ to: "/auth" }); }, [loading, user, isDelivery, nav]);

  const { data: orders } = useQuery({
    queryKey: ["delivery-orders", user?.id], enabled: !!user && isDelivery,
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*")
        .eq("delivery_agent_id", user!.id)
        .in("status", ["assigned", "in_transit"])
        .order("created_at");
      return data ?? [];
    },
    refetchInterval: 15_000,
  });

  const update = async (id: string, patch: any) => {
    const { error } = await supabase.from("orders").update(patch).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("تم التحديث"); qc.invalidateQueries({ queryKey: ["delivery-orders"] }); }
  };

  if (loading || !isDelivery) return <div className="p-10 text-center">...</div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-3xl font-bold mb-1 flex items-center gap-2"><Truck className="size-7" /> طلباتي للتوصيل</h1>
      <p className="text-muted-foreground mb-6">دي الطلبات اللي المدير عيّنها ليك</p>

      {(orders ?? []).length === 0 ? (
        <div className="rounded-2xl border bg-card p-12 text-center text-muted-foreground">لا توجد طلبات حالياً</div>
      ) : (
        <div className="space-y-4">
          {(orders ?? []).map((o) => <DeliveryOrderCard key={o.id} order={o} onUpdate={update} />)}
        </div>
      )}
    </div>
  );
}

function DeliveryOrderCard({ order, onUpdate }: { order: any; onUpdate: (id: string, patch: any) => void }) {
  const [note, setNote] = useState(order.tracking_note ?? "");
  const items = (order.items as any[]) ?? [];
  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="font-mono text-xs text-muted-foreground">#{order.id.slice(0,8)}</div>
          <div className="font-bold text-lg">{order.customer_name ?? "عميل"}</div>
        </div>
        <span className="px-3 py-1 rounded-full bg-accent text-xs font-bold">{ORDER_STATUS_AR[order.status]}</span>
      </div>
      <div className="grid md:grid-cols-2 gap-3 text-sm mb-3">
        {order.customer_phone && (
          <a href={`tel:${order.customer_phone}`} className="flex items-center gap-2 hover:text-gold-gradient"><Phone className="size-4" /> {order.customer_phone}</a>
        )}
        {order.customer_address && (
          <div className="flex items-center gap-2"><MapPin className="size-4" /> {order.customer_address}</div>
        )}
      </div>
      <ul className="text-sm space-y-1 border-t pt-3 mb-3">
        {items.map((i: any, idx: number) => (
          <li key={idx} className="flex justify-between"><span>{i.name} × {i.qty}</span><span>{formatEGP(i.price * i.qty)}</span></li>
        ))}
        <li className="flex justify-between font-bold pt-2 border-t"><span>المطلوب تحصيله</span><span>{formatEGP(Number(order.total) - Number(order.discount))}</span></li>
      </ul>
      <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="ملاحظة للعميل (اختياري)" className="mb-3" />
      <div className="flex flex-wrap gap-2">
        <Select value={order.status} onValueChange={(v) => onUpdate(order.id, { status: v, tracking_note: note })}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="assigned">{ORDER_STATUS_AR.assigned}</SelectItem>
            <SelectItem value="in_transit">{ORDER_STATUS_AR.in_transit}</SelectItem>
            <SelectItem value="delivered">{ORDER_STATUS_AR.delivered}</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => onUpdate(order.id, { tracking_note: note })}>حفظ الملاحظة</Button>
      </div>
    </div>
  );
}
