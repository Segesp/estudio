import { ScheduledEvent, Deck, Flashcard } from '../types';

// Configuraciones por defecto para diferentes técnicas
export const TECHNIQUE_DEFAULTS = {
  spacing: {
    duration: 30, // minutos
    cognitiveLoad: 'medium' as const,
    idealTimeSlot: 'morning' as const,
    color: 'bg-green-500'
  },
  interleaving: {
    duration: 45,
    cognitiveLoad: 'high' as const,
    idealTimeSlot: 'afternoon' as const,
    color: 'bg-orange-500'
  },
  elaboration: {
    duration: 60,
    cognitiveLoad: 'high' as const,
    idealTimeSlot: 'afternoon' as const,
    color: 'bg-purple-500'
  },
  retrieval: {
    duration: 20,
    cognitiveLoad: 'medium' as const,
    idealTimeSlot: 'morning' as const,
    color: 'bg-blue-500'
  },
  drawing: {
    duration: 40,
    cognitiveLoad: 'medium' as const,
    idealTimeSlot: 'afternoon' as const,
    color: 'bg-pink-500'
  },
  pomodoro: {
    duration: 25,
    cognitiveLoad: 'low' as const,
    idealTimeSlot: 'morning' as const,
    color: 'bg-red-500'
  },
  mixed: {
    duration: 90,
    cognitiveLoad: 'high' as const,
    idealTimeSlot: 'afternoon' as const,
    color: 'bg-cyan-500'
  }
};

// Algoritmo SM-2 mejorado para calcular próximas fechas de repaso
export function calculateNextReviewDate(
  lastReview: Date,
  repetitions: number,
  easiness: number,
  quality: number
): { nextDate: Date; newEasiness: number; newInterval: number } {
  // Actualizar factor de facilidad basado en la calidad de la respuesta
  let newEasiness = easiness + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  // Limitar el factor de facilidad
  if (newEasiness < 1.3) newEasiness = 1.3;
  
  let interval: number;
  
  if (quality < 3) {
    // Si la respuesta fue mala, reiniciar el proceso
    interval = 1;
    repetitions = 0;
  } else {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      // Usar el intervalo anterior para calcular el siguiente
      const previousInterval = lastReview ? Math.floor((new Date().getTime() - lastReview.getTime()) / (1000 * 60 * 60 * 24)) : 1;
      interval = Math.round(previousInterval * newEasiness);
    }
    repetitions++;
  }
  
  const nextDate = new Date(lastReview);
  nextDate.setDate(nextDate.getDate() + interval);
  
  return {
    nextDate,
    newEasiness,
    newInterval: interval
  };
}

// Generar eventos de repaso espaciado automáticamente
export function generateSpacedRepetitionEvents(
  flashcards: Flashcard[],
  existingEvents: ScheduledEvent[],
  startDate: Date = new Date(),
  daysAhead: number = 30
): ScheduledEvent[] {
  const newEvents: ScheduledEvent[] = [];
  const eventDates = new Set(existingEvents.map(e => e.date));
  
  flashcards.forEach(card => {
    if (!card.nextReviewDate) return;
    
    const reviewDate = new Date(card.nextReviewDate);
    const dateString = reviewDate.toISOString().split('T')[0];
    
    // Solo crear eventos dentro del rango especificado
    if (reviewDate >= startDate && reviewDate <= new Date(startDate.getTime() + daysAhead * 24 * 60 * 60 * 1000)) {
      // Evitar duplicar eventos en la misma fecha
      const eventId = `spacing-${card.deckId}-${dateString}`;
      const existingEventForCard = existingEvents.find(e => e.id === eventId);
      
      if (!existingEventForCard) {
        const optimalTime = getOptimalTimeForSpacing(reviewDate, card.difficulty);
        
        newEvents.push({
          id: eventId,
          title: `Repaso: ${getDeckName(card.deckId)}`,
          date: dateString,
          startTime: optimalTime.start,
          endTime: optimalTime.end,
          description: `Repaso espaciado automático - ${card.repetitions} repeticiones`,
          color: TECHNIQUE_DEFAULTS.spacing.color,
          technique: 'spacing',
          relatedDeckId: card.deckId,
          cognitiveLoad: card.difficulty === 'hard' ? 'high' : card.difficulty === 'medium' ? 'medium' : 'low',
          isOptimalSpacing: true,
          createdAt: new Date().toISOString()
        });
      }
    }
  });
  
  return newEvents;
}

// Obtener hora óptima para repaso según la dificultad y momento del día
function getOptimalTimeForSpacing(date: Date, difficulty?: string): { start: string; end: string } {
  const hour = difficulty === 'hard' ? 9 : difficulty === 'medium' ? 10 : 11; // Más temprano para más difícil
  const duration = TECHNIQUE_DEFAULTS.spacing.duration;
  
  const startTime = `${hour.toString().padStart(2, '0')}:00`;
  const endHour = hour + Math.floor(duration / 60);
  const endMinute = duration % 60;
  const endTime = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
  
  return { start: startTime, end: endTime };
}

