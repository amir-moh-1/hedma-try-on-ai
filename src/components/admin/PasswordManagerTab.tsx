import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Eye, EyeOff, Copy, Search, Phone, User, Calendar } from "lucide-react";

export function PasswordManagerTab() {
  const qc = useQueryClient();
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState("");

  const { data: passwords, isLoading } = useQuery({
    queryKey: ["admin-password-manager"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("get-all-passwords");
      if (error) {
        toast.error("فشل جلب كلمات السر");
        throw error;
      }
      return data?.data ?? [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const togglePasswordVisibility = (userId: string) => {
    if (showPasswords[userId]) {
      setShowPasswords(prev => ({ ...prev, [userId]: false }));
    } else {
      setShowPasswords(prev => ({ ...prev, [userId]: true }));
      // Auto-hide after 15 seconds
      setTimeout(() => {
        setShowPasswords(prev => ({ ...prev, [userId]: false }));
      }, 15000);
    }
  };

  const copyToClipboard = (password: string, username: string) => {
    navigator.clipboard.writeText(password);
    toast.success(`تم نسخ كلمة السر لـ ${username}`, { duration: 2000 });
  };

  const sendViaWhatsApp = (phone: string, password: string, username: string) => {
    if (!phone) {
      toast.error("لا يوجد رقم هاتف للمستخدم");
      return;
    }
    const message = `مرحباً ${username}! 👋\n\nإليك كلمة السر الخاصة بك:\n🔐 ${password}\n\nتوصية أمان: غيّر كلمة السر عند أول دخول!\n\n-Hedma Team`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  const filteredPasswords = ((passwords || []) as any[]).filter((p: any) => 
    p.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.phone?.includes(searchTerm) ||
    p.user_id.includes(searchTerm)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin size-8 border-4 border-gold-gradient border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-card border border-gold-gradient/10 rounded-3xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="size-10 rounded-full bg-gold-gradient/10 flex items-center justify-center">
            <span className="text-lg">🔑</span>
          </div>
          <div>
            <h2 className="font-bold text-xl">مدير كلمات المرور</h2>
            <p className="text-[10px] text-muted-foreground">عرض وإدارة كلمات مرور جميع المستخدمين بأمان</p>
          </div>
        </div>
        <div className="relative">
          <Search className="size-4 text-muted-foreground absolute right-3 top-3" />
          <Input
            placeholder="ابحث بالاسم، الهاتف، أو الـ ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-9 h-10 rounded-xl border-gold-gradient/20"
          />
        </div>
      </div>

      {/* Passwords Table */}
      <div className="rounded-3xl border bg-card overflow-hidden shadow-lg border-gold-gradient/10">
        <div className="p-5 border-b bg-muted/20">
          <p className="text-sm font-bold text-gold-gradient">
            {filteredPasswords.length} من {passwords?.length || 0} مستخدم
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-right">
            <thead className="bg-muted/10 border-b">
              <tr>
                <th className="p-4">المستخدم</th>
                <th className="p-4">الهاتف</th>
                <th className="p-4">كلمة المرور</th>
                <th className="p-4">آخر تحديث</th>
                <th className="p-4 text-center">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredPasswords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-12 text-center text-muted-foreground">
                    لا توجد نتائج مطابقة
                  </td>
                </tr>
              ) : (
                filteredPasswords.map((p: any) => (
                  <tr key={p.user_id} className="border-t hover:bg-muted/5 transition-colors">
                    {/* Username */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="size-8 rounded-full bg-gold-gradient/10 flex items-center justify-center">
                          <User className="size-4 text-gold-gradient" />
                        </div>
                        <div>
                          <div className="font-bold">{p.username}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{p.user_id.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="size-3.5" />
                        <span dir="ltr">{p.phone || "—"}</span>
                      </div>
                    </td>

                    {/* Password */}
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs bg-muted/40 px-3 py-2 rounded-lg w-fit">
                          {showPasswords[p.user_id] ? p.encrypted_password : "••••••••"}
                        </span>
                        <button
                          onClick={() => togglePasswordVisibility(p.user_id)}
                          className="text-muted-foreground hover:text-gold-gradient transition"
                          title="إظهار/إخفاء"
                        >
                          {showPasswords[p.user_id] ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Last Updated */}
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-muted-foreground text-[10px]">
                        <Calendar className="size-3.5" />
                        {new Date(p.changed_at).toLocaleString("ar-EG")}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(p.encrypted_password, p.username)}
                          className="text-gold-gradient hover:bg-gold-gradient/10"
                          title="نسخ كلمة المرور"
                        >
                          <Copy className="size-4" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => sendViaWhatsApp(p.phone, p.encrypted_password, p.username)}
                          className="text-green-600 hover:bg-green-50"
                          title="إرسال عبر واتساب"
                        >
                          <span className="text-lg">💬</span>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Note */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <p className="text-[10px] text-amber-900 font-bold">
          ⚠️ تنبيه أمان: هذه الصفحة تعرض كلمات المرور الحساسة. تأكد من:
        </p>
        <ul className="text-[9px] text-amber-800 mt-2 space-y-1 list-disc list-inside">
          <li>عدم مشاركة البيانات مع أحد</li>
          <li>إغلاق المتصفح بعد الانتهاء</li>
          <li>تجنب الشبكات العامة غير الآمنة</li>
        </ul>
      </div>
    </div>
  );
}
