import { useEffect, useState } from "react";
import type { StorefrontAudience } from "@/lib/storefrontConfig";

const KEY = "hedma:storefront-audience";

function readAudience(): StorefrontAudience | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(KEY);
  return value === "under25" || value === "over25" ? value : null;
}

export function useStorefrontAudience(defaultValue: StorefrontAudience = "over25") {
  const [audience, setAudienceState] = useState<StorefrontAudience>(() => readAudience() ?? defaultValue);
  const [chosen, setChosen] = useState(() => readAudience() !== null);

  useEffect(() => {
    const sync = () => {
      const next = readAudience();
      if (next) {
        setAudienceState(next);
        setChosen(true);
      }
    };
    window.addEventListener("storage", sync);
    window.addEventListener("hedma-audience-change", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("hedma-audience-change", sync);
    };
  }, []);

  const setAudience = (next: StorefrontAudience) => {
    localStorage.setItem(KEY, next);
    setAudienceState(next);
    setChosen(true);
    window.dispatchEvent(new Event("hedma-audience-change"));
  };

  return { audience, setAudience, chosen };
}