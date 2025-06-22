
import React from 'react';
import { NavLink } from 'react-router-dom';
import { HomeIcon, BookOpenIcon, RectangleStackIcon, CheckCircleIcon, SparklesIcon, TimerIcon, CogIcon } from '../ui-assets';

interface NavItemProps {
  to?: string;
  onClick?: () => void;
  label: string;
  icon: React.ReactNode;
  isButton?: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ to, onClick, label, icon, isButton }) => {
  if (isButton) {
    return (
      <button
        onClick={onClick}
        className='flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 ease-in-out text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'
        aria-label={label}
      >
        {icon}
        <span className="text-xs mt-1">{label}</span>
      </button>
    );
  }
  
  return (
    <NavLink
      to={to || "/"} // Fallback to prevent error if 'to' is undefined for NavLink
      className={({ isActive }) =>
        `flex flex-col items-center justify-center p-2 rounded-lg transition-colors duration-200 ease-in-out
         ${isActive ? 'text-cyan-600 bg-cyan-100 dark:text-cyan-400 dark:bg-slate-700' : 'text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-700'}`
      }
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </NavLink>
  );
};


interface BottomNavProps {
  onSettingsClick: () => void;
}


const BottomNav: React.FC<BottomNavProps> = ({ onSettingsClick }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white shadow-t-md border-t border-slate-200 p-1 z-50 dark:bg-slate-800 dark:border-slate-700">
      <div className="max-w-md mx-auto grid grid-cols-6 gap-0.5"> {/* Updated to 6 columns */}
        <NavItem to="/" label="Inicio" icon={<HomeIcon className="w-5 h-5" />} />
        <NavItem to="/strategies" label="Estrategias" icon={<BookOpenIcon className="w-5 h-5" />} />
        <NavItem to="/flashcards" label="Flashcards" icon={<RectangleStackIcon className="w-5 h-5" />} />
        <NavItem to="/pomodoro" label="Pomodoro" icon={<TimerIcon className="w-5 h-5" />} />
        <NavItem to="/goals" label="Metas" icon={<CheckCircleIcon className="w-5 h-5" />} />
        {/* <NavItem to="/wellbeing" label="Bienestar" icon={<SparklesIcon className="w-5 h-5" />} /> */}
        <NavItem onClick={onSettingsClick} label="Ajustes" icon={<CogIcon className="w-5 h-5" />} isButton={true} />
      </div>
    </nav>
  );
};

export default BottomNav;
