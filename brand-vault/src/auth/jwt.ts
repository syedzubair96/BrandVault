export function getTokenExpiry(token: string): number | null {
  try {
    const payload = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const { exp } = JSON.parse(atob(payload)) as { exp?: unknown };
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string, marginMs = 0): boolean {
  const expiry = getTokenExpiry(token);
  return expiry !== null && expiry - Date.now() <= marginMs;
}
