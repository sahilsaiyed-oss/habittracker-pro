"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Flame, Target, TrendingUp, CheckCircle2, Clock, 
  Check, X, Star, Brain, Zap, ShieldCheck, ChevronDown, ChevronUp 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, startOfToday } from "date-fns";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.3
    }
  }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" } }
};

export default function DashboardPage() {
  const [habits, setHabits] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [briefing, setBriefing] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(false);
  const [isAiExpanded, setIsAiExpanded] = useState(false);
  
  const todayStr = format(startOfToday(), "yyyy-MM-dd");

  async function fetchData() {
    const token = localStorage.getItem("token");
    const headers = { "Authorization": `Bearer ${token}` };
    try {
      const habitsRes = await fetch(`${API}/habits/?archived=false`, { headers });
      const habitsData = await habitsRes.json();
      const allLogs = await Promise.all(habitsData.map((h: any) => 
        fetch(`${API}/habits/${h.id}/logs`, { headers }).then((r) => r.json())
      ));
      setHabits(habitsData); setLogs(allLogs.flat());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }

  const fetchAiBriefing = async () => {
    if (isAiExpanded) {
        setIsAiExpanded(false);
        return;
    }

    setIsAiExpanded(true);
    if (briefing) return; 
    
    setAiLoading(true);
    const token = localStorage.getItem("token");
    const headers = { "Authorization": `Bearer ${token}` };
    try {
      const aiRes = await fetch(`${API}/ai/briefing`, { headers });
      const aiData = await aiRes.json();
      setBriefing(aiData.briefing);
    } catch (err) {
      setBriefing("Neural uplink restricted. Please verify API configuration.");
    } finally { setAiLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const todayLogs = logs.filter((l) => l.date === todayStr);
  const doneToday = todayLogs.filter((l) => l.status === "done").length;
  const progress = habits.length > 0 ? Math.round((doneToday / habits.length) * 100) : 0;

  const missionStatus = progress === 100 ? "SUPERIOR" : progress > 0 ? "STABLE" : "STAGNANT";
  const threatLevel = progress > 70 ? "LOW" : progress > 30 ? "MEDIUM" : "HIGH";

  if (loading) return <div className="p-20 text-center font-black animate-pulse uppercase tracking-widest text-2xl">Initializing Tactical Interface...</div>;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-7xl mx-auto space-y-10 p-4 bg-background text-foreground"
    >
      
      {/* PAGE TITLE & DYNAMIC LIVE FEED */}
      <motion.header variants={itemVariants} className="border-b-4 border-foreground pb-6">
        <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-none text-foreground">Tactical Dashboard</h1>
        <p className="text-muted-foreground font-bold uppercase tracking-[0.3em] text-[10px] mt-3 ml-1">
          Live Feed: {format(startOfToday(), "EEEE, MMM do").toUpperCase()}
        </p>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* MAIN OPERATIONS COLUMN */}
        <div className="lg:col-span-2 space-y-12">
            
            {/* SECTION 1: TODAY'S STATUS */}
            <section className="space-y-6">
                <motion.h2 variants={itemVariants} className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
                    <div className="h-6 w-2 bg-primary rounded-full" /> Today's Status
                </motion.h2>
                <div className="grid gap-4">
                    {habits.map((h, i) => {
                        const status = todayLogs.find((l) => l.habit_id === h.id)?.status || "-";
                        return (
                        <motion.div key={h.id} variants={itemVariants}>
                            <Card className={cn(
                                "border-2 transition-all duration-300 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 group",
                                status === "done" ? "border-emerald-500/50 bg-emerald-500/[0.03]" : "border-border bg-card"
                            )}>
                            <CardContent className="p-6 flex items-center justify-between">
                                <div className="flex items-center gap-6">
                                    <div className={cn(
                                        "h-14 w-14 rounded-2xl flex items-center justify-center text-2xl font-black text-white shadow-xl transition-transform duration-300 group-hover:rotate-3",
                                        h.color === 'emerald' ? 'bg-emerald-500' : 
                                        h.color === 'violet' ? 'bg-violet-500' : 'bg-rose-500'
                                    )}>
                                        {h.name[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black tracking-tighter uppercase italic text-foreground">
                                            {h.name} {h.is_strategic && <Star className="h-4 w-4 fill-primary text-primary inline ml-1" />}
                                        </h3>
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Routine Active</p>
                                    </div>
                                </div>
                                <div>
                                    {status === "done" ? (
                                        <div className="flex items-center gap-2 bg-emerald-500 text-white px-6 py-2 rounded-full font-black text-xs shadow-lg shadow-emerald-500/20">
                                            <Check className="stroke-[4px] h-4 w-4" /> DONE
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
                    {habits.length === 0 && <p className="text-muted-foreground font-bold p-10 text-center border-2 border-dashed rounded-3xl">No active habits found in inventory.</p>}
                </div>
            </section>

            {/* SECTION 2: KPI CARDS */}
            <section className="grid gap-6 grid-cols-2 md:grid-cols-4">
                {[
                    { label: "Active", val: habits.length, icon: Target, cls: "bg-blue-600 shadow-blue-500/40" },
                    { label: "Achieved", val: doneToday, icon: CheckCircle2, cls: "bg-emerald-600 shadow-emerald-500/40" },
                    { label: "Goal", val: `${progress}%`, icon: TrendingUp, cls: "bg-violet-600 shadow-violet-500/40" },
                    { label: "Streak", val: "1 Day", icon: Flame, cls: "bg-orange-600 shadow-orange-500/40" }
                ].map((stat, i) => (
                    <motion.div key={stat.label} variants={itemVariants}>
                        <Card className={cn(
                          "border-none text-white shadow-2xl relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02]", 
                          stat.cls
                        )}>
                            <stat.icon className="absolute -right-4 -bottom-4 h-24 w-24 opacity-15 rotate-12 transition-transform group-hover:rotate-0" />
                            <CardContent className="p-6 z-10 relative">
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">{stat.label}</p>
                                <p className="text-3xl font-black italic tracking-tighter">{stat.val}</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </section>

            {/* SECTION 3: STRATEGIC INTELLIGENCE */}
            <motion.section variants={itemVariants}>
                <Card className="border-4 rounded-[2.5rem] bg-card shadow-2xl overflow-hidden transition-all duration-300 hover:border-primary/20">
                    <CardContent className="p-0">
                        <div className="p-8 flex items-center justify-between group cursor-pointer" onClick={fetchAiBriefing}>
                            <div className="flex items-center gap-5">
                                <div className="h-12 w-12 rounded-2xl bg-foreground text-background flex items-center justify-center shadow-lg group-hover:rotate-6 transition-transform">
                                    <Brain className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black uppercase tracking-tight text-foreground">Strategic Intelligence</h3>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Neural insights based on behavior</p>
                                </div>
                            </div>
                            {!isAiExpanded && <Button variant="outline" className="rounded-full border-2 font-black text-[9px] uppercase px-4 h-8 text-foreground border-foreground hover:bg-foreground hover:text-background transition-all">Open AI Brief</Button>}
                        </div>

                        <AnimatePresence>
                        {isAiExpanded && (
                            <motion.div 
                                initial={{ height: 0, opacity: 0 }} 
                                animate={{ height: "auto", opacity: 1 }} 
                                exit={{ height: 0, opacity: 0 }} 
                                className="border-t border-dashed overflow-hidden bg-muted/10"
                            >
                                <div className="p-8 space-y-8">
                                    {aiLoading ? (
                                        <div className="space-y-3">
                                            <div className="h-3 w-full bg-muted animate-pulse rounded" />
                                            <div className="h-3 w-2/3 bg-muted animate-pulse rounded" />
                                        </div>
                                    ) : (
                                        <div className="grid lg:grid-cols-2 gap-10">
                                            <div className="space-y-6">
                                                <div className="p-6 bg-background border-2 rounded-[2rem] shadow-inner relative border-border">
                                                    <p className="text-base font-bold italic leading-relaxed text-foreground">"{briefing}"</p>
                                                    <p className="text-[8px] font-black uppercase opacity-30 mt-6 tracking-widest text-right">Generated Today at {format(new Date(), "p")}</p>
                                                </div>
                                                <Button 
                                                    variant="ghost" 
                                                    className="font-black text-[9px] uppercase w-full border-2 rounded-full border-border hover:bg-muted" 
                                                    onClick={(e) => { e.stopPropagation(); setIsAiExpanded(false); }}
                                                >
                                                    Close Brief
                                                </Button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <AuditBox label="Mission Status" val={missionStatus} color="text-primary" />
                                                <AuditBox label="Threat Level" val={threatLevel} color={threatLevel === 'HIGH' ? "text-red-500" : "text-emerald-500"} />
                                                <AuditBox label="Priority Habit" val={habits[0]?.name || "N/A"} color="text-foreground" />
                                                <AuditBox label="Recommendation" val="Maintain Velocity" color="text-foreground" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                        </AnimatePresence>
                    </CardContent>
                </Card>
            </motion.section>
        </div>

        {/* SIDEBAR COLUMN (Total Surge) */}
        <motion.div variants={itemVariants} className="space-y-6">
            <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
                <div className="h-6 w-2 bg-foreground rounded-full" /> Total Surge
            </h2>
            <Card className={cn(
              "rounded-[3rem] p-10 overflow-hidden relative group h-fit sticky top-10 transition-all duration-300 hover:shadow-3xl",
              "bg-card border-2 border-border text-card-foreground shadow-2xl", // Base / Light
              "dark:bg-zinc-900 dark:border-none dark:text-white" // Dark overrides
            )}>
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50 dark:from-primary/20" />
                <div className="relative z-10 text-center space-y-6">
                    <motion.p 
                      key={progress} 
                      initial={{ scale: 0.8, opacity: 0 }} 
                      animate={{ scale: 1, opacity: 1 }} 
                      className="text-8xl font-black tracking-tighter text-foreground dark:text-white"
                    >
                      {progress}%
                    </motion.p>
                    <p className="text-xs font-black uppercase tracking-[0.4em] text-primary">System Integrity</p>
                    
                    {/* Progress Bar Track Fix for Light Mode */}
                    <div className="h-4 w-full bg-muted dark:bg-white/10 rounded-full overflow-hidden p-1 border border-border dark:border-white/5">
                        <motion.div 
                            className="h-full bg-primary rounded-full shadow-[0_0_15px_rgba(0,0,0,0.1)] dark:shadow-[0_0_20px_var(--primary)]" 
                            initial={{ width: 0 }} 
                            animate={{ width: `${progress}%` }} 
                            transition={{ duration: 1.5, ease: "anticipate" }} 
                        />
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground dark:text-zinc-500 uppercase px-4 leading-relaxed italic">
                        * Update status in the Inventory to synchronize system surge.
                    </p>
                </div>
            </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}

function AuditBox({ label, val, color }: any) {
    return (
        <div className="bg-background border-2 p-5 rounded-[2rem] text-center flex flex-col justify-center space-y-1 border-border shadow-sm hover:shadow-md transition-shadow">
            <p className="text-[8px] font-black uppercase opacity-40 tracking-widest text-foreground">{label}</p>
            <p className={cn("text-sm font-black uppercase italic truncate px-1", color)}>{val}</p>
        </div>
    )
}