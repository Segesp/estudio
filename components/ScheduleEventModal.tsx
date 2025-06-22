
import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { ScheduledEvent } from '../types';

interface ScheduleEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: Omit<ScheduledEvent, 'id' | 'createdAt'>) => void;
  eventData?: ScheduledEvent | null;
  availableColors?: { name: string, class: string }[];
}

const ScheduleEventModal: React.FC<ScheduleEventModalProps> = ({ isOpen, onClose, onSave, eventData, availableColors }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState(availableColors && availableColors.length > 0 ? availableColors[0].class : 'bg-cyan-500');

  useEffect(() => {
    if (eventData) {
      setTitle(eventData.title);
      setDate(eventData.date);
      setStartTime(eventData.startTime);
      setEndTime(eventData.endTime);
      setDescription(eventData.description || '');
      setSelectedColor(eventData.color || (availableColors && availableColors.length > 0 ? availableColors[0].class : 'bg-cyan-500') );
    } else {
      // Defaults for new event
      setTitle('');
      setDate(new Date().toISOString().split('T')[0]); // Today's date
      setStartTime('09:00');
      setEndTime('10:00');
      setDescription('');
      setSelectedColor(availableColors && availableColors.length > 0 ? availableColors[0].class : 'bg-cyan-500');
    }
  }, [eventData, isOpen, availableColors]);

  const handleSubmit = () => {
    if (!title.trim()) {
      alert('El título del evento es obligatorio.');
      return;
    }
    if (!date) {
      alert('La fecha del evento es obligatoria.');
      return;
    }
    if (!startTime || !endTime) {
        alert('Las horas de inicio y fin son obligatorias.');
        return;
    }
    if (endTime <= startTime) {
        alert('La hora de fin debe ser posterior a la hora de inicio.');
        return;
    }

    onSave({ title, date, startTime, endTime, description, color: selectedColor });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={eventData ? "Editar Evento" : "Agendar Nuevo Evento"}>
      <div className="space-y-4">
        <div>
          <label htmlFor="eventTitle" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título del Evento</label>
          <input
            type="text"
            id="eventTitle"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:focus:ring-cyan-400 dark:focus:border-cyan-400"
            placeholder="Ej: Estudiar Capítulo 3 de Física"
            required
          />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
                <label htmlFor="eventDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Fecha</label>
                <input
                    type="date"
                    id="eventDate"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:focus:ring-cyan-400 dark:focus:border-cyan-400"
                    required
                />
            </div>
            <div>
                <label htmlFor="eventStartTime" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hora Inicio</label>
                <input
                    type="time"
                    id="eventStartTime"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:focus:ring-cyan-400 dark:focus:border-cyan-400"
                    required
                />
            </div>
             <div>
                <label htmlFor="eventEndTime" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hora Fin</label>
                <input
                    type="time"
                    id="eventEndTime"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:focus:ring-cyan-400 dark:focus:border-cyan-400"
                    required
                />
            </div>
        </div>

        <div>
          <label htmlFor="eventDescription" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descripción (opcional)</label>
          <textarea
            id="eventDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:focus:ring-cyan-400 dark:focus:border-cyan-400"
            placeholder="Detalles adicionales, temas a cubrir, etc."
          />
        </div>

        {availableColors && availableColors.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Color del Evento</label>
            <div className="flex flex-wrap gap-2">
              {availableColors.map(color => (
                <button
                  key={color.class}
                  type="button"
                  onClick={() => setSelectedColor(color.class)}
                  className={`w-8 h-8 rounded-full ${color.class} border-2 ${selectedColor === color.class ? 'ring-2 ring-offset-1 ring-slate-500 dark:ring-offset-slate-900 dark:ring-slate-400 border-transparent' : 'border-slate-300 dark:border-slate-600'}`}
                  aria-label={`Seleccionar color ${color.name}`}
                />
              ))}
            </div>
          </div>
        )}

      </div>
      <div className="mt-6 flex justify-end space-x-2">
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit}>{eventData ? "Guardar Cambios" : "Agendar Evento"}</Button>
      </div>
    </Modal>
  );
};

export default ScheduleEventModal;
