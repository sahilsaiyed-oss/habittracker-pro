"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flame, Target, TrendingUp, CheckCircle2 } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Habit {
  id: number;
  name: string;
  color: string;
  archived: boolean;
}

interface Log {
  id: number;
  habit_id: number;
  date: string;
  status: string;
}

export default function DashboardPage() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [habitsRes, logsRes] = await Promise.all([
          fetch(`${API}/habits/?archived=false`),
          fetch(`${API}/habits/`).then((r) => r.json()).then((allHabits: Habit[]) =>
            Promise.all(
              allHabits.map((h) => fetch(`${API}/habits/${h.id}/logs`).then((r) => r.json()))
            )
          ),
        ]);
        const habitsData = await habitsRes.json();
        const logsData = (await logsRes).flat();
        setHabits(habitsData);
        setLogs(logsData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const today = new Date().toISOString().split("T")[0];
  const todayLogs = logs.filter((l) => l.date === today);
  const doneToday = todayLogs.filter((l) => l.status === "done").length;
  const totalActive = habits.length;
  const progress = totalActive > 0 ? Math.round((doneToday / totalActive) * 100) : 0;

  const bestStreak = habits.reduce((max, h) => {
    const habitLogs = logs.filter((l) => l.habit_id === h.id && l.status === "done");
    const streak = computeStreak(habitLogs);
    return Math.max(max, streak);
  }, 0);

  function computeStreak(habitLogs: Log[]) {
    const dates = habitLogs.map((l) => l.date).sort();
    if (dates.length === 0) return 0;
    let best = 1;
    let cur = 1;
    for (let i = 1; i < dates.length; i++) {
      const prev = new Date(dates[i - 1]);
      const curr = new Date(dates[i]);
      const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        cur++;
        best = Math.max(best, cur);
      } else {
        cur = 1;
      }
    }
    return best;
  }

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Today's Command Center</h1>
        <p className="text-muted-foreground">Overview of your daily habits and progress.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Habits</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalActive}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Done Today</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{doneToday}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Best Streak</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bestStreak} days</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progress}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today's Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progress} className="h-2" />
          <div className="grid gap-3">
            {habits.map((h) => {
              const log = todayLogs.find((l) => l.habit_id === h.id);
              const status = log?.status || "-";
              return (
                <div key={h.id} className="flex items-center justify-between rounded-lg border p-3">
                  <span className="font-medium">{h.name}</span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      status === "done"
                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                        : status === "missed"
                        ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100"
                    }`}
                  >
                    {status === "done" ? "Done" : status === "missed" ? "Missed" : "Pending"}
                  </span>
                </div>
              );
            })}
            {habits.length === 0 && (
              <p className="text-sm text-muted-foreground">No active habits. Create one in the Habits page.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
