import { Link } from "@tanstack/react-router";

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <Link to="/" className="flex items-center gap-2 group">
      <span
        className="grid place-items-center rounded-full gradient-gold shadow-luxe text-primary font-display font-black"
        style={{ width: size, height: size, fontSize: size * 0.5 }}
        aria-hidden
      >H</span>
      <span className="font-display text-2xl font-black tracking-tight">
        <span className="text-foreground">Hed</span>
        <span className="text-gold-gradient">ma</span>
      </span>
    </Link>
  );
}
