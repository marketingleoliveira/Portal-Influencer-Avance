import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type Role = "admin" | "influencer" | null;

interface AuthCtx {
  user: User | null;
  session: Session | null;
  role: Role;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  const loadRole = async (uid: string | undefined) => {
    if (!uid) {
      setRole(null);
      return;
    }
    const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    if (error) {
      console.error("Erro ao carregar perfil do usuário", error);
      setRole(null);
      return;
    }
    if (data?.some((r) => r.role === "admin")) setRole("admin");
    else if (data?.some((r) => r.role === "influencer")) setRole("influencer");
    else setRole(null);
  };

  useEffect(() => {
    let initialized = false;
    let lastUserId: string | undefined = undefined;

    const applySession = (s: Session | null, opts: { initial?: boolean } = {}) => {
      const nextId = s?.user?.id;
      const userChanged = nextId !== lastUserId;
      lastUserId = nextId;
      setSession(s);
      setUser(s?.user ?? null);
      // Only toggle global loading on initial load or when the actual user changes
      // (sign-in / sign-out). Token refreshes after returning to the tab must NOT
      // remount protected children — that would wipe in-progress forms on mobile
      // when the OS suspends the tab during file/camera pickers.
      if (opts.initial || userChanged) {
        setLoading(true);
        void loadRole(nextId).finally(() => setLoading(false));
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      applySession(s, { initial: !initialized });
      initialized = true;
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session, { initial: !initialized });
      initialized = true;
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };
  const signOut = async () => {
    await supabase.auth.signOut();
    setRole(null);
  };

  return (
    <Ctx.Provider value={{ user, session, role, loading, signIn, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be inside AuthProvider");
  return v;
}
