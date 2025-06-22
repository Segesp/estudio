
import React, { useState, useEffect, useCallback } from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import Button from '../components/Button';
import Card from '../components/Card';
import Modal from '../components/Modal'; // Import Modal
import { TimerIcon } from '../ui-assets';
import { PomodoroSettings, SessionReflection } from '../types';
import useNotifications from '../hooks/useNotifications'; // Import the hook

type TimerMode = 'work' | 'shortBreak';

const DEFAULT_SETTINGS: PomodoroSettings = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15, // Not used in this iteration
  sessionsBeforeLongBreak: 4, // Not used in this iteration
};

const PomodoroScreen: React.FC = () => {
  const [settings, setSettings] = useLocalStorage<PomodoroSettings>('pomodoro-settings', DEFAULT_SETTINGS);
  const [, setSessionReflections] = useLocalStorage<SessionReflection[]>('sessionReflections', []);
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(settings.workMinutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionCount, setSessionCount] = useState(0); 

  const [isReflectionModalOpen, setIsReflectionModalOpen] = useState(false);
  const [currentReflectionText, setCurrentReflectionText] = useState('');

  const { showNotification, requestPermission, permission } = useNotifications(); // Use the hook

  // Request permission when component mounts, if not already granted or denied
  useEffect(() => {
    if (permission === 'default') {
      // Optionally prompt user or just wait for first notification attempt
      // For now, let showNotification handle implicit request
    }
  }, [permission, requestPermission]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  const switchModeAndReset = useCallback((nextMode: TimerMode) => {
    setMode(nextMode);
    if (nextMode === 'work') {
      setTimeLeft(settings.workMinutes * 60);
    } else {
      setTimeLeft(settings.shortBreakMinutes * 60);
    }
  }, [settings]);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    if (mode === 'work') {
      setTimeLeft(settings.workMinutes * 60);
    } else {
      setTimeLeft(settings.shortBreakMinutes * 60);
    }
  }, [mode, settings]);
  
  useEffect(() => {
    if (!isActive) {
        resetTimer();
    }
  }, [settings, mode, isActive, resetTimer]);


  useEffect(() => {
    let interval: number | undefined = undefined;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      
      const notificationTitle = mode === 'work' ? "Pomodoro: ¡Tiempo de descanso!" : "Pomodoro: ¡A trabajar!";
      const notificationBody = mode === 'work' 
        ? `Has completado una sesión de enfoque. Tómate ${settings.shortBreakMinutes} minutos.`
        : `El descanso ha terminado. ¡Es hora de enfocarse durante ${settings.workMinutes} minutos!`;
      showNotification(notificationTitle, { body: notificationBody, icon: '/icon-192.png' }); // Assuming you have an icon
      
      if (mode === 'work') {
        setIsReflectionModalOpen(true); 
      } else { // break ended
        switchModeAndReset('work');
      }
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode, switchModeAndReset, settings, showNotification]);

  const handleSaveReflectionAndSwitchMode = () => {
    if (currentReflectionText.trim()) {
      const newReflection: SessionReflection = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        text: currentReflectionText.trim(),
        sessionType: 'pomodoro',
      };
      setSessionReflections(prev => [newReflection, ...prev]);
    }
    setIsReflectionModalOpen(false);
    setCurrentReflectionText('');
    
    setSessionCount(prev => prev + 1);
    switchModeAndReset('shortBreak');
  };


  const toggleTimer = () => {
    // Request permission on first start if not already decided
    if (!isActive && permission === 'default') {
        requestPermission();
    }
    setIsActive(!isActive);
  };

  const handleSkip = () => {
    setIsActive(false);
    if (mode === 'work') {
       setIsReflectionModalOpen(true); 
    } else {
       switchModeAndReset('work');
    }
  };
  
  const handleSettingsChange = (field: keyof PomodoroSettings, value: string) => {
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0 && numValue <= 120) { 
        setSettings(prev => ({...prev, [field]: numValue }));
    }
  };

  const currentPhaseText = mode === 'work' ? 'Enfócate' : 'Descanso Corto';
  const phaseColor = mode === 'work' ? 'bg-rose-500 dark:bg-rose-600' : 'bg-emerald-500 dark:bg-emerald-600';

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
          <Button onClick={toggleTimer} variant={isActive ? 'secondary' : 'primary'} size="lg" className="w-full" disabled={isReflectionModalOpen}>
            {isActive ? 'Pausar' : 'Iniciar'}
          </Button>
          <Button onClick={resetTimer} variant="ghost" size="lg" className="w-full" disabled={isActive || isReflectionModalOpen}>
            Reiniciar
          </Button>
        </div>
         <Button onClick={handleSkip} variant="ghost" size="sm" className="w-full text-sm text-slate-500 dark:text-slate-400 mt-2" disabled={isReflectionModalOpen || isActive && timeLeft === 0}>
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
       <p className="text-sm text-slate-500 dark:text-slate-400 text-center">Sesiones de enfoque completadas: {sessionCount}</p>
       {permission === 'denied' && (
         <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
           Las notificaciones están bloqueadas. Habilítalas en los ajustes de tu navegador para recibir alertas.
         </p>
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
