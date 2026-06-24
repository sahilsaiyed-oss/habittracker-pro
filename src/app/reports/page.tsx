"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Lock, FileText, ChevronRight, History, Download, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}/reports/dashboard`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    if (res.ok) setData(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const downloadPDF = async (reportId: number) => {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}/reports/export/${reportId}`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `Performance_Audit_${reportId}.pdf`;
    a.click();
  };

  if (loading) return <div className="p-20 text-center font-black animate-pulse uppercase tracking-widest text-foreground">Opening Audit Vault...</div>;

  const { status, history } = data;

  return (
    <div className="max-w-6xl mx-auto space-y-12 p-6 pb-24 text-foreground bg-background">
      {/* 1. VAULT HEADER */}
      <header className="border-b-4 border-foreground pb-8 flex justify-between items-end">
        <div>
          <h1 className="text-7xl font-black tracking-tighter uppercase italic leading-none">Audits</h1>
          <p className="font-bold opacity-40 uppercase tracking-[0.3em] text-[10px] mt-4">Authorized Performance History & Official Records</p>
        </div>
        <div className="text-right hidden md:block">
            <p className="text-xs font-black uppercase opacity-20">Access Status</p>
            <p className="text-xl font-black text-emerald-500 italic uppercase">Secure</p>
        </div>
      </header>

      {/* 2. LOCKED AUDIT PROTOCOLS (THE VAULT) */}
      <div className="grid lg:grid-cols-2 gap-10">
        
        {/* WEEKLY AUDIT LOCK */}
        <div className="space-y-6">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] opacity-40 flex items-center gap-2">
                <Lock className="h-3 w-3" /> Weekly Audit Status
            </h2>
            <Card className="border-4 rounded-[2.5rem] p-10 bg-card shadow-2xl relative overflow-hidden">
                <div className="space-y-8 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-foreground text-background flex items-center justify-center">
                            <Lock className="h-6 w-6" />
                        </div>
                        <h3 className="text-2xl font-black uppercase italic">Weekly Audit</h3>
                    </div>

                    <p className="text-sm font-medium opacity-60 leading-relaxed max-w-[320px]">
                        Complete 7 days of activity to unlock your first weekly performance audit. The system requires consistent behavioral data for verification.
                    </p>

                    <div className="space-y-3">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                            <span>Data Collection Progress</span>
                            <span>{status.weekly.recorded} / 7 Days</span>
                        </div>
                        <Progress value={(status.weekly.recorded / 7) * 100} className="h-4 border-2 border-foreground/10 bg-muted" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dashed">
                        <div>
                            <p className="text-[8px] font-black uppercase opacity-40">Days Remaining</p>
                            <p className="text-xl font-black text-foreground">{7 - status.weekly.recorded} Days</p>
                        </div>
                        <div>
                            <p className="text-[8px] font-black uppercase opacity-40">Expected Unlock</p>
                            <p className="text-xl font-black text-foreground">Sunday Window</p>
                        </div>
                    </div>
                </div>
            </Card>
        </div>

        {/* MONTHLY AUDIT LOCK */}
        <div className="space-y-6">
            <h2 className="text-xs font-black uppercase tracking-[0.2em] opacity-40 flex items-center gap-2">
                <Lock className="h-3 w-3" /> Monthly Audit Status
            </h2>
            <Card className="border-4 rounded-[2.5rem] p-10 bg-card shadow-2xl relative overflow-hidden opacity-80">
                <div className="space-y-8 relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-foreground text-background flex items-center justify-center">
                            <Lock className="h-6 w-6" />
                        </div>
                        <h3 className="text-2xl font-black uppercase italic">Monthly Audit</h3>
                    </div>

                    <p className="text-sm font-medium opacity-60 leading-relaxed max-w-[320px]">
                        Monthly audits become available after a complete calendar month of activity. These reports represent your official long-term record.
                    </p>

                    <div className="space-y-3">
                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                            <span>Readiness Protocol</span>
                            <span>{status.monthly.recorded} / 30 Days</span>
                        </div>
                        <Progress value={(status.monthly.recorded / 30) * 100} className="h-4 border-2 border-foreground/10 bg-muted" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dashed text-foreground">
                        <div>
                            <p className="text-[8px] font-black uppercase opacity-40">Days Remaining</p>
                            <p className="text-xl font-black">{30 - status.monthly.recorded} Days</p>
                        </div>
                        <div>
                            <p className="text-[8px] font-black uppercase opacity-40">Expected Unlock</p>
                            <p className="text-xl font-black">Next Month</p>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
      </div>

      {/* 3. PERFORMANCE ARCHIVE SECTION */}
      <section className="space-y-8 pt-10">
        <div className="flex items-center justify-between border-b-2 pb-4">
            <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-3 italic">
                <History className="h-5 w-5 text-primary" /> Performance Archive
            </h2>
            <span className="text-[10px] font-black uppercase opacity-30">All Snapshots Frozen & Immutable</span>
        </div>
        
        <div className="grid gap-6">
            {history.length === 0 ? (
                <Card className="border-4 border-dashed rounded-[3rem] p-24 bg-muted/5">
                    <div className="text-center space-y-4">
                        <FileText className="h-16 w-16 mx-auto opacity-10" />
                        <div className="space-y-1">
                            <p className="text-2xl font-black uppercase italic opacity-30">No reports generated yet.</p>
                            <p className="text-sm font-medium opacity-40 max-w-[400px] mx-auto uppercase tracking-tighter">
                                Complete your first audit cycle to begin building your personal performance history vault.
                            </p>
                        </div>
                    </div>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 gap-6">
                    {history.map((report: any) => (
                        <Card key={report.id} className="border-4 rounded-[2.5rem] p-8 hover:border-foreground transition-all group bg-card shadow-lg">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-6">
                                    <div className="h-16 w-16 rounded-[1.5rem] bg-foreground text-background flex items-center justify-center text-3xl font-black italic shadow-xl">
                                        {report.data.grade}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase opacity-40 tracking-widest">{report.type} Protocol</p>
                                        <h3 className="text-2xl font-black uppercase tracking-tighter">{report.period_label}</h3>
                                        <p className="text-xs font-bold text-muted-foreground mt-1 underline decoration-primary/50 underline-offset-4">{report.data.score}% Accuracy Rating</p>
                                    </div>
                                </div>
                                <Button 
                                    variant="outline" 
                                    onClick={() => downloadPDF(report.id)}
                                    className="rounded-full border-2 border-foreground h-12 w-12 p-0 hover:bg-foreground hover:text-background transition-all"
                                >
                                    <Download className="h-5 w-5" />
                                </Button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}
        </div>
      </section>
    </div>
  );
}