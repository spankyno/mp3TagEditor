import React, { useState, useEffect, useRef, useId } from 'react';
import {
  RotateCcw,
  Download,
  Image as ImageIcon,
  Upload,
  Trash2,
  Layers,
} from 'lucide-react';
import type { MP3FileItem, MP3Picture, MP3Tags } from '../types/mp3';
import { ID3_GENRES } from '../constants/genres';
import { convertImageFileToPicture, CoverError } from '../utils/id3';
import { useI18n } from '../i18n';

interface TagEditorPanelProps {
  selectedItems: MP3FileItem[];
  activeItem: MP3FileItem | null;
  onUpdateTags: (tags: Partial<MP3Tags>, applyToBatch: boolean) => void;
  onUpdatePicture: (picture: MP3Picture | null, applyToBatch: boolean) => void;
  onRevertTags: () => void;
  onDownloadActive: () => void;
  onCoverError: (code: CoverError['code']) => void;
}

const INPUT_CLASS =
  'w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500';

const LABEL_CLASS = 'block text-[11px] font-medium text-slate-700 dark:text-slate-400 mb-1';

const SECONDARY_BTN =
  'px-2.5 py-1.5 text-[11px] font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors inline-flex items-center gap-1';

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  mono?: boolean;
  type?: 'text' | 'number';
  maxLength?: number;
  list?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  className?: string;
  children?: React.ReactNode;
}

