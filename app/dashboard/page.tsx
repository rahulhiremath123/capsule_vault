"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function DashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [capsuleId, setCapsuleId] = useState("");
  const [countdown, setCountdown] = useState("");
  const router = useRouter();

  useEffect(() => {
    const key = localStorage.getItem("anchor_key");
    const capId = localStorage.getItem("anchor_capsule");
    if (!key || !capId) {
      router.push("/");
    } else {
      setCapsuleId(capId);
      setIsAuthenticated(true);
    }
  }, [router]);

  useEffect(() => {
    if (isAuthenticated === null) return;
    
    const updateCountdown = () => {
      const now = new Date();
      const currentYear = now.getFullYear();
      let targetDate = new Date(currentYear, 10, 23); // Nov 23
      
      // If it's past Nov 23 this year, target next year
      if (now.getTime() > targetDate.getTime() + 86400000) { // + 1 day to allow viewing ON Nov 23
        targetDate = new Date(currentYear + 1, 10, 23);
      }
      
      // If today IS Nov 23
      if (now.getMonth() === 10 && now.getDate() === 23) {
        setCountdown("THE WINDOW IS OPEN");
        return;
      }

      const diff = targetDate.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown(`${days}D ${hours.toString().padStart(2, '0')}H ${mins.toString().padStart(2, '0')}M ${secs.toString().padStart(2, '0')}S`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  if (isAuthenticated === null) {
    return <div className="min-h-[100dvh] bg-[#11130e]" />;
  }

  if (!isAuthenticated) return null;

  const handleLock = () => {
    localStorage.removeItem("anchor_key");
    localStorage.removeItem("anchor_capsule");
    router.push("/");
  };

  const copyCapsuleId = () => {
    navigator.clipboard.writeText(capsuleId);
    alert("Capsule ID copied to clipboard!");
  };

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#11130e] text-white overflow-hidden flex flex-col selection:bg-accent/30">
      
      <div className="absolute inset-0 z-0 opacity-10 pointer-events-none mix-blend-overlay">
        <Image src="/bg.jpg" alt="Texture" fill className="object-cover grayscale" />
      </div>

      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute left-[-20%] top-[-10%] w-[80vw] h-[120vh] border-r border-[#3a3e30] rounded-[50%] opacity-40"></div>
        <div className="absolute left-[-25%] top-[-5%] w-[85vw] h-[110vh] border-r border-dashed border-[#5a604a] rounded-[50%] opacity-20"></div>
        <div className="absolute top-[20%] w-full h-[1px] bg-[#3a3e30]/30"></div>
        <div className="absolute top-[80%] w-full h-[1px] bg-[#3a3e30]/30"></div>
      </div>

      <header className="relative z-10 w-full p-8 flex justify-between items-center border-b border-[#3a3e30]/50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full border border-[#5a604a] flex items-center justify-center">
            <div className="w-2 h-2 bg-[#8c9475] rounded-full"></div>
          </div>
          <span className="font-serif tracking-[0.2em] uppercase text-sm text-[#8c9475]">Capsule {capsuleId}</span>
        </div>
        <div className="flex items-center gap-8 font-sans text-xs tracking-[0.2em] text-[#6b705c] uppercase">
          <button onClick={copyCapsuleId} className="hover:text-white transition-colors border border-[#5a604a] px-3 py-1.5 rounded-sm">
            Copy ID
          </button>
          <button onClick={handleLock} className="hover:text-white transition-colors flex items-center gap-2">
            <span className="w-4 h-[1px] bg-current inline-block"></span>
            Lock
          </button>
        </div>
      </header>

      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto p-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column: The Log */}
        <div className="lg:col-span-5 space-y-12">
          <div className="space-y-4">
            <h2 className="font-serif text-4xl md:text-5xl text-[#e0e0e0] font-light">The Log</h2>
            <p className="font-sans text-sm leading-loose text-[#8c9475] font-light max-w-sm">
              A shared grid tracking presence across the distance. Make an entry to signal you are there.
            </p>
          </div>

          <button onClick={() => router.push("/log")} className="w-16 h-16 rounded-full bg-[#1c1e16] flex items-center justify-center border border-[#6b705c]/50 cursor-pointer hover:bg-[#2c2f23] transition-colors shadow-[0_0_30px_rgba(107,112,92,0.1)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#e0e0e0" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
          </button>
        </div>

        {/* Center/Right Column: The Vault */}
        <div className="lg:col-span-7 relative flex justify-center lg:justify-end">
          <div className="relative group cursor-pointer" onClick={() => router.push("/vault")}>
            <h1 className="font-sans text-8xl md:text-[180px] font-light tracking-tighter text-[#e0e0e0] opacity-90 group-hover:opacity-100 transition-opacity">
              VAULT
            </h1>
            
            <div className="absolute top-1/2 left-0 md:left-[-10%] transform -translate-y-1/2 backdrop-blur-md bg-[#11130e]/80 border border-[#3a3e30] p-8 md:p-12 w-full max-w-md shadow-2xl group-hover:border-[#6b705c] transition-colors">
              <h3 className="font-serif text-2xl md:text-3xl mb-2 text-[#e0e0e0]">The Cryptographic Vault</h3>
              <p className="font-sans text-xs tracking-[0.2em] uppercase text-[#6b705c] mb-6">
                Window opens annually on Nov 23
              </p>
              <div className="mb-8 border-y border-[#3a3e30]/30 py-4 flex flex-col items-center justify-center bg-[#1a1c15]/50">
                <span className="font-sans text-[9px] tracking-[0.3em] uppercase text-[#5a604a] mb-2">Time until seal breaks</span>
                <span className="font-serif text-2xl text-white tracking-[0.1em] font-light">{countdown || 'CALCULATING...'}</span>
              </div>
              <p className="font-sans text-sm text-[#8c9475] leading-relaxed font-light mb-8">
                Draft secure entries, letters, and upload media. Shared securely between the two capsule members.
              </p>
              <span className="text-xs uppercase tracking-[0.2em] font-sans border-b border-[#8c9475] pb-1 text-[#e0e0e0] transition-all">
                Access Vault &rarr;
              </span>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
