import React, { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Camera, Play, Square, Volume2, VolumeX, Loader2, AlertTriangle, ShieldCheck
} from "lucide-react";
import * as tf from "@tensorflow/tfjs";
import * as cocoSsd from "@tensorflow-models/coco-ssd";

interface OverwatchProps {
  onNudgeChange: (nudgeText: string) => void;
  botStatus: (status: "happy" | "vigilant" | "alert" | "thinking" | "listening" | "speaking") => void;
  registerTestTrigger?: (triggerFn: (() => void) | null) => void;
}

export default function Overwatch({ onNudgeChange, botStatus, registerTestTrigger }: OverwatchProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isModelLoading, setIsModelLoading] = useState<boolean>(true);
  const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);

  // Proximity and violation tracking
  const [detectionState, setDetectionState] = useState<"focused" | "too_close" | "away">("focused");
  const [faceDistancePercentage, setFaceDistancePercentage] = useState<number>(0);
  const [violationsCount, setViolationsCount] = useState<number>(0);
  const [focusSeconds, setFocusSeconds] = useState<number>(0);

  // Proximity threshold state (If face box width > threshold of camera view, trigger alarm)
  const [distanceThreshold, setDistanceThreshold] = useState<number>(55);

  // Load COCO-SSD model once
  useEffect(() => {
    async function initTF() {
      setIsModelLoading(true);
      try {
        await tf.ready();
        const loadedModel = await cocoSsd.load({ base: "lite_mobilenet_v2" });
        setModel(loadedModel);
        onNudgeChange("Local YOLO scan engine active. Power on to lock focus! 👁️");
      } catch (err) {
        console.error("TF model loading error:", err);
      } finally {
        setIsModelLoading(false);
      }
    }
    initTF();
  }, []);

  // Vocal / Sound synthesizers
  const playAlertSound = (type: "success" | "warning") => {
    if (isMuted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === "warning") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(850, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(250, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.22);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.24);
      } else if (type === "success") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.28);
      }
    } catch (e) {
      console.warn("Synth audio blocked", e);
    }
  };

  const speakAlertText = (text: string) => {
    if (isMuted) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.3;
      window.speechSynthesis.speak(utterance);
    } catch (e) {}
  };

  // Tab blur compliance (Instant trigger when leaving focus tab)
  useEffect(() => {
    const handleTabBlur = () => {
      if (isActive) {
        setViolationsCount(prev => prev + 1);
        botStatus("alert");
        onNudgeChange("🚨 TAB SWITCH DETECTED! Focus compliance broken!");
        speakAlertText("Hey! Return to your study screen immediately.");
        playAlertSound("warning");
      }
    };

    window.addEventListener("blur", handleTabBlur);
    return () => {
      window.removeEventListener("blur", handleTabBlur);
    };
  }, [isActive]);

  // Register the manual test trigger to parent
  useEffect(() => {
    if (registerTestTrigger) {
      registerTestTrigger(() => {
        setViolationsCount(prev => prev + 1);
        botStatus("alert");
        onNudgeChange("🚨 TEST COMPLIANCE ALERT: Tab Switch / Defocus simulated successfully!");
        speakAlertText("Hey! Defocus detected! Keep your eyes on the screen.");
        playAlertSound("warning");
      });
      return () => {
        registerTestTrigger(null);
      };
    }
  }, [registerTestTrigger, botStatus, onNudgeChange, isMuted]);

  // Request & Start Camera
  const startCamera = async () => {
    try {
      botStatus("thinking");
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 }
      });
      setStream(mediaStream);
      setIsActive(true);
      botStatus("vigilant");
      onNudgeChange("Overwatch Shield activated. Stay centered and keep a safe distance! 🛡️");
      playAlertSound("success");
    } catch (err) {
      console.error("Camera stream block:", err);
      onNudgeChange("Camera block! Grant camera permissions to start live scans.");
      botStatus("alert");
    }
  };

  // Safe side-effect to set video ref srcObject when state is active and element is rendered
  useEffect(() => {
    if (isActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(err => {
        console.warn("Failed to play video element:", err);
      });
    }
  }, [isActive, stream]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    setIsActive(false);
    setDetectionState("focused");
    setFaceDistancePercentage(0);
    botStatus("happy");
    onNudgeChange("Compliance monitoring paused.");
  };

  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [stream]);

  // Real-time detection & parsing frame loop
  useEffect(() => {
    if (!isActive || !model) return;

    let isRunning = true;
    let alarmThrottleTime = 0;

    async function processFrame() {
      if (!isRunning) return;

      if (videoRef.current && videoRef.current.readyState >= 2) {
        try {
          const predictions = await model.detect(videoRef.current);
          drawTrackingCanvas(predictions);

          const person = predictions.find(p => p.class === "person");
          const phone = predictions.find(p => p.class === "cell phone" || p.class === "phone");
          const now = Date.now();

          if (phone) {
            // Immediate phone warning
            setDetectionState("too_close");
            setFaceDistancePercentage(100);
            botStatus("alert");
            onNudgeChange("🚨 PHONE DETECTED! Put down your mobile!");
            
            if (now - alarmThrottleTime > 4000) {
              speakAlertText("Phone detected! Put down the phone and study.");
              playAlertSound("warning");
              setViolationsCount(v => v + 1);
              alarmThrottleTime = now;
            }
          } else if (person) {
            // Check bounding box width as distance proxy
            const [, , w] = person.bbox;
            const widthPct = Math.round((w / 640) * 100);
            setFaceDistancePercentage(widthPct);

            if (widthPct > distanceThreshold) {
              // Too close, user is hunched or looking at a concealed phone
              setDetectionState("too_close");
              botStatus("alert");
              onNudgeChange("🚨 TOO CLOSE! Back away from the screen!");
              
              if (now - alarmThrottleTime > 4000) {
                speakAlertText("Back away from the screen and maintain posture.");
                playAlertSound("warning");
                setViolationsCount(v => v + 1);
                alarmThrottleTime = now;
              }
            } else {
              setDetectionState("focused");
              botStatus("happy");
              setFocusSeconds(s => s + 1);
            }
          } else {
            // Empty view
            setDetectionState("away");
            botStatus("vigilant");
            setFaceDistancePercentage(0);
            onNudgeChange("⚠️ Desk empty. Waiting for you to return...");
          }
        } catch (e) {
          console.error("Frame prediction error:", e);
        }
      }

      setTimeout(() => {
        if (isRunning) requestAnimationFrame(processFrame);
      }, 300);
    }

    processFrame();

    return () => {
      isRunning = false;
    };
  }, [isActive, model]);

  // Real-time tracking canvas drawing
  const drawTrackingCanvas = (predictions: cocoSsd.DetectedObject[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    predictions.forEach(p => {
      const [x, y, w, h] = p.bbox;
      // Mirror horizontal coordinates
      const drawX = canvas.width - x - w;

      if (p.class === "person") {
        ctx.strokeStyle = "#22d3ee";
        ctx.lineWidth = 2.5;
        // Bounding box draw
        ctx.strokeRect(drawX, y, w, h);
        ctx.fillStyle = "rgba(34, 211, 238, 0.05)";
        ctx.fillRect(drawX, y, w, h);

        // Simple text tag
        ctx.fillStyle = "#22d3ee";
        ctx.font = "bold 10px monospace";
        ctx.fillText("ACTIVE USER", drawX + 5, y + 15);
      } else if (p.class === "cell phone" || p.class === "phone") {
        ctx.strokeStyle = "#f43f5e";
        ctx.lineWidth = 3.5;
        ctx.strokeRect(drawX, y, w, h);
        ctx.fillStyle = "rgba(244, 63, 94, 0.2)";
        ctx.fillRect(drawX, y, w, h);

        ctx.fillStyle = "#f43f5e";
        ctx.font = "bold 11px monospace";
        ctx.fillText("⚠️ PHONE DISTRACTION DETECTED", drawX + 5, y - 5);
      }
    });
  };

  const formatSecs = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col h-full overflow-hidden text-slate-100 items-center justify-center max-w-xl mx-auto" id="overwatch_simple_panel">
      
      {/* TITLE & HEADER CONTROLS */}
      <div className="w-full flex items-center justify-between border-b border-purple-950/40 pb-2.5 mb-3 shrink-0">
        <div>
          <h3 className="font-display font-black text-sm uppercase tracking-wide">YOLO Overwatch</h3>
        </div>

        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-1.5 rounded-xl bg-black/40 border border-purple-950 text-slate-400 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5 text-cyan-400" />}
          <span className="font-mono text-[9px] uppercase tracking-wider font-extrabold">{isMuted ? "Muted" : "Voice Alerts"}</span>
        </button>
      </div>

      {/* OVERWATCH ACTIVE TOGGLE SWITCH */}
      <div className="w-full bg-black/40 border border-purple-950 p-3 rounded-2xl flex items-center justify-between mb-3 shadow-md shrink-0">
        <div className="flex items-center gap-2.5">
          <div className={`w-2.5 h-2.5 rounded-full ${isActive ? "bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" : "bg-slate-600"}`} />
          <div className="text-left">
            <span className="text-[7.5px] font-mono text-slate-400 uppercase tracking-widest block font-extrabold">OVERWATCH RADAR</span>
            <span className="text-[11px] font-black text-slate-100 uppercase tracking-wide">
              {isActive ? "Shield Active 🟢" : "Shield Paused 🔴"}
            </span>
          </div>
        </div>

        <button
          onClick={isActive ? stopCamera : startCamera}
          disabled={isModelLoading}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 ease-in-out focus:outline-none ${
            isActive ? "bg-cyan-400" : "bg-purple-950/70"
          } ${isModelLoading ? "opacity-40 cursor-not-allowed" : ""}`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-slate-950 shadow-md ring-0 transition duration-250 ease-in-out ${
              isActive ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* SINGLE CENTERED SCREEN PREVIEW CONTAINER */}
      <div className="w-full space-y-3.5">
        
        <div className="relative bg-[#050308] rounded-2xl border border-purple-950 overflow-hidden aspect-[4/3] w-full shadow-2xl shadow-black/80 flex flex-col items-center justify-center">
          
          {isActive ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover opacity-90 transform -scale-x-100"
              />
              <canvas
                ref={canvasRef}
                width={640}
                height={480}
                className="absolute inset-0 w-full h-full z-10 pointer-events-none"
              />
            </>
          ) : (
            <div className="text-center p-6 space-y-4 max-w-sm z-10">
              <div className="w-14 h-14 rounded-full bg-cyan-950/40 border border-cyan-800/30 flex items-center justify-center mx-auto animate-pulse">
                <Camera className="w-6 h-6 text-cyan-400" />
              </div>
              
              {isModelLoading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                  <span className="text-[9.5px] font-mono text-cyan-400 font-extrabold">LOADING DEEP SCANNER MODEL...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-300 leading-relaxed font-semibold">
                    Toggle the switch above to activate the Overwatch Shield. Winger will instantly monitor and alert you if you hunch, look at a phone, or defocus the tab.
                  </p>
                  
                  <button
                    onClick={startCamera}
                    className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-display font-black tracking-widest py-3 px-6 rounded-xl uppercase transition-all cursor-pointer shadow-lg shadow-cyan-400/20"
                  >
                    🚀 Start Focus Shield
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Real-time floating HUD */}
          {isActive && (
            <div className="absolute top-3 left-3 right-3 z-20 flex justify-between items-center pointer-events-none">
              <div className="bg-black/80 px-2.5 py-1 rounded-lg border border-purple-950 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-[9px] font-mono text-cyan-300 uppercase tracking-wider font-black">YOLO MINI SCANNERS</span>
              </div>

              {violationsCount > 0 && (
                <div className="bg-rose-950/90 border border-rose-800/50 px-2.5 py-1 rounded-lg flex items-center gap-1 text-rose-300">
                  <AlertTriangle className="w-3 h-3 text-rose-400 animate-bounce" />
                  <span className="text-[9px] font-mono font-black uppercase">{violationsCount} Violations</span>
                </div>
              )}
            </div>
          )}

          {/* Interactive HUD status banner */}
          {isActive && (
            <div className="absolute bottom-3 left-3 right-3 z-20 bg-black/95 border border-purple-950 p-3 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[7.5px] font-mono text-slate-400 uppercase tracking-widest block font-bold">CURRENT POSTURE STATE</span>
                <span className={`text-[10.5px] font-mono uppercase font-black tracking-wider block mt-0.5 ${
                  detectionState === "focused" ? "text-cyan-400" : "text-rose-400 animate-pulse"
                }`}>
                  {detectionState === "focused" && "🟢 Doing Padhai"}
                  {detectionState === "too_close" && "🚨 LEANING / PHONE suspected"}
                  {detectionState === "away" && "🟡 Desk Empty"}
                </span>
              </div>

              <div className="text-right">
                <span className="text-[7.5px] font-mono text-slate-400 uppercase block font-bold">PROXIMITY RADAR</span>
                <span className={`text-[10.5px] font-mono font-black block mt-0.5 ${
                  faceDistancePercentage > distanceThreshold ? "text-rose-400" : "text-cyan-300"
                }`}>
                  {faceDistancePercentage}% / {distanceThreshold}% Limit
                </span>
              </div>
            </div>
          )}

        </div>

        {/* PROXIMITY ADAPTER SLIDER CARD */}
        <div className="bg-[#0b0712] border border-purple-950/60 p-3.5 rounded-2xl space-y-2 text-left">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest font-black">Posture Alert Threshold</span>
            <span className="text-xs font-mono font-extrabold text-cyan-300">{distanceThreshold}% Box Size</span>
          </div>
          <input
            type="range"
            min="25"
            max="80"
            value={distanceThreshold}
            onChange={(e) => setDistanceThreshold(parseInt(e.target.value))}
            className="w-full h-1.5 bg-purple-950/60 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none"
          />
          <div className="flex justify-between text-[8px] font-mono text-slate-500 font-bold uppercase tracking-wider">
            <span>Strict Focus (Keep Far)</span>
            <span>Relaxed Room (Lean In ok)</span>
          </div>
          <p className="text-[9px] text-slate-400 leading-normal font-medium pt-0.5">
            💡 <span className="text-slate-300">Too many warnings?</span> Slide to the right to increase threshold for wide-angle cams or closer seating.
          </p>
        </div>



        {/* BOTTOM METRICS & DISENGAGE ROW */}
        {isActive && (
          <div className="grid grid-cols-3 gap-2.5">
            <div className="bg-black/30 border border-purple-950/60 p-3 rounded-xl text-center">
              <span className="text-[8px] font-mono text-slate-400 uppercase block font-bold">Focus Clock</span>
              <span className="text-xs font-mono font-black text-cyan-300 block mt-0.5">{formatSecs(focusSeconds)}</span>
            </div>

            <button
              onClick={stopCamera}
              className="bg-rose-500 hover:bg-rose-600 text-white font-display font-extrabold text-[10px] py-3 rounded-xl uppercase tracking-widest transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow h-full"
            >
              <Square className="w-3.5 h-3.5 fill-current" /> Stop Overwatch
            </button>

            <div className="bg-black/30 border border-purple-950/60 p-3 rounded-xl flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-[9px] font-mono font-black text-cyan-400 uppercase tracking-wider">SECURE SHIELD</span>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
