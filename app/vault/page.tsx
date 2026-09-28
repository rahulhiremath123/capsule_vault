"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { db, VaultEntry } from "../lib/db";
import { Bold, Italic, List, Heading1, Heading2, Lock } from "lucide-react";

export default function VaultPage() {
  const router = useRouter();
  const [capsuleId, setCapsuleId] = useState("");
  const [currentUser, setCurrentUser] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [isDrafting, setIsDrafting] = useState(false);
  const [draftTitle, setDraftTitle] = useState("");
  const [draftMediaFile, setDraftMediaFile] = useState<File | null>(null);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const editorRef = useRef<HTMLDivElement>(null);
  const draftMediaInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const capId = localStorage.getItem("anchor_capsule");
    const user = localStorage.getItem("anchor_user");
    if (!capId || !user) {
      router.push("/");
      return;
    }
    
    setCapsuleId(capId);
    setCurrentUser(user);
    
    const unsubscribe = db.subscribeVaultEntries(capId, (data) => {
      setEntries(data.reverse());
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleSeal = async () => {
    if (!editorRef.current) return;
    const content = editorRef.current.innerHTML;
    if (!draftTitle.trim() && !draftMediaFile && !content.trim()) {
      alert("Please provide a title, content, or attach media to seal an entry.");
      return;
    }

    let mediaType: "image" | "video" | "audio" | undefined = undefined;
    let mediaUrl: string | undefined = undefined;

    if (draftMediaFile) {
      if (draftMediaFile.size > 900 * 1024) {
        alert("Files must be under 900KB (small images) to fit directly in the database since Storage was skipped.");
        return;
      }
      
      if (draftMediaFile.type.startsWith("video/")) mediaType = "video";
      else if (draftMediaFile.type.startsWith("audio/")) mediaType = "audio";
      else mediaType = "image";

      const url = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(draftMediaFile);
      });
      mediaUrl = url;
    }

    if (editingEntryId) {
      const dbIndex = entries.findIndex(e => e.id === editingEntryId);
      if (dbIndex !== -1) {
        const e = entries[dbIndex];
        const updated = { ...e, title: draftTitle || "Untitled Entry", content, mediaUrl: mediaUrl || e.mediaUrl, mediaType: mediaType || e.mediaType };
        await db.addVaultEntry(capsuleId, updated);
      }
    } else {
      await db.addVaultEntry(capsuleId, {
        title: draftTitle || draftMediaFile?.name || "Untitled Entry",
        content,
        mediaUrl,
        mediaType,
        author: currentUser
      });
    }

    setIsDrafting(false);
    setEditingEntryId(null);
    setDraftTitle("");
    setDraftMediaFile(null);
  };

  const [readingEntry, setReadingEntry] = useState<VaultEntry | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReadEntry = (entry: VaultEntry) => {
    if (entry.author === currentUser) {
      setReadingEntry(entry);
      return;
    }

    const today = new Date();
    // Month is 0-indexed in JS (10 = Nov), Date is 1-indexed (23)
    if (today.getMonth() === 10 && today.getDate() === 23) {
      setReadingEntry(entry);
    } else {
      alert("This entry is sealed by your partner. It only opens annually on November 23.");
    }
  };

  const handleEdit = () => {
    if (!readingEntry) return;
    setIsDrafting(true);
    setEditingEntryId(readingEntry.id);
    setDraftTitle(readingEntry.title);
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = readingEntry.content;
      }
    }, 100);
    setReadingEntry(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 900 * 1024) {
      alert("Since you skipped Firebase Storage, files must be under 900KB (small images) to fit directly inside the database.");
      return;
    }

    let mediaType: "image" | "video" | "audio" = "image";
    if (file.type.startsWith("video/")) mediaType = "video";
    if (file.type.startsWith("audio/")) mediaType = "audio";

    const reader = new FileReader();
    reader.onload = async () => {
      const url = reader.result as string;
      await db.addVaultEntry(capsuleId, {
        title: file.name,
        content: "",
        mediaUrl: url,
        mediaType: mediaType,
        author: currentUser
      });

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) return <div className="min-h-[100dvh] bg-[#11130e]" />;

  return (
    <div className="relative min-h-[100dvh] w-full bg-[#11130e] text-[#e0e0e0] flex flex-col selection:bg-accent/30 overflow-hidden">
      
      <div className="absolute inset-0 z-0 opacity-5 pointer-events-none mix-blend-overlay">
        <Image src="/bg.jpg" alt="Texture" fill className="object-cover grayscale" priority />
      </div>

      <header className="relative z-10 w-full p-8 flex justify-between items-center border-b border-[#3a3e30]/30 bg-[#11130e]/80 backdrop-blur-sm">
        <div className="flex items-center gap-6">
          <button onClick={() => { if (readingEntry) { setReadingEntry(null); } else { router.push("/dashboard"); } }} className="font-serif tracking-[0.2em] uppercase text-sm text-[#8c9475] hover:text-white transition-colors flex items-center gap-4">
            <span className="w-4 h-[1px] bg-current inline-block"></span>
            {readingEntry ? 'Back to Vault' : 'Back to Hub'}
          </button>
          {readingEntry && readingEntry.author === currentUser && (Date.now() - new Date(readingEntry.timestamp).getTime() < 24 * 60 * 60 * 1000) && (
            <button 
              onClick={handleEdit} 
              className="font-sans text-[10px] tracking-[0.2em] uppercase text-[#8c9475] hover:text-white transition-colors border border-[#3a3e30] px-3 py-1.5 rounded-sm flex items-center gap-2"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
              Edit Entry
            </button>
          )}
        </div>
        <span className="font-sans text-xs tracking-[0.2em] text-[#6b705c] uppercase">
          The Vault &mdash; Capsule {capsuleId}
        </span>
      </header>

      {/* READING VIEW */}
      {readingEntry && (
        <main className="relative z-10 flex-1 w-full max-w-4xl mx-auto p-8 md:p-16 overflow-y-auto">
          <header className="mb-16 text-center">
            <div className="w-px h-16 bg-[#6b705c]/30 mx-auto mb-8"></div>
            <h2 className="font-serif text-4xl md:text-5xl font-light text-white mb-6 tracking-wide break-words">
              {readingEntry.title}
            </h2>
            <div className="font-sans text-xs tracking-[0.3em] uppercase text-[#8c9475]">
              Sealed on {new Date(readingEntry.timestamp).toLocaleDateString()}
            </div>
          </header>
          
          {readingEntry.mediaUrl && (
            <div className="w-full flex justify-center items-center rounded-sm border border-[#3a3e30] p-4 bg-[#0c0c0c]/80 backdrop-blur-md mb-12">
              {readingEntry.mediaType === 'image' && (
                <img src={readingEntry.mediaUrl} alt={readingEntry.title} className="max-w-full max-h-[70vh] object-contain rounded-sm" />
              )}
              {readingEntry.mediaType === 'video' && (
                <video src={readingEntry.mediaUrl} controls className="max-w-full max-h-[70vh] rounded-sm" />
              )}
              {readingEntry.mediaType === 'audio' && (
                <audio src={readingEntry.mediaUrl} controls className="w-full max-w-lg" />
              )}
            </div>
          )}
          
          {readingEntry.content && (
            <div 
              className="prose prose-invert prose-headings:font-normal prose-headings:text-white prose-a:text-[#8c9475] font-serif text-lg leading-loose text-[#d0d0d0] max-w-none"
              dangerouslySetInnerHTML={{ __html: readingEntry.content }}
            />
          )}
        </main>
      )}

      {/* VAULT DASHBOARD */}
      {!isDrafting && !readingEntry && (
        <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto p-8 md:p-16 flex flex-col">
          <div className="flex justify-between items-end mb-16 border-b border-[#3a3e30]/50 pb-8">
            <div>
              <h1 className="font-serif text-4xl font-light text-white mb-2">Cryptographic Vault</h1>
              <p className="font-sans text-xs uppercase tracking-[0.2em] text-[#6b705c]">Window opens annually on Nov 23</p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setIsDrafting(true)}
                className="py-3 px-6 border border-[#5a604a] hover:border-white transition-colors text-xs tracking-[0.2em] uppercase text-white font-sans flex items-center gap-3 bg-[#1a1c15]/50"
              >
                Draft New Entry
              </button>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="py-3 px-6 border border-[#3a3e30] hover:border-[#6b705c] transition-colors text-xs tracking-[0.2em] uppercase text-[#8c9475] hover:text-white font-sans flex items-center gap-3 bg-transparent"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                Secure Media
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                className="hidden" 
                accept="image/*,video/*,audio/*"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {entries.length === 0 && (
              <p className="font-serif text-[#6b705c] italic col-span-full">The vault is currently empty.</p>
            )}
            {entries.map((entry) => {
              const date = new Date(entry.timestamp);
              return (
                <div key={entry.id} onClick={() => handleReadEntry(entry)} className="p-8 border-y border-l-2 border-r border-l-[#5a604a] border-y-[#3a3e30]/50 border-r-[#3a3e30]/50 bg-gradient-to-br from-[#1a1c15]/80 to-transparent hover:bg-[#1a1c15] transition-colors relative group overflow-hidden cursor-pointer backdrop-blur-sm">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#5a604a]/50 via-[#8c9475] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  
                  <div className="flex justify-between items-start mb-12">
                    <div className="w-10 h-10 rounded-full border border-[#5a604a]/50 flex items-center justify-center bg-[#0c0c0c]">
                      {entry.mediaType === 'image' ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8c9475" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                      ) : entry.mediaType === 'video' ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8c9475" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>
                      ) : entry.mediaType === 'audio' ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8c9475" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"></path><circle cx="6" cy="18" r="3"></circle><circle cx="18" cy="16" r="3"></circle></svg>
                      ) : (
                        <Lock className="w-4 h-4 text-[#8c9475]" />
                      )}
                    </div>
                    <span className="font-sans text-[9px] tracking-[0.3em] text-[#5a604a] uppercase">
                      {entry.author === currentUser ? 'By You' : 'Sealed'}
                    </span>
                  </div>
                  
                  <h3 className="font-serif text-2xl text-white mb-4 line-clamp-2 font-light tracking-wide">{entry.title}</h3>
                  
                  <div className="flex items-center gap-2 mt-auto">
                    <div className="w-1.5 h-1.5 bg-[#8c9475] rounded-full"></div>
                    <div className="font-sans text-[10px] tracking-[0.2em] uppercase text-[#8c9475]">
                      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </main>
      )}

      {/* FULL SCREEN DRAFT EDITOR */}
      {isDrafting && (
        <div className="fixed inset-0 h-[100dvh] z-50 bg-[#11130e] flex flex-col animate-in fade-in zoom-in-95 duration-500">
          
          <header className="w-full p-4 md:p-8 flex justify-between items-center border-b border-[#3a3e30]/50 bg-[#0c0c0c]">
            <button onClick={() => setIsDrafting(false)} className="text-xs uppercase tracking-[0.2em] text-[#8c9475] hover:text-white transition-colors">
              Cancel
            </button>
            <div className="flex gap-4">
              <button 
                onClick={handleSeal}
                className="py-2 px-6 bg-white text-black text-xs uppercase tracking-[0.2em] font-sans hover:bg-[#e0e0e0] transition-colors flex items-center gap-2"
              >
                <Lock className="w-3 h-3" /> Seal & Encrypt
              </button>
            </div>
          </header>

          <main className="flex-1 w-full max-w-4xl mx-auto p-8 md:p-16 overflow-y-auto">
            {/* Title */}
            <input 
              type="text" 
              placeholder="Entry Title..." 
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              className="w-full bg-transparent text-5xl md:text-6xl font-serif text-white font-light focus:outline-none placeholder:text-[#3a3e30] mb-8"
            />

            {/* Formatting Toolbar */}
            <div className="flex items-center justify-between mb-8 border-y border-[#3a3e30]/30 py-3 sticky top-0 bg-[#11130e] z-10">
              <div className="flex items-center gap-2">
                <button onClick={() => execCommand("formatBlock", "H1")} className="p-2 hover:bg-[#1a1c15] rounded text-[#8c9475] hover:text-white transition-colors" title="Heading 1"><Heading1 className="w-4 h-4" /></button>
                <button onClick={() => execCommand("formatBlock", "H2")} className="p-2 hover:bg-[#1a1c15] rounded text-[#8c9475] hover:text-white transition-colors" title="Heading 2"><Heading2 className="w-4 h-4" /></button>
                <div className="w-px h-4 bg-[#3a3e30]"></div>
                <button onClick={() => execCommand("bold")} className="p-2 hover:bg-[#1a1c15] rounded text-[#8c9475] hover:text-white transition-colors" title="Bold"><Bold className="w-4 h-4" /></button>
                <button onClick={() => execCommand("italic")} className="p-2 hover:bg-[#1a1c15] rounded text-[#8c9475] hover:text-white transition-colors" title="Italic"><Italic className="w-4 h-4" /></button>
                <div className="w-px h-4 bg-[#3a3e30]"></div>
                <button onClick={() => execCommand("insertUnorderedList")} className="p-2 hover:bg-[#1a1c15] rounded text-[#8c9475] hover:text-white transition-colors" title="Bullet List"><List className="w-4 h-4" /></button>
              </div>
              
              <div>
                <button 
                  onClick={() => draftMediaInputRef.current?.click()} 
                  className="p-2 hover:bg-[#1a1c15] rounded text-[#8c9475] hover:text-white transition-colors flex items-center gap-2 text-xs font-sans uppercase tracking-widest"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  Attach Media
                </button>
                <input 
                  type="file" 
                  ref={draftMediaInputRef} 
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setDraftMediaFile(f);
                  }} 
                  className="hidden" 
                  accept="image/*,video/*,audio/*"
                />
              </div>
            </div>

            {/* Media Preview inside Draft */}
            {draftMediaFile && (
              <div className="mb-8 p-4 border border-[#3a3e30]/50 rounded-sm bg-[#1a1c15]/30 relative flex items-center justify-center">
                <button 
                  onClick={() => setDraftMediaFile(null)}
                  className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                {draftMediaFile.type.startsWith('image/') && (
                  <img src={URL.createObjectURL(draftMediaFile)} alt="Preview" className="max-h-[40vh] rounded-sm" />
                )}
                {draftMediaFile.type.startsWith('video/') && (
                  <video src={URL.createObjectURL(draftMediaFile)} controls className="max-h-[40vh] rounded-sm" />
                )}
                {draftMediaFile.type.startsWith('audio/') && (
                  <audio src={URL.createObjectURL(draftMediaFile)} controls className="w-full max-w-md" />
                )}
              </div>
            )}

            {/* Notion-style Rich Text Editor */}
            <div 
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              className="w-full min-h-[50vh] focus:outline-none font-serif text-lg leading-loose text-[#d0d0d0] prose prose-invert prose-headings:font-normal prose-headings:text-white prose-a:text-[#8c9475] max-w-none"
            />
          </main>
        </div>
      )}

    </div>
  );
}
