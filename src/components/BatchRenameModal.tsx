import React, { useState, useMemo } from 'react';
import { X, FileText, ArrowRight, Check } from 'lucide-react';
import type { MP3FileItem } from '../types/mp3';
import { renameFromTags } from '../utils/id3';

interface BatchRenameModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: MP3FileItem[];
  selectedIds: Set<string>;
  onApplyRenaming: (renamedMap: Record<string, string>) => void;
}

const RENAME_PRESETS = [
  { label: '%track% - %artist% - %title%', template: '%track% - %artist% - %title%' },
  { label: '%artist% - %title%', template: '%artist% - %title%' },
  { label: '%track% - %title%', template: '%track% - %title%' },
  { label: '%artist% - %album% - %track% - %title%', template: '%artist% - %album% - %track% - %title%' },
];

export const BatchRenameModal: React.FC<BatchRenameModalProps> = ({
  isOpen,
  onClose,
  files,
  selectedIds,
  onApplyRenaming,
}) => {
  const [template, setTemplate] = useState('%track% - %artist% - %title%');
  const [applyOnlyToSelected, setApplyOnlyToSelected] = useState(selectedIds.size > 0);

  const targetFiles = useMemo(() => {
    if (applyOnlyToSelected && selectedIds.size > 0) {
      return files.filter((f) => selectedIds.has(f.id));
    }
    return files;
  }, [files, selectedIds, applyOnlyToSelected]);

  // Preview generated filenames
  const previewData = useMemo(() => {
    return targetFiles.map((file) => {
      const newName = renameFromTags(template, file.tags, file.originalFileName);
      return {
        id: file.id,
        oldName: file.currentFileName,
        newName,
      };
    });
  }, [targetFiles, template]);

  if (!isOpen) return null;

  const handleApply = () => {
    const renamedMap: Record<string, string> = {};
    previewData.forEach(({ id, newName }) => {
      renamedMap[id] = newName;
    });
    onApplyRenaming(renamedMap);
    onClose();
  };

  const insertToken = (token: string) => {
    setTemplate((prev) => `${prev} ${token}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Renombrar archivos a partir de etiquetas ID3
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Organiza y estandariza los nombres de archivo MP3 usando sus metadatos.
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
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Preset Buttons */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Plantillas estándar:
            </label>
            <div className="flex flex-wrap gap-2">
              {RENAME_PRESETS.map((p) => (
                <button
                  key={p.template}
                  type="button"
                  onClick={() => setTemplate(p.template)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                    template === p.template
                      ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Template Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Patrón de renombrado:
            </label>
            <input
              type="text"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              placeholder="%track% - %artist% - %title%"
              className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500">
              <span>Insertar etiqueta:</span>
              {['%track%', '%artist%', '%title%', '%album%', '%year%', '%genre%'].map((tok) => (
                <button
                  key={tok}
                  type="button"
                  onClick={() => insertToken(tok)}
                  className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-mono text-indigo-600 dark:text-indigo-400 rounded-md transition-colors"
                >
                  {tok}
                </button>
              ))}
            </div>
          </div>

          {/* Scope selection */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 pt-1 text-xs text-slate-600 dark:text-slate-400">
              <input
                id="rename-selected-only"
                type="checkbox"
                checked={applyOnlyToSelected}
                onChange={(e) => setApplyOnlyToSelected(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
              />
              <label htmlFor="rename-selected-only">
                Renombrar solo las {selectedIds.size} pistas seleccionadas (de {files.length} totales)
              </label>
            </div>
          )}

          {/* Live Preview List */}
          <div>
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Comparación antes / después ({previewData.length} archivos):
            </span>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2 px-3">Nombre original</th>
                    <th className="py-2 px-2 w-8 text-center"></th>
                    <th className="py-2 px-3">Nuevo nombre propuesto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
                  {previewData.slice(0, 8).map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-2 px-3 truncate max-w-[240px] text-slate-500 line-through opacity-70">
                        {row.oldName}
                      </td>
                      <td className="py-2 px-2 text-center text-slate-400">
                        <ArrowRight className="w-3.5 h-3.5 mx-auto text-indigo-500" />
                      </td>
                      <td className="py-2 px-3 truncate max-w-[280px] font-semibold text-indigo-600 dark:text-indigo-400">
                        {row.newName}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewData.length > 8 && (
                <div className="p-2 text-center text-[11px] text-slate-400 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                  ... y {previewData.length - 8} archivos más
                </div>
              )}
            </div>
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
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all active:scale-95 inline-flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Aplicar nuevo nombre a {targetFiles.length} pistas</span>
          </button>
        </div>
      </div>
    </div>
  );
};
