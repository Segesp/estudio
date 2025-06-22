
import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';
import { APP_NAME, AcademicCapIcon, BookOpenIcon, RectangleStackIcon, CheckCircleIcon, SparklesIcon, TimerIcon, CalendarDaysIcon } from '../ui-assets';
import useLocalStorage from '../hooks/useLocalStorage';
import { Flashcard, Goal, ScheduledEvent } from '../types';

const HomeScreen: React.FC = () => {
  const [flashcards] = useLocalStorage<Flashcard[]>('flashcards', []);
  const [goals] = useLocalStorage<Goal[]>('goals', []);
  const [scheduledEvents] = useLocalStorage<ScheduledEvent[]>('scheduledEvents', []);

  const pendingFlashcards = flashcards.filter(fc => new Date(fc.nextReviewDate) <= new Date()).length;
  const pendingGoals = goals.filter(g => !g.completed).length;

  const getTodaysDateISO = () => new Date().toISOString().split('T')[0];
  const todaysEvents = scheduledEvents
    .filter(event => event.date === getTodaysDateISO())
    .sort((a,b) => (a.startTime || "00:00").localeCompare(b.startTime || "00:00"));

  const formatTimeForDisplay = (timeString: string) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const date = new Date();
    date.setHours(parseInt(hours, 10), parseInt(minutes, 10));
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
  };


  return (
    <div className="p-4 space-y-6">
      <header className="text-center py-6">
        <div className="text-6xl mb-2">🧠</div>
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">{APP_NAME}</h1>
        <p className="text-slate-600 dark:text-slate-300 mt-1">Tu compañero inteligente para el éxito académico.</p>
      </header>

      <Card className="bg-gradient-to-r from-cyan-500 to-sky-600 text-white dark:from-cyan-600 dark:to-sky-700">
        <h2 className="text-xl font-semibold mb-2">¡Bienvenido/a de nuevo!</h2>
        <p className="text-sm opacity-90">Listo/a para optimizar tu estudio y alcanzar tus metas?</p>
        {pendingFlashcards > 0 && (
          <p className="text-sm mt-3 bg-cyan-700 bg-opacity-50 px-3 py-1.5 rounded-md inline-block dark:bg-cyan-800">
            Tienes <span className="font-bold">{pendingFlashcards}</span> flashcards para repasar hoy.
          </p>
        )}
         {pendingGoals > 0 && (
          <p className="text-sm mt-2 ml-0 sm:ml-2 sm:mt-3 bg-sky-700 bg-opacity-50 px-3 py-1.5 rounded-md inline-block dark:bg-sky-800">
            Tienes <span className="font-bold">{pendingGoals}</span> metas pendientes.
          </p>
        )}
      </Card>

      {/* Today's Agenda Section */}
      <section>
        <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200">Tu Agenda de Hoy</h3>
            <Link to="/schedule">
                <Button variant="ghost" size="sm" rightIcon={<span className="text-lg">📅</span>}>
                    Ver Agenda Completa
                </Button>
            </Link>
        </div>
        {todaysEvents.length > 0 ? (
          <div className="space-y-3">
            {todaysEvents.map(event => (
              <Card key={event.id} className={`border-l-4 ${event.color || 'border-cyan-500'} dark:bg-slate-800 p-4`}>
                <h4 className="font-semibold text-slate-700 dark:text-slate-200">{event.title}</h4>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {formatTimeForDisplay(event.startTime)} - {formatTimeForDisplay(event.endTime)}
                </p>
                {event.description && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 truncate">{event.description}</p>}
              </Card>
            ))}
          </div>
        ) : (
          <Card className="text-center py-6 dark:bg-slate-800">
            <div className="text-4xl mb-2">📅</div>
            <p className="text-slate-500 dark:text-slate-400">No tienes eventos agendados para hoy.</p>
            <Link to="/schedule">
                 <Button variant="secondary" size="sm" className="mt-3">Agendar Algo</Button>
            </Link>
          </Card>
        )}
      </section>


      <section>
        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-3">Acciones Rápidas</h3>
        <div className="grid grid-cols-2 gap-4">
          <Link to="/flashcards" aria-label="Ir a Mis Flashcards">
            <Card className="hover:border-cyan-500 dark:hover:border-cyan-400 border-2 border-transparent">
              <div className="text-3xl mb-2">🗂️</div>
              <h4 className="font-semibold text-slate-700 dark:text-slate-200">Mis Flashcards</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">Crea y repasa tus tarjetas.</p>
            </Card>
          </Link>
          <Link to="/goals" aria-label="Ir a Mis Metas">
            <Card className="hover:border-emerald-500 dark:hover:border-emerald-400 border-2 border-transparent">
              <div className="text-3xl mb-2">🎯</div>
              <h4 className="font-semibold text-slate-700 dark:text-slate-200">Mis Metas</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">Define y sigue tus objetivos.</p>
            </Card>
          </Link>
          <Link to="/strategies" aria-label="Ir a Estrategias">
            <Card className="hover:border-violet-500 dark:hover:border-violet-400 border-2 border-transparent">
               <div className="text-3xl mb-2">🧠</div>
              <h4 className="font-semibold text-slate-700 dark:text-slate-200">Estrategias</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">Aprende técnicas efectivas.</p>
            </Card>
          </Link>
           <Link to="/pomodoro" aria-label="Ir a Temporizador Pomodoro">
            <Card className="hover:border-amber-500 dark:hover:border-amber-400 border-2 border-transparent">
               <div className="text-3xl mb-2">🍅</div>
              <h4 className="font-semibold text-slate-700 dark:text-slate-200">Pomodoro</h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">Sesiones de estudio.</p>
            </Card>
          </Link>
        </div>
      </section>
      
      <div className="text-center mt-8">
        <Link to="/flashcards/practice">
          <Button variant="primary" size="lg" disabled={pendingFlashcards === 0}>
            {pendingFlashcards > 0 ? `Repasar ${pendingFlashcards} Flashcards` : "No hay repasos pendientes"}
          </Button>
        </Link>
      </div>
       <div className="text-center mt-4">
        <Link to="/wellbeing">
            <Button variant='ghost' size='sm' rightIcon={<span className="text-lg">✨</span>}>
                Consejos de Bienestar
            </Button>
        </Link>
      </div>


    </div>
  );
};

export default HomeScreen;
