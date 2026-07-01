"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Minus, ChevronLeft, ChevronRight, Lock, Ban } from "lucide-react";
import { 
  format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isBefore, isAfter, startOfToday, addMonths, subMonths, parseISO
} from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function MatrixPage() {
  const [habits, setHabits] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = startOfToday();
  const todayStr = format(today, "yyyy-MM-dd");

  async function fetchData() {
    const token = localStorage.getItem("token");
    try {
      const habitsRes = await fetch(`${API}/habits/?archived=false`, {
          headers: { "Authorization": `Bearer ${token}` }
      });
      const habitsData = await habitsRes.json();
      if (!Array.isArray(habitsData)) return;

      const allLogs = await Promise.all(
        habitsData.map((h: any) => fetch(`${API}/habits/${h.id}/logs`, {
            headers: { "Authorization": `Bearer ${token}` }
        }).then((r) => r.json()))
      );
      setHabits(habitsData); setLogs(allLogs.flat());
    } catch (e) { console.error("Fetch error:", e); }
  }

  useEffect(() => { fetchData(); }, []);

  const daysInMonth = useMemo(() => eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  }), [currentMonth]);

  const hasUserActiveToday = useMemo(() => {
    return logs.some(l => l.date === todayStr && (l.status === "done" || l.status === "missed"));
  }, [logs, todayStr]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="max-w-7xl mx-auto space-y-6 p-4 pb-24"
    >
      
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase text-primary italic">Consistency Matrix</h1>
          <p className="text-muted-foreground font-medium uppercase tracking-widest text-[10px]">Synced history of your Dashboard decisions.</p>
        </div>
        <div className="flex items-center gap-4 bg-card border-2 border-black dark:border-white/10 rounded-2xl p-2 shadow-xl">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="hover:bg-primary/10 rounded-xl"><ChevronLeft /></Button>
          <span className="font-black text-sm uppercase min-w-[140px] text-center tracking-widest">{format(currentMonth, "MMMM yyyy")}</span>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="hover:bg-primary/10 rounded-xl"><ChevronRight /></Button>
        </div>
      </div>

      {/* MATRIX CARD */}
      <Card className="border-2 border-black dark:border-white/10 shadow-2xl bg-card/40 backdrop-blur-xl overflow-visible transition-all duration-300 hover:-translate-y-1 hover:shadow-primary/5">
        <CardContent className="p-0 overflow-visible">
          
          <div className="classic-scroll-container">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/50 border-b-2 border-black dark:border-white/10">
                  <th className="sticky left-0 z-20 bg-card/90 backdrop-blur-md p-6 text-left font-black uppercase text-[10px] tracking-[0.2em] min-w-[200px] border-r-2 border-black dark:border-white/10">Habit Name</th>
                  {daysInMonth.map((d) => (
                    <th key={d.toString()} className="p-4 text-center min-w-[55px]">
                      <div className="text-[9px] font-black opacity-40 uppercase mb-1">{format(d, "EEE")}</div>
                      <div className={cn(
                          "text-xs font-black p-2 rounded-lg transition-all",
                          isSameDay(d, today) ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "text-muted-foreground"
                      )}>
                          {format(d, "d")}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black dark:divide-white/10">
                {habits.map((h) => (
                  <tr key={h.id} className="group hover:bg-muted/5 transition-all">
                    <td className="sticky left-0 z-10 bg-card/90 backdrop-blur-md p-5 font-bold text-xl border-r-2 border-black dark:border-white/10 group-hover:text-primary transition-colors">
                      {h.name}
                    </td>
                    {daysInMonth.map((d) => {
                      const dateStr = format(d, "yyyy-MM-dd");
                      const habitCreatedDate = parseISO(h.created_at);
                      const log = logs.find((l) => l.habit_id === h.id && l.date === dateStr);
                      const status = log?.status || "-";
                      const isPast = isBefore(d, today);
                      const isToday = isSameDay(d, today);
                      const isFuture = isAfter(d, today);
                      const isBeforeCreation = isBefore(d, habitCreatedDate) && !isSameDay(d, habitCreatedDate);

                      let cellUI = { color: "bg-muted/10", icon: null, shadow: "" };

                      // 1. FUTURE OR SYSTEM LOCKED (RESTORED ORIGINAL STYLE)
                      if (isFuture || isBeforeCreation) {
                          cellUI = { 
                            color: "bg-rose-500/10 border border-rose-500/20 rounded-full scale-75", 
                            icon: <Lock className="h-3.5 w-3.5 text-rose-500/50" />, 
                            shadow: "" 
                          };
                      } 
                      // 2. DONE
                      else if (status === "done") {
                          cellUI = { color: "bg-emerald-500", icon: <Check className="text-white h-6 w-6 stroke-[4px]" />, shadow: "shadow-green-500/40 shadow-lg scale-105" };
                      } 
                      // 3. MISSED
                      else if (status === "missed") {
                          cellUI = { color: "bg-red-500", icon: <X className="text-white h-6 w-6 stroke-[4px]" />, shadow: "shadow-red-500/40 shadow-lg scale-105" };
                      } 
                      // 4. NULL LOG LOGIC
                      else if (status === "-") {
                          if (isPast) {
                              const didParticipate = logs.some(l => l.date === dateStr && l.status === "done");
                              if (didParticipate) {
                                  cellUI = { color: "bg-red-500/90", icon: <X className="text-white h-5 w-5 stroke-[3px]" />, shadow: "shadow-sm" };
                              } else {
                                  // NO ACTIVITY (PREMIUM NEUTRAL INDIGO)
                                  cellUI = { 
                                    color: "bg-indigo-500/10 border border-indigo-500/20 rounded-xl", 
                                    icon: <Ban className="h-4 w-4 text-indigo-500/40" />, 
                                    shadow: "" 
                                  };
                              }
                          } else if (isToday) {
                              if (hasUserActiveToday) {
                                  cellUI = { color: "bg-amber-500", icon: <Minus className="text-white h-6 w-6 stroke-[4px]" />, shadow: "shadow-amber-500/40 shadow-lg scale-105" };
                              } else {
                                  cellUI = { color: "bg-card border-2 border-primary/20", icon: <div className="h-2 w-2 rounded-full bg-primary/60 animate-pulse" />, shadow: "" };
                              }
                          }
                      }

                      return (
                        <td key={dateStr} className="p-3 text-center">
                          <div className={cn("h-10 w-10 mx-auto rounded-xl flex items-center justify-center transition-all duration-300", cellUI.color, cellUI.shadow)}>
                            {cellUI.icon}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* FOOTER: SCROLL HINT & LEGEND */}
      <div className="flex flex-col items-center gap-8 mt-6">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground animate-pulse text-center">
            ← Scroll horizontally to explore your history →
          </p>

          <div className="flex flex-wrap items-center justify-center gap-8 p-8 bg-card border-2 border-black dark:border-white/10 rounded-[2.5rem] shadow-2xl w-full">
              <LegendItem icon={<Check className="h-2 w-2 text-white stroke-[4px]" />} color="bg-emerald-500" label="Done" />
              <LegendItem icon={<X className="h-2 w-2 text-white stroke-[4px]" />} color="bg-red-500" label="Missed" />
              <LegendItem icon={<Minus className="h-2 w-2 text-white stroke-[4px]" />} color="bg-amber-500" label="Today" />
              <LegendItem icon={<Ban className="h-2 w-2 text-indigo-500/60" />} color="bg-indigo-500/10 border border-indigo-500/20" label="No Activity" />
              <LegendItem icon={<Lock className="h-2 w-2 text-rose-500/50" />} color="bg-rose-500/10 border border-rose-500/20 rounded-full" label="Locked" />
          </div>
      </div>

      <style jsx global>{`
        .classic-scroll-container {
          overflow-x: scroll !important;
          width: 100%;
          padding-bottom: 5px;
        }
        .classic-scroll-container::-webkit-scrollbar { height: 18px !important; display: block !important; }
        .classic-scroll-container::-webkit-scrollbar-track { background-color: #f1f1f1 !important; border: 1px solid #d1d1d1 !important; border-radius: 10px; }
        .classic-scroll-container::-webkit-scrollbar-thumb { background-color: #c1c1c1 !important; border: 1px solid #a1a1a1 !important; background-image: linear-gradient(to bottom, #eeeeee 0%, #cccccc 100%); border-radius: 10px; }
        .classic-scroll-container::-webkit-scrollbar-button:single-button { background-color: #f1f1f1; display: block; border: 1px solid #d1d1d1; height: 18px; width: 18px; }
        .classic-scroll-container::-webkit-scrollbar-button:single-button:horizontal:decrement { background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none'><path d='M11 5l-4 4 4 4' stroke='black' stroke-width='2'/></svg>"); }
        .classic-scroll-container::-webkit-scrollbar-button:single-button:horizontal:increment { background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='18' height='18' fill='none'><path d='M7 5l4 4-4 4' stroke='black' stroke-width='2'/></svg>"); }
      `}</style>
    </motion.div>
  );
}

function LegendItem({ icon, color, label }: any) {
    return (
        <div className="flex items-center gap-3">
            <div className={cn("h-5 w-5 rounded-lg shadow-lg flex items-center justify-center transition-transform hover:scale-110", color)}>
                {icon}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-foreground">{label}</span>
        </div>
    )
}