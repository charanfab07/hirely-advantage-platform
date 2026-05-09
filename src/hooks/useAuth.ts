import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthState = {
  session: Session | null;
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthState | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const applySession = (sess: Session | null) => {
      if (!active) return;
      setSession(sess);
      setUser(sess?.user ?? null);
      setLoading(false);
    };

    // Listener FIRST so OAuth/session callbacks cannot race the initial read.
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      applySession(sess);
    });

    // Then hydrate the existing session. Never leave the UI blank if this fails.
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => applySession(session))
      .catch(() => applySession(null));

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return createElement(AuthContext.Provider, {
    value: { session, user, loading },
    children,
  });
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
