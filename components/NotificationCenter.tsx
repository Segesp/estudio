import React, { useState } from 'react';
import { BellIcon, XMarkIcon, ClockIcon } from '../ui-assets';
import Button from './Button';
import Card from './Card';
import { StudyNotification, NotificationSettings } from '../utils/notificationSystem';

interface NotificationCenterProps {
  notifications: StudyNotification[];
  settings: NotificationSettings;
  unreadCount: number;
  hasPermission: boolean;
  onDismiss: (notificationId: string) => void;
  onDismissAll: () => void;
  onRequestPermission: () => Promise<boolean>;
  onUpdateSettings: (settings: Partial<NotificationSettings>) => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({
  notifications,
  settings,
  unreadCount,
  hasPermission,
  onDismiss,
  onDismissAll,
  onRequestPermission,
  onUpdateSettings
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const getNotificationIcon = (type: StudyNotification['type']): string => {
    const icons = {
      reminder: '📚',
      pomodoro_start: '🍅',
      pomodoro_break: '☕',
      pomodoro_long_break: '🌿',
      spacing_review: '⭐',
      optimization_tip: '💡',
      daily_summary: '📊',
      weekly_goals: '🎯',
      streak_celebration: '🔥',
      technique_suggestion: '🧠',
      energy_optimization: '💧'
    };
    return icons[type] || '📄';
  };

  const getPriorityColor = (priority: StudyNotification['priority']): string => {
    const colors = {
      low: 'border-l-gray-400',
      medium: 'border-l-yellow-500',
      high: 'border-l-red-500'
    };
    return colors[priority] || 'border-l-gray-400';
  };

  const getCategoryColor = (category: StudyNotification['category']): string => {
    const colors = {
      session: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
      study: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
      wellness: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
      achievement: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300',
      optimization: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300'
    };
    return colors[category] || colors.study;
  };

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    
    if (diffMinutes < 0) {
      return `Hace ${Math.abs(diffMinutes)} min`;
    } else if (diffMinutes < 60) {
      return `En ${diffMinutes} min`;
    } else if (diffMinutes < 1440) {
      const hours = Math.round(diffMinutes / 60);
      return `En ${hours}h`;
    } else {
      return date.toLocaleDateString('es-ES', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const activeNotifications = notifications
    .filter(n => !n.dismissed)
    .slice(0, 10); // Mostrar máximo 10

  return (
    <div className="relative">
      {/* Botón de notificaciones */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-slate-800 dark:text-slate-300 dark:hover:text-slate-100 transition-colors"
        aria-label="Notificaciones"
      >
        <BellIcon className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel de notificaciones */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 max-h-96 overflow-hidden bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-50">
          
          {/* Header */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 dark:text-slate-200">
                Notificaciones
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  ⚙️
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {activeNotifications.length > 0 && (
              <div className="mt-2 flex justify-between items-center">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {unreadCount} sin leer
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismissAll}
                  className="text-xs"
                >
                  Marcar todas como leídas
                </Button>
              </div>
            )}
          </div>

          {/* Settings panel */}
          {showSettings && (
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
              {!hasPermission && (
                <div className="mb-3">
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={onRequestPermission}
                    className="w-full"
                  >
                    🔔 Activar Notificaciones
                  </Button>
                </div>
              )}
              
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.studyReminders}
                    onChange={(e) => onUpdateSettings({ studyReminders: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Recordatorios de estudio
                  </span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.pomodoroAlerts}
                    onChange={(e) => onUpdateSettings({ pomodoroAlerts: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Alertas de Pomodoro
                  </span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.spacingReviews}
                    onChange={(e) => onUpdateSettings({ spacingReviews: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Ventanas de repaso
                  </span>
                </label>
                
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={settings.achievements}
                    onChange={(e) => onUpdateSettings({ achievements: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">
                    Logros y rachas
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Lista de notificaciones */}
          <div className="max-h-64 overflow-y-auto">
            {activeNotifications.length === 0 ? (
              <div className="p-6 text-center text-slate-500 dark:text-slate-400">
                <BellIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay notificaciones nuevas</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {activeNotifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-l-4 ${getPriorityColor(notification.priority)}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 text-lg">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                            {notification.title}
                          </h4>
                          <button
                            onClick={() => onDismiss(notification.id)}
                            className="flex-shrink-0 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                          >
                            <XMarkIcon className="w-3 h-3" />
                          </button>
                        </div>
                        
                        <p className="text-xs text-slate-600 dark:text-slate-300 mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(notification.category)}`}>
                            {notification.category}
                          </span>
                          
                          <div className="flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-400">
                            <ClockIcon className="w-3 h-3" />
                            <span>{formatTime(new Date(notification.scheduledFor))}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
