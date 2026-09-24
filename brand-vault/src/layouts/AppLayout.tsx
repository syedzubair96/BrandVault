import { FolderOpen, LogOut, Palette, type LucideIcon } from "lucide-react";
import { NavLink, Outlet } from "react-router";
import { useLogout } from "../auth/useLogout";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const nav_items: NavItem[] = [
  { to: "/brand", label: "Brand Kit", icon: Palette },
  { to: "/library", label: "Asset Library", icon: FolderOpen },
];

const itemBase =
  "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors";

export function AppLayout() {
  const logout = useLogout();

  return (
    <div className="flex h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r border-slate-200 bg-white">
        <div className="px-5 py-5">
          <span className="text-lg font-bold text-slate-900">BrandVault</span>
        </div>

        <nav className="flex-1 space-y-1 px-3">
            {nav_items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `${itemBase} ${
                  isActive
                    ? "bg-slate-100 "
                    : "hover:bg-slate-100"
                }`
              }
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-3">
          <button
            type="button"
            onClick={logout}
            className={`${itemBase} text-slate-600 hover:bg-red-50 hover:text-red-700`}
          >
            <LogOut className="size-4" aria-hidden />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
