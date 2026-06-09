import { useState, useEffect } from "react";
import { useStorefrontTheme } from "@/lib/storefront-theme";
import { useTheme } from "@/components/ThemeProvider";
import { X } from "lucide-react";

const STORAGE_KEY = "hedma:storefront-theme";

export function AgeSelector() {
  const [open, setOpen] = useState(false);
  const { storefrontTheme, setStorefrontTheme } = useStorefrontTheme();
  const { setTheme } = useTheme();

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored || stored === "default") setOpen(true);
    } catch {}
  }, []);

  if (!open) return null;

  const choose = (seg: "youth" | "premium") => {
    setStorefrontTheme(seg);
    if (seg === "youth") setTheme("dark");
    setOpen(false);
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "1rem", direction: "rtl",
      }}
    >
      <div
        style={{
          background: "#121212", border: "1px solid #2a2a2a", borderRadius: "20px",
          maxWidth: "500px", width: "100%", padding: "2.5rem 2rem", position: "relative",
          boxShadow: "0 40px 80px rgba(0,0,0,0.6)",
        }}
      >
        <button
          onClick={() => { setStorefrontTheme("premium"); setOpen(false); }}
          style={{
            position: "absolute", top: "1rem", left: "1rem",
            background: "rgba(255,255,255,0.05)", border: "none",
            borderRadius: "50%", width: "32px", height: "32px",
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            color: "#888",
          }}
        >
          <X size={16} />
        </button>

        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>✨</div>
          <h2 style={{ color: "#ffffff", fontSize: "1.5rem", fontWeight: "900", marginBottom: "0.5rem" }}>
            مرحباً في هدمة
          </h2>
          <p style={{ color: "#888", fontSize: "0.875rem", lineHeight: "1.6" }}>
            اختار تجربتك المفضلة — ونخلّي كل حاجة على مزاجك
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          {/* Youth option */}
          <button
            onClick={() => choose("youth")}
            style={{
              background: "linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)",
              border: "2px solid #A3E635",
              borderRadius: "16px", padding: "1.5rem 1rem",
              cursor: "pointer", transition: "all 0.2s",
              textAlign: "center", color: "#fff",
              display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem",
            }}
          >
            <span style={{ fontSize: "2.5rem" }}>🔥</span>
            <div>
              <div style={{ color: "#A3E635", fontWeight: "900", fontSize: "1rem", marginBottom: "0.25rem" }}>
                Street Wear
              </div>
              <div style={{ color: "#ccc", fontSize: "0.75rem" }}>٢٥ سنة وأقل</div>
              <div style={{ color: "#666", fontSize: "0.7rem", marginTop: "0.5rem" }}>
                ترند | جرافيك | أسلوب حر
              </div>
            </div>
          </button>

          {/* Premium option */}
          <button
            onClick={() => choose("premium")}
            style={{
              background: "linear-gradient(135deg, #1a1209 0%, #0f0c05 100%)",
              border: "2px solid #D4A017",
              borderRadius: "16px", padding: "1.5rem 1rem",
              cursor: "pointer", transition: "all 0.2s",
              textAlign: "center", color: "#fff",
              display: "flex", flexDirection: "column", alignItems: "center", gap: "0.75rem",
            }}
          >
            <span style={{ fontSize: "2.5rem" }}>✨</span>
            <div>
              <div style={{ color: "#D4A017", fontWeight: "900", fontSize: "1rem", marginBottom: "0.25rem" }}>
                Premium
              </div>
              <div style={{ color: "#ccc", fontSize: "0.75rem" }}>٢٦ سنة وأكبر</div>
              <div style={{ color: "#666", fontSize: "0.7rem", marginTop: "0.5rem" }}>
                كلاسيك | فاخر | راقي
              </div>
            </div>
          </button>
        </div>

        <p style={{ textAlign: "center", color: "#444", fontSize: "0.7rem", marginTop: "1.5rem" }}>
          تقدر تغير تجربتك في أي وقت من إعدادات الحساب
        </p>
      </div>
    </div>
  );
}
