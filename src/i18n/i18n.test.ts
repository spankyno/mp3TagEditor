import { describe, it, expect } from 'vitest';
import { es } from './es';
import { en } from './en';
import { seoContent } from './seo';

const placeholders = (s: string) => (s.match(/\{\w+\}/g) ?? []).sort().join(',');

describe('i18n', () => {
  it('es y en tienen exactamente las mismas claves', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(es).sort());
  });

  it('las variables {x} coinciden entre idiomas', () => {
    for (const key of Object.keys(es) as (keyof typeof es)[]) {
      expect(placeholders(en[key]), key).toBe(placeholders(es[key]));
    }
  });

  it('cada plural tiene variante _one y _other', () => {
    for (const key of Object.keys(es)) {
      if (key.endsWith('_one')) expect(es, key).toHaveProperty(key.replace(/_one$/, '_other'));
    }
  });

  it('ninguna traducción está vacía', () => {
    for (const dict of [es, en]) for (const [k, v] of Object.entries(dict)) expect(v.trim(), k).not.toBe('');
  });

  it('el contenido SEO tiene la misma estructura en ambos idiomas', () => {
    expect(seoContent.en.faq.length).toBe(seoContent.es.faq.length);
    expect(seoContent.en.steps.length).toBe(seoContent.es.steps.length);
    expect(seoContent.en.features.length).toBe(seoContent.es.features.length);
  });
});
