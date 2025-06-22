
import React, { useState, useMemo } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { ScheduledEvent } from '../types';
import Button from '../components/Button';
import Card from '../components/Card';
import ScheduleEventModal from '../components/ScheduleEventModal';
import { CalendarDaysIcon, PlusIcon, TrashIcon, EditIcon } from '../ui-assets';

const ScheduleScreen: React.FC = () => {
  const [events, setEvents] = useLocalStorage<ScheduledEvent[]>('scheduledEvents', []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<ScheduledEvent | null>(null);

  const openModalForNew = () => {
    setEditingEvent(null);
    setIsModalOpen(true);
  };

  const openModalForEdit = (event: ScheduledEvent) => {
    setEditingEvent(event);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
  };

  const handleSaveEvent = (eventData: Omit<ScheduledEvent, 'id' | 'createdAt'>) => {
    if (editingEvent) {
      setEvents(prev => prev.map(e => e.id === editingEvent.id ? { ...editingEvent, ...eventData } : e));
    } else {
      const newEvent: ScheduledEvent = {
        id: Date.now().toString(),
        ...eventData,
        createdAt: new Date().toISOString(),
      };
      setEvents(prev => [...prev, newEvent]);
    }
    closeModal();
  };

  const handleDeleteEvent = (id: string) => {
    if (window.confirm('¿Seguro que quieres eliminar este evento de la agenda?')) {
      setEvents(prev => prev.filter(e => e.id !== id));
    }
  };

  const formatDateForDisplay = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00'); // Ensure date is parsed as local
    return date.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  const formatTimeForDisplay = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
  };


  const groupedEvents = useMemo(() => {
    const sortedEvents = [...events].sort((a, b) => new Date(a.date + 'T' + (a.startTime || '00:00')).getTime() - new Date(b.date + 'T' + (b.startTime || '00:00')).getTime());
    
    return sortedEvents.reduce((acc, event) => {
      const dateKey = event.date;
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(event);
      return acc;
    }, {} as Record<string, ScheduledEvent[]>);
  }, [events]);

  const sortedDateKeys = Object.keys(groupedEvents).sort((a,b) => new Date(a).getTime() - new Date(b).getTime());

  const defaultColors: { name: string, class: string }[] = [
    { name: 'Cian', class: 'bg-cyan-500' },
    { name: 'Esmeralda', class: 'bg-emerald-500' },
    { name: 'Violeta', class: 'bg-violet-500' },
    { name: 'Ámbar', class: 'bg-amber-500' },
    { name: 'Rosa', class: 'bg-pink-500' },
    { name: 'Gris', class: 'bg-slate-500' },
  ];


  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center">
          <CalendarDaysIcon className="w-8 h-8 text-cyan-500 dark:text-cyan-400 mr-2" />
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Mi Agenda</h1>
        </div>
        <Button onClick={openModalForNew} size="sm" leftIcon={<PlusIcon className="w-4 h-4" />}>
          Agendar Evento
        </Button>
      </header>

      {events.length === 0 && (
        <Card className="text-center py-8 mt-4">
          <CalendarDaysIcon className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">Tu agenda está vacía.</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">Añade eventos para organizar tu tiempo de estudio.</p>
          <Button onClick={openModalForNew} className="mt-4">Agendar mi primer evento</Button>
        </Card>
      )}

      {sortedDateKeys.map(dateKey => (
        <div key={dateKey} className="mb-6">
          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-3 sticky top-0 bg-slate-50 dark:bg-slate-900 py-2 z-10">
            {formatDateForDisplay(dateKey)}
          </h2>
          <div className="space-y-3">
            {groupedEvents[dateKey].map(event => (
              <Card key={event.id} className={`border-l-4 ${event.color || 'border-cyan-500'} dark:bg-slate-800`}>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">{event.title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {formatTimeForDisplay(event.startTime)} - {formatTimeForDisplay(event.endTime)}
                    </p>
                    {event.description && <p className="mt-1 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{event.description}</p>}
                  </div>
                  <div className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-1 mt-1 sm:mt-0">
                    <Button variant="ghost" size="sm" onClick={() => openModalForEdit(event)} aria-label="Editar evento">
                      <EditIcon className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteEvent(event.id)} className="text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-700/50 dark:text-rose-400" aria-label="Eliminar evento">
                      <TrashIcon className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
      
      <ScheduleEventModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSaveEvent}
        eventData={editingEvent}
        availableColors={defaultColors}
      />
    </div>
  );
};

export default ScheduleScreen;
