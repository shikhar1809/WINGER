import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, Trash2, CheckCircle, RefreshCw, Sparkles, 
  ArrowLeft, ArrowRight, Check, Play, Lock
} from "lucide-react";

export interface PlannerItem {
  id: string;
  text: string;
  zone: "red" | "yellow" | "green" | "chull";
  timestamp: string;
}

interface PlannerProps {
  onNudgeChange: (nudgeText: string) => void;
  botStatus: (status: "happy" | "vigilant" | "alert" | "thinking" | "listening" | "speaking") => void;
}

export default function Planner({ onNudgeChange, botStatus }: PlannerProps) {
  const [items, setItems] = useState<PlannerItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"red" | "yellow" | "green">("yellow");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
  const [activeDragOverZone, setActiveDragOverZone] = useState<string | null>(null);
  
  // Submit Overlay State
  const [isBoardSubmitted, setIsBoardSubmitted] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/braindumps");
      const list = await res.json();
      setItems(list);
    } catch (e) {
      console.warn("Failed to retrieve planner items:", e);
    }
  };

  const handleSubmitItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsSubmitting(true);
    botStatus("thinking");
    onNudgeChange("Adding item to board... 📝");

    try {
      const res = await fetch("/api/braindumps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          text: inputText.trim(),
          zone: selectedCategory
        })
      });
      const data = await res.json();
      if (data.success) {
        setItems(data.brainDumps);
        setInputText("");
        triggerSoundChime();
        
        let msg = "Task added to board! Drag and drop to schedule. 🚀";
        if (selectedCategory === "red") {
          msg = "High priority task locked in Red zone! 🔴 Let's focus on this first.";
        } else if (selectedCategory === "green") {
          msg = "Stray thought parked in Green zone! 🟢 Mind cleared.";
        }
        onNudgeChange(msg);
        botStatus("happy");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateItemZone = async (itemId: string, targetZone: "red" | "yellow" | "green") => {
    botStatus("thinking");
    try {
      const res = await fetch(`/api/braindumps/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ zone: targetZone })
      });
      const data = await res.json();
      if (data.success) {
        setItems(data.brainDumps);
        onNudgeChange(`Moved item to ${targetZone === "red" ? "🔴 Red" : targetZone === "yellow" ? "🟡 Yellow" : "🟢 Green"} zone!`);
        botStatus("happy");
        triggerSoundChime();
      }
    } catch (e) {
      console.error("Error shifting item zone:", e);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const res = await fetch(`/api/braindumps/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setItems(data.brainDumps);
        onNudgeChange("Task cleared from your schedule! Great job. 🌟");
        botStatus("happy");
        triggerSoundChime();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const triggerSoundChime = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(620, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1250, audioCtx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.16);
    } catch (e) {
      console.warn("Audio chime block:", e);
    }
  };

  const triggerSubmitCelebrationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Fun ascending cosmic arpeggio
      const playTone = (freq: number, delay: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime + delay);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + delay + duration);
        osc.start(audioCtx.currentTime + delay);
        osc.stop(audioCtx.currentTime + delay + duration);
      };

      playTone(523.25, 0.0, 0.2); // C5
      playTone(659.25, 0.1, 0.2); // E5
      playTone(783.99, 0.2, 0.2); // G5
      playTone(1046.50, 0.3, 0.4); // C6
    } catch (e) {
      console.warn("Audio celebration block:", e);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItemId(id);
    e.dataTransfer.setData("text/plain", id);
    // Add visual ghosting
    const target = e.target as HTMLElement;
    target.style.opacity = "0.4";
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.target as HTMLElement;
    target.style.opacity = "1";
    setDraggedItemId(null);
    setActiveDragOverZone(null);
  };

  const handleDragOver = (e: React.DragEvent, zone: string) => {
    e.preventDefault();
    setActiveDragOverZone(zone);
  };

  const handleDragLeave = () => {
    setActiveDragOverZone(null);
  };

  const handleDrop = async (e: React.DragEvent, targetZone: "red" | "yellow" | "green") => {
    e.preventDefault();
    setActiveDragOverZone(null);
    const itemId = e.dataTransfer.getData("text/plain") || draggedItemId;
    if (itemId) {
      await handleUpdateItemZone(itemId, targetZone);
    }
  };

  // Click Submit Schedule
  const handleFinalSubmit = () => {
    setIsBoardSubmitted(true);
    triggerSubmitCelebrationSound();
    botStatus("happy");
    onNudgeChange("🎉 FANTASTIC! Your daily schedule is officially locked in. Let's execute perfectly!");
  };

  // Categorize items
  const redItems = items.filter(item => item.zone === "red");
  const yellowItems = items.filter(item => item.zone === "yellow");
  // Include legacy "chull" zone in Green for safety
  const greenItems = items.filter(item => item.zone === "green" || item.zone === "chull");

  const totalCount = items.length;

  return (
    <div className="flex flex-col h-full overflow-hidden text-slate-100 relative" id="simplified_planner">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-purple-950/40 pb-2 mb-3 shrink-0" id="planner_hdr">
        <div>
          <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest block font-bold mb-0.5">Trello Builder</span>
          <h3 className="font-display font-black text-sm text-slate-100 uppercase tracking-wider">Visual Schedule Board</h3>
        </div>
        <button
          onClick={fetchItems}
          className="p-1.5 rounded-lg bg-black/40 border border-purple-950 hover:border-purple-800 text-slate-400 hover:text-white transition-all cursor-pointer"
          title="Refresh board items"
        >
          <RefreshCw className="w-3 h-3" />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {!isBoardSubmitted ? (
          <motion.div 
            key="board-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex-1 flex flex-col overflow-hidden min-h-0"
          >
            {/* Quick entry form */}
            <form onSubmit={handleSubmitItem} className="bg-[#110e1e]/90 border border-purple-950 p-2.5 rounded-xl space-y-2 mb-3 shrink-0" id="simple_entry">
              <div className="space-y-1">
                <span className="text-[8px] font-mono text-slate-400 block uppercase font-bold tracking-wider">Add to Schedule:</span>
                <input
                  type="text"
                  placeholder={
                    selectedCategory === "red" ? "Avoided/Urgent item (e.g. Finish physics lab)"
                    : selectedCategory === "yellow" ? "Study task (e.g. Solve chemistry equations)"
                    : "Comfort thought / Break task (e.g. Read 5 pages)"
                  }
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full bg-[#06040c] border border-purple-950 text-xs rounded-lg px-2.5 py-2.5 focus:outline-none focus:border-cyan-500 text-slate-100 placeholder:text-slate-500 font-sans font-medium"
                />
              </div>

              <div className="flex items-center justify-between gap-1.5 flex-wrap pt-0.5">
                <div className="flex items-center gap-1">
                  {[
                    { id: "red", label: "🔴 Red", color: "border-rose-950/60 text-rose-400" },
                    { id: "yellow", label: "🟡 Yellow", color: "border-amber-950/60 text-amber-400" },
                    { id: "green", label: "🟢 Green", color: "border-emerald-950/60 text-emerald-400" }
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id as any)}
                      className={`px-2 py-1 rounded-md text-[8px] font-display font-black tracking-wider border uppercase cursor-pointer transition-all ${
                        selectedCategory === cat.id 
                          ? "bg-purple-900/60 border-cyan-400 text-white scale-105 shadow-[0_0_8px_rgba(34,211,238,0.2)]" 
                          : "bg-black/35 hover:bg-black/60 text-slate-400 border-transparent"
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !inputText.trim()}
                  className="cursor-pointer bg-cyan-400 hover:bg-cyan-300 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-display font-black text-[9px] px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 uppercase tracking-wider"
                >
                  <Plus className="w-3 h-3" /> Save
                </button>
              </div>
            </form>

            <span className="text-[8.5px] font-mono text-slate-500 block uppercase tracking-widest text-center mb-1.5 font-bold">
              👇 Drag & Drop cards OR tap arrows to move between Columns 👇
            </span>

            {/* THREE COLUMNS Trello Container */}
            <div className="flex-1 overflow-x-auto overflow-y-hidden flex gap-2 pb-2 custom-scrollbar snap-x snap-mandatory min-h-0" id="trello_columns">
              
              {/* RED COLUMN */}
              <div 
                onDragOver={(e) => handleDragOver(e, "red")}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, "red")}
                className={`flex-1 min-w-[130px] md:min-w-0 bg-[#08050e] rounded-xl p-2 flex flex-col border transition-all snap-align-start max-h-full ${
                  activeDragOverZone === "red" 
                    ? "border-rose-500 bg-rose-950/20 shadow-[0_0_12px_rgba(244,63,94,0.15)]" 
                    : "border-rose-950/40"
                }`}
              >
                <div className="flex items-center justify-between border-b border-rose-950/30 pb-1.5 mb-2 shrink-0">
                  <span className="text-[8.5px] font-mono text-rose-400 uppercase tracking-widest font-black">🔴 Red Zone ({redItems.length})</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 custom-scrollbar min-h-0">
                  {redItems.length === 0 ? (
                    <div className="text-[7.5px] text-slate-600 italic text-center py-6 border border-dashed border-rose-950/20 rounded-lg">Empty Zone</div>
                  ) : (
                    redItems.map(item => (
                      <div 
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.id)}
                        onDragEnd={handleDragEnd}
                        className="bg-[#120f21] border border-rose-950/50 p-2 rounded-lg cursor-grab active:cursor-grabbing hover:border-rose-900/60 transition-all select-none relative group"
                      >
                        <p className="text-[9.5px] text-rose-100 font-sans leading-tight pr-1 break-words font-medium">{item.text}</p>
                        
                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-purple-950/20">
                          <button 
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-0.5 text-slate-500 hover:text-rose-400 rounded transition-all cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                          
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => handleUpdateItemZone(item.id, "yellow")}
                              className="p-0.5 text-slate-500 hover:text-amber-400 bg-black/40 rounded cursor-pointer"
                              title="Move to Yellow"
                            >
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* YELLOW COLUMN */}
              <div 
                onDragOver={(e) => handleDragOver(e, "yellow")}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, "yellow")}
                className={`flex-1 min-w-[130px] md:min-w-0 bg-[#08050e] rounded-xl p-2 flex flex-col border transition-all snap-align-start max-h-full ${
                  activeDragOverZone === "yellow" 
                    ? "border-amber-500 bg-amber-950/20 shadow-[0_0_12px_rgba(245,158,11,0.15)]" 
                    : "border-amber-950/40"
                }`}
              >
                <div className="flex items-center justify-between border-b border-amber-950/30 pb-1.5 mb-2 shrink-0">
                  <span className="text-[8.5px] font-mono text-amber-400 uppercase tracking-widest font-black">🟡 Yellow Zone ({yellowItems.length})</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 custom-scrollbar min-h-0">
                  {yellowItems.length === 0 ? (
                    <div className="text-[7.5px] text-slate-600 italic text-center py-6 border border-dashed border-amber-950/20 rounded-lg">Empty Zone</div>
                  ) : (
                    yellowItems.map(item => (
                      <div 
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.id)}
                        onDragEnd={handleDragEnd}
                        className="bg-[#120f21] border border-amber-950/50 p-2 rounded-lg cursor-grab active:cursor-grabbing hover:border-amber-900/60 transition-all select-none relative group"
                      >
                        <p className="text-[9.5px] text-amber-100 font-sans leading-tight pr-1 break-words font-medium">{item.text}</p>
                        
                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-purple-950/20">
                          <button 
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-0.5 text-slate-500 hover:text-rose-400 rounded transition-all cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                          
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleUpdateItemZone(item.id, "red")}
                              className="p-0.5 text-slate-500 hover:text-rose-400 bg-black/40 rounded cursor-pointer"
                              title="Move to Red"
                            >
                              <ArrowLeft className="w-2.5 h-2.5" />
                            </button>
                            <button
                              onClick={() => handleUpdateItemZone(item.id, "green")}
                              className="p-0.5 text-slate-500 hover:text-emerald-400 bg-black/40 rounded cursor-pointer"
                              title="Move to Green"
                            >
                              <ArrowRight className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* GREEN COLUMN */}
              <div 
                onDragOver={(e) => handleDragOver(e, "green")}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, "green")}
                className={`flex-1 min-w-[130px] md:min-w-0 bg-[#08050e] rounded-xl p-2 flex flex-col border transition-all snap-align-start max-h-full ${
                  activeDragOverZone === "green" 
                    ? "border-emerald-500 bg-emerald-950/20 shadow-[0_0_12px_rgba(16,185,129,0.15)]" 
                    : "border-emerald-950/40"
                }`}
              >
                <div className="flex items-center justify-between border-b border-emerald-950/30 pb-1.5 mb-2 shrink-0">
                  <span className="text-[8.5px] font-mono text-emerald-400 uppercase tracking-widest font-black">🟢 Green Zone ({greenItems.length})</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 custom-scrollbar min-h-0">
                  {greenItems.length === 0 ? (
                    <div className="text-[7.5px] text-slate-600 italic text-center py-6 border border-dashed border-emerald-950/20 rounded-lg">Empty Zone</div>
                  ) : (
                    greenItems.map(item => (
                      <div 
                        key={item.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item.id)}
                        onDragEnd={handleDragEnd}
                        className="bg-[#120f21] border border-emerald-950/50 p-2 rounded-lg cursor-grab active:cursor-grabbing hover:border-emerald-900/60 transition-all select-none relative group"
                      >
                        <p className="text-[9.5px] text-emerald-100 font-sans leading-tight pr-1 break-words font-medium">{item.text}</p>
                        
                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-purple-950/20">
                          <button 
                            onClick={() => handleDeleteItem(item.id)}
                            className="p-0.5 text-slate-500 hover:text-rose-400 rounded transition-all cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                          
                          <div className="flex items-center gap-0.5">
                            <button
                              onClick={() => handleUpdateItemZone(item.id, "yellow")}
                              className="p-0.5 text-slate-500 hover:text-amber-400 bg-black/40 rounded cursor-pointer"
                              title="Move to Yellow"
                            >
                              <ArrowLeft className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* SUBMIT BUTTON */}
            <div className="pt-2 mt-2 border-t border-purple-950/40 shrink-0">
              <button
                type="button"
                onClick={handleFinalSubmit}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 text-slate-950 font-display font-black text-xs py-3 rounded-xl uppercase tracking-wider transition-all cursor-pointer shadow-[0_4px_15px_rgba(16,185,129,0.25)] hover:scale-[101%] active:scale-[99%] duration-150 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4 text-slate-950 stroke-[3]" /> Submit Schedule
              </button>
            </div>
          </motion.div>
        ) : (
          /* CELEBRATION LOCK SCREEN */
          <motion.div
            key="lock-celebration-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-gradient-to-b from-[#0b0818]/60 to-[#030206]/80 border border-emerald-950/40 rounded-2xl space-y-4 shadow-2xl relative overflow-hidden"
          >
            {/* Visual sparkle animation particles */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.08),transparent_70%)] pointer-events-none" />
            
            <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-400 p-0.5 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)] animate-bounce duration-1000">
              <div className="h-full w-full rounded-full bg-slate-950 flex items-center justify-center">
                <Check className="w-8 h-8 text-emerald-400 stroke-[3.5]" />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-black block">Core Synchronized ⚡️</span>
              <h4 className="font-display font-black text-base text-slate-100 uppercase tracking-wide">Schedule Locked In!</h4>
              <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed font-semibold">
                Your high-priority Red, Yellow, and Green zones are calibrated. Clear mind, zero executive freeze!
              </p>
            </div>

            {/* Quick Summary list */}
            <div className="w-full bg-[#120f21]/80 border border-purple-950 p-3.5 rounded-xl text-left text-[11px] space-y-2 max-w-[240px] mx-auto">
              <div className="flex items-center justify-between">
                <span className="font-mono text-slate-400 uppercase text-[9px] font-bold">🎯 Red Zone (Urgent)</span>
                <span className="font-mono text-rose-400 font-extrabold">{redItems.length} tasks</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-slate-400 uppercase text-[9px] font-bold">📝 Yellow Zone (Study)</span>
                <span className="font-mono text-amber-400 font-extrabold">{yellowItems.length} tasks</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-slate-400 uppercase text-[9px] font-bold">🟢 Green Zone (Chill)</span>
                <span className="font-mono text-emerald-400 font-extrabold">{greenItems.length} tasks</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full max-w-[240px]">
              <button
                onClick={() => {
                  triggerSoundChime();
                  setIsBoardSubmitted(false);
                }}
                className="w-full bg-black/40 hover:bg-black/60 text-slate-300 font-display font-black text-[10px] py-2.5 px-4 rounded-xl uppercase tracking-wider transition-all border border-purple-950 cursor-pointer"
              >
                ✏️ Edit & Adjust Schedule
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
