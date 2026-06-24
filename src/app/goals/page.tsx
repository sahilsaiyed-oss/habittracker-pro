"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Target, Trash2, Plus, Calendar, ShieldCheck, ListTodo, Link as LinkIcon, CheckCircle2, ChevronDown, ChevronUp, Star, X } from "lucide-react";
import { format, differenceInDays, parseISO, differenceInHours } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function GoalsPage() {
  const [goals, setGoals] = useState<any[]>([]);
  const [habits, setHabits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState<number | null>(null);
  const [mTitle, setMTitle] = useState("");

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Career");
  const [deadline, setDeadline] = useState("");

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    const headers = { "Authorization": `Bearer ${token}` };
    try {
        const [gRes, hRes] = await Promise.all([
            fetch(`${API}/goals/`, { headers }),
            fetch(`${API}/habits/`, { headers })
        ]);
        setGoals(await gRes.json());
        setHabits(await hRes.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const createGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem("token");
    await fetch(`${API}/goals/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ title, category, deadline }),
    });
    setOpen(false); setTitle(""); setDeadline(""); fetchData();
  };

  const addMilestone = async (goalId: number) => {
    if (!mTitle) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}/goals/${goalId}/milestones`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ title: mTitle }),
    });
    if(res.ok) { setMTitle(""); fetchData(); }
  };

  const deleteMilestone = async (msId: number) => {
    const token = localStorage.getItem("token");
    await fetch(`${API}/goals/milestones/${msId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });
    fetchData();
  };

  const toggleMs = async (msId: number) => {
    const token = localStorage.getItem("token");
    await fetch(`${API}/goals/milestones/${msId}/toggle`, {
      method: "PATCH",
      headers: { "Authorization": `Bearer ${token}` }
    });
    fetchData();
  };

  const linkHabit = async (goalId: number, habitId: number) => {
    const token = localStorage.getItem("token");
    await fetch(`${API}/goals/${goalId}/link/${habitId}`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}` }
    });
    fetchData();
  };

  const deleteGoal = async (id: number) => {
    if(!confirm("Permanently delete mission?")) return;
    const token = localStorage.getItem("token");
    await fetch(`${API}/goals/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
    fetchData();
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse uppercase tracking-widest text-foreground">Syncing Mission Logs...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-12 p-6 pb-24 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b pb-8 gap-6 border-border">
        <div>
          <h1 className="text-6xl font-black tracking-tighter uppercase italic text-foreground leading-none">Missions</h1>
          <p className="text-muted-foreground font-bold tracking-widest text-[10px] uppercase ml-1">Strategic Objective Command</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button className="rounded-full px-10 h-14 font-black uppercase text-xs shadow-2xl hover:scale-105 transition-all bg-foreground text-background">Initialize Mission</Button></DialogTrigger>
          <DialogContent className="rounded-[2.5rem] border-4 shadow-2xl p-10 bg-background text-foreground">
            <DialogHeader><DialogTitle className="text-3xl font-black uppercase italic text-foreground">New Objective</DialogTitle></DialogHeader>
            <form onSubmit={createGoal} className="space-y-6 pt-6">
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-foreground ml-1">Goal Title</Label><Input value={title} onChange={e=>setTitle(e.target.value)} required className="h-14 rounded-2xl text-xl font-bold border-2 border-border bg-card text-foreground focus-visible:ring-0" /></div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-foreground ml-1">Category</Label>
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="h-14 rounded-2xl border-2 font-bold bg-card text-foreground border-border"><SelectValue /></SelectTrigger>
                            <SelectContent className="bg-popover border-2 border-border shadow-2xl">
                                {["Health", "Study", "Career", "Finance", "Growth"].map(c => <SelectItem key={c} value={c} className="font-bold text-foreground focus:bg-accent">{c}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-foreground ml-1">Deadline</Label><Input type="date" value={deadline} onChange={e=>setDeadline(e.target.value)} required className="h-14 rounded-2xl border-2 font-bold bg-card text-foreground border-border" /></div>
                </div>
                <Button type="submit" className="w-full h-16 rounded-3xl font-black uppercase text-lg bg-foreground text-background shadow-xl hover:opacity-90">Launch Protocol</Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid gap-10">
        {goals.map((g, i) => {
          const totalMs = g.milestones.length;
          const doneMs = g.milestones.filter((m:any) => m.is_completed).length;
          const progress = totalMs > 0 ? Math.round((doneMs / totalMs) * 100) : 0;
          const daysRemaining = differenceInDays(parseISO(g.deadline), new Date());
          const isExpanded = expandedGoal === g.id;
          const hoursSinceUpdate = differenceInHours(new Date(), parseISO(g.updated_at));
          let health = hoursSinceUpdate > 168 ? "At Risk" : "Excellent";

          return (
            <Card key={g.id} className="border-4 rounded-[3rem] overflow-hidden bg-card shadow-2xl hover:border-foreground transition-all">
              <CardContent className="p-0">
                <div className="p-10 flex flex-col lg:flex-row gap-12 items-center lg:items-start">
                    <div className="flex-1 space-y-4">
                        <span className="text-[10px] font-black uppercase bg-muted border-2 px-4 py-1 rounded-full text-foreground tracking-widest">{g.category}</span>
                        <h3 className="text-4xl font-black tracking-tighter uppercase leading-none italic text-foreground">{g.title}</h3>
                        <div className="flex justify-start gap-8 pt-4">
                            <div><p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Checkpoints</p><p className="text-2xl font-black text-foreground">{doneMs}/{totalMs}</p></div>
                            <div className="border-l-2 pl-8 border-border">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Habits</p>
                                <p className="text-2xl font-black text-foreground">{g.linked_habits.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-[1.5] w-full space-y-6">
                        <div className="flex justify-between items-end">
                            <p className="text-8xl font-black tracking-tighter text-foreground">{progress}%</p>
                            <p className="text-xs font-black uppercase tracking-widest bg-foreground text-background px-6 py-2 rounded-2xl shadow-xl">{daysRemaining} Days Left</p>
                        </div>
                        <Progress value={progress} className="h-4 rounded-full border-2 bg-muted transition-all" />
                    </div>

                    <div className="flex flex-col gap-3">
                        <div className={cn("w-full lg:w-48 rounded-[2rem] p-6 text-center border-4 bg-muted/10", health === "At Risk" ? "border-red-500/30 text-red-500" : "border-emerald-500/20 text-emerald-500")}>
                            <ShieldCheck className="h-8 w-8 mx-auto mb-2 drop-shadow-md" />
                            <p className="text-[8px] font-black uppercase opacity-40 mb-1 tracking-widest text-foreground">Status</p>
                            <p className="text-3xl font-black uppercase italic leading-none">{health}</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="flex-1 h-14 rounded-2xl border-2 border-border text-foreground hover:bg-muted" onClick={() => setExpandedGoal(isExpanded ? null : g.id)}>
                                {isExpanded ? <ChevronUp strokeWidth={3} /> : <ChevronDown strokeWidth={3} />}
                            </Button>
                            <Button variant="outline" className="h-14 w-14 rounded-2xl border-2 border-border text-red-500 hover:bg-red-50" onClick={() => deleteGoal(g.id)}><Trash2 strokeWidth={3} /></Button>
                        </div>
                    </div>
                </div>

                <AnimatePresence>
                {isExpanded && (
                    <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="bg-muted/10 border-t-4 border-border overflow-hidden">
                        <div className="p-10 grid md:grid-cols-2 gap-16">
                            {/* Checkpoints with DELETE Function */}
                            <div className="space-y-6">
                                <h4 className="text-xl font-black uppercase flex items-center gap-3 text-foreground italic"><ListTodo className="h-6 w-6 text-primary" /> Mission Checkpoints</h4>
                                <div className="flex gap-3">
                                    <Input placeholder="Define next step..." value={mTitle} onChange={e=>setMTitle(e.target.value)} className="bg-background rounded-2xl h-14 border-2 border-border font-bold text-lg px-6 text-foreground focus-visible:ring-0" />
                                    <Button onClick={() => addMilestone(g.id)} className="bg-foreground text-background rounded-2xl h-14 px-8 font-black uppercase text-xs">Add</Button>
                                </div>
                                <div className="space-y-3">
                                    {g.milestones.map((m:any) => (
                                        <div key={m.id} className={cn(
                                            "p-6 rounded-3xl border-2 transition-all flex items-center justify-between shadow-sm group",
                                            m.is_completed ? "bg-emerald-500 text-white border-emerald-600" : "bg-card border-border"
                                        )}>
                                            <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => toggleMs(m.id)}>
                                                {m.is_completed ? <CheckCircle2 className="h-6 w-6" /> : <div className="h-6 w-6 rounded-full border-4 border-muted group-hover:border-foreground" />}
                                                <span className="text-lg font-black italic">{m.title}</span>
                                            </div>
                                            <button onClick={() => deleteMilestone(m.id)} className="ml-4 opacity-30 hover:opacity-100 text-red-400 hover:text-red-600 transition-all">
                                                <X className="h-5 w-5 stroke-[4px]" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Linked Habits (Toggle Style) */}
                            <div className="space-y-6">
                                <h4 className="text-xl font-black uppercase flex items-center gap-3 text-foreground italic"><LinkIcon className="h-6 w-6 text-primary" /> Strategic Actions</h4>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest leading-relaxed">
                                    Toggle habits below to link or unlink them from this mission. Linked habits will be highlighted with a ⭐ across the system.
                                </p>
                                <div className="flex flex-wrap gap-3 pt-2">
                                    {habits.map(h => {
                                        const isLinked = g.linked_habits.some((lh:any)=>lh.id===h.id);
                                        return (
                                            <button key={h.id} onClick={() => linkHabit(g.id, h.id)} className={cn(
                                                "px-6 py-3 rounded-2xl border-2 text-[10px] font-black uppercase transition-all shadow-sm flex items-center gap-2",
                                                isLinked ? "bg-foreground text-background border-foreground shadow-lg scale-105" : "bg-card text-muted-foreground border-border hover:border-foreground"
                                            )}>
                                                {h.name} {isLinked && <CheckCircle2 className="h-3 w-3" />}
                                            </button>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
                </AnimatePresence>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}