// Obtener nombre del deck (función auxiliar - debería conectarse con el estado real)
function getDeckName(deckId: string): string {
  // Esta función debería obtener el nombre real del deck desde el estado
  // Por ahora retorna un placeholder
  return `Deck ${deckId.slice(-4)}`;
}

// Generar sesiones de intercalado inteligente
export function generateInterleavingSessions(
  topics: string[],
  totalDuration: number,
  proportions?: { [topic: string]: number }
): { topic: string; duration: number; order: number }[] {
  if (topics.length === 0) return [];
  
  // Si no hay proporciones especificadas, distribuir equitativamente
  const defaultProportion = 1 / topics.length;
  const normalizedProportions = topics.reduce((acc, topic) => {
    acc[topic] = proportions?.[topic] || defaultProportion;
    return acc;
  }, {} as { [topic: string]: number });
  
  // Normalizar proporciones para que sumen 1
  const totalProp = Object.values(normalizedProportions).reduce((sum, prop) => sum + prop, 0);
  Object.keys(normalizedProportions).forEach(topic => {
    normalizedProportions[topic] /= totalProp;
  });
  
  // Calcular duraciones por tema
  const sessions = topics.map(topic => ({
    topic,
    duration: Math.round(totalDuration * normalizedProportions[topic]),
    order: 0
  }));
  
  // Algoritmo de intercalado: alternar temas de forma inteligente
  const interleavedSessions: typeof sessions = [];
  const remaining = [...sessions];
  let orderCounter = 1;
  
  while (remaining.length > 0) {
    // Seleccionar el próximo tema que no haya sido usado recientemente
    const lastTopic = interleavedSessions[interleavedSessions.length - 1]?.topic;
    const availableTopics = remaining.filter(s => s.topic !== lastTopic);
    const nextSession = availableTopics.length > 0 ? availableTopics[0] : remaining[0];
    
    // Dividir en bloques más pequeños si la duración es muy larga
    const maxBlockDuration = 15; // minutos máximos por bloque
    const blockDuration = Math.min(nextSession.duration, maxBlockDuration);
    
    interleavedSessions.push({
      topic: nextSession.topic,
      duration: blockDuration,
      order: orderCounter++
    });
    
    // Actualizar duración restante
    nextSession.duration -= blockDuration;
    if (nextSession.duration <= 0) {
      remaining.splice(remaining.indexOf(nextSession), 1);
    }
  }
  
  return interleavedSessions;
}

// Calcular carga cognitiva óptima según hora del día y técnica
export function calculateOptimalCognitiveLoad(timeSlot: string, technique: ScheduledEvent['technique']): ScheduledEvent['cognitiveLoad'] {
  const timeHour = parseInt(timeSlot.split(':')[0]);
  
  // Curva de energía cognitiva típica
  let baseLoad: ScheduledEvent['cognitiveLoad'];
  if (timeHour >= 9 && timeHour <= 11) {
    baseLoad = 'high'; // Pico matutino
  } else if (timeHour >= 14 && timeHour <= 16) {
    baseLoad = 'medium'; // Pico post-almuerzo
  } else if (timeHour >= 19 && timeHour <= 21) {
    baseLoad = 'medium'; // Pico nocturno
  } else {
    baseLoad = 'low'; // Momentos de baja energía
  }
  
  // Ajustar según la técnica
  const techniqueLoad = TECHNIQUE_DEFAULTS[technique || 'spacing'].cognitiveLoad;
  
  // Combinar ambos factores
  if (baseLoad === 'high' && techniqueLoad === 'high') return 'high';
  if (baseLoad === 'low' || techniqueLoad === 'low') return 'low';
  return 'medium';
}

// Detectar conflictos de horario y sugerir reorganización
export function detectScheduleConflicts(events: ScheduledEvent[]): {
  conflicts: { event1: ScheduledEvent; event2: ScheduledEvent }[];
  suggestions: string[];
} {
  const conflicts: { event1: ScheduledEvent; event2: ScheduledEvent }[] = [];
  const suggestions: string[] = [];
  
  // Ordenar eventos por fecha y hora
  const sortedEvents = events.sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.startTime.localeCompare(b.startTime);
  });
  
  // Detectar solapamientos
  for (let i = 0; i < sortedEvents.length - 1; i++) {
    const current = sortedEvents[i];
    const next = sortedEvents[i + 1];
    
    if (current.date === next.date) {
      const currentEnd = timeToMinutes(current.endTime);
      const nextStart = timeToMinutes(next.startTime);
      
      if (currentEnd > nextStart) {
        conflicts.push({ event1: current, event2: next });
        
        // Generar sugerencia
        const gap = currentEnd - nextStart;
        suggestions.push(`Conflicto entre "${current.title}" y "${next.title}": solapamiento de ${gap} minutos. Considera mover uno de los eventos.`);
      }
    }
  }
  
  // Detectar sobrecarga cognitiva
  const dayGroups = groupEventsByDate(sortedEvents);
  Object.entries(dayGroups).forEach(([date, dayEvents]) => {
    const highCognitiveEvents = dayEvents.filter(e => e.cognitiveLoad === 'high');
    if (highCognitiveEvents.length > 2) {
      suggestions.push(`${date}: Demasiadas sesiones de alta carga cognitiva (${highCognitiveEvents.length}). Considera redistribuir algunas.`);
    }
  });
  
  return { conflicts, suggestions };
}

