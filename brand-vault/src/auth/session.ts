import { isTokenExpired } from "./jwt";

export interface AuthUser {
  id: number;
  UserName: string;
  email: string;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export type LogoutReason = "expired";

const STORAGE_KEY = "brandvault.session";

type Listener = () => void;
const listeners = new Set<Listener>();

let current: Session | null = readStoredSession();
let lastLogoutReason: LogoutReason | null = null;

function readStoredSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    if (!session.accessToken || !session.refreshToken || isTokenExpired(session.refreshToken)) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function emit() {
  listeners.forEach((listener) => listener());
}

export const sessionStore = {
  get(): Session | null {
    return current;
  },

  set(session: Session) {
    current = session;
    lastLogoutReason = null;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    emit();
  },

  clear(reason?: LogoutReason) {
    if (!current) return;
    current = null;
    lastLogoutReason = reason ?? null;
    localStorage.removeItem(STORAGE_KEY);
    emit();
  },

  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  consumeLogoutReason(): LogoutReason | null {
    const reason = lastLogoutReason;
    lastLogoutReason = null;
    return reason;
  },
};

window.addEventListener("storage", (event) => {
  if (event.key !== STORAGE_KEY) return;
  current = readStoredSession();
  emit();
});
