import React, { useState, useMemo } from 'react';
import { X, Sparkles, Wand2, Check } from 'lucide-react';
import type { MP3FileItem, MP3Tags } from '../types/mp3';
import { autoTagFromFilename } from '../utils/id3';

interface AutoTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: MP3FileItem[];
  selectedIds: Set<string>;
  onApplyAutoTags: (updatesMap: Record<string, Partial<MP3Tags>>) => void;
}

const PRESET_PATTERNS = [
  { label: '%track% - %artist% - %title%', pattern: '%track% - %artist% - %title%' },
  { label: '%artist% - %title%', pattern: '%artist% - %title%' },
  { label: '%track%. %title%', pattern: '%track%. %title%' },
  { label: '%artist% - %album% - %track% - %title%', pattern: '%artist% - %album% - %track% - %title%' },
  { label: '%track% %title%', pattern: '%track% %title%' },
];

export const AutoTagModal: React.FC<AutoTagModalProps> = ({
  isOpen,
  onClose,
  files,
  selectedIds,
  onApplyAutoTags,
}) => {
  const [pattern, setPattern] = useState('%track% - %artist% - %title%');
  const [applyOnlyToSelected, setApplyOnlyToSelected] = useState(selectedIds.size > 0);

  const targetFiles = useMemo(() => {
    if (applyOnlyToSelected && selectedIds.size > 0) {
      return files.filter((f) => selectedIds.has(f.id));
    }
    return files;
  }, [files, selectedIds, applyOnlyToSelected]);

  // Compute live preview of extracted tags
  const previewData = useMemo(() => {
    return targetFiles.map((file) => {
      const extracted = autoTagFromFilename(file.currentFileName, pattern);
      return {
        id: file.id,
        filename: file.currentFileName,
        extracted,
      };
    });
  }, [targetFiles, pattern]);

  if (!isOpen) return null;

  const handleApply = () => {
    const updatesMap: Record<string, Partial<MP3Tags>> = {};
    previewData.forEach(({ id, extracted }) => {
      if (Object.keys(extracted).length > 0) {
        updatesMap[id] = extracted;
      }
    });
    onApplyAutoTags(updatesMap);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Auto-rellenar etiquetas desde el nombre de archivo
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Extrae pista, artista y título automáticamente analizando los nombres de los MP3.
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
          {/* Pattern Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Patrones predefinidos:
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_PATTERNS.map((p) => (
                <button
                  key={p.pattern}
                  type="button"
                  onClick={() => setPattern(p.pattern)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                    pattern === p.pattern
                      ? 'bg-indigo-600 text-white font-semibold shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Pattern Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Plantilla personalizada:
            </label>
            <input
              type="text"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="%track% - %artist% - %title%"
              className="w-full px-3.5 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <div className="mt-1.5 flex flex-wrap gap-1 text-[11px] text-slate-400">
              <span>Etiquetas disponibles:</span>
              <code className="text-indigo-600 dark:text-indigo-400">%track%</code>
              <code className="text-indigo-600 dark:text-indigo-400">%artist%</code>
              <code className="text-indigo-600 dark:text-indigo-400">%title%</code>
              <code className="text-indigo-600 dark:text-indigo-400">%album%</code>
              <code className="text-indigo-600 dark:text-indigo-400">%year%</code>
            </div>
          </div>

          {/* Scope selection */}
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 pt-1 text-xs text-slate-600 dark:text-slate-400">
              <input
                id="apply-selected-only"
                type="checkbox"
                checked={applyOnlyToSelected}
                onChange={(e) => setApplyOnlyToSelected(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-700 focus:ring-indigo-500"
              />
              <label htmlFor="apply-selected-only">
                Aplicar solo a las {selectedIds.size} pistas actualmente seleccionadas (de {files.length} totales)
              </label>
            </div>
          )}

          {/* Live Preview Table */}
          <div>
            <span className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Vista previa en tiempo real ({previewData.length} archivos):
            </span>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto text-xs">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800/80 sticky top-0 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="py-2 px-3">Nombre de archivo</th>
                    <th className="py-2 px-3">Pista</th>
                    <th className="py-2 px-3">Artista</th>
                    <th className="py-2 px-3">Título</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-[11px]">
                  {previewData.slice(0, 8).map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="py-1.5 px-3 truncate max-w-[200px] text-slate-500">
                        {row.filename}
                      </td>
                      <td className="py-1.5 px-3 text-indigo-600 dark:text-indigo-400">
                        {row.extracted.track || '—'}
                      </td>
                      <td className="py-1.5 px-3 text-emerald-600 dark:text-emerald-400">
                        {row.extracted.artist || '—'}
                      </td>
                      <td className="py-1.5 px-3 text-slate-900 dark:text-white font-sans">
                        {row.extracted.title || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {previewData.length > 8 && (
                <div className="p-2 text-center text-[11px] text-slate-400 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800">
                  ... y {previewData.length - 8} pistas más
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
            <Sparkles className="w-3.5 h-3.5" />
            <span>Aplicar a {targetFiles.length} pistas</span>
          </button>
        </div>
      </div>
    </div>
  );
};
