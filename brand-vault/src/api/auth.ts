import type { Session } from "../auth/session";
import { apiRequest } from "./client";

export function login(email: string, password: string) {
  return apiRequest<Session>("/auth/login", {
    method: "POST",
    body: { email, password },
    auth: false,
  });
}

export interface RegisterInput {
  UserName: string;
  email: string;
  password: string;
}

export function register(input: RegisterInput) {
  return apiRequest<Session>("/auth/register", {
    method: "POST",
    body: input,
    auth: false,
  });
}

export function logout() {
  return apiRequest<void>("/auth/logout", { method: "POST" });
}
