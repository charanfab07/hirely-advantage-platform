import { createContext, createElement, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
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

  const syncSession = useCallback(async () => {
    try {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!currentSession) {
        setSession(null);
        setUser(null);
        setLoading(false);
        return;
      }

      const {
        data: { user: confirmedUser },
        error,
      } = await supabase.auth.getUser();

      if (error || !confirmedUser) {
        setSession(null);
        setUser(null);
      } else {
        setSession(currentSession);
        setUser(confirmedUser);
      }
    } catch {
      setSession(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

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
      window.setTimeout(() => {
        if (active) void syncSession();
      }, 0);
    });

    // Then hydrate the existing session. Never leave the UI blank if this fails.
    void syncSession();

    const onFocus = () => void syncSession();
    const onVisible = () => {
      if (document.visibilityState === "visible") void syncSession();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      active = false;
      sub.subscription.unsubscribe();
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [syncSession]);

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
