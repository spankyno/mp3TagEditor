export interface MP3Picture {
  mime: string;
  data: ArrayBuffer;
  url: string;
  width?: number;
  height?: number;
  sizeKB?: number;
}

export interface MP3Tags {
  title: string;
  artist: string;
  album: string;
  albumArtist: string;
  year: string;
  track: string;
  genre: string;
  comment: string;
  composer: string;
  bpm: string;
  lyrics: string;
  picture?: MP3Picture | null;
}

/** Versión de la etiqueta ID3v2 que se escribe al guardar */
export type ID3Version = '2.3' | '2.4';

export type FileStatus = 'loaded' | 'modified' | 'processing' | 'saved' | 'error';

export interface MP3FileItem {
  id: string;
  file: File;
  originalFileName: string;
  currentFileName: string;
  size: number;
  duration: number; // in seconds
  status: FileStatus;
  statusMessage?: string;
  tags: MP3Tags;
  originalTags: MP3Tags;
  audioUrl: string;
  hasChanges: boolean;
}

export interface AutoTagPattern {
  id: string;
  label: string;
  pattern: string;
  example: string;
}

export interface RenamePattern {
  id: string;
  label: string;
  template: string;
  example: string;
}

export interface CleanTagsOptions {
  removeAll: boolean;
  removeCover: boolean;
  removeComments: boolean;
  removeLyrics: boolean;
  removeComposer: boolean;
  removeBpm: boolean;
}
