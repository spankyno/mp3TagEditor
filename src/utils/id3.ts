import { ID3Writer } from 'browser-id3-writer';
import jsmediatags from 'jsmediatags';
import type { MP3FileItem, MP3Picture, MP3Tags, CleanTagsOptions } from '../types/mp3';
import { sanitizeFilename } from './formatters';

/**
 * Creates empty MP3 tags object
 */
export function createEmptyTags(fallbackTitle = ''): MP3Tags {
  return {
    title: fallbackTitle,
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
}

/**
 * Safely revokes object URLs associated with an MP3FileItem to prevent memory leaks.
 * Call when removing tracks from the session or replacing pictures.
 */
export function revokeFileResources(item: Pick<MP3FileItem, 'audioUrl' | 'tags'>): void {
  if (item.audioUrl) {
    try {
      URL.revokeObjectURL(item.audioUrl);
    } catch {
      /* ignore */
    }
  }
  if (item.tags?.picture?.url) {
    try {
      URL.revokeObjectURL(item.tags.picture.url);
    } catch {
      /* ignore */
    }
  }
}

/**
 * Revokes only the picture object URL if present (useful when replacing covers).
 */
export function revokePictureUrl(picture: MP3Picture | null | undefined): void {
  if (picture?.url) {
    try {
      URL.revokeObjectURL(picture.url);
    } catch {
      /* ignore */
    }
  }
}

/**
 * Reads audio duration using HTML5 Audio element
 */
export function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = 'metadata';
    let settled = false;

    const cleanUp = () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('error', onError);
      URL.revokeObjectURL(url);
    };

    const finish = (value: number) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeoutId);
      cleanUp();
      resolve(value);
    };

    const onLoaded = () => {
      const dur = audio.duration;
      finish(isNaN(dur) || !isFinite(dur) ? 0 : dur);
    };

    const onError = () => {
      finish(0);
    };

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('error', onError);
    audio.src = url;

    // Timeout fallback after 3 seconds
    const timeoutId = setTimeout(() => {
      finish(0);
    }, 3000);
  });
}

/**
 * Measures dimensions and creates an MP3Picture from binary image data
 */
export function createPictureFromBytes(data: Uint8Array, mimeType: string): Promise<MP3Picture> {
  return new Promise((resolve) => {
    const rawBuffer = (data.buffer as ArrayBuffer).slice(
      data.byteOffset,
      data.byteOffset + data.byteLength
    );
    const blob = new Blob([rawBuffer], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      resolve({
        mime: mimeType,
        data: rawBuffer,
        url,
        width: img.naturalWidth,
        height: img.naturalHeight,
        sizeKB: Math.round(blob.size / 1024),
      });
    };

    img.onerror = () => {
      resolve({
        mime: mimeType,
        data: rawBuffer,
        url,
        sizeKB: Math.round(blob.size / 1024),
      });
    };

    img.src = url;
  });
}

/**
 * Converts an uploaded image File into an MP3Picture suitable for ID3 APIC frame
 * Always normalizes to JPEG if not already a clean JPEG or PNG
 */
export async function convertImageFileToPicture(file: File): Promise<MP3Picture> {
  // If already standard JPEG or PNG, read directly
  if (file.type === 'image/jpeg' || file.type === 'image/png') {
    const buffer = await file.arrayBuffer();
    return createPictureFromBytes(new Uint8Array(buffer), file.type);
  }

  // Otherwise, draw onto a canvas to convert to image/jpeg
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas 2D context not available'));
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          async (blob) => {
            if (!blob) {
              reject(new Error('No se pudo convertir la imagen'));
              return;
            }
            const buf = await blob.arrayBuffer();
            const pic = await createPictureFromBytes(new Uint8Array(buf), 'image/jpeg');
            resolve(pic);
          },
          'image/jpeg',
          0.92
        );
      };
      img.onerror = () => reject(new Error('Error al cargar la imagen seleccionada'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo de imagen'));
    reader.readAsDataURL(file);
  });
}

/**
 * Reads ID3 metadata and duration from an MP3 File using jsmediatags
 */
