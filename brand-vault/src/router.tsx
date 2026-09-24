import { createBrowserRouter, Navigate } from "react-router";
import { AppLayout } from "./layouts/AppLayout";
import { BrandKitPage } from "./pages/BrandKitPage";
import { LibraryPage } from "./pages/LibraryPage";
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
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/", element: <Navigate to="/library" replace /> },
          { path: "/brand", element: <BrandKitPage /> },
          { path: "/library", element: <LibraryPage /> },
          { path: "/library/:folderId", element: <LibraryPage /> },
        ],
      },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
