import React, { useState, useMemo, useEffect } from 'react';
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon, SparklesIcon, BellIcon, XMarkIcon } from '../ui-assets';
import Button from '../components/Button';
import Card from '../components/Card';
import IntelligentEventModal from '../components/IntelligentEventModal';
import CalendarFilters from '../components/CalendarFilters';
import CalendarAnalyticsModal from '../components/CalendarAnalyticsModal';
import useLocalStorage from '../hooks/useLocalStorage';
import { ScheduledEvent, Flashcard, Deck } from '../types';
import { 
  generateSpacedRepetitionEvents, 
  generateInterleavingSessions, 
  detectScheduleConflicts,
  generateStudyRecommendations,
  TECHNIQUE_DEFAULTS
} from '../utils/intelligentScheduler';
import { 
  generateEventNotifications, 
  generateSmartRecommendations,
  notificationManager,
  StudyNotification
} from '../utils/notificationSystem';

const CalendarScreen: React.FC = () => {
  const [events, setEvents] = useLocalStorage<ScheduledEvent[]>('calendar-events', []);
  const [flashcards] = useLocalStorage<Flashcard[]>('flashcards', []);
  const [decks] = useLocalStorage<Deck[]>('decks', []);
  const [filteredEvents, setFilteredEvents] = useState<ScheduledEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduledEvent | null>(null);
  const [notifications, setNotifications] = useState<StudyNotification[]>([]);
  const [showSmartRecommendations, setShowSmartRecommendations] = useState(false);

  // Usar eventos filtrados o todos los eventos
  const displayEvents = filteredEvents.length > 0 ? filteredEvents : events;

  // Generar eventos automáticos de repaso espaciado
  useEffect(() => {
    if (flashcards.length > 0) {
      const spacingEvents = generateSpacedRepetitionEvents(flashcards, events);
      if (spacingEvents.length > 0) {
        // Solo agregar eventos que no existan ya
        const newEvents = spacingEvents.filter(newEvent => 
          !events.some(existingEvent => existingEvent.id === newEvent.id)
        );
        
        if (newEvents.length > 0) {
          setEvents(prevEvents => [...prevEvents, ...newEvents]);
        }
      }
    }
  }, [flashcards, setEvents]);

  // Generar y programar notificaciones
  useEffect(() => {
    const eventNotifications = generateEventNotifications(events);
    const smartRecommendations = generateSmartRecommendations(events, events.filter(e => e.completed));
    const allNotifications = [...eventNotifications, ...smartRecommendations];
    
    setNotifications(allNotifications);
    notificationManager.scheduleNotifications(allNotifications);
    
    return () => {
      // Limpiar notificaciones al desmontar
      notificationManager.clearAll();
    };
  }, [events]);

  // Detectar conflictos de horario
  const scheduleConflicts = useMemo(() => {
    return detectScheduleConflicts(events);
  }, [events]);

  // Generar recomendaciones de estudio
  const studyRecommendations = useMemo(() => {
    const completedEvents = events.filter(e => e.completed);
    return generateStudyRecommendations(events, completedEvents, flashcards);
  }, [events, flashcards]);

  // Colores disponibles para los eventos
  const availableColors = [
    { name: 'Azul', class: 'bg-blue-500' },
    { name: 'Rojo', class: 'bg-red-500' },
    { name: 'Verde', class: 'bg-green-500' },
    { name: 'Naranja', class: 'bg-orange-500' },
    { name: 'Morado', class: 'bg-purple-500' },
    { name: 'Cyan', class: 'bg-cyan-500' },
    { name: 'Rosa', class: 'bg-pink-500' },
    { name: 'Amarillo', class: 'bg-yellow-500' },
  ];

  // Obtener el primer día del mes y el número de días
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 = Domingo
  const daysInMonth = lastDayOfMonth.getDate();

  // Nombres de los meses y días
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  // Navegación del calendario
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Formatear fecha para comparación
  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  // Obtener eventos para una fecha específica
  const getEventsForDate = (date: string): ScheduledEvent[] => {
    return displayEvents.filter(event => event.date === date);
  };

  // Verificar si es hoy
  const isToday = (day: number): boolean => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };

  // Funciones para manejar eventos con inteligencia
  const handleCreateEvent = () => {
    setEditingEvent(null);
    setShowEventModal(true);
  };

  const handleEditEvent = (event: ScheduledEvent) => {
    setEditingEvent(event);
    setShowEventModal(true);
  };

  const handleSaveEvent = (eventData: Omit<ScheduledEvent, 'id' | 'createdAt'>) => {
    if (editingEvent) {
      // Editar evento existente
      setEvents(prevEvents =>
        prevEvents.map(event =>
          event.id === editingEvent.id
            ? { ...event, ...eventData }
            : event
        )
      );
    } else {
      // Crear nuevo evento con inteligencia
      let newEvent: ScheduledEvent = {
        ...eventData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };

      // Aplicar configuraciones inteligentes según la técnica
      if (eventData.technique && TECHNIQUE_DEFAULTS[eventData.technique]) {
        const defaults = TECHNIQUE_DEFAULTS[eventData.technique];
        
        // Aplicar configuraciones por defecto si no están especificadas
        if (!eventData.color) {
          newEvent.color = defaults.color;
        }
        if (!eventData.cognitiveLoad) {
          newEvent.cognitiveLoad = defaults.cognitiveLoad;
        }
        if (!eventData.idealTimeSlot) {
          newEvent.idealTimeSlot = defaults.idealTimeSlot;
        }
      }

      // Generar sesiones intercaladas si es técnica mixta
      if (eventData.technique === 'interleaving' && eventData.studyTopics) {
        const duration = calculateEventDuration(eventData.startTime, eventData.endTime);
        const interleavingSessions = generateInterleavingSessions(
          eventData.studyTopics,
          duration,
          eventData.topicProportions
        );
        
        // Agregar información de intercalado al evento
        newEvent.description = `${newEvent.description || ''}\n\nSesiones intercaladas:\n${
          interleavingSessions.map(s => `${s.order}. ${s.topic} (${s.duration}min)`).join('\n')
        }`;
      }

      // Marcar como ventana óptima si aplica
      if (eventData.technique === 'spacing') {
        newEvent.isOptimalSpacing = isOptimalSpacingWindow(eventData.date);
      }

      setEvents(prevEvents => [...prevEvents, newEvent]);
    }
    setShowEventModal(false);
    setEditingEvent(null);
  };

  const handleDeleteEvent = (eventId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
    }
  };

  const handleCompleteEvent = (eventId: string, rating?: number) => {
    setEvents(prevEvents =>
      prevEvents.map(event =>
        event.id === eventId
          ? { 
              ...event, 
              completed: true, 
              performanceRating: rating,
              energyLevel: rating ? Math.max(1, rating - 1) : undefined
            }
          : event
      )
    );
  };

  const handleGenerateAutoEvents = () => {
    if (flashcards.length === 0) {
      alert('No hay flashcards disponibles para generar eventos de repaso automático.');
      return;
    }

    const spacingEvents = generateSpacedRepetitionEvents(flashcards, events, new Date(), 14);
    const newEvents = spacingEvents.filter(newEvent => 
      !events.some(existingEvent => existingEvent.id === newEvent.id)
    );

    if (newEvents.length === 0) {
      alert('No hay nuevos eventos de repaso automático para generar.');
      return;
    }

    if (window.confirm(`¿Generar ${newEvents.length} eventos de repaso automático para los próximos 14 días?`)) {
      setEvents(prevEvents => [...prevEvents, ...newEvents]);
    }
  };

  // Funciones auxiliares
  function calculateEventDuration(startTime: string, endTime: string): number {
    const start = timeToMinutes(startTime);
    const end = timeToMinutes(endTime);
    return end - start;
  }

  function timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Generar días del calendario
  const calendarDays = useMemo(() => {
    const days = [];
    
    // Días vacíos al inicio
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Días del mes
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  }, [startingDayOfWeek, daysInMonth]);

  const handleDayClick = (day: number | null) => {
    if (day) {
      const clickedDate = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
      setSelectedDate(clickedDate);
    }
  };

  // Función para obtener el icono de la técnica
  const getTechniqueIcon = (technique?: ScheduledEvent['technique']): string => {
    switch (technique) {
      case 'spacing': return '🔄';
      case 'interleaving': return '🔀';
      case 'elaboration': return '✏️';
      case 'retrieval': return '🧠';
      case 'drawing': return '🖼️';
      case 'pomodoro': return '🍅';
      case 'mixed': return '🎯';
      default: return '📚';
    }
  };

  // Función para verificar si es una ventana óptima de espaciado
  const isOptimalSpacingWindow = (date: string): boolean => {
    const targetDate = new Date(date);
    const today = new Date();
    const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // Ventanas óptimas según la curva del olvido: 1, 3, 7, 14, 30 días
    const optimalWindows = [1, 3, 7, 14, 30];
    return optimalWindows.includes(diffDays);
  };

  // Función para obtener el nivel de carga cognitiva en color
  const getCognitiveLoadColor = (load?: ScheduledEvent['cognitiveLoad']): string => {
    switch (load) {
      case 'low': return 'border-green-300 dark:border-green-600';
      case 'medium': return 'border-yellow-300 dark:border-yellow-600';
      case 'high': return 'border-red-300 dark:border-red-600';
      default: return 'border-slate-300 dark:border-slate-600';
    }
  };

  const today = formatDate(new Date());

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center">
          <CalendarDaysIcon className="w-8 h-8 text-cyan-500 dark:text-cyan-400 mr-2" />
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Calendario Inteligente</h1>
        </div>
        <div className="flex items-center space-x-2">
          {/* Notificaciones activas */}
          {notifications.length > 0 && (
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSmartRecommendations(!showSmartRecommendations)}
                leftIcon={<BellIcon className="w-4 h-4" />}
              >
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1">
                  {notifications.filter(n => !n.dismissed).length}
                </span>
              </Button>
            </div>
          )}
          
          {/* Generar eventos automáticos */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleGenerateAutoEvents}
            leftIcon={<SparklesIcon className="w-4 h-4" />}
            title="Generar eventos de repaso automático"
          >
            Auto
          </Button>
          
          {/* Crear evento manual */}
          <Button
            onClick={handleCreateEvent}
            size="sm"
            leftIcon={<PlusIcon className="w-4 h-4" />}
          >
            Evento
          </Button>
        </div>
      </header>

      {/* Panel de notificaciones/recomendaciones */}
      {showSmartRecommendations && notifications.length > 0 && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
              🔔 Notificaciones y Recomendaciones
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSmartRecommendations(false)}
              leftIcon={<XMarkIcon className="w-4 h-4" />}
            >
            </Button>
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {notifications.filter(n => !n.dismissed).slice(0, 5).map(notification => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg text-sm ${
                  notification.priority === 'high' ? 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500' :
                  notification.priority === 'medium' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500' :
                  'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-slate-700 dark:text-slate-200">
                      {notification.title}
                    </h4>
                    <p className="text-slate-600 dark:text-slate-300 mt-1">
                      {notification.message}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      notificationManager.dismissNotification(notification.id);
                      setNotifications(prev => 
                        prev.map(n => n.id === notification.id ? { ...n, dismissed: true } : n)
                      );
                    }}
                    leftIcon={<XMarkIcon className="w-3 h-3" />}
                  >
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Conflictos de horario */}
      {scheduleConflicts.conflicts.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3">
            ⚠️ Conflictos de Horario
          </h3>
          <div className="space-y-2">
            {scheduleConflicts.suggestions.slice(0, 3).map((suggestion, index) => (
              <div key={index} className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-sm">
                <p className="text-slate-700 dark:text-slate-300">{suggestion}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recomendaciones de estudio */}
      {studyRecommendations.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3">
            💡 Recomendaciones Inteligentes
          </h3>
          <div className="space-y-2">
            {studyRecommendations.slice(0, 3).map((recommendation, index) => (
              <div key={index} className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg text-sm">
                <p className="text-slate-700 dark:text-slate-300">{recommendation}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filtros inteligentes */}
      <CalendarFilters
        events={events}
        onFiltersChange={setFilteredEvents}
        onAnalyticsOpen={() => setShowAnalyticsModal(true)}
      />

      <Card>
        {/* Navegación del mes */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPreviousMonth}
            leftIcon={<ChevronLeftIcon className="w-4 h-4" />}
          >
          </Button>
          
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToToday}
              className="text-cyan-600 dark:text-cyan-400"
            >
              Hoy
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextMonth}
            leftIcon={<ChevronRightIcon className="w-4 h-4" />}
          >
          </Button>
        </div>

        {/* Días de la semana */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {dayNames.map(day => (
            <div
              key={day}
              className="text-center text-sm font-medium text-slate-500 dark:text-slate-400 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Grid del calendario */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={index} className="h-20"></div>;
            }

            const dateString = formatDate(new Date(currentDate.getFullYear(), currentDate.getMonth(), day));
            const dayEvents = getEventsForDate(dateString);
            const isTodayDate = isToday(day);
            const isSelected = selectedDate === dateString;
            const isOptimalWindow = isOptimalSpacingWindow(dateString);

            return (
              <div
                key={day}
                onClick={() => handleDayClick(day)}
                className={`
                  h-20 p-1 border cursor-pointer transition-all duration-200
                  hover:bg-slate-50 dark:hover:bg-slate-700
                  ${isTodayDate ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-300 dark:border-cyan-600' : ''}
                  ${isSelected ? 'bg-cyan-100 dark:bg-cyan-800/30 border-cyan-400 dark:border-cyan-500' : ''}
                  ${isOptimalWindow && !isTodayDate && !isSelected ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' : ''}
                  ${!isTodayDate && !isSelected && !isOptimalWindow ? 'border-slate-200 dark:border-slate-600' : ''}
                `}
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`
                        text-sm font-medium
                        ${isTodayDate ? 'text-cyan-700 dark:text-cyan-300' : 'text-slate-700 dark:text-slate-200'}
                      `}
                    >
                      {day}
                    </span>
                    {isOptimalWindow && (
                      <span className="text-xs" title="Ventana óptima de repaso">⭐</span>
                    )}
                  </div>
                  
                  {/* Indicadores de eventos con técnicas */}
                  <div className="flex-1 space-y-0.5 overflow-hidden">
                    {dayEvents.slice(0, 2).map(event => (
                      <div
                        key={event.id}
                        className={`flex items-center space-x-1 w-full h-4 px-1 rounded text-xs text-white ${event.color || 'bg-gray-500'}`}
                        title={`${event.title} - ${getTechniqueIcon(event.technique)} ${event.technique}`}
                      >
                        <span>{getTechniqueIcon(event.technique)}</span>
                        <span className="truncate flex-1">{event.title}</span>
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
                        +{dayEvents.length - 2}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Lista de eventos del día seleccionado */}
      {selectedDate && (
        <Card>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">
            Eventos para {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </h3>
          
          {getEventsForDate(selectedDate).length > 0 ? (
            <div className="space-y-3">
              {getEventsForDate(selectedDate).map(event => (
                <div
                  key={event.id}
                  className={`flex items-start space-x-3 p-4 bg-slate-50 dark:bg-slate-700 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors border-l-4 ${getCognitiveLoadColor(event.cognitiveLoad)}`}
                  onClick={() => handleEditEvent(event)}
                >
                  <div
                    className={`w-6 h-6 rounded-full ${event.color || 'bg-gray-500'} flex items-center justify-center text-white text-sm flex-shrink-0`}
                  >
                    {getTechniqueIcon(event.technique)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-medium text-slate-700 dark:text-slate-200">
                        {event.title}
                      </h4>
                      {event.isOptimalSpacing && (
                        <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded-full">
                          ⭐ Óptimo
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-slate-500 dark:text-slate-400 mb-2">
                      <span>🕐 {event.startTime} - {event.endTime}</span>
                      {event.technique && (
                        <span>🧠 {event.technique}</span>
                      )}
                      {event.cognitiveLoad && (
                        <span>
                          {event.cognitiveLoad === 'low' ? '🟢 Baja' : 
                           event.cognitiveLoad === 'medium' ? '🟡 Media' : '🔴 Alta'}
                        </span>
                      )}
                    </div>
                    {event.studyTopics && event.studyTopics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {event.studyTopics.map((topic, index) => (
                          <span
                            key={index}
                            className="text-xs bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200 px-2 py-1 rounded"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                    {event.pomodoroSettings && (
                      <div className="text-xs text-slate-600 dark:text-slate-300 mb-2">
                        🍅 {event.pomodoroSettings.sessionsCount} pomodoros × {event.pomodoroSettings.workMinutes}min
                      </div>
                    )}
                    {event.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {event.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 text-center py-6">
              No hay eventos programados para este día.
            </p>
          )}
        </Card>
      )}

      {/* Eventos próximos */}
      <Card>
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">
          Próximos Eventos
        </h3>
        
        {events
          .filter(event => event.date >= today)
          .sort((a, b) => a.date.localeCompare(b.date))
          .slice(0, 5)
          .map(event => (
            <div
              key={event.id}
              className="flex items-center space-x-3 p-3 border-l-4 bg-slate-50 dark:bg-slate-700 rounded-r-lg mb-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
              style={{ borderLeftColor: (event.color || 'bg-gray-500').replace('bg-', '#') }}
              onClick={() => handleEditEvent(event)}
            >
              <div className="flex-1">
                <h4 className="font-medium text-slate-700 dark:text-slate-200">
                  {event.title}
                </h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {new Date(event.date + 'T00:00:00').toLocaleDateString('es-ES', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                  {` - ${event.startTime} - ${event.endTime}`}
                </p>
              </div>
            </div>
          ))}
        
        {events.filter(event => event.date >= today).length === 0 && (
          <p className="text-slate-500 dark:text-slate-400 text-center py-6">
            No tienes eventos próximos programados.
          </p>
        )}
      </Card>

      {/* Leyenda de colores disponibles */}
      <Card>
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-4">
          Colores Disponibles
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {availableColors.map(color => (
            <div key={color.class} className="flex items-center space-x-2">
              <div className={`w-4 h-4 rounded-full ${color.class}`}></div>
              <span className="text-sm text-slate-600 dark:text-slate-300">{color.name}</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Modal para crear/editar eventos */}
      <IntelligentEventModal
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveEvent}
        eventData={editingEvent}
        selectedDate={selectedDate || undefined}
      />

      {/* Modal de Analytics */}
      <CalendarAnalyticsModal
        isOpen={showAnalyticsModal}
        onClose={() => setShowAnalyticsModal(false)}
        events={events}
      />
    </div>
  );
};

export default CalendarScreen;
