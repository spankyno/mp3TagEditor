import React from 'react';
import { Sun, Moon, Disc3, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  currentView: 'editor' | 'about';
  onViewChange: (view: 'editor' | 'about') => void;
  isDark: boolean;
  onToggleTheme: () => void;
  fileCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  isDark,
  onToggleTheme,
  fileCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Disc3 className="w-5 h-5 animate-[spin_12s_linear_infinite]" />
          </div>
          <button
            onClick={() => onViewChange('editor')}
            className="text-left group cursor-pointer focus:outline-none"
          >
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap block">
              Editor Etiquetas MP3 Online
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 block -mt-0.5">
              ID3v2.3 · 100% en el Navegador
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => onViewChange('editor')}
            className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
              currentView === 'editor'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Editor {fileCount > 0 && `(${fileCount})`}
          </button>

          <button
            onClick={() => onViewChange('about')}
            className={`whitespace-nowrap transition-colors py-1 cursor-pointer ${
              currentView === 'about'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Acerca de
          </button>

          <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-900/50">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap font-medium">100% Privado</span>
          </div>
        </nav>

        {/* Zone 3: Primary actions & theme toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            aria-label="Cambiar tema de color"
          >
            {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
          </button>

          <button
            onClick={() => onViewChange(currentView === 'editor' ? 'about' : 'editor')}
            className="md:hidden px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg"
          >
            {currentView === 'editor' ? 'Acerca de' : 'Editor'}
          </button>
        </div>
      </div>
    </header>
  );
};
