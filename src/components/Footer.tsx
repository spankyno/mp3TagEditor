import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useI18n } from '../i18n';

export const Footer: React.FC = () => {
  const { t } = useI18n();
  return (
    <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors py-4 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 text-slate-500 dark:text-slate-400 text-center lg:text-left">
          {/* Autor y Copyright */}
          <div>
            <span>{t('footer.author')} </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Aitor Sánchez Gutiérrez
            </span>
            <span>. {t('footer.rights')}</span>
          </div>

          {/* Enlaces requeridos */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-xs">
            <span className="inline-flex items-center gap-1">
              <span className="text-slate-500 dark:text-slate-400">{t('footer.blog')}</span>
              <a
                href="https://aitorsanchez.pages.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors inline-flex items-center gap-1"
              >
                <span>aitorsanchez.pages.dev</span>
                <ExternalLink aria-hidden="true" className="w-3 h-3 opacity-60" />
                <span className="sr-only">{t('footer.newTab')}</span>
              </a>
            </span>

            <span className="hidden sm:inline text-slate-400 dark:text-slate-700" aria-hidden="true">
              ·
            </span>

            <span className="inline-flex items-center gap-1">
              <span className="text-slate-500 dark:text-slate-400">Aitor Hub:</span>
              <a
                href="https://aitorhub.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors inline-flex items-center gap-1"
              >
                <span>aitorhub.vercel.app</span>
                <ExternalLink aria-hidden="true" className="w-3 h-3 opacity-60" />
                <span className="sr-only">{t('footer.newTab')}</span>
              </a>
            </span>

            <span className="hidden sm:inline text-slate-400 dark:text-slate-700" aria-hidden="true">
              ·
            </span>

            <span className="inline-flex items-center gap-1">
              <span className="text-slate-500 dark:text-slate-400">{t('footer.contact')}</span>
              <a
                href="https://aitorsanchez.pages.dev/contacto"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors inline-flex items-center gap-1"
              >
                <span>aitorsanchez.pages.dev/contacto</span>
                <ExternalLink aria-hidden="true" className="w-3 h-3 opacity-60" />
                <span className="sr-only">{t('footer.newTab')}</span>
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};
