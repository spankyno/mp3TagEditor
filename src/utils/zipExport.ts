import JSZip from 'jszip';
import type { MP3FileItem } from '../types/mp3';
import { writeID3Tags, stripAllID3Tags, isTagsEmpty } from './id3';

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
export async function saveAndDownloadSingleFile(item: MP3FileItem): Promise<void> {
  const buffer = await item.file.arrayBuffer();
  const taggedBlob = isTagsEmpty(item.tags)
    ? stripAllID3Tags(buffer)
    : await writeID3Tags(buffer, item.tags);
  downloadBlob(taggedBlob, item.currentFileName);
}

/**
 * Exports multiple MP3 files into a single ZIP archive client-side
 */
export async function exportFilesToZip(
  items: MP3FileItem[],
  onProgress?: (current: number, total: number, currentName: string) => void
): Promise<void> {
  const zip = new JSZip();
  const total = items.length;

  for (let i = 0; i < total; i++) {
    const item = items[i];
    if (onProgress) {
      onProgress(i + 1, total, item.currentFileName);
    }

    try {
      const buffer = await item.file.arrayBuffer();
      // Generate updated ID3 buffer or strip if empty
      const blob = isTagsEmpty(item.tags)
        ? stripAllID3Tags(buffer)
        : await writeID3Tags(buffer, item.tags);
      const taggedBuffer = await blob.arrayBuffer();
      zip.file(item.currentFileName, taggedBuffer);
    } catch {
      // Fallback: add original file buffer if tagging fails
      const fallbackBuffer = await item.file.arrayBuffer();
      zip.file(item.currentFileName, fallbackBuffer);
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
        onProgress(total, total, 'Finalizando archivo ZIP...');
      }
    }
  );

  const timestamp = new Date().toISOString().slice(0, 10);
  downloadBlob(zipBlob, `mp3-etiquetas-editadas-${timestamp}.zip`);
}