// Funciones auxiliares
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function groupEventsByDate(events: ScheduledEvent[]): { [date: string]: ScheduledEvent[] } {
  return events.reduce((groups, event) => {
    if (!groups[event.date]) {
      groups[event.date] = [];
    }
    groups[event.date].push(event);
    return groups;
  }, {} as { [date: string]: ScheduledEvent[] });
}

// Generar recomendaciones de estudio basadas en analytics
export function generateStudyRecommendations(
  events: ScheduledEvent[],
  completedEvents: ScheduledEvent[],
  flashcards: Flashcard[]
): string[] {
  const recommendations: string[] = [];
  
  // Análisis de técnicas más efectivas
  const techniquePerformance = analyzeTechniquePerformance(completedEvents);
  const bestTechnique = Object.entries(techniquePerformance)
    .sort(([,a], [,b]) => b.avgRating - a.avgRating)[0];
  
  if (bestTechnique) {
    recommendations.push(`Tu técnica más efectiva es "${bestTechnique[0]}" con ${bestTechnique[1].avgRating.toFixed(1)}/5. ¡Úsala más!`);
  }
  
  // Análisis de patrones temporales
  const timePerformance = analyzeTimeSlotPerformance(completedEvents);
  const bestTime = Object.entries(timePerformance)
    .sort(([,a], [,b]) => b.avgRating - a.avgRating)[0];
  
  if (bestTime) {
    recommendations.push(`Rindes mejor en horario ${bestTime[0]} (${bestTime[1].avgRating.toFixed(1)}/5). Programa sesiones importantes ahí.`);
  }
  
  // Detectar gaps en repaso espaciado
  const overdueCards = flashcards.filter(card => {
    if (!card.nextReviewDate) return false;
    return new Date(card.nextReviewDate) < new Date();
  });
  
  if (overdueCards.length > 0) {
    recommendations.push(`Tienes ${overdueCards.length} tarjetas pendientes de repaso. ¡Es hora de ponerse al día!`);
  }
  
  // Sugerir balance de técnicas
  const recentTechniques = events
    .filter(e => new Date(e.date) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
    .map(e => e.technique)
    .filter(Boolean);
  
  const techniqueCount = recentTechniques.reduce((acc, tech) => {
    acc[tech!] = (acc[tech!] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const underutilizedTechniques = Object.keys(TECHNIQUE_DEFAULTS)
    .filter(tech => (techniqueCount[tech] || 0) < 2);
  
  if (underutilizedTechniques.length > 0) {
    recommendations.push(`Considera usar más: ${underutilizedTechniques.join(', ')}. La variedad mejora el aprendizaje.`);
  }
  
  return recommendations;
}

function analyzeTechniquePerformance(events: ScheduledEvent[]): { [technique: string]: { avgRating: number; count: number } } {
  const performance: { [technique: string]: { ratings: number[]; count: number } } = {};
  
  events.forEach(event => {
    if (event.technique && event.performanceRating) {
      if (!performance[event.technique]) {
        performance[event.technique] = { ratings: [], count: 0 };
      }
      performance[event.technique].ratings.push(event.performanceRating);
      performance[event.technique].count++;
    }
  });
  
  return Object.entries(performance).reduce((acc, [technique, data]) => {
    acc[technique] = {
      avgRating: data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length,
      count: data.count
    };
    return acc;
  }, {} as { [technique: string]: { avgRating: number; count: number } });
}

function analyzeTimeSlotPerformance(events: ScheduledEvent[]): { [timeSlot: string]: { avgRating: number; count: number } } {
  const performance: { [timeSlot: string]: { ratings: number[]; count: number } } = {};
  
  events.forEach(event => {
    if (event.idealTimeSlot && event.performanceRating) {
      if (!performance[event.idealTimeSlot]) {
        performance[event.idealTimeSlot] = { ratings: [], count: 0 };
      }
      performance[event.idealTimeSlot].ratings.push(event.performanceRating);
      performance[event.idealTimeSlot].count++;
    }
  });
  
  return Object.entries(performance).reduce((acc, [timeSlot, data]) => {
    acc[timeSlot] = {
      avgRating: data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length,
      count: data.count
    };
    return acc;
  }, {} as { [timeSlot: string]: { avgRating: number; count: number } });
}
