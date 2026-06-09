import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { useState } from "react";
import { ShoppingCart, Heart, Zap, ArrowLeft, Shield, Truck, Star, Package } from "lucide-react";
import { toast } from "sonner";

const NEON = "#A3E635";
const DARK_BG = "#121212";
const CARD_BG = "#1E1E1E";
const BORDER = "#2A2A2A";

const CATEGORIES = [
  { label: "ط§ظ„ط¹ط±ظˆط¶", emoji: "â­گ", key: "sale", active: true },
  { label: "ط´ظ†ط·", emoji: "ًں‘œ", key: "bags" },
  { label: "ط§ظƒط³ط³ظˆط§ط±ط§طھ", emoji: "âŒڑ", key: "accessories" },
  { label: "ط£ط­ط°ظٹط©", emoji: "ًں‘ں", key: "shoes" },
  { label: "ط¨ظ†ط·ظ„ظˆظ†ط§طھ", emoji: "ًں‘–", key: "pants" },
  { label: "ظ‡ظˆط¯ظٹط²", emoji: "ًں§¥", key: "hoodies" },
  { label: "طھظٹط´ظٹط±طھط§طھ", emoji: "ًں‘•", key: "tshirts" },
];

const INSTAGRAM_PHOTOS = [
  "https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1529139574466-a303027614b3?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop",
];

