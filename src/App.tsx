import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, Plus, Trash2, CheckSquare, Square, Flame, Zap, Award, 
  BookOpen, Terminal, Clock, ShieldAlert, CheckCircle2, RefreshCw, 
  Play, MessageSquare, PlusCircle, HelpCircle, Dumbbell, Trophy,
  Mic, MicOff, Disc, Volume2, Music, Radio, Sliders, AlertTriangle, 
  Activity, ArrowRight, PlayCircle, Star
} from "lucide-react";
import Onboarding from "./components/Onboarding";
import Login from "./components/Login";
import ResilienceMeter from "./components/ResilienceMeter";
import AudioVisualizer from "./components/AudioVisualizer";
import { Task, SubTask, BlockerAnalysis, UserProfile, BlockerCategory, BeatTimelineSegment, CoachMode } from "./types";
import { playProgressSound, playHappyRemixBeat, playDeadlineWarningChime } from "./utils/synth";

// Dynamic rhythm quotes
const CHAMP_QUOTES = [
  "Lay down the bassline, Champ! A single micro-beat beats a silent track.",
  "Your code compilation is off-tempo. Let's isolate the glitch and turn up the BPM!",
  "When the pressure rises, drop the backup track. Perfection is a slow tempo!",
  "No static hum allowed. Tap the microphone, narrate your next step, and start the playback!",
  "Put your phone on silent. Drop the needle on your focus session right now!"
];

const LOADING_STEPS = [
  "Champ is setting the master BPM...",
  "Tuning the frequency of your current roadblock...",
  "Isolating the root cause (no generic advice in this mix!)...",
  "Synthesizing Plan A, B, and C backups...",
  "Pumping high-adrenaline rhythm into the deck..."
];

