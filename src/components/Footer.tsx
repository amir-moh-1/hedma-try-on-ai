import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { MessageCircle, Instagram, Facebook, MapPin, Mail } from "lucide-react";
import { useSiteSettings } from "@/lib/settings";

export function Footer() {
  const s = useSiteSettings();
  return (
    <footer className="border-t mt-16 bg-card/40">
      <div className="mx-auto max-w-7xl px-4 py-12 grid md:grid-cols-4 gap-8">
        <div>
          <Logo />
          <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
            ماركة هدمة من التل الكبير 🇪🇬. أحدث صيحات الموضة بأسعار صادقة وتجربة لبس بالذكاء الاصطناعي.
          </p>
          {s.address && (
            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="size-3.5" /> {s.address}
            </div>
          )}
        </div>

        <div>
          <h4 className="font-bold mb-3">روابط سريعة</h4>
          <ul className="space-y-2 text-sm">
            {s.quick_links.map((l) => (
              <li key={l.to + l.label}>
                <Link to={l.to as any} className="hover:text-gold-gradient">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-3">الدعم</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <a href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-gold-gradient">
                <MessageCircle className="size-4 text-[#25D366]" /> واتساب الدعم
              </a>
            </li>
            <li>
              <a href={`mailto:${s.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-gold-gradient">
                <Mail className="size-4" /> {s.email}
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-3">تابعنا</h4>
          <div className="flex gap-3">
            {s.instagram_url && (
              <a href={s.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram"
                className="size-10 grid place-items-center rounded-full border hover:gradient-gold hover:text-primary transition">
                <Instagram className="size-5" />
              </a>
            )}
            {s.facebook_url && (
              <a href={s.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook"
                className="size-10 grid place-items-center rounded-full border hover:gradient-gold hover:text-primary transition">
                <Facebook className="size-5" />
              </a>
            )}
            <a href={`https://wa.me/${s.whatsapp}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"
              className="size-10 grid place-items-center rounded-full border hover:bg-[#25D366] hover:text-white transition">
              <MessageCircle className="size-5" />
            </a>
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            انضم لأكتر من <span className="font-bold text-gold-gradient">+500 زبون</span>
          </p>
        </div>
      </div>
      <div className="border-t py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Hedma هدمة — جميع الحقوق محفوظة
      </div>
    </footer>
  );
}
