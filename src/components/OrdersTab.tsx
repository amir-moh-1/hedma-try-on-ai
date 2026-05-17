import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { formatEGP } from "@/lib/format";
import { FileText, Truck } from "lucide-react";
import { ORDER_STATUS_AR } from "@/lib/settings";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useSiteSettings } from "@/lib/settings";

export function OrdersTab({ profiles }: { profiles: { id: string; username: string; roles: string[] }[] }) {
  const qc = useQueryClient();
  const { logo_url, slogan } = useSiteSettings();
  const { data: orders } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
      return data ?? [];
    },
    refetchInterval: 15_000,
  });
  
  const agents = profiles.filter((p) => p.roles.includes("delivery") || p.roles.includes("admin"));
  
  const update = async (id: string, patch: any, oldStatus: string, items: any[]) => {
    if (patch.status && (patch.status === "in_transit" || patch.status === "delivered") && 
        (oldStatus === "pending" || oldStatus === "approved" || oldStatus === "assigned")) {
      for (const item of items) {
        const { data: p } = await supabase.from("products").select("stock").eq("id", item.id).single();
        if (p && p.stock >= item.qty) {
          await supabase.from("products").update({ stock: p.stock - item.qty }).eq("id", item.id);
        }
      }
      toast.info("تم خصم الكميات من المخزون بنجاح");
    }
  
    const { error } = await supabase.from("orders").update(patch).eq("id", id);
    if (error) toast.error(error.message); else {
      const { data: u } = await supabase.auth.getUser();
      if (u.user) await supabase.from("activity_logs").insert({ user_id: u.user.id, action: "admin_order_update", details: { order_id: id, ...patch } as never });
      toast.success("تم تحديث الطلب");
      qc.invalidateQueries({ queryKey: ["admin-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-products"] });
    }
  };

  const generateInvoice = async (order: any) => {
    toast.info("جاري تحضير الفاتورة...");
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.top = "-9999px";
    container.style.left = "-9999px";
    container.style.width = "800px";
    container.style.backgroundColor = "white";
    container.style.padding = "40px";
    container.style.direction = "rtl";
    container.style.fontFamily = "Cairo, system-ui, sans-serif";
    container.style.color = "black";
    
    const itemsHTML = ((order.items as any[]) ?? []).map(i => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px;">${i.name}</td>
        <td style="padding: 12px;">${i.size || "-"}</td>
        <td style="padding: 12px;">${i.color || "-"}</td>
        <td style="padding: 12px; font-weight: bold;">${i.qty}</td>
        <td style="padding: 12px;" dir="ltr">${formatEGP(i.price)}</td>
        <td style="padding: 12px;" dir="ltr">${formatEGP(i.price * i.qty)}</td>
      </tr>
    `).join("");

    container.innerHTML = `
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800&display=swap" rel="stylesheet">
      <div style="border: 2px solid #f3f4f6; padding: 30px; border-radius: 16px; font-family: 'Cairo', sans-serif;">
        <div style="text-align: center; margin-bottom: 20px;">
          ${logo_url ? '<img src="' + logo_url + '" style="height: 60px; object-fit: contain; margin-bottom: 5px;" alt="Logo" />' : '<h1 style="color: #b8860b; font-size: 32px; margin-bottom: 5px; font-weight: 800;">HEDMA | هدمة</h1>'}
          <p style="color: #666; margin: 5px 0 0 0; font-size: 14px;">${slogan || "أناقتك تبدأ من هنا"}</p>
        </div>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 30px; border-bottom: 2px solid #f3f4f6; padding-bottom: 20px;">
          <div>
            <p style="margin: 5px 0;"><strong>رقم الطلب:</strong> <span dir="ltr">#${order.id.slice(0, 8)}</span></p>
            <p style="margin: 5px 0;"><strong>التاريخ:</strong> <span dir="ltr">${new Date(order.created_at).toLocaleString("ar-EG")}</span></p>
          </div>
          <div style="text-align: left;">
            <p style="margin: 5px 0;"><strong>العميل:</strong> ${order.customer_name || "-"}</p>
            <p style="margin: 5px 0;"><strong>الهاتف:</strong> <span dir="ltr">${order.customer_phone || "-"}</span></p>
            <p style="margin: 5px 0;"><strong>العنوان:</strong> ${order.customer_address || "-"}</p>
          </div>
        </div>
        
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; text-align: right;">
          <thead style="background-color: #f9fafb; border-bottom: 2px solid #e5e7eb;">
            <tr>
              <th style="padding: 12px;">المنتج</th>
              <th style="padding: 12px;">المقاس</th>
              <th style="padding: 12px;">اللون</th>
              <th style="padding: 12px;">الكمية</th>
              <th style="padding: 12px;">السعر</th>
              <th style="padding: 12px;">الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHTML}
          </tbody>
        </table>
        
        <div style="text-align: left; font-size: 18px; background-color: #f9fafb; padding: 20px; border-radius: 12px; display: inline-block; float: left; min-width: 250px;">
          ${order.discount > 0 ? `<div style="display: flex; justify-content: space-between; margin-bottom: 10px;"><span>الخصم:</span> <span dir="ltr" style="color: #ef4444;">-${formatEGP(order.discount)}</span></div>` : ""}
          <div style="display: flex; justify-content: space-between; border-top: 1px solid #e5e7eb; padding-top: 10px; font-size: 24px; color: #b8860b; font-weight: bold;">
            <span>الإجمالي النهائي:</span> <span dir="ltr">${formatEGP(order.total - (order.discount || 0))}</span>
          </div>
        </div>
        <div style="clear: both;"></div>
        
        <div style="text-align: center; margin-top: 50px; color: #9ca3af; font-size: 14px;">
          <p>شكراً لتسوقك من هدمة! نتمنى أن تنال منتجاتنا إعجابك.</p>
        </div>
      </div>
    `;

    document.body.appendChild(container);
    
    try {
      const canvas = await html2canvas(container, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL("image/jpeg", 1.0);
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`invoice_hedma_${order.id.slice(0, 8)}.pdf`);
      toast.success("تم تحميل الفاتورة بنجاح");
    } catch (err) {
      toast.error("حدث خطأ أثناء توليد الفاتورة");
    } finally {
      document.body.removeChild(container);
    }
  };

  return (
    <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
      {(orders ?? []).map((o: any) => {
        const items = (o.items as any[]) ?? [];
        return (
          <div key={o.id} className="rounded-2xl border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between flex-wrap gap-4 mb-4">
              <div>
                <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest mb-1">#{o.id.slice(0,8)}</div>
                <div className="font-bold text-lg">{o.customer_name ?? "—"}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                   <span dir="ltr">{o.customer_phone ?? "—"}</span>
                   <span className="opacity-30">|</span>
                   <span>{new Date(o.created_at).toLocaleString("ar-EG")}</span>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <div className="font-display font-black text-2xl text-gold-gradient">{formatEGP(Number(o.total) - Number(o.discount))}</div>
                <span className="text-[10px] px-3 py-1 rounded-full bg-accent font-black uppercase tracking-tighter border border-gold-gradient/10">
                  {ORDER_STATUS_AR[o.status as keyof typeof ORDER_STATUS_AR] || o.status}
                </span>
              </div>
            </div>

            {o.customer_address && <div className="text-sm text-muted-foreground mb-4 p-3 bg-muted/20 rounded-xl border border-dashed border-gold-gradient/10">📍 {o.customer_address}</div>}
            
            <div className="space-y-2 mb-6">
              {items.map((i: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-sm p-2 rounded-lg hover:bg-muted/30">
                  <span className="font-semibold">{i.name}</span>
                  <span className="text-muted-foreground font-bold">× {i.qty}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 items-center pt-4 border-t border-muted">
              <Select value={o.status} onValueChange={(v) => update(o.id, { status: v }, o.status, items)}>
                <SelectTrigger className="w-[180px] h-10 rounded-xl bg-muted/50 border-none"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  {Object.entries(ORDER_STATUS_AR).map(([k,v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
              
              <Select value={o.delivery_agent_id ?? "none"} onValueChange={(v) => update(o.id, { delivery_agent_id: v === "none" ? null : v, status: v === "none" ? o.status : "assigned" }, o.status, items)}>
                <SelectTrigger className="w-[220px] h-10 rounded-xl bg-muted/50 border-none"><Truck className="size-4 ml-2 text-gold-gradient" /><SelectValue placeholder="مندوب التوصيل" /></SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="none">— بدون مندوب —</SelectItem>
                  {agents.map((a) => <SelectItem key={a.id} value={a.id}>{a.username}</SelectItem>)}
                </SelectContent>
              </Select>

              <Button size="sm" variant="outline" onClick={() => generateInvoice(o)} className="h-10 px-4 rounded-xl border-gold-gradient/20 hover:bg-gold-gradient/10 ml-auto">
                <FileText className="size-4 ml-2 text-gold-gradient" /> تحميل الفاتورة (PDF)
              </Button>
            </div>
          </div>
        );
      })}
      {(orders ?? []).length === 0 && <div className="p-20 text-center text-muted-foreground border-2 border-dashed rounded-3xl">لا توجد طلبيات حالياً</div>}
    </div>
  );
}
