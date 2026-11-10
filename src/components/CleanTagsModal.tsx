import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, Check } from 'lucide-react';
import type { CleanTagsOptions } from '../types/mp3';

interface CleanTagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCount: number;
  onApplyClean: (options: CleanTagsOptions) => void;
}

export const CleanTagsModal: React.FC<CleanTagsModalProps> = ({
  isOpen,
  onClose,
  targetCount,
  onApplyClean,
}) => {
  const [options, setOptions] = useState<CleanTagsOptions>({
    removeAll: false,
    removeCover: true,
    removeComments: true,
    removeLyrics: true,
    removeComposer: false,
    removeBpm: false,
  });

  if (!isOpen) return null;

  const handleApply = () => {
    onApplyClean(options);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-lg">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Limpieza de etiquetas ID3
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Elimina metadatos o carátulas innecesarias para optimizar tamaño o privacidad.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Option: Remove All */}
          <div
            onClick={() => setOptions((prev) => ({ ...prev, removeAll: !prev.removeAll }))}
            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
              options.removeAll
                ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={options.removeAll}
                onChange={() => {}}
                className="mt-0.5 w-4 h-4 text-rose-600 rounded border-slate-300 dark:border-slate-700 focus:ring-rose-500"
              />
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  Eliminar todas las etiquetas ID3 por completo
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Despoja la cabecera ID3 completa dejando únicamente la pista de audio cruda.
                </span>
              </div>
            </div>
          </div>

          {/* Selective Options */}
          {!options.removeAll && (
            <div className="space-y-2.5 pt-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block text-xs">
                O selecciona qué campos limpiar:
              </span>

              {[
                { key: 'removeCover' as const, label: 'Quitar carátulas del álbum (reduce peso)' },
                { key: 'removeComments' as const, label: 'Quitar comentarios y descripciones' },
                { key: 'removeLyrics' as const, label: 'Quitar letras de canciones (lyrics)' },
                { key: 'removeComposer' as const, label: 'Quitar campo compositor' },
                { key: 'removeBpm' as const, label: 'Quitar valor BPM' },
              ].map(({ key, label }) => (
                <label
                  key={key}
                  className="flex items-center gap-2.5 text-slate-700 dark:text-slate-300 cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/40"
                >
                  <input
                    type="checkbox"
                    checked={options[key]}
                    onChange={(e) =>
                      setOptions((prev) => ({ ...prev, [key]: e.target.checked }))
                    }
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          )}

          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40 rounded-xl text-[11px]">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <span>
              Esta acción modificará los metadatos de {targetCount} archivo{targetCount === 1 ? '' : 's'}.
              Siempre puedes revertir a los originales pulsando &quot;Revertir&quot; antes de descargar.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-all active:scale-95 inline-flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Proceder con la limpieza</span>
          </button>
        </div>
      </div>
    </div>
  );
};
