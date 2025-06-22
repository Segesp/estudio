import db, { StoredFlashcard, StoredEvent, StoredReflection, StudyGoal, AppSettings, StudySession, NotificationData } from './db';

// Exportar tipos para uso externo
export type { StoredFlashcard, StoredEvent, StoredReflection, StudyGoal, AppSettings, StudySession, NotificationData };

// Funciones genéricas para cualquier tabla
export async function upsert<T extends { id?: number }>(storeName: string, item: T): Promise<number> {
  const table = (db as any)[storeName];
  if (!table) throw new Error(`Store '${storeName}' no existe`);
  
  if (item.id) {
    await table.put(item);
    return item.id;
  } else {
    return await table.add(item);
  }
}

export async function get<T>(storeName: string, key: number): Promise<T | undefined> {
  const table = (db as any)[storeName];
  if (!table) throw new Error(`Store '${storeName}' no existe`);
  return await table.get(key);
}

export async function getAll<T>(storeName: string): Promise<T[]> {
  const table = (db as any)[storeName];
  if (!table) throw new Error(`Store '${storeName}' no existe`);
  return await table.toArray();
}

export async function remove(storeName: string, key: number): Promise<void> {
  const table = (db as any)[storeName];
  if (!table) throw new Error(`Store '${storeName}' no existe`);
  await table.delete(key);
}

export async function clear(storeName: string): Promise<void> {
  const table = (db as any)[storeName];
  if (!table) throw new Error(`Store '${storeName}' no existe`);
  await table.clear();
}

// Funciones específicas para Flashcards
export const flashcardAPI = {
  async create(flashcard: Omit<StoredFlashcard, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const now = Date.now();
    return await db.flashcards.add({
      ...flashcard,
      createdAt: now,
      updatedAt: now,
    });
  },

  async update(id: number, updates: Partial<StoredFlashcard>): Promise<void> {
    await db.flashcards.update(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },

  async getAll(): Promise<StoredFlashcard[]> {
    return await db.flashcards.toArray();
  },

  async get(id: number): Promise<StoredFlashcard | undefined> {
    return await db.flashcards.get(id);
  },

  async remove(id: number): Promise<void> {
    await db.flashcards.delete(id);
  },

  async getByDeck(deckId: string): Promise<StoredFlashcard[]> {
    return await db.flashcards.where('deckId').equals(deckId).toArray();
  },

  async getByTags(tags: string[]): Promise<StoredFlashcard[]> {
    return await db.flashcards.where('tags').anyOf(tags).toArray();
  },

  async getDue(date: Date = new Date()): Promise<StoredFlashcard[]> {
    const dateStr = date.toISOString().split('T')[0];
    return await db.flashcards.where('nextReviewDate').belowOrEqual(dateStr).toArray();
  },

  async search(query: string): Promise<StoredFlashcard[]> {
    const lowerQuery = query.toLowerCase();
    return await db.flashcards
      .filter(card => 
        card.front.toLowerCase().includes(lowerQuery) ||
        card.back.toLowerCase().includes(lowerQuery) ||
        card.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
      )
      .toArray();
  },

  async bulkCreate(flashcards: Omit<StoredFlashcard, 'id' | 'createdAt' | 'updatedAt'>[]): Promise<number[]> {
    const now = Date.now();
    const cardsWithTimestamps = flashcards.map(card => ({
      ...card,
      createdAt: now,
      updatedAt: now,
    }));
    
    return await db.transaction('rw', db.flashcards, async () => {
      const ids: number[] = [];
      for (const card of cardsWithTimestamps) {
        const id = await db.flashcards.add(card);
        ids.push(id);
      }
      return ids;
    });
  },
};

// Funciones específicas para Eventos
export const eventAPI = {
  async create(event: Omit<StoredEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const now = Date.now();
    return await db.events.add({
      ...event,
      createdAt: now,
      updatedAt: now,
    });
  },

  async update(id: number, updates: Partial<StoredEvent>): Promise<void> {
    await db.events.update(id, {
      ...updates,
      updatedAt: Date.now(),
    });
  },

  async getByDateRange(startDate: string, endDate: string): Promise<StoredEvent[]> {
    return await db.events
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray();
  },

  async getBySubject(subject: string): Promise<StoredEvent[]> {
    return await db.events.where('subject').equals(subject).toArray();
  },

  async getByTechnique(technique: string): Promise<StoredEvent[]> {
    return await db.events.where('technique').equals(technique).toArray();
  },
};

// Funciones para configuraciones
export const settingsAPI = {
  async set(key: string, value: any): Promise<void> {
    await db.settings.put({
      key,
      value,
      updatedAt: Date.now(),
    });
  },

  async get<T>(key: string, defaultValue?: T): Promise<T | undefined> {
    const setting = await db.settings.get(key);
    return setting ? setting.value : defaultValue;
  },

  async getAll(): Promise<Record<string, any>> {
    const settings = await db.settings.toArray();
    return settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, any>);
  },

  async remove(key: string): Promise<void> {
    await db.settings.delete(key);
  },
};

