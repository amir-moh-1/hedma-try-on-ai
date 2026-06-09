import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

export type StorefrontTheme = "youth" | "premium" | "default";

type Ctx = {
  storefrontTheme: StorefrontTheme;
  setStorefrontTheme: (t: StorefrontTheme) => void;
};

const StorefrontThemeCtx = createContext<Ctx>({
  storefrontTheme: "default",
  setStorefrontTheme: () => {},
});

const STORAGE_KEY = "hedma:storefront-theme";

function resolveThemeFromAge(age: number): StorefrontTheme {
  if (age >= 8 && age <= 25) return "youth";
  if (age >= 26) return "premium";
  return "default";
}

export function StorefrontThemeProvider({ children }: { children: ReactNode }) {
  const [storefrontTheme, setStorefrontThemeState] = useState<StorefrontTheme>(() => {
    if (typeof window === "undefined") return "default";
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "youth" || stored === "premium" || stored === "default") return stored;
    } catch {}
    return "default";
  });

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("age")
        .eq("id", data.user.id)
        .maybeSingle();
      const age = (profile as any)?.age;
      if (typeof age === "number" && age >= 8) {
        const resolved = resolveThemeFromAge(age);
        setStorefrontThemeState(resolved);
        try { localStorage.setItem(STORAGE_KEY, resolved); } catch {}
      }
    });
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.remove("storefront-youth", "storefront-premium");
    if (storefrontTheme !== "default") root.classList.add(`storefront-${storefrontTheme}`);
  }, [storefrontTheme]);

  const setStorefrontTheme = (t: StorefrontTheme) => {
    setStorefrontThemeState(t);
    try { localStorage.setItem(STORAGE_KEY, t); } catch {}
  };

  return (
    <StorefrontThemeCtx.Provider value={{ storefrontTheme, setStorefrontTheme }}>
      {children}
    </StorefrontThemeCtx.Provider>
  );
}

export function useStorefrontTheme() {
  return useContext(StorefrontThemeCtx);
}
