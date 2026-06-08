import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, X, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";
import { formatEGP } from "@/lib/format";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string; products?: any[] };

const STORAGE_KEY = "hedma:ai-shop-chat";

export function AIShoppingAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
    catch { return []; }
  });
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20))); } catch {}
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => { if (open) inputRef.current?.focus(); }, [open]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const next = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-shop-assistant", {
        body: { messages: next.map(m => ({ role: m.role, content: m.content })) },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setMessages([...next, {
        role: "assistant",
        content: data?.reply || "ما لقيتش حاجة مناسبة، جرّب كلمات تانية",
        products: data?.products ?? [],
      }]);
    } catch (e: any) {
      const msg = e?.message || "حصل خطأ، حاول تاني";
      setMessages([...next, { role: "assistant", content: `❌ ${msg}` }]);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-24 md:bottom-6 left-4 md:left-6 z-40 size-14 rounded-full gradient-gold text-primary shadow-luxe grid place-items-center hover:scale-105 transition"
        aria-label="مساعد التسوق الذكي"
      >
        <Sparkles className="size-6" />
      </button>

      {open && (
        <div className="fixed inset-x-2 bottom-2 md:inset-auto md:bottom-24 md:left-6 md:w-[400px] z-50 bg-card border rounded-3xl shadow-luxe flex flex-col max-h-[80vh] md:h-[600px] animate-in slide-in-from-bottom duration-200">
          <header className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2 font-bold">
              <Sparkles className="size-4 text-gold" />
              مساعد التسوق
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && (
                <button onClick={clearChat} className="text-xs text-muted-foreground hover:text-foreground px-2">مسح</button>
              )}
              <button onClick={() => setOpen(false)} aria-label="إغلاق">
                <X className="size-5" />
              </button>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8 space-y-2">
                <Sparkles className="size-8 mx-auto text-gold" />
                <p className="font-bold">قولي عايز إيه وأنا أرشحلك</p>
                <div className="space-y-1 mt-3 text-xs">
                  <p className="italic">"عايز هدية لأمي بـ 300 جنيه"</p>
                  <p className="italic">"تيشيرت أسود مقاس L"</p>
                  <p className="italic">"حاجة لابني سنتين"</p>
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${m.role === "user" ? "gradient-gold text-primary" : "bg-muted"}`}>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  {m.products && m.products.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {m.products.map((p: any) => (
                        <Link
                          key={p.id}
                          to="/product/$id"
                          params={{ id: p.id }}
                          onClick={() => setOpen(false)}
                          className="bg-card hover:shadow-md transition rounded-xl overflow-hidden border block"
                        >
                          <div className="aspect-square bg-muted">
                            {p.image_url && <img src={p.image_url} alt={p.name} className="size-full object-cover" />}
                          </div>
                          <div className="p-2">
                            <p className="text-xs font-bold truncate text-foreground">{p.name}</p>
                            <p className="text-xs font-mono text-gold">{formatEGP(p.price)}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-end">
                <div className="bg-muted rounded-2xl px-4 py-3">
                  <Loader2 className="size-4 animate-spin" />
                </div>
              </div>
            )}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); send(); }} className="p-3 border-t flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="عايز إيه؟..."
              disabled={loading}
              className="rounded-xl"
            />
            <Button type="submit" disabled={loading || !input.trim()} size="icon" className="rounded-xl gradient-gold text-primary shrink-0">
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
