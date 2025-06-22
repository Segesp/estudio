import { ScheduledEvent, Flashcard } from '../types';
import { generateStudyRecommendations } from './intelligentScheduler';

export interface StudyNotification {
  id: string;
  type: 'reminder' | 'pomodoro_start' | 'pomodoro_break' | 'pomodoro_long_break' | 'spacing_review' | 'optimization_tip' | 'daily_summary' | 'weekly_goals' | 'streak_celebration' | 'technique_suggestion' | 'energy_optimization';
  title: string;
  message: string;
  scheduledFor: Date;
  eventId?: string;
  priority: 'low' | 'medium' | 'high';
  dismissed: boolean;
  createdAt: Date;
  actionUrl?: string; // URL para navegación directa
  category: 'session' | 'study' | 'wellness' | 'achievement' | 'optimization';
  frequency?: 'once' | 'daily' | 'weekly'; // Para evitar spam
  lastShown?: Date;
  conditions?: {
    minTimeSinceLastNotification?: number; // minutos
    maxNotificationsPerDay?: number;
    onlyIfUserActive?: boolean;
  };
}

export interface NotificationSettings {
  enabled: boolean;
  studyReminders: boolean;
  pomodoroAlerts: boolean;
  spacingReviews: boolean;
  dailySummary: boolean;
  achievements: boolean;
  optimizationTips: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM
    end: string; // HH:MM
  };
  preferredReminderTime: number; // minutos antes del evento
}

export interface PomodoroSession {
  eventId: string;
  currentSession: number;
  totalSessions: number;
  workMinutes: number;
  breakMinutes: number;
  longBreakMinutes: number;
  isWorking: boolean;
  isOnBreak: boolean;
  startTime: Date;
  endTime: Date;
  remainingTime: number;
}

// Configuraciones por defecto para notificaciones
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  studyReminders: true,
  pomodoroAlerts: true,
  spacingReviews: true,
  dailySummary: true,
  achievements: true,
  optimizationTips: true,
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00'
  },
  preferredReminderTime: 15 // 15 minutos antes
};

// Verificar si estamos en horas de silencio
function isInQuietHours(dateTime: Date, quietHours: NotificationSettings['quietHours']): boolean {
  if (!quietHours.enabled) return false;
  
  const hour = dateTime.getHours();
  const minute = dateTime.getMinutes();
  const currentTime = hour * 60 + minute;
  
  const [startHour, startMinute] = quietHours.start.split(':').map(Number);
  const [endHour, endMinute] = quietHours.end.split(':').map(Number);
  
  const startTime = startHour * 60 + startMinute;
  const endTime = endHour * 60 + endMinute;
  
  // Manejar horarios que cruzan medianoche
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime <= endTime;
  }
  
  return currentTime >= startTime && currentTime <= endTime;
}

// Verificar si ya hay una notificación reciente del mismo tipo
function hasRecentNotification(
  notifications: StudyNotification[], 
  notificationId: string, 
  withinMinutes: number
): boolean {
  const cutoffTime = new Date(Date.now() - withinMinutes * 60 * 1000);
  return notifications.some(n => 
    n.id === notificationId && 
    n.createdAt > cutoffTime && 
    !n.dismissed
  );
}

// Generar mensaje personalizado según la técnica
function getTechniqueSpecificReminder(event: ScheduledEvent): string {
  const baseMessage = `"${event.title}" comienza en ${DEFAULT_NOTIFICATION_SETTINGS.preferredReminderTime} minutos (${event.startTime})`;
  
  const techniqueMessages = {
    spacing: `🔄 ${baseMessage}\n¡Perfecto momento para el repaso espaciado!`,
    interleaving: `🔀 ${baseMessage}\nPrepárate para alternar entre temas.`,
    elaboration: `✏️ ${baseMessage}\nTiempo de conectar ideas y crear comprensión profunda.`,
    retrieval: `🧠 ${baseMessage}\nPón a prueba tu memoria. ¡Sin mirar las notas!`,
    drawing: `🖼️ ${baseMessage}\nVisualiza y dibuja para mejor comprensión.`,
    pomodoro: `🍅 ${baseMessage}\nSesión de trabajo enfocado te espera.`,
    mixed: `🎯 ${baseMessage}\nSesión variada para máximo aprendizaje.`
  };
  
  return techniqueMessages[event.technique || 'spacing'] || baseMessage;
}

