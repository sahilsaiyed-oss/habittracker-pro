"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { 
    Brain, Search, History, Save, Trash2, 
    Zap, Star, Trophy, Clock, CheckCircle2, Lock, 
    FileText, Activity, PenLine
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const MOODS = [
    { label: "Excellent", val: "Excellent", icon: "🟢" },
    { label: "Good", val: "Good", icon: "🔵" },
    { label: "Average", val: "Average", icon: "🟡" },
    { label: "Difficult", val: "Difficult", icon: "🟠" },
    { label: "Burnout", val: "Burnout", icon: "🔴" },
];

export default function JournalPage() {
  const [entries, setEntries] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [saveStatus, setSaveStatus] = useState("Idle");

  const [title, setTitle] = useState("");
  const [mood, setMood] = useState("Good");
  const [reflection, setReflection] = useState("");
  const [wins, setWins] = useState("");
  const [challenges, setChallenges] = useState("");
  const [lessons, setLessons] = useState("");
  const [tomorrow, setTomorrow] = useState("");
  const [gratitude, setGratitude] = useState("");

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    const headers = { "Authorization": `Bearer ${token}` };
    try {
        const [eRes, sRes] = await Promise.all([
            fetch(`${API}/journal/`, { headers }),
            fetch(`${API}/journal/stats`, { headers })
        ]);
        if (eRes.ok) setEntries(await eRes.json());
        if (sRes.ok) setStats(await sRes.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const saveEntry = async () => {
    if (!title || !reflection) return alert("Strategic Error: Title and Reflection required.");
    setSaveStatus("Securing...");
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}/journal/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ 
          date: format(new Date(), "yyyy-MM-dd"), title, mood, reflection, 
          wins, challenges, lessons, tomorrow_plan: tomorrow, gratitude 
      }),
    });
    if (res.ok) {
        setSaveStatus("Evidence Secured");
        setTitle(""); setReflection(""); setWins(""); setChallenges(""); setLessons(""); setTomorrow(""); setGratitude("");
        fetchData();
        setTimeout(() => setSaveStatus("Idle"), 3000);
    } else {
        const err = await res.json();
        alert(err.detail);
        setSaveStatus("Error");
    }
  };

  const deleteEntry = async (id: number) => {
    if(!confirm("Terminate this record?")) return;
    const token = localStorage.getItem("token");
    await fetch(`${API}/journal/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
    fetchData();
  };

  const filteredEntries = entries.filter(e => 
    e.title.toLowerCase().includes(search.toLowerCase()) || 
    e.reflection.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-20 text-center font-black animate-pulse uppercase tracking-widest text-3xl">Synchronizing Behavioral Memory...</div>;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-16 animate-in fade-in duration-700 text-foreground">
      
      {/* 1. HEADER */}
      <header className="border-b-4 border-foreground pb-8">
        <h1 className="text-7xl font-black tracking-tighter uppercase italic leading-none">Journal</h1>
        <p className="font-bold opacity-40 uppercase tracking-[0.3em] text-[11px] mt-4 ml-1">Behavior Reflection System</p>
      </header>

      {/* 2. PRIMARY ACTION: THE FORM */}
      <section>
        <Card className="border-4 rounded-[3.5rem] p-12 shadow-2xl bg-card border-foreground/5">
            <div className="space-y-12">
                <div className="space-y-6">
                    <Label className="text-sm font-bold uppercase tracking-widest opacity-50 ml-1">Operational State (Mood)</Label>
                    <div className="flex flex-wrap gap-4">
                        {MOODS.map(m => (
                            <button key={m.val} onClick={() => setMood(m.val)} className={cn(
                                "px-6 py-3 rounded-2xl border-2 font-black uppercase text-[11px] transition-all flex items-center gap-3",
                                mood === m.val ? "bg-foreground text-background border-foreground scale-105 shadow-xl" : "bg-muted/10 border-border opacity-50 hover:opacity-100"
                            )}>
                                <span className="text-lg">{m.icon}</span> {m.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="space-y-3">
                        <Label className="text-sm font-bold uppercase tracking-widest opacity-50 ml-1">Mission Title</Label>
                        <Input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. DAY 01: INITIATING PROTOCOL" className="h-16 rounded-3xl border-2 text-2xl font-black italic bg-muted/5 focus-visible:ring-0" />
                    </div>

                    <div className="space-y-3 relative">
                        <Label className="text-sm font-bold uppercase tracking-widest opacity-50 ml-1 italic">Main Reflection</Label>
                        <Textarea 
                            value={reflection} onChange={e => setReflection(e.target.value)} 
                            placeholder="Describe today's operational results..." 
                            className="rounded-[2.5rem] border-2 bg-muted/5 min-h-[220px] focus-visible:ring-0 text-lg font-medium p-8 shadow-inner" 
                        />
                        <span className="absolute bottom-6 right-8 text-[10px] font-black opacity-20 uppercase tracking-widest">
                            {reflection.length} / 5000
                        </span>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-10">
                    <ReflectionField label="Critical Wins" val={wins} set={setWins} placeholder="List successful outputs..." />
                    <ReflectionField label="System Failures" val={challenges} set={setChallenges} placeholder="Obstacles encountered..." />
                    <ReflectionField label="Neural Gains" val={lessons} set={setLessons} placeholder="Insights gained today..." />
                    <ReflectionField label="Next Zero-Hour Plan" val={tomorrow} set={setTomorrow} placeholder="Top priority tomorrow?" />
                </div>
                
                <div className="w-full">
                    <ReflectionField label="Value Gratitude" val={gratitude} set={setGratitude} placeholder="Support systems identified..." />
                </div>

                <div className="pt-10 border-t-2 border-dashed flex flex-col md:flex-row justify-between items-center gap-6 border-border">
                    <div className="flex items-center gap-3">
                        <div className={cn("h-3 w-3 rounded-full", saveStatus === "Evidence Secured" ? "bg-emerald-500 animate-pulse" : "bg-muted")} />
                        <p className="text-[10px] font-black uppercase opacity-40 tracking-[0.2em] italic">{saveStatus}</p>
                    </div>
                    <Button onClick={saveEntry} className="rounded-full bg-foreground text-background px-20 h-16 font-black uppercase text-base shadow-2xl hover:scale-105 transition-all">
                        <Save className="mr-2 h-6 w-6" /> Secure Evidence
                    </Button>
                </div>
            </div>
        </Card>
      </section>

      {/* 3. SECONDARY MODULES (ENLARGED & REFINED) */}
      <section className="grid lg:grid-cols-3 gap-10 pt-10">
          
          {/* AI MATURITY CARD - ENLARGED */}
          <div className="space-y-6">
              <h2 className="text-xs font-black uppercase tracking-widest opacity-40 flex items-center gap-2 ml-2">
                <Brain className="h-4 w-4" /> Intelligence Readiness
              </h2>
              <Card className="border-4 rounded-[3rem] p-12 shadow-2xl bg-card border-border h-full flex flex-col justify-center">
                  <div className="space-y-8">
                      <div>
                          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-primary italic">Engine Status</p>
                          <h3 className="text-4xl font-black italic uppercase mt-2 leading-tight">
                            {stats?.ai_status || "Collecting Behavioral Data"}
                          </h3>
                      </div>
                      
                      <div className="space-y-4">
                          <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                              <span className="opacity-40">{stats?.total_entries || 0} / 30 Secured</span>
                              <span className="text-primary">{Math.round(stats?.maturity_percentage || 0)}%</span>
                          </div>
                          <div className="h-3 w-full bg-muted rounded-full overflow-hidden p-0.5 border">
                              <motion.div 
                                initial={{ width: 0 }} 
                                animate={{ width: `${stats?.maturity_percentage || 0}%` }} 
                                className="h-full bg-primary rounded-full shadow-[0_0_15px_rgba(0,0,0,0.1)]" 
                                transition={{ duration: 1.5, ease: "easeOut" }}
                              />
                          </div>
                      </div>
                      <p className="text-xs font-bold text-muted-foreground leading-relaxed uppercase opacity-60">
                          indexing behavioral patterns. Full analysis unlocks at 30 entries.
                      </p>
                  </div>
              </Card>
          </div>

          {/* MILESTONES CARD - ENLARGED */}
          <div className="space-y-6">
              <h2 className="text-xs font-black uppercase tracking-widest opacity-40 flex items-center gap-2 ml-2">
                <FileText className="h-4 w-4" /> Reflection Milestones
              </h2>
              <div className="space-y-4">
                <LockItem label="Weekly Reflection" req="7 Entries" progress={stats?.total_entries || 0} limit={7} />
                <LockItem label="Monthly Reflection" req="30 Entries" progress={stats?.total_entries || 0} limit={30} />
              </div>
          </div>

          {/* SYSTEM STATS - ENLARGED & INVERTED TO WHITE */}
          <div className="space-y-6">
              <h2 className="text-xs font-black uppercase tracking-widest opacity-40 flex items-center gap-2 ml-2">
                <Activity className="h-4 w-4" /> System Stats
              </h2>
              <Card className="border-4 rounded-[3rem] p-12 bg-card border-border shadow-2xl h-full flex flex-col justify-center">
                  <div className="grid grid-cols-1 gap-10">
                      <div className="space-y-1">
                          <p className="text-[11px] font-black uppercase opacity-40 tracking-[0.2em]">Writing Streak</p>
                          <p className="text-5xl font-black italic uppercase tracking-tighter text-foreground">{stats?.current_streak || 0} Days</p>
                      </div>
                      <div className="space-y-1 pt-6 border-t-2 border-dashed">
                          <p className="text-[11px] font-black uppercase opacity-40 tracking-[0.2em]">Total Records</p>
                          <p className="text-5xl font-black italic uppercase tracking-tighter text-foreground">{stats?.total_entries || 0}</p>
                      </div>
                  </div>
              </Card>
          </div>
      </section>

      {/* 4. TIMELINE */}
      <section className="space-y-8 pt-12">
        <div className="flex items-center justify-between border-b-2 border-border pb-6">
            <h2 className="text-2xl font-black uppercase tracking-tighter flex items-center gap-3 italic">
                <History className="h-6 w-6" /> Behavior Timeline
            </h2>
            <div className="flex items-center gap-3 bg-muted/20 px-6 py-3 rounded-full border-2 border-border">
                <Search className="h-4 w-4 opacity-40" />
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="SEARCH ARCHIVE..." className="bg-transparent border-none text-xs font-black focus:ring-0 w-48 uppercase tracking-widest" />
            </div>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
                {filteredEntries.map((e) => (
                    <motion.div key={e.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}>
                        <Card className="border-2 rounded-[2.5rem] p-8 hover:border-black transition-all cursor-pointer bg-card text-foreground group relative shadow-md">
                            <button onClick={() => deleteEntry(e.id)} className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 text-red-500 hover:scale-125 transition-all">
                                <Trash2 className="h-5 w-5" />
                            </button>
                            <div className="flex flex-col gap-6">
                                <div className="flex items-center justify-between">
                                    <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center text-3xl shadow-inner">
                                        {MOODS.find(m => m.val === e.mood)?.icon || "⚪"}
                                    </div>
                                    <p className="text-[10px] font-black opacity-30 uppercase tracking-widest">{format(parseISO(e.date), "MMM do, yyyy")}</p>
                                </div>
                                <div className="min-w-0">
                                    <h4 className="font-black text-lg truncate uppercase tracking-tighter italic leading-none">{e.title}</h4>
                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-3 font-medium opacity-80 leading-relaxed italic">"{e.reflection}"</p>
                                </div>
                            </div>
                        </Card>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
      </section>
    </div>
  );
}

// --- HELPERS ---

function ReflectionField({ label, val, set, placeholder, limit }: any) {
    return (
        <div className="space-y-3 relative group">
            <Label className="text-[13px] font-bold uppercase tracking-widest text-muted-foreground ml-1">{label}</Label>
            <Textarea 
                value={val} onChange={e => set(e.target.value)} maxLength={limit}
                placeholder={placeholder} 
                className="rounded-3xl border-2 bg-muted/5 min-h-[150px] focus-visible:ring-0 text-base font-medium border-border p-6 shadow-sm group-hover:border-foreground/20 transition-colors" 
            />
            {limit && (
                <span className="absolute bottom-4 right-6 text-[8px] font-black opacity-20 uppercase tracking-widest">
                    {val.length} / {limit}
                </span>
            )}
        </div>
    )
}

function LockItem({ label, req, progress, limit }: any) {
    const isLocked = progress < limit;
    return (
        <div className={cn(
            "border-4 rounded-[2rem] p-8 flex items-center justify-between transition-all",
            isLocked ? "border-dashed opacity-40 bg-muted/5" : "border-emerald-500/20 bg-emerald-500/5 shadow-lg"
        )}>
            <div className="flex items-center gap-4">
                {isLocked ? <Lock className="h-6 w-6" /> : <CheckCircle2 className="h-6 w-6 text-emerald-500" />}
                <div>
                    <p className="text-xs font-black uppercase tracking-widest">{label}</p>
                    <p className="text-[10px] font-bold opacity-60 italic uppercase tracking-tighter">Condition: {req}</p>
                </div>
            </div>
            {isLocked && <span className="text-xs font-black opacity-30">{progress}/{limit}</span>}
        </div>
    )
}