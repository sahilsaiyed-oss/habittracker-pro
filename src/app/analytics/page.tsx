"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";
import { motion } from "framer-motion";
import { TrendingUp, Calendar, Zap, Activity, Award, Brain, Target, ShieldCheck, Clock } from "lucide-react"; // CLOCK ADDED HERE
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch(`${API}/analytics/`)
      .then((r) => r.json())
      .then((d) => setData(d));
  }, []);

  // Logical Calculations
  const totalWeeklyDone = useMemo(() => {
    if (!data) return 0;
    return data.weekly_data.reduce((acc: number, curr: any) => acc + curr.done, 0);
  }, [data]);

  const performanceStatus = useMemo(() => {
    if (!data) return "ANALYZING";
    const rate = data.completion_rate;
    if (rate >= 90) return "ELITE";
    if (rate >= 70) return "OPTIMAL";
    if (rate >= 40) return "STABLE";
    return "RECOVERING";
  }, [data]);

  if (!data) return <div className="p-20 text-center font-black animate-pulse text-primary italic text-3xl uppercase">Connecting to Neural Link...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-10 p-6 pb-24 animate-in fade-in zoom-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-end border-b-8 border-primary pb-8">
        <div className="group">
          <h1 className="text-8xl font-black tracking-tighter uppercase leading-none italic group-hover:not-italic transition-all">Intelligence</h1>
          <p className="text-primary font-black uppercase tracking-[0.5em] text-xs mt-4 bg-primary/10 w-fit px-4 py-1 rounded-full border border-primary/20">Neural Performance Matrix</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-6xl font-black tracking-tighter text-emerald-500">{data.completion_rate}%</p>
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Global Efficiency</p>
        </div>
      </header>

      {/* 1. PERFORMANCE RINGS */}
      <div className="grid gap-6 md:grid-cols-3">
        {[
          { label: "Prior Cycle", val: 0, color: "#52525b", sub: "STAGNANT", icon: Clock },
          { label: "Current Cycle", val: data.completion_rate, color: "#8b5cf6", sub: "ACCELERATING", icon: Activity },
          { label: "Real-time", val: data.weekly_data[6].rate, color: "#10b981", sub: "PEAK VELOCITY", icon: Zap }
        ].map((ring, i) => (
          <motion.div key={ring.label} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}>
            <Card className="border-4 rounded-[3rem] bg-card shadow-2xl overflow-hidden group hover:border-primary/50 transition-all p-10 flex flex-col items-center relative">
              <ring.icon className="absolute top-6 right-6 h-5 w-5 opacity-20" />
              <div className="relative h-40 w-40 flex items-center justify-center mb-6">
                <svg className="h-full w-full rotate-[-90deg]" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/10" />
                  <motion.circle 
                    cx="18" cy="18" r="16" fill="none" 
                    stroke={ring.color} strokeWidth="4" strokeDasharray="100"
                    initial={{ strokeDashoffset: 100 }}
                    animate={{ strokeDashoffset: 100 - ring.val }}
                    transition={{ duration: 2.5, ease: "anticipate" }}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-black tracking-tighter">{Math.round(ring.val)}%</span>
                  <span className="text-[10px] font-black opacity-30 uppercase tracking-widest text-center italic">Level</span>
                </div>
              </div>
              <h3 className="font-black uppercase text-sm tracking-[0.2em]">{ring.label}</h3>
              <p className="text-[10px] font-black mt-2 px-4 py-1 rounded-full bg-muted border border-muted-foreground/10" style={{ color: ring.color }}>{ring.sub}</p>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* 2. YEARLY CONSISTENCY (HEATMAP) */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/30">
                <Calendar className="text-black h-6 w-6 stroke-[3px]" />
            </div>
            <h2 className="text-4xl font-black uppercase tracking-tighter italic">Consistency Infrastructure</h2>
        </div>
        
        <Card className="border-4 rounded-[3rem] p-10 bg-zinc-950 shadow-2xl relative overflow-hidden">
            <div className="absolute -bottom-10 -left-10 opacity-5">
                <Brain className="h-64 w-64 text-white" />
            </div>

            <div className="relative z-10 overflow-x-auto pb-4">
                <div className="flex flex-wrap gap-2.5 min-w-[800px] md:min-w-0">
                    {data.heatmap.map((cell: any) => {
                        let level = "bg-white/5"; 
                        let glow = "";
                        if (cell.intensity > 0 && cell.intensity < 0.3) level = "bg-emerald-900/40 border-emerald-800/30";
                        if (cell.intensity >= 0.3 && cell.intensity < 0.7) level = "bg-emerald-600/60 border-emerald-500/50";
                        if (cell.intensity >= 0.7) {
                            level = "bg-emerald-400 border-emerald-300";
                            glow = "shadow-[0_0_15px_#34d399]";
                        }
                        
                        return (
                            <motion.div
                                key={cell.date}
                                whileHover={{ scale: 1.8, y: -5, zIndex: 20 }}
                                className={cn("h-4 w-4 rounded-[3px] transition-all cursor-crosshair border", level, glow)}
                                title={`${cell.date}: ${Math.round(cell.intensity * 100)}%`}
                            />
                        );
                    })}
                </div>

                <div className="mt-12 flex flex-wrap items-center justify-between border-t border-white/10 pt-8 gap-4">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-3">
                            <div className="h-4 w-4 rounded-[3px] bg-white/5 border border-white/10" />
                            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Cold</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-4 w-4 rounded-[3px] bg-emerald-600/60" />
                            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Active</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="h-4 w-4 rounded-[3px] bg-emerald-400 shadow-[0_0_10px_#34d399]" />
                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest italic">On Fire</span>
                        </div>
                    </div>
                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Temporal Window: 90 Days</p>
                </div>
            </div>
        </Card>
      </section>

      {/* 3. SUCCESS VELOCITY CHART */}
      <Card className="border-4 rounded-[3rem] shadow-2xl bg-zinc-950 overflow-hidden group">
        <div className="p-8 flex items-center justify-between bg-zinc-900/80 border-b-2 border-white/5">
            <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-3xl bg-primary flex items-center justify-center shadow-[0_0_30px_var(--primary)] group-hover:rotate-6 transition-transform">
                    <TrendingUp className="text-black h-8 w-8 stroke-[4px]" />
                </div>
                <div>
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Success Velocity</h2>
                    <p className="text-[10px] font-bold text-primary tracking-[0.3em] uppercase opacity-70">Weekly Momentum Analysis</p>
                </div>
            </div>
            <div className="text-right">
                <span className="text-[10px] font-black text-white/40 block uppercase tracking-widest">Daily Average</span>
                <span className="text-3xl font-black text-emerald-500">{(totalWeeklyDone / 7).toFixed(1)}</span>
            </div>
        </div>
        <div className="h-96 w-full p-8 pt-12">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.weekly_data}>
              <defs>
                <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="#ffffff05" vertical={false} />
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#ffffff40', fontSize: 12, fontWeight: 900 }} 
                dy={15}
              />
              <YAxis hide domain={[0, 'dataMax + 1']} />
              <Tooltip 
                cursor={{ stroke: '#10b981', strokeWidth: 3, strokeDasharray: '5 5' }}
                content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                        return (
                            <div className="bg-white text-black p-6 rounded-[2rem] shadow-2xl border-8 border-emerald-500">
                                <p className="text-xs font-black uppercase opacity-40 mb-1">{payload[0].payload.date}</p>
                                <p className="text-4xl font-black tracking-tighter">{payload[0].value} DONE</p>
                                <div className="mt-2 h-1 w-full bg-emerald-500 rounded-full" />
                            </div>
                        );
                    }
                    return null;
                }}
              />
              <Area 
                type="stepAfter" 
                dataKey="done" 
                stroke="#10b981" 
                strokeWidth={8} 
                fillOpacity={1} 
                fill="url(#velocityGradient)" 
                animationDuration={3000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 4. FOOTER STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
              { label: "Protocol Active", val: data.active_habits, icon: Zap, color: "text-blue-500", desc: "Active Habits" },
              { label: "Weekly Volume", val: totalWeeklyDone, icon: Award, color: "text-emerald-500", desc: "Total Done (7d)" },
              { label: "System Efficiency", val: data.completion_rate + "%", icon: ShieldCheck, color: "text-violet-500", desc: "Accuracy" },
              { label: "Neural Status", val: performanceStatus, icon: Brain, color: "text-primary", desc: "Performance Tier" }
          ].map((s) => (
              <div key={s.label} className="p-8 bg-card border-4 rounded-[2.5rem] shadow-xl hover:border-primary/40 transition-all group relative overflow-hidden">
                  <s.icon className={cn("h-12 w-12 absolute -right-2 -bottom-2 opacity-5 transition-transform group-hover:scale-150 group-hover:rotate-12", s.color)} />
                  <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-1">{s.label}</p>
                  <p className="text-4xl font-black tracking-tighter italic">{s.val}</p>
                  <p className="text-[10px] font-bold text-primary/60 uppercase mt-4">{s.desc}</p>
              </div>
          ))}
      </div>
    </div>
  );
}