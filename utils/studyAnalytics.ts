import { ScheduledEvent } from '../types';

export interface StudyAnalytics {
  totalStudyTime: number;
  sessionCount: number;
  avgSessionDuration: number;
  techniqueUsage: { [technique: string]: number };
  cognitiveLoadDistribution: { [load: string]: number };
  timeSlotPreferences: { [slot: string]: number };
  weeklyProgress: { week: string; hours: number }[];
  completionRate: number;
  avgPerformanceRating: number;
  streakDays: number;
  heatmapData: { [date: string]: number };
}

export interface TechniqueAnalytics {
  technique: string;
  sessionsCount: number;
  totalTime: number;
  avgPerformance: number;
  completionRate: number;
  bestTimeSlot: string;
  recommendedFrequency: string;
}

// Calcular analytics completos del estudio
export function calculateStudyAnalytics(
  events: ScheduledEvent[],
  dateRange: { start: Date; end: Date } = {
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Últimos 30 días
    end: new Date()
  }
): StudyAnalytics {
  const filteredEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate >= dateRange.start && eventDate <= dateRange.end;
  });

  const completedEvents = filteredEvents.filter(e => e.completed);
  
  // Calcular tiempo total de estudio
  const totalStudyTime = completedEvents.reduce((total, event) => {
    const duration = calculateEventDuration(event.startTime, event.endTime);
    return total + duration;
  }, 0);

  // Uso de técnicas
  const techniqueUsage = completedEvents.reduce((acc, event) => {
    if (event.technique) {
      acc[event.technique] = (acc[event.technique] || 0) + 1;
    }
    return acc;
  }, {} as { [technique: string]: number });

  // Distribución de carga cognitiva
  const cognitiveLoadDistribution = completedEvents.reduce((acc, event) => {
    if (event.cognitiveLoad) {
      acc[event.cognitiveLoad] = (acc[event.cognitiveLoad] || 0) + 1;
    }
    return acc;
  }, {} as { [load: string]: number });

  // Preferencias de horario
  const timeSlotPreferences = completedEvents.reduce((acc, event) => {
    if (event.idealTimeSlot) {
      acc[event.idealTimeSlot] = (acc[event.idealTimeSlot] || 0) + 1;
    }
    return acc;
  }, {} as { [slot: string]: number });

  // Progreso semanal
  const weeklyProgress = calculateWeeklyProgress(completedEvents);

  // Tasa de completación
  const completionRate = filteredEvents.length > 0 
    ? (completedEvents.length / filteredEvents.length) * 100 
    : 0;

  // Calificación promedio de rendimiento
  const performanceRatings = completedEvents
    .filter(e => e.performanceRating)
    .map(e => e.performanceRating!);
  const avgPerformanceRating = performanceRatings.length > 0
    ? performanceRatings.reduce((sum, rating) => sum + rating, 0) / performanceRatings.length
    : 0;

  // Días de racha (días consecutivos con al menos una sesión completada)
  const streakDays = calculateStreakDays(completedEvents);

  // Datos para heatmap
  const heatmapData = generateHeatmapData(completedEvents);

  return {
    totalStudyTime,
    sessionCount: completedEvents.length,
    avgSessionDuration: completedEvents.length > 0 ? totalStudyTime / completedEvents.length : 0,
    techniqueUsage,
    cognitiveLoadDistribution,
    timeSlotPreferences,
    weeklyProgress,
    completionRate,
    avgPerformanceRating,
    streakDays,
    heatmapData
  };
}