export async function readMP3File(file: File): Promise<MP3FileItem> {
  const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
  const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const audioUrl = URL.createObjectURL(file);

  // Read audio duration in parallel
  const durationPromise = getAudioDuration(file);

  // Read ID3 tags
  const tagsPromise = new Promise<MP3Tags>((resolve) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (jsmediatags as any).read(file, {
      onSuccess: async (tagResult: any) => {
        const t = tagResult.tags || {};
        let picture: MP3Picture | null = null;

        if (t.picture && t.picture.data && t.picture.data.length > 0) {
          try {
            const byteArray = new Uint8Array(t.picture.data);
            const mime = t.picture.format || 'image/jpeg';
            picture = await createPictureFromBytes(byteArray, mime);
          } catch {
            picture = null;
          }
        }

        const commentText =
          typeof t.comment === 'object' && t.comment !== null
            ? t.comment.text || ''
            : typeof t.comment === 'string'
            ? t.comment
            : '';

        const lyricsText =
          t.USLT && typeof t.USLT === 'object'
            ? t.USLT.lyrics || t.USLT.text || ''
            : t.unsyncedLyrics
            ? String(t.unsyncedLyrics)
            : '';

        const tags: MP3Tags = {
          title: t.title ? String(t.title).trim() : fileNameWithoutExt,
          artist: t.artist ? String(t.artist).trim() : '',
          album: t.album ? String(t.album).trim() : '',
          albumArtist: t.TPE2 ? String(t.TPE2).trim() : '',
          year: t.year ? String(t.year).trim() : '',
          track: t.track ? String(t.track).trim() : '',
          genre: t.genre ? String(t.genre).trim() : '',
          comment: commentText.trim(),
          composer: t.TCOM ? String(t.TCOM).trim() : '',
          bpm: t.TBPM ? String(t.TBPM).trim() : '',
          lyrics: lyricsText.trim(),
          picture,
        };

        resolve(tags);
      },
      onError: () => {
        // Fallback to filename as title if no tags or error
        resolve(createEmptyTags(fileNameWithoutExt));
      },
    });
  });

  const [tags, duration] = await Promise.all([tagsPromise, durationPromise]);

  return {
    id,
    file,
    originalFileName: file.name,
    currentFileName: file.name,
    size: file.size,
    duration,
    status: 'loaded',
    tags,
    originalTags: { ...tags },
    audioUrl,
    hasChanges: false,
  };
}

/**
 * Writes ID3v2.3 tags to an MP3 array buffer and produces a Blob
 */
export async function writeID3Tags(originalBuffer: ArrayBuffer, tags: MP3Tags): Promise<Blob> {
  const writer = new ID3Writer(originalBuffer);

  // Title
  if (tags.title && tags.title.trim()) {
    writer.setFrame('TIT2', tags.title.trim());
  }

  // Artist (array)
  if (tags.artist && tags.artist.trim()) {
    writer.setFrame('TPE1', [tags.artist.trim()]);
  }

  // Album
  if (tags.album && tags.album.trim()) {
    writer.setFrame('TALB', tags.album.trim());
  }

  // Album Artist
  if (tags.albumArtist && tags.albumArtist.trim()) {
    writer.setFrame('TPE2', tags.albumArtist.trim());
  }

  // Year (number)
  if (tags.year && tags.year.trim()) {
    const yr = parseInt(tags.year.trim(), 10);
    if (!isNaN(yr) && yr > 0) {
      writer.setFrame('TYER', yr);
    }
  }

  // Track (string, e.g. "1" or "01/12")
  if (tags.track && tags.track.trim()) {
    writer.setFrame('TRCK', tags.track.trim());
  }

  // Genre (array)
  if (tags.genre && tags.genre.trim()) {
    writer.setFrame('TCON', [tags.genre.trim()]);
  }

  // Comment
  if (tags.comment && tags.comment.trim()) {
    writer.setFrame('COMM', {
      language: 'eng',
      description: '',
      text: tags.comment.trim(),
    });
  }

  // Composer (array)
  if (tags.composer && tags.composer.trim()) {
    writer.setFrame('TCOM', [tags.composer.trim()]);
  }

  // BPM (number)
  if (tags.bpm && tags.bpm.trim()) {
    const bpmVal = parseInt(tags.bpm.trim(), 10);
    if (!isNaN(bpmVal) && bpmVal > 0) {
      writer.setFrame('TBPM', bpmVal);
    }
  }

  // Lyrics (USLT)
  if (tags.lyrics && tags.lyrics.trim()) {
    writer.setFrame('USLT', {
      language: 'eng',
      description: '',
      lyrics: tags.lyrics.trim(),
    });
  }

  // Album Art / Picture (APIC)
  if (tags.picture && tags.picture.data) {
    writer.setFrame('APIC', {
      type: 3, // Front Cover
      data: tags.picture.data,
      description: 'Cover',
      useUnicodeEncoding: false,
    });
  }

  writer.addTag();
  return writer.getBlob();
}

/**
 * Strips ID3 tag completely from MP3 array buffer
 */
export function stripAllID3Tags(buffer: ArrayBuffer): Blob {
  const writer = new ID3Writer(buffer);
  writer.removeTag();
  // After removeTag the internal buffer is the audio without ID3 frames.
  // Prefer the public getBlob() API for consistency and type safety.
  return writer.getBlob();
}

/**
 * Parses tags from filename using a wildcard pattern
 * Supported tokens: %track%, %artist%, %title%, %album%, %year%, %genre%
 */
