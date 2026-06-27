import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Sparkles, AlertTriangle, Heart, Award, Volume2, Gamepad, Mic, CloudRain, Sun, Flame, Thermometer } from "lucide-react";

interface HeartParticle {
  id: number;
  x: number;
  y: number;
  char: string;
}

interface WingerBotProps {
  emotion?: "happy" | "vigilant" | "alert" | "thinking" | "listening" | "speaking";
  interactiveNudge?: string;
  onTap?: () => void;
  weather?: "sunny" | "rainy" | "hot" | "cold";
  onHoldStart?: () => void;
  onHoldEnd?: () => void;
  onDragStateChange?: (isDragging: boolean) => void;
}

const CUTE_PET_RESPONSES = [
  "Focus waves verified at 100%! You have an incredibly beautiful brain! ⭐",
  "Deep breath inside, big stretch outside! You are doing beautifully well. 🐳",
  "Tingle! Gentle reminder: one mini-step is a massive victory! Let's tackle it. 💕",
  "Bzz-zzt! Dopamine micro-reward dispatched! Keep riding the study wave! 🎯",
  "Hehe, that tickles! Remember to keep your water bottle close. Hydration is key! 💧🔋",
  "Awesome work, student champion! I am cozy on your shoulder and so proud of you! ✨",
  "Optimal study vibes unlocked! Remember: taking a 5-minute break is self-love. 🌸🧸"
];

const EMOJI_EXPRESSIONS = ["💖", "✨", "🌸", "⭐", "🔮", "🎯", "🧁"];

