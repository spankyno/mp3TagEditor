import type { MP3Tags } from '../types/mp3';

/**
 * Escritor ID3v2.4 mínimo y sin dependencias.
 *
 * `browser-id3-writer` solo genera ID3v2.3, así que la versión 2.4 se escribe aquí:
 *  - Texto en UTF-8 (encoding byte 0x03), válido solo en ID3v2.4.
 *  - Tamaños de marco "syncsafe" (en v2.3 son enteros normales).
 *  - El año va en TDRC (en v2.3 era TYER).
 */

const encoder = new TextEncoder();

/** Tamaño máximo representable en un entero syncsafe de 28 bits */
const MAX_SYNCSAFE = 0x0fffffff;

function syncsafe(n: number): Uint8Array {
  if (n < 0 || n > MAX_SYNCSAFE) {
    throw new Error('Etiqueta ID3 demasiado grande');
  }
  return new Uint8Array([(n >>> 21) & 0x7f, (n >>> 14) & 0x7f, (n >>> 7) & 0x7f, n & 0x7f]);
}

function readSyncsafe(b: Uint8Array, offset: number): number | null {
  for (let i = 0; i < 4; i++) {
    if (b[offset + i] & 0x80) return null; // no es syncsafe → cabecera inválida
  }
  return (b[offset] << 21) | (b[offset + 1] << 14) | (b[offset + 2] << 7) | b[offset + 3];
}

/**
 * Devuelve la longitud total (cabecera + marcos + padding + pie) de una etiqueta ID3v2
 * situada al principio del archivo, o 0 si no hay ninguna válida.
 */
export function getID3v2Length(bytes: Uint8Array): number {
  if (bytes.length < 10) return 0;
  if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) return 0; // "ID3"
  if (bytes[3] === 0xff || bytes[4] === 0xff) return 0;
  const size = readSyncsafe(bytes, 6);
  if (size === null) return 0;
  const hasFooter = bytes[3] === 4 && (bytes[5] & 0x10) !== 0;
  const total = 10 + size + (hasFooter ? 10 : 0);
  return total <= bytes.length ? total : 0;
}

/** Elimina la etiqueta ID3v2 inicial (cualquier versión) y devuelve solo el audio */
export function stripID3v2(buffer: ArrayBuffer): Uint8Array {
  const bytes = new Uint8Array(buffer);
  return bytes.subarray(getID3v2Length(bytes));
}

function concat(chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, c) => sum + c.length, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.length;
  }
  return out;
}

function frame(id: string, body: Uint8Array): Uint8Array {
  return concat([encoder.encode(id), syncsafe(body.length), new Uint8Array([0, 0]), body]);
}

/** Marco de texto: [encoding=3][texto UTF-8] */
function textFrame(id: string, text: string): Uint8Array {
  return frame(id, concat([new Uint8Array([3]), encoder.encode(text)]));
}

/** COMM / USLT: [encoding][idioma(3)][descripción\0][texto] */
function langTextFrame(id: 'COMM' | 'USLT', text: string): Uint8Array {
  return frame(
    id,
    concat([
      new Uint8Array([3]),
      encoder.encode('eng'),
      new Uint8Array([0]), // descripción vacía + terminador
      encoder.encode(text),
    ])
  );
}

/** APIC: [encoding][mime\0][tipo][descripción\0][datos] */
function pictureFrame(mime: string, data: ArrayBuffer): Uint8Array {
  return frame(
    'APIC',
    concat([
      new Uint8Array([3]),
      encoder.encode(mime),
      new Uint8Array([0]),
      new Uint8Array([3]), // 3 = Front cover
      encoder.encode('Cover'),
      new Uint8Array([0]),
      new Uint8Array(data),
    ])
  );
}

/** Construye los bytes de una etiqueta ID3v2.4 completa a partir de las etiquetas de la app */
export function buildID3v24Tag(tags: MP3Tags): Uint8Array {
  const frames: Uint8Array[] = [];
  const clean = (v: string | undefined) => (v ?? '').trim();

  if (clean(tags.title)) frames.push(textFrame('TIT2', clean(tags.title)));
  if (clean(tags.artist)) frames.push(textFrame('TPE1', clean(tags.artist)));
  if (clean(tags.album)) frames.push(textFrame('TALB', clean(tags.album)));
  if (clean(tags.albumArtist)) frames.push(textFrame('TPE2', clean(tags.albumArtist)));

  if (clean(tags.year)) {
    const yr = parseInt(clean(tags.year), 10);
    if (!isNaN(yr) && yr > 0 && yr <= 9999) {
      frames.push(textFrame('TDRC', String(yr).padStart(4, '0')));
    }
  }

  if (clean(tags.track)) frames.push(textFrame('TRCK', clean(tags.track)));
  if (clean(tags.genre)) frames.push(textFrame('TCON', clean(tags.genre)));
  if (clean(tags.composer)) frames.push(textFrame('TCOM', clean(tags.composer)));

  if (clean(tags.bpm)) {
    const bpm = parseInt(clean(tags.bpm), 10);
    if (!isNaN(bpm) && bpm > 0) frames.push(textFrame('TBPM', String(bpm)));
  }

  if (clean(tags.comment)) frames.push(langTextFrame('COMM', clean(tags.comment)));
  if (clean(tags.lyrics)) frames.push(langTextFrame('USLT', clean(tags.lyrics)));

  if (tags.picture && tags.picture.data && tags.picture.data.byteLength > 0) {
    frames.push(pictureFrame(tags.picture.mime || 'image/jpeg', tags.picture.data));
  }

  const body = concat(frames);
  const header = concat([
    new Uint8Array([0x49, 0x44, 0x33, 0x04, 0x00, 0x00]), // "ID3" v2.4.0, sin flags
    syncsafe(body.length),
  ]);
  return concat([header, body]);
}

/** Sustituye la etiqueta ID3v2 del MP3 por una nueva ID3v2.4 */
export function writeID3v24(originalBuffer: ArrayBuffer, tags: MP3Tags): Blob {
  const tag = buildID3v24Tag(tags);
  const audio = stripID3v2(originalBuffer);
  // Copia a un ArrayBuffer estándar para que Blob lo acepte con cualquier tipo de lib
  const out = concat([tag, audio]);
  return new Blob([out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength) as ArrayBuffer], {
    type: 'audio/mpeg',
  });
}
