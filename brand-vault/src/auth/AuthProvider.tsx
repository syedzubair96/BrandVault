import { useCallback, useMemo, useState, type ReactNode } from "react";
import { AuthContext, type AuthUser } from "./auth-context";

const STORAGE_KEY = "brandvault.session";

interface Session {
  token: string;
  user: AuthUser;
}

function readSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

async function mockLogin(email: string, password: string): Promise<Session> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  if (!email || !password) {
    throw new Error("Email and password are required.");
  }
  return { token: "mock-token", user: { email } };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(readSession);

  const login = useCallback(async (email: string, password: string) => {
    const loginResponse = await mockLogin(email, password);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loginResponse));
    setSession(loginResponse);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      login,
      logout,
    }),
    [session, login, logout],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
