import { createBrowserRouter, Navigate } from "react-router";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { PublicOnlyRoute } from "./routes/PublicOnlyRoute";

export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [{ path: "/login", element: <LoginPage /> }],
  },
  {
    element: <ProtectedRoute />,
    children: [{ path: "/", element: <HomePage /> }],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
