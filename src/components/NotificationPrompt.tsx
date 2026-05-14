import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, X } from "lucide-react";
import { toast } from "sonner";

export function NotificationPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Check if we already asked
    const asked = localStorage.getItem("hedma_notifications_asked");
    const subscribed = localStorage.getItem("hedma_notifications_subscribed");
    
    if (!asked && !subscribed) {
      // Delay showing the prompt so it's not immediately aggressive
      const timer = setTimeout(() => {
        setVisible(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    // In a real app with a backend, we would request Notification.requestPermission()
    // and subscribe to a Web Push server here.
    if ("Notification" in window) {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          toast.success("تم تفعيل الإشعارات! هنبلغك بأحدث العروض ✨");
          localStorage.setItem("hedma_notifications_subscribed", "true");
        } else {
          toast.info("تم رفض الإشعارات.");
        }
      });
    } else {
      // Fallback for browsers that don't support it
      toast.success("تم تفعيل الإشعارات! هنبلغك بأحدث العروض ✨");
      localStorage.setItem("hedma_notifications_subscribed", "true");
    }
    
    localStorage.setItem("hedma_notifications_asked", "true");
    setVisible(false);
  };

  const handleDismiss = () => {
    localStorage.setItem("hedma_notifications_asked", "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-5 fade-in duration-500 w-full max-w-md px-4" dir="rtl">
      <div className="rounded-2xl border bg-card p-4 shadow-luxe relative">
        <button 
          onClick={handleDismiss}
          className="absolute top-2 left-2 size-6 grid place-items-center rounded-full text-muted-foreground hover:bg-muted"
        >
          <X className="size-4" />
        </button>
        
        <div className="flex gap-4 items-start">
          <div className="size-10 rounded-full bg-primary/10 grid place-items-center text-primary shrink-0">
            <Bell className="size-5" />
          </div>
          <div>
            <h3 className="font-bold mb-1">عايز تعرف عروضنا أول بأول؟</h3>
            <p className="text-sm text-muted-foreground mb-3">
              فعل الإشعارات عشان يوصلك كل جديد وخصومات حصرية قبل أي حد.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleAccept} size="sm" className="gradient-gold text-primary">
                تفعيل الإشعارات
              </Button>
              <Button onClick={handleDismiss} size="sm" variant="ghost">
                ليس الآن
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