function YouthProductCard({ p }: { p: any }) {
  const { add: addItem } = useCart();
  const nav = useNavigate();
  const [wishlisted, setWishlisted] = useState(() => {
    try {
      const list = JSON.parse(localStorage.getItem("hedma-wishlist") || "[]");
      return list.includes(p.id);
    } catch { return false; }
  });

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const list = JSON.parse(localStorage.getItem("hedma-wishlist") || "[]");
      const next = wishlisted ? list.filter((id: string) => id !== p.id) : [...list, p.id];
      localStorage.setItem("hedma-wishlist", JSON.stringify(next));
      window.dispatchEvent(new Event("wishlist-change"));
      setWishlisted(!wishlisted);
    } catch {}
  };

  const handleCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({ id: p.id, name: p.name, price: p.price, image: p.image_url });
    toast.success("âœ… طھظ…طھ ط§ظ„ط¥ط¶ط§ظپط© ظ„ظ„ط³ظ„ط©");
  };

  return (
    <div
      onClick={() => nav({ to: "/product/$id", params: { id: p.id } })}
      style={{
        background: CARD_BG, borderRadius: "14px", overflow: "hidden",
        border: `1px solid ${BORDER}`, cursor: "pointer",
        transition: "transform 0.2s, border-color 0.2s",
      }}
      onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-3px)", e.currentTarget.style.borderColor = "#3a3a3a")}
      onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)", e.currentTarget.style.borderColor = BORDER)}
    >
      <div style={{ position: "relative", aspectRatio: "1", background: "#252525", overflow: "hidden" }}>
        {p.image_url ? (
          <img src={p.image_url} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#555" }}>
            <Package size={40} />
          </div>
        )}
        {p.stock < 10 && p.stock > 0 && (
          <div style={{ position: "absolute", top: "8px", right: "8px", background: NEON, color: "#000", fontSize: "9px", fontWeight: "900", padding: "2px 7px", borderRadius: "4px" }}>
            -20%
          </div>
        )}
        <button
          onClick={toggleWishlist}
          style={{
            position: "absolute", top: "8px", left: "8px",
            width: "30px", height: "30px", background: "rgba(0,0,0,0.6)",
            borderRadius: "50%", border: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Heart size={13} color={wishlisted ? "#ef4444" : "#fff"} fill={wishlisted ? "#ef4444" : "none"} />
        </button>
      </div>

      <div style={{ padding: "10px 12px" }}>
        <div style={{ color: "#d0d0d0", fontSize: "12px", fontWeight: "700", marginBottom: "8px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {p.name}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ color: NEON, fontWeight: "900", fontSize: "14px" }}>{p.price} ط¬ظ†ظٹط©</span>
          <button
            onClick={handleCart}
            style={{
              width: "32px", height: "32px", background: NEON, border: "none",
              borderRadius: "8px", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <ShoppingCart size={14} color="#000" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function YouthStorefront() {
  const { data: products } = useQuery({
    queryKey: ["youth-bestsellers"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id,name,price,image_url,category,stock")
        .eq("active", true)
        .order("stock", { ascending: false })
        .limit(8);
      return data ?? [];
    },
  });

  const { data: offer } = useQuery({
    queryKey: ["global-offer"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("product_offers")
        .select("title,percent,ends_at")
        .is("product_id", null)
        .eq("active", true)
        .gt("ends_at", new Date().toISOString())
        .order("percent", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  return (
    <div dir="rtl" style={{ background: DARK_BG, color: "#fff", minHeight: "100vh" }}>

      {/* â”€â”€ HERO BANNER â”€â”€ */}
      <section style={{ position: "relative", minHeight: "90vh", overflow: "hidden", display: "flex", alignItems: "center" }}>
        {/* Hero image background */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <img
            src="/assets/hero-youth.jpg"
            alt="ظ‡ط¯ظ…ط© ط³طھط±ظٹطھ ظˆظٹط±"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }}
          />
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(100deg, rgba(10,10,10,0.88) 40%, rgba(10,10,10,0.45) 100%)",
          }} />
          {/* Neon green gradient glow */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: "30%",
            background: "linear-gradient(to top, rgba(18,18,18,1), transparent)",
          }} />
        </div>

        {/* Left side "NEW SEASON" vertical text */}
        <div style={{
          position: "absolute", left: "1.2rem", top: "50%",
          transform: "translateY(-50%) rotate(-90deg)",
          color: NEON, fontSize: "10px", fontWeight: "900",
          letterSpacing: "0.35em", whiteSpace: "nowrap", opacity: 0.9,
          zIndex: 2,
        }}>
          NEW SEASON '2K
        </div>

        {/* Hero content */}
        <div style={{ position: "relative", zIndex: 2, padding: "5rem 2rem 5rem 3.5rem", maxWidth: "700px" }}>
          {offer && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "rgba(163,230,53,0.12)", border: `1px solid ${NEON}33`,
              borderRadius: "100px", padding: "5px 14px", marginBottom: "1.5rem",
            }}>
              <Zap size={12} color={NEON} fill={NEON} />
              <span style={{ color: NEON, fontSize: "11px", fontWeight: "900", letterSpacing: "0.1em" }}>
                {(offer as any)?.code ? `ظƒظˆط¯ ط§ظ„ط®طµظ…: ${(offer as any).code}` : `ط®طµظ… ${(offer as any)?.percent}%`}
              </span>
            </div>
          )}

          <h1 style={{ fontSize: "clamp(3rem,9vw,6.5rem)", fontWeight: "900", lineHeight: "1", marginBottom: "1.25rem" }}>
            <span style={{ color: "#ffffff", display: "block" }}>ط£ط³ظ„ظˆط¨ظƒ</span>
            <span style={{ color: NEON, display: "block" }}>ظٹط¹ط¨ط± ط¹ظ†ظƒ</span>
          </h1>

          <p style={{ color: "#aaa", fontSize: "1rem", marginBottom: "2.5rem", lineHeight: "1.7", maxWidth: "380px" }}>
            ط§ظƒطھط´ظپ ط£ط­ط¯ط« ط§ظ„طھط´ظƒظٹظ„ط§طھ â€” ط¬ط¯ظٹط¯ ظ¢ظ ظ¢ظ¤
          </p>

          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <Link
              to="/products"
              style={{
                background: NEON, color: "#000", border: "none",
                padding: "15px 32px", fontSize: "13px", fontWeight: "900",
                cursor: "pointer", display: "inline-flex", alignItems: "center",
                gap: "8px", borderRadius: "4px", textDecoration: "none",
                letterSpacing: "0.05em",
              }}
            >
              طھط³ظˆظ‚ ط§ظ„ط¢ظ† â†گ
            </Link>
            <Link
              to="/try-on"
              style={{
                background: "transparent", color: "#fff",
                border: "1px solid rgba(255,255,255,0.2)",
                padding: "15px 28px", fontSize: "13px", fontWeight: "700",
                cursor: "pointer", display: "inline-flex", alignItems: "center",
                gap: "8px", borderRadius: "4px", textDecoration: "none",
              }}
            >
              AI Try-On âœ¨
            </Link>
          </div>
        </div>

        {/* Hero dots */}
        <div style={{
          position: "absolute", bottom: "2rem", left: "50%", transform: "translateX(-50%)",
          display: "flex", gap: "8px", zIndex: 2,
        }}>
          {[0,1,2,3].map(i => (
            <span key={i} style={{
              width: i === 0 ? "28px" : "8px", height: "4px",
              background: i === 0 ? NEON : "#333", borderRadius: "2px",
              transition: "all 0.3s",
            }} />
          ))}
        </div>
      </section>

      {/* â”€â”€ CATEGORIES â”€â”€ */}
      <section style={{ background: "#181818", padding: "2.5rem 1rem", borderBottom: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", overflowX: "auto", gap: "1.2rem", paddingBottom: "0.5rem", justifyContent: "center", flexWrap: "wrap" }}
            className="no-scrollbar">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.key}
                to="/products"
                search={{ category: cat.key } as any}
                style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", textDecoration: "none" }}
              >
                <div style={{
                  width: "72px", height: "72px",
                  background: cat.active ? NEON : "#2A2A2A",
                  borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.75rem",
                  boxShadow: cat.active ? `0 0 20px ${NEON}44` : "none",
                  transition: "all 0.2s",
                }}>
                  {cat.emoji}
                </div>
                <span style={{
                  color: cat.active ? NEON : "#aaa",
                  fontSize: "11px", fontWeight: "800",
                  letterSpacing: "0.03em",
                }}>
                  {cat.label}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ BEST SELLERS â”€â”€ */}
      <section style={{ background: DARK_BG, padding: "2.5rem 1.5rem" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <Zap size={22} color={NEON} fill={NEON} />
              <h2 style={{ color: "#fff", fontSize: "1.5rem", fontWeight: "900" }}>ط§ظ„ط£ظƒط«ط± ظ…ط¨ظٹط¹ط§ظ‹</h2>
            </div>
            <Link to="/products" style={{ color: NEON, fontSize: "12px", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px", textDecoration: "none" }}>
              ط¹ط±ط¶ ط§ظ„ظƒظ„ <ArrowLeft size={13} />
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem" }}>
            {(products ?? []).map(p => (
              <YouthProductCard key={p.id} p={p} />
            ))}
            {(!products || products.length === 0) && (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ background: CARD_BG, borderRadius: "14px", aspectRatio: "1", border: `1px solid ${BORDER}`, animation: "pulse 2s infinite" }} />
              ))
            )}
          </div>
        </div>
      </section>

      {/* â”€â”€ PROMO BANNER â”€â”€ */}
      <section style={{ padding: "0 1.5rem 2.5rem" }}>
        <div style={{
          maxWidth: "1200px", margin: "0 auto",
          background: "#181818", borderRadius: "16px",
          border: `1px solid ${BORDER}`,
          display: "grid", gridTemplateColumns: "1fr 1fr",
          overflow: "hidden",
        }}>
          {/* Left: discount info */}
          <div style={{ padding: "2rem", borderLeft: `1px solid ${BORDER}`, position: "relative", overflow: "hidden" }}>
            <div style={{
              position: "absolute", top: "-20px", right: "-20px",
              width: "120px", height: "120px", background: NEON, borderRadius: "50%", opacity: 0.05,
            }} />
            <div style={{ color: NEON, fontSize: "clamp(2.5rem, 6vw, 4rem)", fontWeight: "900", lineHeight: 1 }}>
              10%
            </div>
            <div style={{ color: "#fff", fontSize: "1.1rem", fontWeight: "800", marginTop: "0.5rem" }}>
              ط®طµظ… ط¹ظ„ظ‰ ط£ظˆظ„ ط·ظ„ط¨
            </div>
            <div style={{ color: "#888", fontSize: "0.8rem", marginTop: "0.5rem" }}>
              ط§ط³طھط®ط¯ظ… ط§ظ„ظƒظˆط¯:
              <span style={{ background: "#2a2a2a", color: NEON, fontWeight: "900", padding: "2px 10px", borderRadius: "6px", marginRight: "6px", letterSpacing: "0.1em" }}>
                {(offer as any)?.code || "HADMA10"}
              </span>
            </div>
          </div>

          {/* Right: trust icons */}
          <div style={{ padding: "2rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            {[
              { icon: Shield, label: "ط¯ظپط¹ ط¢ظ…ظ†", sub: "ط­ظ…ط§ظٹط© ط¨ظٹط§ظ†ط§طھظƒ" },
              { icon: Star, label: "ظ…ظ†طھط¬ط§طھ ط£طµظ„ظٹط©", sub: "ظ،ظ ظ % ظ…ط¶ظ…ظˆظ†ط©" },
              { icon: Truck, label: "طھظˆطµظٹظ„ ط³ط±ظٹط¹", sub: "ط®ظ„ط§ظ„ ظ¢ - ظ£ ط£ظٹط§ظ…" },
              { icon: Package, label: "ط¥ط±ط¬ط§ط¹ ط³ظ‡ظ„", sub: "ط®ظ„ط§ظ„ ظ،ظ¤ ظٹظˆظ…" },
            ].map(({ icon: Icon, label, sub }) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "8px" }}>
                <div style={{ width: "42px", height: "42px", background: "#252525", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={18} color={NEON} />
                </div>
                <div>
                  <div style={{ color: "#fff", fontSize: "11px", fontWeight: "800" }}>{label}</div>
                  <div style={{ color: "#666", fontSize: "10px" }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ INSTAGRAM â”€â”€ */}
      <section style={{ background: "#181818", padding: "2.5rem 1.5rem", borderTop: `1px solid ${BORDER}` }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
            <div style={{ color: "#aaa", fontSize: "1rem", fontWeight: "900" }}>@hadma.wear</div>
            <a
              href="https://instagram.com/hadma.wear"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: NEON, fontSize: "13px", fontWeight: "800", display: "flex", alignItems: "center", gap: "6px", textDecoration: "none" }}
            >
              طھط§ط¨ط¹ظ†ط§ ط¹ظ„ظ‰ ط§ظ†ط³طھط¬ط±ط§ظ… â†گ
            </a>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "8px" }}>
            {INSTAGRAM_PHOTOS.map((src, i) => (
              <div key={i} style={{ aspectRatio: "1", overflow: "hidden", borderRadius: "10px", background: "#222" }}>
                <img
                  src={src}
                  alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.8) saturate(0.9)", transition: "filter 0.3s" }}
                  onMouseEnter={e => ((e.target as HTMLImageElement).style.filter = "brightness(1) saturate(1)")}
                  onMouseLeave={e => ((e.target as HTMLImageElement).style.filter = "brightness(0.8) saturate(0.9)")}
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* â”€â”€ YOUTH FOOTER BAND â”€â”€ */}
      <div style={{
        background: "#000", borderTop: `1px solid ${BORDER}`,
        padding: "1.25rem 1.5rem",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem",
      }}>
        <div style={{ color: "#fff", fontWeight: "900", fontSize: "1.25rem", letterSpacing: "0.1em" }}>
          HADMA <span style={{ color: NEON, fontSize: "0.65rem", letterSpacing: "0.3em" }}>STREET WEAR</span>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          {["VISA", "MC", "ApplePay"].map(pay => (
            <div key={pay} style={{ background: "#1a1a1a", border: `1px solid ${BORDER}`, borderRadius: "6px", padding: "4px 10px", color: "#888", fontSize: "10px", fontWeight: "700" }}>
              {pay}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
