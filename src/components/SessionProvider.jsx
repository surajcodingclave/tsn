"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

const SessionContext = createContext({ session: null, tenant: null, role: null, loading: true, refresh: async () => {} });

export function SessionProvider({ children }) {
  const [state, setState] = useState({ session: null, tenant: null, role: null, loading: true });

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (res.status === 401) {
        setState({ session: null, tenant: null, role: null, loading: false });
        return null;
      }
      const data = await res.json();
      setState({ session: data.user, tenant: data.tenant, role: data.role, token: data.token, loading: false });
      return data;
    } catch {
      setState({ session: null, tenant: null, role: null, loading: false });
      return null;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return <SessionContext.Provider value={{ ...state, refresh }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}