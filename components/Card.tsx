import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  icon?: React.ReactNode;
  variant?: 'white' | 'glass';
}

export const Card: React.FC<CardProps> = ({ children, className = '', title, icon, variant = 'white' }) => {
  const bg = variant === 'glass' ? 'bg-slate-900/70 backdrop-blur-lg border-white/10' : 'bg-slate-900 border-slate-800';
  
  return (
    <div className={`${bg} rounded-[2rem] p-6 md:p-8 shadow-soft border ${className}`}>
      {(title || icon) && (
        <div className="flex items-center gap-3 mb-5">
          {icon && <div className="text-green-400 bg-green-900/30 p-2 rounded-xl">{icon}</div>}
          {title && <h3 className="text-xl font-bold text-white tracking-tight">{title}</h3>}
        </div>
      )}
      {children}
    </div>
  );
};