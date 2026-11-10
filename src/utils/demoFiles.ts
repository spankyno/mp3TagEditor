import { ID3Writer } from 'browser-id3-writer';
import type { MP3FileItem, MP3Tags, MP3Picture } from '../types/mp3';
import { createPictureFromBytes } from './id3';

/**
 * Creates a synthetic silent/tone MP3 array buffer of given duration in seconds
 * Uses valid MPEG-1 Layer 3 frames (128 kbps, 44.1 kHz)
 */
function createSyntheticMP3Buffer(durationSeconds = 8): ArrayBuffer {
  const frameSize = 417; // 144 * 128000 / 44100
  const framesPerSec = 38; // 44100 / 1152 ≈ 38.28 frames per sec
  const totalFrames = Math.max(20, Math.floor(durationSeconds * framesPerSec));
  const mp3Data = new Uint8Array(frameSize * totalFrames);

  const header = [0xff, 0xfb, 0x90, 0x00];
  for (let i = 0; i < totalFrames; i++) {
    const offset = i * frameSize;
    mp3Data.set(header, offset);
  }

  return mp3Data.buffer;
}

/**
 * Creates a demo album art using Canvas and returns MP3Picture
 */
async function generateDemoCoverArt(
  title: string,
  artist: string,
  bgColor1: string,
  bgColor2: string
): Promise<MP3Picture | null> {
  if (typeof document === 'undefined') return null;

  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Gradient background
  const grad = ctx.createLinearGradient(0, 0, 600, 600);
  grad.addColorStop(0, bgColor1);
  grad.addColorStop(1, bgColor2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 600, 600);

  // Modern geometric design lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(300, 300, 200, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(300, 300, 140, 0, Math.PI * 2);
  ctx.stroke();

  // Central circle
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.beginPath();
  ctx.arc(300, 300, 60, 0, Math.PI * 2);
  ctx.fill();

  // Vinyl spindle hole
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(300, 300, 16, 0, Math.PI * 2);
  ctx.fill();

  // Typography
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, 300, 110);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '500 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(artist, 300, 520);

  return new Promise<MP3Picture | null>((resolve) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        const buf = await blob.arrayBuffer();
        const pic = await createPictureFromBytes(new Uint8Array(buf), 'image/jpeg');
        resolve(pic);
      },
      'image/jpeg',
      0.9
    );
  });
}

/**
 * Generates 3 rich sample MP3 file items with realistic metadata and covers
 */
export async function createDemoTracks(): Promise<MP3FileItem[]> {
  const demos = [
    {
      fileName: '01 - Solar Echoes - Midnight Drive.mp3',
      title: 'Midnight Drive',
      artist: 'Solar Echoes',
      album: 'Neon Odyssey',
      albumArtist: 'Solar Echoes',
      year: '2026',
      track: '01/10',
      genre: 'Synthwave',
      comment: 'Grabado en Sunset Studio · Masterizado a 24-bit',
      composer: 'Aitor Sánchez & Alex Vance',
      bpm: '124',
      lyrics: '[Verse 1]\nCity lights fade in the rear view\nChasing the neon horizon\nSynthesizers fill the midnight air\n\n[Chorus]\nOn this midnight drive\nWe feel truly alive...',
      color1: '#4338ca',
      color2: '#06b6d4',
      duration: 184, // 3:04
    },
    {
      fileName: '02 - Luna y Marea - Brisa Costera.mp3',
      title: 'Brisa Costera',
      artist: 'Luna y Marea',
      album: 'Atlántico Acústico',
      albumArtist: 'Luna y Marea',
      year: '2025',
      track: '02/08',
      genre: 'Flamenco',
      comment: 'Guitarra española y cajón en directo',
      composer: 'Aitor Sánchez Gutiérrez',
      bpm: '98',
      lyrics: '[Copla]\nEl mar susurra su calma\nBajo la luz plateada\nCuerdas de palo santo\nAlivio para el alma...',
      color1: '#c2410c',
      color2: '#f59e0b',
      duration: 215, // 3:35
    },
    {
      fileName: '03 - Cyberpunk Dreams - Quantum Pulse.mp3',
      title: 'Quantum Pulse',
      artist: 'Cyberpunk Dreams',
      album: 'Sublevel 404',
      albumArtist: 'Various Artists',
      year: '2026',
      track: '03/12',
      genre: 'Electronic',
      comment: 'Bajo analógico Moog y secuenciadores modulares',
      composer: 'Marcus Wright',
      bpm: '138',
      lyrics: 'Instrumental track',
      color1: '#047857',
      color2: '#0e7490',
      duration: 152, // 2:32
    },
  ];

  const results: MP3FileItem[] = [];

  for (const demo of demos) {
    const rawBuffer = createSyntheticMP3Buffer(10);
    const cover = await generateDemoCoverArt(demo.album, demo.artist, demo.color1, demo.color2);

    const tags: MP3Tags = {
      title: demo.title,
      artist: demo.artist,
      album: demo.album,
      albumArtist: demo.albumArtist,
      year: demo.year,
      track: demo.track,
      genre: demo.genre,
      comment: demo.comment,
      composer: demo.composer,
      bpm: demo.bpm,
      lyrics: demo.lyrics,
      picture: cover,
    };

    // Tag the buffer with ID3Writer
    const writer = new ID3Writer(rawBuffer);
    writer.setFrame('TIT2', tags.title);
    writer.setFrame('TPE1', [tags.artist]);
    writer.setFrame('TALB', tags.album);
    writer.setFrame('TPE2', tags.albumArtist);
    writer.setFrame('TYER', parseInt(tags.year, 10));
    writer.setFrame('TRCK', tags.track);
    writer.setFrame('TCON', [tags.genre]);
    writer.setFrame('COMM', { language: 'eng', description: '', text: tags.comment });
    writer.setFrame('TCOM', [tags.composer]);
    writer.setFrame('TBPM', parseInt(tags.bpm, 10));
    writer.setFrame('USLT', { language: 'eng', description: '', lyrics: tags.lyrics });

    if (cover && cover.data) {
      writer.setFrame('APIC', {
        type: 3,
        data: cover.data,
        description: 'Cover',
        useUnicodeEncoding: false,
      });
    }

    writer.addTag();
    const taggedBlob = writer.getBlob();
    const file = new File([taggedBlob], demo.fileName, { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(file);

    results.push({
      id: `demo-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      file,
      originalFileName: demo.fileName,
      currentFileName: demo.fileName,
      size: file.size,
      duration: demo.duration,
      status: 'loaded',
      tags: { ...tags },
      originalTags: { ...tags },
      audioUrl,
      hasChanges: false,
    });
  }

  return results;
}
