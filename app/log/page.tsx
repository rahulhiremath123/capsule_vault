"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { db, LogEntry } from "../lib/db";

export default function LogPage() {
  const router = useRouter();
  const [capsuleId, setCapsuleId] = useState("");
  const [currentUser, setCurrentUser] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const capId = localStorage.getItem("anchor_capsule");
    const user = localStorage.getItem("anchor_user");
    if (!capId || !user) {
      router.push("/");
      return;
    }
    
    setCapsuleId(capId);
    setCurrentUser(user);
    
    const unsubscribe = db.subscribeLogs(capId, (data) => {
      setLogs(data.reverse());
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) return <div className="min-h-[100dvh] bg-[#11130e]" />;

  const handleAddSignal = async () => {
    await db.addLog(capsuleId, {
      author: currentUser,
      type: "text",
      content: "Presence acknowledged."
    });
  };

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#11130e] text-[#e0e0e0] flex flex-col selection:bg-accent/30 overflow-hidden">
      
      <div className="absolute inset-0 z-0 opacity-5 pointer-events-none mix-blend-overlay">
        <Image src="/bg.jpg" alt="Texture" fill className="object-cover grayscale" priority />
      </div>

      <header className="relative z-10 w-full p-8 flex justify-between items-center border-b border-[#3a3e30]/30">
        <button onClick={() => router.push("/dashboard")} className="font-serif tracking-[0.2em] uppercase text-sm text-[#8c9475] hover:text-white transition-colors flex items-center gap-4">
          <span className="w-4 h-[1px] bg-current inline-block"></span>
          Back to Hub
        </button>
        <span className="font-sans text-xs tracking-[0.2em] text-[#6b705c] uppercase">
          The Log &mdash; Capsule {capsuleId}
        </span>
      </header>

      <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto p-8 md:p-16 flex flex-col">
        
        <div className="mb-16 flex justify-between items-end">
          <div>
            <h1 className="font-serif text-5xl font-light tracking-wide mb-4 text-white">The Pulse</h1>
            <p className="font-sans text-xs text-[#8c9475] leading-relaxed max-w-sm uppercase tracking-widest">
              A chronological record of presence. No messages. Just signals across time.
            </p>
          </div>
          <button 
            onClick={handleAddSignal}
            className="w-16 h-16 rounded-full bg-[#1c1e16] flex items-center justify-center border border-[#6b705c]/50 cursor-pointer hover:bg-[#2c2f23] transition-colors shadow-[0_0_30px_rgba(107,112,92,0.1)] group"
          >
            <div className="w-4 h-4 rounded-full bg-[#8c9475] group-hover:scale-125 transition-transform duration-500"></div>
          </button>
        </div>

        {/* Timeline Grid */}
        <div className="relative flex-1 mt-12">
          {/* Fading timeline line */}
          <div className="absolute left-[31px] top-0 bottom-0 w-px bg-gradient-to-b from-[#3a3e30]/80 via-[#3a3e30]/30 to-transparent"></div>
          
          <div className="space-y-16">
            {logs.length === 0 && (
              <div className="pl-24 font-serif italic text-[#6b705c]">The grid is silent. Make the first entry.</div>
            )}
            
            {logs.map((log) => {
              const date = new Date(log.timestamp);
              const isVault = log.content.includes("recorded in the vault");
              
              return (
                <div key={log.id} className="relative flex items-center gap-10 group">
                  {/* Timeline dot/icon */}
                  <div className="w-16 h-16 rounded-full bg-[#0c0c0c] border border-[#3a3e30]/80 flex items-center justify-center z-10 shadow-[0_0_20px_rgba(0,0,0,0.8)] relative">
                    <div className="absolute inset-2 rounded-full border border-dashed border-[#5a604a]/30 animate-[spin_20s_linear_infinite] opacity-30"></div>
                    {isVault ? (
                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8c9475" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                    ) : (
                       <div className="w-2 h-2 rounded-full bg-[#8c9475] shadow-[0_0_10px_#8c9475]"></div>
                    )}
                  </div>
                  
                  {/* Content Card */}
                  <div className="flex-1 bg-gradient-to-r from-[#1a1c15]/80 to-[#1a1c15]/40 border-l-2 border-[#5a604a] border-y border-r border-y-[#3a3e30]/30 border-r-[#3a3e30]/30 p-6 md:p-8 backdrop-blur-md rounded-r-sm hover:translate-x-2 transition-transform duration-500">
                    <div className="flex justify-between items-center mb-6 border-b border-[#3a3e30]/30 pb-4">
                      <span className="font-sans text-[10px] tracking-[0.3em] uppercase text-[#6b705c]">
                        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} &middot; {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &middot; {log.author}
                      </span>
                      <span className={"font-sans text-[9px] tracking-[0.2em] uppercase px-3 py-1.5 rounded-sm border " + (isVault ? 'border-[#8c9475]/30 text-[#8c9475] bg-[#8c9475]/10' : 'border-[#6b705c]/30 text-[#6b705c] bg-[#1a1c15]')}>
                        {isVault ? 'Vault Sealed' : 'Pulse Signal'}
                      </span>
                    </div>
                    <p className={"font-serif text-xl " + (isVault ? 'text-white' : 'text-[#a0a58d]') + " italic font-light tracking-wide"}>
                      "{log.content}"
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}
