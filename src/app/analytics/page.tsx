"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";
import { motion } from "framer-motion";
import { Activity, Award, BarChart3, Calendar, CheckCircle2, TrendingUp, Clock, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`${API}/analytics/`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const d = await res.json();
          setData(d);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="p-20 text-center font-medium animate-pulse text-muted-foreground uppercase tracking-widest text-3xl">Initialising Neural Link...</div>;
  if (!data) return <div className="p-20 text-center text-red-500 font-bold">Unauthorized Access. Please login again.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-12 p-6 pb-20 animate-in fade-in duration-700">
      <header className="space-y-2">
        <h1 className="text-5xl font-black tracking-tighter text-foreground uppercase italic border-b-8 border-primary w-fit pb-2">Analytics</h1>
        <p className="text-muted-foreground text-lg font-medium tracking-tight">Track your progress and daily performance.</p>
      </header>

      {/* 1. OVERVIEW GRID */}
      <div className="grid gap-6 md:grid-cols-3">
        <StatCard label="Today's Score" val={`${data.today_score || 0}%`} icon={Activity} desc="Daily Progress" />
        <StatCard label="7-Day Average" val={`${data.completion_rate || 0}%`} icon={TrendingUp} desc="Weekly Average" />
        <StatCard label="Active Habits" val={data.active_habits || 0} icon={CheckCircle2} desc="Operational Protocols" />
      </div>

      {/* 2. PERFORMANCE TREND */}
      <Card className="border-4 shadow-xl rounded-[2.5rem] overflow-hidden bg-card transition-all hover:shadow-2xl">
        <CardHeader className="border-b bg-muted/30 py-6 px-8">
          <CardTitle className="text-sm font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> Weekly Progress Graph
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 h-96">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.weekly_data || []}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/40" />
              <XAxis 
                dataKey="day" 
                axisLine={false} 
                tickLine={false} 
                tick={{fill: 'currentColor', fontSize: 12, fontWeight: 'bold'}} 
                className="text-muted-foreground"
                dy={15}
              />
              <YAxis hide domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    borderRadius: '16px', 
                    border: '2px solid hsl(var(--border))',
                    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' 
                }}
                itemStyle={{ color: 'hsl(var(--primary))', fontWeight: 'bold' }}
              />
              <Area 
                type="monotone" 
                dataKey="score" 
                stroke="hsl(var(--primary))" 
                strokeWidth={5} 
                fillOpacity={1} 
                fill="url(#colorScore)" 
                animationDuration={2000}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-8 md:grid-cols-2">
        {/* 3. HABIT RANKINGS */}
        <Card className="border-4 shadow-lg rounded-[2rem] bg-card">
          <CardHeader className="border-b bg-muted/30 py-6 px-8">
            <CardTitle className="text-sm font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
              <Award className="h-5 w-5" /> Habit Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {(data.rankings || []).map((h: any, i: number) => (
                <div key={h.name} className="flex items-center justify-between p-4 rounded-2xl border-2 bg-muted/10 group hover:border-primary/50 transition-all hover:scale-[1.02] cursor-default">
                  <div className="flex items-center gap-4">
                    <span className={cn(
                        "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black",
                        i === 0 ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "bg-muted text-muted-foreground"
                    )}>{i + 1}</span>
                    <span className="font-bold text-lg tracking-tight uppercase italic flex items-center gap-2">
                        {h.name} {h.is_strategic && <Star className="h-4 w-4 fill-primary text-primary" />}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-black px-3 py-1 bg-primary/10 text-primary rounded-full border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">{h.count} DONE</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 4. MINI HEATMAP */}
        <Card className="border-4 shadow-lg rounded-[2rem] bg-card">
          <CardHeader className="border-b bg-muted/30 py-6 px-8">
            <CardTitle className="text-sm font-black uppercase tracking-[0.3em] text-primary flex items-center gap-2">
              <Calendar className="h-5 w-5" /> 90-Day Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="flex flex-wrap gap-2 justify-center">
                {(data.heatmap || []).map((cell: any) => (
                    <div 
                        key={cell.date} 
                        className={cn(
                            "h-4 w-4 rounded-[3px] transition-all hover:scale-150 cursor-pointer",
                            cell.intensity >= 0.7 ? "bg-primary shadow-[0_0_10px_hsl(var(--primary))]" : 
                            cell.intensity >= 0.4 ? "bg-primary/60" :
                            cell.intensity > 0 ? "bg-primary/20" : "bg-muted border border-border/50"
                        )}
                        title={`${cell.date}`}
                    />
                ))}
            </div>
            <div className="mt-8 flex justify-center gap-6 text-[10px] font-black uppercase tracking-widest opacity-40">
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-muted rounded-full"/> Getting Started</div>
                <div className="flex items-center gap-2"><div className="w-2 h-2 bg-primary rounded-full shadow-[0_0_5px_hsl(var(--primary))]"/> Excellent</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, val, icon: Icon, desc }: any) {
    return (
        <Card className="border-4 shadow-lg rounded-[2rem] p-8 hover:border-primary/50 hover:scale-105 transition-all group bg-card cursor-default">
            <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-primary/10 rounded-2xl group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                    <Icon className="h-6 w-6" />
                </div>
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
            <h3 className="text-5xl font-black tracking-tighter mt-2 italic">{val}</h3>
            <p className="text-[10px] text-primary font-bold mt-4 uppercase tracking-widest opacity-60">{desc}</p>
        </Card>
    )
}