/** Campo de texto con <label> asociado (accesible para lectores de pantalla) */
const TextField: React.FC<TextFieldProps> = ({
  label,
  value,
  onChange,
  placeholder,
  mono,
  type = 'text',
  maxLength,
  list,
  inputMode,
  className,
  children,
}) => {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className={LABEL_CLASS}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        maxLength={maxLength}
        list={list}
        inputMode={inputMode}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${INPUT_CLASS} ${mono ? 'font-mono' : ''}`}
      />
      {children}
    </div>
  );
};

const EMPTY_TAGS: MP3Tags = {
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
};

export const TagEditorPanel: React.FC<TagEditorPanelProps> = ({
  selectedItems,
  activeItem,
  onUpdateTags,
  onUpdatePicture,
  onRevertTags,
  onDownloadActive,
  onCoverError,
}) => {
  const { t, tn } = useI18n();
  const isBatchMode = selectedItems.length > 1;
  const imageInputRef = useRef<HTMLInputElement>(null);
  const lyricsId = useId();

  const [formData, setFormData] = useState<MP3Tags>(EMPTY_TAGS);
  // Track which fields have been touched in batch mode
  const [touchedFields, setTouchedFields] = useState<Set<keyof MP3Tags>>(new Set());
  const [isDragOverImage, setIsDragOverImage] = useState(false);

  // Sync form data with activeItem or batch consensus
  useEffect(() => {
    if (!isBatchMode && activeItem) {
      setFormData({ ...activeItem.tags });
      setTouchedFields(new Set());
    } else if (isBatchMode && selectedItems.length > 0) {
      const first = selectedItems[0].tags;
      const same = <K extends keyof MP3Tags>(key: K) =>
        selectedItems.every((i) => i.tags[key] === first[key]) ? first[key] : '';
      const common: MP3Tags = {
        title: same('title') as string,
        artist: same('artist') as string,
        album: same('album') as string,
        albumArtist: same('albumArtist') as string,
        year: same('year') as string,
        track: same('track') as string,
        genre: same('genre') as string,
        comment: same('comment') as string,
        composer: same('composer') as string,
        bpm: same('bpm') as string,
        lyrics: same('lyrics') as string,
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
      <section
        aria-label={t('tag.panelLabel')}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-slate-600 dark:text-slate-400 h-full flex flex-col items-center justify-center"
      >
        <ImageIcon aria-hidden="true" className="w-12 h-12 mb-3 opacity-40 text-indigo-500" />
        <h2 className="font-semibold text-slate-800 dark:text-slate-300 text-sm mb-1">
          {t('tag.noneTitle')}
        </h2>
        <p className="text-xs max-w-xs">{t('tag.noneText')}</p>
      </section>
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
      (updates as Record<string, unknown>)[field] = formData[field];
    });
    onUpdateTags(updates, true);
  };

  const processCover = async (file: File) => {
    try {
      const pic = await convertImageFileToPicture(file);
      setFormData((prev) => ({ ...prev, picture: pic }));
      onUpdatePicture(pic, isBatchMode);
    } catch (err) {
      onCoverError(err instanceof CoverError ? err.code : 'load');
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) await processCover(file);
  };

  const handleCoverDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverImage(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await processCover(file);
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
      a.download = `cover-${(formData.album || 'cover').replace(/[^\w\-]+/g, '_')}.${ext}`;
      a.click();
    }
  };

  const batchPlaceholder = (key: 'tag.keepIndividual' | 'tag.variousArtists' | 'tag.variousAlbums') =>
    isBatchMode ? t(key) : undefined;

  return (
    <section
      aria-label={t('tag.panelLabel')}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs flex flex-col h-full overflow-hidden transition-colors"
    >
      {/* Header Panel */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-900/70">
        <div className="flex items-center gap-2 min-w-0">
          {isBatchMode ? (
            <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
              <Layers aria-hidden="true" className="w-4 h-4" />
              <h2 className="font-semibold text-xs text-slate-900 dark:text-white">
                {tn('tag.batchTitle', selectedItems.length)}
              </h2>
            </div>
          ) : (
            <div className="truncate">
              <h2 className="font-semibold text-xs text-slate-900 dark:text-white block truncate">
                {formData.title || activeItem?.currentFileName || t('tag.defaultTitle')}
              </h2>
              <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate block">
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
            className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-2xs transition-all active:scale-95"
          >
            {t('tag.applyBatch')}
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
              className={`relative w-28 h-28 rounded-xl bg-slate-200 dark:bg-slate-800 border-2 border-dashed overflow-hidden transition-all group shrink-0 ${
                isDragOverImage
                  ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40'
                  : 'border-slate-400 dark:border-slate-700 hover:border-indigo-400'
              }`}
            >
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                aria-label={formData.picture ? t('tag.coverChange') : t('tag.coverUploadPlaceholder')}
                className="absolute inset-0 w-full h-full flex flex-col items-center justify-center cursor-pointer"
              >
                {formData.picture?.url ? (
                  <>
                    <img
                      src={formData.picture.url}
                      alt={t('tag.coverAlt')}
                      width={112}
                      height={112}
                      decoding="async"
                      className="w-full h-full object-cover"
                    />
                    <span
                      aria-hidden="true"
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-1 text-center"
                    >
                      <Upload className="w-5 h-5 mb-1" />
                      <span className="text-[10px] font-medium leading-tight">{t('tag.coverChange')}</span>
                    </span>
                  </>
                ) : (
                  <span className="text-center p-2 text-slate-600 dark:text-slate-400 group-hover:text-indigo-600">
                    <ImageIcon aria-hidden="true" className="w-6 h-6 mx-auto mb-1 opacity-70" />
                    <span className="text-[10px] block leading-tight">{t('tag.coverUploadPlaceholder')}</span>
                  </span>
                )}
              </button>
            </div>

            <input
              ref={imageInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleCoverUpload}
              className="hidden"
              tabIndex={-1}
              aria-hidden="true"
            />

            {/* Cover Info & Action Buttons */}
            <div className="flex-1 flex flex-col justify-between self-stretch min-w-0">
              <div>
                <span className="font-semibold text-slate-800 dark:text-slate-200 block text-xs mb-0.5">
                  {t('tag.coverTitle')}
                </span>
                {formData.picture ? (
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono tabular-nums">
                    {formData.picture.width && formData.picture.height
                      ? `${formData.picture.width} × ${formData.picture.height} px`
                      : t('tag.coverLoaded')}
                    {formData.picture.sizeKB ? ` · ${formData.picture.sizeKB} KB` : ''}
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 italic">{t('tag.coverNone')}</p>
                )}
                <span className="text-[10px] text-slate-600 dark:text-slate-400 block mt-1">
                  {t('tag.coverHint')}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-2">
                <button type="button" onClick={() => imageInputRef.current?.click()} className={SECONDARY_BTN}>
                  <Upload aria-hidden="true" className="w-3 h-3" />
                  <span>{t('tag.coverUpload')}</span>
                </button>

                {formData.picture && (
                  <>
                    <button
                      type="button"
                      onClick={handleDownloadCover}
                      className={SECONDARY_BTN}
                      title={t('tag.coverDownload')}
                      aria-label={t('tag.coverDownload')}
                    >
                      <Download aria-hidden="true" className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveCover}
                      className={`${SECONDARY_BTN} !text-rose-700 dark:!text-rose-400 hover:!bg-rose-50 dark:hover:!bg-rose-950/30`}
                      title={t('tag.coverRemove')}
                      aria-label={t('tag.coverRemove')}
                    >
                      <Trash2 aria-hidden="true" className="w-3 h-3" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Primary Tags Grid */}
        <div className="space-y-3">
          <TextField
            label={t('tag.title')}
            value={formData.title}
            onChange={(v) => handleFieldChange('title', v)}
            placeholder={isBatchMode ? t('tag.keepIndividual') : t('tag.titleExample')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextField
              label={t('tag.artist')}
              value={formData.artist}
              onChange={(v) => handleFieldChange('artist', v)}
              placeholder={batchPlaceholder('tag.variousArtists') ?? t('tag.artistExample')}
            />
            <TextField
              label={t('tag.albumArtist')}
              value={formData.albumArtist}
              onChange={(v) => handleFieldChange('albumArtist', v)}
              placeholder={batchPlaceholder('tag.variousArtists') ?? t('tag.albumArtistExample')}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <TextField
              className="col-span-2"
              label={t('tag.album')}
              value={formData.album}
              onChange={(v) => handleFieldChange('album', v)}
              placeholder={batchPlaceholder('tag.variousAlbums') ?? t('tag.albumExample')}
            />
            <TextField
              label={t('tag.year')}
              value={formData.year}
              onChange={(v) => handleFieldChange('year', v)}
              maxLength={4}
              inputMode="numeric"
              mono
              placeholder="2026"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <TextField
              label={t('tag.track')}
              value={formData.track}
              onChange={(v) => handleFieldChange('track', v)}
              mono
              placeholder="01/10"
            />
            <TextField
              className="col-span-2"
              label={t('tag.genre')}
              value={formData.genre}
              onChange={(v) => handleFieldChange('genre', v)}
              list="id3-genre-list"
              placeholder={t('tag.genrePlaceholder')}
            >
              <datalist id="id3-genre-list">
                {ID3_GENRES.map((g) => (
                  <option key={g} value={g} />
                ))}
              </datalist>
            </TextField>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <TextField
              className="col-span-2"
              label={t('tag.composer')}
              value={formData.composer}
              onChange={(v) => handleFieldChange('composer', v)}
              placeholder={t('tag.composerExample')}
            />
            <TextField
              label={t('tag.bpm')}
              type="number"
              value={formData.bpm}
              onChange={(v) => handleFieldChange('bpm', v)}
              mono
              placeholder="128"
            />
          </div>

          <TextField
            label={t('tag.comment')}
            value={formData.comment}
            onChange={(v) => handleFieldChange('comment', v)}
            placeholder={t('tag.commentPlaceholder')}
          />

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor={lyricsId} className="block text-[11px] font-medium text-slate-700 dark:text-slate-400">
                {t('tag.lyrics')}
              </label>
              {formData.lyrics && (
                <span className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                  {tn('tag.lines', formData.lyrics.split('\n').length)}
                </span>
              )}
            </div>
            <textarea
              id={lyricsId}
              rows={3}
              value={formData.lyrics}
              onChange={(e) => handleFieldChange('lyrics', e.target.value)}
              placeholder={t('tag.lyricsPlaceholder')}
              className={`${INPUT_CLASS} py-2 font-sans resize-y`}
            />
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onRevertTags}
          className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors inline-flex items-center gap-1.5"
          title={t('tag.revertTitle')}
        >
          <RotateCcw aria-hidden="true" className="w-3.5 h-3.5" />
          <span>{t('tag.revert')}</span>
        </button>

        {!isBatchMode && activeItem && (
          <button
            type="button"
            onClick={onDownloadActive}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-2xs transition-all active:scale-95 inline-flex items-center gap-1.5"
          >
            <Download aria-hidden="true" className="w-3.5 h-3.5" />
            <span>{t('tag.download')}</span>
          </button>
        )}
      </div>
    </section>
  );
};
