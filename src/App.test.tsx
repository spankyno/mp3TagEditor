// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { hydrateRoot } from 'react-dom/client';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import type { MP3FileItem } from './types/mp3';
import { I18nProvider, type Lang } from './i18n';

// readMP3File se sustituye por una versión síncrona (jsdom no decodifica audio)
vi.mock('./utils/id3', async (importOriginal) => {
  const original = await importOriginal<typeof import('./utils/id3')>();
  let n = 0;
  return {
    ...original,
    readMP3File: vi.fn(async (file: File): Promise<MP3FileItem> => {
      const tags = { ...original.createEmptyTags(), title: file.name.replace(/\.mp3$/, ''), artist: 'Artista' };
      ++n;
      return {
        id: `id-${n}`,
        file,
        originalFileName: file.name,
        currentFileName: file.name,
        size: file.size,
        duration: 60,
        status: 'loaded',
        tags,
        originalTags: { ...tags },
        audioUrl: `blob:audio/${n}`,
        hasChanges: false,
      };
    }),
  };
});

import App from './App';

const mp3 = (name: string) => new File([new Uint8Array(10)], name, { type: 'audio/mpeg' });

const wrap = (lang: Lang) => (
  <I18nProvider lang={lang}>
    <App />
  </I18nProvider>
);

beforeEach(() => {
  document.documentElement.lang = 'es';
  localStorage.clear();
});
afterEach(() => cleanup());

describe('hidratación (SSR → cliente)', () => {
  for (const lang of ['es', 'en'] as const) {
    it(`no produce avisos de hidratación en ${lang}`, async () => {
      const errors: string[] = [];
      const spy = vi.spyOn(console, 'error').mockImplementation((...args) => {
        errors.push(args.map(String).join(' '));
      });

      const container = document.createElement('div');
      document.body.appendChild(container);
      container.innerHTML = renderToString(wrap(lang));
      expect(container.querySelector('h1')).not.toBeNull();

      let root!: ReturnType<typeof hydrateRoot>;
      await act(async () => {
        root = hydrateRoot(container, wrap(lang));
      });
      await act(async () => root.unmount());
      container.remove();

      spy.mockRestore();
      expect(errors.filter((e) => /hydrat|did not match|mismatch/i.test(e))).toEqual([]);
    });
  }

  it('el HTML prerenderizado contiene H1, FAQ y navegación accesible', () => {
    const html = renderToString(wrap('en'));
    expect(html).toContain('Online MP3 Tag Editor');
    expect(html).toContain('Frequently asked questions');
    expect(html).toContain('href="#main-content"'); // enlace "saltar al contenido"
    expect(html).toContain('aria-live="polite"'); // región de avisos siempre presente
  });
});

describe('edición con historial (deshacer / rehacer)', () => {
  async function loadOne() {
    render(wrap('es'));
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [mp3('a.mp3')] } });
    });
    return screen.findByLabelText('Título (TIT2)');
  }

  it('deshace y rehace un cambio de título (pulsaciones seguidas = un solo paso)', async () => {
    const title = (await loadOne()) as HTMLInputElement;
    expect(title.value).toBe('a');

    // Varias "pulsaciones" seguidas sobre el mismo campo → un único paso de historial
    for (const v of ['N', 'Nu', 'Nue', 'Nuev', 'Nuevo']) {
      fireEvent.change(title, { target: { value: v } });
    }
    expect((screen.getByLabelText('Título (TIT2)') as HTMLInputElement).value).toBe('Nuevo');

    // Con el foco en el campo, Ctrl+Z es el deshacer nativo del navegador (no lo interceptamos)
    fireEvent.click(screen.getByRole('button', { name: 'Deshacer' }));
    await waitFor(() =>
      expect((screen.getByLabelText('Título (TIT2)') as HTMLInputElement).value).toBe('a')
    );
    // (queda el paso de "añadir pistas": las 5 pulsaciones fueron un único paso)
    expect(screen.getByRole('button', { name: 'Rehacer' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Rehacer' }));
    await waitFor(() =>
      expect((screen.getByLabelText('Título (TIT2)') as HTMLInputElement).value).toBe('Nuevo')
    );
    expect(screen.getByRole('button', { name: 'Rehacer' })).toBeDisabled();
  });

  it('el atajo Ctrl+Z funciona fuera de los campos de texto', async () => {
    const title = (await loadOne()) as HTMLInputElement;
    fireEvent.change(title, { target: { value: 'Otro' } });

    (document.activeElement as HTMLElement | null)?.blur?.();
    fireEvent.keyDown(document.body, { key: 'z', ctrlKey: true });
    await waitFor(() =>
      expect((screen.getByLabelText('Título (TIT2)') as HTMLInputElement).value).toBe('a')
    );

    fireEvent.keyDown(document.body, { key: 'z', ctrlKey: true, shiftKey: true });
    await waitFor(() =>
      expect((screen.getByLabelText('Título (TIT2)') as HTMLInputElement).value).toBe('Otro')
    );
  });

  it('eliminar una pista se puede deshacer', async () => {
    await loadOne();
    fireEvent.click(screen.getByRole('button', { name: /Quitar de la lista/ }));
    await waitFor(() => expect(screen.queryByLabelText('Título (TIT2)')).toBeNull());
    fireEvent.click(screen.getByRole('button', { name: /Deshacer: eliminar pista/ }));
    // la pista vuelve a la lista
    await waitFor(() => expect(screen.getAllByText('a').length).toBeGreaterThan(0));
  });

  it('permite elegir ID3v2.4 y recuerda la preferencia', async () => {
    await loadOne();
    const select = screen.getByLabelText('Versión ID3') as HTMLSelectElement;
    expect(select.value).toBe('2.3');
    fireEvent.change(select, { target: { value: '2.4' } });
    expect(localStorage.getItem('id3version')).toBe('2.4');
  });
});

describe('accesibilidad de la tabla', () => {
  it('las casillas y botones de fila tienen nombre accesible y se operan con teclado', async () => {
    render(wrap('es'));
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [mp3('a.mp3'), mp3('b.mp3')] } });
    });
    await screen.findByLabelText('Título (TIT2)');

    const boxes = screen.getAllByRole('checkbox');
    expect(boxes.length).toBeGreaterThanOrEqual(3); // "todas" + 1 por pista
    for (const b of boxes) expect(b).toHaveAccessibleName();
    expect(screen.getAllByRole('button', { name: /Reproducir/ }).length).toBe(2);
    expect(screen.getAllByRole('columnheader', { name: /Título/ })[0]).toHaveAttribute('aria-sort');

    // seleccionar la 2.ª pista con la casilla (alternar) mantiene la 1.ª
    const track2 = screen.getByRole('checkbox', { name: 'Seleccionar b' });
    fireEvent.click(track2);
    expect(track2).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('checkbox', { name: 'Seleccionar a' })).toHaveAttribute('aria-checked', 'true');
  });
});

describe('modales', () => {
  it('abre con role=dialog, mueve el foco dentro, se cierra con Esc y devuelve el foco', async () => {
    render(wrap('es'));
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [mp3('a.mp3')] } });
    });
    await screen.findByLabelText('Título (TIT2)');

    const opener = screen.getByRole('button', { name: /Limpiar/ });
    opener.focus();
    fireEvent.click(opener);

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAccessibleName('Limpieza de etiquetas ID3');
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(document.activeElement).toBe(opener);
  });
});
