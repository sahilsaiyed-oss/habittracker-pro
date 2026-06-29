"use client";

import { useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
    Zap, Music, Video, Star, Trash2, Plus, Image as ImageIcon, 
    Maximize2, FileText, Download, Quote, Play, Pause, Headphones,
    ChevronRight // FIXED: Added missing import
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function MotivationHub() {
  const [images, setImages] = useState<any[]>([]);
  const [media, setMedia] = useState<any[]>([]);
  const [quote, setQuote] = useState("Discipline is the bridge between goals and accomplishment.");
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    const token = localStorage.getItem("token");
    const headers = { "Authorization": `Bearer ${token}` };
    try {
        const [imgRes, medRes, qRes] = await Promise.all([
            fetch(`${API}/vision/images`, { headers }),
            fetch(`${API}/vision/media`, { headers }),
            fetch(`${API}/ai/quote`, { headers })
        ]);
        
        const imgData = await imgRes.json();
        const medData = await medRes.json();
        const qData = await qRes.json();

        setImages(Array.isArray(imgData) ? imgData : []);
        setMedia(Array.isArray(medData) ? medData : []);
        if(qData.quote) setQuote(qData.quote);
    } catch (e) { 
        console.error("Data fetch failed", e); 
        setImages([]); setMedia([]);
    } finally { 
        setLoading(false); 
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}/vision/upload`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
    });
    if(res.ok) fetchData();
  };

  const deleteItem = (type: string, id: number) => {
    if(!confirm("Permanently delete this asset?")) return;
    const token = localStorage.getItem("token");
    fetch(`${API}/vision/delete/${type}/${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
    }).then(() => fetchData());
  };

  if (loading) return (
    <div className="p-20 text-center font-black text-4xl animate-pulse uppercase text-foreground">
      Initialising Motivation Hub...
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-12 pb-32 bg-background text-foreground animate-in fade-in duration-700">
      
      {/* HEADER - HIGH CONTRAST */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-8 border-foreground pb-6 gap-4">
        <div>
          <h1 className="text-6xl font-black tracking-tighter uppercase leading-none">Motivation</h1>
          <p className="font-bold opacity-50 uppercase tracking-[0.2em] text-sm mt-2 ml-1 text-muted-foreground">Inspiration & Media Center</p>
        </div>
        <input type="file" ref={fileInputRef} className="hidden" onChange={handleUpload} />
        <Button onClick={() => fileInputRef.current?.click()} className="rounded-xl bg-foreground text-background px-10 h-14 font-black uppercase text-xs shadow-lg hover:scale-105 transition-all">
            + Add Media
        </Button>
      </header>

      {/* 1. DAILY QUOTE - MINIMAL & ELEGANT */}
      <section className="text-center py-6">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <Quote className="h-10 w-10 mx-auto mb-6 text-primary opacity-20" />
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-tight uppercase italic max-w-5xl mx-auto text-foreground">
                "{quote}"
            </h2>
        </motion.div>
      </section>

      {/* 2. WALLPAPER GALLERY */}
      <section className="space-y-6">
        <h3 className="text-2xl font-black uppercase tracking-tight border-l-8 border-foreground pl-4">Wallpapers</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {images.map(img => (
                <div key={img.id} className="group relative rounded-3xl overflow-hidden border-4 border-border aspect-video bg-muted shadow-xl">
                    <img src={`${API}${img.url}`} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <Button onClick={() => window.open(`${API}${img.url}`, '_blank')} size="icon" variant="secondary" className="rounded-full h-12 w-12 border-2 border-white"><Maximize2 className="h-5 w-5" /></Button>
                        <Button onClick={() => deleteItem('image', img.id)} size="icon" variant="destructive" className="rounded-full h-12 w-12 border-2 border-white"><Trash2 className="h-5 w-5" /></Button>
                    </div>
                </div>
            ))}
            <div onClick={() => fileInputRef.current?.click()} className="aspect-video rounded-3xl border-4 border-dashed border-border flex flex-col items-center justify-center opacity-30 hover:opacity-100 cursor-pointer transition-all hover:bg-muted text-foreground">
                <Plus className="h-12 w-12" />
                <span className="text-[10px] font-black uppercase mt-2">Upload Wallpaper</span>
            </div>
        </div>
      </section>

      {/* 3. VIDEOS SECTION */}
      <section className="space-y-6">
          <h3 className="text-2xl font-black uppercase tracking-tight border-l-8 border-foreground pl-4">Videos</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {media.filter(m => m.type === 'video').map(v => (
                <Card key={v.id} className="border-4 rounded-3xl overflow-hidden bg-zinc-950 group relative">
                    <video src={`${API}${v.source}`} controls className="w-full aspect-video" />
                    <div className="p-4 flex justify-between items-center bg-card border-t-2 border-border">
                        <p className="font-black text-xs uppercase truncate text-foreground">{v.title}</p>
                        <Button onClick={() => deleteItem('media', v.id)} variant="ghost" size="icon" className="text-red-500 hover:bg-red-50"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                </Card>
            ))}
            <div onClick={() => fileInputRef.current?.click()} className="aspect-video rounded-3xl border-4 border-dashed border-border flex flex-col items-center justify-center opacity-30 hover:opacity-100 cursor-pointer transition-all hover:bg-muted text-foreground">
                <Video className="h-12 w-12" />
                <span className="text-[10px] font-black uppercase mt-2">Upload Video</span>
            </div>
          </div>
      </section>

      {/* 4. MUSIC LIBRARY */}
      <section className="space-y-6">
          <h3 className="text-2xl font-black uppercase tracking-tight border-l-8 border-foreground pl-4">Music Library</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {media.filter(m => m.type === 'music').map(track => (
                <Card key={track.id} className="border-4 rounded-3xl p-6 flex flex-col justify-between hover:border-foreground transition-all bg-card shadow-sm h-48">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 bg-muted rounded-xl flex items-center justify-center text-primary shadow-inner border-2 border-border"><Music className="h-6 w-6" /></div>
                        <div className="min-w-0">
                            <p className="font-black text-sm uppercase tracking-tight truncate text-foreground">{track.title}</p>
                            <p className="text-[10px] font-bold opacity-40 uppercase tracking-widest mt-1">Audio Protocol</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-muted/20 p-2 rounded-2xl">
                        <audio src={`${API}${track.source}`} controls className="h-8 flex-1" />
                        <Button onClick={() => deleteItem('media', track.id)} variant="ghost" size="icon" className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                </Card>
            ))}
            <div onClick={() => fileInputRef.current?.click()} className="h-48 rounded-3xl border-4 border-dashed border-border flex flex-col items-center justify-center opacity-30 hover:opacity-100 cursor-pointer transition-all hover:bg-muted text-foreground">
                <Headphones className="h-12 w-12" />
                <span className="text-[10px] font-black uppercase mt-2">Upload Music</span>
            </div>
          </div>
      </section>

      {/* 5. PDF BOOKS LIBRARY */}
      <section className="space-y-6">
        <h3 className="text-2xl font-black uppercase tracking-tight border-l-8 border-foreground pl-4">Knowledge Base (PDF)</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {media.filter(m => m.type === 'pdf').map(doc => (
                <Card key={doc.id} className="border-4 rounded-[2rem] p-8 text-center space-y-4 hover:border-foreground transition-all bg-card shadow-md">
                    <div className="h-24 w-20 mx-auto bg-muted rounded-md flex items-center justify-center shadow-lg border-2 border-border">
                        <FileText className="h-12 w-12 opacity-30 text-foreground" />
                    </div>
                    <p className="font-black text-[10px] uppercase truncate px-2 text-foreground">{doc.title}</p>
                    <div className="flex gap-2">
                        <Button onClick={() => window.open(`${API}${doc.source}`)} className="flex-1 rounded-xl h-10 font-black text-[10px] uppercase bg-foreground text-background">Open</Button>
                        <Button onClick={() => deleteItem('media', doc.id)} variant="outline" className="border-2 rounded-xl h-10 w-10 p-0 text-red-500 border-border"><Trash2 className="h-4 w-4" /></Button>
                    </div>
                </Card>
            ))}
            <div onClick={() => fileInputRef.current?.click()} className="rounded-[2rem] border-4 border-dashed border-border p-10 flex flex-col items-center justify-center opacity-30 hover:opacity-100 cursor-pointer transition-all hover:bg-muted text-foreground">
                <Plus className="h-10 w-10" />
                <span className="text-[10px] font-black uppercase mt-2">Add PDF</span>
            </div>
        </div>
      </section>

      {/* 6. CINEMA MODE BANNER */}
      <section className="pt-10">
          <div onClick={() => window.location.href='/motivation/cinema'} className="w-full h-32 bg-foreground text-background rounded-[3rem] flex items-center justify-between px-12 cursor-pointer hover:scale-[1.02] transition-all shadow-2xl group">
              <div className="flex items-center gap-8">
                  <div className="h-16 w-16 rounded-2xl bg-background/20 flex items-center justify-center group-hover:rotate-12 transition-transform">
                      <Maximize2 className="h-8 w-8 text-background" />
                  </div>
                  <div>
                      <h2 className="text-4xl font-black uppercase italic tracking-tighter">Cinema Mode</h2>
                      <p className="text-[11px] font-bold opacity-60 uppercase tracking-[0.3em] mt-1">Full Screen Inspiration Engine</p>
                  </div>
              </div>
              <ChevronRight className="h-12 w-12 opacity-30 group-hover:translate-x-2 transition-all" />
          </div>
      </section>
    </div>
  );
}