// Generar notificaciones automáticas para eventos con configuraciones inteligentes
export function generateEventNotifications(
  events: ScheduledEvent[], 
  settings: NotificationSettings,
  existingNotifications: StudyNotification[] = []
): StudyNotification[] {
  const notifications: StudyNotification[] = [];
  const now = new Date();

  if (!settings.enabled) return notifications;

  events.forEach(event => {
    const eventDateTime = new Date(`${event.date}T${event.startTime}`);
    
    // Verificar si estamos en horas de silencio
    if (isInQuietHours(eventDateTime, settings.quietHours)) {
      return;
    }

    // Notificación de recordatorio personalizable
    if (settings.studyReminders) {
      const reminderTime = new Date(eventDateTime.getTime() - settings.preferredReminderTime * 60 * 1000);
      
      if (reminderTime > now && !hasRecentNotification(existingNotifications, `reminder-${event.id}`, 30)) {
        notifications.push({
          id: `reminder-${event.id}`,
          type: 'reminder',
          title: '📚 Sesión de Estudio Próxima',
          message: getTechniqueSpecificReminder(event),
          scheduledFor: reminderTime,
          eventId: event.id,
          priority: event.technique === 'spacing' && event.isOptimalSpacing ? 'high' : 'medium',
          dismissed: false,
          createdAt: now,
          category: 'session',
          actionUrl: '/calendar',
          frequency: 'once',
          conditions: {
            minTimeSinceLastNotification: 30,
            maxNotificationsPerDay: 10,
            onlyIfUserActive: true
          }
        });
      }
    }

    // Notificación especial para repaso espaciado
    if (settings.spacingReviews && event.technique === 'spacing' && event.isOptimalSpacing) {
      const spacingReminderTime = new Date(eventDateTime.getTime() - 2 * 60 * 60 * 1000);
      
      if (spacingReminderTime > now && !hasRecentNotification(existingNotifications, `spacing-${event.id}`, 120)) {
        notifications.push({
          id: `spacing-${event.id}`,
          type: 'spacing_review',
          title: '⭐ Ventana Óptima de Repaso',
          message: `Es el momento perfecto para repasar "${event.title}". ¡La ciencia dice que es ahora o nunca! 🧠`,
          scheduledFor: spacingReminderTime,
          eventId: event.id,
          priority: 'high',
          dismissed: false,
          createdAt: now,
          category: 'study',
          actionUrl: '/calendar',
          frequency: 'once',
          conditions: {
            minTimeSinceLastNotification: 120,
            maxNotificationsPerDay: 3
          }
        });
      }
    }

    // Generar notificaciones de Pomodoro si están configuradas
    if (settings.pomodoroAlerts && event.pomodoroSettings && eventDateTime > now) {
      const pomodoroNotifications = generatePomodoroNotifications(event, eventDateTime, settings);
      notifications.push(...pomodoroNotifications);
    }
  });

  return notifications;
}

// Generar notificaciones específicas para sesiones Pomodoro
function generatePomodoroNotifications(
  event: ScheduledEvent, 
  startTime: Date, 
  settings?: NotificationSettings
): StudyNotification[] {
  const notifications: StudyNotification[] = [];
  
  if (!event.pomodoroSettings) return notifications;

  const { workMinutes, breakMinutes, longBreakMinutes, sessionsCount, longBreakInterval } = event.pomodoroSettings;
  let currentTime = new Date(startTime);

  for (let session = 1; session <= sessionsCount; session++) {
    // Notificación de inicio de sesión de trabajo
    notifications.push({
      id: `pomodoro-start-${event.id}-${session}`,
      type: 'pomodoro_start',
      title: `🍅 Pomodoro ${session}/${sessionsCount}`,
      message: getMotivationalPomodoroMessage(session, sessionsCount, event.title, workMinutes),
      scheduledFor: new Date(currentTime),
      eventId: event.id,
      priority: 'medium',
      dismissed: false,
      createdAt: new Date(),
      category: 'session',
      actionUrl: '/pomodoro',
      frequency: 'once'
    });

    // Avanzar el tiempo de trabajo
    currentTime = new Date(currentTime.getTime() + workMinutes * 60 * 1000);

    // Determinar tipo de descanso
    const isLongBreak = session % (longBreakInterval || 4) === 0 && session < sessionsCount;
    const breakDuration = isLongBreak ? longBreakMinutes : breakMinutes;
    const breakType = isLongBreak ? 'pomodoro_long_break' : 'pomodoro_break';

    if (session < sessionsCount) {
      // Notificación de descanso
      notifications.push({
        id: `pomodoro-break-${event.id}-${session}`,
        type: breakType,
        title: isLongBreak ? '🍅 Descanso Largo' : '🍅 Descanso Corto',
        message: getBreakActivitySuggestion(isLongBreak, breakDuration),
        scheduledFor: new Date(currentTime),
        eventId: event.id,
        priority: 'low',
        dismissed: false,
        createdAt: new Date(),
        category: 'wellness',
        actionUrl: '/wellbeing',
        frequency: 'once'
      });

      // Avanzar el tiempo de descanso
      currentTime = new Date(currentTime.getTime() + breakDuration * 60 * 1000);
    }
  }

  return notifications;
}