// Funciones para sesiones de estudio
export const studySessionAPI = {
  async create(session: Omit<StudySession, 'id' | 'createdAt'>): Promise<number> {
    return await db.studySessions.add({
      ...session,
      createdAt: Date.now(),
    });
  },

  async getByDateRange(startDate: string, endDate: string): Promise<StudySession[]> {
    return await db.studySessions
      .where('date')
      .between(startDate, endDate, true, true)
      .toArray();
  },

  async getByType(type: StudySession['type']): Promise<StudySession[]> {
    return await db.studySessions.where('type').equals(type).toArray();
  },

  async getTotalTimeBySubject(days: number = 30): Promise<Record<string, number>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];
    
    const sessions = await db.studySessions
      .where('date')
      .aboveOrEqual(startDateStr)
      .toArray();
    
    return sessions.reduce((acc, session) => {
      const subject = session.subject || 'Sin categoría';
      acc[subject] = (acc[subject] || 0) + session.duration;
      return acc;
    }, {} as Record<string, number>);
  },
};

// Funciones para notificaciones
export const notificationAPI = {
  async create(notification: Omit<NotificationData, 'id' | 'createdAt'>): Promise<number> {
    return await db.notifications.add({
      ...notification,
      createdAt: Date.now(),
    });
  },

  async markAsRead(id: number): Promise<void> {
    await db.notifications.update(id, { read: true });
  },

  async markAsDismissed(id: number): Promise<void> {
    await db.notifications.update(id, { dismissed: true });
  },

  async getActive(): Promise<NotificationData[]> {
    const now = Date.now();
    return await db.notifications
      .where('dismissed')
      .equals(0)
      .and(notification => !notification.expiresAt || notification.expiresAt > now)
      .toArray();
  },

  async cleanupExpired(): Promise<void> {
    const now = Date.now();
    await db.notifications
      .where('expiresAt')
      .below(now)
      .delete();
  },
};

// Función para importar/exportar datos
export const dataAPI = {
  async exportAll(): Promise<{
    flashcards: StoredFlashcard[];
    events: StoredEvent[];
    reflections: StoredReflection[];
    goals: StudyGoal[];
    settings: AppSettings[];
    studySessions: StudySession[];
    exportDate: string;
  }> {
    const [flashcards, events, reflections, goals, settings, studySessions] = await Promise.all([
      db.flashcards.toArray(),
      db.events.toArray(),
      db.reflections.toArray(),
      db.goals.toArray(),
      db.settings.toArray(),
      db.studySessions.toArray(),
    ]);

    return {
      flashcards,
      events,
      reflections,
      goals,
      settings,
      studySessions,
      exportDate: new Date().toISOString(),
    };
  },

  async importData(data: {
    flashcards?: StoredFlashcard[];
    events?: StoredEvent[];
    reflections?: StoredReflection[];
    goals?: StudyGoal[];
    settings?: AppSettings[];
    studySessions?: StudySession[];
  }): Promise<void> {
    await db.transaction('rw', [db.flashcards, db.events, db.reflections, db.goals, db.settings, db.studySessions], async () => {
      if (data.flashcards) await db.flashcards.bulkAdd(data.flashcards);
      if (data.events) await db.events.bulkAdd(data.events);
      if (data.reflections) await db.reflections.bulkAdd(data.reflections);
      if (data.goals) await db.goals.bulkAdd(data.goals);
      if (data.settings) await db.settings.bulkAdd(data.settings);
      if (data.studySessions) await db.studySessions.bulkAdd(data.studySessions);
    });
  },

  async clearAllData(): Promise<void> {
    await db.transaction('rw', [db.flashcards, db.events, db.reflections, db.goals, db.settings, db.studySessions, db.notifications], async () => {
      await Promise.all([
        db.flashcards.clear(),
        db.events.clear(),
        db.reflections.clear(),
        db.goals.clear(),
        db.settings.clear(),
        db.studySessions.clear(),
        db.notifications.clear(),
      ]);
    });
  },
};
