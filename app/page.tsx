"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { db } from "./lib/db";

export default function EntryPage() {
  const [mode, setMode] = useState<"select" | "create" | "join">("select");
  const [capsuleId, setCapsuleId] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [userName, setUserName] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      setError("Please enter your name/identity.");
      return;
    }
    if (passphrase.length < 10) {
      setError("Passphrase must be profound (at least 10 characters).");
      return;
    }
    const newId = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    await db.createCapsule(newId);
    
    localStorage.setItem("anchor_capsule", newId);
    localStorage.setItem("anchor_key", passphrase);
    localStorage.setItem("anchor_user", userName.trim());
    router.push("/dashboard");
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      setError("Please enter your name/identity.");
      return;
    }
    if (capsuleId.length < 5) {
      setError("Invalid Capsule ID.");
      return;
    }
    if (passphrase.length < 10) {
      setError("Passphrase must be profound (at least 10 characters).");
      return;
    }
    
    const exists = await db.checkCapsuleExists(capsuleId.toUpperCase());
    if (!exists) {
      setError("Capsule not found.");
      return;
    }
    
    localStorage.setItem("anchor_capsule", capsuleId.toUpperCase());
    localStorage.setItem("anchor_key", passphrase);
    localStorage.setItem("anchor_user", userName.trim());
    router.push("/dashboard");
  };

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center overflow-hidden selection:bg-accent/30 selection:text-white">
      <div className="absolute inset-0 z-0">
        <Image src="/bg.jpg" alt="Classical architecture" fill className="object-cover opacity-30 mix-blend-luminosity grayscale-[30%]" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-80" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black opacity-80" />
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-center">
        <div className="geometric-circle"></div>
        <div className="geometric-crosshair"></div>
        <div className="absolute w-2 h-2 bg-white/20 rotate-45"></div>
      </div>

      <div className="relative z-20 w-full max-w-lg space-y-16 animate-in fade-in zoom-in-95 duration-1000 p-6">
        
        <div className="space-y-6 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-white/50 font-sans">Aesthetic Asynchronous Presence</p>
          <h1 className="text-5xl md:text-7xl font-serif text-white tracking-wide font-light">
            THE CAPSULE
          </h1>
          <p className="font-serif text-white/70 italic text-lg md:text-xl tracking-wider">
            "A shared quiet across time."
          </p>
        </div>

        {mode === "select" && (
          <div className="space-y-6 relative backdrop-blur-sm bg-black/20 p-8 rounded-sm border border-white/5">
            <button
              onClick={() => setMode("create")}
              className="w-full py-4 text-xs tracking-[0.3em] uppercase text-white hover:text-white transition-colors duration-500 font-sans border border-[#6b705c] hover:bg-[#6b705c]/20"
            >
              Initiate a New Capsule
            </button>
            <button
              onClick={() => setMode("join")}
              className="w-full py-4 text-xs tracking-[0.3em] uppercase text-white/50 hover:text-white transition-colors duration-500 font-sans border border-white/10 hover:border-white/30 hover:bg-white/5"
            >
              Enter an Existing Capsule
            </button>
          </div>
        )}

        {mode === "create" && (
          <form onSubmit={handleCreate} className="space-y-8 relative backdrop-blur-sm bg-black/20 p-8 rounded-sm border border-white/5 animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-6">
              <div>
                <label className="block text-center text-xs tracking-[0.2em] text-white/40 uppercase font-sans mb-4">Your Identity</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. Rahul"
                  className="w-full bg-transparent border-b border-white/20 pb-3 text-center text-base md:text-lg text-white focus:outline-none focus:border-[#6b705c] transition-colors tracking-widest placeholder:text-white/20 font-sans rounded-none"
                />
              </div>
              <div>
                <label className="block text-center text-xs tracking-[0.2em] text-white/40 uppercase font-sans mb-4">
                  Set a Shared Passphrase
                </label>
                <div className="relative">
                  <input
                    type={showPassphrase ? "text" : "password"}
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="End-to-End Encryption Key"
                    className="w-full bg-transparent border-b border-white/20 pb-3 pt-2 text-center text-base md:text-lg text-white focus:outline-none focus:border-[#6b705c] transition-colors tracking-widest placeholder:tracking-widest placeholder:text-white/20 font-sans pr-10 rounded-none"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassphrase(!showPassphrase)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                  >
                    {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-[#6b705c] text-center uppercase tracking-widest mt-2">This encrypts all your data. If lost, the capsule is gone forever.</p>
              </div>
              {error && <p className="text-[#c75e5e] text-xs text-center font-sans tracking-wide mt-2">{error}</p>}
            </div>

            <div className="flex gap-4">
              <button type="button" onClick={() => setMode("select")} className="flex-1 py-4 text-[10px] tracking-[0.3em] uppercase text-white/30 hover:text-white border border-transparent">Back</button>
              <button type="submit" className="flex-[2] py-4 text-xs tracking-[0.3em] uppercase text-white border border-[#6b705c] hover:bg-[#6b705c]/20 transition-colors">Initiate</button>
            </div>
          </form>
        )}

        {mode === "join" && (
          <form onSubmit={handleJoin} className="space-y-8 relative backdrop-blur-sm bg-black/20 p-8 rounded-sm border border-white/5 animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-6">
              <div>
                <label className="block text-center text-xs tracking-[0.2em] text-white/40 uppercase font-sans mb-4">Your Identity</label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="e.g. Rahul"
                  className="w-full bg-transparent border-b border-white/20 pb-3 text-center text-base md:text-lg text-white focus:outline-none focus:border-[#6b705c] transition-colors tracking-widest placeholder:text-white/20 font-sans rounded-none"
                />
              </div>
              <div>
                <label className="block text-center text-xs tracking-[0.2em] text-white/40 uppercase font-sans mb-4">Capsule ID</label>
                <input
                  type="text"
                  value={capsuleId}
                  onChange={(e) => setCapsuleId(e.target.value)}
                  placeholder="e.g. X7B9-Q2"
                  className="w-full bg-transparent border-b border-white/20 pb-3 text-center text-base md:text-lg text-white focus:outline-none focus:border-[#6b705c] transition-colors tracking-widest placeholder:text-white/20 font-sans uppercase rounded-none"
                />
              </div>
              <div>
                <label className="block text-center text-xs tracking-[0.2em] text-white/40 uppercase font-sans mb-4">Passphrase</label>
                <div className="relative">
                  <input
                    type={showPassphrase ? "text" : "password"}
                    value={passphrase}
                    onChange={(e) => setPassphrase(e.target.value)}
                    placeholder="Enter Key"
                    className="w-full bg-transparent border-b border-white/20 pb-3 text-center text-base md:text-lg text-white focus:outline-none focus:border-[#6b705c] transition-colors tracking-widest placeholder:text-white/20 font-sans pr-10 rounded-none"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassphrase(!showPassphrase)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                  >
                    {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {error && <p className="text-[#c75e5e] text-xs text-center font-sans tracking-wide">{error}</p>}
            </div>

            <div className="flex gap-4">
              <button type="button" onClick={() => setMode("select")} className="flex-1 py-4 text-[10px] tracking-[0.3em] uppercase text-white/30 hover:text-white border border-transparent">Back</button>
              <button type="submit" className="flex-[2] py-4 text-xs tracking-[0.3em] uppercase text-white border border-[#6b705c] hover:bg-[#6b705c]/20 transition-colors">Enter</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
