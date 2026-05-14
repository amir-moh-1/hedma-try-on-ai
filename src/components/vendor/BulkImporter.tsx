import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, X, Save, FileSpreadsheet, Image as ImageIcon } from "lucide-react";
import imageCompression from "browser-image-compression";
import Papa from "papaparse";
import { colorHex } from "@/lib/presets";

type BulkItem = {
  id: string;
  file?: File;
  image_url?: string;
  name: string;
  price: number;
  merchantName: string;
  color: string;
  size: string;
};

export function BulkImporter({ user, merchants, onSuccess }: { user: any, merchants: any[], onSuccess: () => void }) {
  const [items, setItems] = useState<BulkItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Parser: Sanhoury-Blue-XL-300.jpg -> Merchant-Color-Size-Price.jpg
  const parseFilename = (filename: string) => {
    const nameWithoutExt = filename.split(".").slice(0, -1).join(".");
    const parts = nameWithoutExt.split("-");
    
    let merchantName = "", color = "", size = "", price = 0, name = "منتج جديد";

    if (parts.length >= 4) {
      merchantName = parts[0];
      color = parts[1];
      size = parts[2];
      price = parseInt(parts[3]) || 0;
      name = `${merchantName} ${color}`;
    } else {
      name = nameWithoutExt;
    }

    return { name, merchantName, color, size, price };
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newItems: BulkItem[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const parsed = parseFilename(file.name);
      
      // Compress image
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
      };
      
      try {
        const compressedFile = await imageCompression(file, options);
        newItems.push({
          id: Math.random().toString(36).substring(7),
          file: compressedFile,
          image_url: URL.createObjectURL(compressedFile),
          ...parsed
        });
      } catch (error) {
        console.error("Compression error:", error);
        // Fallback to original
        newItems.push({
          id: Math.random().toString(36).substring(7),
          file,
          image_url: URL.createObjectURL(file),
          ...parsed
        });
      }
    }

    setItems((prev) => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCSVSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedItems: BulkItem[] = results.data.map((row: any) => ({
          id: Math.random().toString(36).substring(7),
          name: row.name || row.Name || "منتج",
          price: parseInt(row.price || row.Price || "0"),
          merchantName: row.merchant || row.Merchant || "",
          color: row.color || row.Color || "",
          size: row.size || row.Size || "",
          image_url: row.image_url || row.image || "",
        }));
        setItems((prev) => [...prev, ...parsedItems]);
        toast.success(`تم استيراد ${parsedItems.length} منتج`);
      },
      error: (error) => {
        toast.error("خطأ في قراءة الملف: " + error.message);
      }
    });
    if (csvInputRef.current) csvInputRef.current.value = "";
  };

  const updateItem = (id: string, field: keyof BulkItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  const saveAll = async () => {
    if (items.length === 0) return;
    setUploading(true);
    let successCount = 0;

    for (const item of items) {
      if (!item.name || !item.price) continue;

      let finalImageUrl = item.image_url;

      // Upload file if it exists
      if (item.file) {
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${item.file.name}`;
        const { error: uploadError } = await supabase.storage.from("hedma").upload(path, item.file, { upsert: false });
        if (!uploadError) {
          const { data } = supabase.storage.from("hedma").getPublicUrl(path);
          finalImageUrl = data.publicUrl;
        }
      }

      // Find merchant ID
      let merchant_id = null;
      if (item.merchantName) {
        const m = merchants.find(m => m.shop_name.includes(item.merchantName) || item.merchantName.includes(m.shop_name));
        if (m) merchant_id = m.id;
      }

      const sizes = item.size ? item.size.split(",").map(s => s.trim()).filter(Boolean) : [];
      const colors = item.color ? item.color.split(",").map(s => s.trim()).filter(Boolean) : [];
      
      const payload = {
        vendor_id: user.id,
        merchant_id,
        name: item.name,
        price: Number(item.price),
        category: "tshirts", // Default category
        sizes,
        colors,
        stock: 10, // Default stock
        image_url: finalImageUrl || null,
        active: true,
        variants: item.color && finalImageUrl ? [{ image_url: finalImageUrl, color: colors[0] }] : []
      };

      const { error } = await supabase.from("products").insert(payload as any);
      if (!error) successCount++;
    }

    setUploading(false);
    if (successCount > 0) {
      toast.success(`تم حفظ ${successCount} منتج بنجاح`);
      setItems([]);
      onSuccess();
    } else {
      toast.error("لم يتم حفظ أي منتجات. تأكد من إدخال الاسم والسعر.");
    }
  };

  return (
    <div className="rounded-2xl border bg-card p-6 mb-8 shadow-luxe">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <Upload className="size-5" /> الرفع الذكي السريع
        </h2>
        <div className="flex gap-2">
          <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageSelect} />
          <input type="file" accept=".csv" className="hidden" ref={csvInputRef} onChange={handleCSVSelect} />
          <Button variant="outline" size="sm" onClick={() => csvInputRef.current?.click()}>
            <FileSpreadsheet className="size-4 ml-1" /> رفع CSV
          </Button>
          <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <ImageIcon className="size-4 ml-1" /> اختيار صور
          </Button>
        </div>
      </div>

      {items.length > 0 ? (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-lg border bg-background">
            <table className="w-full text-sm text-right">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2 w-16">الصورة</th>
                  <th className="p-2">الاسم</th>
                  <th className="p-2 w-24">السعر</th>
                  <th className="p-2 w-32">المحل</th>
                  <th className="p-2 w-24">اللون</th>
                  <th className="p-2 w-24">المقاس</th>
                  <th className="p-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-t">
                    <td className="p-2">
                      {item.image_url && <img src={item.image_url} className="size-10 rounded object-cover" alt="" />}
                    </td>
                    <td className="p-2"><Input value={item.name} onChange={(e) => updateItem(item.id, "name", e.target.value)} className="h-8" /></td>
                    <td className="p-2"><Input type="number" value={item.price} onChange={(e) => updateItem(item.id, "price", e.target.value)} className="h-8" /></td>
                    <td className="p-2"><Input value={item.merchantName} onChange={(e) => updateItem(item.id, "merchantName", e.target.value)} className="h-8" /></td>
                    <td className="p-2"><Input value={item.color} onChange={(e) => updateItem(item.id, "color", e.target.value)} className="h-8" /></td>
                    <td className="p-2"><Input value={item.size} onChange={(e) => updateItem(item.id, "size", e.target.value)} className="h-8" /></td>
                    <td className="p-2"><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeItem(item.id)}><X className="size-4" /></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end">
            <Button onClick={saveAll} disabled={uploading} className="gradient-gold text-primary w-full md:w-auto">
              <Save className="size-4 ml-2" />
              {uploading ? "جاري الرفع والحفظ..." : `حفظ ${items.length} منتج نهائياً`}
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed rounded-xl p-10 text-center bg-muted/30">
          <Upload className="size-10 mx-auto text-muted-foreground mb-3 opacity-50" />
          <p className="text-muted-foreground font-medium mb-1">اسحب الصور أو ملف CSV هنا</p>
          <p className="text-xs text-muted-foreground">صيغة التسمية المدعومة: Merchant-Color-Size-Price.jpg</p>
        </div>
      )}
    </div>
  );
}
