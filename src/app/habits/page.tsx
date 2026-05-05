"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Archive, ArchiveRestore, Trash2, Plus } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Habit {
  id: number;
  name: string;
  description?: string;
  color: string;
  archived: boolean;
  created_at: string;
}

const colors = [
  { value: "emerald", label: "Emerald" },
  { value: "violet", label: "Violet" },
  { value: "rose", label: "Rose" },
];

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("emerald");

  async function fetchHabits() {
    const res = await fetch(`${API}/habits/?archived=${showArchived}`);
    const data = await res.json();
    setHabits(data);
  }

  useEffect(() => {
    fetchHabits();
  }, [showArchived]);

  async function createHabit(e: React.FormEvent) {
    e.preventDefault();
    await fetch(`${API}/habits/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description,
        color,
        created_at: new Date().toISOString().split("T")[0],
      }),
    });
    setName("");
    setDescription("");
    setColor("emerald");
    setOpen(false);
    fetchHabits();
  }

  async function toggleArchive(habit: Habit) {
    await fetch(`${API}/habits/${habit.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ archived: !habit.archived }),
    });
    fetchHabits();
  }

  async function deleteHabit(id: number) {
    await fetch(`${API}/habits/${id}`, { method: "DELETE" });
    fetchHabits();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Habits</h1>
          <p className="text-muted-foreground">Manage your habits and routines.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowArchived((s) => !s)}>
            {showArchived ? "Show Active" : "Show Archived"}
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Habit
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Habit</DialogTitle>
              </DialogHeader>
              <form onSubmit={createHabit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Color Theme</Label>
                  <Select value={color} onValueChange={setColor}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {colors.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full">Create</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4">
        {habits.map((h) => (
          <Card key={h.id}>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`h-3 w-3 rounded-full ${
                    h.color === "emerald"
                      ? "bg-emerald-500"
                      : h.color === "violet"
                      ? "bg-violet-500"
                      : "bg-rose-500"
                  }`}
                />
                <div>
                  <CardTitle className="text-base">{h.name}</CardTitle>
                  {h.description && (
                    <p className="text-sm text-muted-foreground">{h.description}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => toggleArchive(h)}>
                  {h.archived ? <ArchiveRestore className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteHabit(h.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
          </Card>
        ))}
        {habits.length === 0 && (
          <p className="text-muted-foreground">No habits found.</p>
        )}
      </div>
    </div>
  );
}
