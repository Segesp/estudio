import Dexie, { Table } from 'dexie';
import { Flashcard, ScheduledEvent, SessionReflection, PomodoroSettings } from '../types';

export interface StoredFlashcard extends Omit<Flashcard, 'id'> {
  id?: number;
  createdAt: number;
  updatedAt: number;
  studyStats?: {
    timesStudied: number;
    correctAnswers: number;
    lastStudied?: number;
    easeFactor: number;
    interval: number;
    repetitions: number;
  };
}

export interface StoredEvent extends Omit<ScheduledEvent, 'id' | 'createdAt'> {
  id?: number;
  createdAt: number;
  updatedAt: number;
}

export interface StoredReflection extends Omit<SessionReflection, 'id'> {
  id?: number;
}

export interface StudyGoal {
  id?: number;
  title: string;
  description?: string;
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  targetValue: number;
  currentValue: number;
  unit: string; // 'minutes', 'cards', 'sessions', etc.
  deadline?: string;
  isCompleted: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface AppSettings {
  key: string;
  value: any;
  updatedAt: number;
}

export interface StudySession {
  id?: number;
  date: string;
  type: 'flashcards' | 'pomodoro' | 'reading' | 'practice';
  duration: number; // en minutos
  subject?: string;
  notes?: string;
  performance?: number; // 1-5 rating
  createdAt: number;
}

export interface NotificationData {
  id?: number;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  read: boolean;
  dismissed: boolean;
  createdAt: number;
  expiresAt?: number;
  metadata?: any;
}

export class SenseDB extends Dexie {
  flashcards!: Table<StoredFlashcard>;
  events!: Table<StoredEvent>;
  reflections!: Table<StoredReflection>;
  goals!: Table<StudyGoal>;
  settings!: Table<AppSettings>;
  studySessions!: Table<StudySession>;
  notifications!: Table<NotificationData>;

  constructor() {
    super('SenseDB');
    
    // Versión 1: Esquema inicial
    this.version(1).stores({
      flashcards: '++id, createdAt, updatedAt, front, back, deckId, difficulty, *tags, studyStats.lastStudied',
      events: '++id, createdAt, updatedAt, title, date, startTime, endTime, type, technique, subject',
      reflections: '++id, date, sessionType, text',
      goals: '++id, createdAt, updatedAt, title, type, targetValue, currentValue, deadline, isCompleted',
      settings: 'key, updatedAt',
      studySessions: '++id, date, type, duration, subject, performance, createdAt',
      notifications: '++id, type, priority, category, read, dismissed, createdAt, expiresAt'
    });

    // Versión 2: Futuras mejoras (ejemplo)
    // this.version(2).stores({
    //   userProfiles: '++id, name, email, preferences',
    //   decks: '++id, name, description, flashcardIds'
    // });
  }
}

export const db = new SenseDB();

// Función para asegurar persistencia del almacenamiento
export async function ensurePersistence(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  try {
    if (navigator.storage?.persist) {
      const isPersisted = await navigator.storage.persist();
      console.log(
        isPersisted
          ? '✅ Almacenamiento persistente garantizado'
          : '⚠️ No se concedió storage persistente; los datos podrían borrarse en limpieza de caché'
      );
      return isPersisted;
    }
  } catch (error) {
    console.warn('Error al solicitar persistencia:', error);
  }
  
  return false;
}

// Función para monitorear el uso de almacenamiento
export async function getStorageInfo(): Promise<{usage: number; quota: number; usagePercent: number} | null> {
  if (typeof window === 'undefined') return null;
  
  try {
    if (navigator.storage?.estimate) {
      const { usage = 0, quota = 0 } = await navigator.storage.estimate();
      const usagePercent = quota > 0 ? (usage / quota) * 100 : 0;
      
      console.log(`📊 Uso del almacenamiento: ${(usage / 1024 / 1024).toFixed(2)} MB de ${(quota / 1024 / 1024).toFixed(2)} MB (${usagePercent.toFixed(1)}%)`);
      
      return { usage, quota, usagePercent };
    }
  } catch (error) {
    console.warn('Error al obtener información de almacenamiento:', error);
  }
  
  return null;
}

export default db;
