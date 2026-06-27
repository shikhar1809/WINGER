import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Shield, Sparkles, MapPin, Lock, Zap, User, Radio, Battery, Wifi, 
  Plus, Trash2, ShieldAlert, Heart, Calendar, PhoneCall, AlertCircle, Edit, Check, Mic, MessageSquare, X,
  Volume2, VolumeX, Leaf, HelpCircle, Lightbulb, Settings, Camera
} from "lucide-react";
import { UserProfile, TrustedContact } from "./types";
import WingerBot from "./components/WingerBot";
import SafeRoute from "./components/SafeRoute";
import Planner from "./components/Planner";
import Overwatch from "./components/Overwatch";

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>({
    name: "",
    phone: "",
    emergencyMessage: "I'm having sensory overload or executive block right now, study companion system is taking over to help me calm down and refocus. Deep breaths.",
    trustedContacts: [],
    isOnboarded: true,
    isWorking: true,
    pinCode: "1234"
  });
  const [activeTab, setActiveTab] = useState<"companion" | "route" | "vault" | "settings" | "talk" | "overwatch">("companion");
  const [botEmotion, setBotEmotion] = useState<"happy" | "vigilant" | "alert" | "thinking" | "listening" | "speaking">("happy");
  const [weather, setWeather] = useState<"sunny" | "rainy" | "hot" | "cold">("sunny");
  const [botNudge, setBotNudge] = useState<string>(
    "Hi! I am Winger, your forever wingman. Give me some gentle taps to test calibration parameters!"
  );
  
  const activeAbortControllerRef = React.useRef<AbortController | null>(null);
  const activeUtteranceRef = React.useRef<SpeechSynthesisUtterance | null>(null);
  const isHoldReleasedRef = React.useRef<boolean>(false);
  const isHoldProcessedRef = React.useRef<boolean>(false);
  const [lastUserSpokenText, setLastUserSpokenText] = useState<string>("");
  
  // Conversational Support Chat states for Talk to Winger
  const [talkInput, setTalkInput] = useState("");
  const [isWingerResponding, setIsWingerResponding] = useState(false);
  const [talkHistory, setTalkHistory] = useState<Array<{ sender: "user" | "winger"; text: string; timestamp: string }>>([
    { sender: "winger", text: "Hello, I am Winger. As your cognitive study companion, I am here to help you untangle overwhelmedness, task freeze, and study blockages. How can I guide your focus today? 💕", timestamp: "Just now" }
  ]);
  const [isChatExpanded, setIsChatExpanded] = useState<boolean>(false);
  const [isSafetyCheckin, setIsSafetyCheckin] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactRel, setNewContactRel] = useState("Sister");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editingName, setEditingName] = useState("");
  const [editingMsg, setEditingMsg] = useState("");
  const [editingPin, setEditingPin] = useState("1234");
  const [isEditingSettings, setIsEditingSettings] = useState(false);

  // Splashscreen and Walkthrough Settings
  const [isSplash, setIsSplash] = useState(true);
  const [walkthroughStep, setWalkthroughStep] = useState<number | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceInputText, setVoiceInputText] = useState("");
  const [routeOverrideDest, setRouteOverrideDest] = useState("");
  const [isAgentDragging, setIsAgentDragging] = useState(false);

  // ADHD Sensory and Cognitive Customization Toggles
  const [isMuted, setIsMuted] = useState(false);
  const [isLowStimMode, setIsLowStimMode] = useState(false);
  const [fastTangent, setFastTangent] = useState("");
  const [overwatchTestTrigger, setOverwatchTestTrigger] = useState<(() => void) | null>(null);

  // ====== VEO & NANO BANANA STATE INJECTIONS ======
  const [isAcademyOpen, setIsAcademyOpen] = useState(false);
  const [academyTab, setAcademyTab] = useState<"veo" | "banana">("veo");
  const [veoTechnique, setVeoTechnique] = useState("Elbow Strike Backward Escape");
  const [isGeneratingVeo, setIsGeneratingVeo] = useState(false);
  const [veoResult, setVeoResult] = useState<any>(null);
  const [veoFrameIndex, setVeoFrameIndex] = useState(0);

  const [bananaScenario, setBananaScenario] = useState("Cab driver took wrong route after dark");
  const [isGeneratingBanana, setIsGeneratingBanana] = useState(false);
  const [bananaResult, setBananaResult] = useState<any>(null);

  // Animation loop for Veo 2D vector animation frames
  useEffect(() => {
    if (!veoResult?.strokeFrames || veoResult.strokeFrames.length === 0) return;
    const interval = setInterval(() => {
      setVeoFrameIndex(prev => (prev + 1) % veoResult.strokeFrames.length);
    }, 140); // smooth action interval speed
    return () => clearInterval(interval);
  }, [veoResult]);

  const handleGenerateVeo = async (customTech?: string) => {
    const techName = customTech || veoTechnique;
    if (!techName.trim()) return;

    setIsGeneratingVeo(true);
    setBotEmotion("thinking");
    setBotNudge("Veo 3.1 Model is synthesizing 2D animations for female self-defense...");

    try {
      const res = await fetch("/api/veo/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ technique: techName })
      });
      const data = await res.json();
      if (data.success) {
        setVeoResult(data);
        setVeoFrameIndex(0);
        setBotEmotion("happy");
        const phrase = `Successfully compiled 2D self-defense animations for: "${techName}". Review the kinematics sequence!`;
        setBotNudge(phrase);
        speakTextOutLoud(phrase);
      }
    } catch (e) {
      console.error(e);
      setBotEmotion("vigilant");
      setBotNudge("Failed to secure connection to Veo servers. Fallbacks activated.");
    } finally {
      setIsGeneratingVeo(false);
    }
  };

  const handleGenerateBanana = async (customScenario?: string) => {
    const sc = customScenario || bananaScenario;
    if (!sc.trim()) return;

    setIsGeneratingBanana(true);
    setBotEmotion("thinking");
    setBotNudge("Nano Banana model is illustrating high-contrast tactical blueprints...");

    try {
      const res = await fetch("/api/banana/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: sc })
      });
      const data = await res.json();
      if (data.success) {
        setBananaResult(data);
        setBotEmotion("happy");
        const phrase = `Nano Banana generated strategic escape vectors for: "${sc}". Study the safe path nodes.`;
        setBotNudge(phrase);
        speakTextOutLoud(phrase);
      }
    } catch (e) {
      console.error(e);
      setBotEmotion("vigilant");
      setBotNudge("Failed to connect to Nano Banana generator.");
    } finally {
      setIsGeneratingBanana(false);
    }
  };
  // ===============================================

  // High-fidelity active study and focus reminders sequence
  const LUCKNOW_TIPS = [
    "Need a dopamine boost? Try setting a mini-goal or drinking some cool water right now! 💧",
    "If you feel a random tangent sprouting, type it in the distraction box so you can return to it later. 🧠",
    "Executive dysfunction check: Pick the smallest possible micro-step on your current sprint to start momentum.",
    "Staring in space? That's okay! Take five slow, deep breaths, and let Winger support you with soft audio tones. 🌿",
    "Check your energy level preset in settings. Keep your sprints short and take breaks when energy is low! 🔋",
    "Winger Bot loves physical petting! Give me a head pat to charge auxiliary sensory nodes."
  ];
  const [activeTipIndex, setActiveTipIndex] = useState(0);

  useEffect(() => {
    const tipInterval = setInterval(() => {
      setActiveTipIndex((prev) => (prev + 1) % LUCKNOW_TIPS.length);
    }, 12000);
    return () => clearInterval(tipInterval);
  }, []);

  // Periodic Pet-Request Interval Effect
  useEffect(() => {
    if (isSplash || isLowStimMode) return;
    const petRequests = [
      "Could you touch my head to calibrate tactile sensors? 🥺",
      "I need a gentle head pat to recharge my focus companion nodes, please! ⚡",
      "Please pet me! Tap my screen to increase our cozy study companion coefficient. 💕",
      "Winger is listening! Please speak your micro-goals or tell me what study blockage is on your mind! 🌸💬",
      "My sensors are clean but my hearts are low. Tap to pet me! 🥰",
      "I am sitting right on your shoulder! Please speak your thoughts or study challenges, I am here to help you focus! 💕🐾"
    ];

    const interval = setInterval(() => {
      const randNudge = petRequests[Math.floor(Math.random() * petRequests.length)];
      setBotNudge(randNudge);
      setBotEmotion("happy");
      playBeepChirp(true);
    }, 25000); // Trigger every 25 seconds

    return () => clearInterval(interval);
  }, [isSplash, profile, isLowStimMode]);

  // Dismiss splashscreen after 3.8 seconds and keep interactive walkthrough voluntary
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSplash(false);
      // We set to null so users don't get forced tutorials on every boot!
      setWalkthroughStep(null);
    }, 3800);
    return () => clearTimeout(timer);
  }, []);

  // Synchronize Walkthrough Steps with App View Tabs to guide user visually through features!
  useEffect(() => {
    if (walkthroughStep === null) return;
    if (walkthroughStep === 0) {
      setActiveTab("companion");
    } else if (walkthroughStep === 1) {
      setActiveTab("route");
    } else if (walkthroughStep === 2) {
      setActiveTab("vault");
    } else if (walkthroughStep === 3) {
      setActiveTab("companion");
    } else if (walkthroughStep === 4) {
      setActiveTab("settings");
    }
  }, [walkthroughStep]);

  // Update virtual phone clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const [showConfigSettings, setShowConfigSettings] = useState(false);
  const [tempWingerName, setTempWingerName] = useState("");

  const handleSaveWingerConsultName = async () => {
    if (!tempWingerName.trim()) return;
    const cleanName = tempWingerName.trim();
    const updatedProfile = profile ? { ...profile, name: cleanName, isOnboarded: true } : {
      name: cleanName,
      phone: "+91 99112 23344",
      emergencyMessage: "I'm having sensory overload or executive block right now, study companion system is taking over to help me calm down and refocus. Deep breaths.",
      trustedContacts: [],
      isOnboarded: true,
      isWorking: true,
      pinCode: "1234"
    };

    setProfile(updatedProfile);
    setEditingName(cleanName);

    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProfile)
      });
      playBeepChirp(true);
      setBotNudge(`Welcome, ${cleanName}! I am so delighted to be your companion! 💕`);
    } catch (e) {
      console.warn("Failed to synchronize profile name to server.", e);
    }
  };

  // Prepopulate support history once the user's name is loaded
  useEffect(() => {
    if (profile?.name) {
      setTalkHistory([
        {
          sender: "winger",
          text: `Hi ${profile.name}! I am Winger, your supportive focus and neurodivergent companion. 🌸 Please tell me whatever executive blockages, sensory overwhelm, or distracting thoughts you are facing right now. I am sitting right on your shoulder to listen, help you calm down, and guide you back into a happy, cozy flow state! You've got this! 💕`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }
  }, [profile?.name]);

  const handleTalkToWingerSubmit = async (customQuery?: string) => {
    const queryToSend = customQuery || talkInput;
    if (!queryToSend.trim()) return;

    const userTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { sender: "user" as const, text: queryToSend, timestamp: userTime };
    
    setTalkHistory(prev => [...prev, userMsg]);
    setIsChatExpanded(true);
    setTalkInput("");
    setIsWingerResponding(true);
    setBotEmotion("thinking");
    setBotNudge("Listening and analyzing to render supportive countermeasures...");
    setLastUserSpokenText(queryToSend);

    // Cancel previous ongoing fetch if any (LIFO cancellation)
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
      activeAbortControllerRef.current = null;
    }

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    const controller = new AbortController();
    activeAbortControllerRef.current = controller;

    // Check for keyword triggers to auto-route/switch views
    const lowercaseQuery = queryToSend.toLowerCase();
    let autoRouteTab: typeof activeTab | null = null;
    let feedbackNudge = "";

    if (lowercaseQuery.includes("plan") || lowercaseQuery.includes("todo") || lowercaseQuery.includes("to-do") || lowercaseQuery.includes("task") || lowercaseQuery.includes("vault") || lowercaseQuery.includes("dump") || lowercaseQuery.includes("schedule")) {
      autoRouteTab = "vault";
      feedbackNudge = "I've loaded the Cozy Planner. Let's look at your things! 🌸";
    } else if (lowercaseQuery.includes("sprint") || lowercaseQuery.includes("timer") || lowercaseQuery.includes("pomodoro") || lowercaseQuery.includes("conquer") || lowercaseQuery.includes("session")) {
      autoRouteTab = "route";
      feedbackNudge = "Study Sprints loaded. Let's set some sessions! 🚀";
    } else if (lowercaseQuery.includes("overwatch") || lowercaseQuery.includes("camera") || lowercaseQuery.includes("cv") || lowercaseQuery.includes("phone") || lowercaseQuery.includes("tracking") || lowercaseQuery.includes("gaze") || lowercaseQuery.includes("padhai") || lowercaseQuery.includes("desk")) {
      autoRouteTab = "overwatch";
      feedbackNudge = "I have opened the Overwatch Camera Guard! Launch your webcam to track study compliance and block mobile scrolling. 👁️🤖";
    } else if (lowercaseQuery.includes("setting") || lowercaseQuery.includes("profile") || lowercaseQuery.includes("pin") || lowercaseQuery.includes("contact") || lowercaseQuery.includes("guardian")) {
      autoRouteTab = "settings";
      feedbackNudge = "Sanctuary Settings opened. Customize your safety profile here.";
    } else if (lowercaseQuery.includes("back") || lowercaseQuery.includes("close") || lowercaseQuery.includes("return") || lowercaseQuery.includes("home") || lowercaseQuery.includes("chat") || lowercaseQuery.includes("companion") || lowercaseQuery.includes("nest")) {
      autoRouteTab = "companion";
      feedbackNudge = "Back in Winger's cozy nest. I am ready to keep you company! 💕";
    }

    if (autoRouteTab) {
      setTimeout(() => {
        setActiveTab(autoRouteTab!);
        setBotNudge(feedbackNudge);
      }, 800);
    }

    try {
      const res = await fetch("/api/agent/talk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: queryToSend,
          userName: profile?.name || "Miss"
        }),
        signal: controller.signal
      });
      const data = await res.json();
      
      if (activeAbortControllerRef.current !== controller) return;

      const wingerReply = {
        sender: "winger" as const,
        text: data.response,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setTalkHistory(prev => [...prev, wingerReply]);
      setBotNudge(data.response);
      setBotEmotion("happy");
      speakTextOutLoud(data.response);
    } catch (e: any) {
      if (e.name === "AbortError") {
        console.log("Talk fetch aborted.");
        return;
      }
      console.error(e);
      const wingerReply = {
        sender: "winger" as const,
        text: "I am always with you! Please head to well-lit busy areas like Hazratganj pink booths immediately. Your security team is on active standby. 🛡️✨",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setTalkHistory(prev => [...prev, wingerReply]);
      setBotEmotion("vigilant");
    } finally {
      if (activeAbortControllerRef.current === controller) {
        setIsWingerResponding(false);
        activeAbortControllerRef.current = null;
      }
    }
  };

  // HTML5 Sound Effects Engine
  const playBeepChirp = (isStart: boolean) => {
    if (isMuted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = "sine";
      if (isStart) {
        osc.frequency.setValueAtTime(750, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1250, audioCtx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      } else {
        osc.frequency.setValueAtTime(1150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(550, audioCtx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.22);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      }
    } catch (e) {
      console.warn("Audio Synthesis blocked", e);
    }
  };

  // HTML5 Speech Synthesizer Voice Engine
  const speakTextOutLoud = (speechText: string) => {
    if (isMuted) return;
    if (typeof window !== "undefined" && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
        activeUtteranceRef.current = null;
        
        // Filter out emojis from the text before voice synthesis
        let cleanText = speechText;
        try {
          cleanText = cleanText.replace(/\p{Extended_Pictographic}/gu, "");
        } catch (e) {
          cleanText = cleanText.replace(/[\u{1F300}-\u{1F9FF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, "");
        }
        // Normalize multiple spaces and trim
        cleanText = cleanText.replace(/\s+/g, " ").trim();

        // If the clean text is empty (only contained emojis), do not speak
        if (!cleanText) return;

        const utterance = new SpeechSynthesisUtterance(cleanText);
        activeUtteranceRef.current = utterance;
        
        utterance.rate = 0.98; // Slightly calmer, more deliberate human flow
        utterance.pitch = 1.0; // Standard warm human pitch rather than high-pitched robot
        
        utterance.onstart = () => {
          setBotEmotion("speaking");
        };
        utterance.onend = () => {
          setBotEmotion("happy");
          activeUtteranceRef.current = null;
        };
        utterance.onerror = () => {
          setBotEmotion("happy");
          activeUtteranceRef.current = null;
        };

        const voices = window.speechSynthesis.getVoices();
        // Modern browsers provide several "natural", "neural", or "premium" voices
        // Prefer "natural" / "neural" / "siri" / "safari" / "microsoft" / "google US" / elegant female/male voices
        let selectedVoice = null;
        
        // Strategy 1: Look for premium/natural/neural English voices
        selectedVoice = voices.find(v => 
          v.lang.startsWith("en") && 
          (v.name.toLowerCase().includes("natural") || 
           v.name.toLowerCase().includes("neural") ||
           v.name.toLowerCase().includes("aria") ||
           v.name.toLowerCase().includes("siri") ||
           v.name.toLowerCase().includes("samantha") ||
           v.name.toLowerCase().includes("google us english") ||
           v.name.toLowerCase().includes("premium"))
        );

        // Strategy 2: Fallback to high-quality Google voice or generic female voice
        if (!selectedVoice) {
          selectedVoice = voices.find(v => 
            v.lang.startsWith("en") && 
            (v.name.toLowerCase().includes("google") || 
             v.name.toLowerCase().includes("female") || 
             v.name.toLowerCase().includes("zira"))
          );
        }

        // Strategy 3: Dynamic generic English voice
        if (!selectedVoice) {
          selectedVoice = voices.find(v => v.lang.startsWith("en"));
        }

        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
        // Save globally to prevent Garbage Collection from cutting off long speech mid-flow
        (window as any)._activeUtterance = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.warn("Speech Synthesis blocked", err);
        setBotEmotion("happy");
      }
    }
  };

  const holdSpeechRecognitionRef = React.useRef<any>(null);
  const latestTranscriptRef = React.useRef<string>("");

  const sendVoiceQueryToServer = async (recordedQuery: string) => {
    setBotEmotion("thinking");
    setBotNudge("Processing vocal notes and calculating focus help...");
    setIsWingerResponding(true);
    setLastUserSpokenText(recordedQuery);

    // Cancel previous ongoing fetch if any (LIFO cancellation)
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
      activeAbortControllerRef.current = null;
    }

    const controller = new AbortController();
    activeAbortControllerRef.current = controller;

    try {
      const response = await fetch("/api/agent/talk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          query: recordedQuery, 
          userName: profile?.name || "Companion" 
        }),
        signal: controller.signal
      });
      
      const data = await response.json();
      
      if (activeAbortControllerRef.current !== controller) return;
      
      // Push both message threads onto talk logs for syncing with chat view
      const logTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const userMsgNode = { sender: "user" as const, text: recordedQuery, timestamp: logTime };
      const wingerMsgNode = { sender: "winger" as const, text: data.response, timestamp: logTime };
      setTalkHistory(prev => [...prev, userMsgNode, wingerMsgNode]);

      // Synthesize outcome Nudges & vocals
      setBotNudge(data.response);
      speakTextOutLoud(data.response);
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Hold fetch aborted.");
        return;
      }
      setBotEmotion("happy");
      const defaultSecureReply = "I am with you. Take a slow deep breath, and let's work on our tasks one small step at a time! 🌿";
      setBotNudge(defaultSecureReply);
      speakTextOutLoud(defaultSecureReply);
    } finally {
      if (activeAbortControllerRef.current === controller) {
        setIsWingerResponding(false);
        activeAbortControllerRef.current = null;
      }
    }
  };

  const triggerFinalLogProcessing = () => {
    if (isHoldProcessedRef.current) return;
    isHoldProcessedRef.current = true;

    const recordedQuery = latestTranscriptRef.current.trim() || voiceInputText.trim();
    
    // Reset refs & input states
    holdSpeechRecognitionRef.current = null;
    setVoiceInputText("");
    latestTranscriptRef.current = "";

    if (!recordedQuery) {
      // If the user held but didn't say anything, let's guide them kindly
      setBotEmotion("happy");
      setBotNudge("I'm right here. Whenever you're ready, hold my shell and share how you feel! 🌸");
      return;
    }

    sendVoiceQueryToServer(recordedQuery);
  };

  const handleWingerHoldStart = () => {
    // 1. Play starting chime
    playBeepChirp(true);
    
    // Stop any speech that is speaking
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      activeUtteranceRef.current = null;
    }

    // Cancel previous ongoing fetch if any (LIFO cancellation)
    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
      activeAbortControllerRef.current = null;
    }

    isHoldReleasedRef.current = false;
    isHoldProcessedRef.current = false;
    setBotEmotion("listening");
    setBotNudge("Hearing... Keep holding to speak your concern freely! 🎙️");
    setVoiceInputText(""); // reset
    latestTranscriptRef.current = "";
    
    // 3. Initiate actual browser microphone recording if available
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recObj = new SpeechRecognition();
          recObj.continuous = false;
          recObj.lang = "en-IN";
          recObj.interimResults = false;
          
          recObj.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript || "";
            setVoiceInputText(transcript);
            latestTranscriptRef.current = transcript;
            console.log("[Winger Voice] Live transcription caught:", transcript);
          };
          
          recObj.onerror = (e: any) => {
            console.warn("Hold speech recognition error:", e);
          };
          
          recObj.onend = () => {
            console.log("[Winger Voice] Speech recognition disconnected. isHoldReleased:", isHoldReleasedRef.current);
            // If the user has already released, process the transcript!
            if (isHoldReleasedRef.current) {
              triggerFinalLogProcessing();
            }
          };
          
          recObj.start();
          holdSpeechRecognitionRef.current = recObj;
        } catch (err) {
          console.warn("Speech recognition creation failed", err);
        }
      } else {
        // Fallback simulate voice input on browsers without webkitSpeechRecognition
        const fallbackText = "I feel completely overwhelmed by my study task right now";
        setVoiceInputText(fallbackText);
        latestTranscriptRef.current = fallbackText;
      }
    }
  };

  const handleWingerHoldEnd = () => {
    // 1. Play release beep chime
    playBeepChirp(false);
    
    isHoldReleasedRef.current = true;
    
    // 2. Terminate speech object after a short 600ms grace period to ensure final spoken words are fully processed and not clipped
    setBotEmotion("thinking");
    setBotNudge("Concluding voice window... ⌛");

    setTimeout(() => {
      // Ensure the user hasn't pressed hold again while we were waiting
      if (!isHoldReleasedRef.current) return;

      if (holdSpeechRecognitionRef.current) {
        try {
          setBotNudge("Transcribing your vocal notes... ⌛");
          // This will trigger the speech engine to stop recording and dispatch final onresult then onend
          holdSpeechRecognitionRef.current.stop();
          
          // Safety Fallback: if browser onend fails to fire within 1500ms, force process whatever we have in transcript
          setTimeout(() => {
            if (!isHoldProcessedRef.current) {
              console.log("[Winger Voice] Fallback safety timeout triggered processing");
              triggerFinalLogProcessing();
            }
          }, 1500);
        } catch (e) {
          console.warn("Error stopping speech recognition:", e);
          triggerFinalLogProcessing();
        }
      } else {
        // Browser didn't support speech recognition or it didn't start, use default or direct fallback
        const fallbackText = latestTranscriptRef.current.trim() || voiceInputText.trim() || "How do I clear my head from distracting thoughts right now?";
        latestTranscriptRef.current = fallbackText;
        triggerFinalLogProcessing();
      }
    }, 600);
  };


  // Safe Speech Recognition capture block
  const startVoiceCapture = () => {
    if (typeof window === "undefined") return;
    
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      handleVoiceCommandSimulated("plan the route to Gomti Nagar");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = "en-IN"; // Vocal command speech syntax optimization
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setBotEmotion("thinking");
        setBotNudge("Listening carefully to your focus command...");
        playBeepChirp(true);
      };

      recognition.onerror = () => {
        setIsListening(false);
        setBotEmotion("vigilant");
        setBotNudge("Hearing core offline. Please tap on one of the cognitive prompts directly below!");
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript || "";
        setVoiceInputText(transcript);
        processVoiceCommandText(transcript);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      handleVoiceCommandSimulated("plan the route to Gomti Nagar");
    }
  };

  const handleVoiceCommandSimulated = (commandString: string) => {
    playBeepChirp(true);
    setBotEmotion("thinking");
    setBotNudge(`Recognizing simulated voice command: "${commandString}"...`);
    setIsListening(true);
    
    setTimeout(() => {
      setIsListening(false);
      processVoiceCommandText(commandString);
    }, 1500);
  };


  const processVoiceCommandText = (text: string) => {
    const rawText = text.toLowerCase();
    
    if (
      rawText.includes("sprint") || 
      rawText.includes("study") || 
      rawText.includes("focus") || 
      rawText.includes("task") ||
      rawText.includes("work")
    ) {
      let sprintGoal = "";
      if (rawText.includes("sprint for")) {
        sprintGoal = rawText.split("sprint for")[1]?.trim();
      } else if (rawText.includes("study")) {
        sprintGoal = rawText.split("study")[1]?.trim();
      } else if (rawText.includes("focus on")) {
        sprintGoal = rawText.split("focus on")[1]?.trim();
      } else {
        sprintGoal = "Deep Focus Session";
      }

      sprintGoal = sprintGoal.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").trim() || "Deep Focus Session";
      const capitalizedGoal = sprintGoal.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      triggerVoiceSprintResponse(capitalizedGoal);
    } else {
      setBotEmotion("happy");
      setBotNudge(`I heard: "${text}". Try saying: "start a study sprint for Mathematics" so I can help you focus, ${profile?.name || "friend"}!`);
      playBeepChirp(false);
    }
  };

  const triggerVoiceSprintResponse = (sprintName: string) => {
    const name = profile?.name || "Explorer";
    const phrase = `Initializing your study sprint for ${sprintName}, ${name}`;
    
    speakTextOutLoud(phrase);
    setBotEmotion("happy");
    setBotNudge(`Initializing study sprint for ${sprintName} now, ${name}. Calming distraction vectors...`);
    
    setTimeout(() => {
      setActiveTab("route");
    }, 1100);
  };

  // Sync profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        const profileData = {
          ...data,
          name: data?.name || "",
          phone: data?.phone || "",
          isOnboarded: true,
          pinCode: data?.pinCode || "1234",
          trustedContacts: data?.trustedContacts || []
        };
        setProfile(profileData);
        setEditingName(profileData.name);
        setEditingMsg(profileData.emergencyMessage || "I feel unsafe. Winger SOS triggered. Please track my location immediately. Live audio evidence recording active.");
        setEditingPin(profileData.pinCode);
        setBotNudge(`Welcome, ${profileData.name || "friend"}! Let's start with a sensor calibration test! 💕`);
      } catch (e) {
        console.warn("Express server profile fetch failure. Using client fallback.", e);
        const mock: UserProfile = {
          name: "",
          phone: "",
          emergencyMessage: "I feel unsafe. Winger SOS triggered. Please track my location immediately. Live audio evidence recording active.",
          trustedContacts: [],
          isOnboarded: true,
          isWorking: true,
          pinCode: "1234",
        };
        setProfile(mock);
        setEditingName(mock.name);
        setEditingMsg(mock.emergencyMessage);
        setEditingPin(mock.pinCode);
      }
    };
    loadProfile();
  }, []);

  const handleAddNewContact = async () => {
    if (!newContactName || !newContactPhone || !profile) return;
    const con: TrustedContact = {
      id: "contact_" + Date.now(),
      name: newContactName,
      phone: newContactPhone,
      relationship: newContactRel
    };

    const updatedProfile = {
      ...profile,
      trustedContacts: [...(profile.trustedContacts || []), con]
    };

    setProfile(updatedProfile);
    setNewContactName("");
    setNewContactPhone("");
    setBotNudge(`Security network expanded. Registered ${con.name} as trusted responder!`);

    await saveProfileToServer(updatedProfile);
  };

  const handleDeleteContact = async (id: string) => {
    if (!profile) return;
    const filtered = (profile.trustedContacts || []).filter(c => c.id !== id);
    const updatedProfile = {
      ...profile,
      trustedContacts: filtered
    };

    setProfile(updatedProfile);
    setBotNudge("Safety contact list revised.");
    await saveProfileToServer(updatedProfile);
  };

  const handleUpdateSettings = async () => {
    if (!profile) return;
    setIsSavingProfile(true);
    
    const updatedProfile: UserProfile = {
      ...profile,
      name: editingName,
      emergencyMessage: editingMsg,
      pinCode: editingPin
    };

    setProfile(updatedProfile);
    setIsEditingSettings(false);
    setBotNudge("Profiles settings synchronized with high-grade lock.");
    await saveProfileToServer(updatedProfile);
    setIsSavingProfile(false);
  };

  const saveProfileToServer = async (p: UserProfile) => {
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(p)
      });
    } catch (e) {
      console.warn("Express server profile write failure.", e);
    }
  };

  const handleCheckinAck = () => {
    setIsSafetyCheckin(false);
    setBotNudge("Awesome! Winger ambient microphone is calibrated and your focused space is beautifully secured.");
  };

  const handleSaveFastTangent = async () => {
    if (!fastTangent.trim()) return;
    try {
      const res = await fetch("/api/braindumps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: fastTangent.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setBotNudge("Tangential thought safely locked inside the brain dump locker! Let's return to studying with a clear, happy space. 🧠✨");
        setFastTangent("");
        playBeepChirp(true);
      }
    } catch (e) {
      console.warn("Failed to save fast tangent:", e);
    }
  };

  return (
    <div className="min-h-screen bg-[#07050f] text-slate-100 font-sans flex flex-col justify-center items-center overflow-x-hidden">
      
      {/* Dynamic Ambient Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-purple-950/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-indigo-950/20 rounded-full blur-[150px] pointer-events-none" />

      {/* Grid line patterns overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#15112e_1px,transparent_1px),linear-gradient(to_bottom,#15112e_1px,transparent_1px)] bg-[size:40px_40px] opacity-10 pointer-events-none" />

      {/* 2. Centered Mobile Locked Layout (Forces gorgeous central smartphone frame layout on all viewport widths) */}
      <main className={`flex-1 w-full px-4 py-4 md:py-8 flex flex-col md:flex-row items-center justify-center gap-6 relative transition-all duration-300 mx-auto ${activeTab === "overwatch" ? "max-w-4xl" : "max-w-md"}`}>
        
        {/* Smartphone device Mockup wrapper block */}
        <div className={`w-full max-w-[420px] md:min-h-[780px] md:h-[840px] md:border-[10px] md:border-slate-800 md:rounded-[48px] relative flex flex-col justify-between overflow-hidden border rounded-3xl h-[82vh] transition-all duration-500 ${isLowStimMode ? 'bg-[#0f1412] border-emerald-950/60 shadow-[0_0_40px_rgba(16,185,129,0.1)]' : 'bg-[#110F1A] border-purple-950/40 shadow-[0_0_55px_rgba(110,68,255,0.22)]'}`}>
          
          {/* Removed top status bar block for simplified pure smartphone panel */}

          {/* SCREEN PORTION (Scroll container inside phone size limits) */}
          <div className={`flex-1 overflow-hidden relative flex flex-col justify-between transition-all duration-500 ${isLowStimMode ? 'bg-[#0a0f0d]' : 'bg-[#110f1a]'}`}>
            
            {/* Native Startup Splashscreen Overlay Component */}
            <AnimatePresence>
              {isSplash && (
                <motion.div
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: "easeInOut" }}
                  className="absolute inset-0 bg-[#0c0a17] flex flex-col items-center justify-center z-50 p-6 select-none"
                >
                  <div className="absolute w-48 h-48 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
                  <div className="absolute w-36 h-36 bg-cyan-400/10 rounded-full blur-2xl animate-pulse" />

                  {/* Core Wingman Graphic figure styled exactly like the homepage companion bot */}
                  <div className="mb-6 scale-90 pointer-events-none select-none">
                    <WingerBot emotion="happy" />
                  </div>

                  <h1 className="font-display font-black text-2xl text-white tracking-widest uppercase text-center">WINGER</h1>

                  <div className="mt-12 text-center max-w-xs space-y-1">
                    <p className="text-xs font-display font-black uppercase text-cyan-400 tracking-wider">The Warmest Shoulder To Rely On</p>
                    <p className="text-[10px] text-slate-350">Always-On Calm Support, Focus, & Compassionate Guidance</p>
                    <div className="w-16 h-0.5 bg-cyan-400/50 mx-auto mt-2" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Interactive Guided Walkthrough Tooltip Overlay */}
            <AnimatePresence>
              {walkthroughStep !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 30, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                  className={`absolute bottom-22 left-4 right-4 bg-indigo-950/98 border-2 border-cyan-400 p-4 rounded-2xl shadow-2xl z-40 text-left transition-all duration-300 ${isAgentDragging ? "opacity-0 translate-y-10 pointer-events-none" : "opacity-100 translate-y-0"}`}
                >
                  <div className="flex justify-between items-center mb-1.5 border-b border-purple-900/40 pb-1.5">
                    <span className="text-[8px] font-mono text-cyan-400 tracking-widest uppercase font-extrabold">Guided focus walk · Step {walkthroughStep + 1} of 5</span>
                    <button 
                      onClick={() => {
                        setWalkthroughStep(null);
                        setActiveTab("companion");
                      }}
                      className="text-slate-400 hover:text-white font-mono text-[10px] cursor-pointer"
                    >
                      ✕ Skip Walkthrough
                    </button>
                  </div>

                  <div className="text-[11.5px] text-slate-100 leading-relaxed mb-3 space-y-2">
                    {walkthroughStep === 0 && (
                      <p className="font-sans">
                        Winger is now perched on your virtual shelf! 🐾
                        <strong className="block mt-1 text-cyan-300 font-semibold font-sans">
                          Give Winger a tap or drag him around! He chirps, giggles, and reacts with supportive study boosts to your head pats. 💕
                        </strong>
                      </p>
                    )}
                    {walkthroughStep === 1 && (
                      <p className="font-sans">
                        Let's check the <strong className="text-cyan-300 font-bold underline text-xs">Study Sprints Tab</strong>. Set cozy focus timers, build academic checklists, and use our <span className="text-amber-300">AI Task Demystifier</span> to break down giant chores into 5-minute micro tasks!
                      </p>
                    )}
                    {walkthroughStep === 2 && (
                      <p className="font-sans">
                        This is the <strong className="text-cyan-300 font-bold underline text-xs">Brain Dump Locker</strong>. When a stray thought triggers an exciting rabbit hole while studying, type and lock it here so you can focus, then explore it during breaks! 🧠🌱
                      </p>
                    )}
                    {walkthroughStep === 3 && (
                      <p className="font-sans">
                        Here is <strong className="text-cyan-300 font-bold underline text-xs">Winger Chat</strong>. Feeling stuck or facing task paralysis? Speak or type to Winger directly. He can automatically launch your planners, start focus sprints, doodle, or offer delightfully non-judgmental, warm supportive advice. 💕
                      </p>
                    )}
                    {walkthroughStep === 4 && (
                      <p className="font-sans">
                        Finally, review your <strong className="text-cyan-300 font-bold underline text-xs">Student Profile</strong>. Declare your study preferences, select your study energy levels, and configure customized calm zones!
                      </p>
                    )}
                  </div>

                  <div className="flex justify-between items-center border-t border-purple-900/30 pt-2.5 mt-2">
                    <div className="flex gap-1">
                      {[0, 1, 2, 3, 4].map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            playBeepChirp(true);
                            setWalkthroughStep(s);
                          }}
                          className={`w-2.5 h-2.5 rounded-full transition-all cursor-pointer ${walkthroughStep === s ? "bg-cyan-400 w-4.5" : "bg-slate-700 hover:bg-slate-500"}`}
                          title={`Go to step ${s + 1}`}
                        />
                      ))}
                    </div>
                    
                    <button
                      onClick={() => {
                        playBeepChirp(true);
                        if (walkthroughStep < 4) {
                          setWalkthroughStep(walkthroughStep + 1);
                        } else {
                          setWalkthroughStep(null);
                          setActiveTab("companion");
                          setBotNudge(`I am watching over you happily, ${profile?.name || 'friend'}! Ready for a wonderful focus session.`);
                        }
                      }}
                      className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-black px-3.5 py-1.5 rounded-xl text-[10px] uppercase tracking-wider leading-none cursor-pointer transition-all active:scale-95"
                    >
                      {walkthroughStep === 4 ? "LET'S GO! 💕" : "NEXT"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Minimal Clean Control Header */}
            {!isSplash && (
              <div className="px-4 py-3 border-b border-purple-950/30 flex items-center justify-between bg-slate-950/20 relative z-30 shrink-0 select-none">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse animate-duration-1000" />
                  <span className="text-[10px] font-display font-black text-slate-300 tracking-wider uppercase">Winger Companion Mode</span>
                </div>
                
                <div className="flex items-center gap-1.5">
                  {/* Sound Mute Toggle */}
                  <button
                    onClick={() => {
                      setIsMuted(!isMuted);
                      if (isMuted) {
                        try {
                          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
                          const osc = audioCtx.createOscillator();
                          const gain = audioCtx.createGain();
                          osc.connect(gain);
                          gain.connect(audioCtx.destination);
                          osc.type = "sine";
                          osc.frequency.setValueAtTime(650, audioCtx.currentTime);
                          gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
                          osc.start();
                          osc.stop(audioCtx.currentTime + 0.08);
                        } catch(e){}
                      }
                    }}
                    className={`p-1 rounded-lg transition-all cursor-pointer h-6 w-6 flex items-center justify-center border ${
                      isMuted 
                        ? "bg-rose-950/50 text-rose-400 border-rose-900/40 hover:bg-rose-900/45" 
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                    }`}
                    title={isMuted ? "Unmute Winger sounds & voice synthesis" : "Mute all Winger sounds & voices"}
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>

                  {/* Start Guided Tour */}
                  <button
                    onClick={() => {
                      playBeepChirp(true);
                      setWalkthroughStep(0);
                    }}
                    className="p-1 rounded-lg bg-slate-900 text-slate-400 border border-slate-800 hover:text-white transition-all cursor-pointer h-6 w-6 flex items-center justify-center"
                    title="Interactive Guided Tour"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>

                  {/* Settings Toggle Button */}
                  <button
                    onClick={() => {
                      playBeepChirp(true);
                      if (activeTab === "settings") {
                        setActiveTab("companion");
                        setBotEmotion("happy");
                        setBotNudge("I am live! Ask me anything or let me know how you're feeling. 💕");
                      } else {
                        setActiveTab("settings");
                        setBotEmotion("happy");
                        setBotNudge("Welcome to your settings sanctuary. Adjust safety & presets here.");
                      }
                    }}
                    className={`p-1 rounded-lg transition-all cursor-pointer h-6 w-6 flex items-center justify-center border ${
                      activeTab === "settings"
                        ? "bg-cyan-500/25 text-cyan-300 border-cyan-500/40 animate-pulse"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                    }`}
                    title={activeTab === "settings" ? "Back to Winger Chat" : "Open Settings & Profile"}
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Active Tab Screen Area */}
            <div className={`flex-1 flex flex-col min-h-0 p-4 select-none custom-scrollbar ${activeTab === "companion" || activeTab === "route" ? "overflow-hidden" : "overflow-y-auto"}`}>
                
                <AnimatePresence mode="wait">
                  
                  {activeTab === "companion" && (
                    <motion.div
                      key="companion-tab"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      className={`flex flex-col flex-1 h-full min-h-0 w-full ${!isChatExpanded ? "justify-center items-center gap-6" : "space-y-3"}`}
                    >
                      {/* Interactive WingerBot - Perfectly Centered when Chat is Closed */}
                      <div className={`select-none transition-all duration-500 ${!isChatExpanded ? "flex-1 flex flex-col justify-center items-center scale-110" : "shrink-0 flex flex-col items-center scale-95 origin-top"}`}>
                        <WingerBot
                          emotion={botEmotion}
                          interactiveNudge={botNudge}
                          weather={weather}
                          onTap={() => {
                            setBotEmotion("happy");
                          }}
                          onHoldStart={handleWingerHoldStart}
                          onHoldEnd={handleWingerHoldEnd}
                          onDragStateChange={setIsAgentDragging}
                        />
                      </div>

                      {/* Unified Conversational Chat history (Collapsable) */}
                      {!isChatExpanded ? (
                        <div className="w-full relative shrink-0 pb-2">
                          <button
                            id="winger-chat-bar"
                            onClick={() => {
                              setIsChatExpanded(true);
                              playBeepChirp(true);
                              setBotNudge("I am ready! Let's talk through your study blocks or focus freeze. 🩺💕");
                            }}
                            className="bg-[#151221] hover:bg-cyan-500/10 border-2 border-purple-500/25 p-4 rounded-2xl flex items-center justify-between text-slate-100 transition-all font-display font-medium text-xs uppercase tracking-wider select-none shrink-0 cursor-pointer w-full text-left"
                          >
                            <div className="flex items-center gap-2.5">
                              <MessageSquare className="w-4 h-4 text-cyan-400 animate-bounce" />
                              <span className="font-extrabold text-[11px]">Chat with Winger</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[9px] font-mono text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded-full border border-cyan-500/40 font-bold uppercase shrink-0">
                              Consult 💬
                            </div>
                          </button>
                        </div>
                      ) : (
                        <>
                          {/* Expanded Chat Header */}
                          <div className="shrink-0 flex justify-between items-center bg-[#151221]/90 border border-purple-500/20 px-3 py-2 rounded-2xl">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                              <span className="font-display font-bold text-[9px] text-slate-100 tracking-widest uppercase">
                                {!profile?.name ? "Winger Setup" : "Winger Consult"}
                              </span>
                            </div>
                            <button
                              id="winger-chat-close"
                              onClick={() => {
                                setIsChatExpanded(false);
                                playBeepChirp(false);
                              }}
                              className="text-[9px] text-rose-400 hover:text-rose-300 font-mono flex items-center gap-1 cursor-pointer bg-black/40 px-2 py-0.5 rounded-lg border border-purple-950 hover:border-rose-950/40 transition-all font-bold"
                            >
                              Close &times;
                            </button>
                          </div>

                          {!profile?.name ? (
                            /* Elegant Inline Name Asking Dialog Box */
                            <div className="flex-1 flex flex-col justify-center items-center bg-black/45 border border-purple-500/10 rounded-2xl p-5 space-y-4 text-center">
                              <div className="w-12 h-12 bg-purple-950/40 rounded-full border border-purple-800/60 flex items-center justify-center shrink-0">
                                <Sparkles className="w-5 h-5 text-cyan-400 animate-pulse" />
                              </div>
                              <h4 className="font-display font-extrabold text-sm text-white">Let's introduce ourselves...</h4>
                              <p className="text-xs text-slate-305 px-2 leading-relaxed">
                                "Hi! I am Winger, your supportive focus and neurodivergent companion. 💕 I love to check in on you and address you personally. What's your preferred first name?"
                              </p>
                              <div className="w-full space-y-3 pt-2">
                                <input
                                  type="text"
                                  className="w-full bg-[#1C1A2A] border-2 border-purple-500/20 rounded-xl px-4 py-3 text-xs text-cyan-100 placeholder-slate-600 focus:outline-none focus:border-cyan-400 font-bold text-center"
                                  placeholder="Type your name here..."
                                  value={tempWingerName}
                                  onChange={(e) => setTempWingerName(e.target.value)}
                                  onKeyDown={async (e) => {
                                    if (e.key === "Enter" && tempWingerName.trim()) {
                                      await handleSaveWingerConsultName();
                                    }
                                  }}
                                />
                                <button
                                  onClick={handleSaveWingerConsultName}
                                  disabled={!tempWingerName.trim()}
                                  className="w-full bg-cyan-400 hover:bg-cyan-300 disabled:bg-purple-950/50 disabled:text-slate-600 font-display font-black text-xs py-3.5 rounded-xl uppercase tracking-wider transition-all cursor-pointer shadow h-11 flex items-center justify-center"
                                >
                                  Save My Name 💕
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {/* Unified Conversational Chat history */}
                              <div className="flex-1 overflow-y-auto min-h-0 bg-black/45 border border-purple-500/10 rounded-2xl p-3.5 space-y-3.5 custom-scrollbar scroll-smooth">
                                {talkHistory.map((msg, index) => (
                                  <div
                                    key={index}
                                    className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                                  >
                                    <div
                                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                                        msg.sender === "user"
                                          ? "bg-cyan-500/10 text-cyan-100 rounded-tr-none border-2 border-cyan-500/30 font-medium"
                                          : "bg-[#161224] text-slate-100 rounded-tl-none border border-purple-500/20 leading-relaxed font-semibold shadow-md"
                                      }`}
                                    >
                                      <p className="whitespace-pre-wrap">{msg.text}</p>
                                      <div className="flex items-center justify-between gap-3 mt-1.5 pt-1.5 border-t border-purple-500/5">
                                        {msg.sender === "winger" && (
                                          <button
                                            onClick={() => speakTextOutLoud(msg.text)}
                                            className="text-cyan-400 hover:text-cyan-300 text-[9px] flex items-center gap-1 font-mono transition-all border border-cyan-500/15 hover:border-cyan-500/35 bg-cyan-950/30 px-2 py-0.5 rounded-md cursor-pointer active:scale-95 shrink-0"
                                            title="Read advice out loud"
                                          >
                                            <Volume2 className="w-2.5 h-2.5" />
                                            <span>Speak</span>
                                          </button>
                                        )}
                                        <span className="block text-[8px] text-slate-400 font-mono ml-auto shrink-0">
                                          {msg.sender === "user" ? "You" : "Winger Advice"} • {msg.timestamp}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {isWingerResponding && (
                                  <div className="flex justify-start">
                                    <div className="bg-purple-950/30 border border-purple-800/30 text-slate-300 rounded-2xl px-4 py-3 text-xs animate-pulse font-mono flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                                      <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                                      <span className="font-bold text-cyan-350">Thinking...</span>
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Simplified Micro quick actions */}
                              <div className="shrink-0 flex gap-2 overflow-x-auto no-scrollbar scroll-smooth py-1">
                                {[
                                  { text: "I feel completely overwhelmed", icon: "🤯" },
                                  { text: "How to beat focus freeze?", icon: "⚡" },
                                  { text: "I have a sudden distraction", icon: "💡" }
                                ].map((chip) => (
                                  <button
                                    key={chip.text}
                                    onClick={() => handleTalkToWingerSubmit(chip.text)}
                                    disabled={isWingerResponding}
                                    className="bg-black/40 hover:bg-cyan-500/15 border border-purple-900/60 rounded-xl px-3.5 py-1.5 text-[10px] text-slate-205 transition-all cursor-pointer whitespace-nowrap disabled:opacity-40 font-bold h-9 flex items-center gap-1 shrink-0"
                                  >
                                    <span>{chip.icon}</span> {chip.text}
                                  </button>
                                ))}
                              </div>

                              {/* Message Input box */}
                              <div className="shrink-0 flex gap-2 bg-[#1C1A2A] border border-purple-500/25 rounded-2xl p-2 items-center">
                                <input
                                  type="text"
                                  placeholder="Tell Winger your study hurdles..."
                                  className="flex-1 bg-transparent px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none font-sans"
                                  value={talkInput}
                                  onChange={(e) => setTalkInput(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && !isWingerResponding) {
                                      handleTalkToWingerSubmit();
                                    }
                                  }}
                                  disabled={isWingerResponding}
                                />
                                <button
                                  id="winger-chat-send"
                                  onClick={() => handleTalkToWingerSubmit()}
                                  disabled={isWingerResponding || !talkInput.trim()}
                                  className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 disabled:bg-transparent disabled:text-slate-600 font-display font-black text-xs px-4 py-2 rounded-xl uppercase tracking-wider transition-all shrink-0 cursor-pointer h-10 flex items-center justify-center shadow-md active:scale-95"
                                >
                                  Send
                                </button>
                              </div>
                            </>
                          )}
                        </>
                      )}

                    </motion.div>
                  )}

                  {false && (
                    <motion.div
                      key="academy-tab-legacy"
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      className="space-y-4 text-left flex flex-col h-full overflow-y-auto pb-16 custom-scrollbar"
                    >
                      {/* Back Header */}
                      <div className="flex items-center justify-between border-b border-purple-950/40 pb-3">
                        <div>
                          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block font-bold mb-0.5">Veo Cinematic Lab</span>
                          <h3 className="font-display font-bold text-sm text-slate-100 uppercase tracking-wider">Tactical Academy</h3>
                        </div>
                        <button
                          onClick={() => {
                            setActiveTab("companion");
                            playBeepChirp(true);
                          }}
                          className="bg-purple-950/50 hover:bg-purple-900/70 border border-purple-900/40 px-2.5 py-1.5 rounded-xl text-[9px] font-mono text-cyan-400 flex items-center gap-1 cursor-pointer"
                        >
                          &larr; Back to Wingman
                        </button>
                      </div>

                      {/* Integrated Winger Tactical Academy Card */}
                      <div className="w-full bg-brand-card/90 border border-purple-900/40 rounded-2xl p-4 space-y-4 text-left shadow-lg">
                        <div className="flex items-center justify-between border-b border-purple-950/40 pb-3 gap-2">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
                            <div>
                              <h3 className="font-display font-black text-xs text-white uppercase tracking-widest leading-none">Intelligence Hub</h3>
                              <p className="text-[8px] font-mono uppercase text-[#a855f7] tracking-wider font-semibold">Veo & Nano Banana Intelligence</p>
                            </div>
                          </div>
                          <div className="flex bg-black/40 p-0.5 rounded-lg border border-purple-950 shrink-0">
                            <button
                              onClick={() => { setAcademyTab("veo"); playBeepChirp(true); }}
                              className={`py-1 px-2.5 text-[8px] font-display font-bold uppercase rounded-md transition-all ${
                                academyTab === "veo" ? "bg-purple-900 text-white shadow" : "text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              Veo 2D
                            </button>
                            <button
                              onClick={() => { setAcademyTab("banana"); playBeepChirp(true); }}
                              className={`py-1 px-2.5 text-[8px] font-display font-bold uppercase rounded-md transition-all ${
                                academyTab === "banana" ? "bg-purple-900 text-white shadow" : "text-slate-400 hover:text-slate-200"
                              }`}
                            >
                              Analysis
                            </button>
                          </div>
                        </div>

                        <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                          Ask for any self-defense technique or scenario to synthesize simulated high-contrast joints clips (Veo) or escape blueprints (Nano Banana).
                        </p>

                        {academyTab === "veo" ? (
                          /* VEO ENGINE MODE */
                          <div className="space-y-4">
                            <div className="space-y-1.5">
                              <label className="block text-[8px] font-mono text-slate-400 uppercase tracking-widest font-semibold">Self-Defense Technique</label>
                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  className="flex-1 bg-black/60 border border-purple-900/55 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 font-medium focus:outline-none focus:border-cyan-400"
                                  placeholder="e.g., Throat Jab, Palm Heel Strike"
                                  value={veoTechnique}
                                  onChange={(e) => setVeoTechnique(e.target.value)}
                                />
                                <button
                                  onClick={() => handleGenerateVeo()}
                                  disabled={isGeneratingVeo || !veoTechnique.trim()}
                                  className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-900 disabled:text-slate-600 font-display font-black text-[10px] px-3 py-2 rounded-xl text-slate-100 transition-all flex items-center gap-1 cursor-pointer shrink-0"
                                >
                                  {isGeneratingVeo ? "Analyzing..." : "Analyze"}
                                </button>
                              </div>
                            </div>

                            {/* Preselected Preset tactics */}
                            <div className="space-y-1">
                              <span className="block text-[8px] font-mono uppercase text-slate-500 tracking-wider">Presets:</span>
                              <div className="flex flex-wrap gap-1">
                                {["Wrist Grab Lever Break", "Elbow Strike Backward Escape", "Stentorial Boundary Voice Scream"].map((tech) => (
                                  <button
                                    key={tech}
                                    onClick={() => { setVeoTechnique(tech); handleGenerateVeo(tech); }}
                                    disabled={isGeneratingVeo}
                                    className="bg-purple-950/30 hover:bg-purple-900/55 border border-purple-900/30 px-2 py-1 rounded-lg text-[8.5px] font-mono text-indigo-300 flex items-center gap-1 cursor-pointer"
                                  >
                                    🎯 {tech.split(" ")[0]}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* VEO VIDEO RENDER DISPLAY */}
                            {veoResult ? (
                              <div className="bg-[#120e2e]/40 border border-purple-950 rounded-2xl p-3 space-y-3">
                                <div className="flex justify-between items-center bg-purple-950/30 px-2 py-1 rounded-lg border border-purple-900/20">
                                  <span className="font-mono text-[9px] text-cyan-400 uppercase font-black tracking-wider">
                                    🎥 VEO ACTIVE RENDER
                                  </span>
                                  <span className="text-[8px] font-mono text-purple-300">
                                    Frame {veoFrameIndex + 1} of 15
                                  </span>
                                </div>

                                <div className="relative aspect-video bg-slate-950 rounded-xl border border-purple-900/30 overflow-hidden flex items-center justify-center">
                                  <div className="absolute bottom-0 inset-x-0 h-10 bg-[linear-gradient(to_bottom,#2c1b4d_1px,transparent_1px)] bg-[size:10px_6px] opacity-25" />
                                  <div className="absolute inset-x-0 bottom-4 border-b border-indigo-950" />
                                  
                                  {veoResult.strokeFrames && (
                                    <svg viewBox="0 0 320 180" className="w-full h-full z-10">
                                      <circle cx="160" cy="130" r="45" fill="none" stroke="#22d3ee" strokeDasharray="4 4" strokeWidth="1" strokeOpacity="0.25" />
                                      {veoResult.strokeFrames[veoFrameIndex].effectRadius > 0 && (
                                        <g>
                                          <circle 
                                            cx={veoResult.strokeFrames[veoFrameIndex].defender.armX} 
                                            cy={veoResult.strokeFrames[veoFrameIndex].defender.armY} 
                                            r={veoResult.strokeFrames[veoFrameIndex].effectRadius} 
                                            fill="none" 
                                            className="fill-cyan-500/10 stroke-cyan-400 stroke-2 animate-ping" 
                                          />
                                        </g>
                                      )}
                                      <g opacity="0.8">
                                        <circle cx={veoResult.strokeFrames[veoFrameIndex].attacker.x} cy="100" r="10" fill="#0f172a" stroke="#ef4444" strokeWidth="3" />
                                        <line x1={veoResult.strokeFrames[veoFrameIndex].attacker.x} y1="110" x2={veoResult.strokeFrames[veoFrameIndex].attacker.x} y2="145" stroke="#ef4444" strokeWidth="3" />
                                        <line x1={veoResult.strokeFrames[veoFrameIndex].attacker.x} y1="115" x2={veoResult.strokeFrames[veoFrameIndex].attacker.armX} y2={veoResult.strokeFrames[veoFrameIndex].attacker.armY} stroke="#ef4444" strokeWidth="2.5" />
                                        <line x1={veoResult.strokeFrames[veoFrameIndex].attacker.x} y1="145" x2={veoResult.strokeFrames[veoFrameIndex].attacker.x - 12} y2="168" stroke="#ef4444" strokeWidth="2.5" />
                                        <line x1={veoResult.strokeFrames[veoFrameIndex].attacker.x} y1="145" x2={veoResult.strokeFrames[veoFrameIndex].attacker.x + 8} y2="168" stroke="#ef4444" strokeWidth="2.5" />
                                      </g>
                                      <g>
                                        <circle cx={veoResult.strokeFrames[veoFrameIndex].defender.x} cy="100" r="10" fill="#0f172a" stroke="#22d3ee" strokeWidth="3" />
                                        <line x1={veoResult.strokeFrames[veoFrameIndex].defender.x} y1="110" x2={veoResult.strokeFrames[veoFrameIndex].defender.x} y2="145" stroke="#22d3ee" strokeWidth="3" />
                                        <line x1={veoResult.strokeFrames[veoFrameIndex].defender.x} y1="115" x2={veoResult.strokeFrames[veoFrameIndex].defender.armX} y2={veoResult.strokeFrames[veoFrameIndex].defender.armY} stroke="#22d3ee" strokeWidth="2.5" />
                                        <line x1={veoResult.strokeFrames[veoFrameIndex].defender.x} y1="145" x2={veoResult.strokeFrames[veoFrameIndex].defender.x - 8} y2="168" stroke="#22d3ee" strokeWidth="2.5" />
                                        <line x1={veoResult.strokeFrames[veoFrameIndex].defender.x} y1="145" x2={veoResult.strokeFrames[veoFrameIndex].defender.x + 14} y2="168" stroke="#22d3ee" strokeWidth="2.5" />
                                      </g>
                                    </svg>
                                  )}
                                  <div className="absolute top-2 left-2 bg-black/85 border border-purple-900/50 px-2 py-0.5 rounded text-[8px] font-mono text-[#a855f7] tracking-wider uppercase">
                                    {veoResult.strokeFrames[veoFrameIndex].actionLabel}
                                  </div>
                                </div>

                                <div className="space-y-2 text-xs text-slate-300">
                                  <p className="font-display font-medium text-white text-xs">{veoResult.description}</p>
                                  <p className="text-[10px] text-slate-400 italic">Threat: {veoResult.threatScenario}</p>
                                  <p className="text-[10px] text-cyan-300 font-medium font-mono">Counter: {veoResult.counterMeasureBrief}</p>
                                  <div className="border-t border-purple-950/40 pt-2 space-y-1">
                                    {veoResult.steps.map((st: string, i: number) => (
                                      <p key={i} className="text-[10px] leading-relaxed pl-3 relative text-slate-300 animate-fade-in">
                                        <span className="absolute left-0 text-cyan-400 font-bold">{i + 1}.</span> {st}
                                      </p>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-5 border border-purple-950/30 bg-[#120e2e]/20 rounded-2xl">
                                <p className="text-[10px] text-slate-500">No technique analyzed yet. Input a move or click a preset to simulate!</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          /* NANO BANANA MODE */
                          <div className="space-y-4">
                            <div className="space-y-1.5">
                              <label className="block text-[8px] font-mono text-slate-400 uppercase tracking-widest font-semibold">Describe cognitive anxiety scenario</label>
                              <div className="flex gap-1.5">
                                <input
                                  type="text"
                                  className="flex-1 bg-black/60 border border-purple-900/55 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 font-medium focus:outline-none focus:border-cyan-400"
                                  placeholder="e.g., Procrastination freeze, Exam preparation panic"
                                  value={bananaScenario}
                                  onChange={(e) => setBananaScenario(e.target.value)}
                                />
                                <button
                                  onClick={() => handleGenerateBanana()}
                                  disabled={isGeneratingBanana || !bananaScenario.trim()}
                                  className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-900 disabled:text-slate-600 font-display font-black text-[10px] px-3 py-2 rounded-xl text-slate-100 transition-all flex items-center gap-1 cursor-pointer shrink-0"
                                  id="analyze_banana_button_1"
                                >
                                  {isGeneratingBanana ? "Analyzing..." : "Analyze"}
                                </button>
                              </div>
                            </div>

                            {/* Preselected Preset scenarios */}
                            <div className="space-y-1">
                              <span className="block text-[8px] font-mono uppercase text-slate-500 tracking-wider">Quick focus blocks:</span>
                              <div className="flex flex-wrap gap-1">
                                {["Procrastination Doom Loop", "Sensory Exhaustion Meltdown", "Midterms Memory Freeze"].map((scen) => (
                                  <button
                                    key={scen}
                                    onClick={() => { setBananaScenario(scen); handleGenerateBanana(scen); }}
                                    disabled={isGeneratingBanana}
                                    className="bg-purple-950/30 hover:bg-purple-900/55 border border-purple-900/30 px-2 py-1 rounded-lg text-[8.5px] font-mono text-indigo-300 flex items-center gap-1 cursor-pointer"
                                  >
                                    🧠 {scen.split(" ")[0]}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* BANANA DISPLAY SCREEN */}
                            {bananaResult ? (
                              <div className="bg-[#120e2e]/40 border border-purple-950 rounded-2xl p-3.5 space-y-3">
                                <div className="space-y-2 text-xs">
                                  <p className="font-display font-medium text-white text-[11px]">Primary Blockage: <span className="text-purple-400 font-bold">{bananaResult.threatInsight}</span></p>
                                  <p className="font-sans text-slate-300 leading-relaxed bg-rose-950/25 border border-rose-900/30 p-2 text-[10px] rounded-lg">
                                    👉 <span className="font-semibold text-rose-400 font-mono">Action:</span> {bananaResult.primaryAction}
                                  </p>
                                </div>

                                <div className="relative aspect-video bg-[#05030a] rounded-xl border border-purple-900/30 overflow-hidden flex flex-col justify-end p-2">
                                  <svg viewBox="0 0 320 180" className="absolute inset-0 w-full h-full opacity-40">
                                    <line x1="0" y1="90" x2="320" y2="90" stroke="#1e1b4b" strokeWidth="2.5" strokeDasharray="3 3" />
                                    <line x1="160" y1="0" x2="160" y2="180" stroke="#1e1b4b" strokeWidth="2.5" strokeDasharray="3 3" />
                                    <circle cx="160" cy="90" r="60" fill="none" stroke="#2c2459" strokeWidth="1" strokeDasharray="5 5" />
                                  </svg>

                                  <div className="absolute inset-0 z-20">
                                    {bananaResult.hotspots.map((pt: any, index: number) => {
                                      const isThreat = pt.name.toLowerCase().includes("threat") || pt.name.toLowerCase().includes("agressor") || pt.name.toLowerCase().includes("stalker");
                                      return (
                                        <div
                                          key={index}
                                          style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                                          className="absolute transform -translate-x-1/2 -translate-y-1/2"
                                        >
                                          <span className={`absolute inline-flex h-4 w-4 rounded-full opacity-75 animate-ping ${isThreat ? "bg-red-500" : "bg-cyan-500"}`} />
                                          <div className={`w-3 h-3 rounded-full border-2 border-slate-950 ${isThreat ? "bg-red-500" : "bg-cyan-400"}`} />
                                          <p className="absolute left-4 -top-2 bg-black/90 text-slate-100 border border-purple-900/30 px-1 py-0.5 rounded text-[7px] font-mono whitespace-nowrap font-bold">
                                            {pt.name}
                                          </p>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {bananaResult.imageUrl && (
                                    <img 
                                      src={bananaResult.imageUrl} 
                                      alt="Satellite schematic" 
                                      className="absolute inset-0 w-full h-full object-cover z-10 opacity-70" 
                                      referrerPolicy="no-referrer"
                                    />
                                  )}

                                  <div className="z-30 w-full bg-slate-950/95 border border-purple-900/60 p-1.5 rounded-lg">
                                    <span className="block text-[7.5px] font-mono text-[#a855f7] tracking-wider uppercase font-bold text-left">Mitigation Details:</span>
                                    <div className="space-y-1 text-left">
                                      {bananaResult.hotspots.map((pt: any, i: number) => (
                                        <p key={i} className="text-[9px] text-slate-300 truncate leading-snug">
                                          🔴 <span className="font-bold text-white">{pt.name}:</span> {pt.action}
                                        </p>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-5 border border-purple-950/30 bg-[#120e2e]/20 rounded-2xl">
                                <p className="text-[10px] text-slate-500">No scenarios analyzed yet. Type and click Analyze above!</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "route" && (
                    <motion.div
                      key="route-tab"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="h-full flex flex-col min-h-0"
                    >
                      {/* Back to Winger header */}
                      <div className="flex items-center justify-between border-b border-purple-950/40 pb-3 mb-4 shrink-0">
                        <div>
                          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block font-bold">Focus Engine</span>
                          <h3 className="font-display font-black text-sm text-slate-100 uppercase tracking-wider">Study Sprints & Sinks</h3>
                        </div>
                        <button
                          onClick={() => {
                            setActiveTab("companion");
                            playBeepChirp(true);
                          }}
                          className="bg-black/40 hover:bg-cyan-500/10 border border-purple-950 px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-bold text-cyan-400 hover:text-cyan-350 transition-all cursor-pointer flex items-center gap-1"
                        >
                          &larr; Back to Winger
                        </button>
                      </div>
                      <div className="flex-1 min-h-0">
                        <SafeRoute
                          onNudgeChange={setBotNudge}
                          botStatus={setBotEmotion}
                          overrideDestination={routeOverrideDest}
                          onClearOverride={() => setRouteOverrideDest("")}
                        />
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "vault" && (
                    <motion.div
                      key="vault-tab"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="h-full flex flex-col min-h-0"
                    >
                      {/* Back to Winger header */}
                      <div className="flex items-center justify-between border-b border-purple-950/40 pb-3 mb-4 shrink-0">
                        <div>
                          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block font-bold">Cozy Organizer</span>
                          <h3 className="font-display font-black text-sm text-slate-100 uppercase tracking-wider">Neuro-Divergent Planner</h3>
                        </div>
                        <button
                          onClick={() => {
                            setActiveTab("companion");
                            playBeepChirp(true);
                          }}
                          className="bg-black/40 hover:bg-cyan-500/10 border-2 border-purple-950 px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-bold text-cyan-400 hover:text-cyan-350 transition-all cursor-pointer flex items-center gap-1"
                        >
                          &larr; Back to Winger
                        </button>
                      </div>
                      <div className="flex-1 min-h-0">
                        <Planner
                          onNudgeChange={setBotNudge}
                          botStatus={setBotEmotion}
                        />
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "settings" && (
                    <motion.div
                      key="settings-tab"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="space-y-4 text-left flex flex-col h-full overflow-y-auto scrollbar-none pr-1 pb-6"
                    >
                      {/* Header block */}
                      <div className="shrink-0 flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block font-bold mb-0.5">My Warm Sanctuary</span>
                          <h3 className="font-display font-bold text-sm text-slate-100 uppercase tracking-wider">Compassionate Care Circular & Settings</h3>
                        </div>
                        <button
                          onClick={() => {
                            setActiveTab("companion");
                            playBeepChirp(true);
                          }}
                          className="bg-black/40 hover:bg-cyan-500/10 border border-purple-950 px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-bold text-cyan-400 hover:text-cyan-350 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                        >
                          &larr; Close Settings
                        </button>
                      </div>

                      <div className="space-y-4">
                        {/* Quick profile info editor */}
                        <div className="bg-brand-card border border-purple-900/40 rounded-2xl p-4 space-y-3 relative overflow-hidden">
                          <div className="flex justify-between items-center pb-2 border-b border-purple-950/40">
                            <span className="font-display font-semibold text-[11px] text-white">Your Personal Safe Spaces</span>
                            <button
                              onClick={() => {
                                      if (isEditingSettings) {
                                        handleUpdateSettings();
                                      } else {
                                        setIsEditingSettings(true);
                                      }
                              }}
                              className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold cursor-pointer"
                            >
                              {isEditingSettings ? (
                                <><Check className="w-3.5 h-3.5" /> Save Caring Space</>
                              ) : (
                                <><Edit className="w-3.5 h-3.5" /> Edit Profile</>
                              )}
                            </button>
                          </div>

                          {isEditingSettings ? (
                            <div className="space-y-3 text-xs">
                              <div>
                                <label className="block text-[8px] font-mono text-slate-400 uppercase tracking-wider mb-1">Your Preferred Name</label>
                                <input
                                  type="text"
                                  className="w-full bg-black/60 border border-purple-950 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 font-medium focus:outline-none focus:border-cyan-400"
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                />
                              </div>
                              <div>
                                <label className="block text-[8px] font-mono text-slate-400 uppercase tracking-wider mb-1">Your Safe Word Reset PIN (4 Digits)</label>
                                <input
                                  type="text"
                                  maxLength={4}
                                  className="w-full bg-black/60 border border-purple-950 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 font-mono tracking-widest focus:outline-none focus:border-cyan-400"
                                  value={editingPin}
                                  onChange={(e) => setEditingPin(e.target.value.replace(/\D/g, ""))}
                                  placeholder="e.g. 1234"
                                />
                                <span className="text-[8px] text-slate-400 mt-1 block font-sans">This safe PIN confirms you are calm and centered, allowing Winger to safely exit the sensory containment screen.</span>
                              </div>
                              <div>
                                <label className="block text-[8px] font-mono text-slate-400 uppercase tracking-wider mb-1">Your Calming Message Template for Sensory Overload</label>
                                <textarea
                                  rows={2}
                                  className="w-full bg-black/60 border border-purple-950 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-cyan-400 leading-relaxed animate-none"
                                  value={editingMsg}
                                  onChange={(e) => setEditingMsg(e.target.value)}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1.5 text-xs leading-relaxed">
                              <p>👤 <span className="text-slate-450">My Preferred Name:</span> <span className="font-display font-semibold text-white">{profile?.name}</span></p>
                              <p>📞 <span className="text-slate-450">Comfort Contact Phone:</span> <span className="font-mono text-slate-200">{profile?.phone}</span></p>
                              <p>🔑 <span className="text-slate-450">Reassurance Safety PIN:</span> <span className="font-mono text-cyan-400 font-bold">{profile?.pinCode || "1234"}</span></p>
                              <p className="border-t border-purple-950/30 pt-1 text-[10px] font-sans leading-relaxed text-indigo-300 italic">
                                "{profile?.emergencyMessage || "I am feeling a bit anxious and want to keep you updated. Checking in with you via Winger!"}"
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Add Safety Responder form fields */}
                        <div className="bg-brand-card border border-purple-900/40 rounded-2xl p-3 space-y-3">
                          <span className="block text-[8px] font-mono text-cyan-400 uppercase tracking-wider">Invite a Loving Guardian Angel</span>
                          
                          <div className="space-y-2 text-xs">
                            <input
                              type="text"
                              placeholder="Guardian's name (e.g. Mom, Sister, Bestie)"
                              className="w-full bg-black/50 border border-purple-950 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-accent font-semibold"
                              value={newContactName}
                              onChange={(e) => setNewContactName(e.target.value)}
                            />

                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="tel"
                                placeholder="Their Mobile Number"
                                className="w-full bg-black/50 border border-purple-950 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-brand-accent animate-none"
                                value={newContactPhone}
                                onChange={(e) => setNewContactPhone(e.target.value)}
                              />

                              <select
                                className="w-full bg-black/50 border border-purple-950 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-brand-accent cursor-pointer font-bold"
                                value={newContactRel}
                                onChange={(e) => setNewContactRel(e.target.value)}
                              >
                                <option value="Sister">Sister</option>
                                <option value="Friend">Friend</option>
                                <option value="Parent">Parent</option>
                                <option value="Guardian">Guardian</option>
                                <option value="Other">Other</option>
                              </select>
                            </div>

                            <button
                              onClick={handleAddNewContact}
                              disabled={!newContactName || !newContactPhone}
                              className="w-full bg-cyan-400 hover:bg-cyan-300 disabled:bg-slate-900 disabled:text-slate-600 font-display font-extrabold text-[11px] py-2.5 rounded-xl text-slate-950 transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer mt-1"
                            >
                              <Plus className="w-3.5 h-3.5" /> Keep Guardian Close
                            </button>
                          </div>
                        </div>

                        {/* Active contacts list */}
                        <div className="space-y-2 pb-6">
                          <span className="block text-[8.5px] font-mono text-slate-400 tracking-wider">Loving Guardian Angels Alert Circle ({profile?.trustedContacts?.length || 0})</span>

                          {(!profile?.trustedContacts || profile.trustedContacts.length === 0) ? (
                            <div className="bg-black/20 border border-purple-950/40 rounded-xl p-3 text-center text-slate-450 text-[10px] font-sans">
                              Your circle is empty. Please add a caring friend or family member to watch over you.
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {(profile?.trustedContacts || []).map((contact) => (
                                <div
                                  key={contact.id}
                                  className="bg-black/30 border border-purple-950 rounded-2xl p-2.5 flex justify-between items-center"
                                >
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-xs font-bold text-slate-100 font-display">{contact.name}</span>
                                      <span className="bg-purple-950 text-indigo-300 border border-purple-800/85 text-[8px] px-1.5 py-0.2 rounded font-mono uppercase">
                                        {contact.relationship}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-450 font-mono leading-none">{contact.phone}</p>
                                  </div>

                                  <button
                                    onClick={() => handleDeleteContact(contact.id)}
                                    className="text-slate-500 hover:text-rose-400 p-1 rounded-lg transition-all cursor-pointer"
                                    title="Remove guardian"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>
                    </motion.div>
                  )}

                  {activeTab === "overwatch" && (
                    <motion.div
                      key="overwatch-tab"
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      className="h-full flex flex-col min-h-0"
                    >
                      {/* Back to Winger header */}
                      <div className="flex items-center justify-between border-b border-purple-950/40 pb-3 mb-4 shrink-0">
                        <div>
                          <h3 className="font-display font-black text-sm text-slate-100 uppercase tracking-wider">Overwatch Sentinel</h3>
                        </div>
                        <button
                          onClick={() => {
                            setActiveTab("companion");
                            playBeepChirp(true);
                          }}
                          className="bg-black/40 hover:bg-cyan-500/10 border border-purple-950 px-2.5 py-1.5 rounded-xl text-[10px] font-mono font-bold text-cyan-400 hover:text-cyan-350 transition-all cursor-pointer flex items-center gap-1"
                        >
                          &larr; Back to Winger
                        </button>
                      </div>
                      <div className="flex-1 min-h-0">
                        <Overwatch
                          onNudgeChange={setBotNudge}
                          botStatus={setBotEmotion}
                          registerTestTrigger={setOverwatchTestTrigger}
                        />
                      </div>
                    </motion.div>
                  )}

                  {/* Consolidated legacy talk block into main companion screen */}

                </AnimatePresence>

              </div>

              {/* COMPASSIONATE TACTILE BOTTOM NAVBAR */}
              <div className={`shrink-0 border-t ${
                isLowStimMode 
                  ? "bg-[#0c120f]/95 border-emerald-950/60 shadow-[0_-8px_24px_rgba(16,185,129,0.03)]" 
                  : "bg-[#131122]/98 border-purple-950/80 shadow-[0_-8px_30px_rgba(0,0,0,0.5)]"
              } backdrop-blur-md px-2 py-2 flex items-center justify-around z-30 select-none`}>
                
                {/* Winger Companion Tab */}
                <button
                  onClick={() => {
                    playBeepChirp(true);
                    setActiveTab("companion");
                    setBotEmotion("happy");
                    setBotNudge("I am live! Ask me anything or let me know how you're feeling. 💕");
                  }}
                  className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl relative transition-all duration-300 cursor-pointer group flex-1 ${
                    activeTab === "companion"
                      ? "text-cyan-400 font-bold scale-105"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  title="Winger Care Chat"
                >
                  <div className="relative">
                    <Heart className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${activeTab === "companion" ? "fill-cyan-400/20 text-cyan-400" : "text-slate-400"}`} />
                    {activeTab === "companion" && (
                      <motion.span 
                        layoutId="nav-glow-dot"
                        className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]"
                      />
                    )}
                  </div>
                  <span className="text-[9.5px] font-display uppercase tracking-wider mt-1 block">Winger</span>
                </button>

                {/* Sprints Tab */}
                <button
                  onClick={() => {
                    playBeepChirp(true);
                    setActiveTab("route");
                    setBotEmotion("happy");
                    setBotNudge("Study Sprints engine loaded! Set a timer or let me break down your tasks into small pieces. ⏳");
                  }}
                  className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl relative transition-all duration-300 cursor-pointer group flex-1 ${
                    activeTab === "route"
                      ? "text-cyan-400 font-bold scale-105"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  title="Study Sprints & Sinks"
                >
                  <div className="relative">
                    <Zap className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${activeTab === "route" ? "fill-cyan-400/20 text-cyan-400" : "text-slate-400"}`} />
                    {activeTab === "route" && (
                      <motion.span 
                        layoutId="nav-glow-dot"
                        className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]"
                      />
                    )}
                  </div>
                  <span className="text-[9.5px] font-display uppercase tracking-wider mt-1 block">Sprints</span>
                </button>

                {/* Planner (Brain Dump) Tab */}
                <button
                  onClick={() => {
                    playBeepChirp(true);
                    setActiveTab("vault");
                    setBotEmotion("happy");
                    setBotNudge("This is your Brain Dump Planner. Spill any distracting thoughts here to hold them safe for later! 🧠✨");
                  }}
                  className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl relative transition-all duration-300 cursor-pointer group flex-1 ${
                    activeTab === "vault"
                      ? "text-cyan-400 font-bold scale-105"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  title="Brain Dump & Planner"
                >
                  <div className="relative">
                    <Calendar className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${activeTab === "vault" ? "fill-cyan-400/20 text-cyan-400" : "text-slate-400"}`} />
                    {activeTab === "vault" && (
                      <motion.span 
                        layoutId="nav-glow-dot"
                        className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]"
                      />
                    )}
                  </div>
                  <span className="text-[9.5px] font-display uppercase tracking-wider mt-1 block">Planner</span>
                </button>

                {/* Overwatch Camera Tab */}
                <button
                  onClick={() => {
                    playBeepChirp(true);
                    setActiveTab("overwatch");
                    setBotEmotion("vigilant");
                    setBotNudge("Welcome to Overwatch! Grant camera access to let Zolo CV models scan for devices and track study focus! 👁️🤖");
                  }}
                  className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl relative transition-all duration-300 cursor-pointer group flex-1 ${
                    activeTab === "overwatch"
                      ? "text-cyan-400 font-bold scale-105"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  title="Overwatch Camera Compliance"
                >
                  <div className="relative">
                    <Camera className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${activeTab === "overwatch" ? "fill-cyan-400/20 text-cyan-400" : "text-slate-400"}`} />
                    {activeTab === "overwatch" && (
                      <motion.span 
                        layoutId="nav-glow-dot"
                        className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]"
                      />
                    )}
                  </div>
                  <span className="text-[9.5px] font-display uppercase tracking-wider mt-1 block">Overwatch</span>
                </button>

                {/* Settings Tab */}
                <button
                  onClick={() => {
                    playBeepChirp(true);
                    setActiveTab("settings");
                    setBotEmotion("happy");
                    setBotNudge("Welcome to your sanctuary settings! Customize your care preferences and contact circle here. 🌸");
                  }}
                  className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl relative transition-all duration-300 cursor-pointer group flex-1 ${
                    activeTab === "settings"
                      ? "text-cyan-400 font-bold scale-105"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                  title="Sanctuary Settings"
                >
                  <div className="relative">
                    <Settings className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-45 ${activeTab === "settings" ? "fill-cyan-400/20 text-cyan-400" : "text-slate-400"}`} />
                    {activeTab === "settings" && (
                      <motion.span 
                        layoutId="nav-glow-dot"
                        className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-400 rounded-full shadow-[0_0_8px_#22d3ee]"
                      />
                    )}
                  </div>
                  <span className="text-[9.5px] font-display uppercase tracking-wider mt-1 block">Settings</span>
                </button>

              </div>

            </div>

          </div>

        {activeTab === "overwatch" && overwatchTestTrigger && (
          <div className="w-full max-w-xs md:max-w-[300px] bg-gradient-to-b from-[#120d23]/95 to-[#0a0715]/95 border-2 border-purple-900/60 p-5 rounded-[24px] text-center shadow-2xl relative overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-300 shrink-0">
            {/* Ambient top neon accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />
            
            <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest block font-black mb-1">Manual Compliance Simulator</span>
            <h4 className="font-display font-black text-xs text-slate-100 uppercase tracking-wide mb-3">Outside Screen Tester</h4>
            
            <button
              onClick={() => {
                if (overwatchTestTrigger) {
                  overwatchTestTrigger();
                }
              }}
              className="w-full bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-display font-black text-[11px] py-3.5 px-4 rounded-xl uppercase tracking-wider transition-all cursor-pointer shadow-[0_4px_14px_rgba(34,211,238,0.3)] hover:scale-[102%] active:scale-[98%] duration-200"
            >
              👉 Test Tab Switch 👈
            </button>
            
            <p className="text-[10px] text-slate-350 mt-3.5 leading-relaxed font-semibold">
              Winger is watching! Click this button to instantly test compliance alerts, or try switching browser tabs.
            </p>
            
            <div className="pt-3.5 mt-3 border-t border-purple-950/60 text-[9px] font-mono text-slate-400 uppercase tracking-wider font-extrabold flex items-center justify-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#22d3ee]" />
              Winger Sentinel Active
            </div>
          </div>
        )}

      </main>

      {/* 3. Cozy Study Break Check In dialogue modal overlay */}
      <AnimatePresence>
        {isSafetyCheckin && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            className={`fixed bottom-4 right-4 max-w-sm w-88 bg-slate-900 border-2 border-brand-accent p-4 rounded-2xl shadow-2xl z-50 overflow-hidden transition-all duration-300 ${isAgentDragging ? "opacity-0 translate-y-10 pointer-events-none" : "opacity-100 translate-y-0"}`}
          >
            {/* Blinking beacon element */}
            <div className="absolute top-2 right-2 flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </div>

            <h4 className="font-display font-extrabold text-xs text-white uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-emerald-400 shrink-0" /> Cozy Study Check-In
            </h4>
            <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
              Winger noticed you are working diligently. Remember to rest your eyes, take deep breaths, and let go of task pressure!
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleCheckinAck}
                className="flex-1 bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-[10px] font-mono font-bold py-1.5 rounded-lg transition-all cursor-pointer"
              >
                I AM TOTALLY FOCUSING
              </button>
              <button
                onClick={() => {
                  setIsSafetyCheckin(false);
                  setActiveTab("academy");
                  setBotEmotion("happy");
                  setBotNudge("Welcome to Zen Sanctuary! Draw glowing neon paths and play custom cozy ambient soundscapes to rest 🌸");
                }}
                className="bg-purple-950 border border-purple-800 text-purple-300 text-[10px] font-mono px-3 py-1.5 rounded-lg hover:bg-purple-900 transition-all cursor-pointer"
              >
                ZEN SANCTUARY
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 4. Floating Tactical Academy Action Button & Immersive Pop-up Modal */}
      <AnimatePresence>
        {false && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-22 right-4 z-40"
          >
            <button
              onClick={() => {
                setIsAcademyOpen(true);
                playBeepChirp(true);
              }}
              className="group relative flex items-center gap-2 bg-gradient-to-r from-purple-800 to-cyan-500 hover:from-purple-700 hover:to-cyan-400 border border-cyan-400/30 text-white font-display font-black text-[10px] uppercase tracking-wider px-4 py-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.65)] transition-all cursor-pointer hover:scale-105 active:scale-95 duration-200"
              id="academy-fab-trigger"
            >
              <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-purple-500 to-cyan-400 opacity-20 group-hover:opacity-35 animate-pulse" />
              <Sparkles className="w-4 h-4 text-cyan-300" />
              <span>Academy</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {false && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="bg-[#0c0a17] border-2 border-cyan-400/40 rounded-3xl w-full max-w-lg max-h-[85vh] overflow-hidden shadow-2xl flex flex-col relative"
            >
              {/* Header Title Bar */}
              <div className="p-5 border-b border-purple-950 bg-[#120e2e]/60 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
                  <div>
                    <h3 className="font-display font-black text-xs text-white uppercase tracking-widest">Winger Academy</h3>
                    <p className="text-[9px] font-mono uppercase text-[#a855f7] tracking-wider font-semibold">Veo & Nano Banana Intelligence</p>
                  </div>
                </div>
                
                {/* Close Button */}
                <button
                  onClick={() => {
                    setIsAcademyOpen(false);
                    playBeepChirp(false);
                  }}
                  className="text-slate-400 hover:text-white bg-slate-900 border border-purple-900/40 p-1.5 rounded-xl cursor-pointer hover:bg-slate-800 transition-all font-bold active:scale-95 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Main Area Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar text-left">
                
                <p className="text-[10px] text-slate-400 leading-relaxed font-sans border-b border-purple-950/40 pb-3">
                  Ask Winger Tactical Academy for any physical self-defense scenario or technique. Synthesis outputs are simulated with high-contrast joint kinetics clips (Veo) or regional escape vector blueprints (Nano Banana).
                </p>

                {/* Sub-tabs selector for engine types */}
                <div className="flex bg-black/40 p-1 rounded-xl border border-purple-950 max-w-xs mx-auto">
                  <button
                    onClick={() => { setAcademyTab("veo"); playBeepChirp(true); }}
                    className={`flex-1 py-1 px-3 text-[10px] font-display font-bold uppercase rounded-lg transition-all ${
                      academyTab === "veo" ? "bg-purple-900 text-white shadow-md shadow-purple-900/50" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Veo 2D Video
                  </button>
                  <button
                    onClick={() => { setAcademyTab("banana"); playBeepChirp(true); }}
                    className={`flex-1 py-1 px-3 text-[10px] font-display font-bold uppercase rounded-lg transition-all ${
                      academyTab === "banana" ? "bg-purple-900 text-white shadow-md shadow-purple-900/50" : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    Scenario Help
                  </button>
                </div>

                {academyTab === "veo" ? (
                  /* VEO ENGINE MODE */
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-[8px] font-mono text-slate-400 uppercase tracking-widest font-semibold">Type physical self-defense technique</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          className="flex-1 bg-black/60 border border-purple-900/55 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 font-medium focus:outline-none focus:border-cyan-400"
                          placeholder="e.g., Throat Jab, Palm Heel Strike, Bear Hug escape"
                          value={veoTechnique}
                          onChange={(e) => setVeoTechnique(e.target.value)}
                        />
                        <button
                          onClick={() => handleGenerateVeo()}
                          disabled={isGeneratingVeo || !veoTechnique.trim()}
                          className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-900 disabled:text-slate-600 font-display font-black text-[10px] px-3.5 py-2 rounded-xl text-slate-100 transition-all flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          {isGeneratingVeo ? "Synthesizing..." : "Analyze Tech"}
                        </button>
                      </div>
                    </div>

                    {/* Preselected Preset tactics */}
                    <div className="space-y-1">
                      <span className="block text-[8px] font-mono uppercase text-slate-500 tracking-wider">Quick Preset moves to generate:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {["Wrist Grab Lever Break", "Elbow Strike Backward Escape", "Stentorial Boundary Voice Scream"].map((tech) => (
                          <button
                            key={tech}
                            onClick={() => { setVeoTechnique(tech); handleGenerateVeo(tech); }}
                            disabled={isGeneratingVeo}
                            className="bg-purple-950/30 hover:bg-purple-900/55 border border-purple-900/30 px-2 py-1 rounded-lg text-[9px] font-mono text-indigo-300 flex items-center gap-1 cursor-pointer"
                          >
                            🎯 {tech.split(" ")[0]} Tactic
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* VEO VIDEO RENDER DISPLAY */}
                    {veoResult ? (
                      <div className="bg-[#120e2e]/40 border border-purple-950 rounded-2xl p-3.5 space-y-3">
                        <div className="flex justify-between items-center bg-purple-950/30 px-2 py-1 rounded-lg border border-purple-900/20">
                          <span className="font-mono text-[9px] text-cyan-400 uppercase font-black tracking-wider">
                            🎥 VEO ACTIVE RENDER
                          </span>
                          <span className="text-[8px] font-mono text-purple-300">
                            Frame {veoFrameIndex + 1} of 15
                          </span>
                        </div>

                        {/* Animated 2D Stick joints SVG */}
                        <div className="relative aspect-video bg-slate-950 rounded-xl border border-purple-900/30 overflow-hidden flex items-center justify-center">
                          {/* Grid Lines Floor */}
                          <div className="absolute bottom-0 inset-x-0 h-10 bg-[linear-gradient(to_bottom,#2c1b4d_1px,transparent_1px)] bg-[size:10px_6px] opacity-25" />
                          <div className="absolute inset-x-0 bottom-4 border-b border-indigo-950" />
                          
                          {/* Interactive SVG Animation content */}
                          {veoResult.strokeFrames && (
                            <svg viewBox="0 0 320 180" className="w-full h-full z-10">
                              {/* Safety Radius boundary circle */}
                              <circle cx="160" cy="130" r="45" fill="none" stroke="#22d3ee" strokeDasharray="4 4" strokeWidth="1" strokeOpacity="0.25" />
                              
                              {/* Impact Effect animation */}
                              {veoResult.strokeFrames[veoFrameIndex].effectRadius > 0 && (
                                <g>
                                  <circle 
                                    cx={veoResult.strokeFrames[veoFrameIndex].defender.armX} 
                                    cy={veoResult.strokeFrames[veoFrameIndex].defender.armY} 
                                    r={veoResult.strokeFrames[veoFrameIndex].effectRadius} 
                                    fill="radial-gradient" 
                                    className="fill-cyan-500/10 stroke-cyan-400 stroke-2 animate-ping" 
                                  />
                                  <line
                                    x1={veoResult.strokeFrames[veoFrameIndex].defender.armX}
                                    y1={veoResult.strokeFrames[veoFrameIndex].defender.armY}
                                    x2={veoResult.strokeFrames[veoFrameIndex].attacker.x}
                                    y2={veoResult.strokeFrames[veoFrameIndex].attacker.y}
                                    stroke="#f43f5e"
                                    strokeWidth="2"
                                    strokeDasharray="2 2"
                                    className="animate-pulse"
                                  />
                                </g>
                              )}

                              {/* ATTACKER (Red stick figure) */}
                              <g opacity="0.8">
                                {/* Head */}
                                <circle cx={veoResult.strokeFrames[veoFrameIndex].attacker.x} cy="100" r="10" fill="#0f172a" stroke="#ef4444" strokeWidth="3" />
                                <path d={`M ${veoResult.strokeFrames[veoFrameIndex].attacker.x - 3} 95 L ${veoResult.strokeFrames[veoFrameIndex].attacker.x} 92 L ${veoResult.strokeFrames[veoFrameIndex].attacker.x + 3} 95`} stroke="#ef4444" strokeWidth="1.5" fill="none" />
                                {/* Body */}
                                <line x1={veoResult.strokeFrames[veoFrameIndex].attacker.x} y1="110" x2={veoResult.strokeFrames[veoFrameIndex].attacker.x} y2="145" stroke="#ef4444" strokeWidth="3" />
                                {/* Arms */}
                                <line x1={veoResult.strokeFrames[veoFrameIndex].attacker.x} y1="115" x2={veoResult.strokeFrames[veoFrameIndex].attacker.armX} y2={veoResult.strokeFrames[veoFrameIndex].attacker.armY} stroke="#ef4444" strokeWidth="2.5" />
                                {/* Legs */}
                                <line x1={veoResult.strokeFrames[veoFrameIndex].attacker.x} y1="145" x2={veoResult.strokeFrames[veoFrameIndex].attacker.x - 12} y2="168" stroke="#ef4444" strokeWidth="2.5" />
                                <line x1={veoResult.strokeFrames[veoFrameIndex].attacker.x} y1="145" x2={veoResult.strokeFrames[veoFrameIndex].attacker.x + 8} y2="168" stroke="#ef4444" strokeWidth="2.5" />
                                <text x={veoResult.strokeFrames[veoFrameIndex].attacker.x - 22} y="82" fill="#ef4444" fontSize="8" fontFamily="monospace" fontWeight="bold">AGRESSOR</text>
                              </g>

                              {/* DEFENDER (Cyan stick figure) */}
                              <g>
                                {/* Head */}
                                <circle cx={veoResult.strokeFrames[veoFrameIndex].defender.x} cy="100" r="10" fill="#0f172a" stroke="#22d3ee" strokeWidth="3" />
                                <circle cx={veoResult.strokeFrames[veoFrameIndex].defender.x - 3} cy="100" r="1" fill="#22d3ee" />
                                <circle cx={veoResult.strokeFrames[veoFrameIndex].defender.x + 3} cy="100" r="1" fill="#22d3ee" />
                                {/* Body */}
                                <line x1={veoResult.strokeFrames[veoFrameIndex].defender.x} y1="110" x2={veoResult.strokeFrames[veoFrameIndex].defender.x} y2="145" stroke="#22d3ee" strokeWidth="3" />
                                {/* Arms */}
                                <line x1={veoResult.strokeFrames[veoFrameIndex].defender.x} y1="115" x2={veoResult.strokeFrames[veoFrameIndex].defender.armX} y2={veoResult.strokeFrames[veoFrameIndex].defender.armY} stroke="#22d3ee" strokeWidth="2.5" />
                                {/* Legislation reference tag */}
                                {veoFrameIndex > 6 && (
                                  <text x={veoResult.strokeFrames[veoFrameIndex].defender.x + 15} y="112" fill="#10b981" fontSize="6" fontFamily="monospace">65B IPC LOGGED</text>
                                )}
                                {/* Legs */}
                                <line x1={veoResult.strokeFrames[veoFrameIndex].defender.x} y1="145" x2={veoResult.strokeFrames[veoFrameIndex].defender.x - 8} y2="168" stroke="#22d3ee" strokeWidth="2.5" />
                                <line x1={veoResult.strokeFrames[veoFrameIndex].defender.x} y1="145" x2={veoResult.strokeFrames[veoFrameIndex].defender.x + 14} y2="168" stroke="#22d3ee" strokeWidth="2.5" />
                                <text x={veoResult.strokeFrames[veoFrameIndex].defender.x - 18} y="82" fill="#22d3ee" fontSize="8" fontFamily="monospace" fontWeight="bold">CITIZEN</text>
                              </g>
                            </svg>
                          )}

                          {/* Flashing Frame Action label Banner */}
                          <div className="absolute top-2 left-2 bg-black/85 border border-purple-900/50 px-2 py-0.5 rounded text-[8px] font-mono text-[#a855f7] tracking-wider uppercase tracking-tight">
                            {veoResult.strokeFrames[veoFrameIndex].actionLabel}
                          </div>
                        </div>

                        <div className="space-y-2 text-xs text-slate-300">
                          <p className="font-display font-bold text-white text-xs">{veoResult.description}</p>
                          <p className="text-[10px] text-slate-400 italic">Threat Matrix: {veoResult.threatScenario}</p>
                          <p className="text-[10px] text-cyan-300 font-medium font-mono">Core Target: {veoResult.counterMeasureBrief}</p>
                          
                          <div className="border-t border-purple-950/40 pt-2 space-y-1">
                            <span className="block text-[8px] font-mono uppercase text-slate-500 tracking-wider">Tactical Action Steps:</span>
                            {veoResult.steps.map((st: string, i: number) => (
                              <p key={i} className="text-[10.5px] leading-relaxed pl-3 relative text-slate-300">
                                <span className="absolute left-0 text-cyan-400 font-bold">{i + 1}.</span> {st}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 border border-purple-950/30 bg-[#120e2e]/20 rounded-2xl">
                        <p className="text-xs text-slate-500">No technique analyzed yet. Input a move or tap a preset to synthesize the Veo simulation!</p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* NANO BANANA MODE */
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="block text-[8px] font-mono text-slate-400 uppercase tracking-widest font-semibold">Describe cognitive anxiety scenario</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          className="flex-1 bg-black/60 border border-purple-900/55 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-600 font-medium focus:outline-none focus:border-cyan-400"
                          placeholder="e.g., Procrastination freeze, Exam preparation panic"
                          value={bananaScenario}
                          onChange={(e) => setBananaScenario(e.target.value)}
                        />
                        <button
                          onClick={() => handleGenerateBanana()}
                          disabled={isGeneratingBanana || !bananaScenario.trim()}
                          className="bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-900 disabled:text-slate-600 font-display font-black text-[10px] px-3.5 py-2 rounded-xl text-slate-100 transition-all flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          {isGeneratingBanana ? "Synthesizing..." : "Analyze Path"}
                        </button>
                      </div>
                    </div>

                    {/* Preselected Preset scenarios */}
                    <div className="space-y-1">
                      <span className="block text-[8px] font-mono uppercase text-slate-500 tracking-wider">Quick focus blocks to analyze:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {["Procrastination Doom Loop", "Sensory Exhaustion Meltdown", "Midterms Memory Freeze"].map((scen) => (
                          <button
                            key={scen}
                            onClick={() => { setBananaScenario(scen); handleGenerateBanana(scen); }}
                            disabled={isGeneratingBanana}
                            className="bg-purple-950/30 hover:bg-purple-900/55 border border-purple-900/30 px-2 py-1 rounded-lg text-[9px] font-mono text-indigo-300 flex items-center gap-1 cursor-pointer"
                          >
                            🧠 {scen.split(" ")[0]} block
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* BANANA DISPLAY SCREEN */}
                    {bananaResult ? (
                      <div className="bg-[#120e2e]/40 border border-purple-950 rounded-2xl p-3.5 space-y-3">
                        <div className="flex justify-between items-center bg-purple-950/30 px-2 py-1 rounded-lg border border-purple-900/20 col-span-2">
                          <span className="font-mono text-[9px] text-cyan-400 uppercase font-black tracking-wider">
                            🗺️ COGNITIVE ESCAPE VECTOR SPRINT BLUEPRINT
                          </span>
                          <span className="text-[8px] font-mono text-emerald-400 font-semibold text-right">
                            NEURO ZEN ROUTE ENGINE
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <p className="font-display font-bold text-white text-[11.5px]">Primary Blockage: <span className="text-purple-400">{bananaResult.threatInsight}</span></p>
                          <p className="font-sans text-slate-300 leading-relaxed bg-rose-950/25 border border-rose-900/30 p-2.5 rounded-xl text-[10.5px]">
                            👉 <span className="font-semibold text-rose-400 font-mono">Calming Meditation Step:</span> {bananaResult.primaryAction}
                          </p>
                        </div>

                        {/* Generated Spatial Visualizer Schematic Canvas */}
                        <div className="relative aspect-video bg-[#05030a] rounded-xl border border-purple-900/30 overflow-hidden flex flex-col justify-end p-2">
                          {/* Spatial blueprint map SVG element */}
                          <svg viewBox="0 0 320 180" className="absolute inset-0 w-full h-full opacity-40">
                            <line x1="0" y1="90" x2="320" y2="90" stroke="#1e1b4b" strokeWidth="2.5" strokeDasharray="3 3" />
                            <line x1="160" y1="0" x2="160" y2="180" stroke="#1e1b4b" strokeWidth="2.5" strokeDasharray="3 3" />
                            <circle cx="160" cy="90" r="60" fill="none" stroke="#2c2459" strokeWidth="1" strokeDasharray="5 5" />
                          </svg>

                          {/* Map Hotspots representing actual threats & safe zones */}
                          <div className="absolute inset-0 z-20">
                            {bananaResult.hotspots.map((pt: any, index: number) => {
                              const isThreat = pt.name.toLowerCase().includes("threat") || pt.name.toLowerCase().includes("agressor") || pt.name.toLowerCase().includes("stalker");
                              return (
                                <div
                                  key={index}
                                  style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
                                  className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
                                >
                                  {/* Pulse rings */}
                                  <span className={`absolute inline-flex h-4 w-4 rounded-full opacity-75 animate-ping ${
                                    isThreat ? "bg-red-500" : "bg-cyan-500"
                                  }`} />
                                  <div className={`w-3.5 h-3.5 rounded-full border-2 border-slate-950 shadow-md ${
                                    isThreat ? "bg-red-500" : "bg-cyan-400"
                                  }`} />
                                  
                                  {/* Floating text badge */}
                                  <p className="absolute left-4 -top-2 bg-black/90 text-slate-100 border border-purple-900/30 px-1.5 py-0.5 rounded text-[7px] font-mono tracking-tight text-nowrap select-none font-bold">
                                    {pt.name}
                                  </p>
                                </div>
                              );
                            })}
                          </div>

                          {/* AI Thumbnail Generated image if available */}
                          {bananaResult.imageUrl && (
                            <img 
                              src={bananaResult.imageUrl} 
                              alt="Satellite schematic path diagram" 
                              className="absolute inset-0 w-full h-full object-cover z-10 opacity-70 border border-[#0d0a1d]" 
                              referrerPolicy="no-referrer"
                            />
                          )}

                          <div className="z-30 w-full bg-slate-950/95 border border-purple-900/60 p-2 rounded-lg space-y-1">
                            <span className="block text-[7.5px] font-mono text-[#a855f7] tracking-wider uppercase font-bold text-left">Hotspot Mitigation Details:</span>
                            <div className="space-y-1 text-left">
                              {bananaResult.hotspots.map((pt: any, i: number) => (
                                <p key={i} className="text-[9px] text-slate-300 truncate leading-snug">
                                  🔴 <span className="font-bold text-white">{pt.name}:</span> {pt.action}
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 border border-purple-950/30 bg-[#120e2e]/20 rounded-2xl">
                        <p className="text-xs text-slate-500">No tactical scenario blueprint generated yet. Input a concern or tap a preset to compute the safe vectors!</p>
                      </div>
                    )}
                  </div>
                )}

              </div>
              
              {/* Footer status credits */}
              <div className="p-3 bg-black/50 border-t border-purple-950/60 text-center select-none text-[8px] font-mono text-slate-500 flex justify-between px-5">
                <span>Joint Defense Algorithm 2.1</span>
                <span>Active Lucknow Grid GPS</span>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
