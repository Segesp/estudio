import React, { useState, useMemo } from 'react';
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon } from '../ui-assets';
import Button from '../components/Button';
import Card from '../components/Card';
import ScheduleEventModal from '../components/ScheduleEventModal';
import useLocalStorage from '../hooks/useLocalStorage';
import { ScheduledEvent } from '../types';

const CalendarScreen: React.FC = () => {
  const [events, setEvents] = useLocalStorage<ScheduledEvent[]>('calendar-events', []);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduledEvent | null>(null);

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
    return events.filter(event => event.date === date);
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

  // Funciones para manejar eventos
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
      // Crear nuevo evento
      const newEvent: ScheduledEvent = {
        ...eventData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
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

  const today = formatDate(new Date());

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center">
          <CalendarDaysIcon className="w-8 h-8 text-cyan-500 dark:text-cyan-400 mr-2" />
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Calendario</h1>
        </div>
        <Button
          onClick={handleCreateEvent}
          size="sm"
          leftIcon={<PlusIcon className="w-4 h-4" />}
        >
          Evento
        </Button>
      </header>

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

            return (
              <div
                key={day}
                onClick={() => handleDayClick(day)}
                className={`
                  h-20 p-1 border border-slate-200 dark:border-slate-600 cursor-pointer
                  hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors
                  ${isTodayDate ? 'bg-cyan-50 dark:bg-cyan-900/20 border-cyan-300 dark:border-cyan-600' : ''}
                  ${isSelected ? 'bg-cyan-100 dark:bg-cyan-800/30' : ''}
                `}
              >
                <div className="flex flex-col h-full">
                  <span
                    className={`
                      text-sm font-medium mb-1 text-center
                      ${isTodayDate ? 'text-cyan-700 dark:text-cyan-300' : 'text-slate-700 dark:text-slate-200'}
                    `}
                  >
                    {day}
                  </span>
                  
                  {/* Indicadores de eventos */}
                  <div className="flex-1 space-y-0.5 overflow-hidden">
                    {dayEvents.slice(0, 2).map(event => (
                      <div
                        key={event.id}
                        className={`w-full h-1.5 rounded-full ${event.color || 'bg-gray-500'}`}
                        title={event.title}
                      ></div>
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
                  className="flex items-start space-x-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                  onClick={() => handleEditEvent(event)}
                >
                  <div
                    className={`w-4 h-4 rounded-full ${event.color || 'bg-gray-500'} flex-shrink-0 mt-0.5`}
                  ></div>
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-700 dark:text-slate-200">
                      {event.title}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {event.startTime} - {event.endTime}
                    </p>
                    {event.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
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
      <ScheduleEventModal
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveEvent}
        eventData={editingEvent}
        availableColors={availableColors}
      />
    </div>
  );
};

export default CalendarScreen;
