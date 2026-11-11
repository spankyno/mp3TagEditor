import React, { useState, useEffect, useMemo, useRef, lazy, Suspense } from 'react';
import { Plus, Wand2, FileText, Trash2, Archive, RefreshCw, Undo2, Redo2 } from 'lucide-react';
import type { MP3FileItem, MP3Tags, MP3Picture, CleanTagsOptions, ID3Version } from './types/mp3';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Dropzone } from './components/Dropzone';
import { Modal } from './components/Modal';
import { SeoContent } from './components/SeoContent';
import { ToastContainer, type ToastMessage } from './components/Toast';
import { readMP3File, applyCleanOptionsToTags, CoverError } from './utils/id3';
import { saveAndDownloadSingleFile, exportFilesToZip } from './utils/zipExport';
import { createDemoTracks } from './utils/demoFiles';
import { useI18n, type MessageKey } from './i18n';

// Componentes pesados o secundarios: se descargan solo cuando hacen falta
const AboutView = lazy(() => import('./components/AboutView').then((m) => ({ default: m.AboutView })));
const FileList = lazy(() => import('./components/FileList').then((m) => ({ default: m.FileList })));
const TagEditorPanel = lazy(() =>
  import('./components/TagEditorPanel').then((m) => ({ default: m.TagEditorPanel }))
);
const AudioPlayer = lazy(() => import('./components/AudioPlayer').then((m) => ({ default: m.AudioPlayer })));
const AutoTagModal = lazy(() => import('./components/AutoTagModal').then((m) => ({ default: m.AutoTagModal })));
const BatchRenameModal = lazy(() =>
  import('./components/BatchRenameModal').then((m) => ({ default: m.BatchRenameModal }))
);
const CleanTagsModal = lazy(() =>
  import('./components/CleanTagsModal').then((m) => ({ default: m.CleanTagsModal }))
);

// Límites para evitar agotar la memoria del navegador (DoS local)
const MAX_FILES_PER_SESSION = 200;
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB por archivo

// Historial de deshacer
const MAX_HISTORY = 50;
const COALESCE_MS = 1500;

interface HistoryEntry {
  files: MP3FileItem[];
  label: MessageKey;
}

const SECONDARY_TOOL_BTN =
  'px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors inline-flex items-center gap-1.5';

const ICON_BTN =
  'p-2 rounded-lg text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors';

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || !el.tagName) return false;
  return (
    el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    el.tagName === 'SELECT' ||
    el.isContentEditable
  );
}

