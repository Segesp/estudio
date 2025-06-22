import React, { useState } from 'react';
import { FunnelIcon, ChartBarIcon, XMarkIcon } from '../ui-assets';
import Button from './Button';
import { ScheduledEvent } from '../types';

interface CalendarFiltersProps {
  events: ScheduledEvent[];
  onFiltersChange: (filteredEvents: ScheduledEvent[]) => void;
  onAnalyticsOpen: () => void;
}

interface FilterState {
  techniques: string[];
  cognitiveLoads: string[];
  timeSlots: string[];
  completionStatus: 'all' | 'completed' | 'pending';
  dateRange: {
    start: string;
    end: string;
  };
  optimalSpacingOnly: boolean;
}

const CalendarFilters: React.FC<CalendarFiltersProps> = ({
  events,
  onFiltersChange,
  onAnalyticsOpen
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    techniques: [],
    cognitiveLoads: [],
    timeSlots: [],
    completionStatus: 'all',
    dateRange: {
      start: '',
      end: ''
    },
    optimalSpacingOnly: false
  });

  // Obtener valores únicos para los filtros
  const availableTechniques = [...new Set(events.map(e => e.technique).filter(Boolean))];
  const availableCognitiveLoads = ['low', 'medium', 'high'];
  const availableTimeSlots = ['morning', 'afternoon', 'evening', 'night'];

  const techniqueLabels = {
    spacing: 'Repaso Espaciado',
    interleaving: 'Intercalado',
    elaboration: 'Elaboración',
    retrieval: 'Recuperación',
    drawing: 'Dibujo',
    pomodoro: 'Pomodoro',
    mixed: 'Mixto'
  };

  const cognitiveLoadLabels = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta'
  };

  const timeSlotLabels = {
    morning: 'Mañana',
    afternoon: 'Tarde',
    evening: 'Tarde-Noche',
    night: 'Noche'
  };

  // Aplicar filtros
  const applyFilters = (newFilters: FilterState) => {
    let filteredEvents = [...events];

    // Filtrar por técnicas
    if (newFilters.techniques.length > 0) {
      filteredEvents = filteredEvents.filter(event => 
        newFilters.techniques.includes(event.technique || '')
      );
    }

    // Filtrar por carga cognitiva
    if (newFilters.cognitiveLoads.length > 0) {
      filteredEvents = filteredEvents.filter(event => 
        newFilters.cognitiveLoads.includes(event.cognitiveLoad || '')
      );
    }

    // Filtrar por horario
    if (newFilters.timeSlots.length > 0) {
      filteredEvents = filteredEvents.filter(event => 
        newFilters.timeSlots.includes(event.idealTimeSlot || '')
      );
    }

    // Filtrar por estado de completación
    if (newFilters.completionStatus !== 'all') {
      filteredEvents = filteredEvents.filter(event => {
        if (newFilters.completionStatus === 'completed') {
          return event.completed === true;
        } else {
          return event.completed !== true;
        }
      });
    }

    // Filtrar por rango de fechas
    if (newFilters.dateRange.start && newFilters.dateRange.end) {
      filteredEvents = filteredEvents.filter(event => 
        event.date >= newFilters.dateRange.start && 
        event.date <= newFilters.dateRange.end
      );
    }

    // Filtrar solo ventanas óptimas
    if (newFilters.optimalSpacingOnly) {
      filteredEvents = filteredEvents.filter(event => event.isOptimalSpacing);
    }

    onFiltersChange(filteredEvents);
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  const handleArrayFilterToggle = (key: 'techniques' | 'cognitiveLoads' | 'timeSlots', value: string) => {
    const currentArray = filters[key];
    const newArray = currentArray.includes(value)
      ? currentArray.filter(item => item !== value)
      : [...currentArray, value];
    
    handleFilterChange(key, newArray);
  };

  const clearAllFilters = () => {
    const emptyFilters: FilterState = {
      techniques: [],
      cognitiveLoads: [],
      timeSlots: [],
      completionStatus: 'all',
      dateRange: { start: '', end: '' },
      optimalSpacingOnly: false
    };
    setFilters(emptyFilters);
    applyFilters(emptyFilters);
  };

  const hasActiveFilters = () => {
    return (
      filters.techniques.length > 0 ||
      filters.cognitiveLoads.length > 0 ||
      filters.timeSlots.length > 0 ||
      filters.completionStatus !== 'all' ||
      filters.dateRange.start !== '' ||
      filters.dateRange.end !== '' ||
      filters.optimalSpacingOnly
    );
  };

  return (
    <div className="mb-4">
      {/* Botones de control */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Button
            variant={isOpen ? "primary" : "ghost"}
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            leftIcon={<FunnelIcon className="w-4 h-4" />}
          >
            Filtros
            {hasActiveFilters() && (
              <span className="ml-2 bg-cyan-500 text-white text-xs rounded-full px-2 py-0.5">
                {[
                  ...filters.techniques,
                  ...filters.cognitiveLoads,
                  ...filters.timeSlots,
                  ...(filters.completionStatus !== 'all' ? [filters.completionStatus] : []),
                  ...(filters.optimalSpacingOnly ? ['optimal'] : [])
                ].length}
              </span>
            )}
          </Button>
          
          {hasActiveFilters() && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              leftIcon={<XMarkIcon className="w-4 h-4" />}
            >
              Limpiar
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onAnalyticsOpen}
          leftIcon={<ChartBarIcon className="w-4 h-4" />}
        >
          Analytics
        </Button>
      </div>

      {/* Panel de filtros */}
      {isOpen && (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-4 border border-slate-200 dark:border-slate-700">
          
          {/* Filtro por técnicas */}
          <div>
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Técnicas de Estudio
            </h4>
            <div className="flex flex-wrap gap-2">
              {availableTechniques.map(technique => {
                if (!technique) return null;
                return (
                  <button
                    key={technique}
                    onClick={() => handleArrayFilterToggle('techniques', technique)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      filters.techniques.includes(technique)
                        ? 'bg-cyan-500 text-white'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
                    }`}
                  >
                    {techniqueLabels[technique as keyof typeof techniqueLabels] || technique}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filtro por carga cognitiva */}
          <div>
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Carga Cognitiva
            </h4>
            <div className="flex flex-wrap gap-2">
              {availableCognitiveLoads.map(load => (
                <button
                  key={load}
                  onClick={() => handleArrayFilterToggle('cognitiveLoads', load)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    filters.cognitiveLoads.includes(load)
                      ? 'bg-cyan-500 text-white'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
                  }`}
                >
                  {load === 'low' ? '🟢' : load === 'medium' ? '🟡' : '🔴'}{' '}
                  {cognitiveLoadLabels[load as keyof typeof cognitiveLoadLabels]}
                </button>
              ))}
            </div>
          </div>

          {/* Filtro por horario */}
          <div>
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Horario Ideal
            </h4>
            <div className="flex flex-wrap gap-2">
              {availableTimeSlots.map(slot => (
                <button
                  key={slot}
                  onClick={() => handleArrayFilterToggle('timeSlots', slot)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    filters.timeSlots.includes(slot)
                      ? 'bg-cyan-500 text-white'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
                  }`}
                >
                  {timeSlotLabels[slot as keyof typeof timeSlotLabels]}
                </button>
              ))}
            </div>
          </div>

          {/* Estado de completación */}
          <div>
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Estado
            </h4>
            <div className="flex flex-wrap gap-2">
              {(['all', 'completed', 'pending'] as const).map(status => (
                <button
                  key={status}
                  onClick={() => handleFilterChange('completionStatus', status)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    filters.completionStatus === status
                      ? 'bg-cyan-500 text-white'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
                  }`}
                >
                  {status === 'all' ? 'Todos' : status === 'completed' ? 'Completados' : 'Pendientes'}
                </button>
              ))}
            </div>
          </div>

          {/* Rango de fechas */}
          <div>
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Rango de Fechas
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Desde
                </label>
                <input
                  type="date"
                  value={filters.dateRange.start}
                  onChange={(e) => handleFilterChange('dateRange', {
                    ...filters.dateRange,
                    start: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 dark:text-slate-400 mb-1">
                  Hasta
                </label>
                <input
                  type="date"
                  value={filters.dateRange.end}
                  onChange={(e) => handleFilterChange('dateRange', {
                    ...filters.dateRange,
                    end: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Ventanas óptimas */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={filters.optimalSpacingOnly}
                onChange={(e) => handleFilterChange('optimalSpacingOnly', e.target.checked)}
                className="rounded border-slate-300 dark:border-slate-600 text-cyan-600 focus:ring-cyan-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">
                Solo ventanas óptimas de repaso ⭐
              </span>
            </label>
          </div>

        </div>
      )}
    </div>
  );
};

export default CalendarFilters;
