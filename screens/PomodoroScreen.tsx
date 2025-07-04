
import React, { useState, useEffect, useCallback } from 'react';
import { usePersistentSettings } from '../hooks/storage/usePersistentStore';
import Button from '../components/Button';
import Card from '../components/Card';
import Modal from '../components/Modal';
import { TimerIcon } from '../ui-assets';
import { PomodoroSettings, SessionReflection } from '../types';
import { 
  createPomodoroStartNotification, 
  createPomodoroBreakNotification, 
  createPomodoroWorkNotification,
  showBrowserNotification 
} from '../utils/notificationSystem';

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

const DEFAULT_SETTINGS: PomodoroSettings = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  sessionsBeforeLongBreak: 4,
};

const PomodoroScreen: React.FC = () => {
  const { getSetting, setSetting } = usePersistentSettings();
  
  const [settings, setSettingsState] = useState<PomodoroSettings>(DEFAULT_SETTINGS);
  const [sessionReflections, setSessionReflectionsState] = useState<SessionReflection[]>([]);
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(DEFAULT_SETTINGS.workMinutes * 60); // Usar DEFAULT_SETTINGS inicialmente
  const [isActive, setIsActive] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false); // Nuevo estado para tracking

  const [isReflectionModalOpen, setIsReflectionModalOpen] = useState(false);
  const [currentReflectionText, setCurrentReflectionText] = useState('');

  // Cargar configuraciones desde almacenamiento persistente
  useEffect(() => {
    const loadSettings = async () => {
      console.log('PomodoroScreen: Loading settings...');
      const savedSettings = await getSetting<PomodoroSettings>('pomodoro-settings');
      if (savedSettings) {
        console.log('PomodoroScreen: Loaded settings:', savedSettings);
        setSettingsState(savedSettings);
        setTimeLeft(savedSettings.workMinutes * 60); // Actualizar timeLeft con configuraciones cargadas
      } else {
        console.log('PomodoroScreen: Using default settings');
        setTimeLeft(DEFAULT_SETTINGS.workMinutes * 60);
      }
      
      const savedReflections = await getSetting<SessionReflection[]>('sessionReflections');
      if (savedReflections) {
        setSessionReflectionsState(savedReflections);
      }
      
      setSettingsLoaded(true);
    };
    
    loadSettings();
  }, [getSetting]);

  // Guardar configuraciones cuando cambien
  const setSettings = useCallback(async (newSettings: PomodoroSettings | ((prev: PomodoroSettings) => PomodoroSettings)) => {
    const updatedSettings = typeof newSettings === 'function' ? newSettings(settings) : newSettings;
    setSettingsState(updatedSettings);
    await setSetting('pomodoro-settings', updatedSettings);
  }, [settings, setSetting]);

  // Guardar reflexiones cuando cambien
  const setSessionReflections = useCallback(async (newReflections: SessionReflection[] | ((prev: SessionReflection[]) => SessionReflection[])) => {
    const updatedReflections = typeof newReflections === 'function' ? newReflections(sessionReflections) : newReflections;
    setSessionReflectionsState(updatedReflections);
    await setSetting('sessionReflections', updatedReflections);
  }, [sessionReflections, setSetting]);

  // Verificar permisos de notificación
  useEffect(() => {
    if ('Notification' in window) {
      setHasNotificationPermission(Notification.permission === 'granted');
    }
  }, []);

  // Solicitar permisos de notificación
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setHasNotificationPermission(permission === 'granted');
    }
  };

  // Mostrar notificación
  const showNotification = (title: string, body: string) => {
    if (hasNotificationPermission) {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    }
  };

  // Mostrar notificación inteligente
  const showSmartNotification = (sessionNumber?: number, totalSessions?: number, isBreak = false, isLongBreak = false) => {
    let notification;
    
    if (isBreak) {
      notification = createPomodoroBreakNotification(isLongBreak, isLongBreak ? settings.longBreakMinutes : settings.shortBreakMinutes);
    } else if (sessionNumber) {
      notification = createPomodoroStartNotification(sessionNumber, totalSessions || settings.sessionsBeforeLongBreak, settings.workMinutes);
    } else {
      notification = createPomodoroWorkNotification(settings.workMinutes);
    }
    
    showBrowserNotification(notification);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const getTimeForMode = useCallback((currentMode: TimerMode): number => {
    switch (currentMode) {
      case 'work': return settings.workMinutes * 60;
      case 'shortBreak': return settings.shortBreakMinutes * 60;
      case 'longBreak': return settings.longBreakMinutes * 60;
      default: return settings.workMinutes * 60;
    }
  }, [settings]);

  const switchModeAndReset = useCallback((nextMode: TimerMode) => {
    setMode(nextMode);
    setTimeLeft(getTimeForMode(nextMode));
    setIsActive(false);
  }, [getTimeForMode]);

  const resetTimer = useCallback(() => {
    console.log('PomodoroScreen: resetTimer called');
    setIsActive(false);
    setTimeLeft(getTimeForMode(mode));
  }, [mode, getTimeForMode]);
  
  // Solo reinicia automáticamente cuando cambian los settings o el modo, no cuando se pausa
  useEffect(() => {
    if (settingsLoaded) {
      console.log('PomodoroScreen: Updating timeLeft for mode:', mode, 'with settings:', settings);
      setTimeLeft(getTimeForMode(mode));
    }
  }, [settings, mode, getTimeForMode, settingsLoaded]);

  useEffect(() => {
    if (!settingsLoaded) return; // No iniciar timer hasta que settings estén cargados
    
    let interval: NodeJS.Timeout | undefined = undefined;

    console.log('PomodoroScreen: Timer effect - isActive:', isActive, 'timeLeft:', timeLeft);

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => {
          console.log('PomodoroScreen: Timer tick, prevTime:', prevTime);
          return prevTime - 1;
        });
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      console.log('PomodoroScreen: Timer completed for mode:', mode);
      setIsActive(false);
      
      if (mode === 'work') {
        const newCompletedSessions = completedSessions + 1;
        setCompletedSessions(newCompletedSessions);
        
        // Determinar si es descanso largo o corto
        const isLongBreak = newCompletedSessions % settings.sessionsBeforeLongBreak === 0;
        
        showSmartNotification(newCompletedSessions, settings.sessionsBeforeLongBreak, true, isLongBreak);
        
        setIsReflectionModalOpen(true);
        setSessionCount(prev => prev + 1);
      } else {
        // Fin del descanso
        showSmartNotification();
        switchModeAndReset('work');
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, mode, completedSessions, settings, switchModeAndReset, settingsLoaded]);

  const handleSaveReflectionAndSwitchMode = async () => {
    if (currentReflectionText.trim()) {
      const newReflection: SessionReflection = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        text: currentReflectionText.trim(),
        sessionType: 'pomodoro',
      };
      await setSessionReflections(prev => [newReflection, ...prev]);
    }
    setIsReflectionModalOpen(false);
    setCurrentReflectionText('');
    
    // Determinar el próximo modo basado en sesiones completadas
    const isLongBreak = completedSessions % settings.sessionsBeforeLongBreak === 0;
    switchModeAndReset(isLongBreak ? 'longBreak' : 'shortBreak');
  };

  const toggleTimer = async () => {
    console.log('PomodoroScreen: toggleTimer called, current isActive:', isActive);
    // Solicitar permisos si es la primera vez
    if (!isActive && !hasNotificationPermission) {
      await requestNotificationPermission();
    }
    setIsActive(!isActive);
    console.log('PomodoroScreen: isActive will be:', !isActive);
  };

  const handleSkip = () => {
    console.log('PomodoroScreen: handleSkip called, current mode:', mode);
    setIsActive(false);
    if (mode === 'work') {
      setIsReflectionModalOpen(true);
      setSessionCount(prev => prev + 1);
      setCompletedSessions(prev => prev + 1);
    } else {
      switchModeAndReset('work');
    }
  };
  
  const getModeText = (currentMode: TimerMode): string => {
    switch (currentMode) {
      case 'work': return '🍅 Enfócate';
      case 'shortBreak': return '☕ Descanso Corto';
      case 'longBreak': return '🌿 Descanso Largo';
      default: return '🍅 Enfócate';
    }
  };

  const getModeColor = (currentMode: TimerMode): string => {
    switch (currentMode) {
      case 'work': return 'bg-rose-500 dark:bg-rose-600';
      case 'shortBreak': return 'bg-emerald-500 dark:bg-emerald-600';
      case 'longBreak': return 'bg-blue-500 dark:bg-blue-600';
      default: return 'bg-rose-500 dark:bg-rose-600';
    }
  };

  const handleSettingsChange = async (field: keyof PomodoroSettings, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0 && numValue <= 120) { 
      await setSettings(prev => ({...prev, [field]: numValue }));
    }
  };

  const currentPhaseText = getModeText(mode);
  const phaseColor = getModeColor(mode);

  // Mostrar loading hasta que las configuraciones se carguen
  if (!settingsLoaded) {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-2"></div>
          <p className="text-slate-600 dark:text-slate-400">Cargando configuraciones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col items-center space-y-6 h-[calc(100vh-120px)] sm:h-auto justify-center">
      <header className="text-center">
        <TimerIcon className="w-12 h-12 mx-auto text-cyan-500 dark:text-cyan-400 mb-2" />
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Temporizador Pomodoro</h1>
      </header>

      <Card className="w-full max-w-sm text-center">
        <div className={`p-4 rounded-t-lg text-white ${phaseColor}`}>
            <p className="text-xl font-semibold">{currentPhaseText}</p>
        </div>
        <div className="py-8">
            <p className="text-6xl font-mono font-bold text-slate-800 dark:text-slate-100 tabular-nums">
            {formatTime(timeLeft)}
            </p>
        </div>
        <div className="grid grid-cols-2 gap-2 px-4 pb-4">
          <Button 
            onClick={toggleTimer} 
            variant={isActive ? 'secondary' : 'primary'} 
            size="lg" 
            className="w-full"
          >
            {isActive ? 'Pausar' : 'Iniciar'}
          </Button>
          <Button 
            onClick={resetTimer} 
            variant="ghost" 
            size="lg" 
            className="w-full" 
            disabled={isActive}
          >
            Reiniciar
          </Button>
        </div>
         <Button 
           onClick={handleSkip} 
           variant="ghost" 
           size="sm" 
           className="w-full text-sm text-slate-500 dark:text-slate-400 mt-2"
         >
            Saltar {mode === 'work' ? 'Enfoque' : 'Descanso'}
        </Button>
      </Card>
      
      <Card className="w-full max-w-sm">
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3 text-center">Ajustes de Duración (min)</h3>
        <div className="flex justify-around items-center space-x-2">
            <div>
                <label htmlFor="workMinutes" className="block text-sm text-slate-600 dark:text-slate-300 mb-1 text-center">Enfoque</label>
                <input 
                    type="number" 
                    id="workMinutes" 
                    value={settings.workMinutes}
                    onChange={(e) => handleSettingsChange('workMinutes', e.target.value)}
                    className="pomodoro-input text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 focus:ring-cyan-500 focus:border-cyan-500"
                    aria-label="Minutos de enfoque"
                    disabled={isActive}
                />
            </div>
            <div>
                <label htmlFor="shortBreakMinutes" className="block text-sm text-slate-600 dark:text-slate-300 mb-1 text-center">Descanso</label>
                 <input 
                    type="number" 
                    id="shortBreakMinutes" 
                    value={settings.shortBreakMinutes}
                    onChange={(e) => handleSettingsChange('shortBreakMinutes', e.target.value)}
                    className="pomodoro-input text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600 focus:ring-cyan-500 focus:border-cyan-500"
                    aria-label="Minutos de descanso corto"
                    disabled={isActive}
                />
            </div>
        </div>
      </Card>
       <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
         Sesiones completadas: {completedSessions} | Actual: {sessionCount}
       </p>
       {!hasNotificationPermission && (
         <div className="text-center">
           <p className="text-xs text-amber-600 dark:text-amber-400 mb-2">
             Las notificaciones están deshabilitadas. Habilítalas para recibir alertas.
           </p>
           <Button
             variant="ghost"
             size="sm"
             onClick={requestNotificationPermission}
             className="text-xs"
           >
             Activar Notificaciones
           </Button>
         </div>
       )}


       <Modal isOpen={isReflectionModalOpen} onClose={() => { /* Consider if direct close is allowed or must save */}} title="Reflexión de Sesión Pomodoro">
        <div>
          <label htmlFor="pomodoroReflectionText" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
            ¿Cómo fue tu sesión de enfoque? ¿Qué podrías ajustar?
          </label>
          <textarea
            id="pomodoroReflectionText"
            value={currentReflectionText}
            onChange={(e) => setCurrentReflectionText(e.target.value)}
            rows={4}
            className="w-full p-2 border border-slate-300 rounded-md focus:ring-cyan-500 focus:border-cyan-500 dark:bg-slate-700 dark:border-slate-600 dark:text-slate-100 dark:focus:ring-cyan-400 dark:focus:border-cyan-400"
            placeholder="Ej: Mantuve la concentración bien, pero debería silenciar el teléfono la próxima vez..."
          />
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={handleSaveReflectionAndSwitchMode}>Guardar y Empezar Descanso</Button>
        </div>
      </Modal>
    </div>
  );
};

export default PomodoroScreen;
