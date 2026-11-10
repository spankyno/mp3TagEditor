import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Upload,
  Sparkles,
  Download,
  CheckSquare,
  Square,
  Wand2,
  FileText,
  Trash2,
  ShieldCheck,
  Disc3,
  Archive,
  RefreshCw,
  Plus,
  AlertCircle,
  Play,
  RotateCcw,
} from 'lucide-react';
import type {
  MP3FileItem,
  MP3Picture,
  MP3Tags,
  CleanTagsOptions,
} from './types/mp3';
import { readMP3File, applyCleanOptionsToTags, revokeFileResources, revokePictureUrl } from './utils/id3';
import { createDemoTracks } from './utils/demoFiles';
import { exportFilesToZip, saveAndDownloadSingleFile } from './utils/zipExport';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Dropzone } from './components/Dropzone';
import { FileList } from './components/FileList';
import { TagEditorPanel } from './components/TagEditorPanel';
import { AudioPlayer } from './components/AudioPlayer';
import { AutoTagModal } from './components/AutoTagModal';
import { BatchRenameModal } from './components/BatchRenameModal';
import { CleanTagsModal } from './components/CleanTagsModal';
import { AboutView } from './components/AboutView';
import { ToastContainer, type ToastMessage } from './components/Toast';

// Límites para evitar agotar la memoria del navegador (DoS local)
const MAX_FILES_PER_SESSION = 200;
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB por archivo

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      let saved: string | null = null;
      try {
        saved = localStorage.getItem('theme');
      } catch {
        /* almacenamiento bloqueado (modo privado, políticas del navegador) */
      }
      if (saved === 'dark' || saved === 'light') return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Navigation state
  const [currentView, setCurrentView] = useState<'editor' | 'about'>('editor');

  // MP3 files state
  const [files, setFiles] = useState<MP3FileItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [isLoadingFiles, setIsLoadingFiles] = useState<boolean>(false);

  // Audio player state
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Modals state
  const [isAutoTagOpen, setIsAutoTagOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isCleanOpen, setIsCleanOpen] = useState(false);

  // Zip export progress
  const [zipProgress, setZipProgress] = useState<{
    isExporting: boolean;
    current: number;
    total: number;
    message: string;
  } | null>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Apply dark class to documentElement
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    try {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    } catch {
      /* ignorar si el almacenamiento no está disponible */
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  const addToast = (type: 'success' | 'error' | 'info', title: string, description?: string) => {
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    setToasts((prev) => [...prev, { id, type, title, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load files from FileList or drop
  const handleFilesSelected = async (fileList: FileList | File[]) => {
    const mp3Files = Array.from(fileList).filter(
      (f) =>
        f.name.toLowerCase().endsWith('.mp3') ||
        f.type === 'audio/mpeg' ||
        f.type === 'audio/mp3'
    );

    const sizeOk = mp3Files.filter((f) => f.size > 0 && f.size <= MAX_FILE_SIZE_BYTES);
    const availableSlots = Math.max(0, MAX_FILES_PER_SESSION - files.length);
    const rawFiles = sizeOk.slice(0, availableSlots);
    const skipped = mp3Files.length - rawFiles.length;

    if (mp3Files.length > 0 && skipped > 0) {
      addToast(
        'info',
        `${skipped} archivo${skipped === 1 ? '' : 's'} omitido${skipped === 1 ? '' : 's'}`,
        `Límites: máx. ${MAX_FILES_PER_SESSION} pistas por sesión y ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB por archivo.`
      );
    }

    if (rawFiles.length === 0 && mp3Files.length > 0) {
      return;
    }

    if (rawFiles.length === 0) {
      addToast(
        'error',
        'Formato no compatible',
        'Por favor, selecciona archivos con formato .mp3 válidos.'
      );
      return;
    }

    setIsLoadingFiles(true);
    addToast(
      'info',
      'Leyendo metadatos...',
      `Procesando ${rawFiles.length} archivo${rawFiles.length === 1 ? '' : 's'} en el navegador.`
    );

    try {
      const parsedItems = await Promise.all(rawFiles.map((file) => readMP3File(file)));
      setFiles((prev) => [...prev, ...parsedItems]);

      // Select first added track if none currently selected
      if (!activeId && parsedItems.length > 0) {
        setActiveId(parsedItems[0].id);
        setSelectedIds(new Set([parsedItems[0].id]));
      }

      addToast(
        'success',
        'Archivos cargados con éxito',
        `Se añadieron ${parsedItems.length} pistas a tu sesión de edición.`
      );
    } catch (err) {
      console.error(err);
      addToast('error', 'Error al leer archivos', 'Ocurrió un problema al leer las cabeceras ID3.');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Load demo tracks
  const handleLoadDemos = async () => {
    setIsLoadingFiles(true);
    try {
      const demoItems = await createDemoTracks();
      setFiles((prev) => [...prev, ...demoItems]);
      setActiveId(demoItems[0].id);
      setSelectedIds(new Set([demoItems[0].id]));
      addToast(
        'success',
        'Pistas de ejemplo cargadas',
        'Se han añadido 3 canciones de prueba con carátulas y etiquetas completas.'
      );
    } catch (err) {
      console.error(err);
      addToast('error', 'Error al generar ejemplos', 'No se pudieron generar las pistas de prueba.');
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Selection handlers
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
      // Toggle individual selection
      const newSelection = new Set(selectedIds);
      if (newSelection.has(id)) {
        newSelection.delete(id);
        if (activeId === id) {
          const nextActive = Array.from(newSelection)[0] || null;
          setActiveId(nextActive);
        }
      } else {
        newSelection.add(id);
        setActiveId(id);
      }
      setSelectedIds(newSelection);
      setLastSelectedIndex(clickedIndex);
    } else {
      // Single selection
      setSelectedIds(new Set([id]));
      setActiveId(id);
      setLastSelectedIndex(clickedIndex);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.size === files.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(files.map((f) => f.id)));
    }
  };

  const handleDeleteTrack = (id: string) => {
    setFiles((prev) => {
      const toRemove = prev.find((f) => f.id === id);
      if (toRemove) {
        // Also revoke originalTags picture if it differs (shared ref is common)
        revokeFileResources(toRemove);
        if (toRemove.originalTags?.picture?.url && toRemove.originalTags.picture.url !== toRemove.tags?.picture?.url) {
          revokePictureUrl(toRemove.originalTags.picture);
        }
      }
      return prev.filter((f) => f.id !== id);
    });
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (activeId === id) {
      setActiveId(null);
    }
    if (playingId === id) {
      setIsPlaying(false);
      setPlayingId(null);
    }
    addToast('info', 'Pista eliminada de la lista');
  };

  const handleClearAll = () => {
    if (window.confirm('¿Deseas vaciar la lista de canciones? Los cambios no guardados se perderán.')) {
      setFiles((prev) => {
        prev.forEach((item) => {
          revokeFileResources(item);
          if (item.originalTags?.picture?.url && item.originalTags.picture.url !== item.tags?.picture?.url) {
            revokePictureUrl(item.originalTags.picture);
          }
        });
        return [];
      });
      setSelectedIds(new Set());
      setActiveId(null);
      setPlayingId(null);
      setIsPlaying(false);
      addToast('info', 'Lista vaciada');
    }
  };

  // Audio preview controls
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
    const nextIndex = (currentIndex + 1) % files.length;
    setPlayingId(files[nextIndex].id);
    setIsPlaying(true);
  };

  const handlePrevTrack = () => {
    if (!playingId || files.length === 0) return;
    const currentIndex = files.findIndex((f) => f.id === playingId);
    const prevIndex = (currentIndex - 1 + files.length) % files.length;
    setPlayingId(files[prevIndex].id);
    setIsPlaying(true);
  };

  const playingTrack = useMemo(
    () => files.find((f) => f.id === playingId) || null,
    [files, playingId]
  );

  // Tag updates from inspector
  const handleUpdateTags = (updates: Partial<MP3Tags>, applyToBatch: boolean) => {
    setFiles((prev) =>
      prev.map((item) => {
        const isTarget = applyToBatch ? selectedIds.has(item.id) : item.id === activeId;
        if (!isTarget) return item;

        const newTags = { ...item.tags, ...updates };
        return {
          ...item,
          tags: newTags,
          hasChanges: true,
          status: 'modified',
        };
      })
    );

    if (applyToBatch) {
      addToast(
        'success',
        'Etiquetas actualizadas',
        `Se aplicaron cambios a ${selectedIds.size} pistas seleccionadas.`
      );
    }
  };

  const handleUpdatePicture = (picture: MP3Picture | null, applyToBatch: boolean) => {
    setFiles((prev) =>
      prev.map((item) => {
        const isTarget = applyToBatch ? selectedIds.has(item.id) : item.id === activeId;
        if (!isTarget) return item;

        // Revoke previous cover object URL to free memory (do not touch originalTags)
        if (item.tags.picture?.url && item.tags.picture.url !== picture?.url) {
          revokePictureUrl(item.tags.picture);
        }

        return {
          ...item,
          tags: {
            ...item.tags,
            picture,
          },
          hasChanges: true,
          status: 'modified',
        };
      })
    );

    addToast(
      'success',
      picture ? 'Carátula actualizada' : 'Carátula eliminada',
      applyToBatch ? `Aplicado a ${selectedIds.size} pistas.` : undefined
    );
  };

  const handleRevertTags = () => {
    setFiles((prev) =>
      prev.map((item) => {
        if (!selectedIds.has(item.id)) return item;
        // Free current (modified) picture URL when it is not the original one
        if (
          item.tags.picture?.url &&
          item.tags.picture.url !== item.originalTags?.picture?.url
        ) {
          revokePictureUrl(item.tags.picture);
        }
        return {
          ...item,
          tags: { ...item.originalTags },
          currentFileName: item.originalFileName,
          hasChanges: false,
          status: 'loaded',
        };
      })
    );
    addToast('info', 'Cambios revertidos a las etiquetas originales');
  };

  // Download single file
  const handleDownloadSingle = async (item: MP3FileItem) => {
    try {
      addToast('info', 'Guardando etiquetas...', `Escribiendo ID3v2.3 en ${item.currentFileName}`);
      await saveAndDownloadSingleFile(item);
      setFiles((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, status: 'saved', hasChanges: false } : f))
      );
      addToast('success', 'Descarga completada', `${item.currentFileName} guardado.`);
    } catch (err) {
      console.error(err);
      addToast('error', 'Error al guardar archivo', 'No se pudo generar el archivo MP3.');
    }
  };

  // Batch download in ZIP
  const handleDownloadZip = async () => {
    const targetItems =
      selectedIds.size > 0 ? files.filter((f) => selectedIds.has(f.id)) : files;

    if (targetItems.length === 0) {
      addToast('error', 'No hay archivos para descargar');
      return;
    }

    setZipProgress({
      isExporting: true,
      current: 0,
      total: targetItems.length,
      message: 'Preparando empaquetado...',
    });

    try {
      await exportFilesToZip(targetItems, (current, total, message) => {
        setZipProgress({
          isExporting: true,
          current,
          total,
          message,
        });
      });

      // Mark items as saved
      const targetIds = new Set(targetItems.map((i) => i.id));
      setFiles((prev) =>
        prev.map((f) => (targetIds.has(f.id) ? { ...f, status: 'saved', hasChanges: false } : f))
      );

      addToast(
        'success',
        'ZIP descargado con éxito',
        `Se han empaquetado ${targetItems.length} archivos MP3 con sus etiquetas ID3v2.3 actualizadas.`
      );
    } catch (err) {
      console.error(err);
      addToast('error', 'Error al generar ZIP', 'Ocurrió un problema al comprimir los archivos.');
    } finally {
      setZipProgress(null);
    }
  };

  // Auto-tag modal apply
  const handleApplyAutoTags = (updatesMap: Record<string, Partial<MP3Tags>>) => {
    setFiles((prev) =>
      prev.map((item) => {
        const update = updatesMap[item.id];
        if (!update) return item;
        return {
          ...item,
          tags: { ...item.tags, ...update },
          hasChanges: true,
          status: 'modified',
        };
      })
    );
    addToast('success', 'Auto-relleno aplicado', 'Etiquetas extraídas desde los nombres de archivo.');
  };

  // Batch rename apply
  const handleApplyRenaming = (renamedMap: Record<string, string>) => {
    setFiles((prev) =>
      prev.map((item) => {
        const newName = renamedMap[item.id];
        if (!newName) return item;
        return {
          ...item,
          currentFileName: newName,
          hasChanges: true,
          status: 'modified',
        };
      })
    );
    addToast('success', 'Nombres actualizados', 'Archivos renombrados a partir de sus etiquetas.');
  };

  // Clean tags apply
  const handleApplyClean = (options: CleanTagsOptions) => {
    const targetSet = selectedIds.size > 0 ? selectedIds : new Set(files.map((f) => f.id));

    setFiles((prev) =>
      prev.map((item) => {
        if (!targetSet.has(item.id)) return item;
        const cleaned = applyCleanOptionsToTags(item.tags, options);
        // If cover was removed, free its object URL
        if (
          (options.removeAll || options.removeCover) &&
          item.tags.picture?.url &&
          item.tags.picture.url !== cleaned.picture?.url
        ) {
          revokePictureUrl(item.tags.picture);
        }
        return {
          ...item,
          tags: cleaned,
          hasChanges: true,
          status: 'modified',
        };
      })
    );

    addToast(
      'success',
      'Limpieza completada',
      `Se limpiaron las etiquetas de ${targetSet.size} archivos.`
    );
  };

  // Derived variables
  const selectedItems = useMemo(
    () => files.filter((f) => selectedIds.has(f.id)),
    [files, selectedIds]
  );

  const activeItem = useMemo(
    () => files.find((f) => f.id === activeId) || null,
    [files, activeId]
  );

  const hasUnsavedChanges = useMemo(() => files.some((f) => f.hasChanges), [files]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Header */}
      <Header
        currentView={currentView}
        onViewChange={setCurrentView}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        fileCount={files.length}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
        {currentView === 'about' ? (
          <AboutView
            onBackToEditor={() => setCurrentView('editor')}
            onLoadDemos={handleLoadDemos}
          />
        ) : files.length === 0 ? (
          /* Empty State / Initial Dropzone */
          <div className="max-w-2xl mx-auto my-8 space-y-8">
            <div className="text-center space-y-3">
              <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Editor de Etiquetas MP3 Online
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Edita metadatos ID3v2.3, carátulas y letras por lotes en tu navegador.
                Máxima privacidad sin subir tus archivos a ningún servidor.
              </p>
            </div>

            <Dropzone
              onFilesSelected={handleFilesSelected}
              isLoading={isLoadingFiles}
            />

            {/* Quick feature highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-2xs">
                <span className="font-semibold text-slate-900 dark:text-white block">
                  Edición por lotes
                </span>
                <p className="text-slate-500 dark:text-slate-400">
                  Modifica álbum, artista o carátula de discos enteros de una sola vez.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-2xs">
                <span className="font-semibold text-slate-900 dark:text-white block">
                  Auto-relleno y renombrado
                </span>
                <p className="text-slate-500 dark:text-slate-400">
                  Extrae etiquetas de nombres de archivo y renombra con plantillas personalizadas.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1 shadow-2xs">
                <span className="font-semibold text-slate-900 dark:text-white block">
                  Exportación en ZIP
                </span>
                <p className="text-slate-500 dark:text-slate-400">
                  Descarga tus canciones editadas de forma individual o todas en un único archivo ZIP comprimido.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Populated State: Full Workspace */
          <div className="space-y-4">
            {/* Action Toolbar */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3 transition-colors">
              <div className="flex flex-wrap items-center gap-2">
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".mp3,audio/mpeg,audio/mp3"
                    multiple
                    onChange={(e) => {
                      if (e.target.files) handleFilesSelected(e.target.files);
                      e.target.value = '';
                    }}
                    className="hidden"
                  />
                  <span className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-all active:scale-95 inline-flex items-center gap-1.5 cursor-pointer">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir MP3</span>
                  </span>
                </label>

                <button
                  type="button"
                  onClick={() => setIsAutoTagOpen(true)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors inline-flex items-center gap-1.5"
                  title="Auto-rellenar etiquetas analizando nombres de archivo"
                >
                  <Wand2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Auto-rellenar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsRenameOpen(true)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors inline-flex items-center gap-1.5"
                  title="Renombrar archivos basándose en sus etiquetas"
                >
                  <FileText className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Renombrar</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCleanOpen(true)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors inline-flex items-center gap-1.5"
                  title="Limpiar o eliminar etiquetas ID3"
                >
                  <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Limpiar</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="Vaciar toda la lista"
                >
                  Vaciar lista
                </button>

                <button
                  type="button"
                  onClick={handleDownloadZip}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-all active:scale-95 inline-flex items-center gap-1.5"
                >
                  <Archive className="w-3.5 h-3.5" />
                  <span>
                    Descargar {selectedIds.size > 0 ? `(${selectedIds.size})` : 'todo'} en ZIP
                  </span>
                </button>
              </div>
            </div>

            {/* Split Grid: File Table + Tag Inspector */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Column: File Table (7 cols on desktop) */}
              <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
                <FileList
                  files={files}
                  selectedIds={selectedIds}
                  activeId={activeId}
                  onSelectTrack={handleSelectTrack}
                  onToggleSelectAll={handleToggleSelectAll}
                  onDeleteTrack={handleDeleteTrack}
                  onDownloadSingle={handleDownloadSingle}
                  playingId={playingId}
                  isPlaying={isPlaying}
                  onTogglePlay={handleTogglePlay}
                />
              </div>

              {/* Right Column: Tag Inspector / Batch Editor (5 cols on desktop) */}
              <div className="lg:col-span-5 xl:col-span-4 sticky top-20">
                <TagEditorPanel
                  selectedItems={selectedItems}
                  activeItem={activeItem}
                  onUpdateTags={handleUpdateTags}
                  onUpdatePicture={handleUpdatePicture}
                  onRevertTags={handleRevertTags}
                  onDownloadActive={() => {
                    if (activeItem) handleDownloadSingle(activeItem);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Zip Export Progress Overlay */}
      {zipProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Generando archivo ZIP
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {zipProgress.message}
              </p>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-full transition-all duration-300 rounded-full"
                style={{
                  width: `${Math.round((zipProgress.current / zipProgress.total) * 100)}%`,
                }}
              />
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-400 block">
              {zipProgress.current} de {zipProgress.total} canciones procesadas
            </span>
          </div>
        </div>
      )}

      {/* Auto-tag Modal */}
      <AutoTagModal
        isOpen={isAutoTagOpen}
        onClose={() => setIsAutoTagOpen(false)}
        files={files}
        selectedIds={selectedIds}
        onApplyAutoTags={handleApplyAutoTags}
      />

      {/* Batch Rename Modal */}
      <BatchRenameModal
        isOpen={isRenameOpen}
        onClose={() => setIsRenameOpen(false)}
        files={files}
        selectedIds={selectedIds}
        onApplyRenaming={handleApplyRenaming}
      />

      {/* Clean Tags Modal */}
      <CleanTagsModal
        isOpen={isCleanOpen}
        onClose={() => setIsCleanOpen(false)}
        targetCount={selectedIds.size > 0 ? selectedIds.size : files.length}
        onApplyClean={handleApplyClean}
      />

      {/* Fixed Audio Player */}
      <AudioPlayer
        currentTrack={playingTrack}
        isPlaying={isPlaying}
        onTogglePlay={() => {
          if (playingId) handleTogglePlay(playingId);
        }}
        onNext={handleNextTrack}
        onPrev={handlePrevTrack}
        onClose={() => {
          setIsPlaying(false);
          setPlayingId(null);
        }}
      />

      {/* Toast feedback notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />

      {/* Footer (present across all pages) */}
      <Footer />
    </div>
  );
}
