import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Play, Pause, RotateCcw, Plus, Trash2, CheckCircle2, Circle, 
  Sparkles, Brain, Clock, Coffee, Flame, ListTodo, ChevronRight
} from "lucide-react";

interface Step {
  text: string;
  done: boolean;
}

interface Task {
  id: string;
  title: string;
  minutes: number;
  completed: boolean;
  steps: Step[];
  dueDate?: string;
  category?: string;
  isHighImpact?: boolean;
}

interface PrioritizationRec {
  taskId: string;
  taskTitle: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  timeReasoning: string;
  actionBrief: string;
  energyHack: string;
}

interface PrioritizationResult {
  recommendations: PrioritizationRec[];
  autonomousAction: string;
}

interface SafeRouteProps {
  onNudgeChange: (nudgeText: string) => void;
  botStatus: (status: "happy" | "vigilant" | "alert" | "thinking" | "listening" | "speaking") => void;
  overrideDestination?: string; 
  onClearOverride?: () => void;
}

export default function SafeRoute({ onNudgeChange, botStatus }: SafeRouteProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string>("");
  const [streakCount, setStreakCount] = useState<number>(3);
  
  // Timer States
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60);
  const [timerMax, setTimerMax] = useState<number>(25 * 60);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [timerMode, setTimerMode] = useState<"focus" | "break">("focus");
  
  // New simplified Task Creation fields
  const [newTaskTitle, setNewTaskTitle] = useState<string>("");
  const [newTaskMinutes, setNewTaskMinutes] = useState<number>(25);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [isBreakingDown, setIsBreakingDown] = useState<string | null>(null);

  // AI Priorities list
  const [isPrioritizing, setIsPrioritizing] = useState<boolean>(false);
  const [prioritizedOrder, setPrioritizedOrder] = useState<string[]>([]);
  const [priorityMap, setPriorityMap] = useState<Record<string, { priority: string; actionBrief: string }>>({});

  // Fetch tasks from express database on load
  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      const list = await res.json();
      setTasks(list);
      
      // Auto-select first active task as active sprint target if none selected
      const firstActive = list.find((t: Task) => !t.completed);
      if (firstActive && !activeTaskId) {
        setActiveTaskId(firstActive.id);
        setTimeLeft(firstActive.minutes * 60);
        setTimerMax(firstActive.minutes * 60);
      }
    } catch (e) {
      console.warn("Failed to retrieve database tasks:", e);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const added: Task = {
      id: "task_" + Math.random().toString(36).substring(2, 9),
      title: newTaskTitle.trim(),
      minutes: Number(newTaskMinutes) || 25,
      completed: false,
      steps: [],
      dueDate: new Date(Date.now() + 1000 * 60 * 60 * 3).toISOString(), // due in 3 hours
      category: "assignment",
      isHighImpact: false
    };

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(added)
      });
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks);
        setActiveTaskId(added.id);
        setTimeLeft(added.minutes * 60);
        setTimerMax(added.minutes * 60);
        setNewTaskTitle("");
        setIsAdding(false);
        
        onNudgeChange(`Quest created! "${added.title}" locked in. Ready to sprint? 🚀`);
        botStatus("happy");
        triggerAudioChirp();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks);
        if (activeTaskId === id) {
          const nextActive = data.tasks.find((t: Task) => !t.completed) || data.tasks[0];
          if (nextActive) {
            setActiveTaskId(nextActive.id);
            setTimeLeft(nextActive.minutes * 60);
            setTimerMax(nextActive.minutes * 60);
          } else {
            setActiveTaskId("");
            setTimeLeft(25 * 60);
            setTimerMax(25 * 60);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Checkbox step toggling
  const handleToggleStep = async (taskId: string, stepIndex: number) => {
    const taskIdx = tasks.findIndex(t => t.id === taskId);
    if (taskIdx === -1) return;

    const updatedTask = { ...tasks[taskIdx] };
    const step = { ...updatedTask.steps[stepIndex] };
    step.done = !step.done;
    updatedTask.steps[stepIndex] = step;

    // Check if entire task is finished
    const allDone = updatedTask.steps.every(s => s.done);
    updatedTask.completed = allDone;

    triggerAudioBeepClick();

    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedTask)
      });
      const data = await res.json();
      if (data.success) {
        setTasks(data.tasks);
        if (step.done) {
          onNudgeChange(`Sub-step completed! Dopamine charging... ⭐`);
          botStatus("happy");
          // Increment streak on task completion
          if (allDone) {
            setStreakCount(prev => prev + 1);
            onNudgeChange(`🎉 Quest complete! Daily Streak increased! 🏆`);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  // AI Breakdown for task
  const handleDemystifyTask = async (task: Task) => {
    setIsBreakingDown(task.id);
    botStatus("thinking");
    onNudgeChange(`Splitting "${task.title}" into bite-sized 5-min steps... 🔮`);

    try {
      const res = await fetch("/api/tasks/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: task.title })
      });
      const data = await res.json();
      if (data.steps) {
        const updated = { ...task, steps: data.steps };
        const saveRes = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updated)
        });
        const saveData = await saveRes.json();
        if (saveData.success) {
          setTasks(saveData.tasks);
          onNudgeChange(`Task split! 4 sensory-friendly micro-steps generated. ✨`);
          botStatus("happy");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsBreakingDown(null);
    }
  };

  // AI Prioritize List
  const handleActivatePrioritizer = async () => {
    setIsPrioritizing(true);
    botStatus("thinking");
    onNudgeChange("Winger is calculating priority scores and re-ordering your queue... 🛡️🔮");

    try {
      const res = await fetch("/api/tasks/prioritize", { method: "POST" });
      const data: PrioritizationResult = await res.json();
      
      if (data.recommendations && data.recommendations.length > 0) {
        // Create order ranking
        const order = data.recommendations.map(r => r.taskId);
        setPrioritizedOrder(order);

        // Map helper data
        const map: Record<string, { priority: string; actionBrief: string }> = {};
        data.recommendations.forEach(r => {
          map[r.taskId] = {
            priority: r.priority,
            actionBrief: r.actionBrief
          };
        });
        setPriorityMap(map);

        onNudgeChange("Tasks prioritized by urgency. Highest-impact anchor sorted to the top! 🧘");
        botStatus("happy");
        triggerAudioChirp();
      }
    } catch (e) {
      console.error("Prioritizer failed:", e);
      onNudgeChange("Unable to run priority shield. Fallback to default sorting.");
    } finally {
      setIsPrioritizing(false);
    }
  };

  // Sort tasks: Prioritized ones first, then incomplete, then completed
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    
    // Use prioritized order if available
    if (prioritizedOrder.length > 0) {
      const idxA = prioritizedOrder.indexOf(a.id);
      const idxB = prioritizedOrder.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
    }
    
    return 0;
  });

  // Timer Clock Mechanism
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (isTimerRunning && timeLeft === 0) {
      handleTimerComplete();
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  const handleTimerComplete = () => {
    setIsTimerRunning(false);
    triggerAudioChirp();
    if (timerMode === "focus") {
      setTimerMode("break");
      setTimeLeft(5 * 60);
      setTimerMax(5 * 60);
      onNudgeChange("Focus interval complete! Sweet 5-min break starts now. 🧸☕");
      botStatus("happy");
    } else {
      setTimerMode("focus");
      const active = tasks.find(t => t.id === activeTaskId);
      const m = active ? active.minutes : 25;
      setTimeLeft(m * 60);
      setTimerMax(m * 60);
      onNudgeChange("Break is over. Let's slide back into your focus wave. 🔋");
      botStatus("vigilant");
    }
  };

  const handleSelectTask = (task: Task) => {
    setActiveTaskId(task.id);
    if (!isTimerRunning) {
      setTimeLeft(task.minutes * 60);
      setTimerMax(task.minutes * 60);
      setTimerMode("focus");
    }
  };

  // Audio synthesis feedback
  const triggerAudioBeepClick = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1800, audioCtx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.06);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) {
      console.warn("Touch sound blocked", e);
    }
  };

  const triggerAudioChirp = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = "triangle";
      osc.frequency.setValueAtTime(400, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.45);
    } catch (e) {
      console.warn("Chirp blocked", e);
    }
  };

  const activeTask = tasks.find(t => t.id === activeTaskId);
  const minutesLabel = Math.floor(timeLeft / 60);
  const secondsLabel = timeLeft % 60;
  const progressRatio = timerMax > 0 ? (timeLeft / timerMax) : 0;
  const strokeDashoffset = progressRatio * 283;

  return (
    <div className="flex flex-col h-full overflow-y-auto pb-10 custom-scrollbar text-slate-100" id="study_sprints_main_view">
      
      {/* SIMPLE HEADER */}
      <div className="flex items-center justify-between border-b border-purple-950/40 pb-3 mb-4 shrink-0">
        <div>
          <span className="text-[9px] font-mono text-cyan-400 uppercase tracking-widest block font-bold mb-0.5">Focus Room</span>
          <h3 className="font-display font-black text-sm text-slate-100 uppercase tracking-wider">STUDY SPRINTS</h3>
        </div>
        <div className="flex items-center gap-1.5 bg-purple-950/40 border border-purple-900/30 px-2.5 py-0.5 rounded-full">
          <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse fill-amber-400/10" />
          <span className="text-[10px] font-mono text-amber-300 font-bold">{streakCount}x Streak</span>
        </div>
      </div>

      {/* COMPACT CLOCK PANEL */}
      <div className="bg-[#141220] border border-purple-950/60 rounded-2xl p-5 mb-5 flex flex-col items-center justify-center relative shadow-lg shadow-black/30">
        <div className="relative w-36 h-36 flex items-center justify-center mb-3">
          {/* Circular Progress */}
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              className="stroke-purple-950/30 fill-none"
              strokeWidth="4"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              className={`fill-none transition-all duration-300 ${
                timerMode === "focus" ? "stroke-cyan-400" : "stroke-amber-400"
              }`}
              strokeWidth="4"
              strokeDasharray="283"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>

          {/* Clock digits */}
          <div className="absolute flex flex-col items-center justify-center select-none">
            <span className="text-3xl font-mono font-medium tracking-tight text-white leading-none">
              {String(minutesLabel).padStart(2, "0")}:{String(secondsLabel).padStart(2, "0")}
            </span>
            <span className="text-[8px] font-mono uppercase tracking-widest text-slate-400 mt-1 flex items-center gap-0.5">
              {timerMode === "focus" ? (
                <>
                  <Brain className="w-2.5 h-2.5 text-cyan-400" /> Focus Mode
                </>
              ) : (
                <>
                  <Coffee className="w-2.5 h-2.5 text-amber-400" /> Break Mode
                </>
              )}
            </span>
          </div>
        </div>

        {/* Selected target indicator */}
        <div className="text-center mb-4 w-full px-2">
          <span className="text-[8.5px] font-mono text-slate-500 block mb-0.5">Focusing On:</span>
          <p className="text-xs font-semibold text-slate-200 line-clamp-1 bg-black/25 px-2.5 py-1 rounded-lg border border-purple-950/40">
            {activeTask ? activeTask.title : "Select or create a study quest below!"}
          </p>
        </div>

        {/* Timer Control row */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setIsTimerRunning(!isTimerRunning);
              botStatus(isTimerRunning ? "happy" : "vigilant");
              triggerAudioBeepClick();
              onNudgeChange(isTimerRunning ? "Sprinting paused. Deep breath!" : "Sprint started! Lock in focus. 🛡️");
            }}
            className={`cursor-pointer px-4 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-bold transition-all duration-200 active:scale-95 ${
              isTimerRunning 
                ? "bg-rose-950/60 text-rose-300 border border-rose-900/60 hover:bg-rose-900/40" 
                : "bg-cyan-950/60 text-cyan-300 border border-cyan-900/60 hover:bg-cyan-900/40"
            }`}
          >
            {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {isTimerRunning ? "Pause" : "Start Sprint"}
          </button>

          <button
            onClick={() => {
              setIsTimerRunning(false);
              const m = activeTask ? activeTask.minutes : 25;
              setTimeLeft(m * 60);
              setTimerMax(m * 60);
              setTimerMode("focus");
              triggerAudioBeepClick();
              onNudgeChange("Sprint clock reset.");
              botStatus("happy");
            }}
            className="cursor-pointer p-1.5 rounded-xl bg-purple-950/40 border border-purple-900/30 text-slate-400 hover:text-white transition-all text-xs"
            title="Reset Timer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* TASKS CONTAINER */}
      <div className="space-y-3">
        {/* ACTION ROW */}
        <div className="flex items-center justify-between border-b border-purple-950/20 pb-2">
          <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider font-bold flex items-center gap-1">
            <ListTodo className="w-3.5 h-3.5 text-cyan-400" /> Active Quests
          </span>

          <div className="flex items-center gap-2">
            {/* AI prioritizer button */}
            <button
              onClick={handleActivatePrioritizer}
              disabled={isPrioritizing || tasks.filter(t => !t.completed).length === 0}
              className="cursor-pointer text-[9.5px] font-mono text-amber-300 border border-amber-900/40 bg-amber-950/20 hover:bg-amber-950/40 disabled:opacity-40 px-2 py-0.5 rounded-lg flex items-center gap-1 uppercase tracking-wide transition-all"
            >
              <Sparkles className="w-2.5 h-2.5 text-amber-300 animate-pulse" />
              {isPrioritizing ? "Sorting..." : "AI Prioritize"}
            </button>

            <button
              onClick={() => setIsAdding(!isAdding)}
              className="cursor-pointer text-[9.5px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 uppercase tracking-wide font-bold"
            >
              <Plus className="w-2.5 h-2.5" />
              {isAdding ? "Collapse" : "Add Quest"}
            </button>
          </div>
        </div>

        {/* COMPACT TASK INPUT FORM */}
        <AnimatePresence>
          {isAdding && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAddTask}
              className="bg-[#12101e] border border-cyan-950/50 rounded-xl p-3 space-y-2.5 overflow-hidden"
            >
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="What is your focus target? (e.g., Chemistry diagram)"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="flex-1 bg-[#07050f] border border-purple-950 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-cyan-500/50 text-slate-100"
                />
                
                <select
                  value={newTaskMinutes}
                  onChange={(e) => setNewTaskMinutes(Number(e.target.value))}
                  className="bg-[#07050f] border border-purple-950 text-xs rounded-lg px-1 py-1.5 focus:outline-none text-slate-100 text-center w-20"
                >
                  <option value={10}>10 Min</option>
                  <option value={20}>20 Min</option>
                  <option value={25}>25 Min</option>
                  <option value={40}>40 Min</option>
                </select>
              </div>

              <button
                type="submit"
                className="cursor-pointer w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs py-1.5 rounded-lg active:scale-95 transition-all flex items-center justify-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add focus quest
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* LIST OF QUESTS */}
        <div className="space-y-2">
          {sortedTasks.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-[10.5px] bg-[#0b0a14] rounded-2xl border border-purple-950/10">
              No active focus quests. Add one above!
            </div>
          ) : (
            sortedTasks.map((task) => {
              const isActive = task.id === activeTaskId;
              const hasSteps = task.steps && task.steps.length > 0;
              const stepProgress = hasSteps 
                ? `${task.steps.filter(s => s.done).length}/${task.steps.length}` 
                : "";
              
              const priorityData = priorityMap[task.id];

              return (
                <div
                  key={task.id}
                  className={`border rounded-xl transition-all p-3 space-y-2 ${
                    isActive 
                      ? "bg-[#161426] border-cyan-800/60 shadow" 
                      : "bg-[#0d0b16] border-purple-950/30 hover:bg-[#110f20]"
                  } ${task.completed ? "opacity-60" : ""}`}
                >
                  {/* Title & Click-to-focus layer */}
                  <div className="flex items-center justify-between gap-1.5">
                    <button
                      onClick={() => handleSelectTask(task)}
                      className="text-left flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5">
                        <Clock className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-cyan-400" : "text-purple-400/80"}`} />
                        <span className={`text-xs font-bold leading-snug text-slate-200 ${task.completed ? "line-through text-slate-500" : ""}`}>
                          {task.title}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 font-normal">({task.minutes}m)</span>
                      </div>

                      {/* Display prioritized tip inline if calculated */}
                      {priorityData && !task.completed && (
                        <div className="text-[9px] font-mono text-amber-400 flex items-center gap-0.5 mt-0.5">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>{priorityData.priority}: {priorityData.actionBrief}</span>
                        </div>
                      )}
                    </button>

                    {/* Compact actions button block */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* AI split button */}
                      {!hasSteps && !task.completed && (
                        <button
                          type="button"
                          disabled={isBreakingDown === task.id}
                          onClick={() => handleDemystifyTask(task)}
                          className="cursor-pointer bg-purple-950 hover:bg-purple-900 border border-purple-900/30 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded text-purple-300 disabled:opacity-50"
                          title="Generate study steps"
                        >
                          {isBreakingDown === task.id ? "Working..." : "Split Steps (AI)"}
                        </button>
                      )}

                      {/* Steps ratio label */}
                      {hasSteps && (
                        <span className="text-[9px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-900/30 px-1 py-0.5 rounded-md">
                          {stepProgress}
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => handleDeleteTask(task.id)}
                        className="cursor-pointer text-slate-600 hover:text-red-400 p-0.5"
                        title="Delete Quest"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Tick list sub-steps (renders if split steps exist) */}
                  {hasSteps && (
                    <div className="space-y-1 pt-2 border-t border-purple-950/30">
                      {task.steps.map((step, idx) => (
                        <div 
                          key={idx}
                          onClick={() => handleToggleStep(task.id, idx)}
                          className="flex items-start gap-1.5 text-[11px] p-1 rounded-lg hover:bg-black/10 cursor-pointer transition-colors"
                        >
                          <button
                            type="button"
                            className="shrink-0 mt-0.5 focus:outline-none"
                          >
                            {step.done ? (
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 fill-emerald-400/10" />
                            ) : (
                              <Circle className="w-3 h-3 text-slate-600" />
                            )}
                          </button>
                          <span className={`leading-tight ${step.done ? "line-through text-slate-500 font-light" : "text-slate-300"}`}>
                            {step.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
