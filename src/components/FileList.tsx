import React, { useState, useMemo } from 'react';
import {
  Play,
  Pause,
  Download,
  Trash2,
  Music,
  CheckSquare,
  Square,
  Search,
  Check,
  Disc,
} from 'lucide-react';
import type { MP3FileItem } from '../types/mp3';
import { formatBytes, formatDuration } from '../utils/formatters';

interface FileListProps {
  files: MP3FileItem[];
  selectedIds: Set<string>;
  activeId: string | null;
  onSelectTrack: (id: string, e: React.MouseEvent) => void;
  onToggleSelectAll: () => void;
  onDeleteTrack: (id: string) => void;
  onDownloadSingle: (item: MP3FileItem) => void;
  playingId: string | null;
  isPlaying: boolean;
  onTogglePlay: (id: string) => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  selectedIds,
  activeId,
  onSelectTrack,
  onToggleSelectAll,
  onDeleteTrack,
  onDownloadSingle,
  playingId,
  isPlaying,
  onTogglePlay,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'track' | 'title' | 'artist' | 'album' | 'fileName'>('track');
  const [sortAsc, setSortAsc] = useState(true);

  const filteredFiles = useMemo(() => {
    let result = files;

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (f) =>
          f.tags.title.toLowerCase().includes(q) ||
          f.tags.artist.toLowerCase().includes(q) ||
          f.tags.album.toLowerCase().includes(q) ||
          f.currentFileName.toLowerCase().includes(q) ||
          f.tags.genre.toLowerCase().includes(q)
      );
    }

    result = [...result].sort((a, b) => {
      let valA = '';
      let valB = '';

      switch (sortBy) {
        case 'track': {
          const numA = parseInt(a.tags.track || '0', 10);
          const numB = parseInt(b.tags.track || '0', 10);
          return sortAsc ? numA - numB : numB - numA;
        }
        case 'title':
          valA = a.tags.title.toLowerCase();
          valB = b.tags.title.toLowerCase();
          break;
        case 'artist':
          valA = a.tags.artist.toLowerCase();
          valB = b.tags.artist.toLowerCase();
          break;
        case 'album':
          valA = a.tags.album.toLowerCase();
          valB = b.tags.album.toLowerCase();
          break;
        case 'fileName':
          valA = a.currentFileName.toLowerCase();
          valB = b.currentFileName.toLowerCase();
          break;
      }

      return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    });

