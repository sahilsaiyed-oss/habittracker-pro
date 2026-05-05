"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListChecks,
  BarChart3,
  Grid3X3,
  Settings,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Habits", href: "/habits", icon: ListChecks },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Matrix", href: "/matrix", icon: Grid3X3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r bg-card flex flex-col">
      <div className="p-6 flex items-center gap-2">
        <Flame className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold tracking-tight">Habit Tracker Pro</span>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
