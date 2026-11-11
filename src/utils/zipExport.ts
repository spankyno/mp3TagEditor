import type { MP3FileItem, ID3Version } from '../types/mp3';
import { writeID3Tags, stripAllID3Tags, isTagsEmpty } from './id3';
import { sanitizeFilename } from './formatters';

/**
 * Devuelve un nombre seguro y único dentro del ZIP (evita sobrescrituras por duplicados)
 */
function uniqueZipName(rawName: string, used: Set<string>): string {
  const safe = sanitizeFilename(rawName) || 'pista.mp3';
  const dot = safe.lastIndexOf('.');
  const base = dot > 0 ? safe.slice(0, dot) : safe;
  const ext = dot > 0 ? safe.slice(dot) : '';
  let candidate = safe;
  let n = 1;
  while (used.has(candidate.toLowerCase())) {
    candidate = `${base} (${n++})${ext}`;
  }
  used.add(candidate.toLowerCase());
  return candidate;
}

/**
 * Downloads a single Blob with the specified filename in the browser
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Saves a single MP3 file with all its current tags and current filename
 */
export async function saveAndDownloadSingleFile(
  item: MP3FileItem,
  version: ID3Version = '2.3'
): Promise<void> {
  const buffer = await item.file.arrayBuffer();
  const taggedBlob = isTagsEmpty(item.tags)
    ? stripAllID3Tags(buffer)
    : await writeID3Tags(buffer, item.tags, version);
  downloadBlob(taggedBlob, item.currentFileName);
}

/**
 * Exports multiple MP3 files into a single ZIP archive client-side
 */
export async function exportFilesToZip(
  items: MP3FileItem[],
  version: ID3Version,
  onProgress?: (current: number, total: number, currentName: string) => void
): Promise<void> {
  // JSZip se carga bajo demanda: solo pesa cuando el usuario exporta un ZIP
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const total = items.length;
  const usedNames = new Set<string>();

  for (let i = 0; i < total; i++) {
    const item = items[i];
    if (onProgress) {
      onProgress(i + 1, total, item.currentFileName);
    }

    const zipName = uniqueZipName(item.currentFileName, usedNames);

    try {
      const buffer = await item.file.arrayBuffer();
      // Generate updated ID3 buffer or strip if empty
      const blob = isTagsEmpty(item.tags)
        ? stripAllID3Tags(buffer)
        : await writeID3Tags(buffer, item.tags, version);
      const taggedBuffer = await blob.arrayBuffer();
      zip.file(zipName, taggedBuffer);
    } catch {
      // Fallback: add original file buffer if tagging fails
      const fallbackBuffer = await item.file.arrayBuffer();
      zip.file(zipName, fallbackBuffer);
    }
  }

  // Generate zip archive
  const zipBlob = await zip.generateAsync(
    {
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    },
    (metadata) => {
      if (onProgress && metadata.percent === 100) {
        onProgress(total, total, ''); // nombre vacío = fase final (la interfaz muestra el texto traducido)
      }
    }
  );

  const timestamp = new Date().toISOString().slice(0, 10);
  downloadBlob(zipBlob, `mp3-etiquetas-editadas-${timestamp}.zip`);
}
