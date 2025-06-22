import { ScheduledEvent } from '../types';

export interface StudyNotification {
  id: string;
  type: 'reminder' | 'pomodoro_start' | 'pomodoro_break' | 'pomodoro_long_break' | 'spacing_review' | 'optimization_tip';
  title: string;
  message: string;
  scheduledFor: Date;
  eventId?: string;
  priority: 'low' | 'medium' | 'high';
  dismissed: boolean;
  createdAt: Date;
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

// Generar notificaciones automáticas para eventos
export function generateEventNotifications(events: ScheduledEvent[]): StudyNotification[] {
  const notifications: StudyNotification[] = [];
  const now = new Date();

  events.forEach(event => {
    const eventDateTime = new Date(`${event.date}T${event.startTime}`);
    
    // Notificación de recordatorio 30 minutos antes
    const reminderTime = new Date(eventDateTime.getTime() - 30 * 60 * 1000);
    if (reminderTime > now) {
      notifications.push({
        id: `reminder-${event.id}`,
        type: 'reminder',
        title: 'Sesión de Estudio Próxima',
        message: `"${event.title}" comienza en 30 minutos (${event.startTime})`,
        scheduledFor: reminderTime,
        eventId: event.id,
        priority: 'medium',
        dismissed: false,
        createdAt: now
      });
    }

    // Notificación especial para repaso espaciado
    if (event.technique === 'spacing' && event.isOptimalSpacing) {
      const spacingReminderTime = new Date(eventDateTime.getTime() - 2 * 60 * 60 * 1000); // 2 horas antes
      if (spacingReminderTime > now) {
        notifications.push({
          id: `spacing-${event.id}`,
          type: 'spacing_review',
          title: '⭐ Ventana Óptima de Repaso',
          message: `Es el momento perfecto para repasar "${event.title}". ¡No dejes pasar esta ventana óptima!`,
          scheduledFor: spacingReminderTime,
          eventId: event.id,
          priority: 'high',
          dismissed: false,
          createdAt: now
        });
      }
    }

    // Generar notificaciones de Pomodoro si están configuradas
    if (event.pomodoroSettings && eventDateTime > now) {
      const pomodoroNotifications = generatePomodoroNotifications(event, eventDateTime);
      notifications.push(...pomodoroNotifications);
    }
  });

  return notifications;
}

// Generar notificaciones específicas para sesiones Pomodoro
function generatePomodoroNotifications(event: ScheduledEvent, startTime: Date): StudyNotification[] {
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
      message: `Comienza tu sesión de trabajo de ${workMinutes} minutos para "${event.title}"`,
      scheduledFor: new Date(currentTime),
      eventId: event.id,
      priority: 'medium',
      dismissed: false,
      createdAt: new Date()
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
        message: `¡Tiempo de descanso! Relájate por ${breakDuration} minutos.`,
        scheduledFor: new Date(currentTime),
        eventId: event.id,
        priority: 'low',
        dismissed: false,
        createdAt: new Date()
      });

      // Avanzar el tiempo de descanso
      currentTime = new Date(currentTime.getTime() + breakDuration * 60 * 1000);
    }
  }

  return notifications;
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
        createdAt: now
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
      createdAt: now
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
      createdAt: now
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
