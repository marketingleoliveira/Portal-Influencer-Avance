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
    const applySession = (s: Session | null) => {
      setLoading(true);
      setSession(s);
      setUser(s?.user ?? null);
      void loadRole(s?.user?.id).finally(() => setLoading(false));
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      applySession(s);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      applySession(session);
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