// Mensajes motivacionales para Pomodoro
function getMotivationalPomodoroMessage(session: number, total: number, title: string, duration: number): string {
  const motivationalMessages = [
    `¡Comienza tu sesión de trabajo de ${duration} minutos para "${title}"! 💪`,
    `Sesión ${session} de ${total}: ¡Mantén el ritmo! 🚀`,
    `¡A por la sesión ${session}! Tu mente está preparada para el éxito 🧠`,
    `Sesión ${session}/${total}: ¡Cada pomodoro te acerca más a tu meta! 🎯`,
    `¡Hora de concentrarse! Sesión ${session} de "${title}" comienza ahora 🔥`
  ];
  
  return motivationalMessages[Math.min(session - 1, motivationalMessages.length - 1)];
}

// Sugerencias de actividades para descansos
function getBreakActivitySuggestion(isLongBreak: boolean, duration: number): string {
  const shortBreakActivities = [
    `¡Tiempo de descanso! ${duration} minutos para estirar y relajar la vista 👀`,
    `Descanso de ${duration} min: camina un poco o haz respiración profunda 🌬️`,
    `${duration} minutos de pausa: hidrata y estira el cuello 💧`,
    `Descanso corto: mira algo lejano y relaja los ojos 🌅`
  ];
  
  const longBreakActivities = [
    `¡Descanso largo de ${duration} minutos! Tiempo para caminar al aire libre 🚶‍♂️`,
    `${duration} min de descanso: perfecto para una merienda saludable 🍎`,
    `Descanso largo: haz ejercicios de estiramiento o yoga suave 🧘‍♀️`,
    `${duration} minutos libres: socializa o haz algo que disfrutes 😊`
  ];
  
  const activities = isLongBreak ? longBreakActivities : shortBreakActivities;
  return activities[Math.floor(Math.random() * activities.length)];
}

// Generar recomendaciones inteligentes basadas en patrones
export function generateSmartRecommendations(
  events: ScheduledEvent[],
  completedEvents: ScheduledEvent[]
): StudyNotification[] {
  const recommendations: StudyNotification[] = [];
  const now = new Date();

  // Detectar patrones de productividad
  const productivityAnalysis = analyzeProductivityPatterns(completedEvents);
  
  // Recomendación sobre el mejor horario
  if (productivityAnalysis.bestTimeSlot && productivityAnalysis.confidence > 0.7) {
    const upcomingEvents = events.filter(e => new Date(`${e.date}T${e.startTime}`) > now);
    const suboptimalEvents = upcomingEvents.filter(e => 
      e.idealTimeSlot !== productivityAnalysis.bestTimeSlot
    );

    if (suboptimalEvents.length > 0) {
      recommendations.push({
        id: `time-optimization-${Date.now()}`,
        type: 'optimization_tip',
        title: '⏰ Optimización de Horario',
        message: `Rindes mejor en ${productivityAnalysis.bestTimeSlot}. Considera mover algunas sesiones a ese horario.`,
        scheduledFor: now,
        priority: 'low',
        dismissed: false,
        createdAt: now,
        category: 'optimization',
        actionUrl: '/calendar',
        frequency: 'weekly'
      });
    }
  }

  // Recomendación sobre balance de técnicas
  const techniqueBalance = analyzeTechniqueBalance(events);
  if (techniqueBalance.needsBalancing && techniqueBalance.suggestions) {
    recommendations.push({
      id: `technique-balance-${Date.now()}`,
      type: 'optimization_tip',
      title: '🧠 Balance de Técnicas',
      message: `Estás usando mucho "${techniqueBalance.overusedTechnique}". Intenta variar con ${techniqueBalance.suggestions.join(', ')}.`,
      scheduledFor: now,
      priority: 'low',
      dismissed: false,
      createdAt: now,
      category: 'optimization',
      actionUrl: '/strategies',
      frequency: 'weekly'
    });
  }

  // Detectar sobrecarga cognitiva
  const cognitiveOverload = detectCognitiveOverload(events);
  if (cognitiveOverload.isOverloaded) {
    recommendations.push({
      id: `cognitive-overload-${Date.now()}`,
      type: 'optimization_tip',
      title: '⚡ Carga Cognitiva Alta',
      message: `Tienes ${cognitiveOverload.highLoadSessions} sesiones de alta carga en ${cognitiveOverload.period}. Considera redistribuir algunas.`,
      scheduledFor: now,
      priority: 'medium',
      dismissed: false,
      createdAt: now,
      category: 'optimization',
      actionUrl: '/calendar',
      frequency: 'weekly'
    });
  }

  return recommendations;
}

