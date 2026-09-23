import { RouterProvider } from "react-router";
import { AuthProvider } from "./auth/AuthProvider";
import { router } from "./router";

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;
