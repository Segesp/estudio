import React, { useMemo } from 'react';
import Modal from './Modal';
import Card from './Card';
import { ScheduledEvent } from '../types';
import { calculateStudyAnalytics, analyzeTechniquePerformance, generateInsights, generateOptimizationSuggestions } from '../utils/studyAnalytics';

interface CalendarAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: ScheduledEvent[];
}

const CalendarAnalyticsModal: React.FC<CalendarAnalyticsModalProps> = ({
  isOpen,
  onClose,
  events
}) => {
  const analytics = useMemo(() => calculateStudyAnalytics(events), [events]);
  const techniqueAnalytics = useMemo(() => analyzeTechniquePerformance(events), [events]);
  const insights = useMemo(() => generateInsights(analytics, techniqueAnalytics), [analytics, techniqueAnalytics]);
  const suggestions = useMemo(() => generateOptimizationSuggestions(analytics, events), [analytics, events]);

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatPercentage = (value: number): string => {
    return `${Math.round(value)}%`;
  };

  const getTechniqueIcon = (technique: string): string => {
    const icons = {
      spacing: '🔄',
      interleaving: '🔀',
      elaboration: '✏️',
      retrieval: '🧠',
      drawing: '🖼️',
      pomodoro: '🍅',
      mixed: '🎯'
    };
    return icons[technique as keyof typeof icons] || '📚';
  };

  const getCognitiveLoadColor = (load: string): string => {
    const colors = {
      low: 'text-green-600 dark:text-green-400',
      medium: 'text-yellow-600 dark:text-yellow-400',
      high: 'text-red-600 dark:text-red-400'
    };
    return colors[load as keyof typeof colors] || 'text-slate-600';
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title="📊 Analytics del Calendario"
    >
      <div className="space-y-6 max-h-[70vh] overflow-y-auto">
        
        {/* Resumen General */}
        <Card>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">
            📈 Resumen General (Últimos 30 días)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                {analytics.sessionCount}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Sesiones
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatTime(analytics.totalStudyTime)}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Tiempo Total
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatPercentage(analytics.completionRate)}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Completación
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {analytics.streakDays}
              </div>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Días de Racha
              </div>
            </div>
          </div>
        </Card>

        {/* Distribución de Técnicas */}
        <Card>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">
            🧠 Técnicas de Estudio
          </h3>
          <div className="space-y-3">
            {Object.entries(analytics.techniqueUsage).map(([technique, count]) => {
              const percentage = (count / analytics.sessionCount) * 100;
              return (
                <div key={technique} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getTechniqueIcon(technique)}</span>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                      {technique}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-20 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-cyan-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-400 w-12 text-right">
                      {count} ({Math.round(percentage)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Análisis por Técnica */}
        <Card>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">
            🎯 Rendimiento por Técnica
          </h3>
          <div className="space-y-4">
            {techniqueAnalytics.map(technique => (
              <div key={technique.technique} className="border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getTechniqueIcon(technique.technique)}</span>
                    <h4 className="font-medium text-slate-700 dark:text-slate-200 capitalize">
                      {technique.technique}
                    </h4>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-cyan-600 dark:text-cyan-400">
                      {technique.avgPerformance.toFixed(1)}/5
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      Rendimiento
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Sesiones:</span>
                    <div className="font-medium">{technique.sessionsCount}</div>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Tiempo Total:</span>
                    <div className="font-medium">{formatTime(technique.totalTime)}</div>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Completación:</span>
                    <div className="font-medium">{formatPercentage(technique.completionRate)}</div>
                  </div>
                </div>
                
                <div className="mt-3 text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Mejor horario:</span>
                  <span className="ml-2 font-medium capitalize">{technique.bestTimeSlot}</span>
                </div>
                
                <div className="mt-2 text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Recomendación:</span>
                  <span className="ml-2 text-cyan-600 dark:text-cyan-400">{technique.recommendedFrequency}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Distribución de Carga Cognitiva */}
        <Card>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">
            ⚡ Carga Cognitiva
          </h3>
          <div className="space-y-3">
            {Object.entries(analytics.cognitiveLoadDistribution).map(([load, count]) => {
              const percentage = (count / analytics.sessionCount) * 100;
              const loadLabels = {
                low: '🟢 Baja',
                medium: '🟡 Media',
                high: '🔴 Alta'
              };
              
              return (
                <div key={load} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {loadLabels[load as keyof typeof loadLabels]}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-20 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          load === 'low' ? 'bg-green-500' : 
                          load === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-400 w-12 text-right">
                      {count} ({Math.round(percentage)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Horarios Preferidos */}
        <Card>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">
            ⏰ Horarios Preferidos
          </h3>
          <div className="space-y-3">
            {Object.entries(analytics.timeSlotPreferences).map(([slot, count]) => {
              const percentage = (count / analytics.sessionCount) * 100;
              const slotLabels = {
                morning: '🌅 Mañana',
                afternoon: '☀️ Tarde',
                evening: '🌆 Tarde-Noche',
                night: '🌙 Noche'
              };
              
              return (
                <div key={slot} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {slotLabels[slot as keyof typeof slotLabels]}
                    </span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-20 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-400 w-12 text-right">
                      {count} ({Math.round(percentage)}%)
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Insights Inteligentes */}
        {insights.length > 0 && (
          <Card>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">
              💡 Insights Inteligentes
            </h3>
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg">
                  <div className="flex-1 text-sm text-slate-700 dark:text-slate-300">
                    {insight}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Sugerencias de Optimización */}
        {suggestions.length > 0 && (
          <Card>
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">
              🎯 Sugerencias de Optimización
            </h3>
            <div className="space-y-3">
              {suggestions.map((suggestion, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <div className="flex-1 text-sm text-slate-700 dark:text-slate-300">
                    {suggestion}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Progreso Semanal */}
        <Card>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">
            📅 Progreso Semanal
          </h3>
          <div className="space-y-2">
            {analytics.weeklyProgress.slice(-4).map((week, index) => (
              <div key={week.week} className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  Semana {new Date(week.week).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                </span>
                <div className="flex items-center space-x-3">
                  <div className="w-24 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((week.hours / 20) * 100, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 w-12 text-right">
                    {week.hours}h
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

      </div>
    </Modal>
  );
};

export default CalendarAnalyticsModal;
