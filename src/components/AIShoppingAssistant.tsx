import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, X, Send, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "@tanstack/react-router";
import { formatEGP } from "@/lib/format";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string; products?: any[]; error?: boolean };

const STORAGE_KEY = "hedma:ai-shop-chat";
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 1500;

async function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

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
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-20))); } catch {}
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      // Cancel any in-flight request when chat is closed
      abortRef.current?.abort();
    }
  }, [open]);

  const callAssistant = useCallback(async (
    convo: Msg[],
    attempt = 0
  ): Promise<{ reply: string; products?: any[] }> => {
    const ctl = new AbortController();
    abortRef.current = ctl;
    try {
      const { data, error } = await supabase.functions.invoke("ai-shop-assistant", {
        body: { messages: convo.map(m => ({ role: m.role, content: m.content })) },
      });
      if (error) throw new Error(error.message || "خطأ في الاتصال");
      if (data?.error) throw new Error(data.error);
      return {
        reply: data?.reply || "ما لقيتش حاجة مناسبة، جرّب كلمات تانية",
        products: data?.products ?? [],
      };
    } catch (e: any) {
      if (e?.name === "AbortError") throw e;
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS * (attempt + 1));
        return callAssistant(convo, attempt + 1);
      }
      throw e;
    }
  }, []);

  const send = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user" as const, content: text }];
    setMessages(next);
    setLoading(true);

    try {
      const { reply, products } = await callAssistant(next);
      setMessages([...next, { role: "assistant", content: reply, products }]);
    } catch (e: any) {
      if (e?.name === "AbortError") return;
      const msg = e?.message || "حصل خطأ، حاول تاني";
      setMessages(prev => [...prev, { role: "assistant", content: `❌ ${msg}`, error: true }]);
      if (!msg.includes("AbortError")) toast.error(msg, { duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const retryLast = () => {
    const lastUser = [...messages].reverse().find(m => m.role === "user");
    if (!lastUser) return;
    const withoutLastAssistant = messages.filter((_, i) =>
      i < messages.length - 1 || messages[i].role !== "assistant"
    );
    setMessages(withoutLastAssistant.filter(m => !(m.role === "assistant" && m.error)));
    send(lastUser.content);
  };

  const clearChat = () => {
    abortRef.current?.abort();
    setMessages([]);
    setLoading(false);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  const lastIsError = messages[messages.length - 1]?.error;

  return (
    <>
      {/* AI Button — sits higher than WhatsApp */}
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-28 md:bottom-6 left-4 md:left-6 z-40 size-14 rounded-full gradient-gold text-primary shadow-luxe grid place-items-center hover:scale-105 active:scale-95 transition"
        aria-label="مساعد التسوق الذكي"
      >
        {loading && open ? <Loader2 className="size-6 animate-spin" /> : <Sparkles className="size-6" />}
      </button>

      {open && (
        <div
          className="fixed inset-x-2 bottom-2 md:inset-auto md:bottom-24 md:left-6 md:w-[400px] z-50 bg-card border rounded-3xl shadow-luxe flex flex-col max-h-[80vh] md:h-[600px] animate-in slide-in-from-bottom duration-200"
          role="dialog"
          aria-label="مساعد التسوق الذكي"
        >
          <header className="flex items-center justify-between p-4 border-b shrink-0">
            <div className="flex items-center gap-2 font-bold">
              <Sparkles className="size-4 text-gold" />
              مساعد التسوق الذكي
            </div>
            <div className="flex items-center gap-1">
              {messages.length > 0 && !loading && (
                <button
                  onClick={clearChat}
                  className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded"
                  title="مسح المحادثة"
                >
                  مسح
                </button>
              )}
              <button onClick={() => setOpen(false)} aria-label="إغلاق" className="p-1 rounded hover:bg-muted">
                <X className="size-5" />
              </button>
            </div>
          </header>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain">
            {messages.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-8 space-y-2">
                <Sparkles className="size-8 mx-auto text-gold" />
                <p className="font-bold">قولي عايز إيه وأنا أرشحلك</p>
                <div className="space-y-2 mt-3 text-xs">
                  {[
                    '"عايز هدية لأمي بـ 300 جنيه"',
                    '"تيشيرت أسود مقاس L"',
                    '"حاجة لابني سنتين"',
                    '"أرخص حاجة موجودة"',
                  ].map(ex => (
                    <button
                      key={ex}
                      onClick={() => send(ex.replace(/"/g, ""))}
                      className="block w-full text-center italic border rounded-xl px-3 py-2 hover:bg-muted/50 transition text-xs"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                  m.role === "user"
                    ? "gradient-gold text-primary"
                    : m.error
                    ? "bg-destructive/10 border border-destructive/20 text-destructive"
                    : "bg-muted"
                }`}>
                  <p className="whitespace-pre-wrap">{m.content}</p>
                  {m.products && m.products.length > 0 && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {m.products.slice(0, 6).map((p: any) => (
                        <Link
                          key={p.id}
                          to="/product/$id"
                          params={{ id: p.id }}
                          onClick={() => setOpen(false)}
                          className="bg-card hover:shadow-md transition rounded-xl overflow-hidden border block"
                        >
                          <div className="aspect-square bg-muted">
                            {p.image_url && <img src={p.image_url} alt={p.name} className="size-full object-cover" loading="lazy" />}
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
                <div className="bg-muted rounded-2xl px-4 py-3 flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="size-4 animate-spin" />
                  جاري البحث...
                </div>
              </div>
            )}

            {lastIsError && !loading && (
              <div className="flex justify-end">
                <button
                  onClick={retryLast}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border rounded-xl px-3 py-1.5 hover:bg-muted transition"
                >
                  <RefreshCw className="size-3" />
                  حاول تاني
                </button>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="p-3 border-t flex gap-2 shrink-0"
          >
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="عايز إيه؟..."
              disabled={loading}
              className="rounded-xl"
              maxLength={300}
            />
            <Button
              type="submit"
              disabled={loading || !input.trim()}
              size="icon"
              className="rounded-xl gradient-gold text-primary shrink-0"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </Button>
          </form>
        </div>
      )}
    </>
  );
}
