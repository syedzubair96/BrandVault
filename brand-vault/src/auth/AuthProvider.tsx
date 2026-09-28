import { useCallback, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import * as authApi from "../api/auth";
import { AuthContext } from "./auth-context";
import { getTokenExpiry } from "./jwt";
import { sessionStore } from "./session";

// setTimeout overflows above ~24.8 days.
const MAX_TIMER_MS = 2_147_483_647;

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSyncExternalStore(sessionStore.subscribe, sessionStore.get);
  const refreshToken = session?.refreshToken;

  useEffect(() => {
    if (!refreshToken) return;
    const expiry = getTokenExpiry(refreshToken);
    if (expiry === null) return;
    const timer = window.setTimeout(
      () => sessionStore.clear("expired"),
      Math.min(Math.max(expiry - Date.now(), 0), MAX_TIMER_MS),
    );
    return () => window.clearTimeout(timer);
  }, [refreshToken]);

  const login = useCallback(async (email: string, password: string) => {
    sessionStore.set(await authApi.login(email, password));
  }, []);

  const register = useCallback(async (input: authApi.RegisterInput) => {
    sessionStore.set(await authApi.register(input));
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // The local session is cleared regardless; the refresh token expires on its own.
    } finally {
      sessionStore.clear();
    }
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      isAuthenticated: session !== null,
      login,
      register,
      logout,
    }),
    [session, login, register, logout],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