export default function WingerBot({
  emotion = "happy",
  interactiveNudge,
  onTap,
  weather = "sunny",
  onHoldStart,
  onHoldEnd,
  onDragStateChange,
}: WingerBotProps) {
  const [petCount, setPetCount] = useState(() => {
    return Number(localStorage.getItem("winger_pet_count") || "0");
  });
  const [isPetted, setIsPetted] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [hearts, setHearts] = useState<HeartParticle[]>([]);
  const [botSpeechOverride, setBotSpeechOverride] = useState<string | null>(null);

  // Drag and Hold coordination references
  const isDraggingRef = useRef(false);
  const holdTimerRef = useRef<any>(null);
  const [isHoldingActive, setIsHoldingActive] = useState(false);

  useEffect(() => {
    localStorage.setItem("winger_pet_count", petCount.toString());
  }, [petCount]);

  // Restore speech bubble override after 4 seconds
  useEffect(() => {
    if (botSpeechOverride && !isDragging) {
      const timer = setTimeout(() => {
        setBotSpeechOverride(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [botSpeechOverride, isDragging]);

  // Set funny fly quote when dragged
  useEffect(() => {
    if (isDragging) {
      const phrases = [
        "Wheee! Look at me fly! 🛸✨",
        "Whoaaaa! Hang on tight, Miss! 💫🌟",
        "Winger rocket boosters activated! 🚀🔥",
        "Calibrating mid-air flight trajectories! 🗺️👀"
      ];
      setBotSpeechOverride(phrases[Math.floor(Math.random() * phrases.length)]);
    }
  }, [isDragging]);

  // Sync drag state up to parent app
  useEffect(() => {
    if (onDragStateChange) {
      onDragStateChange(isDragging);
    }
  }, [isDragging, onDragStateChange]);

  // Acoustic Double Chirp Synthesizer
  const playSynthesizerPetSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = "sine";
      
      // Retro happy double chirp: frequency sweeps up rapidly
      osc.frequency.setValueAtTime(620, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(990, audioCtx.currentTime + 0.12);
      
      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.22);
      
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch (e) {
      console.warn("Audio Context blocked or uninitiated", e);
    }
  };

  const handlePointerDownAction = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    
    // Clear any existing timer
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);

    // Set a timer to trigger voice hold mode after 400ms if not actively dragged
    holdTimerRef.current = setTimeout(() => {
      if (!isDraggingRef.current) {
        setIsHoldingActive(true);
        if (onHoldStart) {
          onHoldStart();
        }
      }
    }, 400);
  };

  const handlePointerUpAction = (e: React.PointerEvent<HTMLDivElement>) => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
    }

    if (isHoldingActive) {
      // Complete speaking holding interaction
      setIsHoldingActive(false);
      if (onHoldEnd) {
        onHoldEnd();
      }
    } else {
      // Behavior as standard tapping/petting since didn't cross hold threshold
      if (!isDraggingRef.current) {
        executePetAnimation(e);
      }
    }
  };

  const executePetAnimation = (e: React.PointerEvent<HTMLDivElement>) => {
    playSynthesizerPetSound();
    setIsPetted(true);
    setPetCount(prev => prev + 1);

    // Pick a random funny speech line
    const randomLine = CUTE_PET_RESPONSES[Math.floor(Math.random() * CUTE_PET_RESPONSES.length)];
    setBotSpeechOverride(randomLine);

    // Generate physical heart coordinates at cursor or random offsets if center clicked
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX ? e.clientX - rect.left : rect.width / 2;
    const clickY = e.clientY ? e.clientY - rect.top : rect.height / 3;

    const newHearts = Array.from({ length: 5 }).map((_, i) => ({
      id: Date.now() + i + Math.random(),
      x: clickX + (Math.random() - 0.5) * 40,
      y: clickY + (Math.random() - 0.5) * 30 - 15,
      char: EMOJI_EXPRESSIONS[Math.floor(Math.random() * EMOJI_EXPRESSIONS.length)]
    }));

    setHearts(prev => [...prev, ...newHearts]);

    setTimeout(() => {
      setIsPetted(false);
    }, 1200);

    // Call external tap prop if defined
    if (onTap) onTap();
  };

  // Clean old heart elements
  useEffect(() => {
    if (hearts.length > 0) {
      const timer = setTimeout(() => {
        setHearts(prev => prev.slice(5));
      }, 1600);
      return () => clearTimeout(timer);
    }
  }, [hearts]);

  const getEyes = () => {
    if (isPetted) {
      return (
        <div className="flex justify-around items-center w-12 px-1 select-none text-rose-400 font-bold text-[15px]">
          ♥ ♥
        </div>
      );
    }

    if (isDragging) {
      return (
        <div className="flex justify-around items-center w-12 px-1 gap-1 select-none text-cyan-400 font-bold text-[15px]">
          <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }} className="inline-block text-cyan-400">🌀</motion.span>
          <motion.span animate={{ rotate: -360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }} className="inline-block text-cyan-400">🌀</motion.span>
        </div>
      );
    }

    if (emotion === "listening" || isHoldingActive) {
      return (
        <div className="flex justify-center items-center gap-1 w-14 px-1 text-cyan-400">
          <motion.span animate={{ scale: [1, 1.4, 1] }} transition={{ repeat: Infinity, duration: 0.6 }} className="text-[11px]">🎙️</motion.span>
          <motion.div className="flex gap-0.5">
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce delay-0" />
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce delay-100" />
            <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce delay-200" />
          </motion.div>
        </div>
      );
    }

    if (emotion === "speaking") {
      return (
        <div className="flex justify-around items-center gap-1 w-12 px-1 text-cyan-400">
          <motion.div className="w-1 bg-cyan-400 rounded-full" style={{ height: 6 }} animate={{ height: [6, 18, 6] }} transition={{ repeat: Infinity, duration: 0.4 }} />
          <motion.div className="w-1 bg-cyan-400 rounded-full" style={{ height: 12 }} animate={{ height: [12, 6, 12] }} transition={{ repeat: Infinity, duration: 0.4, delay: 0.1 }} />
          <motion.div className="w-1 bg-cyan-400 rounded-full" style={{ height: 8 }} animate={{ height: [8, 16, 8] }} transition={{ repeat: Infinity, duration: 0.4, delay: 0.2 }} />
        </div>
      );
    }

    if (weather === "hot" && emotion === "happy") {
      return (
        <div className="flex justify-center items-center w-14 select-none text-sm">
          😎
        </div>
      );
    }

    if (weather === "cold" && emotion === "happy") {
      return (
        <div className="flex justify-around items-center w-12 px-1 select-none text-[13px] text-sky-200">
          ❄️ ❄️
        </div>
      );
    }

    switch (emotion) {
      case "vigilant":
        return (
          <div className="flex justify-around items-center w-12 px-1">
            <span className="text-cyan-400 font-display font-bold text-xs tracking-widest animate-pulse">● ●</span>
          </div>
        );
      case "alert":
        return (
          <div className="flex justify-around items-center w-12 px-1">
            <span className="text-red-400 font-display font-extrabold text-sm">! !</span>
          </div>
        );
      case "thinking":
        return (
          <div className="flex justify-center items-center gap-1 w-12 px-1 text-amber-400">
            <div className="flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        );
      case "happy":
      default:
        return (
          <div className="flex justify-around items-center w-12 px-2">
            <span className="text-cyan-400 font-display font-bold text-base select-none">^ ^</span>
          </div>
        );
    }
  };

  const getBubbleStyle = () => {
    if (isPetted) {
      return "border-rose-500 bg-rose-950/95 text-rose-100 shadow-rose-950/40";
    }
    switch (emotion) {
      case "alert":
        return "border-rose-500 bg-rose-950/90 text-rose-100 shadow-rose-900/30";
      case "vigilant":
        return "border-purple-500 bg-purple-950/90 text-purple-100 shadow-purple-900/30";
      case "thinking":
        return "border-amber-500 bg-amber-950/90 text-amber-100 shadow-amber-900/10";
      case "listening":
        return "border-cyan-500 bg-cyan-950/90 text-cyan-100 shadow-cyan-900/10";
      case "speaking":
        return "border-emerald-500 bg-emerald-950/90 text-emerald-100 shadow-emerald-900/10";
      default:
        return "border-violet-800 bg-brand-card/95 text-slate-100 shadow-brand-accent/20";
    }
  };

  return (
    <div className="flex flex-col items-center select-none w-full max-w-sm">
      
      {/* Tap & Hold prompt */}
      {!isDragging && (
        <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest mb-1 select-none flex items-center gap-1">
          👂 Hold Winger to Vent / Talk · Drag me around!
        </span>
      )}

      {/* Main Bot Figure with interaction targets & Draggable Wrapper */}
      <motion.div 
        drag
        dragConstraints={{ left: -120, right: 120, top: -75, bottom: 75 }}
        dragElastic={0.15}
        dragMomentum={false}
        onDragStart={() => {
          isDraggingRef.current = true;
          setIsDragging(true);
          if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
        }}
        onDragEnd={() => {
          setIsDragging(false);
          setTimeout(() => {
            isDraggingRef.current = false;
          }, 80);
        }}
        className="relative flex items-center justify-center w-56 h-36 cursor-grab active:cursor-grabbing touch-none select-none z-10"
        onPointerDown={handlePointerDownAction}
        onPointerUp={handlePointerUpAction}
        onPointerCancel={() => {
          if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
          setIsDragging(false);
          isDraggingRef.current = false;
        }}
      >
        {/* Heart Particles Overlay */}
        <AnimatePresence>
          {hearts.map((h) => (
            <motion.div
              key={h.id}
              initial={{ opacity: 1, scale: 0.6, x: h.x - 110, y: h.y - 70 }}
              animate={{ opacity: 0, scale: 1.4, y: h.y - 170, rotate: (Math.random() - 0.5) * 45 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4, ease: "easeOut" }}
              className="absolute text-base pointer-events-none z-50 select-none"
            >
              {h.char}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Live Speaking/Listening/Thinking Concenctric Ring Wave Visualizers */}
        <AnimatePresence>
          {(emotion === "listening" || isHoldingActive) && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [1, 2.2, 1], opacity: [0.5, 0, 0.5] }}
              exit={{ opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.8 }}
              className="absolute w-24 h-24 rounded-full border border-cyan-400/60 pointer-events-none"
            />
          )}
          {emotion === "thinking" && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [1, 2.1, 1], opacity: [0.65, 0.05, 0.65] }}
              exit={{ opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.4 }}
              className="absolute w-24 h-24 rounded-full border border-amber-450/60 pointer-events-none"
            />
          )}
          {emotion === "speaking" && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [1, 2, 1], opacity: [0.4, 0, 0.4] }}
              exit={{ opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.2 }}
              className="absolute w-24 h-24 rounded-full border border-emerald-400/40 pointer-events-none"
            />
          )}
        </AnimatePresence>
        
        {/* Left Wing */}
        <motion.div
          className="absolute left-6 w-12 h-8 bg-cyan-400/80 rounded-tl-full rounded-br-full origin-right shadow-lg shadow-cyan-500/20"
          style={{ borderBottomLeftRadius: "60%" }}
          animate={{
            rotate: isDragging ? [-75, 75, -75] : isPetted ? [-30, 30, -30] : (emotion === "alert" || isHoldingActive) ? [-40, 45, -40] : [-15, 15, -15],
            scale: isDragging ? 1.25 : isPetted ? 1.15 : 1,
            y: isDragging ? [-4, 4, -4] : (emotion === "alert" || isHoldingActive) ? [-5, 5, -5] : [0, -2, 0]
          }}
          transition={{
            repeat: Infinity,
            duration: isDragging ? 0.08 : isPetted ? 0.15 : (emotion === "alert" || isHoldingActive) ? 0.3 : 2.5,
            ease: "easeInOut"
          }}
        />

        {/* Right Wing */}
        <motion.div
          className="absolute right-6 w-12 h-8 bg-cyan-400/80 rounded-tr-full rounded-bl-full origin-left shadow-lg shadow-cyan-500/20"
          style={{ borderBottomRightRadius: "60%" }}
          animate={{
            rotate: isDragging ? [75, -75, 75] : isPetted ? [30, -30, 30] : (emotion === "alert" || isHoldingActive) ? [40, -45, 40] : [15, -15, 15],
            scale: isDragging ? 1.25 : isPetted ? 1.15 : 1,
            y: isDragging ? [-4, 4, -4] : (emotion === "alert" || isHoldingActive) ? [-5, 5, -5] : [0, -2, 0]
          }}
          transition={{
            repeat: Infinity,
            duration: isDragging ? 0.08 : isPetted ? 0.15 : (emotion === "alert" || isHoldingActive) ? 0.3 : 2.5,
            ease: "easeInOut"
          }}
        />

        {/* Halo Glow for high-tech look */}
        <motion.div
          className={`absolute w-28 h-28 rounded-full blur-xl filter opacity-40 transition-colors duration-300 ${
            isPetted ? "bg-rose-500" : (emotion === "alert" ? "bg-red-500" : (emotion === "listening" || isHoldingActive) ? "bg-cyan-500" : emotion === "speaking" ? "bg-emerald-500" : "bg-purple-500")
          }`}
          animate={{
            scale: isPetted ? [1, 1.4, 1] : [0.9, 1.2, 0.9],
          }}
          transition={{
            repeat: Infinity,
            duration: isPetted ? 0.6 : 3,
            ease: "easeInOut"
          }}
        />

        {/* Floating Main Body */}
        <motion.div
          className="relative flex flex-col items-center justify-center w-26 h-26 bg-slate-100 rounded-full border-3 border-purple-900 shadow-2xl z-10 select-none"
          animate={{
            y: isPetted ? [-15, 5, -15] : (emotion === "alert" || isHoldingActive) ? [-4, 4, -4] : [-8, 8, -8],
            rotate: isPetted ? [0, -10, 10, 0] : 0,
            scale: isPetted ? 1.1 : 1
          }}
          transition={{
            repeat: isPetted ? 1 : Infinity,
            duration: isPetted ? 0.5 : (emotion === "alert" || isHoldingActive) ? 0.8 : 4.0,
            ease: "easeInOut"
          }}
          whileHover={{ scale: 1.05 }}
        >
          
          {/* Weather adaptive decoration LAYERED INSIDE MAIN BODY so it travels seamlessly! */}
          {/* 1. Umbrella for Rainy weather */}
          {weather === "rainy" && (
            <motion.div 
              className="absolute -top-11 z-25 text-3xl flex flex-col items-center pointer-events-none"
              animate={{ y: [0, -2, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              <span className="filter drop-shadow-[0_2px_5px_rgba(6,182,212,0.4)]">🌂</span>
              
              {/* Rain Drops falling past her screen face! */}
              <div className="absolute top-7 w-16 h-12 pointer-events-none overflow-hidden flex justify-around">
                <motion.span className="text-[7px] text-cyan-300 font-bold block" animate={{ y: [-15, 45], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.7, delay: 0.1 }}>💧</motion.span>
                <motion.span className="text-[7px] text-cyan-200 font-bold block animate-fade-out" animate={{ y: [-15, 45], opacity: [0, 1, 0] }} transition={{ repeat: Infinity, duration: 0.5, delay: 0.45 }}>💧</motion.span>
              </div>
            </motion.div>
          )}

          {/* 2. Sweat dropping and fanning for Hot weather */}
          {weather === "hot" && (
            <>
              {/* Sweating Droplet graphic */}
              <motion.div 
                className="absolute top-5 right-4 pointer-events-none z-30"
                animate={{ y: [0, 8], opacity: [0, 1, 0] }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
              >
                <span className="text-[11px]">💦</span>
              </motion.div>

              {/* Holographic Fan label */}
              <motion.div 
                className="absolute -bottom-4 right-2 text-[9px] bg-[#fbbf24] text-slate-950 font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full z-25 flex items-center gap-0.5 shadow-sm shadow-amber-500/40"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
              >
                <span>扇</span> Fan
              </motion.div>
            </>
          )}

          {/* 3. Cozy Scarves wrapping around her neck for Cold weather */}
          {weather === "cold" && (
            <motion.div 
              className="absolute -bottom-1 z-25 text-3xl select-none pointer-events-none"
              animate={{ scale: [0.95, 1.05, 0.95] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
            >
              🧣
            </motion.div>
          )}

          {/* Top Antenna/Sensors */}
          <div className="absolute -top-3 w-1.5 h-4 bg-slate-400 rounded-full flex justify-center">
            <div className={`w-3 h-3 -mt-2 rounded-full transition-colors ${isPetted ? "bg-rose-500" : (emotion === "alert" ? "bg-red-500" : (emotion === "listening" || isHoldingActive) ? "bg-cyan-400" : "bg-purple-500")}`} />
          </div>

          {/* Bot Screen Face */}
          <div className="w-18 h-12 bg-slate-900 rounded-2xl flex items-center justify-center border-2 border-slate-700 shadow-inner relative overflow-hidden">
            {/* Ambient scanline */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/5 to-transparent pointer-events-none" />
            
            {/* Screen expression */}
            {getEyes()}
          </div>
        </motion.div>
      </motion.div>

      {/* Pet progress meter / happiness bar */}
      {!isDragging && (
        <div className="w-48 bg-black/50 border border-purple-950 rounded-full p-0.5 mt-2 flex items-center justify-between px-3.5 py-1 z-10">
          <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" /> Wingman Friendship
          </span>
          <span className="text-[10px] font-mono text-cyan-400 font-bold">{petCount} Pets</span>
        </div>
      )}

      {/* Dynamic Overlay when listening, thinking, or speaking directly above speech bubble */}
      <AnimatePresence>
        {(emotion === "listening" || isHoldingActive || emotion === "thinking" || emotion === "speaking") && !isDragging && (
          <motion.div 
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.95 }}
            className={`w-full max-w-xs mt-3 border p-3 rounded-2xl text-center space-y-2 relative z-20 shadow-xl transition-all ${
              (emotion === "listening" || isHoldingActive) ? "bg-cyan-950/90 border-cyan-500/50 text-cyan-150 shadow-cyan-950/40" :
              emotion === "thinking" ? "bg-amber-950/90 border-amber-500/50 text-amber-150 shadow-amber-950/40 animate-pulse" :
              "bg-emerald-950/90 border-emerald-500/50 text-emerald-150 shadow-emerald-950/40"
            }`}
          >
            <div className="flex justify-center items-center gap-2">
              <span className="flex h-1.5 w-1.5 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  (emotion === "listening" || isHoldingActive) ? "bg-cyan-400" :
                  emotion === "thinking" ? "bg-amber-400" :
                  "bg-emerald-400"
                }`}></span>
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                  (emotion === "listening" || isHoldingActive) ? "bg-cyan-500" :
                  emotion === "thinking" ? "bg-amber-500" :
                  "bg-emerald-500"
                }`}></span>
              </span>
              <span className={`text-[9px] font-mono font-bold uppercase tracking-widest ${
                (emotion === "listening" || isHoldingActive) ? "text-cyan-400" :
                emotion === "thinking" ? "text-amber-400" :
                "text-emerald-400"
              }`}>
                {(emotion === "listening" || isHoldingActive) ? "Winger Hearing System Live" :
                 emotion === "thinking" ? "Active Cognitive Synthesis" :
                 "Speaking Solution"}
              </span>
            </div>

            <div className="bg-black/40 border border-slate-800/40 p-2.5 rounded-xl text-left min-h-[38px] max-h-48 overflow-y-auto no-scrollbar">
              {(emotion === "listening" || isHoldingActive) ? (
                <div className="space-y-1 text-center">
                  <p className="text-[10.5px] font-sans leading-relaxed text-cyan-100">
                    {botSpeechOverride || interactiveNudge || "Listening to voice input..."}
                  </p>
                  <p className="text-[8px] text-slate-400 italic">Release to transmit vocal command</p>
                </div>
              ) : emotion === "thinking" ? (
                <div className="space-y-2 text-center">
                  <p className="text-[10.5px] font-sans leading-relaxed text-amber-201">
                    {interactiveNudge || "Processing..."}
                  </p>
                  <div className="flex items-center gap-1 justify-center text-[8px] font-mono text-amber-400 font-bold select-none">
                    <span>Searching local focus lockers</span>
                    <span className="flex gap-0.5 ml-0.5">
                      <span className="w-1 h-1 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1 h-1 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1 h-1 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-[10.5px] leading-relaxed font-sans text-emerald-100 italic">
                  "{botSpeechOverride || interactiveNudge}"
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Speech Nudge bubble */}
      <AnimatePresence mode="wait">
        {(botSpeechOverride || interactiveNudge) && !(emotion === "listening" || isHoldingActive) && !isDragging && (
          <motion.div
            key={botSpeechOverride ? "pet" : "advice"}
            initial={{ opacity: 0, scale: 0.92, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -4 }}
            className={`w-full max-w-xs mt-3.5 p-3.5 border rounded-2xl shadow-xl leading-relaxed text-sm font-sans z-10 relative select-text ${getBubbleStyle()}`}
          >
            {/* Speech bubble pointer */}
            <div className="absolute -top-1.5 left-1/2 transform -translate-x-1/2 w-3.5 h-3.5 rotate-45 border-l border-t border-inherit bg-inherit" />
            
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 shrink-0">
                {isPetted ? (
                  <Heart className="w-4 h-4 text-rose-400 fill-rose-400 animate-pulse" />
                ) : (emotion as any) === "alert" ? (
                  <AlertTriangle className="w-4 h-4 text-rose-400 animate-bounce" />
                ) : (emotion as any) === "thinking" ? (
                  <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                ) : (emotion as any) === "listening" ? (
                  <Mic className="w-4 h-4 text-cyan-400 animate-pulse" />
                ) : (emotion as any) === "speaking" ? (
                  <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
                ) : (
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                )}
              </div>
              
              <div className="flex-1 text-xs leading-relaxed">
                <p className="text-slate-200">{botSpeechOverride || interactiveNudge}</p>
                {emotion === "thinking" && (
                  <div className="flex items-center gap-1 mt-2 text-[10px] text-amber-400 font-mono font-bold leading-none select-none">
                    <span>Active formula scan/synthesis</span>
                    <span className="flex gap-0.5 ml-0.5">
                      <span className="w-1 h-1 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1 h-1 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1 h-1 bg-amber-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
