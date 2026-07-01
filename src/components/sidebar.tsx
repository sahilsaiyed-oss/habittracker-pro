"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, ListChecks, BarChart3, Grid3X3, Settings, 
  Flame, Target, LogOut, FileText, Brain, PenTool, Eye, Zap 
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Habit Inventory", href: "/habits", icon: ListChecks },
  { name: "Missions", href: "/goals", icon: Target },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Habit Calendar", href: "/matrix", icon: Grid3X3 },
  { name: "Reviews & Reports", href: "/reports", icon: FileText },
  { name: "Journal", href: "/journal", icon: PenTool },
  { name: "Motivation Hub", href: "/motivation", icon: Eye },
  { name: "AI Coach", href: "/ai-coach", icon: Brain },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem("token");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    window.location.href = "/login";
  };

  return (
    <aside className="w-64 border-r bg-card flex flex-col h-screen sticky top-0 shadow-sm border-border/40">
      <div className="p-8 flex items-center gap-3">
        <div className="h-10 w-10 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
            <Flame className="h-6 w-6 text-primary-foreground" />
        </div>
        <span className="text-xl font-black tracking-tighter uppercase italic text-foreground">Habit Pro</span>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
        <p className="px-4 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-4">Operations</p>
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200",
                active ? "bg-foreground text-background shadow-xl" : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "stroke-[3px]" : "stroke-[2px]")} />
              {item.name}
            </Link>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-border/40">
        <button onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-xs font-black text-red-500 hover:bg-red-50 transition-all">
          <LogOut className="h-4 w-4" /> TERMINATE SESSION
        </button>
      </div>
    </aside>
  );
}