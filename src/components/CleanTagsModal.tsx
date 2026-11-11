import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, Check } from 'lucide-react';
import { Modal } from './Modal';
import { useI18n } from '../i18n';
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
  const { t, tn } = useI18n();
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
    <Modal isOpen={isOpen} onClose={onClose} labelledBy="clean-title" className="w-full max-w-lg">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-lg">
              <Trash2 aria-hidden="true" className="w-5 h-5" />
            </div>
            <div>
              <h2 id="clean-title" className="text-base font-bold text-slate-900 dark:text-white">
                {t('clean.limpieza_de_etiquetas_id3')}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t('clean.elimina_metadatos_o_caratulas_innecesarias')}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('modal.close')}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X aria-hidden="true" className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Option: Remove All */}
          <label
            className={`block p-3.5 rounded-xl border transition-all cursor-pointer ${
              options.removeAll
                ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/20'
                : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={options.removeAll}
                onChange={() => setOptions((prev) => ({ ...prev, removeAll: !prev.removeAll }))}
                className="mt-0.5 w-4 h-4 text-rose-600 rounded border-slate-300 dark:border-slate-700 focus:ring-rose-500"
              />
              <div>
                <span className="font-semibold text-slate-900 dark:text-white block">
                  {t('clean.eliminar_todas_las_etiquetas_id3')}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t('clean.despoja_la_cabecera_id3_completa')}
                </span>
              </div>
            </div>
          </label>

          {/* Selective Options */}
          {!options.removeAll && (
            <div className="space-y-2.5 pt-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block text-xs">
                {t('clean.o_selecciona_que_campos_limpiar')}
              </span>

              {[
                { key: 'removeCover' as const, label: t('clean.optCover') },
                { key: 'removeComments' as const, label: t('clean.optComments') },
                { key: 'removeLyrics' as const, label: t('clean.optLyrics') },
                { key: 'removeComposer' as const, label: t('clean.optComposer') },
                { key: 'removeBpm' as const, label: t('clean.optBpm') },
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
            <AlertTriangle aria-hidden="true" className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <span>
{tn('clean.warning', targetCount)}
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
            {t('auto.cancelar')}
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm transition-all active:scale-95 inline-flex items-center gap-1.5"
          >
            <Check aria-hidden="true" className="w-3.5 h-3.5" />
            <span>{t('clean.proceder_con_la_limpieza')}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