// Analizar patrones de productividad
function analyzeProductivityPatterns(completedEvents: ScheduledEvent[]) {
  const timeSlotPerformance: { [slot: string]: { total: number; count: number } } = {};

  completedEvents.forEach(event => {
    if (event.idealTimeSlot && event.performanceRating) {
      if (!timeSlotPerformance[event.idealTimeSlot]) {
        timeSlotPerformance[event.idealTimeSlot] = { total: 0, count: 0 };
      }
      timeSlotPerformance[event.idealTimeSlot].total += event.performanceRating;
      timeSlotPerformance[event.idealTimeSlot].count++;
    }
  });

  let bestTimeSlot = '';
  let bestAverage = 0;
  let confidence = 0;

  Object.entries(timeSlotPerformance).forEach(([slot, data]) => {
    const average = data.total / data.count;
    if (average > bestAverage && data.count >= 3) { // Mínimo 3 sesiones para confianza
      bestTimeSlot = slot;
      bestAverage = average;
      confidence = Math.min(data.count / 10, 1); // Máximo confianza con 10+ sesiones
    }
  });

  return {
    bestTimeSlot,
    bestAverage,
    confidence
  };
}

// Analizar balance de técnicas
function analyzeTechniqueBalance(events: ScheduledEvent[]) {
  const recentEvents = events.filter(e => {
    const eventDate = new Date(e.date);
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return eventDate >= weekAgo;
  });

  const techniqueCount: { [technique: string]: number } = {};
  recentEvents.forEach(event => {
    if (event.technique) {
      techniqueCount[event.technique] = (techniqueCount[event.technique] || 0) + 1;
    }
  });

  const totalSessions = recentEvents.length;
  const techniques = Object.keys(techniqueCount);
  
  if (techniques.length === 0) return { needsBalancing: false };

  // Detectar técnica sobreutilizada (>60% del tiempo)
  const overusedTechnique = techniques.find(tech => 
    (techniqueCount[tech] / totalSessions) > 0.6
  );

  if (overusedTechnique) {
    const underutilizedTechniques = ['spacing', 'interleaving', 'elaboration', 'retrieval', 'drawing']
      .filter(tech => !techniqueCount[tech] || techniqueCount[tech] < 2);

    return {
      needsBalancing: true,
      overusedTechnique,
      suggestions: underutilizedTechniques.slice(0, 2)
    };
  }

  return { needsBalancing: false };
}

// Detectar sobrecarga cognitiva
function detectCognitiveOverload(events: ScheduledEvent[]) {
  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Verificar hoy
  const todayEvents = events.filter(e => e.date === today);
  const todayHighLoad = todayEvents.filter(e => e.cognitiveLoad === 'high').length;

  if (todayHighLoad > 2) {
    return {
      isOverloaded: true,
      highLoadSessions: todayHighLoad,
      period: 'hoy'
    };
  }

  // Verificar mañana
  const tomorrowEvents = events.filter(e => e.date === tomorrow);
  const tomorrowHighLoad = tomorrowEvents.filter(e => e.cognitiveLoad === 'high').length;

  if (tomorrowHighLoad > 3) {
    return {
      isOverloaded: true,
      highLoadSessions: tomorrowHighLoad,
      period: 'mañana'
    };
  }

  return { isOverloaded: false };
}

// Sistema de manejo de notificaciones en tiempo real
export class NotificationManager {
  private notifications: StudyNotification[] = [];
  private activeTimers: Map<string, NodeJS.Timeout> = new Map();
  private callbacks: Array<(notification: StudyNotification) => void> = [];

