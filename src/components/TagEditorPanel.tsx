import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  RotateCcw,
  Download,
  Image as ImageIcon,
  Upload,
  Trash2,
  Copy,
  Layers,
  ChevronDown,
  Sparkles,
  Info,
} from 'lucide-react';
import type { MP3FileItem, MP3Picture, MP3Tags } from '../types/mp3';
import { ID3_GENRES } from '../constants/genres';
import { convertImageFileToPicture } from '../utils/id3';

interface TagEditorPanelProps {
  selectedItems: MP3FileItem[];
  activeItem: MP3FileItem | null;
  onUpdateTags: (tags: Partial<MP3Tags>, applyToBatch: boolean) => void;
  onUpdatePicture: (picture: MP3Picture | null, applyToBatch: boolean) => void;
  onRevertTags: () => void;
  onDownloadActive: () => void;
}

export const TagEditorPanel: React.FC<TagEditorPanelProps> = ({
  selectedItems,
  activeItem,
  onUpdateTags,
  onUpdatePicture,
  onRevertTags,
  onDownloadActive,
}) => {
  const isBatchMode = selectedItems.length > 1;
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Local form state
  const [formData, setFormData] = useState<MP3Tags>({
    title: '',
    artist: '',
    album: '',
    albumArtist: '',
    year: '',
    track: '',
    genre: '',
    comment: '',
    composer: '',
    bpm: '',
    lyrics: '',
    picture: null,
  });

  // Track which fields have been touched in batch mode
  const [touchedFields, setTouchedFields] = useState<Set<keyof MP3Tags>>(new Set());
  const [showLyricsModal, setShowLyricsModal] = useState(false);
  const [isDragOverImage, setIsDragOverImage] = useState(false);

  // Sync form data with activeItem or batch consensus
  useEffect(() => {
    if (!isBatchMode && activeItem) {
      setFormData({ ...activeItem.tags });
      setTouchedFields(new Set());
    } else if (isBatchMode && selectedItems.length > 0) {
      // Find common values across selected items
      const first = selectedItems[0].tags;
      const common: MP3Tags = {
        title: selectedItems.every((i) => i.tags.title === first.title) ? first.title : '',
        artist: selectedItems.every((i) => i.tags.artist === first.artist) ? first.artist : '',
        album: selectedItems.every((i) => i.tags.album === first.album) ? first.album : '',
        albumArtist: selectedItems.every((i) => i.tags.albumArtist === first.albumArtist)
          ? first.albumArtist
          : '',
        year: selectedItems.every((i) => i.tags.year === first.year) ? first.year : '',
        track: selectedItems.every((i) => i.tags.track === first.track) ? first.track : '',
        genre: selectedItems.every((i) => i.tags.genre === first.genre) ? first.genre : '',
        comment: selectedItems.every((i) => i.tags.comment === first.comment) ? first.comment : '',
        composer: selectedItems.every((i) => i.tags.composer === first.composer)
          ? first.composer
          : '',
        bpm: selectedItems.every((i) => i.tags.bpm === first.bpm) ? first.bpm : '',
        lyrics: selectedItems.every((i) => i.tags.lyrics === first.lyrics) ? first.lyrics : '',
        picture: selectedItems.every((i) => i.tags.picture?.url === first.picture?.url)
          ? first.picture
          : null,
      };
      setFormData(common);
      setTouchedFields(new Set());
    }
  }, [activeItem, selectedItems, isBatchMode]);

  if (!activeItem && selectedItems.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-400 dark:text-slate-500 h-full flex flex-col items-center justify-center">
        <ImageIcon className="w-12 h-12 mb-3 opacity-30 text-indigo-500" />
        <h4 className="font-semibold text-slate-700 dark:text-slate-300 text-sm mb-1">
          Ninguna pista seleccionada
        </h4>
        <p className="text-xs max-w-xs">
          Selecciona una o varias canciones de la lista para inspeccionar y editar sus etiquetas ID3.
        </p>
      </div>
    );
  }

  const handleFieldChange = (field: keyof MP3Tags, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTouchedFields((prev) => new Set(prev).add(field));

    if (!isBatchMode) {
      onUpdateTags({ [field]: value }, false);
    }
  };

  const handleApplyBatch = () => {
    if (!isBatchMode) return;
    const updates: Partial<MP3Tags> = {};
    touchedFields.forEach((field) => {
      updates[field] = formData[field] as any;
    });
    onUpdateTags(updates, true);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const pic = await convertImageFileToPicture(file);
        setFormData((prev) => ({ ...prev, picture: pic }));
        onUpdatePicture(pic, isBatchMode);
      } catch (err) {
        console.error('Error al procesar carátula:', err);
      }
    }
  };

  const handleCoverDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverImage(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        try {
          const pic = await convertImageFileToPicture(file);
          setFormData((prev) => ({ ...prev, picture: pic }));
          onUpdatePicture(pic, isBatchMode);
        } catch (err) {
          console.error('Error al procesar carátula:', err);
        }
      }
    }
  };

  const handleRemoveCover = () => {
    setFormData((prev) => ({ ...prev, picture: null }));
    onUpdatePicture(null, isBatchMode);
  };

  const handleDownloadCover = () => {
    if (formData.picture) {
      const a = document.createElement('a');
      a.href = formData.picture.url;
      const ext = formData.picture.mime.includes('png') ? 'png' : 'jpg';
      a.download = `caratula-${formData.album || 'cover'}.${ext}`;
      a.click();
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col h-full overflow-hidden transition-colors">
      {/* Header Panel */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/70">
        <div className="flex items-center gap-2">
          {isBatchMode ? (
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Layers className="w-4 h-4" />
              <span className="font-semibold text-xs text-slate-900 dark:text-white">
                Edición por lotes ({selectedItems.length} pistas)
              </span>
            </div>
          ) : (
            <div className="truncate">
              <span className="font-semibold text-xs text-slate-900 dark:text-white block truncate">
                {formData.title || activeItem?.currentFileName || 'Editor ID3'}
              </span>
              <span className="text-[11px] text-slate-400 truncate block">
                {activeItem?.currentFileName}
              </span>
            </div>
          )}
        </div>

        {isBatchMode && (
          <button
            type="button"
            onClick={handleApplyBatch}
            disabled={touchedFields.size === 0}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-lg shadow-2xs transition-all active:scale-95"
          >
            Aplicar a seleccionadas
          </button>
        )}
      </div>

      {/* Scrollable Form Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Cover Art Section */}
        <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 rounded-xl">
          <div className="flex items-start gap-4">
            {/* Image Preview with Dropzone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOverImage(true);
              }}
              onDragLeave={() => setIsDragOverImage(false)}
              onDrop={handleCoverDrop}
              onClick={() => imageInputRef.current?.click()}
              className={`relative w-28 h-28 rounded-xl bg-slate-200 dark:bg-slate-800 border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all group shrink-0 ${
                isDragOverImage
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40'
                  : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400'
              }`}
            >
              {formData.picture?.url ? (
                <>
                  <img
                    src={formData.picture.url}
                    alt="Album Cover"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-1 text-center">
                    <Upload className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-medium leading-tight">Cambiar carátula</span>
                  </div>
                </>
              ) : (
                <div className="text-center p-2 text-slate-400 group-hover:text-indigo-500">
                  <ImageIcon className="w-6 h-6 mx-auto mb-1 opacity-60" />
                  <span className="text-[10px] block leading-tight">Subir portada</span>
                </div>
              )}
            </div>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleCoverUpload}
              className="hidden"
            />

            {/* Cover Info & Action Buttons */}
            <div className="flex-1 flex flex-col justify-between self-stretch min-w-0">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs mb-0.5">
                  Carátula del Álbum (APIC)
                </span>
                {formData.picture ? (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono tabular-nums">
                    {formData.picture.width && formData.picture.height
                      ? `${formData.picture.width} × ${formData.picture.height} px`
                      : 'Carátula cargada'}
                    {formData.picture.sizeKB ? ` · ${formData.picture.sizeKB} KB` : ''}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">Sin carátula asignada</p>
                )}
                <span className="text-[10px] text-slate-400 block mt-1">
                  Recomendado: 500×500 a 1000×1000 px (JPG/PNG).
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors inline-flex items-center gap-1"
                >
                  <Upload className="w-3 h-3" />
                  <span>Subir</span>
                </button>

                {formData.picture && (
                  <>
                    <button
                      type="button"
                      onClick={handleDownloadCover}
                      className="px-2 py-1 text-[11px] font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                      title="Descargar imagen de carátula"
                    >
                      <Download className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveCover}
                      className="px-2 py-1 text-[11px] font-medium text-rose-600 dark:text-rose-400 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="Quitar carátula"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Primary Tags Grid */}
        <div className="space-y-3">
          {/* Título */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
              Título de la pista (TIT2)
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              placeholder={isBatchMode ? '< Mantener valores individuales >' : 'Ej: Midnight Drive'}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Artista y Artista del Álbum */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Artista principal (TPE1)
              </label>
              <input
                type="text"
                value={formData.artist}
                onChange={(e) => handleFieldChange('artist', e.target.value)}
                placeholder={isBatchMode ? '< Varios artistas >' : 'Ej: Solar Echoes'}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Artista del Álbum (TPE2)
              </label>
              <input
                type="text"
                value={formData.albumArtist}
                onChange={(e) => handleFieldChange('albumArtist', e.target.value)}
                placeholder={isBatchMode ? '< Varios artistas >' : 'Ej: Various Artists'}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Álbum y Año */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Álbum (TALB)
              </label>
              <input
                type="text"
                value={formData.album}
                onChange={(e) => handleFieldChange('album', e.target.value)}
                placeholder={isBatchMode ? '< Varios álbumes >' : 'Ej: Neon Odyssey'}
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Año (TYER)
              </label>
              <input
                type="text"
                maxLength={4}
                value={formData.year}
                onChange={(e) => handleFieldChange('year', e.target.value)}
                placeholder="2026"
                className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Pista y Género */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Pista (TRCK)
              </label>
              <input
                type="text"
                value={formData.track}
                onChange={(e) => handleFieldChange('track', e.target.value)}
                placeholder="01/10"
                className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Género (TCON)
              </label>
              <div className="relative">
                <input
                  type="text"
                  list="id3-genre-list"
                  value={formData.genre}
                  onChange={(e) => handleFieldChange('genre', e.target.value)}
                  placeholder="Seleccionar o escribir..."
                  className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <datalist id="id3-genre-list">
                  {ID3_GENRES.map((g) => (
                    <option key={g} value={g} />
                  ))}
                </datalist>
              </div>
            </div>
          </div>

          {/* Compositor y BPM */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                Compositor (TCOM)
              </label>
              <input
                type="text"
                value={formData.composer}
                onChange={(e) => handleFieldChange('composer', e.target.value)}
                placeholder="Ej: Aitor Sánchez"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                BPM (TBPM)
              </label>
              <input
                type="number"
                value={formData.bpm}
                onChange={(e) => handleFieldChange('bpm', e.target.value)}
                placeholder="128"
                className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Comentario */}
          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
              Comentario (COMM)
            </label>
            <input
              type="text"
              value={formData.comment}
              onChange={(e) => handleFieldChange('comment', e.target.value)}
              placeholder="Comentarios o notas de la versión..."
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Letra (Lyrics) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400">
                Letra de la canción (USLT)
              </label>
              {formData.lyrics && (
                <span className="text-[10px] text-slate-400 font-mono">
                  {formData.lyrics.split('\n').length} líneas
                </span>
              )}
            </div>
            <textarea
              rows={3}
              value={formData.lyrics}
              onChange={(e) => handleFieldChange('lyrics', e.target.value)}
              placeholder="Introduce la letra de la canción aquí..."
              className="w-full px-3 py-2 text-xs font-sans bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-y"
            />
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onRevertTags}
          className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center gap-1.5"
          title="Revertir etiquetas originales"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Revertir</span>
        </button>

        {!isBatchMode && activeItem && (
          <button
            type="button"
            onClick={onDownloadActive}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-all active:scale-95 inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar MP3</span>
          </button>
        )}
      </div>
    </div>
  );
};
