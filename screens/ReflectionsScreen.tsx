
import React from 'react';
import useLocalStorage from '../hooks/useLocalStorage';
import { SessionReflection } from '../types';
import Card from '../components/Card';
import { ChatBubbleLeftEllipsisIcon, RectangleStackIcon, TimerIcon } from '../ui-assets'; // Assuming TimerIcon for pomodoro

const ReflectionsScreen: React.FC = () => {
  const [reflections] = useLocalStorage<SessionReflection[]>('sessionReflections', []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-4 space-y-6">
      <header className="flex items-center mb-6">
        <ChatBubbleLeftEllipsisIcon className="w-8 h-8 text-cyan-500 dark:text-cyan-400 mr-3" />
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Mis Reflexiones</h1>
      </header>

      {reflections.length === 0 && (
        <Card className="text-center py-8">
          <ChatBubbleLeftEllipsisIcon className="w-12 h-12 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
          <p className="text-slate-500 dark:text-slate-400">Aún no tienes reflexiones guardadas.</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Después de cada sesión de estudio (Flashcards o Pomodoro), tendrás la oportunidad de guardar tus pensamientos.
          </p>
        </Card>
      )}

      <div className="space-y-4">
        {reflections.map(reflection => (
          <Card key={reflection.id}>
            <div className="flex items-center mb-2">
              {reflection.sessionType === 'flashcards' 
                ? <RectangleStackIcon className="w-5 h-5 text-sky-500 dark:text-sky-400 mr-2 flex-shrink-0" />
                : <TimerIcon className="w-5 h-5 text-rose-500 dark:text-rose-400 mr-2 flex-shrink-0" />}
              <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                Reflexión de {reflection.sessionType === 'flashcards' ? 'Flashcards' : 'Pomodoro'} - {formatDate(reflection.date)}
              </h2>
            </div>
            <p className="text-slate-700 dark:text-slate-200 whitespace-pre-wrap">{reflection.text}</p>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ReflectionsScreen;
