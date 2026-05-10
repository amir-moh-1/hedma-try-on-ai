import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image?: string;
  size?: string;
  color?: string;
  qty: number;
};

type CartCtx = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  total: number;
  count: number;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "hedma_cart_v1";
const itemKey = (i: { id: string; size?: string; color?: string }) => `${i.id}|${i.size ?? ""}|${i.color ?? ""}`;

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setItems(JSON.parse(raw)); } catch {}
  }, []);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {} }, [items]);

  const add: CartCtx["add"] = (item, qty = 1) => {
    setItems((prev) => {
      const k = itemKey(item);
      const idx = prev.findIndex((p) => itemKey(p) === k);
      if (idx >= 0) {
        const next = [...prev]; next[idx] = { ...next[idx], qty: next[idx].qty + qty }; return next;
      }
      return [...prev, { ...item, qty }];
    });
  };
  const remove: CartCtx["remove"] = (k) => setItems((p) => p.filter((i) => itemKey(i) !== k));
  const setQty: CartCtx["setQty"] = (k, qty) =>
    setItems((p) => p.map((i) => (itemKey(i) === k ? { ...i, qty: Math.max(1, qty) } : i)));
  const clear = () => setItems([]);
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);
  const count = items.reduce((s, i) => s + i.qty, 0);

  return <Ctx.Provider value={{ items, add, remove, setQty, clear, total, count }}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart must be inside CartProvider");
  return c;
}

export const cartItemKey = itemKey;
