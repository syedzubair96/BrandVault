import { useCallback } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "./useAuth";

export function useLogout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return useCallback(async () => {
    await logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);
}
