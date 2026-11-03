"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getJSON, postJSON, putJSON } from "@/lib/client-api";

export interface AccountUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  addresses?: { line1: string; line2?: string; city: string; state: string; pincode: string }[];
  createdAt?: string;
}

interface Session {
  user: AccountUser | null;
  isAdmin: boolean;
  /** secret admin URL segment — only present for allow-listed admin emails */
  adminPath?: string | null;
}

interface AuthContextValue extends Session {
  loading: boolean;
  login: (email: string, password: string) => Promise<Session>;
  register: (data: { name: string; email: string; phone?: string; password: string }) => Promise<Session>;
  logout: () => Promise<void>;
  update: (data: Record<string, unknown>) => Promise<Session>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const SIGNED_OUT: Session = { user: null, isAdmin: false };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session>(SIGNED_OUT);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setSession(await getJSON<Session>("/auth/me"));
    } catch {
      setSession(SIGNED_OUT);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial session check after mount; refresh() only sets state once the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  const value = useMemo<AuthContextValue>(() => {
    const apply = (s: Session) => {
      setSession(s);
      return s;
    };
    return {
      ...session,
      loading,
      refresh,
      login: async (email, password) => apply(await postJSON<Session>("/auth/login", { email, password })),
      register: async (data) => apply(await postJSON<Session>("/auth/register", data)),
      update: async (data) => apply(await putJSON<Session>("/auth/me", data)),
      logout: async () => {
        await postJSON("/auth/logout", {});
        setSession(SIGNED_OUT);
      },
    };
  }, [session, loading, refresh]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
