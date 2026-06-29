"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Brain, Zap, TrendingUp, Target, History, RefreshCw, 
  Activity, Award, ChevronRight, ChevronUp, ShieldCheck, 
  Clock, AlertTriangle, FileText, Lock 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AICoachPage() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [analyses, setAnalyses] = useState<any>({});
  const [loadingStates, setLoadingStates] = useState<any>({});
  const [dailyBrief, setDailyBrief] = useState<string>("");
  const [systemStatus, setSystemStatus] = useState<any>(null);

  const fetchStatus = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}/ai/status`, { headers: { "Authorization": `Bearer ${token}` } });
    if (res.ok) setSystemStatus(await res.json());
  };

  const fetchSection = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (analyses[id]) return;

    setLoadingStates((prev: any) => ({ ...prev, [id]: true }));
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API}/ai/analyze/${id}`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail);
      setAnalyses((prev: any) => ({ ...prev, [id]: data.analysis }));
    } catch (e: any) {
      setAnalyses((prev: any) => ({ ...prev, [id]: e.message || "Uplink Error." }));
    } finally {
      setLoadingStates((prev: any) => ({ ...prev, [id]: false }));
    }
  };

  const fetchDaily = async () => {
    setLoadingStates((prev: any) => ({ ...prev, daily: true }));
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}/ai/analyze/daily_brief`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) {
        const data = await res.json();
        setDailyBrief(data.analysis);
    }
    setLoadingStates((prev: any) => ({ ...prev, daily: false }));
  };

  useEffect(() => { 
    fetchStatus();
    fetchDaily(); 
  }, []);

  const days = systemStatus?.recorded_days || 0;

  const modules = [
    { id: "behavior", title: "Behavior Analysis", desc: "Analyze habits and behavioral trends", icon: TrendingUp, locked: false },
    { id: "goals", title: "Goal Intelligence", desc: "Analyze long-term mission progress", icon: Target, locked: false },
    { id: "predictive", title: "Predictive AI", desc: "Forecast streaks and completion probability", icon: Brain, locked: days < 14, req: "14 Recorded Days", progress: `${days}/14`, limit: 14 },
    { id: "weekly", title: "Weekly Coach", desc: "Strategic review of previous week", icon: Award, locked: days < 7, req: "7 Recorded Days", progress: `${days}/7`, limit: 7 },
    { id: "journal", title: "Journal Intelligence", desc: "Analyze patterns and mood trends", icon: History, locked: true, req: "Journal Module Activation" },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-12 p-6 pb-32 animate-in fade-in duration-700 bg-background text-foreground">
      <header className="border-b-4 border-foreground pb-8 flex justify-between items-end">
        <div>
          <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-none">AI Coach</h1>
          <p className="font-bold opacity-40 uppercase tracking-[0.3em] text-[10px] mt-4">Personal Decision Intelligence Engine</p>
        </div>
      </header>

      {/* SECTION 1: SYSTEM STATUS */}
      <Card className="border-2 rounded-2xl bg-muted/20 border-border">
          <CardContent className="p-6 flex flex-wrap justify-between items-center gap-6">
              <StatusItem label="System" val="Operational" color="text-emerald-500" />
              <StatusItem label="AI Uplink" val={systemStatus?.status || "CONNECTED"} color="text-emerald-500" />
              <StatusItem label="Data Maturity" val={`${days} Days`} />
              <StatusItem label="Model" val="Groq Llama 3" />
              <Button size="icon" variant="ghost" onClick={() => { fetchStatus(); fetchDaily(); }} className="hover:bg-muted text-foreground"><RefreshCw className="h-4 w-4" /></Button>
          </CardContent>
      </Card>

      {/* SECTION 2: TODAY'S INTELLIGENCE - HIGH VISIBILITY FIX */}
      <section className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest opacity-40">Active Mission Briefing</h2>
        <Card className="border-4 rounded-[2.5rem] bg-card text-foreground shadow-2xl overflow-hidden border-foreground/10">
            <CardContent className="p-10 relative">
                <Zap className="absolute top-6 right-10 h-10 w-10 opacity-5" />
                {loadingStates.daily ? (
                    <div className="space-y-3"><div className="h-6 w-full bg-muted animate-pulse rounded" /><div className="h-6 w-2/3 bg-muted animate-pulse rounded" /></div>
                ) : (
                    <p className="text-2xl font-bold italic leading-relaxed tracking-tight text-foreground">
                        "{dailyBrief || "Initializing neural sync. Requesting data packet..."}"
                    </p>
                )}
            </CardContent>
        </Card>
      </section>

      {/* SECTION 3: INTELLIGENCE MODULES */}
      <section className="space-y-4">
        <h2 className="text-xs font-black uppercase tracking-widest opacity-40">Intelligence Modules</h2>
        <div className="space-y-3">
            {modules.map((m) => (
                <div key={m.id}>
                    <Card 
                        className={cn(
                            "border-2 rounded-2xl transition-all cursor-pointer overflow-hidden",
                            expandedId === m.id ? "border-foreground shadow-lg" : "hover:border-foreground/50 border-border bg-card",
                            m.locked && "opacity-50 grayscale cursor-not-allowed"
                        )}
                        onClick={() => !m.locked && fetchSection(m.id)}
                    >
                        <CardContent className="p-0">
                            <div className="p-6 flex items-center justify-between group">
                                <div className="flex items-center gap-5">
                                    <div className={cn(
                                        "p-3 rounded-xl bg-muted transition-transform group-hover:scale-110", 
                                        expandedId === m.id && "bg-foreground text-background"
                                    )}>
                                        <m.icon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-black uppercase text-sm tracking-tight text-foreground">{m.title}</h3>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{m.desc}</p>
                                    </div>
                                </div>
                                {m.locked ? (
                                    <div className="text-right">
                                        <div className="flex items-center gap-2 justify-end opacity-40 text-foreground"><Lock className="h-4 w-4" /><span className="text-[8px] font-black uppercase tracking-widest">Locked</span></div>
                                        <p className="text-[7px] font-bold text-muted-foreground mt-1 uppercase italic">Requires: {m.req}</p>
                                    </div>
                                ) : (
                                    expandedId === m.id ? <ChevronUp className="h-5 w-5 opacity-40" /> : <ChevronRight className="h-5 w-5 opacity-40" />
                                )}
                            </div>

                            <AnimatePresence>
                                {expandedId === m.id && !m.locked && (
                                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="border-t-2 border-dashed border-border bg-muted/10">
                                        <div className="p-8 space-y-8">
                                            {loadingStates[m.id] ? (
                                                <div className="p-10 text-center animate-pulse font-black opacity-20 uppercase tracking-widest text-xs text-foreground">Uplinking...</div>
                                            ) : (
                                                <div className="space-y-8 animate-in fade-in slide-in-from-top-2">
                                                    <div className="p-6 bg-background rounded-2xl border-2 border-border italic font-bold leading-relaxed text-sm text-foreground">
                                                        "{analyses[m.id]}"
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                        <MetricBox label="Efficiency" val="ANALYZED" />
                                                        <MetricBox label="Momentum" val="STABLE" />
                                                        <MetricBox label="Risk" val="LOW" />
                                                        <MetricBox label="Neural Sync" val="100%" />
                                                    </div>
                                                    <Button variant="outline" className="w-full rounded-xl border-2 font-black uppercase text-[10px] tracking-widest border-foreground text-foreground hover:bg-foreground hover:text-background transition-all" onClick={(e) => { e.stopPropagation(); setExpandedId(null); }}>Hide Analysis</Button>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </CardContent>
                    </Card>
                    
                    {/* PROGRESS BAR FOR LOCKED MODULES */}
                    {m.locked && expandedId === m.id && m.limit && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-3 px-6 space-y-2">
                             <div className="flex justify-between text-[8px] font-black uppercase opacity-40 text-foreground">
                                <span>Audit Readiness</span>
                                <span>{m.progress} Days</span>
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden border border-border">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${(days / m.limit) * 100}%` }} className="h-full bg-foreground" />
                            </div>
                        </motion.div>
                    )}
                </div>
            ))}
        </div>
      </section>
    </div>
  );
}

function StatusItem({ label, val, color = "text-foreground" }: any) {
    return (
        <div className="text-center md:text-left">
            <p className="text-[8px] font-black uppercase opacity-40 tracking-widest text-foreground">{label}</p>
            <p className={cn("text-xs font-black uppercase italic", color)}>{val}</p>
        </div>
    )
}

function MetricBox({ label, val }: any) {
    return (
        <div className="p-4 bg-background border-2 rounded-xl text-center border-border">
            <p className="text-[8px] font-black uppercase opacity-40 mb-1 text-foreground">{label}</p>
            <p className="text-sm font-black italic text-foreground">{val}</p>
        </div>
    )
}