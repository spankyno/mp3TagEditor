import React, { useRef, useState } from 'react';
import { UploadCloud, Music2, ShieldCheck } from 'lucide-react';
import { useI18n } from '../i18n';

interface DropzoneProps {
  onFilesSelected: (files: FileList | File[]) => void;
  isLoading?: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({
  onFilesSelected,
  isLoading = false,
}) => {
  const { t } = useI18n();
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
      // Reset input value so same files can be selected again if needed
      e.target.value = '';
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`relative group cursor-pointer rounded-2xl border-2 border-dashed p-8 md:p-12 text-center transition-all ${
        isDragOver
          ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 scale-[0.99]'
          : 'border-slate-400 dark:border-slate-700/80 bg-white dark:bg-slate-900/60 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50/80 dark:hover:bg-slate-900'
      }`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,audio/mpeg,audio/mp3"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
        tabIndex={-1}
        aria-hidden="true"
      />

      <div className="max-w-md mx-auto flex flex-col items-center">
        <div className="w-16 h-16 mb-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center transition-transform group-hover:scale-105 shadow-sm">
          <UploadCloud aria-hidden="true" className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          {t('drop.arrastra_tus_archivos_mp3_aqui')}
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 max-w-sm">
          {t('drop.o_haz_clic_para_seleccionar')}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              fileInputRef.current?.click();
            }}
            disabled={isLoading}
            className="px-6 py-3 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50"
          >
            {isLoading ? t('drop.loading') : t('drop.select')}
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-center gap-6 text-xs text-slate-600 dark:text-slate-400">
          <span className="inline-flex items-center gap-1.5">
            <Music2 aria-hidden="true" className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            {t('drop.mp3_id3v2_3_y_id3v2')}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck aria-hidden="true" className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-500" />
            {t('drop.100_privado_en_tu_navegador')}
          </span>
        </div>
      </div>
    </div>
  );
};
