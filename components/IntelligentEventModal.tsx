import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { ScheduledEvent } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';

interface IntelligentEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: Omit<ScheduledEvent, 'id' | 'createdAt'>) => void;
  eventData?: ScheduledEvent | null;
  selectedDate?: string;
}

const IntelligentEventModal: React.FC<IntelligentEventModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  eventData, 
  selectedDate 
}) => {
  const [flashcards] = useLocalStorage('flashcards', []);
  
  // Estados básicos
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(selectedDate || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('bg-blue-500');
  
  // Estados para planificación inteligente
  const [technique, setTechnique] = useState<ScheduledEvent['technique']>('spacing');
  const [relatedDeckId, setRelatedDeckId] = useState('');
  const [studyTopics, setStudyTopics] = useState<string[]>([]);
  const [newTopic, setNewTopic] = useState('');
  const [idealTimeSlot, setIdealTimeSlot] = useState<ScheduledEvent['idealTimeSlot']>('morning');
  const [cognitiveLoad, setCognitiveLoad] = useState<ScheduledEvent['cognitiveLoad']>('medium');
  
  // Estados para Pomodoro
  const [enablePomodoro, setEnablePomodoro] = useState(false);
  const [workMinutes, setWorkMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [sessionsCount, setSessionsCount] = useState(4);
  const [longBreakMinutes, setLongBreakMinutes] = useState(15);

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

  const techniqueOptions = [
    { value: 'spacing', label: '🔄 Repaso Espaciado', description: 'Revisiones programadas según SM-2' },
    { value: 'interleaving', label: '🔀 Intercalado', description: 'Múltiples temas alternados' },
    { value: 'elaboration', label: '✏️ Elaboración', description: 'Conexiones y explicaciones profundas' },
    { value: 'retrieval', label: '🧠 Recuperación Activa', description: 'Práctica de recordar sin ayuda' },
    { value: 'drawing', label: '🖼️ Mapas y Diagramas', description: 'Visualización de conceptos' },
    { value: 'pomodoro', label: '🍅 Sesión Pomodoro', description: 'Bloques de tiempo con descansos' },
    { value: 'mixed', label: '🎯 Sesión Mixta', description: 'Combinación de técnicas' },
  ];

  const timeSlotOptions = [
    { value: 'morning', label: '🌅 Mañana (6:00-12:00)', description: 'Alta concentración, tareas complejas' },
    { value: 'afternoon', label: '☀️ Tarde (12:00-18:00)', description: 'Energía estable, repasos activos' },
    { value: 'evening', label: '🌆 Noche (18:00-22:00)', description: 'Consolidación, repaso ligero' },
    { value: 'night', label: '🌙 Madrugada (22:00-6:00)', description: 'Solo en emergencias' },
  ];

  // Obtener decks únicos de flashcards
  const availableDecks = [...new Set(flashcards.map((card: any) => card.deckId))];

  useEffect(() => {
    if (eventData) {
      setTitle(eventData.title);
      setDate(eventData.date);
      setStartTime(eventData.startTime);
      setEndTime(eventData.endTime);
      setDescription(eventData.description || '');
      setColor(eventData.color || 'bg-blue-500');
      setTechnique(eventData.technique || 'spacing');
      setRelatedDeckId(eventData.relatedDeckId || '');
      setStudyTopics(eventData.studyTopics || []);
      setIdealTimeSlot(eventData.idealTimeSlot || 'morning');
      setCognitiveLoad(eventData.cognitiveLoad || 'medium');
      
      if (eventData.pomodoroSettings) {
        setEnablePomodoro(true);
        setWorkMinutes(eventData.pomodoroSettings.workMinutes);
        setBreakMinutes(eventData.pomodoroSettings.breakMinutes);
        setSessionsCount(eventData.pomodoroSettings.sessionsCount);
        setLongBreakMinutes(eventData.pomodoroSettings.longBreakMinutes);
      } else {
        setEnablePomodoro(false);
      }
    } else {
      // Reset para nuevo evento
      setTitle('');
      setDate(selectedDate || new Date().toISOString().split('T')[0]);
      setStartTime('09:00');
      setEndTime('10:00');
      setDescription('');
      setColor('bg-blue-500');
      setTechnique('spacing');
      setRelatedDeckId('');
      setStudyTopics([]);
      setIdealTimeSlot('morning');
      setCognitiveLoad('medium');
      setEnablePomodoro(false);
    }
  }, [eventData, isOpen, selectedDate]);

  const addTopic = () => {
    if (newTopic.trim() && !studyTopics.includes(newTopic.trim())) {
      setStudyTopics([...studyTopics, newTopic.trim()]);
      setNewTopic('');
    }
  };

  const removeTopic = (topicToRemove: string) => {
    setStudyTopics(studyTopics.filter(topic => topic !== topicToRemove));
  };

  const calculateOptimalDuration = () => {
    const start = new Date(`2000-01-01T${startTime}:00`);
    const end = new Date(`2000-01-01T${endTime}:00`);
    const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    
    if (technique === 'pomodoro' && enablePomodoro) {
      const totalPomodoroTime = sessionsCount * (workMinutes + breakMinutes);
      const suggestedEndTime = new Date(start.getTime() + totalPomodoroTime * 60000);
      return suggestedEndTime.toTimeString().slice(0, 5);
    }
    
    return endTime;
  };

  const handleSubmit = () => {
    if (!title.trim()) {
      alert('El título del evento es obligatorio.');
      return;
    }
    if (!date) {
      alert('La fecha del evento es obligatoria.');
      return;
    }

    const eventData: Omit<ScheduledEvent, 'id' | 'createdAt'> = {
      title: title.trim(),
      date,
      startTime,
      endTime: calculateOptimalDuration(),
      description: description.trim() || undefined,
      color,
      technique,
      relatedDeckId: relatedDeckId || undefined,
      studyTopics: studyTopics.length > 0 ? studyTopics : undefined,
      idealTimeSlot,
      cognitiveLoad,
      pomodoroSettings: enablePomodoro ? {
        workMinutes,
        breakMinutes,
        sessionsCount,
        longBreakMinutes,
        longBreakInterval: 4
      } : undefined,
      completed: false,
      isOptimalSpacing: technique === 'spacing'
    };

    onSave(eventData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={eventData ? "Editar Evento Inteligente" : "Crear Evento Inteligente"}>
      <div className="space-y-6 max-h-96 overflow-y-auto">
        {/* Información básica */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200">📝 Información Básica</h3>
          
          <div>
            <label htmlFor="eventTitle" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Título del Evento
            </label>
            <input
              type="text"
              id="eventTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
              placeholder="Ej: Repaso Química Orgánica"
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="eventDate" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Fecha
              </label>
              <input
                type="date"
                id="eventDate"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                required
              />
            </div>
            <div>
              <label htmlFor="eventStartTime" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Inicio
              </label>
              <input
                type="time"
                id="eventStartTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                required
              />
            </div>
            <div>
              <label htmlFor="eventEndTime" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Fin
              </label>
              <input
                type="time"
                id="eventEndTime"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                required
              />
            </div>
          </div>
        </div>

        {/* Técnica de estudio */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200">🧠 Técnica de Estudio</h3>
          
          <div className="space-y-2">
            {techniqueOptions.map(option => (
              <label key={option.value} className="flex items-center space-x-3 p-3 border border-slate-200 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700">
                <input
                  type="radio"
                  name="technique"
                  value={option.value}
                  checked={technique === option.value}
                  onChange={(e) => setTechnique(e.target.value as ScheduledEvent['technique'])}
                  className="h-4 w-4 text-cyan-600 focus:ring-cyan-500"
                />
                <div className="flex-1">
                  <div className="font-medium text-slate-700 dark:text-slate-200">{option.label}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">{option.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Configuración de Pomodoro */}
        {technique === 'pomodoro' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200">🍅 Configuración Pomodoro</h3>
            
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={enablePomodoro}
                onChange={(e) => setEnablePomodoro(e.target.checked)}
                className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 rounded"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Activar configuración automática de Pomodoro</span>
            </label>

            {enablePomodoro && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Trabajo (min)
                  </label>
                  <input
                    type="number"
                    value={workMinutes}
                    onChange={(e) => setWorkMinutes(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                    min="5"
                    max="60"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Descanso (min)
                  </label>
                  <input
                    type="number"
                    value={breakMinutes}
                    onChange={(e) => setBreakMinutes(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                    min="1"
                    max="30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Sesiones
                  </label>
                  <input
                    type="number"
                    value={sessionsCount}
                    onChange={(e) => setSessionsCount(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                    min="1"
                    max="10"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Descanso largo (min)
                  </label>
                  <input
                    type="number"
                    value={longBreakMinutes}
                    onChange={(e) => setLongBreakMinutes(Number(e.target.value))}
                    className="w-full p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                    min="10"
                    max="60"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Temas de estudio para intercalado */}
        {technique === 'interleaving' && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200">🔀 Temas para Intercalado</h3>
            
            <div className="flex space-x-2">
              <input
                type="text"
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="Ej: Química Orgánica"
                className="flex-1 p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
                onKeyPress={(e) => e.key === 'Enter' && addTopic()}
              />
              <Button onClick={addTopic} size="sm">Agregar</Button>
            </div>
            
            <div className="flex flex-wrap gap-2">
              {studyTopics.map((topic, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200"
                >
                  {topic}
                  <button
                    onClick={() => removeTopic(topic)}
                    className="ml-2 text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-200"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Configuración de contexto */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-200">⚙️ Optimización</h3>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Franja Horaria Ideal
            </label>
            <div className="space-y-2">
              {timeSlotOptions.map(option => (
                <label key={option.value} className="flex items-center space-x-3 p-2 border border-slate-200 dark:border-slate-600 rounded-lg cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700">
                  <input
                    type="radio"
                    name="timeSlot"
                    value={option.value}
                    checked={idealTimeSlot === option.value}
                    onChange={(e) => setIdealTimeSlot(e.target.value as ScheduledEvent['idealTimeSlot'])}
                    className="h-4 w-4 text-cyan-600 focus:ring-cyan-500"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-slate-700 dark:text-slate-200">{option.label}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Carga Cognitiva
            </label>
            <select
              value={cognitiveLoad}
              onChange={(e) => setCognitiveLoad(e.target.value as ScheduledEvent['cognitiveLoad'])}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
            >
              <option value="low">🟢 Baja - Repaso ligero, consolidación</option>
              <option value="medium">🟡 Media - Estudio activo, práctica</option>
              <option value="high">🔴 Alta - Conceptos nuevos, análisis profundo</option>
            </select>
          </div>
        </div>

        {/* Color del evento */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Color del Evento</label>
          <div className="flex flex-wrap gap-2">
            {availableColors.map(colorOption => (
              <button
                key={colorOption.class}
                type="button"
                onClick={() => setColor(colorOption.class)}
                className={`w-8 h-8 rounded-full ${colorOption.class} border-2 ${
                  color === colorOption.class 
                    ? 'ring-2 ring-offset-1 ring-slate-500 dark:ring-offset-slate-900 dark:ring-slate-400 border-transparent' 
                    : 'border-slate-300 dark:border-slate-600'
                }`}
                aria-label={`Seleccionar color ${colorOption.name}`}
              />
            ))}
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label htmlFor="eventDescription" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            Descripción (opcional)
          </label>
          <textarea
            id="eventDescription"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100"
            placeholder="Temas específicos, objetivos de la sesión, etc."
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end space-x-2">
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleSubmit}>
          {eventData ? "Guardar Cambios" : "Crear Evento Inteligente"}
        </Button>
      </div>
    </Modal>
  );
};

export default IntelligentEventModal;
