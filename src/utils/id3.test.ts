import { describe, it, expect } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { writeID3Tags, stripAllID3Tags, createEmptyTags, renameFromTags } from './id3';
import { getID3v2Length } from './id3v24';
import { sanitizeFilename } from './formatters';
import type { MP3Tags } from '../types/mp3';

/** Audio sintético: frames MPEG-1 Layer III (cabecera FF FB 90 00 + relleno) */
function fakeAudio(frames = 20): Uint8Array {
  const frame = new Uint8Array(417);
  frame.set([0xff, 0xfb, 0x90, 0x00]);
  const out = new Uint8Array(frame.length * frames);
  for (let i = 0; i < frames; i++) out.set(frame, i * frame.length);
  return out;
}

// PNG mínimo válido de 1×1
const PNG = Uint8Array.from(
  atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='),
  (c) => c.charCodeAt(0)
);

const tags: MP3Tags = {
  ...createEmptyTags(),
  title: 'Canción de prueba ñ 日本語 🎵',
  artist: 'Solar Echoes',
  album: 'Neón Odyssey',
  albumArtist: 'Various Artists',
  year: '2026',
  track: '03/12',
  genre: 'Electronic',
  comment: 'Comentario de prueba',
  composer: 'Aitor Sánchez',
  bpm: '128',
  lyrics: 'Línea uno\nLínea dos',
  picture: { mime: 'image/png', data: PNG.buffer.slice(0) as ArrayBuffer, url: 'blob:test' },
};

const audio = fakeAudio();
const toAB = (u: Uint8Array) => u.buffer.slice(u.byteOffset, u.byteOffset + u.byteLength) as ArrayBuffer;
const bytesOf = async (b: Blob) => new Uint8Array(await b.arrayBuffer());
const equal = (a: Uint8Array, b: Uint8Array) => a.length === b.length && a.every((v, i) => v === b[i]);

describe('ID3v2.4 writer', () => {
  it('escribe una cabecera v2.4 válida y conserva el audio intacto', async () => {
    const out = await bytesOf(await writeID3Tags(toAB(audio), tags, '2.4'));
    expect(String.fromCharCode(out[0], out[1], out[2])).toBe('ID3');
    expect(out[3]).toBe(4);
    expect(out[4]).toBe(0);
    const len = getID3v2Length(out);
    expect(len).toBeGreaterThan(10);
    expect(equal(out.subarray(len), audio)).toBe(true);
  });

  it('usa los marcos de v2.4 (TDRC, no TYER) con texto UTF-8', async () => {
    const out = await bytesOf(await writeID3Tags(toAB(audio), tags, '2.4'));
    const text = new TextDecoder('latin1').decode(out.subarray(0, getID3v2Length(out)));
    for (const id of ['TIT2', 'TPE1', 'TALB', 'TPE2', 'TDRC', 'TRCK', 'TCON', 'TCOM', 'TBPM', 'COMM', 'USLT', 'APIC']) {
      expect(text).toContain(id);
    }
    expect(text).not.toContain('TYER');
    // El título UTF-8 aparece como bytes UTF-8 (no UTF-16)
    const utf8 = new TextEncoder().encode('Canción de prueba ñ 日本語 🎵');
    const hay = Array.from(out).join(',');
    expect(hay).toContain(Array.from(utf8).join(','));
  });

  it('reemplaza una etiqueta v2.3 previa sin duplicarla', async () => {
    const v23 = await bytesOf(await writeID3Tags(toAB(audio), tags, '2.3'));
    expect(v23[3]).toBe(3);
    const v24 = await bytesOf(await writeID3Tags(toAB(v23), tags, '2.4'));
    expect(v24[3]).toBe(4);
    const len = getID3v2Length(v24);
    expect(equal(v24.subarray(len), audio)).toBe(true);
  });

  it('stripAllID3Tags devuelve el audio original (v2.3 y v2.4)', async () => {
    for (const version of ['2.3', '2.4'] as const) {
      const tagged = await bytesOf(await writeID3Tags(toAB(audio), tags, version));
      const clean = await bytesOf(stripAllID3Tags(toAB(tagged)));
      expect(equal(clean, audio)).toBe(true);
    }
  });

  it('un archivo sin etiquetas se mantiene igual al hacer strip', async () => {
    expect(equal(await bytesOf(stripAllID3Tags(toAB(audio))), audio)).toBe(true);
  });

  it('exporta fixtures para validar con mutagen (si ID3_OUT_DIR está definido)', async () => {
    const dir = process.env.ID3_OUT_DIR;
    if (!dir) return;
    mkdirSync(dir, { recursive: true });
    writeFileSync(`${dir}/v24.mp3`, await bytesOf(await writeID3Tags(toAB(audio), tags, '2.4')));
    writeFileSync(`${dir}/v23.mp3`, await bytesOf(await writeID3Tags(toAB(audio), tags, '2.3')));
  });
});

describe('utilidades de nombres', () => {
  it('sanitizeFilename elimina caracteres peligrosos', () => {
    expect(sanitizeFilename('../../etc/passwd')).toBe('_.._etc_passwd');
    expect(sanitizeFilename('..')).toBe('');
    expect(sanitizeFilename('a<b>c:d.mp3')).toBe('a_b_c_d.mp3');
    expect(sanitizeFilename('CON.mp3')).toBe('_CON.mp3');
    expect(sanitizeFilename('x'.repeat(500)).length).toBe(200);
  });

  it('renameFromTags construye el nombre desde las etiquetas', () => {
    expect(renameFromTags('%track% - %artist% - %title%', { ...createEmptyTags('T'), artist: 'A', track: '3/12' }, 'f.mp3')).toBe(
      '03 - A - T.mp3'
    );
  });
});
