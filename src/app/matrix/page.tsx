"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Minus, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  isBefore, 
  isAfter,
  startOfToday,
  addMonths,
  subMonths
} from "date-fns";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Habit {
  id: number;
  name: string;
  color: string;
}

interface Log {
  id: number;
  habit_id: number;
  date: string;
  status: string;
}

export default function MatrixPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = startOfToday();
  const todayStr = format(today, "yyyy-MM-dd");

  async function fetchData() {
    try {
      const habitsRes = await fetch(`${API}/habits/?archived=false`);
      const habitsData = await habitsRes.json();
      const allLogs = await Promise.all(
        habitsData.map((h: Habit) => fetch(`${API}/habits/${h.id}/logs`).then((r) => r.json()))
      );
      setHabits(habitsData);
      setLogs(allLogs.flat());
    } catch (e) {
      console.error("Fetch error:", e);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  const daysInMonth = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(currentMonth),
      end: endOfMonth(currentMonth),
    });
  }, [currentMonth]);

  const hasUserActiveToday = useMemo(() => {
    return logs.some(l => l.date === todayStr && (l.status === "done" || l.status === "missed"));
  }, [logs, todayStr]);

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in zoom-in duration-500 p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tighter uppercase text-primary">Consistency Matrix</h1>
          <p className="text-muted-foreground font-medium">Synced history of your Dashboard decisions.</p>
        </div>
        <div className="flex items-center gap-4 bg-card border-2 rounded-2xl p-2 shadow-xl">
          <Button variant="ghost" size="icon" onClick={prevMonth} className="hover:bg-primary/10 rounded-xl"><ChevronLeft /></Button>
          <span className="font-black text-sm uppercase min-w-[140px] text-center tracking-widest">{format(currentMonth, "MMMM yyyy")}</span>
          <Button variant="ghost" size="icon" onClick={nextMonth} className="hover:bg-primary/10 rounded-xl"><ChevronRight /></Button>
        </div>
      </div>

      <Card className="border-2 shadow-2xl overflow-hidden bg-card/40 backdrop-blur-xl">
        <CardContent className="p-0 overflow-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b-2">
                <th className="sticky left-0 z-20 bg-card/90 backdrop-blur-md p-6 text-left font-black uppercase text-[10px] tracking-[0.2em] min-w-[200px] border-r">Habit Name</th>
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
            <tbody className="divide-y-2">
              {habits.map((h) => (
                <tr key={h.id} className="group hover:bg-muted/10 transition-all">
                  <td className="sticky left-0 z-10 bg-card/90 backdrop-blur-md p-5 font-bold text-xl border-r group-hover:text-primary transition-colors">
                    {h.name}
                  </td>
                  {daysInMonth.map((d) => {
                    const dateStr = format(d, "yyyy-MM-dd");
                    const log = logs.find((l) => l.habit_id === h.id && l.date === dateStr);
                    const status = log?.status || "-";
                    const isPast = isBefore(d, today);
                    const isToday = isSameDay(d, today);
                    const isFuture = isAfter(d, today);

                    let cellUI = { color: "bg-muted/10", icon: null, shadow: "" };

                    // NEW LOGIC: If it's a future date, IGNORE DB and show as Planned
                    if (isFuture) {
                        cellUI = { color: "bg-muted/10 border-2 border-dashed border-muted/50", icon: null, shadow: "" };
                    } 
                    else if (status === "done") {
                        cellUI = { color: "bg-green-500", icon: <Check className="text-white h-6 w-6 stroke-[4px]" />, shadow: "shadow-green-500/40 shadow-lg scale-105" };
                    } else if (status === "missed") {
                        cellUI = { color: "bg-red-500", icon: <X className="text-white h-6 w-6 stroke-[4px]" />, shadow: "shadow-red-500/40 shadow-lg scale-105" };
                    } else if (status === "-") {
                        if (isPast) {
                            cellUI = { color: "bg-red-500/10", icon: <Lock className="h-4 w-4 text-red-500/30" />, shadow: "" };
                        } else if (isToday) {
                            if (hasUserActiveToday) {
                                cellUI = { color: "bg-amber-500", icon: <Minus className="text-white h-6 w-6 stroke-[4px]" />, shadow: "shadow-amber-500/40 shadow-lg scale-105" };
                            } else {
                                cellUI = { color: "bg-muted/20 border-2 border-primary/20", icon: <div className="h-2 w-2 rounded-full bg-primary animate-ping" />, shadow: "" };
                            }
                        }
                    }

                    return (
                      <td key={dateStr} className="p-3 text-center">
                        <div className={cn(
                            "h-10 w-10 mx-auto rounded-xl flex items-center justify-center transition-all duration-300",
                            cellUI.color,
                            cellUI.shadow
                        )}>
                          {cellUI.icon}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-6 p-6 bg-card border-2 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-lg bg-green-500"></div> 
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Achieved</span>
        </div>
        <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-lg bg-red-500"></div> 
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Failed</span>
        </div>
        <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-lg bg-amber-500"></div> 
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Skipped</span>
        </div>
        <div className="flex items-center gap-3 border-l pl-6">
            <div className="w-5 h-5 rounded-lg bg-muted border-2 border-dashed"></div> 
            <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Planned Future</span>
        </div>
      </div>
    </div>
  );
}