function parseAutomaticTimes(title: string, description: string, index: number): { reminderTime: string; deadlineTime: string } {
  const fullText = `${title} ${description}`.toLowerCase();
  
  // Regex to capture times like "at 7", "study at 9", "7:00", "09:00", "7 pm", "9:30"
  const timeRegex = /(?:at\s+|@\s*)\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b|\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/gi;
  
  let match;
  let parsedHour: number | null = null;
  let parsedMinute: number = 0;

  while ((match = timeRegex.exec(fullText)) !== null) {
    const hourGroup = match[1] || match[4];
    const minuteGroup = match[2] || match[5];
    const amPmGroup = match[3] || match[6];

    if (hourGroup) {
      let h = parseInt(hourGroup, 10);
      let m = minuteGroup ? parseInt(minuteGroup, 10) : 0;
      
      if (amPmGroup) {
        const ampm = amPmGroup.toLowerCase();
        if (ampm === "pm" && h < 12) h += 12;
        if (ampm === "am" && h === 12) h = 0;
      } else {
        // If no AM/PM, let's smart-guess PM for evening routines if hour is typical (1-11)
        if (h < 12) {
          if (h >= 1 && h <= 6) {
            h += 12; // 2 -> 14, 5 -> 17
          } else if (h >= 7 && h <= 11) {
            // Check current hour, if current hour is past morning, assume evening/PM
            const currentHour = new Date().getHours();
            if (currentHour > h) {
              h += 12;
            }
          }
        }
      }
      parsedHour = h;
      parsedMinute = m;
      break;
    }
  }

  const formatTimeStr = (h: number, m: number) => {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  if (parsedHour !== null) {
    let remMin = parsedMinute - 5;
    let remHour = parsedHour;
    if (remMin < 0) {
      remMin += 60;
      remHour = (remHour - 1 + 24) % 24;
    }
    return {
      reminderTime: formatTimeStr(remHour, remMin),
      deadlineTime: formatTimeStr(parsedHour, parsedMinute)
    };
  }

  // Fallback defaults relative to now
  const now = new Date();
  const alertOffsetMinutes = index === 0 ? 1 : index === 1 ? 3 : index === 2 ? 5 : (index + 1) * 3;
  const deadlineOffsetMinutes = index === 0 ? 3 : index === 1 ? 8 : index === 2 ? 15 : (index + 1) * 5;

  const remTime = new Date(now.getTime() + alertOffsetMinutes * 60000);
  const deadTime = new Date(now.getTime() + deadlineOffsetMinutes * 60000);

  return {
    reminderTime: formatTimeStr(remTime.getHours(), remTime.getMinutes()),
    deadlineTime: formatTimeStr(deadTime.getHours(), deadTime.getMinutes())
  };
}

export default function App() {
  // --- States ---
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("beatup_logged_in") === "true";
  });

  const [userEmail, setUserEmail] = useState<string>(() => {
    return localStorage.getItem("beatup_user_email") || "";
  });

  const [coachMode, setCoachMode] = useState<CoachMode>(() => {
    return (localStorage.getItem("beatup_coach_mode") as CoachMode) || "champ";
  });

  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    return localStorage.getItem("beatup_onboarded") === "true";
  });

  // Slide state: "consultation" (First) | "mixer" (Mixer Metrics) | "timeline" (Beat Timeline)
  const [activeSlide, setActiveSlide] = useState<"consultation" | "mixer" | "timeline">("consultation");

  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem("beatup_profile");
    if (saved) {
      try { 
        const parsed = JSON.parse(saved);
        if (parsed.totalBeatsConquered === undefined) parsed.totalBeatsConquered = 0;
        return parsed; 
      } catch (e) {}
    }
    return {
      xp: 0,
      level: 1,
      streak: 1,
      lastActiveDate: new Date().toDateString(),
      energy: 85,
      totalBeatsConquered: 2
    };
  });

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("beatup_tasks");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [
      {
        id: "sample-1",
        title: "Isolate your current toughest function",
        description: "Write exactly 3 comments in plain English describing what it does before looking at syntax.",
        category: "coding",
        timelineSegment: "afternoon",
        isCompleted: false,
        isAiGenerated: true,
        tempoBpm: 90,
        reminder: "Champ says: Do not code yet! Write comments first. That's the real sparring strategy.",
        subtasks: [
          { id: "s-1-1", title: "Write down 3 comments in English", isCompleted: false },
          { id: "s-1-2", title: "Console log input parameters", isCompleted: false }
        ],
        createdAt: new Date().toISOString()
      },
      {
        id: "sample-2",
        title: "Micro-dose reading of chapter slides",
        description: "Review exactly 3 core topics and draft an active recall question for each.",
        category: "study",
        timelineSegment: "morning",
        isCompleted: false,
        isAiGenerated: true,
        tempoBpm: 75,
        reminder: "Champ says: Active testing beats passive reading. Speak your answers out loud!",
        subtasks: [
          { id: "s-2-1", title: "Scribble down 3 quiz questions", isCompleted: false },
          { id: "s-2-2", title: "Perform a 5-minute self test", isCompleted: false }
        ],
        createdAt: new Date().toISOString()
      }
    ];
  });

  const [lastAnalysis, setLastAnalysis] = useState<BlockerAnalysis | null>(() => {
    const saved = localStorage.getItem("beatup_last_analysis");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    // Return a default rhythmic analysis if empty so they immediately see the Plan A, B, C interface!
    return {
      id: "initial-analysis",
      timestamp: "Fresh Session",
      problemDescription: "Getting started with high focus and setting up my timeline beats.",
      category: "blocker",
      rootCause: "Starting resistance keeping productivity momentum at a low frequency.",
      aiCoachResponse: "Welcome to Beat Up! Let's get your daily track list dialed in. Tap the mic or type your exact blocker below and let's craft an elite backup strategy!",
      solutionTitle: "The 5-Minute Rhythm Warmup",
      solutionSteps: [
        "Select your main track (Plan A) and focus with zero notifications for 15 minutes.",
        "If you get interrupted, transition immediately to Plan B (The Halftime Remix).",
        "If everything falls apart, drop into Plan C (The Bass Drop) to complete just 1 micro-task."
      ],
      suggestedTasks: [],
      tempoBpm: 85,
      riskOfFailure: "medium",
      failurePredictionMessage: "Potential threat of focus drift due to fuzzy priorities if deadlines are unstructured.",
      planA: "Maintain a rigorous, single-task work sprint for 25 continuous minutes.",
      planB: "Halftime speed: split work into 10-minute micro-sprints and take a movement break.",
      planC: "Drop non-essentials. Just write 1 single line of pseudo-code or outline draft before shut down."
    };
  });

  // UI Flow States
  const [problemText, setProblemText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStepIdx, setLoadingStepIdx] = useState(0);
  const [timeGreeting, setTimeGreeting] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [congratsTaskTitle, setCongratsTaskTitle] = useState<string | null>(null);

  // Custom Confirmation & Automatic Reminders
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [currentTimeStr, setCurrentTimeStr] = useState(() => {
    const d = new Date();
    return d.toTimeString().substring(0, 5); // "HH:MM"
  });
  const [activeAlert, setActiveAlert] = useState<string | null>(null);
  const [lastChimedTime, setLastChimedTime] = useState("");

  // Active Filter for Timeline Beats
  const [activeSegmentFilter, setActiveSegmentFilter] = useState<"all" | BeatTimelineSegment>("all");

  // Dynamic audio voice input state
  const [isDictatingInput, setIsDictatingInput] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  // Fallback Selector State
  const [selectedPlanTier, setSelectedPlanTier] = useState<"A" | "B" | "C">("A");

  // Custom Task inputs
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newCategory, setNewCategory] = useState<BlockerCategory>("general");
  const [newSegment, setNewSegment] = useState<BeatTimelineSegment>("anytime");
  const [newBpm, setNewBpm] = useState<number>(90);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newSubtaskInputs, setNewSubtaskInputs] = useState<string[]>(["", ""]);

  // --- Effects ---
  useEffect(() => {
    localStorage.setItem("beatup_onboarded", String(isOnboarded));
  }, [isOnboarded]);

  useEffect(() => {
    localStorage.setItem("beatup_profile", JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem("beatup_tasks", JSON.stringify(tasks));
  }, [tasks]);

  // Real-time Automatic Deadline Alarm Checking (Pulsing notification + Melodic Chime)
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const timeStr = now.toTimeString().substring(0, 5); // "HH:MM"
      setCurrentTimeStr(timeStr);

      tasks.forEach(task => {
        if (!task.isCompleted) {
          const isAlarmTime = task.reminderTime === timeStr || task.deadlineTime === timeStr;
          if (isAlarmTime && lastChimedTime !== `${task.id}-${timeStr}`) {
            setLastChimedTime(`${task.id}-${timeStr}`);
            playDeadlineWarningChime();
            setActiveAlert(`⏰ TIMELINE ALERT: "${task.title}" has hit its scheduled milestone target of ${timeStr}! Let's hit the deck and conquer it!`);
            
            // Dismiss automatically after 8 seconds
            setTimeout(() => {
              setActiveAlert(null);
            }, 8000);
          }
        }
      });
    }, 5000);

    return () => clearInterval(timer);
  }, [tasks, lastChimedTime]);

  useEffect(() => {
    if (lastAnalysis) {
      localStorage.setItem("beatup_last_analysis", JSON.stringify(lastAnalysis));
    }
  }, [lastAnalysis]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeGreeting("Good Morning");
    else if (hour < 17) setTimeGreeting("Good Afternoon");
    else setTimeGreeting("Good Evening");

    if (typeof window !== "undefined") {
      const Speech = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (Speech) setSpeechSupported(true);
    }
  }, []);

  // Sync Streak daily
  useEffect(() => {
    const todayStr = new Date().toDateString();
    if (profile.lastActiveDate && profile.lastActiveDate !== todayStr) {
      const lastActive = new Date(profile.lastActiveDate);
      const diffTime = Math.abs(new Date(todayStr).getTime() - lastActive.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      setProfile(prev => {
        let newStreak = prev.streak;
        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          newStreak = 1; 
        }
        return {
          ...prev,
          streak: newStreak,
          lastActiveDate: todayStr,
          energy: Math.min(prev.energy + 20, 100)
        };
      });
    }
  }, []);

  // Loading Screen loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAnalyzing) {
      setLoadingStepIdx(0);
      interval = setInterval(() => {
        setLoadingStepIdx(prev => (prev + 1) % LOADING_STEPS.length);
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [isAnalyzing]);

  // Voice Narration Logic
  const startVoiceDictation = () => {
    const Speech = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Speech) return;

    const rec = new Speech();
    rec.continuous = false;
    rec.lang = "en-US";
    rec.interimResults = false;

    rec.onstart = () => {
      setIsDictatingInput(true);
    };

    rec.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setProblemText(prev => prev ? prev + " " + text : text);
    };

    rec.onerror = (err: any) => {
      console.error(err);
      setIsDictatingInput(false);
    };

    rec.onend = () => {
      setIsDictatingInput(false);
    };

    rec.start();
  };

  const handleLoginSuccess = (email: string) => {
    setIsLoggedIn(true);
    setUserEmail(email);
    localStorage.setItem("beatup_logged_in", "true");
    localStorage.setItem("beatup_user_email", email);
  };

  const handleOnboardingComplete = async (firstProblem: string) => {
    setIsOnboarded(true);
    await analyzeProblem(firstProblem);
  };

  const analyzeProblem = async (problemStr: string) => {
    if (!problemStr.trim()) return;
    setIsAnalyzing(true);
    setErrorMsg(null);

    try {
      const response = await fetch("/api/analyze-blocker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          problemDescription: problemStr,
          currentTasks: tasks.map(t => t.title),
          coachMode: coachMode
        })
      });

      if (!response.ok) {
        throw new Error("Failed to consult Champ. Please try again.");
      }

      const result: BlockerAnalysis = await response.json();
      
      setLastAnalysis({
        ...result,
        id: Date.now().toString(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        problemDescription: problemStr
      });

      // Insert tasks
      const newlySuggested: Task[] = result.suggestedTasks.map((st, idx) => {
        const times = parseAutomaticTimes(st.title, st.description, idx);
        return {
          id: `ai-task-${Date.now()}-${idx}`,
          title: st.title,
          description: st.description,
          category: result.category,
          timelineSegment: st.timelineSegment || "anytime",
          isCompleted: false,
          isAiGenerated: true,
          tempoBpm: result.tempoBpm || 90,
          reminder: coachMode === "friend"
            ? "Buddy says: Don't feel any pressure at all, buddy. One tiny little step at a time! We're in this together."
            : coachMode === "pro"
            ? `Pro Advisor says: Task milestone: "${st.title}" injected. Verify execution accuracy.`
            : `Champ says: Drop the beat on this ${result.category} drill. Don't let the tempo slip!`,
          subtasks: st.subtasks.map((sub, sIdx) => ({
            id: `ai-sub-${Date.now()}-${idx}-${sIdx}`,
            title: sub,
            isCompleted: false
          })),
          createdAt: new Date().toISOString(),
          reminderTime: times.reminderTime,
          deadlineTime: times.deadlineTime
        };
      });

      setTasks(prev => [ ...newlySuggested, ...prev ]);
      setProblemText("");

      addXp(30);
      setProfile(prev => ({
        ...prev,
        energy: Math.min(prev.energy + 15, 100)
      }));

      // Automatically focus on Beat Timeline tab when new tasks are added
      setActiveSlide("timeline");

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Champ's mixer is busy. Let's try once more!");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const addXp = (amount: number) => {
    setProfile(prev => {
      const newXp = prev.xp + amount;
      const calculatedLevel = Math.floor(newXp / 200) + 1;
      const leveledUp = calculatedLevel > prev.level;
      
      return {
        ...prev,
        xp: newXp,
        level: calculatedLevel,
        energy: Math.min(prev.energy + (leveledUp ? 35 : 0), 100)
      };
    });
  };

  const toggleSubtask = (taskId: string, subtaskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id !== taskId) return task;

      let completedCount = 0;
      const updatedSubtasks = task.subtasks.map(sub => {
        const isCurrent = sub.id === subtaskId;
        const nextState = isCurrent ? !sub.isCompleted : sub.isCompleted;
        if (nextState) completedCount++;
        
        if (isCurrent) {
          if (nextState) {
            addXp(15);
            setProfile(p => ({ ...p, energy: Math.min(p.energy + 10, 100) }));
          } else {
            setProfile(p => ({ ...p, energy: Math.max(p.energy - 10, 0) }));
          }
        }

        return { ...sub, isCompleted: nextState };
      });

      const totalCount = task.subtasks.length;
      const progressRatio = totalCount > 0 ? completedCount / totalCount : 1;

      // Play chime corresponding to the current task execution progress done!
      playProgressSound(progressRatio);

      const allCompleted = updatedSubtasks.every(s => s.isCompleted);

      // If completing the entire task
      if (allCompleted && !task.isCompleted) {
        setProfile(p => ({ 
          ...p, 
          totalBeatsConquered: p.totalBeatsConquered + 1 
        }));
        // Play full happy beat flowing with happiness and trigger congratulations!
        setTimeout(() => {
          playHappyRemixBeat();
          setCongratsTaskTitle(task.title);
        }, 150);
      }

      return {
        ...task,
        subtasks: updatedSubtasks,
        isCompleted: allCompleted
      };
    }));
  };

  const toggleMainTask = (taskId: string) => {
    setTasks(prev => prev.map(task => {
      if (task.id !== taskId) return task;

      const nextCompleted = !task.isCompleted;
      const updatedSubtasks = task.subtasks.map(sub => ({
        ...sub,
        isCompleted: nextCompleted ? true : sub.isCompleted
      }));

      if (nextCompleted) {
        addXp(30);
        setProfile(p => ({ 
          ...p, 
          energy: Math.min(p.energy + 20, 100),
          totalBeatsConquered: p.totalBeatsConquered + 1
        }));
        // Play full happy beat flowing with happiness and trigger congratulations!
        playHappyRemixBeat();
        setCongratsTaskTitle(task.title);
      } else {
        setProfile(p => ({
          ...p,
          totalBeatsConquered: Math.max(p.totalBeatsConquered - 1, 0)
        }));
        playProgressSound(0.2);
      }

      return {
        ...task,
        isCompleted: nextCompleted,
        subtasks: updatedSubtasks
      };
    }));
  };

  const deleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const handleCreateCustomTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const filteredSubtasks: SubTask[] = newSubtaskInputs
      .filter(st => st.trim() !== "")
      .map((st, sIdx) => ({
        id: `custom-sub-${Date.now()}-${sIdx}`,
        title: st,
        isCompleted: false
      }));

    const times = parseAutomaticTimes(newTitle, newDesc, 0);
    const customTask: Task = {
      id: `custom-task-${Date.now()}`,
      title: newTitle,
      description: newDesc || "Custom self-assigned Sparring Beat",
      category: newCategory,
      timelineSegment: newSegment,
      isCompleted: false,
      isAiGenerated: false,
      tempoBpm: newBpm,
      reminder: "Self-driven track! Champ is monitoring your timing.",
      subtasks: filteredSubtasks,
      createdAt: new Date().toISOString(),
      reminderTime: times.reminderTime,
      deadlineTime: times.deadlineTime
    };

    setTasks(prev => [customTask, ...prev]);
    addXp(15);

    setNewTitle("");
    setNewDesc("");
    setNewCategory("general");
    setNewSegment("anytime");
    setNewBpm(90);
    setNewSubtaskInputs(["", ""]);
    setShowAddTaskModal(false);

    // Swap slide to Timeline to watch new track
    setActiveSlide("timeline");
  };

  const handleAddSubtaskInputLine = () => {
    setNewSubtaskInputs(prev => [...prev, ""]);
  };

  const handleSubtaskInputChange = (index: number, val: string) => {
    setNewSubtaskInputs(prev => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const getCategoryTheme = (cat: BlockerCategory) => {
    switch (cat) {
      case "coding":
        return {
          bg: "bg-pink-50 border-pink-200 text-pink-800",
          icon: <Terminal className="w-4 h-4 text-pink-600 animate-pulse" />,
          label: "Coding Beat"
        };
      case "study":
        return {
          bg: "bg-orange-50 border-orange-200 text-orange-800",
          icon: <BookOpen className="w-4 h-4 text-orange-600" />,
          label: "Recall Rhythm"
        };
      case "deadline":
        return {
          bg: "bg-rose-50 border-rose-200 text-rose-800",
          icon: <Clock className="w-4 h-4 text-rose-600 animate-ping" style={{ animationDuration: '3s' }} />,
          label: "Pressure Drop"
        };
      case "confusion":
        return {
          bg: "bg-amber-50 border-amber-200 text-amber-800",
          icon: <Radio className="w-4 h-4 text-amber-600" />,
          label: "Haze Filter"
        };
      case "blocker":
        return {
          bg: "bg-red-50 border-red-200 text-red-800",
          icon: <ShieldAlert className="w-4 h-4 text-red-600" />,
          label: "Friction Overdrive"
        };
      default:
        return {
          bg: "bg-stone-100 border-stone-200 text-stone-800",
          icon: <Music className="w-4 h-4 text-stone-600" />,
          label: "Freestyle Beat"
        };
    }
  };

  // Filter tasks based on Timeline segments
  const filteredTasks = tasks.filter(t => {
    if (activeSegmentFilter === "all") return true;
    return t.timelineSegment === activeSegmentFilter;
  });

  const [randomQuote, setRandomQuote] = useState("");
  useEffect(() => {
    setRandomQuote(CHAMP_QUOTES[Math.floor(Math.random() * CHAMP_QUOTES.length)]);
  }, [lastAnalysis]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-pink-500/10 via-orange-500/5 to-white flex items-center justify-center p-4 relative" id="login-layout">
        <div className="absolute top-12 left-10 w-96 h-96 bg-pink-400/10 rounded-full blur-3xl -z-10 animate-pulse" />
        <div className="absolute bottom-12 right-10 w-96 h-96 bg-orange-400/10 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: "8s" }} />
        <Login onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  if (!isOnboarded) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-pink-100/60 via-orange-50 to-white flex items-center justify-center py-10" id="onboarding-layout">
        <Onboarding onComplete={handleOnboardingComplete} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-pink-500/5 via-orange-500/5 to-white font-sans pb-16 relative" id="main-app-container">
      
      {/* Light colorful waving mesh design elements */}
      <div className="absolute top-12 left-10 w-96 h-96 bg-pink-400/10 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: "12s" }} />
      <div className="absolute top-1/2 right-12 w-80 h-80 bg-orange-400/10 rounded-full blur-3xl -z-10 animate-pulse" style={{ animationDuration: "10s" }} />
      
      {/* Dynamic Animated Loading screen */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-stone-950/95 z-50 flex flex-col items-center justify-center p-6 text-center"
            id="ai-loading-screen"
          >
            <div className="max-w-md space-y-8">
              {/* Spinning Vinyl/Disc Animation */}
              <div className="relative inline-flex items-center justify-center">
                <div className="absolute inset-0 bg-pink-500 rounded-full blur-2xl opacity-40 animate-pulse" />
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="p-8 bg-gradient-to-tr from-pink-500 to-orange-500 rounded-full shadow-2xl text-white relative"
                >
                  <Disc className="w-14 h-14" />
                  <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 shadow-inner" />
                </motion.div>
              </div>

              <div className="space-y-3">
                <span className="text-xs uppercase font-mono tracking-widest text-pink-400 font-extrabold flex items-center justify-center gap-1">
                  <Radio className="w-3.5 h-3.5 animate-pulse text-pink-500" />
                  BEAT UP AI MIXING CONSOLE ACTIVE
                </span>
                <h3 className="text-3xl font-black tracking-tight text-white">
                  Composing Your Target Remix
                </h3>
                
                {/* Step Indicator */}
                <div className="h-6 overflow-hidden mt-1">
                  <motion.p 
                    key={loadingStepIdx}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="text-pink-200 font-mono text-sm font-bold"
                  >
                    {LOADING_STEPS[loadingStepIdx]}
                  </motion.p>
                </div>
              </div>

              {/* Progress skeleton bar */}
              <div className="w-full bg-stone-800 h-2 rounded-full overflow-hidden max-w-[280px] mx-auto p-[2px]">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 7.5, ease: "easeInOut" }}
                  className="bg-gradient-to-r from-pink-500 to-orange-500 h-full rounded-full"
                />
              </div>

              <p className="text-stone-400 text-xs italic">
                "No repetitive suggestions. We are classifying your track to the timeline grid."
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header / Top Bar */}
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur-md border-b-2 border-pink-100/80 px-4 py-3 shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-pink-500 to-orange-500 rounded-2xl text-white shadow-md shadow-pink-100 animate-pulse">
              <Disc className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-lg font-black tracking-tight text-stone-900 leading-none">
                  BEAT UP
                </h1>
                <span className="bg-gradient-to-r from-pink-500 to-orange-500 text-white font-mono text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase">
                  Beat one level up
                </span>
              </div>
              <span className="text-[10px] text-pink-700 font-mono font-bold tracking-tight">
                Chronological Voice-Remix Task Board
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex flex-col text-right mr-2">
              <span className="text-[8px] font-mono font-black text-stone-400 leading-none uppercase">Agent Deck</span>
              <span className="text-[10.5px] font-black text-pink-950 truncate max-w-[130px] mt-0.5">{userEmail}</span>
            </div>

            <button
              onClick={() => setShowResetConfirm(true)}
              title="Reset Mixer Stats"
              className="p-1.5 text-stone-400 hover:text-pink-600 rounded-xl transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="px-2.5 py-1 bg-pink-50 hover:bg-pink-100 border border-pink-100 rounded-xl text-[10px] font-black text-pink-900 transition cursor-pointer"
            >
              Log Out
            </button>

            <div className="bg-pink-50 border border-pink-100 rounded-xl px-2.5 py-1 flex items-center gap-1 shrink-0">
              <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500 animate-bounce" />
              <span className="text-[11px] font-black text-pink-950">{profile.streak}D STREAK</span>
            </div>
          </div>
        </div>
      </header>

      {/* --- SLIDE NAVIGATION TAB BAR (Interactive Slide Switcher) --- */}
      <div className="max-w-4xl mx-auto px-4 mt-4">
        <div className="bg-white border-2 border-pink-100 rounded-2xl p-1 shadow-sm flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={() => setActiveSlide("consultation")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSlide === "consultation"
                ? "bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-md shadow-pink-100"
                : "text-stone-500 hover:text-stone-800 hover:bg-stone-50"
            }`}
          >
            <Volume2 className="w-4 h-4" />
            <span>Consultation</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSlide("mixer")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSlide === "mixer"
                ? "bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-md shadow-pink-100"
                : "text-stone-500 hover:text-stone-800 hover:bg-stone-50"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Mixer Metrics</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSlide("timeline")}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeSlide === "timeline"
                ? "bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-md shadow-pink-100"
                : "text-stone-500 hover:text-stone-800 hover:bg-stone-50"
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Beat Timeline</span>
          </button>
        </div>
      </div>

      {/* Main Dashboard Decks Rendered as Separate Slides */}
      <main className="max-w-4xl mx-auto px-4 mt-6">
        <AnimatePresence mode="wait">
          
          {/* SLIDE 1: CONSULTATION DECK (Consultation box first) */}
          {activeSlide === "consultation" && (
            <motion.div
              key="consultation-slide"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Voice Dictation Hub & Quick Prompt Console */}
              <div className="bg-white/90 backdrop-blur-md border-2 border-pink-100 rounded-3xl p-5 shadow-lg relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-32 h-32 bg-pink-100 rounded-full blur-2xl opacity-40 pointer-events-none" />
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black text-pink-700 bg-pink-50 border border-pink-100 rounded-full px-2.5 py-0.5 uppercase tracking-wider">
                        🔊 {timeGreeting} Champion!
                      </span>
                      <span className="w-2 h-2 rounded-full bg-pink-500 animate-ping" />
                    </div>
                    <h2 className="text-xl font-black text-stone-900 tracking-tight">
                      Beat Up AI Dictation Console
                    </h2>
                    <p className="text-xs text-stone-500 leading-relaxed italic max-w-lg">
                      " {randomQuote || "Lay down the bassline, Champ! A single micro-beat beats a silent track."} "
                    </p>
                  </div>

                  {/* Dictation triggers */}
                  <div className="flex items-center gap-2">
                    {speechSupported && (
                      <button
                        type="button"
                        onClick={startVoiceDictation}
                        className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs shadow-md cursor-pointer transition ${
                          isDictatingInput 
                            ? "bg-rose-500 hover:bg-rose-600 text-white animate-pulse" 
                            : "bg-gradient-to-r from-pink-500 to-orange-500 text-white hover:from-pink-600 hover:to-orange-600 shadow-pink-100"
                        }`}
                      >
                        {isDictatingInput ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 animate-bounce" />}
                        <span>{isDictatingInput ? "Capturing..." : "Narrate Tasks"}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Blocker Form input */}
                <div className="mt-4 border-t border-stone-100 pt-4">
                  <form onSubmit={(e) => { e.preventDefault(); analyzeProblem(problemText); }} className="space-y-3">
                    <div className="relative">
                      <input
                        type="text"
                        value={problemText}
                        onChange={(e) => setProblemText(e.target.value)}
                        placeholder="Explain what is blocking you (e.g. 'It is morning, I am feeling confused with compilation error and a 10am deadline')"
                        className="w-full text-xs sm:text-sm bg-stone-50 border-2 border-pink-100 rounded-2xl py-3.5 pl-4 pr-16 focus:ring-2 focus:ring-pink-400 outline-none transition placeholder:text-stone-400 font-sans text-stone-900 font-medium"
                      />
                      <button
                        type="submit"
                        disabled={!problemText.trim()}
                        className={`absolute right-2 top-2 p-1.5 rounded-xl transition ${
                          problemText.trim() 
                            ? "bg-stone-950 hover:bg-pink-600 text-white cursor-pointer" 
                            : "bg-stone-100 text-stone-300 cursor-not-allowed"
                        }`}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>

                    {isDictatingInput && (
                      <div className="flex items-center gap-2 bg-pink-50 text-pink-700 p-2.5 rounded-xl text-xs font-bold animate-pulse">
                        <Activity className="w-4 h-4" />
                        <span>Voice Active: Dictating your tasks in real-time... Speak now!</span>
                      </div>
                    )}

                    {/* Quick presets */}
                    <div className="flex flex-wrap gap-1.5 items-center justify-start">
                      <span className="text-[10px] text-stone-400 font-bold uppercase font-mono mr-1">Voice Presets:</span>
                      <button
                        type="button"
                        onClick={() => { setProblemText("It is late night, my compilation of docker is bloated with bugs and my deadline is in 2 hours. I feel blocked."); analyzeProblem("It is late night, my compilation of docker is bloated with bugs and my deadline is in 2 hours. I feel blocked."); }}
                        className="text-[10px] font-bold text-stone-600 bg-pink-50/50 hover:bg-pink-50 border border-pink-100 rounded-lg px-2.5 py-1 cursor-pointer"
                      >
                        🌃 Night Docker Crunch
                      </button>
                      <button
                        type="button"
                        onClick={() => { setProblemText("It is morning study time, and I am staring at complex math summaries with total confusion."); analyzeProblem("It is morning study time, and I am staring at complex math summaries with total confusion."); }}
                        className="text-[10px] font-bold text-stone-600 bg-pink-50/50 hover:bg-pink-50 border border-pink-100 rounded-lg px-2.5 py-1 cursor-pointer"
                      >
                        🌅 Morning Math Focus
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Dynamic Coach Selector Deck */}
              <div className="bg-white border-2 border-pink-100 rounded-3xl p-5 shadow-sm space-y-3" id="coach-selector-deck-slide">
                <div className="flex items-center justify-between border-b border-stone-100 pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <Sliders className="w-4 h-4 text-pink-500" />
                    <span className="text-xs font-black text-stone-800 tracking-tight uppercase">
                      🎧 ACTIVE COACH DECK
                    </span>
                  </div>
                  <span className="text-[9px] font-mono font-black text-stone-400 uppercase">
                    PERSONALITY REMIXER
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-1 bg-stone-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setCoachMode("champ");
                      localStorage.setItem("beatup_coach_mode", "champ");
                    }}
                    className={`py-2 text-[10.5px] font-black rounded-lg transition cursor-pointer ${
                      coachMode === "champ"
                        ? "bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-sm"
                        : "text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    DJ Champ 🥊
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCoachMode("friend");
                      localStorage.setItem("beatup_coach_mode", "friend");
                    }}
                    className={`py-2 text-[10.5px] font-black rounded-lg transition cursor-pointer ${
                      coachMode === "friend"
                        ? "bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-sm"
                        : "text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    Friend 🤝
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCoachMode("pro");
                      localStorage.setItem("beatup_coach_mode", "pro");
                    }}
                    className={`py-2 text-[10.5px] font-black rounded-lg transition cursor-pointer ${
                      coachMode === "pro"
                        ? "bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-sm"
                        : "text-stone-500 hover:text-stone-800"
                    }`}
                  >
                    Pro Advisor 💼
                  </button>
                </div>

                <div className="text-xs leading-relaxed text-stone-600 bg-pink-50/20 p-3 rounded-xl border border-pink-100/50 font-semibold">
                  {coachMode === "champ" && "🥊 DJ Champ Mode: High-octane rhythm coaching, boxing drills, and athletic encouragement will lead you to complete your beats."}
                  {coachMode === "friend" && "🤝 Friend Mode: Empathetic, supportive, and kind sidekick. Let's tackle this together, buddy. No pressure at all!"}
                  {coachMode === "pro" && "💼 Pro Assistant: Structured milestone tracking, executive priority logs, and objective deliverables."}
                </div>
              </div>

              {/* AI Coach Diagnostic Response Card on Consultation */}
              {lastAnalysis && (
                <div className="bg-white border-2 border-pink-100 rounded-3xl p-5 shadow-sm space-y-3" id="failsafe-console">
                  <div className="flex items-center gap-2 border-b border-stone-100 pb-2">
                    <div className="p-1.5 bg-pink-100 text-pink-600 rounded-xl">
                      <PlayCircle className="w-4 h-4 text-pink-500" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-stone-900 uppercase tracking-tight">
                        AI Coach Sound Check
                      </h3>
                      <p className="text-[10px] font-mono text-pink-700 font-bold">
                        Roadblock Frequency Analysis
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-1 text-left">
                    <span className="text-[9px] font-mono font-black text-stone-400 uppercase tracking-wider block">
                      DIAGNOSTIC VERDICT: {lastAnalysis.solutionTitle}
                    </span>
                    <p className="text-xs text-stone-700 font-bold leading-relaxed">
                      {lastAnalysis.aiCoachResponse}
                    </p>
                  </div>
                  
                  <div className="pt-2 flex items-center justify-between border-t border-stone-100 text-[10px] text-stone-500 font-semibold">
                    <span>
                      Suggested beats have been injected to your active Timeline!
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveSlide("timeline")}
                      className="text-pink-600 hover:text-pink-700 font-black flex items-center gap-0.5 cursor-pointer animate-pulse"
                    >
                      <span>View Timeline</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* SLIDE 2: MIXER METRICS DECK */}
          {activeSlide === "mixer" && (
            <motion.div
              key="mixer-slide"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="space-y-1">
                <h3 className="text-xs font-mono font-black tracking-widest text-pink-600 uppercase flex items-center gap-1">
                  <Activity className="w-4 h-4 text-pink-500" />
                  MIXER PROFILE STATS
                </h3>
                <p className="text-xs text-stone-500">
                  Monitor your level progress, streak energy, and total beats conquered.
                </p>
              </div>

              {/* Dynamic Resilience Meter */}
              <ResilienceMeter profile={profile} />

              {/* Brand Dynamic Audio Visualizer & Dancing Waveforms */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5">
                  <Music className="w-4.5 h-4.5 text-pink-500 animate-pulse" />
                  <span className="text-xs font-black text-stone-800 uppercase tracking-tight">DANCING TUNES GRAPH</span>
                </div>
                <AudioVisualizer 
                  tempoBpm={lastAnalysis ? lastAnalysis.tempoBpm : 95} 
                  category={lastAnalysis ? lastAnalysis.category : "blocker"} 
                />
              </div>

              {/* Interactive coaching protocols */}
              <div className="bg-gradient-to-br from-pink-500/10 to-orange-500/10 border-2 border-pink-100 rounded-3xl p-5 shadow-sm space-y-3">
                <div className="flex items-center gap-1.5 text-pink-700">
                  <Star className="w-4.5 h-4.5 fill-pink-600 text-pink-600" />
                  <span className="text-xs font-black uppercase tracking-wider">CHAMP'S BEAT PROTOCOL</span>
                </div>
                <p className="text-xs text-stone-700 leading-relaxed font-semibold">
                  Complete your subtask drills to score <strong className="text-pink-600 font-extrabold">15 XP</strong> and spin up the sound mixer. If a track is in danger of falling off beat, load Plan B or Plan C backups immediately!
                </p>
              </div>
            </motion.div>
          )}

          {/* SLIDE 3: BEAT TIMELINE DECK */}
          {activeSlide === "timeline" && (
            <motion.div
              key="timeline-slide"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              {/* Chronological Timeline Filter Groupings */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-pink-100 pb-2">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-black text-stone-900 uppercase tracking-tight flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-pink-500" />
                      Rhythm Timeline Mix
                    </h3>
                    <p className="text-xs text-stone-500">
                      Filter chronological beats to group your schedule
                    </p>
                  </div>

                  {/* Group filter pills */}
                  <div className="flex flex-wrap gap-1">
                    <button
                      onClick={() => setActiveSegmentFilter("all")}
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full transition cursor-pointer ${
                        activeSegmentFilter === "all" 
                          ? "bg-gradient-to-r from-pink-500 to-orange-500 text-white" 
                          : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
                      }`}
                    >
                      All Tracks
                    </button>
                    <button
                      onClick={() => setActiveSegmentFilter("morning")}
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full transition cursor-pointer ${
                        activeSegmentFilter === "morning" 
                          ? "bg-gradient-to-r from-pink-500 to-orange-500 text-white" 
                          : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
                      }`}
                    >
                      🌅 Morning Beats
                    </button>
                    <button
                      onClick={() => setActiveSegmentFilter("afternoon")}
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full transition cursor-pointer ${
                        activeSegmentFilter === "afternoon" 
                          ? "bg-gradient-to-r from-pink-500 to-orange-500 text-white" 
                          : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
                      }`}
                    >
                      ☀️ Afternoon Beats
                    </button>
                    <button
                      onClick={() => setActiveSegmentFilter("night")}
                      className={`text-[10px] font-black px-2.5 py-1 rounded-full transition cursor-pointer ${
                        activeSegmentFilter === "night" 
                          ? "bg-gradient-to-r from-pink-500 to-orange-500 text-white" 
                          : "bg-white border border-stone-200 text-stone-600 hover:bg-stone-50"
                      }`}
                    >
                      🌃 Night Beats
                    </button>
                  </div>
                </div>

                {/* Error banner */}
                {errorMsg && (
                  <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-2xl text-xs flex items-center justify-between">
                    <span>⚠️ {errorMsg}</span>
                    <button onClick={() => setErrorMsg(null)} className="font-bold underline ml-2">Dismiss</button>
                  </div>
                )}

                {/* FAIL-SAFE DYNAMIC REMIX DECK (Plans A, B, and C) - INTEGRATED DIRECTLY IN THE TIMELINE SLIDE */}
                {lastAnalysis && (
                  <div className="bg-white border-2 border-pink-100/85 rounded-3xl p-5 shadow-sm space-y-4" id="failsafe-console-timeline">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-gradient-to-tr from-pink-500 to-orange-500 text-white rounded-xl">
                          <Sliders className="w-4 h-4 animate-spin" style={{ animationDuration: '8s' }} />
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-stone-900 uppercase tracking-tight">
                            FAIL-SAFE DYNAMIC REMIX DECK
                          </h3>
                          <p className="text-[10px] font-mono text-pink-700 font-bold">
                            Active Fail-Safe backup plans for this timeline track
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] font-mono font-black text-stone-400">RISK LEVEL:</span>
                        <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                          lastAnalysis.riskOfFailure === "critical"
                            ? "bg-rose-100 text-rose-700 border-rose-200"
                            : lastAnalysis.riskOfFailure === "medium"
                            ? "bg-orange-100 text-orange-700 border-orange-200"
                            : "bg-emerald-100 text-emerald-700 border-emerald-200"
                        }`}>
                          {lastAnalysis.riskOfFailure || "medium"}
                        </span>
                      </div>
                    </div>

                    <div className="bg-pink-50/20 border border-pink-100/60 rounded-2xl p-3 text-xs text-stone-800 flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-pink-600 shrink-0 mt-0.5 animate-bounce" />
                      <div>
                        <span className="font-extrabold text-pink-900 block mb-0.5">Focus Failure Risk Forecast:</span>
                        <p className="text-xs leading-normal font-medium text-stone-600">{lastAnalysis.failurePredictionMessage || "No immediate blocker detected. Keep on the standard focus track!"}</p>
                      </div>
                    </div>

                    {/* Interactive Plan Selector Buttons */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-1 bg-stone-100 p-1 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setSelectedPlanTier("A")}
                          className={`py-2 text-[10.5px] font-black rounded-lg transition cursor-pointer ${
                            selectedPlanTier === "A" 
                              ? "bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-sm" 
                              : "text-stone-500 hover:text-stone-800"
                          }`}
                        >
                          PLAN A: Perfect Track
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedPlanTier("B")}
                          className={`py-2 text-[10.5px] font-black rounded-lg transition cursor-pointer ${
                            selectedPlanTier === "B" 
                              ? "bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-sm" 
                              : "text-stone-500 hover:text-stone-800"
                          }`}
                        >
                          PLAN B: Halftime Remix
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedPlanTier("C")}
                          className={`py-2 text-[10.5px] font-black rounded-lg transition cursor-pointer ${
                            selectedPlanTier === "C" 
                              ? "bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-sm" 
                              : "text-stone-500 hover:text-stone-800"
                          }`}
                        >
                          PLAN C: Bass Drop
                        </button>
                      </div>

                      <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/50 space-y-2 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-mono font-black text-pink-700 tracking-wider">
                            {selectedPlanTier === "A" && "THE PERFECT TRACK (IDEAL EXECUTION PATH)"}
                            {selectedPlanTier === "B" && "THE HALFTIME REMIX (FATIGUED FALLBACK ROUTE)"}
                            {selectedPlanTier === "C" && "THE BASS DROP (EMERGENCY MINIMAL DELIVERABLE)"}
                          </span>
                          <span className="text-[9px] font-mono font-bold bg-pink-50 text-pink-700 px-2 py-0.5 rounded-md border border-pink-100">
                            SPEED: {lastAnalysis.tempoBpm || 90} BPM
                          </span>
                        </div>

                        <p className="text-xs text-stone-800 font-bold leading-relaxed">
                          {selectedPlanTier === "A" && lastAnalysis.planA}
                          {selectedPlanTier === "B" && lastAnalysis.planB}
                          {selectedPlanTier === "C" && lastAnalysis.planC}
                        </p>

                        <div className="pt-2 flex items-center justify-between border-t border-stone-200/50">
                          <span className="text-[9px] text-stone-500 italic font-medium">
                            Need a structured track for this backup?
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setTasks(prev => [
                                {
                                  id: `fallback-${Date.now()}`,
                                  title: `Execute Plan ${selectedPlanTier}: ${lastAnalysis.solutionTitle}`,
                                  description: selectedPlanTier === "A" ? lastAnalysis.planA : selectedPlanTier === "B" ? lastAnalysis.planB : lastAnalysis.planC,
                                  category: lastAnalysis.category,
                                  timelineSegment: "anytime",
                                  isCompleted: false,
                                  isAiGenerated: true,
                                  tempoBpm: lastAnalysis.tempoBpm || 90,
                                  reminder: "Backup plan active! Fight for the minimum viable delivery.",
                                  subtasks: [
                                    { id: `sub-fallback-${Date.now()}-1`, title: "Take 1 micro-step right now", isCompleted: false },
                                    { id: `sub-fallback-${Date.now()}-2`, title: "Avoid second-guessing; just hit draft", isCompleted: false }
                                  ],
                                  createdAt: new Date().toISOString()
                                },
                                ...prev
                              ]);
                              setActiveAlert(`Remix Plan ${selectedPlanTier} successfully injected into active Timeline!`);
                              setTimeout(() => setActiveAlert(null), 6000);
                            }}
                            className="text-[10px] font-black text-pink-600 hover:text-pink-700 bg-pink-50 border border-pink-100 rounded-lg px-2.5 py-1.5 cursor-pointer flex items-center gap-1"
                          >
                            <PlusCircle className="w-3.5 h-3.5" />
                            <span>Inject Plan into Board</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tasks list Container */}
                <div className="space-y-4 animate-fadeIn" id="task-board-container">
                  {filteredTasks.length === 0 ? (
                    <div className="bg-white border-2 border-dashed border-pink-100 rounded-3xl p-10 text-center text-stone-500 text-xs space-y-2">
                      <Music className="w-8 h-8 text-pink-300 mx-auto animate-bounce" />
                      <p className="font-extrabold text-stone-800">No tracks on this timeline cue!</p>
                      <p className="text-xs text-stone-500 max-w-sm mx-auto">Narrate a blocker in the consultation slide, or click "Assemble Custom Beat Track" to add a new task.</p>
                    </div>
                  ) : (
                    filteredTasks.map(task => {
                      const completedSub = task.subtasks.filter(s => s.isCompleted).length;
                      const totalSub = task.subtasks.length;
                      const pct = totalSub > 0 ? Math.round((completedSub / totalSub) * 100) : (task.isCompleted ? 100 : 0);
                      const catDetails = getCategoryTheme(task.category);

                      return (
                        <motion.div
                          key={task.id}
                          layoutId={task.id}
                          className={`bg-white border-2 rounded-3xl p-5 shadow-sm relative transition-all duration-300 ${
                            task.isCompleted ? "opacity-75 border-emerald-200 bg-emerald-50/10" : "border-pink-100"
                          }`}
                        >
                          {/* Top Bar */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleMainTask(task.id)}
                                className="text-stone-400 hover:text-stone-800 transition focus:outline-none cursor-pointer"
                              >
                                {task.isCompleted ? (
                                  <CheckCircle2 className="w-5.5 h-5.5 text-pink-500 fill-pink-100" />
                                ) : (
                                  <div className="w-5.5 h-5.5 rounded-full border-2 border-stone-300 hover:border-pink-500 transition" />
                                )}
                              </button>

                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className={`text-[9px] font-mono font-black tracking-wider px-2.5 py-0.5 rounded-full border inline-flex items-center gap-1 ${catDetails.bg}`}>
                                  {catDetails.icon}
                                  <span>{catDetails.label}</span>
                                </span>

                                <span className="text-[9px] font-mono text-pink-700 bg-pink-50 border border-pink-100 px-2 py-0.5 rounded-full font-bold">
                                  {task.timelineSegment === "morning" && "🌅 Morning Beat"}
                                  {task.timelineSegment === "afternoon" && "☀️ Afternoon Beat"}
                                  {task.timelineSegment === "night" && "🌃 Night Beat"}
                                  {task.timelineSegment === "anytime" && "🎵 Anytime Freestyle"}
                                </span>

                                <span className="text-[9px] font-mono text-stone-600 bg-stone-100 px-1.5 py-0.5 rounded-full">
                                  {task.tempoBpm || 90} BPM
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={() => deleteTask(task.id)}
                              className="p-1 text-stone-400 hover:text-red-500 rounded-lg transition cursor-pointer"
                              title="Delete Beat Track"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Content */}
                          <div className="pl-7 mb-3 space-y-1">
                            <h4 className={`text-sm font-extrabold tracking-tight text-stone-900 ${task.isCompleted ? 'line-through text-stone-400' : ''}`}>
                              {task.title}
                            </h4>
                            <p className="text-xs text-stone-600 max-w-lg">
                              {task.description}
                            </p>
                          </div>

                          {/* Subtasks */}
                          {totalSub > 0 && (
                            <div className="pl-7 pt-2.5 border-t border-stone-100/80 space-y-2">
                              <div className="flex items-center justify-between text-[10px] text-stone-500 font-bold uppercase tracking-wider">
                                <span>Sub-beats</span>
                                <span>{completedSub}/{totalSub} Mastered ({pct}%)</span>
                              </div>

                              <div className="w-full bg-stone-100 h-1 rounded-full overflow-hidden">
                                <div 
                                  className="bg-gradient-to-r from-pink-500 to-orange-500 h-full transition-all duration-300"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>

                              <div className="space-y-1.5 pt-1">
                                {task.subtasks.map(sub => (
                                  <label 
                                    key={sub.id} 
                                    className="flex items-center gap-2.5 text-xs text-stone-700 hover:text-stone-950 transition cursor-pointer select-none"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={sub.isCompleted}
                                      onChange={() => toggleSubtask(task.id, sub.id)}
                                      className="rounded-full border-stone-300 text-pink-500 focus:ring-pink-400 cursor-pointer w-4 h-4"
                                    />
                                    <span className={sub.isCompleted ? "line-through text-stone-400" : ""}>
                                      {sub.title}
                                    </span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Timely Reminders & Deadline Controls */}
                          <div className="pl-7 pt-2.5 mt-3 border-t border-stone-100/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/50 p-2.5 rounded-2xl">
                            <div className="flex flex-wrap items-center gap-2 text-xs">
                              {/* Show active reminder */}
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-700 bg-white border border-stone-200 px-2.5 py-1 rounded-xl">
                                <span className={`w-1.5 h-1.5 rounded-full ${task.reminderTime ? "bg-pink-500 animate-ping" : "bg-stone-300"}`} />
                                <span className="font-mono">Alert: {task.reminderTime || "Not Set"}</span>
                              </div>

                              {/* Show active deadline */}
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-stone-700 bg-white border border-stone-200 px-2.5 py-1 rounded-xl">
                                <span className={`w-1.5 h-1.5 rounded-full ${task.deadlineTime ? "bg-orange-500 animate-pulse" : "bg-stone-300"}`} />
                                <span className="font-mono">Target: {task.deadlineTime || "Not Set"}</span>
                              </div>
                            </div>

                            {/* Inputs to easily adjust times */}
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-bold text-stone-500 uppercase font-mono">Alert</span>
                                <input
                                  type="time"
                                  value={task.reminderTime || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, reminderTime: val || undefined } : t));
                                  }}
                                  className="text-[10.5px] p-1.5 bg-white border border-stone-200 rounded-lg focus:ring-1 focus:ring-pink-400 outline-none text-stone-800 font-mono font-bold cursor-pointer"
                                />
                              </div>

                              <div className="flex items-center gap-1">
                                <span className="text-[10px] font-bold text-stone-500 uppercase font-mono">Target</span>
                                <input
                                  type="time"
                                  value={task.deadlineTime || ""}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, deadlineTime: val || undefined } : t));
                                  }}
                                  className="text-[10.5px] p-1.5 bg-white border border-stone-200 rounded-lg focus:ring-1 focus:ring-orange-400 outline-none text-stone-800 font-mono font-bold cursor-pointer"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Coach Reminder */}
                          {task.reminder && !task.isCompleted && (
                            <div className="mt-3 pl-7 pt-2 text-[10px] text-pink-800 bg-pink-50 p-2.5 rounded-2xl border border-pink-100/50 italic flex items-start gap-1">
                              <span className="font-bold shrink-0">⚡ Coach Prompt:</span>
                              <span>{task.reminder}</span>
                            </div>
                          )}

                        </motion.div>
                      );
                    })
                  )}
                </div>

                {/* Quick action button to add custom track */}
                <div className="text-center pt-2">
                  <button
                    onClick={() => setShowAddTaskModal(true)}
                    className="inline-flex items-center gap-1.5 bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white text-xs font-black px-5 py-3 rounded-2xl shadow-md transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Assemble Custom Beat Track</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* Custom Task Addition Modal Overlay */}
      <AnimatePresence>
        {showAddTaskModal && (
          <div className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border border-pink-100 rounded-3xl max-w-md w-full p-5 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-stone-900">
                  Assemble Custom Beat Track
                </h3>
                <button
                  onClick={() => setShowAddTaskModal(false)}
                  className="text-stone-400 hover:text-stone-600 font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreateCustomTask} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-600 block">
                    Beat Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Isolate the compiler port crash"
                    className="w-full text-sm p-3 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-pink-400 outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-600 block">
                    Description & Strategy
                  </label>
                  <textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Provide short action steps..."
                    className="w-full text-sm p-3 bg-stone-50 border border-stone-200 rounded-2xl focus:ring-2 focus:ring-pink-400 outline-none h-16 resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-600 block">
                      Category
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as BlockerCategory)}
                      className="w-full text-sm p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-pink-400 outline-none cursor-pointer"
                    >
                      <option value="general">General Workout</option>
                      <option value="coding">Coding Fix</option>
                      <option value="study">Active Recall</option>
                      <option value="deadline">Deadline MVP</option>
                      <option value="confusion">Clarify Specs</option>
                      <option value="blocker">Friction Breaker</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-stone-600 block">
                      Timeline Segment
                    </label>
                    <select
                      value={newSegment}
                      onChange={(e) => setNewSegment(e.target.value as BeatTimelineSegment)}
                      className="w-full text-sm p-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-pink-400 outline-none cursor-pointer"
                    >
                      <option value="anytime">Freestyle (Anytime)</option>
                      <option value="morning">Morning Beats</option>
                      <option value="afternoon">Afternoon Beats</option>
                      <option value="night">Night Beats</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-600 block flex justify-between">
                    <span>Target Speed (Tempo)</span>
                    <span className="text-pink-600 font-extrabold font-mono">{newBpm} BPM</span>
                  </label>
                  <input
                    type="range"
                    min={60}
                    max={140}
                    value={newBpm}
                    onChange={(e) => setNewBpm(Number(e.target.value))}
                    className="w-full cursor-pointer accent-pink-500"
                  />
                  <div className="flex justify-between text-[9px] text-stone-400 font-mono">
                    <span>60 BPM (Chill Focus)</span>
                    <span>140 BPM (Crunch Emergency)</span>
                  </div>
                </div>

                {/* Micro Subtasks creation list */}
                <div className="space-y-2 border-t border-stone-100 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-600 block">
                      Sub-beat Drills
                    </span>
                    <button
                      type="button"
                      onClick={handleAddSubtaskInputLine}
                      className="text-[10px] font-black text-pink-600 hover:text-pink-700 hover:underline cursor-pointer"
                    >
                      + Add Line
                    </button>
                  </div>

                  <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                    {newSubtaskInputs.map((val, idx) => (
                      <input
                        key={idx}
                        type="text"
                        value={val}
                        onChange={(e) => handleSubtaskInputChange(idx, e.target.value)}
                        placeholder={`Micro-drill ${idx + 1}`}
                        className="w-full text-xs p-2 bg-stone-50 border border-stone-200 rounded-xl outline-none focus:border-pink-400 text-stone-900"
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 justify-end pt-2 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setShowAddTaskModal(false)}
                    className="text-xs text-stone-500 font-semibold bg-stone-100 px-4 py-2 rounded-xl hover:bg-stone-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="text-xs text-white font-black bg-pink-500 px-4 py-2 rounded-xl hover:bg-pink-600 cursor-pointer"
                  >
                    Assemble Track
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Dynamic Congratulations Level-Up Overlay */}
      <AnimatePresence>
        {congratsTaskTitle && (
          <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4" id="congrats-modal">
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ type: "spring", damping: 15 }}
              className="bg-white border-4 border-pink-400 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative text-center overflow-hidden"
            >
              {/* Confetti Sparkles floating in background */}
              <div className="absolute -left-10 -top-10 w-28 h-28 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -right-10 -bottom-10 w-28 h-28 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
              
              {/* Happy Glowing Disc Launcher */}
              <div className="inline-flex relative p-5 bg-gradient-to-tr from-pink-500 to-orange-500 text-white rounded-full shadow-xl shadow-pink-200 animate-bounce mb-4">
                <Trophy className="w-10 h-10 text-white" />
                <motion.div 
                  className="absolute -top-1 -right-1 bg-yellow-400 text-stone-950 rounded-full p-1 border-2 border-white shadow-md text-[10px] font-black"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  XP+
                </motion.div>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-mono font-black text-pink-600 tracking-widest uppercase block">
                  🎉 CHAMP BEAT CONQUERED!
                </span>
                
                <h3 className="text-xl font-black text-stone-900 tracking-tight leading-tight">
                  "{congratsTaskTitle}"
                </h3>

                <div className="p-3 bg-pink-50 border border-pink-200 rounded-2xl flex flex-col items-center justify-center gap-1">
                  <p className="text-xs font-black text-pink-700">
                    Sweet! Congratulations, you are one beat level up!
                  </p>
                </div>

                <p className="text-xs text-stone-500 max-w-xs mx-auto leading-relaxed">
                  You have successfully mastered this track milestone, increased your daily focus tempo, and scored bonus Energy! Let's sustain this momentum.
                </p>
              </div>

              {/* Stats Boost indicators */}
              <div className="grid grid-cols-2 gap-2 mt-5 bg-stone-50 p-3 rounded-2xl border border-stone-100">
                <div className="text-center">
                  <span className="text-[9px] font-mono font-black text-stone-400 uppercase block">XP Booster</span>
                  <span className="text-xs font-black text-pink-600 font-mono">+50 XP</span>
                </div>
                <div className="text-center border-l border-stone-200">
                  <span className="text-[9px] font-mono font-black text-stone-400 uppercase block">Resilience</span>
                  <span className="text-xs font-black text-orange-500 font-mono">+10% Max</span>
                </div>
              </div>

              <div className="pt-5 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    // Reward more XP and clear congrats
                    addXp(50);
                    setProfile(prev => ({
                      ...prev,
                      energy: Math.min(prev.energy + 20, 100),
                      totalBeatsConquered: prev.totalBeatsConquered + 1
                    }));
                    setCongratsTaskTitle(null);
                    // Open the Beat Timeline tab automatically to proceed to the next task
                    setActiveSegmentFilter("all");
                    setActiveSlide("timeline");
                  }}
                  className="w-full py-4 bg-gradient-to-r from-pink-500 to-orange-500 hover:from-pink-600 hover:to-orange-600 text-white rounded-2xl text-xs font-black shadow-lg shadow-pink-100 transition cursor-pointer flex items-center justify-center gap-1.5 border-b-4 border-black/10 active:border-b-0 active:translate-y-[4px]"
                >
                  <span>Move forward to next task!</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Real-time Deadline Alert Banner Overlay */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-20 left-4 right-4 md:left-1/2 md:right-auto md:w-full md:max-w-md md:-translate-x-1/2 bg-stone-950 text-white p-4 rounded-2xl shadow-2xl border-2 border-pink-400 z-50 flex items-center gap-3"
            id="deadline-alert-toast"
          >
            <div className="p-2 bg-gradient-to-tr from-pink-500 to-orange-500 rounded-xl text-white animate-bounce">
              <Clock className="w-5 h-5" />
            </div>
            <div className="flex-1 text-left">
              <span className="text-[9px] font-mono font-black text-pink-400 uppercase tracking-widest block">Beat Alarm Live!</span>
              <p className="text-xs font-semibold text-stone-100">{activeAlert}</p>
            </div>
            <button 
              onClick={() => setActiveAlert(null)}
              className="text-stone-400 hover:text-white text-xs font-bold px-2 cursor-pointer"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4" id="custom-logout-modal">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border-2 border-pink-100 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4"
            >
              <div className="p-3 bg-pink-50 text-pink-600 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-stone-900">Log Out Session?</h3>
                <p className="text-xs text-stone-500">Are you sure you want to log out from your active Google SSO connection?</p>
              </div>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    localStorage.removeItem("beatup_logged_in");
                    localStorage.removeItem("beatup_user_email");
                    setIsLoggedIn(false);
                    setShowLogoutConfirm(false);
                  }}
                  className="flex-1 py-2.5 bg-pink-500 hover:bg-pink-600 text-white rounded-xl text-xs font-black cursor-pointer shadow-md shadow-pink-100"
                >
                  Yes, Log Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4" id="custom-reset-modal">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border-2 border-orange-100 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-center space-y-4"
            >
              <div className="p-3 bg-orange-50 text-orange-600 rounded-full w-12 h-12 mx-auto flex items-center justify-center">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-stone-900">Reset Mixer & Stats?</h3>
                <p className="text-xs text-stone-500">This will wipe out all daily chronological task beats, XP levels, and local history to start fresh.</p>
              </div>
              <div className="flex gap-2 justify-center pt-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                  }}
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black cursor-pointer shadow-md shadow-orange-100"
                >
                  Yes, Reset All
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
