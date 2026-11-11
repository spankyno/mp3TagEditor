// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, act, cleanup } from '@testing-library/react';
import axe from 'axe-core';
import type { MP3FileItem } from './types/mp3';
import { I18nProvider, type Lang } from './i18n';

vi.mock('./utils/id3', async (importOriginal) => {
  const original = await importOriginal<typeof import('./utils/id3')>();
  let n = 0;
  return {
    ...original,
    readMP3File: vi.fn(async (file: File): Promise<MP3FileItem> => {
      const tags = { ...original.createEmptyTags(), title: file.name.replace(/\.mp3$/, ''), artist: 'Artista', album: 'Álbum' };
      n++;
      return {
        id: `id-${n}`, file, originalFileName: file.name, currentFileName: file.name, size: 1000, duration: 60,
        status: 'loaded', tags, originalTags: { ...tags }, audioUrl: `blob:audio/${n}`, hasChanges: false,
      };
    }),
  };
});

import App from './App';

afterEach(() => cleanup());

const wrap = (lang: Lang) => (
  <I18nProvider lang={lang}>
    <App />
  </I18nProvider>
);

// El contraste de color requiere layout/CSS reales (no existen en jsdom): se revisó aparte por cálculo
const OPTIONS: axe.RunOptions = {
  rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
};

async function audit(container: HTMLElement) {
  const results = await axe.run(container, OPTIONS);
  return results.violations.map((v) => `${v.id}: ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).join(' | ')}`);
}

const mp3 = (name: string) => new File([new Uint8Array(10)], name, { type: 'audio/mpeg' });

describe('auditoría axe-core (reglas WCAG 2.x A/AA)', () => {
  for (const lang of ['es', 'en'] as const) {
    it(`pantalla inicial (${lang}) sin violaciones`, async () => {
      document.documentElement.lang = lang;
      const { container } = render(wrap(lang));
      expect(await audit(container)).toEqual([]);
    });
  }

  it('editor con pistas cargadas sin violaciones', async () => {
    document.documentElement.lang = 'es';
    const { container } = render(wrap('es'));
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [mp3('a.mp3'), mp3('b.mp3')] } });
    });
    await screen.findByLabelText('Título (TIT2)');
    expect(await audit(container)).toEqual([]);
  });

  for (const [name, label] of [
    ['limpieza', /Limpiar/],
    ['renombrado', /Renombrar/],
    ['auto-relleno', /Auto-rellenar/],
  ] as const) {
    it(`modal de ${name} sin violaciones`, async () => {
      document.documentElement.lang = 'es';
      const { container } = render(wrap('es'));
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      await act(async () => {
        fireEvent.change(input, { target: { files: [mp3('a - b.mp3')] } });
      });
      await screen.findByLabelText('Título (TIT2)');
      fireEvent.click(screen.getAllByRole('button', { name: label })[0]);
      await screen.findByRole('dialog');
      expect(await audit(document.body)).toEqual([]);
      void container;
    });
  }

  it('vista "Acerca de" sin violaciones', async () => {
    document.documentElement.lang = 'es';
    const { container } = render(wrap('es'));
    fireEvent.click(screen.getAllByRole('button', { name: 'Acerca de' })[0]);
    await screen.findByText(/Compromiso de Privacidad/);
    expect(await audit(container)).toEqual([]);
  });
});
