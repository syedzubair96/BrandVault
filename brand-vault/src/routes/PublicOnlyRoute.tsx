import { Navigate, Outlet } from "react-router";
import { useAuth } from "../auth/useAuth";

export function PublicOnlyRoute() {
  const { token } = useAuth();

  if (token) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
