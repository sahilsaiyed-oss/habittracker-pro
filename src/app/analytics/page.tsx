"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Analytics {
  total_habits: number;
  active_habits: number;
  completion_rate: number;
  weekly_data: { date: string; day: string; done: number; total: number; rate: number }[];
  heatmap: { date: string; intensity: number }[];
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);

  useEffect(() => {
    fetch(`${API}/analytics/`)
      .then((r) => r.json())
      .then((d) => setData(d));
  }, []);

  if (!data) return <div className="p-6">Loading...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Performance insights and consistency trends.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Habits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total_habits}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Active Habits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.active_habits}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">7-Day Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.completion_rate}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly Success</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weekly_data}>
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="done" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Consistency Heatmap (Last 90 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1">
            {data.heatmap.map((cell) => {
              let bg = "bg-gray-100 dark:bg-gray-800";
              if (cell.intensity >= 0 && cell.intensity < 0.3) bg = "bg-green-200 dark:bg-green-900";
              if (cell.intensity >= 0.3 && cell.intensity < 0.7) bg = "bg-green-400 dark:bg-green-700";
              if (cell.intensity >= 0.7) bg = "bg-green-600 dark:bg-green-500";
              return (
                <div
                  key={cell.date}
                  title={cell.date}
                  className={`h-4 w-4 rounded-sm ${bg}`}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
