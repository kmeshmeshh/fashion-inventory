"use client";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { useRouter, usePathname } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  DollarSign,
  Truck,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/inventory", label: "المخزن", icon: Package },
  { href: "/orders", label: "الطلبات", icon: ShoppingCart },
  { href: "/expenses", label: "المصاريف", icon: DollarSign },
  { href: "/shipments", label: "الشحنات", icon: Truck },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen bg-zinc-950">
        {/* Sidebar skeleton */}
        <aside className="hidden md:flex w-56 bg-zinc-900 border-r border-zinc-800 flex-col p-4 gap-2">
          <Skeleton className="h-7 w-28 bg-zinc-800 mb-6" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 bg-zinc-800 rounded-lg" />
          ))}
        </aside>
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-zinc-500 text-sm">جاري التحميل...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!user) return null;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <div className="flex min-h-screen bg-zinc-950">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 bg-zinc-900 border-r border-zinc-800 flex-col">
        {/* Brand */}
        <div className="px-4 py-5 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0">
              👗
            </div>
            <span className="font-semibold text-white text-sm tracking-tight">
              Fashion Mgmt
            </span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <a
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  active
                    ? "bg-indigo-600/10 text-indigo-400"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800",
                )}
              >
                <Icon
                  className={cn(
                    "w-4 h-4 shrink-0",
                    active ? "text-indigo-400" : "text-zinc-500",
                  )}
                />
                {label}
                {active && (
                  <div className="ml-auto w-1 h-4 bg-indigo-500 rounded-full" />
                )}
              </a>
            );
          })}
        </nav>

        {/* User Footer */}
        <div className="px-3 py-4 border-t border-zinc-800">
          <div className="flex items-center gap-2.5 px-2 mb-3">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarFallback className="bg-indigo-600/20 text-indigo-400 text-xs font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-semibold text-zinc-200 truncate">
                {user.name}
              </p>
              <p className="text-[10px] text-zinc-600 truncate">{user.email}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full justify-start gap-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 text-xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            تسجيل الخروج
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-20 bg-zinc-900/90 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
          <span className="font-semibold text-white text-sm">
            {links.find((l) => l.href === pathname)?.label || "Fashion Mgmt"}
          </span>
          <Avatar className="h-7 w-7">
            <AvatarFallback className="bg-indigo-600/20 text-indigo-400 text-xs font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>

        <div className="p-4 md:p-6 pb-24 md:pb-6">{children}</div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-zinc-900/95 backdrop-blur-md border-t border-zinc-800 safe-area-pb">
        <div className="grid grid-cols-5 h-16">
          {links.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <a
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                  active
                    ? "text-indigo-400"
                    : "text-zinc-600 hover:text-zinc-400",
                )}
              >
                <div
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    active && "bg-indigo-600/10",
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5",
                      active ? "text-indigo-400" : "text-zinc-500",
                    )}
                  />
                </div>
                <span>{label}</span>
              </a>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
