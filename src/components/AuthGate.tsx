import { useAuth } from "@/lib/auth";
import { Link } from "@tanstack/react-router";
import { Lock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AuthGate() {
  const { session, loading } = useAuth();

  if (loading || session) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background/60 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-500">
      <div className="bg-card border-2 border-gold-gradient/20 rounded-[2.5rem] p-8 md:p-12 max-w-lg w-full text-center shadow-2xl shadow-gold-gradient/10 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute -top-24 -right-24 size-48 bg-gold-gradient/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 size-48 bg-gold-gradient/10 rounded-full blur-3xl" />
        
        <div className="size-20 rounded-3xl bg-gold-gradient/10 grid place-items-center mx-auto mb-8 relative">
           <div className="absolute inset-0 rounded-3xl border border-gold-gradient/20 animate-ping opacity-20" />
           <Lock className="size-10 text-gold-gradient" />
        </div>

        <h2 className="font-display text-3xl md:text-4xl font-black mb-4">انضم لعالم هدمة</h2>
        <p className="text-muted-foreground mb-10 leading-relaxed">
          عشان تقدر تشوف المنتجات الحصرية وتجرّب اللبس بالذكاء الاصطناعي وتعمل أوردر، لازم تسجل دخولك الأول.
        </p>

        <div className="flex flex-col gap-4">
          <Button asChild size="lg" className="gradient-gold text-primary font-black text-lg h-14 rounded-2xl shadow-lg shadow-gold-gradient/20">
            <Link to="/auth">تسجيل الدخول / حساب جديد</Link>
          </Button>
          <Button asChild variant="ghost" className="h-12 rounded-2xl font-bold">
            <Link to="/our-story">اعرف أكتر عننا <ArrowLeft className="size-4 mr-2" /></Link>
          </Button>
        </div>

        <p className="mt-8 text-[10px] text-muted-foreground font-bold tracking-widest uppercase">Hedma Platform • Egypt</p>
      </div>
    </div>
  );
}