export function autoTagFromFilename(filename: string, pattern: string): Partial<MP3Tags> {
  const baseName = filename.replace(/\.[^/.]+$/, '').trim();
  const tokens = ['%track%', '%artist%', '%title%', '%album%', '%year%', '%genre%'];

  type StringTagKey = 'track' | 'artist' | 'title' | 'album' | 'year' | 'genre';
  let regexStr = pattern
    .replace(/%track%/gi, '%track%')
    .replace(/%artist%/gi, '%artist%')
    .replace(/%title%/gi, '%title%')
    .replace(/%album%/gi, '%album%')
    .replace(/%year%/gi, '%year%')
    .replace(/%genre%/gi, '%genre%');
  const tokenMatches: { token: string; key: StringTagKey }[] = [];

  const tokenMap: Record<string, StringTagKey> = {
    '%track%': 'track',
    '%artist%': 'artist',
    '%title%': 'title',
    '%album%': 'album',
    '%year%': 'year',
    '%genre%': 'genre',
  };

  // Replace tokens with placeholders
  tokens.forEach((t) => {
    if (regexStr.includes(t)) {
      tokenMatches.push({ token: t, key: tokenMap[t] });
    }
  });

  // Sort by order of appearance
  tokenMatches.sort((a, b) => regexStr.indexOf(a.token) - regexStr.indexOf(b.token));

  // Build regex
  let escapedPattern = regexStr.replace(/[-[\]{}()+?.,\\^$|#\s]/g, '\\$&');
  tokenMatches.forEach(({ token }) => {
    const escapedToken = token.replace(/[-[\]{}()+?.,\\^$|#\s]/g, '\\$&');
    escapedPattern = escapedPattern.replace(escapedToken, '(.+?)');
  });

  try {
    const regex = new RegExp(`^${escapedPattern}$`, 'i');
    const match = baseName.match(regex);

    if (!match) return {};

    const result: Partial<Record<StringTagKey, string>> = {};
    tokenMatches.forEach(({ key }, index) => {
      const val = match[index + 1];
      if (val) {
        result[key] = val.trim();
      }
    });

    return result as Partial<MP3Tags>;
  } catch {
    return {};
  }
}

/**
 * Checks whether all ID3 tags are completely empty
 */
export function isTagsEmpty(tags: MP3Tags): boolean {
  return (
    !tags.title?.trim() &&
    !tags.artist?.trim() &&
    !tags.album?.trim() &&
    !tags.albumArtist?.trim() &&
    !tags.year?.trim() &&
    !tags.track?.trim() &&
    !tags.genre?.trim() &&
    !tags.comment?.trim() &&
    !tags.composer?.trim() &&
    !tags.bpm?.trim() &&
    !tags.lyrics?.trim() &&
    !tags.picture
  );
}

/**
 * Generates a new filename from tags based on a template
 * Supported tokens: %track%, %artist%, %title%, %album%, %year%, %genre%
 */
export function renameFromTags(template: string, tags: MP3Tags, fallbackName: string): string {
  let result = template;
  const track = tags.track ? tags.track.split('/')[0].padStart(2, '0') : '';
  const artist = tags.artist || '';
  const title = tags.title || fallbackName.replace(/\.[^/.]+$/, '');
  const album = tags.album || '';
  const year = tags.year || '';
  const genre = tags.genre || '';

  result = result.replace(/%track%/gi, track);
  result = result.replace(/%artist%/gi, artist);
  result = result.replace(/%title%/gi, title);
  result = result.replace(/%album%/gi, album);
  result = result.replace(/%year%/gi, year);
  result = result.replace(/%genre%/gi, genre);

  // Clean empty separators (e.g. " -  - " or leading " - ")
  result = result.replace(/^[\s\-_.]+/, '').replace(/[\s\-_.]+$/, '');
  result = result.replace(/\s*-\s*-\s*/g, ' - ');

  if (!result.trim()) {
    result = fallbackName.replace(/\.[^/.]+$/, '');
  }

  const clean = sanitizeFilename(result);
  return clean.toLowerCase().endsWith('.mp3') ? clean : `${clean}.mp3`;
}

/**
 * Cleans tags based on user selection
 */
export function applyCleanOptionsToTags(tags: MP3Tags, options: CleanTagsOptions): MP3Tags {
  if (options.removeAll) {
    return createEmptyTags('');
  }

  return {
    ...tags,
    picture: options.removeCover ? null : tags.picture,
    comment: options.removeComments ? '' : tags.comment,
    lyrics: options.removeLyrics ? '' : tags.lyrics,
    composer: options.removeComposer ? '' : tags.composer,
    bpm: options.removeBpm ? '' : tags.bpm,
  };
}
