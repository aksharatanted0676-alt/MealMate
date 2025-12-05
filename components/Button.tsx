import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseStyles = "px-6 py-4 rounded-2xl font-bold text-sm tracking-wide transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5";
  
  const variants = {
    // Colorful Gradient
    primary: "bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-600 text-white shadow-lg shadow-violet-900/40 hover:shadow-violet-900/60 border-none",
    // Dark Secondary
    secondary: "bg-slate-800 text-white hover:bg-slate-700 shadow-md shadow-black/30 border border-slate-700",
    // Outline
    outline: "border-2 border-slate-700 hover:border-violet-500 text-slate-400 hover:text-violet-400 bg-transparent",
    // Danger
    danger: "bg-red-900/20 hover:bg-red-900/40 text-red-500 border border-red-900/30",
    // Ghost
    ghost: "bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white"
  };

  const width = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${width} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};