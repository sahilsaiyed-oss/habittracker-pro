"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, ShieldCheck, Activity, RefreshCw, Cpu, Database } from "lucide-react";
import { motion } from "framer-motion";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function AISettingsPage() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const checkStatus = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API}/ai/status`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      setStatus(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { checkStatus(); }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-12 p-6 pb-24 text-foreground bg-background animate-in fade-in duration-700">
      <header className="border-b-4 border-foreground pb-8 flex justify-between items-end">
        <div>
          <h1 className="text-6xl font-black tracking-tighter uppercase italic leading-none">AI Control</h1>
          <p className="font-bold opacity-40 uppercase tracking-[0.3em] text-[10px] mt-4 text-primary">Neural Infrastructure Management</p>
        </div>
        <Button onClick={checkStatus} disabled={loading} variant="outline" className="rounded-full border-2 font-black uppercase text-[10px] px-8 h-12 hover:bg-foreground hover:text-background transition-all">
          {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Run Diagnostic
        </Button>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        {/* CONNECTION STATUS */}
        <Card className="border-4 rounded-[2.5rem] p-10 bg-card shadow-2xl relative overflow-hidden">
            <div className="relative z-10 space-y-6">
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg",
                        status?.status === "Connected" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                    )}>
                        <Zap className="h-6 w-6" />
                    </div>
                    <h3 className="text-2xl font-black uppercase italic">Uplink Status</h3>
                </div>
                
                <div>
                    <p className="text-[10px] font-black uppercase opacity-40 mb-1">Current State</p>
                    <p className={cn(
                        "text-4xl font-black tracking-tighter uppercase italic",
                        status?.status === "Connected" ? "text-emerald-500" : "text-red-500"
                    )}>
                        {status?.status || "DISCONNECTED"}
                    </p>
                </div>

                <div className="pt-6 border-t border-dashed">
                    <p className="text-[10px] font-black uppercase opacity-40 mb-2 italic">Neural Model in Use:</p>
                    <div className="p-4 bg-muted/50 rounded-2xl border-2 flex items-center gap-3">
                        <Cpu className="h-5 w-5 opacity-40" />
                        <span className="font-bold text-sm tracking-tight">{status?.model || "Checking..."}</span>
                    </div>
                </div>
            </div>
        </Card>

        {/* SECURITY & PERMISSIONS */}
        <Card className="border-4 border-dashed rounded-[2.5rem] p-10 bg-muted/5 flex flex-col justify-between">
            <div className="space-y-4">
                <div className="flex items-center gap-3 text-primary">
                    <ShieldCheck className="h-6 w-6" />
                    <h3 className="text-xl font-black uppercase italic">Security Protocol</h3>
                </div>
                <p className="text-sm font-medium opacity-60 leading-relaxed uppercase tracking-tighter">
                    AI Service operates on a <b>Read-Only</b> basis. It cannot modify habit logs, mission status, or historical audits.
                </p>
            </div>
            <div className="p-4 bg-foreground text-background rounded-2xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-center">Data Isolation: Enabled</p>
            </div>
        </Card>
      </div>

      {/* RECENT DIAGNOSTIC LOG */}
      <section className="space-y-6">
        <h2 className="text-xs font-black uppercase tracking-[0.2em] opacity-40 flex items-center gap-2">
            <Database className="h-3 w-3" /> System Logs
        </h2>
        <Card className="border-4 rounded-[2.5rem] p-8 bg-zinc-900 text-zinc-400 overflow-hidden font-mono text-xs shadow-inner">
            <div className="space-y-2">
                <p><span className="text-emerald-500">[LOG]</span> Initializing diagnostic request...</p>
                <p><span className="text-emerald-500">[LOG]</span> System Context: Loaded (Read-Only Mode)</p>
                <p><span className="text-emerald-500">[LOG]</span> Groq API Response: <span className="text-white font-bold">{status?.response || "Pending..."}</span></p>
                <p><span className="text-emerald-500">[LOG]</span> Infrastructure stable. Awaiting Phase 3.2 instructions.</p>
            </div>
        </Card>
      </section>
    </div>
  );
}