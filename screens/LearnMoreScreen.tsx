
import React from 'react';
import { Link } from 'react-router-dom';
import { StudyStrategyInfo } from '../types';
import Card from '../components/Card';
import { LightBulbIcon, BrainIcon, ClockIcon, PuzzlePieceIcon, PaintBrushIcon, TargetIcon, AcademicCapIcon, MoonIcon } from '../ui-assets';

const strategiesData: StudyStrategyInfo[] = [
  {
    id: 'retrieval',
    title: 'Práctica de Recuperación',
    icon: <LightBulbIcon className="w-8 h-8 text-amber-500 mr-3" />,
    summary: 'Flashcards y auto-evaluaciones.',
    path: '/flashcards' 
  },
  {
    id: 'spaced',
    title: 'Práctica Espaciada',
    icon: <ClockIcon className="w-8 h-8 text-emerald-500 mr-3" />,
    summary: 'Repasar tarjetas con el algoritmo SM-2.',
    path: '/flashcards/practice'
  },
  {
    id: 'elaboration',
    title: 'Elaboración',
    icon: <BrainIcon className="w-8 h-8 text-violet-500 mr-3" />,
    summary: 'Crear notas y explicaciones detalladas.',
    path: '/elaboration'
  },
  {
    id: 'interleaving',
    title: 'Intercalado',
    icon: <PuzzlePieceIcon className="w-8 h-8 text-orange-500 mr-3" />,
    summary: 'Planificar sesiones de estudio mixtas.',
    path: '/interleaving'
  },
  {
    id: 'generative-drawing',
    title: 'Dibujo Generativo',
    icon: <PaintBrushIcon className="w-8 h-8 text-pink-500 mr-3" />,
    summary: 'Guardar ideas y enlaces a bocetos.',
    path: '/drawing'
  },
  {
    id: 'srl',
    title: 'Autorregulación (SRL)',
    icon: <TargetIcon className="w-8 h-8 text-rose-500 mr-3" />,
    summary: 'Definir y seguir tus metas de estudio.',
    path: '/goals'
  },
  {
    id: 'lifestyle',
    title: 'Bienestar y Estilo de Vida',
    icon: <MoonIcon className="w-8 h-8 text-teal-500 mr-3" />,
    summary: 'Consejos para optimizar tu rendimiento.',
    path: '/wellbeing'
  },
];

const StrategyItem: React.FC<{ strategy: StudyStrategyInfo }> = ({ strategy }) => {
  const { icon, title, summary, path, id } = strategy;

  let darkIconClass = '';
  if (icon && icon.props.className) {
    if (icon.props.className.includes('text-amber-500')) darkIconClass = 'dark:text-amber-400';
    else if (icon.props.className.includes('text-emerald-500')) darkIconClass = 'dark:text-emerald-400';
    else if (icon.props.className.includes('text-violet-500')) darkIconClass = 'dark:text-violet-400';
    else if (icon.props.className.includes('text-orange-500')) darkIconClass = 'dark:text-orange-400';
    else if (icon.props.className.includes('text-pink-500')) darkIconClass = 'dark:text-pink-400';
    else if (icon.props.className.includes('text-rose-500')) darkIconClass = 'dark:text-rose-400';
    else if (icon.props.className.includes('text-teal-500')) darkIconClass = 'dark:text-teal-400';
    else darkIconClass = 'dark:text-sky-400';
  }

  return (
    <Link to={path} aria-label={`Ir a ${title}`}>
      <Card className="mb-4 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-150">
        <div 
          className="flex items-center justify-between"
          role="button" // Though it's a link, Card can act as a button semantically
          tabIndex={-1} // Link handles focus
          aria-labelledby={`strategy-title-${id}`}
        >
          <div className="flex items-center">
          {icon && React.cloneElement(icon, { className: `${icon.props.className || ''} ${darkIconClass}` })}
            <h3 id={`strategy-title-${id}`} className="text-lg font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
          </div>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-slate-400 dark:text-slate-500">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>
        <p className={`text-slate-600 dark:text-slate-300 mt-1 ml-11`}>{summary}</p>
      </Card>
    </Link>
  );
};

const LearnMoreScreen: React.FC = () => {
  return (
    <div className="p-4">
      <header className="mb-6 text-center">
         <AcademicCapIcon className="w-12 h-12 mx-auto text-cyan-500 dark:text-cyan-400 mb-2" />
        <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">Estrategias de Estudio</h1>
        <p className="text-slate-600 dark:text-slate-300 mt-1">Accede a herramientas y funcionalidades para cada técnica.</p>
      </header>
      {strategiesData.map(strategy => (
        <StrategyItem key={strategy.id} strategy={strategy} />
      ))}
    </div>
  );
};

export default LearnMoreScreen;
