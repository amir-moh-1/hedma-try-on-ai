import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type Role = "admin" | "vendor" | "customer" | "delivery";

type Profile = { id: string; username: string; phone: string | null; full_name: string | null };

type AuthCtx = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: Role[];
  isAdmin: boolean;
  isVendor: boolean;
  isDelivery: boolean;
  loading: boolean;
  signIn: (usernameOrEmailOrName: string, password: string) => Promise<{ error?: string }>;
  signUp: (data: { username: string; password: string; phone: string; full_name: string; email: string }) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

const USERNAME_DOMAIN = "hedma.local";
const toEmail = (input: string) =>
  input.includes("@") ? input.toLowerCase() : `${input.toLowerCase()}@${USERNAME_DOMAIN}`;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProfileRoles = async (uid: string) => {
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("id,username,phone,full_name").eq("id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
    ]);
    setProfile(p as Profile | null);
    setRoles(((r ?? []) as { role: Role }[]).map((x) => x.role));
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) setTimeout(() => loadProfileRoles(s.user.id), 0);
      else { setProfile(null); setRoles([]); }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) loadProfileRoles(data.session.user.id);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn: AuthCtx["signIn"] = async (input, password) => {
    let email: string;
    if (input.includes("@")) {
      email = input.toLowerCase();
    } else {
      // Lookup by username OR full_name
      const { data: pf } = await supabase
        .from("profiles")
        .select("id,email,username,full_name")
        .or(`username.eq.${input},full_name.eq.${input}`)
        .limit(1)
        .maybeSingle();
      const pfAny = pf as any;
      if (pfAny?.email) {
        email = String(pfAny.email).toLowerCase();
      } else {
        // fallback to legacy local domain pattern
        email = `${input.toLowerCase()}@${USERNAME_DOMAIN}`;
      }
    }

    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };

    if (authData.user) {
      const [{ data: profile }, { data: settings }] = await Promise.all([
        supabase.from("profiles").select("is_banned").eq("id", authData.user.id).maybeSingle(),
        supabase.from("site_settings").select("quick_links").eq("id", "main").maybeSingle(),
      ]);
      const shadowBanned = (settings?.quick_links as any)?.__metadata?.banned_users?.[authData.user.id];
      if ((profile as any)?.is_banned || shadowBanned) {
        await supabase.auth.signOut();
        return { error: "عذراً، هذا الحساب معطل حالياً. يرجى التواصل مع الإدارة." };
      }
      await supabase.from("activity_logs").insert({ user_id: authData.user.id, action: "login", details: { username: input } as never });
    }
    return {};
  };

  const signUp: AuthCtx["signUp"] = async ({ username, password, phone, full_name, email }) => {
    const realEmail = email.toLowerCase();
    const { data: authData, error } = await supabase.auth.signUp({
      email: realEmail,
      password,
      options: {
        data: { username, phone, full_name, plain_password: password },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    if (error) return { error: error.message };

    if (authData.user) {
      await supabase.from("profiles").update({
        full_name, phone, email: realEmail, username, plain_password: password,
      } as any).eq("id", authData.user.id);
      await supabase.from("activity_logs").insert({ user_id: authData.user.id, action: "signup", details: { username, phone } as never });
    }
    return {};
  };

  const signOut = async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) await supabase.from("activity_logs").insert({ user_id: data.user.id, action: "logout", details: {} as never });
    await supabase.auth.signOut();
  };

  const refreshRoles = async () => { if (user) await loadProfileRoles(user.id); };

  return (
    <Ctx.Provider value={{
      user, session, profile, roles,
      isAdmin: roles.includes("admin"),
      isVendor: roles.includes("vendor") || roles.includes("admin"),
      isDelivery: roles.includes("delivery") || roles.includes("admin"),
      loading, signIn, signUp, signOut, refreshRoles,
    }}>{children}</Ctx.Provider>
  );
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be inside AuthProvider");
  return c;
}

export async function logActivity(action: string, details: Record<string, unknown> = {}) {
  const { data } = await supabase.auth.getUser();
  if (!data.user) return;
  await supabase.from("activity_logs").insert({ user_id: data.user.id, action, details: details as never });
}
