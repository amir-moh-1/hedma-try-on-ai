import { MessageCircle } from "lucide-react";

const WHATSAPP = "201229344711";

export function FloatingWhatsApp() {
  const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
    "السلام عليكم 👋 محتاج مساعدة من Hedma هدمة"
  )}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="تواصل واتساب"
      className="fixed bottom-5 left-5 z-50 grid place-items-center size-14 rounded-full bg-[#25D366] text-white shadow-luxe hover:scale-110 transition-transform"
    >
      <MessageCircle className="size-7" />
      <span className="absolute inset-0 rounded-full animate-ping bg-[#25D366]/40 -z-10" />
    </a>
  );
}
