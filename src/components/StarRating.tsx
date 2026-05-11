import { Star } from "lucide-react";

export function StarRating({
  value,
  size = 16,
  onChange,
  className = "",
}: {
  value: number;
  size?: number;
  onChange?: (n: number) => void;
  className?: string;
}) {
  return (
    <div className={`inline-flex items-center gap-0.5 ${className}`} dir="ltr">
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= Math.round(value);
        const Cmp = onChange ? "button" : "span";
        return (
          <Cmp
            key={n}
            type={onChange ? "button" : undefined}
            onClick={onChange ? () => onChange(n) : undefined}
            className={onChange ? "transition hover:scale-110" : ""}
            aria-label={`${n} نجوم`}
          >
            <Star
              size={size}
              className={filled ? "fill-yellow-400 text-yellow-500" : "text-muted-foreground/40"}
            />
          </Cmp>
        );
      })}
    </div>
  );
}
