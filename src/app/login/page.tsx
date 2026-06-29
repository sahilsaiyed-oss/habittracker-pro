"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { LockKeyhole } from "lucide-react";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function LoginPage({ isOverlay = false }: { isOverlay?: boolean }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.access_token);
        document.cookie = `token=${data.access_token}; path=/; max-age=604800; samesite=lax`;
        window.location.href = "/dashboard";
      } else {
        alert("Access Denied: Incorrect credentials.");
        setLoading(false);
      }
    } catch (err) {
      alert("Neural Link Offline.");
      setLoading(false);
    }
  };

  return (
    <div className={cn("flex items-center justify-center", !isOverlay && "min-h-screen bg-muted/10 px-4")}>
      <Card className="w-full max-w-md border-4 rounded-[3.5rem] shadow-2xl bg-card border-border">
        <CardHeader className="flex flex-col items-center">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center mb-4">
             <LockKeyhole className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-4xl font-black uppercase italic tracking-tighter text-foreground">Login</CardTitle>
          <CardDescription className="font-bold text-muted-foreground uppercase text-[10px] tracking-widest">
            Enter valid credentials to unlock system
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase ml-1 text-foreground">Email</Label>
              <Input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="name@example.com" required autoComplete="off" className="h-12 rounded-xl border-2 bg-background focus-visible:ring-0 text-foreground" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase ml-1 text-foreground">Password</Label>
              <Input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="security key" required autoComplete="new-password" className="h-12 rounded-xl border-2 bg-background focus-visible:ring-0 text-foreground" />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full h-14 rounded-2xl font-black uppercase text-base bg-foreground text-background" disabled={loading}>
                {loading ? "Verifying..." : "Login"}
            </Button>
            <p className="text-xs font-bold text-muted-foreground uppercase">New? <Link href="/signup" className="text-primary hover:underline italic">Create Account</Link></p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}