export default function App() {
  const { t, tn } = useI18n();

  // Theme state (el valor inicial es fijo para que el HTML prerenderizado coincida al hidratar)
  const [isDark, setIsDark] = useState<boolean>(false);

  // Navigation state
  const [currentView, setCurrentView] = useState<'editor' | 'about'>('editor');
  const mainRef = useRef<HTMLElement>(null);
  const isFirstView = useRef(true);

  // MP3 files state + historial
  const [files, setFiles] = useState<MP3FileItem[]>([]);
  const filesRef = useRef<MP3FileItem[]>([]);
  const [past, setPast] = useState<HistoryEntry[]>([]);
  const [future, setFuture] = useState<HistoryEntry[]>([]);
  const lastEditRef = useRef<{ key: string; time: number } | null>(null);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);
  const [id3Version, setId3Version] = useState<ID3Version>('2.3');

  // Audio player state
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Modals state
  const [isAutoTagOpen, setIsAutoTagOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isCleanOpen, setIsCleanOpen] = useState(false);

  // Zip export progress
  const [zipProgress, setZipProgress] = useState<{
    current: number;
    total: number;
    name: string;
  } | null>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addInputRef = useRef<HTMLInputElement>(null);
  const urlRegistry = useRef<Set<string>>(new Set());

  // ---------- Tema e preferencias (solo en cliente) ----------
  useEffect(() => {
    let savedTheme: string | null = null;
    let savedVersion: string | null = null;
    try {
      savedTheme = localStorage.getItem('theme');
      savedVersion = localStorage.getItem('id3version');
    } catch {
      /* almacenamiento bloqueado (modo privado, políticas del navegador) */
    }
    const dark =
      savedTheme === 'dark' || savedTheme === 'light'
        ? savedTheme === 'dark'
        : window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDark(dark);
    document.documentElement.classList.toggle('dark', dark);
    if (savedVersion === '2.3' || savedVersion === '2.4') setId3Version(savedVersion);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light');
    } catch {
      /* ignorar si el almacenamiento no está disponible */
    }
  };

  const changeId3Version = (version: ID3Version) => {
    setId3Version(version);
    try {
      localStorage.setItem('id3version', version);
    } catch {
      /* ignorar */
    }
  };

  // Mover el foco al contenido al cambiar de vista (accesibilidad)
  useEffect(() => {
    if (isFirstView.current) {
      isFirstView.current = false;
      return;
    }
    mainRef.current?.focus();
    window.scrollTo({ top: 0 });
  }, [currentView]);

  // ---------- Toasts ----------
  const addToast = (type: 'success' | 'error' | 'info', title: string, description?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  };

  // ---------- Historial ----------
  const commitFiles = (next: MP3FileItem[]) => {
    filesRef.current = next;
    setFiles(next);
  };

  /** Aplica un cambio a la lista y lo registra en el historial (deshacer/rehacer) */
  const applyEdit = (
    updater: (prev: MP3FileItem[]) => MP3FileItem[],
    label: MessageKey,
    coalesceKey?: string
  ) => {
    const prev = filesRef.current;
    const next = updater(prev);
    if (next === prev) return;

    const now = Date.now();
    const last = lastEditRef.current;
    const coalesce = !!coalesceKey && !!last && last.key === coalesceKey && now - last.time < COALESCE_MS;
    lastEditRef.current = coalesceKey ? { key: coalesceKey, time: now } : null;

    if (!coalesce) {
      setPast((p) => [...p.slice(-(MAX_HISTORY - 1)), { files: prev, label }]);
    }
    setFuture([]);
    commitFiles(next);
  };

  /** Cambios que no deben aparecer en el historial (p. ej. marcar como guardado) */
  const updateSilently = (updater: (prev: MP3FileItem[]) => MP3FileItem[]) => {
    commitFiles(updater(filesRef.current));
  };

  const restoreFiles = (next: MP3FileItem[]) => {
    commitFiles(next);
    const ids = new Set(next.map((f) => f.id));
    const keep = new Set(Array.from(selectedIds).filter((id) => ids.has(id)));
    setSelectedIds(keep);
    if (!activeId || !ids.has(activeId)) {
      setActiveId(keep.values().next().value ?? null);
    }
    if (playingId && !ids.has(playingId)) {
      setIsPlaying(false);
      setPlayingId(null);
    }
  };

  const handleUndo = () => {
    const entry = past[past.length - 1];
    if (!entry) return;
    const current = filesRef.current; // se captura ahora: el actualizador de React se ejecuta más tarde
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [...f, { files: current, label: entry.label }]);
    lastEditRef.current = null;
    restoreFiles(entry.files);
    addToast('info', t('toast.undone', { action: t(entry.label) }));
  };

  const handleRedo = () => {
    const entry = future[future.length - 1];
    if (!entry) return;
    const current = filesRef.current;
    setFuture((f) => f.slice(0, -1));
    setPast((p) => [...p, { files: current, label: entry.label }]);
    lastEditRef.current = null;
    restoreFiles(entry.files);
    addToast('info', t('toast.redone', { action: t(entry.label) }));
  };

  // Atajos de teclado Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z y Ctrl+Y (no interfieren al escribir en campos)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || isTypingTarget(e.target)) return;
      if (isAutoTagOpen || isRenameOpen || isCleanOpen) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault();
        handleRedo();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  });

  // Liberar URLs de objeto (audio y carátulas) cuando ya no las referencia
  // ni la lista actual ni ningún paso del historial
  useEffect(() => {
    const live = new Set<string>();
    const collect = (list: MP3FileItem[]) =>
      list.forEach((item) => {
        if (item.audioUrl) live.add(item.audioUrl);
        if (item.tags.picture?.url) live.add(item.tags.picture.url);
        if (item.originalTags?.picture?.url) live.add(item.originalTags.picture.url);
      });
    collect(files);
    past.forEach((h) => collect(h.files));
    future.forEach((h) => collect(h.files));

    urlRegistry.current.forEach((url) => {
      if (!live.has(url)) {
        URL.revokeObjectURL(url);
        urlRegistry.current.delete(url);
      }
    });
    live.forEach((url) => urlRegistry.current.add(url));
  }, [files, past, future]);

  // ---------- Carga de archivos ----------
  const handleFilesSelected = async (fileList: FileList | File[]) => {
    const mp3Files = Array.from(fileList).filter(
      (f) =>
        f.name.toLowerCase().endsWith('.mp3') ||
        f.type === 'audio/mpeg' ||
        f.type === 'audio/mp3'
    );

    const sizeOk = mp3Files.filter((f) => f.size > 0 && f.size <= MAX_FILE_SIZE_BYTES);
    const availableSlots = Math.max(0, MAX_FILES_PER_SESSION - filesRef.current.length);
    const rawFiles = sizeOk.slice(0, availableSlots);
    const skipped = mp3Files.length - rawFiles.length;

    if (mp3Files.length > 0 && skipped > 0) {
      addToast(
        'info',
        tn('toast.skipped', skipped),
        t('toast.skippedDesc', { files: MAX_FILES_PER_SESSION, mb: MAX_FILE_SIZE_BYTES / (1024 * 1024) })
      );
    }

    if (rawFiles.length === 0 && mp3Files.length > 0) return;

    if (rawFiles.length === 0) {
      addToast('error', t('toast.badFormat'), t('toast.badFormatDesc'));
      return;
    }

    setIsLoadingFiles(true);
    addToast('info', t('toast.reading'), tn('toast.readingDesc', rawFiles.length));

    try {
      const parsedItems = await Promise.all(rawFiles.map((file) => readMP3File(file)));
      applyEdit((prev) => [...prev, ...parsedItems], 'history.add');

      // Select first added track if none currently selected
      if (!activeId && parsedItems.length > 0) {
        setActiveId(parsedItems[0].id);
        setSelectedIds(new Set([parsedItems[0].id]));
      }

      addToast('success', t('toast.loaded'), tn('toast.loadedDesc', parsedItems.length));
    } catch (err) {
      console.error(err);
      addToast('error', t('toast.readError'), t('toast.readErrorDesc'));
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Load demo tracks
  const handleLoadDemos = async () => {
    setIsLoadingFiles(true);
    try {
      const demoItems = await createDemoTracks();
      applyEdit((prev) => [...prev, ...demoItems], 'history.add');
      setActiveId(demoItems[0].id);
      setSelectedIds(new Set([demoItems[0].id]));
      setCurrentView('editor');
      addToast('success', t('toast.demosLoaded'), t('toast.demosLoadedDesc'));
    } catch (err) {
      console.error(err);
      addToast('error', t('toast.demosError'), t('toast.demosErrorDesc'));
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // ---------- Selección ----------
  const handleSelectTrack = (id: string, e: React.MouseEvent) => {
    const clickedIndex = files.findIndex((f) => f.id === id);

    if (e.shiftKey && lastSelectedIndex !== null && clickedIndex !== -1) {
      // Range selection
      const start = Math.min(lastSelectedIndex, clickedIndex);
      const end = Math.max(lastSelectedIndex, clickedIndex);
      const newSelection = new Set(selectedIds);
      for (let i = start; i <= end; i++) {
        newSelection.add(files[i].id);
      }
      setSelectedIds(newSelection);
      setActiveId(id);
    } else if (e.ctrlKey || e.metaKey) {
      handleToggleTrack(id);
    } else {
      // Single selection
      setSelectedIds(new Set([id]));
      setActiveId(id);
      setLastSelectedIndex(clickedIndex);
    }
  };

  /** Alterna una pista en la selección (casillas de la tabla, accesible por teclado) */
  const handleToggleTrack = (id: string) => {
    const clickedIndex = files.findIndex((f) => f.id === id);
    const newSelection = new Set(selectedIds);
    if (newSelection.has(id)) {
      newSelection.delete(id);
      if (activeId === id) {
        setActiveId(Array.from(newSelection)[0] || null);
      }
    } else {
      newSelection.add(id);
      setActiveId(id);
    }
    setSelectedIds(newSelection);
    setLastSelectedIndex(clickedIndex);
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === files.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(files.map((f) => f.id)));
    }
  };

  const handleDeleteTrack = (id: string) => {
    applyEdit((prev) => prev.filter((f) => f.id !== id), 'history.delete');
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (activeId === id) setActiveId(null);
    if (playingId === id) {
      setIsPlaying(false);
      setPlayingId(null);
    }
    addToast('info', t('toast.trackRemoved'));
  };

  const hasUnsavedChanges = useMemo(() => files.some((f) => f.hasChanges), [files]);

  const handleClearAll = () => {
    if (hasUnsavedChanges && !window.confirm(t('confirm.clear'))) return;
    applyEdit(() => [], 'history.clear');
    setSelectedIds(new Set());
    setActiveId(null);
    setPlayingId(null);
    setIsPlaying(false);
    addToast('info', t('toast.cleared'));
  };

  // ---------- Reproductor ----------
  const handleTogglePlay = (id: string) => {
    if (playingId === id) {
      setIsPlaying(!isPlaying);
    } else {
      setPlayingId(id);
      setIsPlaying(true);
    }
  };

  const handleNextTrack = () => {
    if (!playingId || files.length === 0) return;
    const currentIndex = files.findIndex((f) => f.id === playingId);
    setPlayingId(files[(currentIndex + 1) % files.length].id);
    setIsPlaying(true);
  };

  const handlePrevTrack = () => {
    if (!playingId || files.length === 0) return;
    const currentIndex = files.findIndex((f) => f.id === playingId);
    setPlayingId(files[(currentIndex - 1 + files.length) % files.length].id);
    setIsPlaying(true);
  };

  const playingTrack = useMemo(
    () => files.find((f) => f.id === playingId) || null,
    [files, playingId]
  );

  // ---------- Edición de etiquetas ----------
  const handleUpdateTags = (updates: Partial<MP3Tags>, applyToBatch: boolean) => {
    // En edición individual, las pulsaciones seguidas sobre un mismo campo forman un único paso de historial
    const coalesceKey = applyToBatch ? undefined : `tags:${activeId}:${Object.keys(updates).join(',')}`;
    applyEdit(
      (prev) =>
        prev.map((item) => {
          const isTarget = applyToBatch ? selectedIds.has(item.id) : item.id === activeId;
          if (!isTarget) return item;
          return { ...item, tags: { ...item.tags, ...updates }, hasChanges: true, status: 'modified' };
        }),
      'history.edit',
      coalesceKey
    );

    if (applyToBatch) {
      addToast('success', t('toast.tagsUpdated'), tn('toast.tagsUpdatedDesc', selectedIds.size));
    }
  };

  const handleUpdatePicture = (picture: MP3Picture | null, applyToBatch: boolean) => {
    applyEdit(
      (prev) =>
        prev.map((item) => {
          const isTarget = applyToBatch ? selectedIds.has(item.id) : item.id === activeId;
          if (!isTarget) return item;
          return { ...item, tags: { ...item.tags, picture }, hasChanges: true, status: 'modified' };
        }),
      'history.cover'
    );

    addToast(
      'success',
      picture ? t('toast.coverUpdated') : t('toast.coverRemoved'),
      applyToBatch ? tn('toast.appliedTo', selectedIds.size) : undefined
    );
  };

  const handleCoverError = (code: CoverError['code']) => {
    const key: Record<CoverError['code'], MessageKey> = {
      format: 'cover.errFormat',
      size: 'cover.errSize',
      resolution: 'cover.errResolution',
      canvas: 'cover.errGeneric',
      convert: 'cover.errGeneric',
      load: 'cover.errGeneric',
      read: 'cover.errGeneric',
    };
    addToast('error', t('cover.errTitle'), t(key[code]));
  };

  const handleRevertTags = () => {
    applyEdit(
      (prev) =>
        prev.map((item) => {
          if (!selectedIds.has(item.id)) return item;
          return {
            ...item,
            tags: { ...item.originalTags },
            currentFileName: item.originalFileName,
            hasChanges: false,
            status: 'loaded',
          };
        }),
      'history.revert'
    );
    addToast('info', t('toast.reverted'));
  };

  // ---------- Descargas ----------
  const handleDownloadSingle = async (item: MP3FileItem) => {
    try {
      addToast('info', t('toast.saving'), t('toast.savingDesc', { version: id3Version, name: item.currentFileName }));
      await saveAndDownloadSingleFile(item, id3Version);
      updateSilently((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: 'saved', hasChanges: false } : f))
      );
      addToast('success', t('toast.downloaded'), t('toast.downloadedDesc', { name: item.currentFileName }));
    } catch (err) {
      console.error(err);
      addToast('error', t('toast.saveError'), t('toast.saveErrorDesc'));
    }
  };

  const handleDownloadZip = async () => {
    const targetItems = selectedIds.size > 0 ? files.filter((f) => selectedIds.has(f.id)) : files;

    if (targetItems.length === 0) {
      addToast('error', t('toast.noFiles'));
      return;
    }

    setZipProgress({ current: 0, total: targetItems.length, name: '' });

    try {
      await exportFilesToZip(targetItems, id3Version, (current, total, name) => {
        setZipProgress({ current, total, name });
      });

      const targetIds = new Set(targetItems.map((i) => i.id));
      updateSilently((prev) =>
        prev.map((f) => (targetIds.has(f.id) ? { ...f, status: 'saved', hasChanges: false } : f))
      );

      addToast(
        'success',
        t('toast.zipDone'),
        tn('toast.zipDoneDesc', targetItems.length, { version: id3Version })
      );
    } catch (err) {
      console.error(err);
      addToast('error', t('toast.zipError'), t('toast.zipErrorDesc'));
    } finally {
      setZipProgress(null);
    }
  };

  // ---------- Aplicación de modales ----------
  const handleApplyAutoTags = (updatesMap: Record<string, Partial<MP3Tags>>) => {
    applyEdit(
      (prev) =>
        prev.map((item) => {
          const update = updatesMap[item.id];
          if (!update) return item;
          return { ...item, tags: { ...item.tags, ...update }, hasChanges: true, status: 'modified' };
        }),
      'history.autotag'
    );
    addToast('success', t('toast.autoDone'), t('toast.autoDoneDesc'));
  };

  const handleApplyRenaming = (renamedMap: Record<string, string>) => {
    applyEdit(
      (prev) =>
        prev.map((item) => {
          const newName = renamedMap[item.id];
          if (!newName) return item;
          return { ...item, currentFileName: newName, hasChanges: true, status: 'modified' };
        }),
      'history.rename'
    );
    addToast('success', t('toast.renameDone'), t('toast.renameDoneDesc'));
  };

  const handleApplyClean = (options: CleanTagsOptions) => {
    const targetSet = selectedIds.size > 0 ? selectedIds : new Set(files.map((f) => f.id));

    applyEdit(
      (prev) =>
        prev.map((item) => {
          if (!targetSet.has(item.id)) return item;
          return {
            ...item,
            tags: applyCleanOptionsToTags(item.tags, options),
            hasChanges: true,
            status: 'modified',
          };
        }),
      'history.clean'
    );

    addToast('success', t('toast.cleanDone'), tn('toast.cleanDoneDesc', targetSet.size));
  };

  // ---------- Derivados ----------
  const selectedItems = useMemo(
    () => files.filter((f) => selectedIds.has(f.id)),
    [files, selectedIds]
  );

  const activeItem = useMemo(
    () => files.find((f) => f.id === activeId) || null,
    [files, activeId]
  );

  const featureCards: { title: MessageKey; text: MessageKey }[] = [
    { title: 'home.f1Title', text: 'home.f1Text' },
    { title: 'home.f2Title', text: 'home.f2Text' },
    { title: 'home.f3Title', text: 'home.f3Text' },
  ];

  const workspaceFallback = (
    <div
      aria-busy="true"
      className="min-h-[24rem] rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
    />
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[70] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-indigo-600 focus:text-white focus:text-sm focus:font-semibold"
      >
        {t('app.skipLink')}
      </a>

      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        fileCount={files.length}
      />

      <main
        id="main-content"
        ref={mainRef}
        tabIndex={-1}
        className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28 outline-none"
      >
        {currentView === 'about' ? (
          <Suspense fallback={workspaceFallback}>
            <AboutView onBackToEditor={() => setCurrentView('editor')} onLoadDemos={handleLoadDemos} />
          </Suspense>
        ) : files.length === 0 ? (
          /* Empty State / Initial Dropzone */
          <>
            <div className="max-w-2xl mx-auto my-8 space-y-8">
              <div className="text-center space-y-3">
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {t('app.title')}
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                  {t('app.lead')}
                </p>
              </div>

              <Dropzone onFilesSelected={handleFilesSelected} isLoading={isLoadingFiles} />

              {past.length > 0 && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleUndo}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors inline-flex items-center gap-1.5"
                  >
                    <Undo2 aria-hidden="true" className="w-3.5 h-3.5" />
                    <span>
                      {t('toolbar.undo')}: {t(past[past.length - 1].label)}
                    </span>
                  </button>
                </div>
              )}

              {/* Quick feature highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
                {featureCards.map((card) => (
                  <div
                    key={card.title}
                    className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-2xs"
                  >
                    <h2 className="font-semibold text-slate-900 dark:text-white block text-xs">{t(card.title)}</h2>
                    <p className="text-slate-600 dark:text-slate-400">{t(card.text)}</p>
                  </div>
                ))}
              </div>
            </div>

            <SeoContent />
          </>
        ) : (
          /* Populated State: Full Workspace */
          <div className="space-y-4">
            <h1 className="sr-only">{t('app.title')}</h1>

            {/* Action Toolbar */}
            <div
              role="toolbar"
              aria-label={t('toolbar.label')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3 transition-colors"
            >
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={addInputRef}
                  type="file"
                  accept=".mp3,audio/mpeg,audio/mp3"
                  multiple
                  tabIndex={-1}
                  aria-hidden="true"
                  onChange={(e) => {
                    if (e.target.files) handleFilesSelected(e.target.files);
                    e.target.value = '';
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => addInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-all active:scale-95 inline-flex items-center gap-1.5"
                >
                  <Plus aria-hidden="true" className="w-3.5 h-3.5" />
                  <span>{t('toolbar.add')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsAutoTagOpen(true)}
                  className={SECONDARY_TOOL_BTN}
                  title={t('toolbar.autoTitle')}
                >
                  <Wand2 aria-hidden="true" className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{t('toolbar.auto')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsRenameOpen(true)}
                  className={SECONDARY_TOOL_BTN}
                  title={t('toolbar.renameTitle')}
                >
                  <FileText aria-hidden="true" className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{t('toolbar.rename')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCleanOpen(true)}
                  className={SECONDARY_TOOL_BTN}
                  title={t('toolbar.cleanTitle')}
                >
                  <Trash2 aria-hidden="true" className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
                  <span>{t('toolbar.clean')}</span>
                </button>

                <span aria-hidden="true" className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />

                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={past.length === 0}
                  className={ICON_BTN}
                  title={t('toolbar.undoTitle')}
                  aria-label={t('toolbar.undo')}
                >
                  <Undo2 aria-hidden="true" className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleRedo}
                  disabled={future.length === 0}
                  className={ICON_BTN}
                  title={t('toolbar.redoTitle')}
                  aria-label={t('toolbar.redo')}
                >
                  <Redo2 aria-hidden="true" className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <label htmlFor="id3-version" className="text-[11px] font-medium text-slate-700 dark:text-slate-400">
                    {t('toolbar.id3Version')}
                  </label>
                  <select
                    id="id3-version"
                    value={id3Version}
                    onChange={(e) => changeId3Version(e.target.value as ID3Version)}
                    title={t('toolbar.id3Help')}
                    className="px-2 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="2.3">{t('toolbar.v23')}</option>
                    <option value="2.4">{t('toolbar.v24')}</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title={t('toolbar.clearTitle')}
                >
                  {t('toolbar.clear')}
                </button>

                <button
                  type="button"
                  onClick={handleDownloadZip}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-all active:scale-95 inline-flex items-center gap-1.5"
                >
                  <Archive aria-hidden="true" className="w-3.5 h-3.5" />
                  <span>
                    {selectedIds.size > 0
                      ? t('toolbar.zipSelected', { n: selectedIds.size })
                      : t('toolbar.zipAll')}
                  </span>
                </button>
              </div>
            </div>

            {/* Split Grid: File Table + Tag Inspector */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
                <Suspense fallback={workspaceFallback}>
                  <FileList
                    files={files}
                    selectedIds={selectedIds}
                    activeId={activeId}
                    onSelectTrack={handleSelectTrack}
                    onToggleTrack={handleToggleTrack}
                    onToggleSelectAll={handleToggleSelectAll}
                    onDeleteTrack={handleDeleteTrack}
                    onDownloadSingle={handleDownloadSingle}
                    playingId={playingId}
                    isPlaying={isPlaying}
                    onTogglePlay={handleTogglePlay}
                  />
                </Suspense>
              </div>

              <div className="lg:col-span-5 xl:col-span-4 sticky top-20">
                <Suspense fallback={workspaceFallback}>
                  <TagEditorPanel
                    selectedItems={selectedItems}
                    activeItem={activeItem}
                    onUpdateTags={handleUpdateTags}
                    onUpdatePicture={handleUpdatePicture}
                    onRevertTags={handleRevertTags}
                    onDownloadActive={() => {
                      if (activeItem) handleDownloadSingle(activeItem);
                    }}
                    onCoverError={handleCoverError}
                  />
                </Suspense>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Audio Player */}
      {playingTrack && (
        <Suspense fallback={null}>
          <AudioPlayer
            currentTrack={playingTrack}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            onNext={handleNextTrack}
            onPrev={handlePrevTrack}
            onClose={() => {
              setIsPlaying(false);
              setPlayingId(null);
            }}
          />
        </Suspense>
      )}

      <Footer />

      {/* Zip Export Progress Overlay */}
      <Modal
        isOpen={!!zipProgress}
        onClose={() => {}}
        dismissible={false}
        role="alertdialog"
        labelledBy="zip-title"
        describedBy="zip-desc"
        className="w-full max-w-sm"
      >
        {zipProgress && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 w-full shadow-2xl text-center space-y-4">
            <div
              aria-hidden="true"
              className="w-12 h-12 mx-auto rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400"
            >
              <RefreshCw className="w-6 h-6 motion-safe:animate-spin" />
            </div>
            <div>
              <h2 id="zip-title" className="text-base font-bold text-slate-900 dark:text-white">
                {t('zip.title')}
              </h2>
              <p id="zip-desc" className="text-xs text-slate-600 dark:text-slate-400 mt-1 break-all">
                {zipProgress.name ? t('zip.processing', { name: zipProgress.name }) : t('zip.finalizing')}
              </p>
            </div>
            <div
              role="progressbar"
              aria-label={t('zip.title')}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round((zipProgress.current / zipProgress.total) * 100)}
              className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden"
            >
              <div
                className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${Math.round((zipProgress.current / zipProgress.total) * 100)}%` }}
              />
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-600 dark:text-slate-400 block">
              {t('zip.counter', { current: zipProgress.current, total: zipProgress.total })}
            </span>
          </div>
        )}
      </Modal>

      {isAutoTagOpen && (
        <Suspense fallback={null}>
          <AutoTagModal
            isOpen={isAutoTagOpen}
            onClose={() => setIsAutoTagOpen(false)}
            files={files}
            selectedIds={selectedIds}
            onApplyAutoTags={handleApplyAutoTags}
          />
        </Suspense>
      )}

      {isRenameOpen && (
        <Suspense fallback={null}>
          <BatchRenameModal
            isOpen={isRenameOpen}
            onClose={() => setIsRenameOpen(false)}
            files={files}
            selectedIds={selectedIds}
            onApplyRenaming={handleApplyRenaming}
          />
        </Suspense>
      )}

      {isCleanOpen && (
        <Suspense fallback={null}>
          <CleanTagsModal
            isOpen={isCleanOpen}
            onClose={() => setIsCleanOpen(false)}
            targetCount={selectedIds.size > 0 ? selectedIds.size : files.length}
            onApplyClean={handleApplyClean}
          />
        </Suspense>
      )}

      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
