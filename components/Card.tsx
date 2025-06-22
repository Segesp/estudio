import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className, onClick }) => {
  return (
    <div
      className={`bg-white shadow-lg rounded-xl p-6 transition-all duration-300 ease-in-out hover:shadow-xl dark:bg-slate-800 dark:shadow-slate-700/50 dark:hover:shadow-slate-600/60 ${onClick ? 'cursor-pointer' : ''} ${className || ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
    >
      {children}
    </div>
  );
};

export default Card;