// Analizar rendimiento por técnica
export function analyzeTechniquePerformance(events: ScheduledEvent[]): TechniqueAnalytics[] {
  const techniques = [...new Set(events.map(e => e.technique).filter(Boolean))];
  
  return techniques.map(technique => {
    const techniqueEvents = events.filter(e => e.technique === technique);
    const completedEvents = techniqueEvents.filter(e => e.completed);
    
    const totalTime = completedEvents.reduce((total, event) => {
      return total + calculateEventDuration(event.startTime, event.endTime);
    }, 0);

    const performanceRatings = completedEvents
      .filter(e => e.performanceRating)
      .map(e => e.performanceRating!);
    const avgPerformance = performanceRatings.length > 0
      ? performanceRatings.reduce((sum, rating) => sum + rating, 0) / performanceRatings.length
      : 0;

    const completionRate = techniqueEvents.length > 0
      ? (completedEvents.length / techniqueEvents.length) * 100
      : 0;

    // Mejor horario para esta técnica
    const timeSlotCount = completedEvents.reduce((acc, event) => {
      if (event.idealTimeSlot) {
        acc[event.idealTimeSlot] = (acc[event.idealTimeSlot] || 0) + 1;
      }
      return acc;
    }, {} as { [slot: string]: number });

    const bestTimeSlot = Object.entries(timeSlotCount)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'morning';

    // Frecuencia recomendada basada en rendimiento
    const recommendedFrequency = getRecommendedFrequency(avgPerformance, completionRate);

    return {
      technique: technique!,
      sessionsCount: completedEvents.length,
      totalTime,
      avgPerformance,
      completionRate,
      bestTimeSlot,
      recommendedFrequency
    };
  });
}

// Generar datos para heatmap de actividad
function generateHeatmapData(events: ScheduledEvent[]): { [date: string]: number } {
  return events.reduce((acc, event) => {
    const duration = calculateEventDuration(event.startTime, event.endTime);
    acc[event.date] = (acc[event.date] || 0) + duration;
    return acc;
  }, {} as { [date: string]: number });
}

// Calcular progreso semanal
function calculateWeeklyProgress(events: ScheduledEvent[]): { week: string; hours: number }[] {
  const weeklyData: { [week: string]: number } = {};
  
  events.forEach(event => {
    const eventDate = new Date(event.date);
    const weekStart = getWeekStart(eventDate);
    const weekKey = weekStart.toISOString().split('T')[0];
    const duration = calculateEventDuration(event.startTime, event.endTime);
    
    weeklyData[weekKey] = (weeklyData[weekKey] || 0) + duration;
  });

  return Object.entries(weeklyData)
    .map(([week, minutes]) => ({
      week,
      hours: Math.round((minutes / 60) * 100) / 100
    }))
    .sort((a, b) => a.week.localeCompare(b.week));
}

// Calcular días de racha consecutiva
function calculateStreakDays(events: ScheduledEvent[]): number {
  if (events.length === 0) return 0;

  const uniqueDates = [...new Set(events.map(e => e.date))].sort();
  let currentStreak = 0;
  let maxStreak = 0;
  let lastDate: Date | null = null;

  uniqueDates.forEach(dateStr => {
    const currentDate = new Date(dateStr);
    
    if (lastDate === null) {
      currentStreak = 1;
    } else {
      const daysDiff = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 1) {
        currentStreak++;
      } else {
        maxStreak = Math.max(maxStreak, currentStreak);
        currentStreak = 1;
      }
    }
    
    lastDate = currentDate;
  });

  return Math.max(maxStreak, currentStreak);
}

// Obtener inicio de la semana (lunes)
function getWeekStart(date: Date): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day + (day === 0 ? -6 : 1); // Ajustar si es domingo
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

