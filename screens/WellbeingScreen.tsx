
import React from 'react';
import { WellbeingTip } from '../types';
import Card from '../components/Card';
import { SparklesIcon, MoonIcon, ClockIcon, BrainIcon } from '../ui-assets'; 

const wellbeingTipsData: WellbeingTip[] = [
  {
    id: 'sleep',
    title: 'Prioriza el Sueño',
    icon: <MoonIcon className="w-10 h-10 text-violet-500 dark:text-violet-400 mb-3" />,
    content: 'El sueño adecuado es crucial para la consolidación de la memoria. La privación de sueño puede reducir la formación de memoria en un 20-40%. Intenta mantener un horario de sueño regular y asegúrate de dormir entre 7-9 horas.',
  },
  {
    id: 'breaks',
    title: 'Toma Descansos Estratégicos',
    icon: <ClockIcon className="w-10 h-10 text-emerald-500 dark:text-emerald-400 mb-3" />,
    content: 'Descansos breves durante y después del estudio mejoran la retención. Pausas de 10 segundos o siestas cortas (menos de 20 minutos) pueden fortalecer los circuitos neuronales. Considera la técnica Pomodoro (25 min de estudio, 5 min de descanso).',
  },
  {
    id: 'nutrition',
    title: 'Alimentación Saludable',
    icon: <SparklesIcon className="w-10 h-10 text-amber-500 dark:text-amber-400 mb-3" />,
    content: 'Una dieta equilibrada y baja en inflamación puede mejorar la memoria, especialmente a largo plazo. Evita el exceso de azúcares procesados y cafeína, especialmente antes de dormir. Hidrátate bien.',
  },
  {
    id: 'exercise',
    title: 'Ejercicio Regular',
    icon: <BrainIcon className="w-10 h-10 text-rose-500 dark:text-rose-400 mb-3" />,
    content: 'La actividad física regular no solo beneficia tu cuerpo, sino también tu cerebro. Mejora el flujo sanguíneo, reduce el estrés y puede potenciar funciones cognitivas como la memoria y la concentración.',
  },
  {
    id: 'stress',
    title: 'Manejo del Estrés',
    icon: <SparklesIcon className="w-10 h-10 text-pink-500 dark:text-pink-400 mb-3" />,
    content: 'El estrés crónico puede afectar negativamente el aprendizaje. Encuentra técnicas de relajación que te funcionen: meditación, mindfulness, hobbies, pasar tiempo en la naturaleza o con amigos. La autorregulación también ayuda a gestionar la ansiedad.',
  },
];

const WellbeingScreen: React.FC = () => {
  return (
    <div className="p-4 space-y-6">
      <header className="text-center mb-6">
        <SparklesIcon className="w-12 h-12 mx-auto text-cyan-500 dark:text-cyan-400 mb-2" />
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Bienestar Estudiantil</h1>
        <p className="text-slate-600 dark:text-slate-300 mt-1">Cuidar tu mente y cuerpo es clave para un aprendizaje óptimo.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {wellbeingTipsData.map(tip => (
          <Card key={tip.id} className="flex flex-col items-center text-center hover:shadow-lg transition-shadow">
            {tip.icon}
            <h3 className="text-xl font-semibold text-slate-700 dark:text-slate-200 mb-2">{tip.title}</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">{tip.content}</p>
          </Card>
        ))}
      </div>
       <Card className="mt-8 bg-cyan-50 dark:bg-slate-800 border border-cyan-200 dark:border-cyan-700/50">
        <h3 className="text-lg font-semibold text-cyan-700 dark:text-cyan-300 mb-2 text-center">Recuerda: Un enfoque holístico</h3>
        <p className="text-cyan-600 dark:text-cyan-400 text-sm text-center">
          El aprendizaje no es una función aislada. Está intrínsecamente ligado a tu estado fisiológico y emocional.
          Integrar hábitos saludables con estrategias de estudio efectivas maximizará tu potencial y bienestar.
        </p>
      </Card>
    </div>
  );
};

export default WellbeingScreen;
