"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import LoginPage from "@/app/login/page";
import { cn } from "@/lib/utils";
import { Sidebar } from "./sidebar";

const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  const logout = () => {
    localStorage.removeItem("token");
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
    setIsAuthenticated(false);
    router.replace("/login");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.exp * 1000 > Date.now()) {
          setIsAuthenticated(true);
        } else { logout(); }
      } catch (e) { logout(); }
    } else {
      setIsAuthenticated(false);
    }
  }, [pathname]);

  const isAuthPage = pathname === "/login" || pathname === "/signup";

  if (isAuthenticated === null) {
    return <div className="h-screen w-full bg-background flex items-center justify-center font-black uppercase italic tracking-widest">Establishing Secure Uplink...</div>;
  }

  return (
    <AuthContext.Provider value={{ logout, isAuthenticated }}>
      <div className="relative min-h-screen flex">
        
        {/* 
            SIDEBAR & CONTENT WRAPPER:
            Jab user login nahi hai, ye section blur rahega aur pointer-events-none 
            ki wajah se click block kar dega.
        */}
        <div className={cn(
            "flex flex-1 transition-all duration-1000",
            (!isAuthenticated && !isAuthPage) ? "blur-[20px] pointer-events-none grayscale opacity-30 select-none scale-[1.01]" : ""
        )}>
            <Sidebar />
            <main className="flex-1 overflow-auto bg-background">
                {children}
            </main>
        </div>

        {/* LOGIN OVERLAY: Pure screen ke upar aayega agar login nahi hai */}
        {(!isAuthenticated && !isAuthPage) && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/20 backdrop-blur-md">
             <div className="w-full max-w-md animate-in zoom-in-95 duration-500">
                <LoginPage isOverlay={true} />
             </div>
          </div>
        )}
      </div>
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);