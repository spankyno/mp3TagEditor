import React from 'react';
import { Sun, Moon, Disc3, ShieldCheck, Languages } from 'lucide-react';
import { useI18n } from '../i18n';

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
  const { t, lang } = useI18n();
  const otherLang = lang === 'es' ? 'en' : 'es';

  const navClass = (active: boolean) =>
    `whitespace-nowrap transition-colors py-1 px-1 rounded-md cursor-pointer ${
      active
        ? 'text-indigo-700 dark:text-indigo-400 font-semibold'
        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
    }`;

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4 lg:gap-8">
        {/* Zone 1: Brand wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            aria-hidden="true"
            className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm"
          >
            <Disc3 className="w-5 h-5 motion-safe:animate-[spin_12s_linear_infinite]" />
          </div>
          <button
            type="button"
            onClick={() => onViewChange('editor')}
            className="text-left group cursor-pointer rounded-md"
          >
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap block">
              {t('header.brand')}
            </span>
            <span className="text-xs text-slate-600 dark:text-slate-400 block -mt-0.5">
              {t('header.tagline')}
            </span>
          </button>
        </div>

        {/* Zone 2: Navigation links */}
        <nav aria-label={t('header.navLabel')} className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            type="button"
            onClick={() => onViewChange('editor')}
            aria-current={currentView === 'editor' ? 'page' : undefined}
            className={navClass(currentView === 'editor')}
          >
            {t('header.editor')} {fileCount > 0 && `(${fileCount})`}
          </button>

          <button
            type="button"
            onClick={() => onViewChange('about')}
            aria-current={currentView === 'about' ? 'page' : undefined}
            className={navClass(currentView === 'about')}
          >
            {t('header.about')}
          </button>

          <div className="flex items-center gap-1.5 text-xs text-emerald-800 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-md border border-emerald-200 dark:border-emerald-900/50">
            <ShieldCheck aria-hidden="true" className="w-3.5 h-3.5" />
            <span className="whitespace-nowrap font-medium">{t('header.private')}</span>
          </div>
        </nav>

        {/* Zone 3: Language, theme toggle & mobile nav */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={otherLang === 'en' ? '/en/' : '/'}
            hrefLang={otherLang}
            lang={otherLang}
            title={t('header.langTitle')}
            className="px-2.5 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5"
          >
            <Languages aria-hidden="true" className="w-4 h-4" />
            <span>{t('header.langName')}</span>
          </a>

          <button
            type="button"
            onClick={onToggleTheme}
            className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isDark ? t('header.themeToLight') : t('header.themeToDark')}
            aria-label={isDark ? t('header.themeToLight') : t('header.themeToDark')}
          >
            {isDark ? (
              <Sun aria-hidden="true" className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon aria-hidden="true" className="w-5 h-5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => onViewChange(currentView === 'editor' ? 'about' : 'editor')}
            className="md:hidden px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg"
          >
            {currentView === 'editor' ? t('header.about') : t('header.editor')}
          </button>
        </div>
      </div>
    </header>
  );
};
