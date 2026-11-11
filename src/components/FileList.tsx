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
  ChevronUp,
  ChevronDown,
} from 'lucide-react';
import type { MP3FileItem } from '../types/mp3';
import { formatBytes, formatDuration } from '../utils/formatters';
import { useI18n } from '../i18n';

interface FileListProps {
  files: MP3FileItem[];
  selectedIds: Set<string>;
  activeId: string | null;
  onSelectTrack: (id: string, e: React.MouseEvent) => void;
  onToggleTrack: (id: string) => void;
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
  onToggleTrack,
  onToggleSelectAll,
  onDeleteTrack,
  onDownloadSingle,
  playingId,
  isPlaying,
  onTogglePlay,
}) => {
  const { t, tn } = useI18n();
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

  const sortableHeader = (column: typeof sortBy, label: string) => {
    const active = sortBy === column;
    return (
      <th
        scope="col"
        aria-sort={active ? (sortAsc ? 'ascending' : 'descending') : 'none'}
        className="py-2.5 px-3"
      >
        <button
          type="button"
          onClick={() => handleHeaderSort(column)}
          className="inline-flex items-center gap-1 font-semibold rounded-sm hover:text-slate-900 dark:hover:text-white"
        >
          {label}
          {active &&
            (sortAsc ? (
              <ChevronUp aria-hidden="true" className="w-3 h-3" />
            ) : (
              <ChevronDown aria-hidden="true" className="w-3 h-3" />
            ))}
        </button>
      </th>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden transition-colors">
      {/* Search & Counter Subheader */}
      <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/70">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search aria-hidden="true" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label={t('list.searchLabel')}
            placeholder={t('list.searchPlaceholder')}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400" aria-live="polite">
          <span>{tn('list.count', files.length)}</span>
          <span aria-hidden="true">·</span>
          <span className="font-medium text-indigo-700 dark:text-indigo-400">
            {tn('list.selected', selectedIds.size)}
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto overflow-y-auto flex-1 max-h-[580px]">
        <table className="w-full text-left border-collapse text-xs">
          <caption className="sr-only">{t('list.caption')}</caption>
          <thead className="sticky top-0 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-xs text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-700/60 z-10 select-none">
            <tr>
              <th scope="col" className="py-2.5 px-3 w-10 text-center">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={allSelected ? true : someSelected ? 'mixed' : false}
                  onClick={onToggleSelectAll}
                  className="text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 rounded-sm"
                  title={allSelected ? t('list.deselectAll') : t('list.selectAll')}
                  aria-label={allSelected ? t('list.deselectAll') : t('list.selectAll')}
                >
                  {allSelected ? (
                    <CheckSquare aria-hidden="true" className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  ) : someSelected ? (
                    <div aria-hidden="true" className="w-4 h-4 border border-indigo-600 dark:border-indigo-400 rounded-xs flex items-center justify-center bg-indigo-50 dark:bg-indigo-950">
                      <div className="w-2 h-2 bg-indigo-600 dark:bg-indigo-400 rounded-xs" />
                    </div>
                  ) : (
                    <Square aria-hidden="true" className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th scope="col" className="py-2.5 px-2 w-10 text-center">#</th>
              <th scope="col" className="py-2.5 px-2 w-12 text-center">{t('list.colCover')}</th>
              {sortableHeader('title', t('list.colTitle'))}
              {sortableHeader('artist', t('list.colArtist'))}
              {sortableHeader('album', t('list.colAlbum'))}
              <th scope="col" className="py-2.5 px-3">{t('list.colGenre')}</th>
              <th scope="col" className="py-2.5 px-3 text-right">{t('list.colDuration')}</th>
              <th scope="col" className="py-2.5 px-3 text-right">{t('list.colSize')}</th>
              <th scope="col" className="py-2.5 px-3 text-center">{t('list.colStatus')}</th>
              <th scope="col" className="py-2.5 px-3 text-right w-24">{t('list.colActions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
            {filteredFiles.map((file) => {
              const isSelected = selectedIds.has(file.id);
              const isActive = activeId === file.id;
              const isThisPlaying = playingId === file.id && isPlaying;
              const displayName = file.tags.title || file.currentFileName;

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
                  <td className="py-2 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={isSelected}
                      aria-label={t('list.selectTrack', { name: displayName })}
                      onClick={() => onToggleTrack(file.id)}
                      className="rounded-sm inline-flex"
                    >
                      {isSelected ? (
                        <CheckSquare aria-hidden="true" className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <Square aria-hidden="true" className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                  </td>

                  {/* Play & Track number */}
                  <td className="py-2 px-2 text-center font-mono tabular-nums text-slate-500">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePlay(file.id);
                      }}
                      className="w-8 h-8 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-950 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center justify-center transition-colors inline-flex"
                      title={isThisPlaying ? t('list.pause') : t('list.play')}
                      aria-label={`${isThisPlaying ? t('list.pause') : t('list.play')}: ${displayName}`}
                      aria-pressed={isThisPlaying}
                    >
                      {isThisPlaying ? (
                        <Pause aria-hidden="true" className="w-3.5 h-3.5 fill-current text-indigo-600 dark:text-indigo-400" />
                      ) : (
                        <Play aria-hidden="true" className="w-3.5 h-3.5 fill-current opacity-80 group-hover:opacity-100" />
                      )}
                    </button>
                  </td>

                  {/* Album Cover Thumbnail */}
                  <td className="py-2 px-2 text-center">
                    <div className="w-8 h-8 rounded-md bg-slate-200 dark:bg-slate-800 overflow-hidden mx-auto flex items-center justify-center border border-slate-200 dark:border-slate-700/60 shadow-2xs">
                      {file.tags.picture?.url ? (
                        <img
                          src={file.tags.picture.url}
                          alt=""
                          width={32}
                          height={32}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Disc aria-hidden="true" className="w-4 h-4 text-slate-500" />
                      )}
                    </div>
                  </td>

                  {/* Title & Filename (botón: permite inspeccionar la pista con teclado) */}
                  <td className="py-2 px-3">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTrack(file.id, e);
                      }}
                      aria-current={isActive ? 'true' : undefined}
                      className="text-left block rounded-sm w-full"
                    >
                      <span className="block font-medium text-slate-900 dark:text-white truncate max-w-[220px]">
                        {file.tags.title || t('list.untitled')}
                      </span>
                      <span className="block text-[11px] text-slate-600 dark:text-slate-400 font-mono truncate max-w-[220px]">
                        {file.currentFileName}
                      </span>
                    </button>
                  </td>

                  {/* Artist */}
                  <td className="py-2 px-3 truncate max-w-[150px]">
                    {file.tags.artist || <span className="text-slate-500 italic">{t('list.unknownArtist')}</span>}
                  </td>

                  {/* Album */}
                  <td className="py-2 px-3 truncate max-w-[150px]">
                    {file.tags.album || <span className="text-slate-500 italic">—</span>}
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
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 dark:text-amber-400">
                        <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        {t('list.statusEdited')}
                      </span>
                    ) : file.status === 'saved' ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                        <Check aria-hidden="true" className="w-3 h-3" />
                        {t('list.statusSaved')}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-600 dark:text-slate-400">{t('list.statusOriginal')}</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-2 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => onDownloadSingle(file)}
                        className="p-2 rounded-md text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title={t('list.download')}
                        aria-label={`${t('list.download')}: ${displayName}`}
                      >
                        <Download aria-hidden="true" className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteTrack(file.id)}
                        className="p-2 rounded-md text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title={t('list.remove')}
                        aria-label={`${t('list.remove')}: ${displayName}`}
                      >
                        <Trash2 aria-hidden="true" className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredFiles.length === 0 && (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400">
            <Music aria-hidden="true" className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm">{t('list.noResults')}</p>
          </div>
        )}
      </div>
    </div>
  );
};
