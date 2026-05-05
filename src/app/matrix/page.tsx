"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Minus } from "lucide-react";

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

  async function fetchData() {
    const habitsRes = await fetch(`${API}/habits/?archived=false`);
    const habitsData = await habitsRes.json();
    const allLogs = await Promise.all(
      habitsData.map((h: Habit) => fetch(`${API}/habits/${h.id}/logs`).then((r) => r.json()))
    );
    setHabits(habitsData);
    setLogs(allLogs.flat());
  }

  useEffect(() => {
    fetchData();
  }, []);

  const dates = useMemo(() => {
    const arr: string[] = [];
    const today = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      arr.push(d.toISOString().split("T")[0]);
    }
    return arr;
  }, []);

  async function toggleStatus(habitId: number, date: string, current: string) {
    const next = current === "done" ? "missed" : current === "missed" ? "skip" : "done";
    await fetch(`${API}/habits/${habitId}/logs/${date}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    fetchData();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tracking Matrix</h1>
        <p className="text-muted-foreground">14-day grid to toggle completion states.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>14-Day Grid</CardTitle>
        </CardHeader>
        <CardContent className="overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="text-left p-2">Habit</th>
                {dates.map((d) => (
                  <th key={d} className="text-center p-2 min-w-[2.5rem]">
                    {new Date(d).getDate()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {habits.map((h) => (
                <tr key={h.id} className="border-t">
                  <td className="p-2 font-medium">{h.name}</td>
                  {dates.map((d) => {
                    const log = logs.find((l) => l.habit_id === h.id && l.date === d);
                    const status = log?.status || "-";
                    return (
                      <td key={d} className="p-2 text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-8 w-8 rounded-md ${
                            status === "done"
                              ? "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-100"
                              : status === "missed"
                              ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-100"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                          }`}
                          onClick={() => toggleStatus(h.id, d, status)}
                        >
                          {status === "done" ? (
                            <Check className="h-4 w-4" />
                          ) : status === "missed" ? (
                            <X className="h-4 w-4" />
                          ) : (
                            <Minus className="h-4 w-4" />
                          )}
                        </Button>
                      </td>
                    );
                  })}
                </tr>
              ))}
              {habits.length === 0 && (
                <tr>
                  <td colSpan={15} className="p-4 text-muted-foreground text-center">
                    No habits to track.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