  constructor() {
    this.checkPendingNotifications();
    // Verificar cada minuto por notificaciones pendientes
    setInterval(() => this.checkPendingNotifications(), 60000);
  }

  // Agregar callback para cuando se dispare una notificación
  onNotification(callback: (notification: StudyNotification) => void) {
    this.callbacks.push(callback);
  }

  // Programar notificaciones
  scheduleNotifications(notifications: StudyNotification[]) {
    notifications.forEach(notification => {
      this.scheduleNotification(notification);
    });
  }

  private scheduleNotification(notification: StudyNotification) {
    if (notification.dismissed) return;

    const now = new Date();
    const delay = notification.scheduledFor.getTime() - now.getTime();

    if (delay <= 0) {
      // Disparar inmediatamente si ya es hora
      this.fireNotification(notification);
    } else if (delay <= 24 * 60 * 60 * 1000) { // Solo programar para las próximas 24 horas
      const timer = setTimeout(() => {
        this.fireNotification(notification);
      }, delay);

      this.activeTimers.set(notification.id, timer);
    }

    this.notifications.push(notification);
  }

  private fireNotification(notification: StudyNotification) {
    // Ejecutar callbacks
    this.callbacks.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error en callback de notificación:', error);
      }
    });

    // Mostrar notificación del navegador si está permitido
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id
      });
    }

    // Limpiar timer
    this.activeTimers.delete(notification.id);
  }

  private checkPendingNotifications() {
    const now = new Date();
    this.notifications
      .filter(n => !n.dismissed && n.scheduledFor <= now)
      .forEach(notification => {
        this.fireNotification(notification);
      });
  }

  // Descartar notificación
  dismissNotification(notificationId: string) {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.dismissed = true;
      
      // Cancelar timer si existe
      const timer = this.activeTimers.get(notificationId);
      if (timer) {
        clearTimeout(timer);
        this.activeTimers.delete(notificationId);
      }
    }
  }

  // Obtener notificaciones activas
  getActiveNotifications(): StudyNotification[] {
    return this.notifications.filter(n => !n.dismissed);
  }

  // Limpiar todas las notificaciones
  clearAll() {
    this.activeTimers.forEach(timer => clearTimeout(timer));
    this.activeTimers.clear();
    this.notifications = [];
  }

  // Solicitar permisos de notificación
  static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
}

// Instancia global del manejador de notificaciones
export const notificationManager = new NotificationManager();

// Generar notificaciones de bienestar y motivación
export function generateWellnessNotifications(
  events: ScheduledEvent[],
  settings: NotificationSettings
): StudyNotification[] {
  const notifications: StudyNotification[] = [];
  const now = new Date();

  if (!settings.enabled) return notifications;

  // Recordatorio de hidratación durante sesiones largas
  const longSessions = events.filter(e => {
    const eventDate = new Date(`${e.date}T${e.startTime}`);
    const endTime = new Date(`${e.date}T${e.endTime}`);
    const duration = (endTime.getTime() - eventDate.getTime()) / (1000 * 60);
    return duration > 60 && eventDate > now;
  });

  longSessions.forEach(event => {
    const eventDateTime = new Date(`${event.date}T${event.startTime}`);
    const hydroTime = new Date(eventDateTime.getTime() + 30 * 60 * 1000); // 30 min después de empezar

    notifications.push({
      id: `hydration-${event.id}`,
      type: 'energy_optimization',
      title: '💧 Recordatorio de Hidratación',
      message: '¡Recuerda tomar agua! Tu cerebro funciona mejor hidratado.',
      scheduledFor: hydroTime,
      eventId: event.id,
      priority: 'low',
      dismissed: false,
      createdAt: now,
      category: 'wellness',
      frequency: 'once'
    });
  });

  return notifications;
}

