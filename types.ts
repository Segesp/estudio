
export interface Flashcard {
  id: string;
  front: string;
  back: string;
  deckId: string;
  lastReviewed: string | null;
  nextReviewDate: string; 
  // interval: number; // in days // This will be managed by SM-2, keeping it
  // easeFactor: number; // for more advanced SM-2 like algo, simplified here // Will be replaced by 'easiness'
  lastElaboration?: string; // For user's notes during review

  // New SM-2 specific fields based on user spec
  tags: string[];
  qualityHistory: { date: string, quality: number }[]; // quality: 0-5
  easiness: number; // difficulty factor, typically starts at 2.5
  repetitions: number; // number of times this card has been successfully recalled (q >= 3)
  interval: number; // The interval in days until the next review
}

export interface Deck {
  id: string;
  name: string;
  createdAt: string;
}

export interface StudyStrategyInfo {
  id: string;
  title: string;
  summary: string;
  // details might be deprecated if all content moves to dedicated screens
  details?: string; // Kept for now, but its usage in LearnMoreScreen will change
  icon?: React.ReactElement<{ className?: string }>; 
  path: string; // Path to navigate to for this strategy
}

export interface Goal {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
}

export interface WellbeingTip {
  id: string;
  title: string;
  content: string;
  icon?: React.ReactNode;
}

// For Spaced Repetition Practice - Enhanced SM-2 Algorithm
export enum ReviewOutcome {
  AGAIN = 'AGAIN', // Complete failure - forgot entirely (SM-2 quality: 0)
  HARD = 'HARD',   // Difficult recall - remembered with significant effort (SM-2 quality: 2)
  GOOD = 'GOOD',   // Good recall - remembered correctly with minor hesitation (SM-2 quality: 4)
  EASY = 'EASY',   // Perfect recall - remembered effortlessly and quickly (SM-2 quality: 5)
}

export interface PomodoroSettings {
  workMinutes: number;
  shortBreakMinutes: number;
  longBreakMinutes: number; 
  sessionsBeforeLongBreak: number; 
}

export type Theme = 'light' | 'dark' | 'system';

export type SessionType = 'flashcards' | 'pomodoro';

export interface SessionReflection {
  id: string;
  date: string;
  text: string;
  sessionType: SessionType;
}

// New Types for Functional Strategy Screens
export interface ElaborationNote {
  id: string;
  title: string;
  content: string;
  createdAt: string;
}

export interface InterleavingPlan {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface DrawingPrompt {
  id: string;
  concept: string;
  notes?: string;
  imageUrl?: string; // URL to an externally hosted image
  createdAt: string;
}

export interface ScheduledEvent {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  description?: string;
  color?: string; // e.g., 'bg-red-500', 'bg-blue-500' for tailwind class
  createdAt: string;
}
