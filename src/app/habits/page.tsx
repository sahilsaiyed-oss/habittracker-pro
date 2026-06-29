"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Archive, ArchiveRestore, Trash2, Plus, CheckCircle, XCircle, Zap, AlignLeft, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, startOfToday } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider"; // Added

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const colors = [
  { value: "emerald", label: "Emerald Glow", bg: "bg-emerald-500" },
  { value: "violet", label: "Violet Pulse", bg: "bg-violet-500" },
  { value: "rose", label: "Rose Flare", bg: "bg-rose-500" },
];

export default function HabitsPage() {
  const { logout } = useAuth();
  const [habits, setHabits] = useState<any[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("emerald");
  const todayStr = format(startOfToday(), "yyyy-MM-dd");

  async function fetchHabits() {
    const token = localStorage.getItem("token");
    try {
        const res = await fetch(`${API}/habits/?archived=${showArchived}`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (res.status === 401) return logout(); // Auto-lock if unauthorized

        const data = await res.json();
        // FIXED: Ensure data is an array before setting state
        setHabits(Array.isArray(data) ? data : []);
    } catch (err) {
        console.error(err);
        setHabits([]);
    }
  }

  useEffect(() => { fetchHabits(); }, [showArchived]);

  async function createHabit(e: React.FormEvent) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    await fetch(`${API}/habits/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ name, description, color, created_at: todayStr }),
    });
    setName(""); setDescription(""); setOpen(false); fetchHabits();
  }

  async function toggleStatus(habitId: number, status: string, habitName: string) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}/habits/${habitId}/logs/${todayStr}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ status }),
    });
    if(res.ok) {
        alert(`Confirmed: "${habitName}" marked as ${status.toUpperCase()}.`);
        fetchHabits(); 
    }
  }

  async function deleteHabit(id: number) {
    if(confirm("Permanently delete?")) {
        const token = localStorage.getItem("token");
        await fetch(`${API}/habits/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
        fetchHabits();
    }
  }

  async function toggleArchive(habit: any) {
    const token = localStorage.getItem("token");
    await fetch(`${API}/habits/${habit.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
      body: JSON.stringify({ archived: !habit.archived }),
    });
    fetchHabits();
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-5xl font-black tracking-tighter uppercase text-primary leading-none">Habit Inventory</h1>
          <p className="text-muted-foreground font-bold tracking-widest text-[10px]">TOTAL CONTROL PROTOCOL</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setShowArchived(!showArchived)} className="rounded-2xl border-2 px-6 font-black uppercase text-xs">
            {showArchived ? "View Active" : "View Archive"}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-2xl font-black uppercase text-xs bg-primary shadow-xl shadow-primary/30 px-8">
                <Plus className="mr-2 h-4 w-4 stroke-[3px]" /> Create Habit
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-[2.5rem] border-4 shadow-2xl p-8">
              <DialogHeader><DialogTitle className="text-3xl font-black italic uppercase">NEW OBJECTIVE</DialogTitle></DialogHeader>
              <form onSubmit={createHabit} className="space-y-6 pt-6">
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest">Habit Name</Label><Input className="h-14 rounded-2xl text-xl font-bold border-2" value={name} onChange={(e) => setName(e.target.value)} required /></div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest">Description</Label><Input className="h-14 rounded-2xl text-lg border-2" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase tracking-widest">Vibe Theme</Label>
                    <div className="flex gap-4">
                        {colors.map(c => (
                            <div key={c.value} onClick={() => setColor(c.value)} className={cn("h-12 w-full rounded-xl cursor-pointer transition-all border-4", color === c.value ? "border-primary scale-105" : "border-transparent opacity-50", c.bg)} />
                        ))}
                    </div>
                </div>
                <Button type="submit" className="w-full h-16 text-xl font-black uppercase rounded-2xl">Initialize</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <AnimatePresence mode="popLayout">
          {habits.map((h, index) => (
            <motion.div key={h.id} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ delay: index * 0.05 }}>
              <Card className={cn(
                  "overflow-hidden border-2 rounded-[2.5rem] shadow-xl transition-all duration-300 group hover:-translate-y-2",
                  h.color === 'emerald' ? 'hover:border-emerald-500/50 bg-emerald-500/5' : h.color === 'violet' ? 'hover:border-violet-500/50 bg-violet-500/5' : 'hover:border-rose-500/50 bg-rose-500/5'
              )}>
                <CardHeader className="p-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-5">
                        <div className={cn("h-16 w-16 rounded-3xl flex items-center justify-center text-3xl font-black text-white shadow-2xl", h.color === 'emerald' ? 'bg-emerald-500' : h.color === 'violet' ? 'bg-violet-500' : 'bg-rose-500')}>
                            {h.name[0].toUpperCase()}
                        </div>
                        <div>
                            <CardTitle className="text-3xl font-black tracking-tighter flex items-center gap-2">
                                {h.name} {h.is_strategic && <Star className="h-5 w-5 fill-primary text-primary" />}
                            </CardTitle>
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <AlignLeft className="h-3 w-3" />
                                <span className="text-[10px] font-black uppercase tracking-widest">{h.is_strategic ? `Targeting: ${h.linked_goal_title}` : h.description || "Active Routine"}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        <Button variant="ghost" size="icon" onClick={() => toggleArchive(h)} className="hover:bg-muted rounded-full">
                            {h.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteHabit(h.id)} className="text-red-500 hover:bg-red-500/10 rounded-full"><Trash2 className="h-5 w-5" /></Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-8 pb-8 pt-0">
                    <div className="p-6 bg-background/50 rounded-[2rem] border-2 border-dashed border-muted flex items-center justify-between">
                        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Quick Log Today</p>
                        <div className="flex gap-3">
                            <Button onClick={() => toggleStatus(h.id, "done", h.name)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl px-6 h-10 shadow-lg">DONE</Button>
                            <Button onClick={() => toggleStatus(h.id, "missed", h.name)} className="bg-red-500 hover:bg-red-600 text-white font-black rounded-xl px-6 h-10 shadow-lg">MISS</Button>
                        </div>
                    </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}