// Generar notificaciones de logros y celebraciones
export function generateAchievementNotifications(
  completedEvents: ScheduledEvent[],
  settings: NotificationSettings
): StudyNotification[] {
  const notifications: StudyNotification[] = [];
  const now = new Date();

  if (!settings.achievements) return notifications;

  // Calcular racha de días consecutivos
  const streak = calculateStudyStreak(completedEvents);
  
  // Celebrar hitos de racha
  const streakMilestones = [3, 7, 14, 30, 60, 100];
  if (streakMilestones.includes(streak)) {
    notifications.push({
      id: `streak-${streak}-${Date.now()}`,
      type: 'streak_celebration',
      title: `🔥 ¡${streak} Días de Racha!`,
      message: getStreakCelebrationMessage(streak),
      scheduledFor: now,
      priority: 'high',
      dismissed: false,
      createdAt: now,
      category: 'achievement',
      frequency: 'once'
    });
  }

  // Celebrar completación de metas semanales
  const weeklyGoalProgress = calculateWeeklyGoalProgress(completedEvents);
  if (weeklyGoalProgress.completed && !weeklyGoalProgress.celebrated) {
    notifications.push({
      id: `weekly-goal-${Date.now()}`,
      type: 'weekly_goals',
      title: '🎯 ¡Meta Semanal Completada!',
      message: `¡Excelente! Has completado ${weeklyGoalProgress.sessionsCompleted} sesiones esta semana.`,
      scheduledFor: now,
      priority: 'medium',
      dismissed: false,
      createdAt: now,
      category: 'achievement',
      frequency: 'weekly'
    });
  }

  return notifications;
}

// Generar resumen diario inteligente
export function generateDailySummaryNotification(
  events: ScheduledEvent[],
  completedEvents: ScheduledEvent[],
  settings: NotificationSettings
): StudyNotification | null {
  if (!settings.dailySummary) return null;

  const today = new Date().toISOString().split('T')[0];
  const todayEvents = events.filter(e => e.date === today);
  const completedToday = completedEvents.filter(e => e.date === today && e.completed);

  if (todayEvents.length === 0) return null;

  const completionRate = (completedToday.length / todayEvents.length) * 100;
  const totalTime = completedToday.reduce((sum, event) => {
    const start = new Date(`${event.date}T${event.startTime}`);
    const end = new Date(`${event.date}T${event.endTime}`);
    return sum + (end.getTime() - start.getTime()) / (1000 * 60);
  }, 0);

  // Programar para las 8 PM
  const summaryTime = new Date();
  summaryTime.setHours(20, 0, 0, 0);

  return {
    id: `daily-summary-${today}`,
    type: 'daily_summary',
    title: '📊 Resumen del Día',
    message: generateDailySummaryMessage(completionRate, Math.round(totalTime), completedToday.length),
    scheduledFor: summaryTime,
    priority: 'low',
    dismissed: false,
    createdAt: new Date(),
    category: 'study',
    actionUrl: '/calendar',
    frequency: 'daily'
  };
}

