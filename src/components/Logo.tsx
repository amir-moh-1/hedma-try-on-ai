import { Link } from "@tanstack/react-router";
import { useSiteSettings } from "@/lib/settings";

export function Logo({ size = 32 }: { size?: number }) {
  const settings = useSiteSettings();

  return (
    <Link to="/" className="flex items-center gap-3 group">
      <div className="relative">
        <div 
          className="grid place-items-center rounded-full gradient-gold shadow-luxe text-primary font-display font-black overflow-hidden"
          style={{ width: size, height: size, fontSize: size * 0.5 }}
          aria-hidden
        >
          {settings?.logo_url ? (
            <img src={settings.logo_url} className="size-full object-contain" alt="Logo" />
          ) : (
            "H"
          )}
        </div>
        {/* Slogan for mobile/compact if needed, but usually we want it next to text */}
      </div>
      
      <div className="flex flex-col leading-tight">
        <span className="font-display text-2xl font-black tracking-tight">
          <span className="text-foreground">Hed</span>
          <span className="text-gold-gradient">ma</span>
        </span>
        {settings?.slogan && (
          <span className="text-[10px] text-muted-foreground font-bold Arabic-font">
            {settings.slogan}
          </span>
        )}
      </div>
    </Link>
  );
}
