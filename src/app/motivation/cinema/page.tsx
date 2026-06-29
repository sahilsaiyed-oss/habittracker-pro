"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Target, Play, Clock, Zap, Maximize2, Pause, Music } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { cn } from "@/lib/utils"; // FIXED: Added missing import

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function CinemaMode() {
  const [goal, setGoal] = useState<any>(null);
  const [wallpaper, setWallpaper] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Session Timer Logic (45:00 default)
  const [seconds, setSeconds] = useState(2700); 
  
  useEffect(() => {
    const fetchData = async () => {
        const token = localStorage.getItem("token");
        const headers = { "Authorization": `Bearer ${token}` };
        try {
            const [gRes, imgRes] = await Promise.all([
                fetch(`${API}/goals/`, { headers }),
                fetch(`${API}/vision/images`, { headers })
            ]);
            const goals = await gRes.json();
            const images = await imgRes.json();

            if(Array.isArray(goals) && goals.length > 0) setGoal(goals[0]);
            if(Array.isArray(images) && images.length > 0) {
                // Set the first available wallpaper as background
                setWallpaper(images[0].url);
            }
        } catch (e) { console.error("Cinema Data Fetch Error:", e); }
    };
    fetchData();

    // ESC to Exit
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") window.history.back();
    };
    window.addEventListener("keydown", handleEsc);

    // Timer Interval
    const timer = setInterval(() => {
        setSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => {
        window.removeEventListener("keydown", handleEsc);
        clearInterval(timer);
    };
  }, []);

  const toggleMusic = () => {
    if (audioRef.current) {
        if (isPlaying) audioRef.current.pause();
        else audioRef.current.play();
        setIsPlaying(!isPlaying);
    }
  };

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white flex flex-col items-center justify-between p-10 md:p-20 overflow-hidden select-none">
        
        {/* 1. PREMIUM BACKGROUND ENGINE */}
        <AnimatePresence>
            {wallpaper && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.12 }}
                    className="absolute inset-0 z-0"
                >
                    <img 
                        src={`${API}${wallpaper}`} 
                        alt="Vision" 
                        className="w-full h-full object-cover blur-[20px] brightness-[0.2] scale-110 animate-slow-drift"
                    />
                </motion.div>
            )}
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black z-[1]" />

        {/* 2. EXIT CONTROL */}
        <button 
            onClick={() => window.history.back()} 
            className="fixed top-12 left-12 text-white/20 hover:text-white transition-all flex items-center gap-4 font-black uppercase text-[10px] tracking-[0.4em] z-50 group"
        >
            <div className="h-10 w-10 rounded-full border-2 border-white/10 flex items-center justify-center group-hover:border-white group-hover:scale-110 transition-all">
                <ArrowLeft className="h-4 w-4" />
            </div>
            Terminate Session [ESC]
        </button>

        {/* 3. MAIN MISSION INTERFACE (CENTERED) */}
        <div className="relative z-10 w-full max-w-6xl flex flex-col items-center justify-center flex-1 space-y-24">
            <motion.div 
                initial={{ y: 30, opacity: 0 }} 
                animate={{ y: 0, opacity: 1 }} 
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="text-center space-y-6"
            >
                <div className="flex justify-center mb-4">
                    <Target className="h-16 w-16 text-primary/40 animate-pulse" />
                </div>
                <h1 className="text-7xl md:text-[9rem] font-black tracking-[-0.05em] uppercase italic leading-none text-white drop-shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                    {goal?.title || "NO ACTIVE MISSION"}
                </h1>
                <p className="text-xl md:text-2xl font-bold text-primary tracking-[0.8em] uppercase opacity-40">Objective Control Center</p>
            </motion.div>

            {/* TACTICAL GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 w-full gap-16 border-y border-white/10 py-20 relative">
                <div className="text-center space-y-3">
                    <p className="text-[10px] font-black uppercase opacity-30 tracking-[0.5em]">Time Remaining</p>
                    <p className="text-6xl font-black italic text-white tracking-tighter uppercase">
                        {goal ? `${differenceInDays(parseISO(goal.deadline), new Date())} Days` : "000 Days"}
                    </p>
                </div>
                <div className="text-center space-y-3 md:border-x border-white/10 px-10">
                    <p className="text-[10px] font-black uppercase opacity-30 tracking-[0.5em]">System Integrity</p>
                    <p className="text-6xl font-black italic text-emerald-500 tracking-tighter drop-shadow-[0_0_15px_rgba(16,185,129,0.3)] uppercase">Optimal</p>
                </div>
                <div className="text-center space-y-3">
                    <p className="text-[10px] font-black uppercase opacity-30 tracking-[0.5em]">Current Focus</p>
                    <p className="text-6xl font-black italic text-white tracking-widest uppercase italic">Study</p>
                </div>
            </div>

            {/* DAILY QUOTE */}
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 0.7 }} 
                transition={{ delay: 1.5, duration: 2 }}
                className="text-center max-w-4xl px-6"
            >
                <p className="text-2xl md:text-3xl font-medium italic text-zinc-400 leading-relaxed tracking-tight">
                    "The elite do not negotiate with their feelings. They execute the plan regardless of the mood. Your mission is the only priority today."
                </p>
            </motion.div>
        </div>

        {/* 4. HUD INTERFACE (BOTTOM) */}
        <div className="relative z-10 flex flex-wrap justify-center gap-8 items-center mt-10">
            {/* AUDIO CONTROL */}
            <div className="flex items-center gap-8 bg-white/[0.03] backdrop-blur-2xl px-10 py-6 rounded-[2.5rem] border border-white/10 shadow-2xl transition-all hover:bg-white/5">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={toggleMusic}
                        className="h-12 w-12 rounded-2xl bg-white text-black flex items-center justify-center hover:scale-110 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                    >
                        {isPlaying ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current ml-1" />}
                    </button>
                    <div className="space-y-1">
                        <span className="font-black text-[10px] uppercase tracking-[0.3em] text-white block">Deep Intelligence (Lofi)</span>
                        {/* EQUALIZER BARS */}
                        <div className="flex gap-1 h-3 items-end">
                            {[1, 2, 3, 4, 5].map(i => (
                                <motion.div 
                                    key={i}
                                    animate={isPlaying ? { height: [4, 12, 6, 10, 4] } : { height: 2 }}
                                    transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                                    className="w-1 bg-primary rounded-full"
                                />
                            ))}
                        </div>
                    </div>
                </div>
                {/* Fallback sample audio for testing */}
                <audio ref={audioRef} loop src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" />
            </div>

            {/* TIMER CONTROL */}
            <div className={cn(
                "flex items-center gap-6 bg-white/[0.03] backdrop-blur-2xl px-12 py-6 rounded-[2.5rem] border border-white/10 shadow-2xl transition-all",
                seconds % 60 === 0 && seconds !== 2700 ? "animate-pulse border-primary/30" : ""
            )}>
                <Clock className="h-6 w-6 text-primary" />
                <div className="text-left">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 block leading-none mb-1">Session Timer</span>
                    <span className="text-2xl font-black italic tracking-widest text-white leading-none">{formatTime(seconds)}</span>
                </div>
            </div>

            {/* FULLSCREEN ICON BUTTON */}
            <button className="h-20 w-20 rounded-[2.5rem] bg-white/[0.03] border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                <Maximize2 className="h-6 w-6 text-white/40" />
            </button>
        </div>

        {/* CUSTOM ANIMATIONS */}
        <style jsx global>{`
            @keyframes slow-drift {
                0% { transform: scale(1.1) translate(0, 0); }
                50% { transform: scale(1.15) translate(-1%, -1%); }
                100% { transform: scale(1.1) translate(0, 0); }
            }
            .animate-slow-drift {
                animation: slow-drift 30s ease-in-out infinite;
            }
        `}</style>
    </div>
  );
}