"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Flame } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Inside handleLogin in login/page.tsx
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
    // Inside handleLogin after const data = await res.json();
if (res.ok) {
    localStorage.setItem("token", data.access_token);
    
    // THIS LINE IS CRITICAL FOR THE MIDDLEWARE
    document.cookie = `token=${data.access_token}; path=/; max-age=604800; samesite=lax`;
    
    window.location.href = "/dashboard";
} else {
      alert(data.detail || "Login failed");
    }
  } catch (err) {
    alert("Backend not reachable");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center">
          <Flame className="h-8 w-8 text-primary mb-2" />
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Enter your email to access your habits</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button className="w-full" disabled={loading}>{loading ? "Connecting..." : "Login"}</Button>
            <p className="text-sm">New here? <Link href="/signup" className="text-primary hover:underline">Create account</Link></p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}