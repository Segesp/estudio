export interface Flashcard {
  id: string;
  front: string;
  back: string;
  deckId: string;
  lastReviewed: string | null;
  nextReviewDate: string; 
  lastElaboration?: string; // For user's notes during review

  // SM-2 specific fields with Anki enhancements
  tags: string[];
  qualityHistory: { 
    date: string; 
    quality: number; 
    interval?: number; 
    easiness?: number;
    isLearning?: boolean; // Track if card was in learning phase
  }[]; // Enhanced quality history with learning state tracking
  easiness: number; // difficulty factor, typically starts at 2.5
  repetitions: number; // number of times this card has been successfully graduated (not learning steps)
  interval: number; // The interval in days until the next review (supports fractional days for learning)
  
  // Anki-style learning phase fields
  isLearning?: boolean; // Whether card is in learning phase (new or lapsed)
  currentLearningStep?: number; // Current step in learning sequence (0-based)
  
  // Campos para optimización de la curva del olvido
  difficulty?: 'easy' | 'medium' | 'hard';
  section?: string;
  cognitiveLevel?: 'recognition' | 'comprehension' | 'application' | 'analysis' | 'synthesis' | 'evaluation';
  forgettingCurveOptimized?: boolean;
  cardType?: 'open_ended' | 'multiple_choice' | 'fill_in_blank';
  choices?: string[]; // Para tarjetas de opción múltiple
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
