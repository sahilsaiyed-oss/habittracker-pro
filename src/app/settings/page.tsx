"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "next-themes";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Habit {
  id: number;
  name: string;
  color: string;
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [habits, setHabits] = useState<Habit[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token"); // Auth Token
    fetch(`${API}/habits/?archived=false`, {
        headers: { "Authorization": `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then((d) => {
          if (Array.isArray(d)) setHabits(d);
      });
  }, []);

  async function updateColor(habitId: number, color: string) {
    const token = localStorage.getItem("token"); // Auth Token
    await fetch(`${API}/habits/${habitId}`, {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}` 
      },
      body: JSON.stringify({ color }),
    });
    setHabits((prev) => prev.map((h) => (h.id === habitId ? { ...h, color } : h)));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your profile and appearance.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode">Dark Mode</Label>
            <Switch
              id="dark-mode"
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Habit Themes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {habits.map((h) => (
            <div key={h.id} className="flex items-center justify-between">
              <span className="font-medium">{h.name}</span>
              <div className="flex gap-2">
                {["emerald", "violet", "rose"].map((c) => (
                  <Button
                    key={c}
                    variant={h.color === c ? "default" : "outline"}
                    size="sm"
                    onClick={() => updateColor(h.id, c)}
                  >
                    <span
                      className={`mr-2 inline-block h-3 w-3 rounded-full ${
                        c === "emerald"
                          ? "bg-emerald-500"
                          : c === "violet"
                          ? "bg-violet-500"
                          : "bg-rose-500"
                      }`}
                    />
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          ))}
          {habits.length === 0 && (
            <p className="text-muted-foreground">No habits to theme.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}