// Calcular duración del evento en minutos
function calculateEventDuration(startTime: string, endTime: string): number {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  return end - start;
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

// Obtener frecuencia recomendada basada en rendimiento
function getRecommendedFrequency(avgPerformance: number, completionRate: number): string {
  if (avgPerformance >= 4.5 && completionRate >= 90) {
    return 'Mantener frecuencia actual';
  } else if (avgPerformance >= 3.5 && completionRate >= 70) {
    return '2-3 veces por semana';
  } else if (avgPerformance >= 2.5) {
    return 'Práctica diaria corta';
  } else {
    return 'Revisar técnica y reducir intensidad';
  }
}

// Generar insights inteligentes
export function generateInsights(analytics: StudyAnalytics, techniqueAnalytics: TechniqueAnalytics[]): string[] {
  const insights: string[] = [];

  // Insight sobre tiempo de estudio
  if (analytics.totalStudyTime < 300) { // Menos de 5 horas en el período
    insights.push('💡 Considera aumentar tu tiempo de estudio gradualmente. Incluso 15 minutos diarios pueden hacer una gran diferencia.');
  } else if (analytics.totalStudyTime > 1800) { // Más de 30 horas
    insights.push('🔥 ¡Excelente dedicación! Recuerda tomar descansos para evitar el agotamiento.');
  }

  // Insight sobre consistencia
  if (analytics.completionRate < 60) {
    insights.push('⚠️ Tu tasa de completación es baja. Intenta programar sesiones más cortas y realistas.');
  } else if (analytics.completionRate > 85) {
    insights.push('✅ ¡Excelente consistencia! Estás cumpliendo tus objetivos de estudio.');
  }

  // Insight sobre rendimiento
  if (analytics.avgPerformanceRating < 3) {
    insights.push('📈 Tu rendimiento promedio sugiere que podrías necesitar ajustar tu estrategia de estudio o tomar más descansos.');
  } else if (analytics.avgPerformanceRating > 4) {
    insights.push('🌟 ¡Tu rendimiento es excelente! Mantén el buen trabajo.');
  }

  // Insight sobre racha
  if (analytics.streakDays >= 7) {
    insights.push(`🔥 ¡Increíble racha de ${analytics.streakDays} días! La consistencia es clave para el aprendizaje efectivo.`);
  } else if (analytics.streakDays === 0) {
    insights.push('🎯 Trata de estudiar al menos un poco cada día. La constancia supera a la intensidad.');
  }

  // Insight sobre técnicas
  const bestTechnique = techniqueAnalytics
    .sort((a, b) => b.avgPerformance - a.avgPerformance)[0];
  
  if (bestTechnique && bestTechnique.avgPerformance > 4) {
    insights.push(`🎯 Tu técnica más efectiva es "${bestTechnique.technique}". ¡Úsala más seguido!`);
  }

  // Insight sobre horarios
  const preferredTimeSlot = Object.entries(analytics.timeSlotPreferences)
    .sort(([,a], [,b]) => b - a)[0];
  
  if (preferredTimeSlot) {
    const timeSlotNames = {
      morning: 'mañanas',
      afternoon: 'tardes',
      evening: 'tardes-noche',
      night: 'noches'
    };
    insights.push(`⏰ Rindes mejor en las ${timeSlotNames[preferredTimeSlot[0] as keyof typeof timeSlotNames]}. Programa tus sesiones más importantes en ese horario.`);
  }

  // Insight sobre balance de carga cognitiva
  const highCognitiveCount = analytics.cognitiveLoadDistribution.high || 0;
  const totalSessions = analytics.sessionCount;
  
  if (highCognitiveCount / totalSessions > 0.6) {
    insights.push('⚡ Tienes muchas sesiones de alta carga cognitiva. Considera intercalar con actividades más ligeras.');
  }

  return insights;
}

// Generar sugerencias de optimización
export function generateOptimizationSuggestions(
  analytics: StudyAnalytics,
  events: ScheduledEvent[]
): string[] {
  const suggestions: string[] = [];

  // Sugerencia de duración de sesiones
  if (analytics.avgSessionDuration > 90) {
    suggestions.push('🕐 Tus sesiones son muy largas. Considera dividirlas en bloques de 45-60 minutos con descansos.');
  } else if (analytics.avgSessionDuration < 20) {
    suggestions.push('⏱️ Tus sesiones son muy cortas. Intenta extenderlas a 25-45 minutos para mayor efectividad.');
  }

  // Sugerencia de balance de técnicas
  const techniqueCount = Object.keys(analytics.techniqueUsage).length;
  if (techniqueCount < 3) {
    suggestions.push('🔄 Experimenta con más técnicas de estudio. La variedad mejora la retención.');
  }

  // Sugerencia de spacing
  const spacingEvents = events.filter(e => e.technique === 'spacing');
  if (spacingEvents.length < events.length * 0.3) {
    suggestions.push('🔁 Incrementa el uso de repaso espaciado. Es una de las técnicas más efectivas para la memoria a largo plazo.');
  }

  return suggestions;
}
