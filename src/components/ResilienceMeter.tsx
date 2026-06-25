import { motion } from "motion/react";
import { Zap, Flame, Award, ShieldAlert, Sparkles, Disc, Radio, Music } from "lucide-react";
import { UserProfile } from "../types";

interface ResilienceMeterProps {
  profile: UserProfile;
}

export default function ResilienceMeter({ profile }: ResilienceMeterProps) {
  // DJ/Rhythm level designations
  const levelNames = [
    "Rhythm Rookie 🎵",
    "Kick Drum Cadet 🥁",
    "Synthesizer Contender 🎹",
    "Tempo Specialist ⚡",
    "Master Remixer 🎚️",
    "Platinum DJ Headliner 👑"
  ];

  const currentLevelName = levelNames[Math.min(profile.level - 1, levelNames.length - 1)] || "Platinum DJ Headliner 👑";
  
  // Calculate level progress
  const xpForCurrentLevel = (profile.level - 1) * 200;
  const xpForNextLevel = profile.level * 200;
  const xpProgressInLevel = profile.xp - xpForCurrentLevel;
  const xpPercentage = Math.min(Math.max((xpProgressInLevel / 200) * 100, 0), 100);

  // Sound Energy state with pink/orange tones
  let energyColor = "bg-gradient-to-r from-pink-500 to-orange-500 shadow-pink-200 animate-pulse";
  let energyText = "Overheated / Sluggish 💤";
  if (profile.energy > 75) {
    energyColor = "bg-gradient-to-r from-pink-500 to-orange-500 shadow-pink-300 animate-pulse";
    energyText = "Overdriven Focus Mode 🔊🔥";
  } else if (profile.energy > 40) {
    energyColor = "bg-gradient-to-r from-pink-400 to-orange-400 shadow-pink-100";
    energyText = "Synthed Up & Stable ⚡";
  } else if (profile.energy > 15) {
    energyColor = "bg-gradient-to-r from-pink-300 to-orange-300 shadow-pink-100";
    energyText = "Tempo Dropping ⚠️";
  }

  return (
    <div className="w-full space-y-4" id="resilience-dashboard">
      {/* Mini Profile Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Consecutive Jams */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white border-2 border-pink-100 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden"
          id="streak-box"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-orange-500" />
          <Flame className="w-5 h-5 text-pink-500 animate-bounce mb-1" />
          <span className="text-[9px] font-mono text-pink-600 font-bold uppercase tracking-wider">
            Jam Streak
          </span>
          <span className="text-base font-black text-stone-800">
            {profile.streak} {profile.streak === 1 ? "Day" : "Days"}
          </span>
        </motion.div>

        {/* Level Box */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white border-2 border-pink-100 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden animate-fade-in"
          id="level-box"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-orange-500" />
          <Disc className="w-5 h-5 text-pink-500 mb-1 animate-spin" style={{ animationDuration: '6s' }} />
          <span className="text-[9px] font-mono text-pink-600 font-bold uppercase tracking-wider">
            Lvl {profile.level}
          </span>
          <span className="text-[10px] font-black text-stone-800 truncate w-full px-1">
            {currentLevelName}
          </span>
        </motion.div>

        {/* Beats Conquered Box */}
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-white border-2 border-pink-100 rounded-2xl p-3 flex flex-col items-center justify-center text-center shadow-sm relative overflow-hidden"
          id="xp-box"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-orange-500" />
          <Music className="w-5 h-5 text-pink-500 mb-1" />
          <span className="text-[9px] font-mono text-pink-600 font-bold uppercase tracking-wider">
            Beats Mastered
          </span>
          <span className="text-base font-black text-stone-800">
            {profile.totalBeatsConquered || 0}
          </span>
        </motion.div>
      </div>

      {/* Mission Energy & XP level progresses */}
      <div className="bg-white border-2 border-pink-100 rounded-2xl p-4 shadow-sm space-y-4 relative overflow-hidden">
        
        {/* Dynamic Sound Energy Meter */}
        <div className="space-y-1.5" id="energy-meter-section">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Radio className="w-4 h-4 text-pink-500 animate-pulse" />
              <span className="text-xs font-black text-stone-800">MIXER AUDIO LEVEL (ENERGY)</span>
            </div>
            <span className="text-[9px] font-mono font-bold text-pink-700 px-2.5 py-0.5 rounded-full bg-pink-50 border border-pink-100">
              {energyText} ({profile.energy}%)
            </span>
          </div>

          <div className="w-full bg-stone-100 h-4 rounded-full overflow-hidden p-[2px] border border-pink-100/50">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${profile.energy}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className={`h-full rounded-full ${energyColor} transition-all duration-300 relative shadow-inner`}
            >
              <div className="absolute inset-0 bg-linear-to-r from-white/20 to-transparent animate-pulse" />
            </motion.div>
          </div>
          <p className="text-[9.5px] text-stone-500 italic">
            *Conquering sub-beats charges the level (+10%), complete training drills to drop the ultimate mix (+30%)!
          </p>
        </div>

        {/* XP Level Progress Bar */}
        <div className="space-y-1.5 border-t border-stone-100 pt-3" id="xp-progress-section">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-stone-700">TRACK TO LEVEL {profile.level + 1} PROGRESS</span>
            <span className="text-xs font-mono font-bold text-stone-500">
              {xpProgressInLevel} / 200 XP
            </span>
          </div>

          <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${xpPercentage}%` }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-r from-pink-500 to-orange-500 h-full rounded-full"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