// Funciones auxiliares para logros
function calculateStudyStreak(completedEvents: ScheduledEvent[]): number {
  const uniqueDates = [...new Set(completedEvents.map(e => e.date))].sort().reverse();
  let streak = 0;
  let currentDate = new Date();
  
  for (const dateStr of uniqueDates) {
    const eventDate = new Date(dateStr);
    const diffDays = Math.floor((currentDate.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === streak) {
      streak++;
      currentDate = eventDate;
    } else {
      break;
    }
  }
  
  return streak;
}

function calculateWeeklyGoalProgress(completedEvents: ScheduledEvent[]) {
  const weekStart = getWeekStart(new Date());
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  
  const thisWeekEvents = completedEvents.filter(e => {
    const eventDate = new Date(e.date);
    return eventDate >= weekStart && eventDate < weekEnd && e.completed;
  });
  
  const targetSessions = 5; // Meta semanal por defecto
  
  return {
    completed: thisWeekEvents.length >= targetSessions,
    sessionsCompleted: thisWeekEvents.length,
    targetSessions,
    celebrated: false // Esto debería venir del localStorage
  };
}

function getStreakCelebrationMessage(streak: number): string {
  const messages = {
    3: '¡Excelente inicio! La consistencia es la clave del éxito.',
    7: '¡Una semana completa! Tu disciplina está dando frutos.',
    14: '¡Dos semanas consecutivas! Estás desarrollando un hábito sólido.',
    30: '¡Un mes entero! Tu dedicación es inspiradora.',
    60: '¡Dos meses! Eres un ejemplo de perseverancia.',
    100: '¡100 días! Has alcanzado el nivel de maestría en constancia.'
  };
  
  return messages[streak as keyof typeof messages] || `¡${streak} días consecutivos! ¡Increíble dedicación!`;
}

function generateDailySummaryMessage(completionRate: number, totalMinutes: number, sessionsCount: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  
  if (completionRate >= 90) {
    return `🌟 ¡Día excelente! Completaste ${sessionsCount} sesiones (${timeStr}) con ${Math.round(completionRate)}% de éxito.`;
  } else if (completionRate >= 70) {
    return `👍 Buen día de estudio: ${sessionsCount} sesiones (${timeStr}). ¡Mantén el ritmo!`;
  } else if (completionRate >= 50) {
    return `📚 Día moderado: ${sessionsCount} sesiones (${timeStr}). Mañana puedes mejorar.`;
  } else {
    return `💪 Día desafiante, pero cada esfuerzo cuenta. ${sessionsCount} sesiones completadas.`;
  }
}

function getWeekStart(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? -6 : 1);
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

// Filtrar notificaciones para evitar spam
export function filterNotificationsForDisplay(
  notifications: StudyNotification[],
  settings: NotificationSettings
): StudyNotification[] {
  const now = new Date();
  
  return notifications.filter(notification => {
    // Verificar si está en horas de silencio
    if (isInQuietHours(notification.scheduledFor, settings.quietHours)) {
      return false;
    }
    
    // Verificar condiciones específicas
    if (notification.conditions) {
      const { minTimeSinceLastNotification, maxNotificationsPerDay } = notification.conditions;
      
      // Verificar tiempo mínimo desde última notificación
      if (minTimeSinceLastNotification) {
        const cutoff = new Date(now.getTime() - minTimeSinceLastNotification * 60 * 1000);
        const recentSimilar = notifications.filter(n => 
          n.type === notification.type && 
          n.createdAt > cutoff &&
          n.id !== notification.id
        );
        if (recentSimilar.length > 0) return false;
      }
      
      // Verificar máximo por día
      if (maxNotificationsPerDay) {
        const today = now.toISOString().split('T')[0];
        const todayNotifications = notifications.filter(n => 
          n.type === notification.type &&
          n.scheduledFor.toISOString().split('T')[0] === today
        );
        if (todayNotifications.length >= maxNotificationsPerDay) return false;
      }
    }
    
    return true;
  });
}

// Funciones auxiliares para crear notificaciones de Pomodoro individuales
export function createPomodoroStartNotification(sessionNumber: number, totalSessions: number, workMinutes: number): StudyNotification {
  return {
    id: `pomodoro-start-${Date.now()}`,
    type: 'pomodoro_start',
    title: `🍅 Sesión ${sessionNumber}`,
    message: getMotivationalPomodoroMessage(sessionNumber, totalSessions, 'Pomodoro', workMinutes),
    scheduledFor: new Date(),
    priority: 'medium',
    dismissed: false,
    createdAt: new Date(),
    category: 'session',
    actionUrl: '/pomodoro',
    frequency: 'once'
  };
}

export function createPomodoroBreakNotification(isLongBreak: boolean, breakMinutes: number): StudyNotification {
  return {
    id: `pomodoro-break-${Date.now()}`,
    type: isLongBreak ? 'pomodoro_long_break' : 'pomodoro_break',
    title: isLongBreak ? '🌿 Descanso Largo' : '☕ Descanso Corto',
    message: isLongBreak 
      ? `¡Excelente trabajo! Tómate un descanso largo de ${breakMinutes} minutos. Estira, camina o haz algo relajante.`
      : `¡Sesión completada! Toma un descanso corto de ${breakMinutes} minutos. Relájate y prepárate para la siguiente sesión.`,
    scheduledFor: new Date(),
    priority: 'medium',
    dismissed: false,
    createdAt: new Date(),
    category: 'session',
    actionUrl: '/pomodoro',
    frequency: 'once'
  };
}

export function createPomodoroWorkNotification(workMinutes: number): StudyNotification {
  return {
    id: `pomodoro-work-${Date.now()}`,
    type: 'pomodoro_start',
    title: '🎯 ¡Hora de trabajar!',
    message: `El descanso ha terminado. ¡Es hora de enfocarse durante ${workMinutes} minutos!`,
    scheduledFor: new Date(),
    priority: 'medium',
    dismissed: false,
    createdAt: new Date(),
    category: 'session',
    actionUrl: '/pomodoro',
    frequency: 'once'
  };
}

// Función para mostrar notificación del navegador si hay permisos
export function showBrowserNotification(notification: StudyNotification): void {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(notification.title, {
      body: notification.message,
      icon: '/favicon.ico',
      badge: '/favicon.ico'
    });
  }
}
