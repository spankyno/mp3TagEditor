import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useI18n } from '../i18n';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  description?: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

/**
 * La región aria-live debe existir antes de que aparezcan los mensajes,
 * por eso el contenedor se renderiza siempre (aunque esté vacío).
 */
export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  const { t } = useI18n();

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed top-20 right-4 z-[60] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.type === 'error' ? 'alert' : 'status'}
          className="pointer-events-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-3.5 flex items-start gap-3 transition-all"
        >
          {toast.type === 'success' && (
            <CheckCircle2 aria-hidden="true" className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          )}
          {toast.type === 'error' && (
            <AlertCircle aria-hidden="true" className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}
          {toast.type === 'info' && (
            <Info aria-hidden="true" className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          )}

          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
              {toast.title}
            </p>
            {toast.description && (
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-snug">
                {toast.description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            aria-label={t('toast.dismiss')}
            className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors p-1 -mr-1 -mt-1 rounded-md"
          >
            <X aria-hidden="true" className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
