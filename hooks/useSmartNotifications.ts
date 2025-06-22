import { useState, useEffect, useCallback } from 'react';
import useLocalStorage from './useLocalStorage';
import { 
  StudyNotification, 
  NotificationSettings, 
  DEFAULT_NOTIFICATION_SETTINGS,
  generateEventNotifications,
  generateSmartRecommendations,
  generateWellnessNotifications,
  generateAchievementNotifications,
  generateDailySummaryNotification,
  filterNotificationsForDisplay
} from '../utils/notificationSystem';
import { ScheduledEvent } from '../types';

export interface UseSmartNotificationsReturn {
  notifications: StudyNotification[];
  settings: NotificationSettings;
  activeNotifications: StudyNotification[];
  hasPermission: boolean;
  updateSettings: (newSettings: Partial<NotificationSettings>) => void;
  dismissNotification: (notificationId: string) => void;
  dismissAllNotifications: () => void;
  refreshNotifications: () => void;
  requestPermission: () => Promise<boolean>;
  unreadCount: number;
}

export function useSmartNotifications(events: ScheduledEvent[]): UseSmartNotificationsReturn {
  const [notifications, setNotifications] = useLocalStorage<StudyNotification[]>('smart-notifications', []);
  const [settings, setSettings] = useLocalStorage<NotificationSettings>('notification-settings', DEFAULT_NOTIFICATION_SETTINGS);
  const [hasPermission, setHasPermission] = useState(false);

  // Verificar permisos al cargar
  useEffect(() => {
    checkNotificationPermission();
  }, []);

  // Generar notificaciones cuando cambien los eventos
  useEffect(() => {
    if (events.length > 0) {
      refreshNotifications();
    }
  }, [events.length, settings.enabled]); // Dependencias específicas para evitar loops

  const checkNotificationPermission = async () => {
    if ('Notification' in window) {
      setHasPermission(Notification.permission === 'granted');
    }
  };

  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      setHasPermission(true);
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    const granted = permission === 'granted';
    setHasPermission(granted);
    return granted;
  };

  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, [setSettings]);

  const dismissNotification = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, dismissed: true }
          : notification
      )
    );
  }, [setNotifications]);

  const dismissAllNotifications = useCallback(() => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, dismissed: true }))
    );
  }, [setNotifications]);

  const refreshNotifications = useCallback(() => {
    const now = new Date();
    const completedEvents = events.filter(e => e.completed);
    
    // Limpiar notificaciones viejas (más de 30 días)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const cleanNotifications = notifications.filter(n => new Date(n.createdAt) > thirtyDaysAgo);
    
    // Generar nuevas notificaciones
    const newNotifications: StudyNotification[] = [];
    
    // Notificaciones de eventos
    if (settings.enabled) {
      newNotifications.push(...generateEventNotifications(events, settings, cleanNotifications));
      
      // Recomendaciones inteligentes (máximo una vez por día)
      const lastRecommendation = cleanNotifications
        .filter(n => n.type === 'optimization_tip')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
      
      const shouldGenerateRecommendations = !lastRecommendation || 
        (now.getTime() - new Date(lastRecommendation.createdAt).getTime()) > 24 * 60 * 60 * 1000;
      
      if (shouldGenerateRecommendations && completedEvents.length >= 5) {
        newNotifications.push(...generateSmartRecommendations(events, completedEvents));
      }
      
      // Notificaciones de bienestar
      newNotifications.push(...generateWellnessNotifications(events, settings));
      
      // Notificaciones de logros
      newNotifications.push(...generateAchievementNotifications(completedEvents, settings));
      
      // Resumen diario
      const dailySummary = generateDailySummaryNotification(events, completedEvents, settings);
      if (dailySummary) {
        newNotifications.push(dailySummary);
      }
    }
    
    // Combinar notificaciones existentes con las nuevas (evitar duplicados)
    const existingIds = new Set(cleanNotifications.map(n => n.id));
    const uniqueNewNotifications = newNotifications.filter(n => !existingIds.has(n.id));
    
    const allNotifications = [...cleanNotifications, ...uniqueNewNotifications];
    
    setNotifications(allNotifications);
  }, [events, notifications, settings, setNotifications]);

  // Calcular notificaciones activas (no descartadas y dentro de las próximas 24 horas)
  const activeNotifications = notifications.filter(notification => {
    if (notification.dismissed) return false;
    
    const now = new Date();
    const notificationTime = new Date(notification.scheduledFor);
    const timeDiff = notificationTime.getTime() - now.getTime();
    
    // Mostrar notificaciones de las últimas 2 horas o próximas 24 horas
    return timeDiff > -2 * 60 * 60 * 1000 && timeDiff < 24 * 60 * 60 * 1000;
  }).sort((a, b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime());

  // Contar notificaciones no leídas
  const unreadCount = activeNotifications.filter(n => !n.dismissed).length;

  return {
    notifications,
    settings,
    activeNotifications,
    hasPermission,
    updateSettings,
    dismissNotification,
    dismissAllNotifications,
    refreshNotifications,
    requestPermission,
    unreadCount
  };
}

export default useSmartNotifications;
