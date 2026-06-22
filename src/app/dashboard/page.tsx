"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Target, TrendingUp, CheckCircle2, Clock, Check, X, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, startOfToday } from "date-fns";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function DashboardPage() {
  const [habits, setHabits] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const todayStr = format(startOfToday(), "yyyy-MM-dd");

  async function fetchData() {
    try {
      const habitsRes = await fetch(`${API}/habits/?archived=false`);
      const habitsData = await habitsRes.json();
      const allLogs = await Promise.all(habitsData.map((h: any) => fetch(`${API}/habits/${h.id}/logs`).then((r) => r.json())));
      setHabits(habitsData); setLogs(allLogs.flat());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  useEffect(() => { fetchData(); }, []);

  const todayLogs = logs.filter((l) => l.date === todayStr);
  const doneToday = todayLogs.filter((l) => l.status === "done").length;
  const progress = habits.length > 0 ? Math.round((doneToday / habits.length) * 100) : 0;

  if (loading) return <div className="p-20 text-center text-2xl font-black animate-pulse uppercase">Syncing Command Center...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-10 p-4 animate-in fade-in duration-700">
      <motion.header initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }}>
        <h1 className="text-6xl font-black tracking-tighter text-primary">COMMAND CENTER</h1>
        <p className="text-muted-foreground font-bold uppercase tracking-[0.3em] text-xs ml-1">Live Feed: {format(startOfToday(), "EEEE, MMM do")}</p>
      </motion.header>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-4">
        {[
          { label: "Active", val: habits.length, icon: Target, cls: "bg-blue-600 shadow-blue-500/40" },
          { label: "Achieved", val: doneToday, icon: CheckCircle2, cls: "bg-emerald-600 shadow-emerald-500/40" },
          { label: "Daily Goal", val: `${progress}%`, icon: TrendingUp, cls: "bg-violet-600 shadow-violet-500/40" },
          { label: "Streak", val: "1 Day", icon: Flame, cls: "bg-orange-600 shadow-orange-500/40" }
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}>
            <Card className={cn("border-none text-white shadow-2xl relative overflow-hidden group", stat.cls)}>
              <stat.icon className="absolute -right-4 -bottom-4 h-24 w-24 opacity-15 rotate-12 group-hover:scale-110 group-hover:rotate-0 transition-all duration-500" />
              <CardContent className="p-6 z-10 relative">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">{stat.label}</p>
                <p className="text-5xl font-black italic">{stat.val}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                <div className="h-8 w-2 bg-primary rounded-full" /> Today's Status
            </h2>
            <div className="grid gap-4">
                {habits.map((h, i) => {
                    const status = todayLogs.find((l) => l.habit_id === h.id)?.status || "-";
                    return (
                    <motion.div key={h.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                        <Card className={cn(
                            "border-2 transition-all duration-500 rounded-[2rem] overflow-hidden",
                            status === "done" ? "border-emerald-500/50 bg-emerald-500/5" : 
                            status === "missed" ? "border-red-500/50 bg-red-500/5" : "border-muted bg-card"
                        )}>
                        <CardContent className="p-6 flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className={cn(
                                    "h-16 w-16 rounded-2xl flex items-center justify-center text-3xl font-black text-white shadow-2xl transition-transform hover:rotate-6",
                                    h.color === 'emerald' ? 'bg-emerald-500' : 
                                    h.color === 'violet' ? 'bg-violet-500' : 'bg-rose-500'
                                )}>
                                    {h.name[0]}
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black tracking-tighter">{h.name}</h3>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Protocol Active</p>
                                </div>
                            </div>

                            {/* READ ONLY STATUS BADGE */}
                            <div className="flex items-center">
                                {status === "done" ? (
                                    <div className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-2 rounded-full font-black text-sm shadow-lg shadow-emerald-500/40">
                                        <Check className="stroke-[4px] h-4 w-4" /> DONE
                                    </div>
                                ) : status === "missed" ? (
                                    <div className="flex items-center gap-2 bg-red-500 text-white px-6 py-2 rounded-full font-black text-sm shadow-lg shadow-red-500/40">
                                        <X className="stroke-[4px] h-4 w-4" /> MISSED
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 bg-muted text-muted-foreground px-6 py-2 rounded-full font-black text-sm border-2 border-dashed border-muted-foreground/20">
                                        <Clock className="h-4 w-4" /> PENDING
                                    </div>
                                )}
                            </div>
                        </CardContent>
                        </Card>
                    </motion.div>
                    )
                })}
            </div>
        </div>

        <div className="space-y-6">
            <h2 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
                <div className="h-8 w-2 bg-primary rounded-full" /> Total Surge
            </h2>
            <Card className="border-none rounded-[3rem] bg-zinc-900 text-white shadow-2xl p-10 overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent opacity-50" />
                <div className="relative z-10 text-center space-y-6">
                    <motion.p 
                        key={progress}
                        initial={{ scale: 1.5, color: "#fff" }}
                        animate={{ scale: 1 }}
                        className="text-8xl font-black tracking-tighter"
                    >
                        {progress}%
                    </motion.p>
                    <p className="text-xs font-black uppercase tracking-[0.4em] text-primary">System Integrity</p>
                    <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden p-0.5 border border-white/5">
                        <motion.div 
                            className="h-full bg-primary rounded-full shadow-[0_0_20px_var(--primary)]"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1.5, ease: "anticipate" }}
                        />
                    </div>
                </div>
            </Card>
            <p className="text-center text-[10px] font-bold text-muted-foreground uppercase tracking-tighter px-10">
                Update status in the Habit Inventory to see changes here.
            </p>
        </div>
      </div>
    </div>
  );
}