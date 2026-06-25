import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, ArrowRight, ShieldAlert, Award, Zap, Smile, BookOpen, Terminal, Clock, Mic, MicOff, Disc, Volume2 } from "lucide-react";

interface OnboardingProps {
  onComplete: (firstProblem: string) => void;
  userEmail?: string;
}

export default function Onboarding({ onComplete, userEmail }: OnboardingProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [firstProblem, setFirstProblem] = useState("");
  const [timeGreeting, setTimeGreeting] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setTimeGreeting("Good morning");
    } else if (hour < 17) {
      setTimeGreeting("Good afternoon");
    } else {
      setTimeGreeting("Good evening");
    }

    // Check Speech Recognition support
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setVoiceSupported(true);
      }
    }
  }, []);

  const slides = [
    {
      icon: <Disc className="w-12 h-12 text-orange-500 animate-spin" style={{ animationDuration: '4s' }} />,
      title: "Drop Your Mental Blocks",
      tagline: "BEAT THE BLOCKERS",
      description: "Welcome to Beat Up. We transform frustrating deadlines, study walls, and coding lockups into rhythmic drills. Let's find your tempo.",
      bg: "bg-orange-50/80 border-orange-100"
    },
    {
      icon: <Volume2 className="w-12 h-12 text-amber-500 animate-pulse" />,
      title: "Narrate Your Tracks",
      tagline: "VOICE NARRATION",
      description: "No tedious keyboards. Just tap the microphone and explain what you are fighting according to your schedule. We handle the timeline and track listing.",
      bg: "bg-amber-50/80 border-amber-100"
    },
    {
      icon: <Zap className="w-12 h-12 text-rose-500" />,
      title: "Plan A, B, & C Dynamic Remixes",
      tagline: "ZERO FAIL FAILSAFE",
      description: "When tasks slide or deadlines crash, Beat Up automatically detects the risk of failure and cooks up three alternative plans so you never drop the beat.",
      bg: "bg-rose-50/80 border-rose-100"
    }
  ];

  // Speech Recognition logic
  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-US";
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsRecording(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setFirstProblem(prev => prev ? prev + " " + transcript : transcript);
    };

    recognition.onerror = (err: any) => {
      console.error("Speech recognition error", err);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
  };

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    }
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (firstProblem.trim()) {
      onComplete(firstProblem);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-8">
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-white border border-orange-200/80 rounded-3xl shadow-2xl overflow-hidden flex flex-col justify-between min-h-[580px] relative"
        id="onboarding-card"
      >
        {/* Colorful Orange background mesh bubble */}
        <div className="absolute top-0 right-0 w-44 h-44 bg-orange-100 rounded-full blur-3xl opacity-50 -z-10" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-100 rounded-full blur-3xl opacity-50 -z-10" />

        {/* Header indicator */}
        <div className="px-6 pt-6 pb-2 flex items-center justify-between z-10">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-ping" />
            <span className="text-xs font-mono tracking-wider text-orange-600 font-extrabold uppercase">
              BEAT UP • ON AIR
            </span>
          </div>
          <div className="flex gap-1.5">
            {Array.from({ length: slides.length + 1 }).map((_, idx) => (
              <div 
                key={idx} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentSlide ? "w-6 bg-orange-500" : "w-1.5 bg-stone-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content Slides */}
        <div className="px-6 flex-grow flex flex-col justify-center py-4 z-10">
          <AnimatePresence mode="wait">
            {currentSlide < slides.length ? (
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="flex flex-col items-center text-center space-y-4"
              >
                <div className={`p-5 rounded-full border-2 ${slides[currentSlide].bg} mb-2 shadow-inner`}>
                  {slides[currentSlide].icon}
                </div>
                
                <span className="text-[10px] font-extrabold tracking-widest text-orange-600 uppercase bg-orange-50 border border-orange-200 px-2.5 py-0.5 rounded-full">
                  {slides[currentSlide].tagline}
                </span>

                <h2 className="text-2xl font-black tracking-tight text-stone-800">
                  {slides[currentSlide].title}
                </h2>

                <p className="text-stone-600 text-sm leading-relaxed max-w-[320px]">
                  {slides[currentSlide].description}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="input-slide"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="flex flex-col space-y-4"
              >
                <div className="text-center space-y-2 mb-2">
                  <div className="inline-flex items-center gap-1.5 text-xs text-orange-700 font-bold bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                    <Clock className="w-3.5 h-3.5 text-orange-500" />
                    <span>{timeGreeting}, Champion!</span>
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-stone-900">
                    What's your current track blocker?
                  </h2>
                  <p className="text-xs text-stone-500 max-w-[310px] mx-auto">
                    Narrate your goals, deadlines, or code limits out loud. Champ will compose a 3-tier Plan A/B/C mix!
                  </p>
                </div>

                <form onSubmit={handleStart} className="space-y-4">
                  <div className="relative">
                    <textarea
                      value={firstProblem}
                      onChange={(e) => setFirstProblem(e.target.value)}
                      placeholder="e.g., 'It's late afternoon, my backend is crash looping and I need to deploy in 3 hours. I feel so overwhelmed...'"
                      className="w-full min-h-[110px] p-4 text-sm bg-stone-50 border border-orange-100 rounded-2xl focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all outline-none resize-none placeholder:text-stone-400 font-sans"
                      id="first-problem-input"
                      required
                    />

                    {/* Microphone trigger button */}
                    <div className="absolute bottom-2.5 right-3.5 flex items-center gap-2">
                      {voiceSupported && (
                        <button
                          type="button"
                          onClick={startSpeechRecognition}
                          className={`p-2 rounded-full cursor-pointer transition ${
                            isRecording 
                              ? "bg-red-500 text-white animate-pulse" 
                              : "bg-orange-100 hover:bg-orange-200 text-orange-600"
                          }`}
                          title="Speak instead of typing!"
                        >
                          <Mic className="w-4 h-4" />
                        </button>
                      )}
                      <div className="flex items-center gap-1 bg-orange-50 border border-orange-100 rounded-lg px-2 py-1">
                        <Sparkles className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                        <span className="text-[9px] text-orange-700 font-mono font-bold">Mic Input Ready</span>
                      </div>
                    </div>
                  </div>

                  {isRecording && (
                    <div className="text-center">
                      <span className="text-xs text-red-600 font-bold animate-pulse">
                        🎙️ Recording voice track... Speak clearly now!
                      </span>
                    </div>
                  )}

                  {/* Quick Preset Buttons for better onboarding */}
                  <div className="flex flex-wrap gap-1.5 justify-center py-1">
                    <button
                      type="button"
                      onClick={() => setFirstProblem("It is morning, I need to write 1000 words about AI ethics by noon but my head is totally empty")}
                      className="text-xs text-stone-700 bg-orange-50 hover:bg-orange-100 border border-orange-100 px-2.5 py-1.5 rounded-xl transition cursor-pointer font-medium"
                    >
                      🌅 Morning Ethics Deadline
                    </button>
                    <button
                      type="button"
                      onClick={() => setFirstProblem("My React compiler says import errors in component styles, I'm stuck for 2 hours")}
                      className="text-xs text-stone-700 bg-orange-50 hover:bg-orange-100 border border-orange-100 px-2.5 py-1.5 rounded-xl transition cursor-pointer font-medium"
                    >
                      💻 Coding Beat Jam
                    </button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer controls */}
        <div className="p-6 bg-stone-50 border-t border-orange-50 flex items-center justify-between z-10">
          {currentSlide < slides.length ? (
            <>
              <button
                type="button"
                onClick={() => setCurrentSlide(slides.length)}
                className="text-xs font-bold text-stone-500 hover:text-orange-600 transition py-2 px-1 cursor-pointer"
              >
                Skip Intro
              </button>
              
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-1 bg-stone-900 hover:bg-orange-600 text-white font-bold text-xs py-2 px-4 rounded-xl shadow-md cursor-pointer transition"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setCurrentSlide(0)}
                className="text-xs font-bold text-stone-500 hover:text-orange-600 transition py-2 px-1 cursor-pointer"
              >
                Go Back
              </button>
              
              <button
                type="button"
                disabled={!firstProblem.trim()}
                onClick={handleStart}
                className={`flex items-center gap-1.5 text-xs font-black py-2.5 px-5 rounded-xl shadow-md transition ${
                  firstProblem.trim() 
                    ? "bg-orange-500 hover:bg-orange-600 text-white cursor-pointer" 
                    : "bg-stone-200 text-stone-400 cursor-not-allowed"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Begin Tracking Mission</span>
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
