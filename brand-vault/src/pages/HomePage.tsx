import { useLogout } from "../auth/useLogout";

export function HomePage() {

  const logout = useLogout();
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <h1 className="text-3xl font-bold text-slate-900">Hello World</h1>
      <button
        onClick={logout}
        className="ml-4 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      >
        Logout
      </button>
    </div>
  );
}