    return result;
  }, [files, searchTerm, sortBy, sortAsc]);

  const allSelected = files.length > 0 && selectedIds.size === files.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < files.length;

  const handleHeaderSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(column);
      setSortAsc(true);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-colors">
      {/* Search & Counter Subheader */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/70">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por título, artista, álbum..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          <span>
            {files.length} {files.length === 1 ? 'canción' : 'canciones'}
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-medium text-indigo-600 dark:text-indigo-400">
            {selectedIds.size} seleccionada{selectedIds.size === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto overflow-y-auto flex-1 max-h-[580px]">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-xs text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700/60 z-10 select-none">
            <tr>
              <th className="py-2.5 px-3 w-10 text-center">
                <button
                  type="button"
                  onClick={onToggleSelectAll}
                  className="text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none"
                  title={allSelected ? 'Deseleccionar todo' : 'Seleccionar todo'}
                >
                  {allSelected ? (
                    <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  ) : someSelected ? (
                    <div className="w-4 h-4 border border-indigo-600 dark:border-indigo-400 rounded-xs flex items-center justify-center bg-indigo-50 dark:bg-indigo-950">
                      <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-xs" />
                    </div>
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="py-2.5 px-2 w-10 text-center">#</th>
              <th className="py-2.5 px-2 w-12 text-center">Carátula</th>
              <th
                onClick={() => handleHeaderSort('title')}
                className="py-2.5 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white"
              >
                Título / Archivo
              </th>
              <th
                onClick={() => handleHeaderSort('artist')}
                className="py-2.5 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white"
              >
                Artista
              </th>
              <th
                onClick={() => handleHeaderSort('album')}
                className="py-2.5 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-white"
              >
                Álbum
              </th>
              <th className="py-2.5 px-3">Género</th>
              <th className="py-2.5 px-3 text-right">Duración</th>
              <th className="py-2.5 px-3 text-right">Tamaño</th>
              <th className="py-2.5 px-3 text-center">Estado</th>
              <th className="py-2.5 px-3 text-right w-24">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
            {filteredFiles.map((file) => {
              const isSelected = selectedIds.has(file.id);
              const isActive = activeId === file.id;
              const isThisPlaying = playingId === file.id && isPlaying;

              return (
                <tr
                  key={file.id}
                  onClick={(e) => onSelectTrack(file.id, e)}
                  className={`group transition-colors cursor-pointer select-none ${
                    isActive
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 text-slate-900 dark:text-white'
                      : isSelected
                      ? 'bg-slate-50 dark:bg-slate-800/40'
                      : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/30'
                  }`}
                >
                  {/* Checkbox */}
                  <td
                    className="py-2 px-3 text-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTrack(file.id, e);
                    }}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400 inline" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400 inline" />
                    )}
                  </td>

                  {/* Play & Track number */}
                  <td className="py-2 px-2 text-center font-mono tabular-nums text-slate-400">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePlay(file.id);
                      }}
                      className="w-6 h-6 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-950 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center transition-colors inline-flex"
                      title={isThisPlaying ? 'Pausar' : 'Reproducir muestra'}
                    >
                      {isThisPlaying ? (
                        <Pause className="w-3.5 h-3.5 fill-current text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current opacity-80 group-hover:opacity-100" />
                      )}
                    </button>
                  </td>

                  {/* Album Cover Thumbnail */}
                  <td className="py-2 px-2 text-center">
                    <div className="w-8 h-8 rounded-md bg-slate-200 dark:bg-slate-800 overflow-hidden mx-auto flex items-center justify-center border border-slate-200 dark:border-slate-700/60 shadow-2xs">
                      {file.tags.picture?.url ? (
                        <img
                          src={file.tags.picture.url}
                          alt="Cover"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Disc className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </td>

                  {/* Title & Filename */}
                  <td className="py-2 px-3">
                    <div className="font-medium text-slate-900 dark:text-white truncate max-w-[220px]">
                      {file.tags.title || 'Sin título'}
                    </div>
                    <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono truncate max-w-[220px]">
                      {file.currentFileName}
                    </div>
                  </td>

                  {/* Artist */}
                  <td className="py-2 px-3 truncate max-w-[150px]">
                    {file.tags.artist || <span className="text-slate-400 italic">Desconocido</span>}
                  </td>

                  {/* Album */}
                  <td className="py-2 px-3 truncate max-w-[150px]">
                    {file.tags.album || <span className="text-slate-400 italic">—</span>}
                  </td>

                  {/* Genre */}
                  <td className="py-2 px-3">
                    <span className="text-slate-600 dark:text-slate-400 truncate max-w-[100px] block">
                      {file.tags.genre || '—'}
                    </span>
                  </td>

                  {/* Duration */}
                  <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    {formatDuration(file.duration)}
                  </td>

                  {/* File Size */}
                  <td className="py-2 px-3 text-right font-mono tabular-nums text-slate-500 dark:text-slate-400">
                    {formatBytes(file.size)}
                  </td>

                  {/* Status Indicator */}
                  <td className="py-2 px-3 text-center">
                    {file.hasChanges ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        Editado
                      </span>
                    ) : file.status === 'saved' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        <Check className="w-3 h-3" />
                        Guardado
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">Original</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-2 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onDownloadSingle(file)}
                        className="p-1 rounded-md text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Descargar archivo MP3 editado"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteTrack(file.id)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Eliminar de la lista"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredFiles.length === 0 && (
          <div className="py-12 text-center text-slate-400 dark:text-slate-500">
            <Music className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">No se encontraron pistas con ese criterio de búsqueda.</p>
          </div>
        )}
      </div>
    </div>
  );
};
