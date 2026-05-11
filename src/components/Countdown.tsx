import { useEffect, useState } from "react";

export function Countdown({ endsAt, onEnd }: { endsAt: string; onEnd?: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const diff = Math.max(0, new Date(endsAt).getTime() - now);
  useEffect(() => {
    if (diff === 0) onEnd?.();
  }, [diff, onEnd]);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff / 3600000) % 24);
  const m = Math.floor((diff / 60000) % 60);
  const s = Math.floor((diff / 1000) % 60);
  const Cell = ({ v, l }: { v: number; l: string }) => (
    <div className="text-center px-2">
      <div className="font-display text-2xl md:text-3xl font-black text-gold-gradient leading-none tabular-nums">
        {String(v).padStart(2, "0")}
      </div>
      <div className="text-[10px] uppercase text-muted-foreground mt-1">{l}</div>
    </div>
  );
  return (
    <div className="inline-flex items-center gap-1 bg-card border rounded-xl p-2 shadow-luxe" dir="ltr">
      {d > 0 && <Cell v={d} l="يوم" />}
      <Cell v={h} l="ساعة" />
      <span className="text-2xl text-muted-foreground/40">:</span>
      <Cell v={m} l="دقيقة" />
      <span className="text-2xl text-muted-foreground/40">:</span>
      <Cell v={s} l="ثانية" />
    </div>
  );
}
