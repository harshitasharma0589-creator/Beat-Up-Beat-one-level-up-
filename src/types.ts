export type BlockerCategory = 'coding' | 'study' | 'deadline' | 'confusion' | 'blocker' | 'general';
export type BeatTimelineSegment = 'morning' | 'afternoon' | 'night' | 'anytime';
export type CoachMode = 'champ' | 'friend' | 'pro';


export interface SubTask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: BlockerCategory;
  timelineSegment: BeatTimelineSegment;
  isCompleted: boolean;
  isAiGenerated: boolean;
  subtasks: SubTask[];
  createdAt: string;
  dueDate?: string;
  reminderTime?: string; // User-set timely alert (e.g., '07:00', '09:00')
  deadlineTime?: string; // User-set target deadline (e.g., '10:00')
  reminder?: string; // Champ's smart coaching reminder for this specific task
  tempoBpm: number; // The speed required: 60-140 BPM
}

export interface BlockerAnalysis {
  id: string;
  timestamp: string;
  problemDescription: string;
  category: 'coding' | 'study' | 'deadline' | 'confusion' | 'blocker';
  rootCause: string;
  aiCoachResponse: string;
  solutionTitle: string;
  solutionSteps: string[];
  suggestedTasks: {
    title: string;
    description: string;
    timelineSegment: BeatTimelineSegment;
    subtasks: string[];
  }[];
  // Rhythm-themed Risk and Fallback Plans
  tempoBpm: number;
  riskOfFailure: 'low' | 'medium' | 'critical';
  failurePredictionMessage: string;
  planA: string; // The Perfect Track
  planB: string; // The Chill Remix
  planC: string; // The Bass Drop (Emergency Survival)
}

export interface UserProfile {
  xp: number;
  level: number;
  streak: number;
  lastActiveDate: string | null;
  energy: number; // 0-100 Mission Energy Meter
  totalBeatsConquered: number;
}

export interface ConversationMessage {
  sender: 'user' | 'champ';
  text: string;
  timestamp: string;
}
