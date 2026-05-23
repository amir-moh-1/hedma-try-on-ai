import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatEGP } from "@/lib/format";
import { toast } from "sonner";
import { FileText, Calendar, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useSiteSettings } from "@/lib/settings";

export function InventoryReportsTab() {
  const { logo_url, slogan } = useSiteSettings();
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [exporting, setExporting] = useState(false);

  // Fetch all vendors
  const { data: vendors } = useQuery({
    queryKey: ["admin-vendors-reports"],
    queryFn: async () => {
      const { data: roles } = await supabase.from("user_roles").select("user_id").in("role", ["vendor", "admin"]);
      const uids = Array.from(new Set((roles ?? []).map(r => r.user_id)));
      if (uids.length === 0) return [];
      const { data: profiles } = await supabase.from("profiles").select("id, username, full_name").in("id", uids);
      return profiles ?? [];
    }
  });

  const selectedVendors = vendors?.filter(v => selectedVendorIds.includes(v.id)) ?? [];

  // Fetch products with optional date filter
  const { data: products } = useQuery({
    queryKey: ["admin-vendor-inventory", selectedVendorIds, fromDate, toDate],
    enabled: selectedVendorIds.length > 0,
    queryFn: async () => {
      let query = supabase.from("products").select("*").in("vendor_id", selectedVendorIds);
      
      if (fromDate) {
        query = query.gte("created_at", new Date(fromDate).toISOString());
      }
      if (toDate) {
        // End of the day
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        query = query.lte("created_at", end.toISOString());
      }

      const { data } = await query.order("created_at", { ascending: false });
      return data ?? [];
    }
  });

  const handleExportPDF = async () => {
    if (selectedVendorIds.length === 0) {
      return toast.error("برجاء اختيار تاجر واحد على الأقل");
    }

    setExporting(true);
    toast.info("جاري إعداد تقرير الجرد... ⏳");

    const vendorName = selectedVendors.map(v => v.full_name || v.username).join("، ");
    const exportDateStr = new Date().toLocaleDateString("ar-EG");
    const totalInventoryValue = (products ?? []).reduce((acc, p) => acc + (p.price * (p.stock || 0)), 0);

    const itemsHTML = (products ?? []).map(p => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px; font-weight: bold;">${p.name}</td>
        <td style="padding: 12px; text-align: center;">${p.stock || 0}</td>
        <td style="padding: 12px; text-align: left;" dir="ltr">${formatEGP(p.price)}</td>
        <td style="padding: 12px; text-align: left;" dir="ltr">${formatEGP(p.price * (p.stock || 0))}</td>
        <td style="padding: 12px; text-align: center;">
          ${p.stock === 0 ? '<span style="color: #ef4444; font-weight: bold;">نفد ❌</span>' : '<span style="color: #10b981; font-weight: bold;">متوفر 🟢</span>'}
        </td>
      </tr>
    `).join("");

    const dateRangeText = fromDate && toDate 
      ? `الفترة من ${new Date(fromDate).toLocaleDateString("ar-EG")} إلى ${new Date(toDate).toLocaleDateString("ar-EG")}`
      : fromDate 
      ? `من تاريخ ${new Date(fromDate).toLocaleDateString("ar-EG")}`
      : toDate
      ? `حتى تاريخ ${new Date(toDate).toLocaleDateString("ar-EG")}`
      : "جميع الفترات الزمنية";

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

    container.innerHTML = `
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;800&display=swap" rel="stylesheet">
      <div style="border: 2px solid #D4A017; padding: 40px; border-radius: 24px; font-family: 'Cairo', sans-serif; background-color: #F5F0E8;">
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #D4A017; padding-bottom: 20px; margin-bottom: 30px;">
          <div>
            ${logo_url ? '<img src="' + logo_url + '" style="height: 60px; object-fit: contain; margin-bottom: 5px;" alt="Logo" />' : '<h1 style="color: #1A1A1A; font-size: 36px; margin: 0; font-weight: 800; tracking-tight: -1px;">HEDMA | هدمة</h1>'}
            <p style="color: #D4A017; margin: 5px 0 0 0; font-weight: 700; font-size: 16px;">${slogan || "أناقتك بلمسة ذكاء اصطناعي ✨"}</p>
          </div>
          <div style="text-align: left;">
            <h2 style="color: #1A1A1A; margin: 0; font-size: 20px; font-weight: 700;">تقرير الجرد والمخازن</h2>
            <p style="color: #666; margin: 5px 0 0 0; font-size: 12px;">تاريخ التصدير: ${exportDateStr}</p>
          </div>
        </div>

        <!-- Meta Info -->
        <div style="background-color: white; border: 1px solid #e5e7eb; padding: 20px; border-radius: 16px; margin-bottom: 30px; display: flex; justify-content: space-between;">
          <div>
            <p style="margin: 5px 0; font-size: 14px;"><strong>اسم التاجر:</strong> <span style="color: #D4A017; font-weight: bold;">${vendorName}</span></p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>حالة التقرير:</strong> معتمد ومحدث</p>
          </div>
          <div style="text-align: left;">
            <p style="margin: 5px 0; font-size: 14px;"><strong>النطاق الزمني:</strong> ${dateRangeText}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>إجمالي الموديلات:</strong> ${products?.length ?? 0} موديل</p>
          </div>
        </div>

        <!-- Table -->
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; text-align: right; background-color: white; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
          <thead style="background-color: #1A1A1A; color: white;">
            <tr>
              <th style="padding: 15px; font-weight: bold;">المنتج</th>
              <th style="padding: 15px; text-align: center; font-weight: bold;">الكمية</th>
              <th style="padding: 15px; text-align: left; font-weight: bold;">السعر الفردي</th>
              <th style="padding: 15px; text-align: left; font-weight: bold;">إجمالي القيمة</th>
              <th style="padding: 15px; text-align: center; font-weight: bold;">الحالة</th>
            </tr>
          </thead>
          <tbody>
            ${products && products.length > 0 ? itemsHTML : '<tr><td colspan="5" style="padding: 30px; text-align: center; color: #666;">لا توجد منتجات مسجلة في هذا النطاق الزمني.</td></tr>'}
          </tbody>
        </table>

        <!-- Summary -->
        <div style="text-align: left; background-color: #1A1A1A; color: white; padding: 25px; border-radius: 20px; display: inline-block; float: left; min-width: 300px; margin-top: 10px; border-right: 5px solid #D4A017;">
          <div style="display: flex; justify-content: space-between; font-size: 22px; font-weight: bold;">
            <span style="color: #F5F0E8; margin-left: 20px;">القيمة الكلية للمخزون:</span>
            <span style="color: #D4A017; font-family: monospace;">${formatEGP(totalInventoryValue)}</span>
          </div>
        </div>
        <div style="clear: both;"></div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 60px; padding-top: 20px; border-top: 2px dashed #D4A017; color: #666; font-size: 13px;">
          <p style="font-weight: bold; color: #1A1A1A; margin-bottom: 5px;">شكراً لتسوقك وتعاملك مع منصة هدمة 🧡</p>
          <p style="margin: 0;">هذا التقرير تم إنشاؤه وتصديره آلياً ومحمي بحقوق الطبع والنشر © هدمة</p>
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
      
      const fileDate = new Date().toISOString().split('T')[0];
      const nameKey = selectedVendors.length === 1 ? selectedVendors[0].username : "multiple";
      pdf.save(`hedma-inventory-${nameKey}-${fileDate}.pdf`);
      toast.success("تم تصدير تقرير المخزون كـ PDF بنجاح! 📄🎉");
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء تصدير التقرير");
    } finally {
      document.body.removeChild(container);
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border bg-card p-6 shadow-sm border-gold-gradient/10">
        <h3 className="font-bold text-xl mb-4 text-gold-gradient flex items-center gap-2">
          <FileText className="size-5" /> الجرد والتقارير الذكية
        </h3>
        <p className="text-xs text-muted-foreground mb-6">احصل على كشوف جرد كاملة ومفصلة وقيمة المخزون الإجمالية لكل تاجر في صيغة PDF احترافية.</p>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-muted-foreground block">التجار المستهدفين (اختر تاجر أو أكثر):</label>
            <div className="flex flex-wrap gap-2 p-3 rounded-xl border border-gold-gradient/20 bg-muted/5 max-h-36 overflow-y-auto">
              <label className="flex items-center gap-2 px-3 py-1.5 rounded-lg border bg-card hover:bg-muted/30 cursor-pointer text-xs select-none">
                <input
                  type="checkbox"
                  checked={selectedVendorIds.length === (vendors ?? []).length && (vendors ?? []).length > 0}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedVendorIds((vendors ?? []).map(v => v.id));
                    } else {
                      setSelectedVendorIds([]);
                    }
                  }}
                  className="accent-[#D4A017] rounded size-4"
                />
                <span className="font-bold">تحديد الكل</span>
              </label>
              {(vendors ?? []).map((v) => {
                const isChecked = selectedVendorIds.includes(v.id);
                return (
                  <label key={v.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer text-xs select-none transition ${isChecked ? 'border-[#D4A017] bg-[#D4A017]/5' : 'bg-card hover:bg-muted/30'}`}>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedVendorIds(prev => [...prev, v.id]);
                        } else {
                          setSelectedVendorIds(prev => prev.filter(id => id !== v.id));
                        }
                      }}
                      className="accent-[#D4A017] rounded size-4"
                    />
                    <span>{v.full_name || v.username}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground block flex items-center gap-1">
                <Calendar className="size-3 text-gold-gradient" /> من تاريخ
              </label>
              <input 
                type="date" 
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full h-10 border rounded-xl px-3 bg-card text-sm focus:outline-none focus:ring-1 focus:ring-gold-gradient/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted-foreground block flex items-center gap-1">
                <Calendar className="size-3 text-gold-gradient" /> إلى تاريخ
              </label>
              <input 
                type="date" 
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full h-10 border rounded-xl px-3 bg-card text-sm focus:outline-none focus:ring-1 focus:ring-gold-gradient/50"
              />
            </div>
          </div>
        </div>

        {selectedVendorIds.length > 0 && (
          <div className="mt-6 flex gap-3">
            <Button
              onClick={handleExportPDF}
              disabled={exporting}
              className="gradient-gold text-primary shadow-luxe rounded-xl font-bold flex items-center gap-2"
            >
              {exporting ? (
                <><Loader2 className="size-4 animate-spin" /> جاري التصدير...</>
              ) : (
                <><FileText className="size-4" /> تصدير PDF</>
              )}
            </Button>
          </div>
        )}
      </div>

      {selectedVendorIds.length > 0 && (
        <div className="rounded-3xl border bg-card overflow-hidden shadow-lg border-gold-gradient/10 animate-in fade-in duration-300">
          <div className="p-5 border-b bg-muted/20 flex items-center justify-between">
            <h3 className="font-bold">معاينة السلع قبل التصدير</h3>
            <span className="text-xs bg-accent/30 px-3 py-1 rounded-full border border-gold-gradient/10 font-bold">
              إجمالي المنتجات المصفاة: {products?.length ?? 0}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-muted/10">
                <tr className="border-b">
                  <th className="p-4">المنتج</th>
                  <th className="p-4">الكمية بالمخزن</th>
                  <th className="p-4">سعر البيع</th>
                  <th className="p-4">القيمة الإجمالية السلعية</th>
                  <th className="p-4">حالة المخزون</th>
                </tr>
              </thead>
              <tbody>
                {(products ?? []).map((p) => {
                  const isOutOfStock = p.stock === 0;
                  return (
                    <tr key={p.id} className="border-t hover:bg-muted/5 transition-colors">
                      <td className="p-4 font-bold">{p.name}</td>
                      <td className="p-4 font-mono font-bold text-lg text-gold-gradient">{p.stock || 0}</td>
                      <td className="p-4 font-mono">{formatEGP(p.price)}</td>
                      <td className="p-4 font-mono font-bold text-green-600">
                        {formatEGP(p.price * (p.stock || 0))}
                      </td>
                      <td className="p-4">
                        {isOutOfStock ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 font-bold">
                            نفد ⚠️
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 font-bold">
                            متوفر
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {(products ?? []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-muted-foreground">
                      لا توجد منتجات مسجلة في هذا النطاق الزمني.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
