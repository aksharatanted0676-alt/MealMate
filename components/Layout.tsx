import React from 'react';
import { Home, User, Heart, Activity, Leaf } from 'lucide-react';
import { ScreenName } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeScreen: ScreenName;
  onNavigate: (screen: ScreenName) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeScreen, onNavigate }) => {
  // Define distinct colors for each route
  const navItems = [
    { name: 'Home', icon: Home, screen: 'WELCOME' as ScreenName, color: 'text-violet-400', bg: 'bg-violet-900/30', hover: 'hover:bg-violet-900/20' },
    { name: 'Tracker', icon: Activity, screen: 'PROGRESS_TRACKER' as ScreenName, color: 'text-pink-400', bg: 'bg-pink-900/30', hover: 'hover:bg-pink-900/20' },
    { name: 'Favorites', icon: Heart, screen: 'FAVORITES' as ScreenName, color: 'text-red-400', bg: 'bg-red-900/30', hover: 'hover:bg-red-900/20' },
    { name: 'Profile', icon: User, screen: 'SETTINGS' as ScreenName, color: 'text-cyan-400', bg: 'bg-cyan-900/30', hover: 'hover:bg-cyan-900/20' },
  ];

  const getActiveTab = (screen: ScreenName) => {
    if (['MEAL_PLAN', 'GROCERY_LIST', 'NUTRITION_REPORT'].includes(screen)) return 'WELCOME';
    return screen;
  };

  return (
    <div className="min-h-screen bg-black text-slate-200 font-sans selection:bg-pink-500/30 flex overflow-hidden">
      
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 bg-slate-950/80 backdrop-blur-xl border-r border-slate-800 h-screen sticky top-0 z-20">
        <div className="p-8 flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-900/50 rotate-3">
             <Leaf size={24} className="text-white" />
          </div>
          <span className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400 tracking-tight">MealMate</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-3">
          {navItems.map((item) => {
            const isActive = getActiveTab(activeScreen) === item.screen;
            return (
              <button
                key={item.name}
                onClick={() => onNavigate(item.screen)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 font-bold ${
                  isActive 
                    ? `${item.bg} ${item.color} shadow-sm shadow-black/20 translate-x-2 border border-white/5` 
                    : `text-slate-500 ${item.hover} hover:text-slate-300`
                }`}
              >
                <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "animate-pulse" : ""} />
                {item.name}
              </button>
            )
          })}
        </nav>

        <div className="p-8">
           <div className="bg-gradient-to-br from-slate-900 to-black border border-slate-800 rounded-[2rem] p-6 text-white shadow-xl shadow-black relative overflow-hidden group cursor-pointer hover:-translate-y-1 transition-transform">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Activity size={80}/></div>
              <p className="text-sm text-slate-400 mb-2 font-medium">Daily Streak</p>
              <p className="font-bold text-lg">Track your<br/>healthy habits</p>
           </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 relative h-screen overflow-y-auto scroll-smooth">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-violet-900/20 via-slate-900/10 to-transparent pointer-events-none -z-10"></div>
        <div className="max-w-7xl mx-auto p-6 md:p-12 pb-32 md:pb-12 min-h-full">
           {children}
        </div>
      </main>
      
      {/* Mobile Floating Dock Navigation */}
      <div className="md:hidden fixed bottom-6 left-0 right-0 px-6 z-50 pointer-events-none">
         <div className="pointer-events-auto max-w-md mx-auto bg-slate-900/90 backdrop-blur-2xl rounded-[2rem] shadow-2xl shadow-black border border-slate-800 p-2 flex justify-between items-center">
           {navItems.map((item) => {
             const isActive = getActiveTab(activeScreen) === item.screen;
             return (
               <button
                 key={item.name}
                 onClick={() => onNavigate(item.screen)}
                 className={`flex-1 flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-300 relative ${
                   isActive 
                     ? `${item.color} ${item.bg}` 
                     : 'text-slate-500'
                 }`}
               >
                 <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} className={`transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
                 {isActive && (
                   <span className={`absolute -bottom-1 w-1 h-1 rounded-full ${item.color.replace('text', 'bg')}`}></span>
                 )}
               </button>
             )
           })}
         </div>
      </div>

    </div>
  );
};