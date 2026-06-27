"use client";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";

function NavItem({
  href,
  label,
  icon,
  active,
  onLogout,
}: {
  href?: string;
  label: string;
  icon: string;
  active?: boolean;
  onLogout?: () => void;
}) {
  const baseClass =
    "flex flex-col items-center justify-center gap-1 px-2 py-2 text-xs font-medium transition";

  const activeClass = active
    ? "text-blue-600"
    : "text-gray-600 dark:text-gray-300";

  if (!href) {
    return (
      <button
        type="button"
        onClick={onLogout}
        className={baseClass + " " + activeClass}
      >
        <span className="text-lg">{icon}</span>
        <span>{label}</span>
      </button>
    );
  }

  return (
    <a href={href} className={baseClass + " " + activeClass}>
      <span className="text-lg">{icon}</span>
      <span>{label}</span>
    </a>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4 mx-auto" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/inventory", label: "Inventory", icon: "📦" },
    { href: "/orders", label: "Orders", icon: "🛒" },
    { href: "/expenses", label: "Expenses", icon: "💰" },
    { href: "/shipments", label: "Shipments", icon: "📦" },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex min-h-screen">
        {/* Desktop Sidebar (hidden on mobile) */}
        <aside className="hidden md:flex w-64 bg-gray-800 text-white p-4 flex-col">
          <h1 className="text-2xl font-bold mb-8">👗 Inventory</h1>

          <nav className="space-y-2 flex-1">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <a
                  key={l.href}
                  href={l.href}
                  className={
                    "block px-4 py-2 rounded transition " +
                    (active ? "bg-gray-700" : "hover:bg-gray-700")
                  }
                >
                  <span className="mr-2">{l.icon}</span>
                  {l.label === "Shipments" ? "الشحنات" : l.label}
                </a>
              );
            })}
          </nav>

          <div className="border-t border-gray-700 pt-4">
            <p className="text-sm font-medium mb-2">👤 {user.name}</p>
            <p className="text-xs text-gray-400 mb-4">{user.email}</p>
            <button
              onClick={handleLogout}
              className="w-full bg-red-600 hover:bg-red-700 px-4 py-2 rounded transition text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto pb-16 md:pb-8">
          <div className="p-4 md:p-8">{children}</div>
        </main>
      </div>

      {/* Mobile Bottom Nav (like Facebook) */}
      <nav className="fixed left-0 right-0 bottom-0 md:hidden bg-white border-t border-gray-200">
        <div className="grid grid-cols-5">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <div key={l.href} className="flex justify-center">
                <NavItem
                  href={l.href}
                  icon={l.icon}
                  label={l.label === "Shipments" ? "شحن" : l.label}
                  active={active}
                />
              </div>
            );
          })}
          {/* optional: logout not in bottom bar to keep 5 slots */}
        </div>
      </nav>
    </div>
  );
}
