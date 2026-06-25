import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Sparkles, Music, Activity } from "lucide-react";

interface AudioVisualizerProps {
  tempoBpm: number;
  category?: string;
}

export default function AudioVisualizer({ tempoBpm = 95, category = "blocker" }: AudioVisualizerProps) {
  const [bars, setBars] = useState<number[]>([]);

  // Generate 24 randomized bar heights for the visualizer
  useEffect(() => {
    const arr = Array.from({ length: 24 }, () => Math.floor(Math.random() * 80) + 20);
    setBars(arr);
    
    // Periodically fluctuate heights to look like real audio analysis
    const interval = setInterval(() => {
      setBars(prev => prev.map(h => {
        const offset = Math.floor(Math.random() * 30) - 15;
        return Math.min(Math.max(h + offset, 15), 100);
      }));
    }, 150);

    return () => clearInterval(interval);
  }, []);

  // Determine animation speed based on tempo BPM
  const animationDuration = `${Math.max(0.4, (60 / tempoBpm) * 0.8)}s`;

  // Determine visualizer brand gradient color schemes
  const barColors = [
    "bg-pink-500 shadow-pink-200",
    "bg-orange-500 shadow-orange-200",
    "bg-pink-400 shadow-pink-100",
    "bg-orange-400 shadow-orange-100",
    "bg-white shadow-stone-100 border border-pink-200"
  ];

  return (
    <div className="bg-gradient-to-br from-stone-900 to-stone-950 text-white rounded-3xl p-5 shadow-xl border-2 border-pink-500/30 relative overflow-hidden space-y-4" id="audio-visualizer">
      {/* Background neon glows */}
      <div className="absolute -left-10 -top-10 w-28 h-28 bg-pink-500/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -right-10 -bottom-10 w-28 h-28 bg-orange-500/20 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-ping" />
          <span className="text-[10px] font-mono font-black text-pink-400 tracking-wider uppercase flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 inline text-pink-500" />
            LIVE BEAT TUNER
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold bg-white/10 px-2 py-0.5 rounded-full text-pink-200">
          🔥 {tempoBpm} BPM RHYTHM
        </span>
      </div>

      {/* Dancing Waves Container */}
      <div className="h-24 flex items-end justify-between px-2 bg-stone-900/50 rounded-2xl border border-white/5 py-3 relative overflow-hidden">
        {/* Waving colors background filter */}
        <div className="absolute inset-0 bg-gradient-to-t from-pink-500/5 via-orange-500/5 to-transparent pointer-events-none" />
        
        {bars.map((height, idx) => {
          const colorClass = barColors[idx % barColors.length];
          return (
            <motion.div
              key={idx}
              animate={{ height: `${height}%` }}
              transition={{
                duration: Math.max(0.2, (60 / tempoBpm) * (0.5 + (idx % 3) * 0.1)),
                repeat: Infinity,
                repeatType: "reverse",
                ease: "easeInOut"
              }}
              className={`w-1.5 rounded-full ${colorClass} transition-all duration-150 shadow-sm`}
              style={{ maxHeight: "100%" }}
            />
          );
        })}
      </div>

      <div className="flex items-center justify-between text-[11px] font-medium text-stone-300">
        <span className="flex items-center gap-1 font-mono text-[10px] text-pink-300">
          <Music className="w-3.5 h-3.5" />
          Beat Track: {category.toUpperCase()} DRILL
        </span>
        <span className="text-stone-400 font-bold italic">"Beat one level up"</span>
      </div>
    </div>
  );
}
