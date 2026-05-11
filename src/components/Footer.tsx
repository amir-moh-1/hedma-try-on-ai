import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { MessageCircle, Instagram, Facebook, MapPin, Mail } from "lucide-react";

const WHATSAPP = "201229344711";

export function Footer() {
  return (
    <footer className="border-t mt-16 bg-card/40">
      <div className="mx-auto max-w-7xl px-4 py-12 grid md:grid-cols-4 gap-8">
        <div>
          <Logo />
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            ماركة هدمة من التل الكبير 🇪🇬. أحدث صيحات الموضة بأسعار صادقة وتجربة لبس بالذكاء الاصطناعي.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="size-3.5" /> التل الكبير، الإسماعيلية
          </div>
        </div>

        <div>
          <h4 className="font-bold mb-3">روابط سريعة</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/" className="hover:text-gold-gradient">الرئيسية</Link></li>
            <li><Link to="/products" className="hover:text-gold-gradient">المنتجات</Link></li>
            <li><Link to="/try-on" className="hover:text-gold-gradient">جرّب بالـ AI</Link></li>
            <li><Link to="/customers" className="hover:text-gold-gradient">زبايننا</Link></li>
            <li><Link to="/our-story" className="hover:text-gold-gradient">قصتنا</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-3">الدعم</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-gold-gradient">
                <MessageCircle className="size-4 text-[#25D366]" /> واتساب الدعم
              </a>
            </li>
            <li className="flex items-center gap-2 text-muted-foreground">
              <Mail className="size-4" /> hedma.tk@gmail.com
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-3">تابعنا</h4>
          <div className="flex gap-3">
            <a href="#" aria-label="Instagram" className="size-10 grid place-items-center rounded-full border hover:gradient-gold hover:text-primary transition">
              <Instagram className="size-5" />
            </a>
            <a href="#" aria-label="Facebook" className="size-10 grid place-items-center rounded-full border hover:gradient-gold hover:text-primary transition">
              <Facebook className="size-5" />
            </a>
            <a href={`https://wa.me/${WHATSAPP}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
              className="size-10 grid place-items-center rounded-full border hover:bg-[#25D366] hover:text-white transition">
              <MessageCircle className="size-5" />
            </a>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            انضم لأكتر من <span className="font-bold text-gold-gradient">+500 زبون</span> في التل الكبير
          </p>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Hedma هدمة — جميع الحقوق محفوظة
      </div>
    </footer>
  );
}
