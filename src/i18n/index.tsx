import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { es } from './es';
import { en } from './en';

export type Lang = 'es' | 'en';
export type MessageKey = keyof typeof es;

/** Claves con variantes `_one` / `_other` (plurales) → nombre base sin sufijo */
export type PluralBase = Extract<MessageKey, `${string}_one`> extends `${infer B}_one` ? B : never;

type Vars = Record<string, string | number>;

const dictionaries: Record<Lang, Record<MessageKey, string>> = { es, en };

function interpolate(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    name in vars ? String(vars[name]) : `{${name}}`
  );
}

export function translate(lang: Lang, key: MessageKey, vars?: Vars): string {
  return interpolate(dictionaries[lang][key] ?? es[key] ?? key, vars);
}

export function translatePlural(lang: Lang, base: PluralBase, count: number, vars?: Vars): string {
  const key = `${base}_${count === 1 ? 'one' : 'other'}` as MessageKey;
  return translate(lang, key, { count, ...vars });
}

/** Idioma de la página actual según el atributo lang del <html> (es | en) */
export function detectLang(): Lang {
  if (typeof document === 'undefined') return 'es';
  return document.documentElement.lang?.toLowerCase().startsWith('en') ? 'en' : 'es';
}

interface I18nValue {
  lang: Lang;
  t: (key: MessageKey, vars?: Vars) => string;
  tn: (base: PluralBase, count: number, vars?: Vars) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const value = useMemo<I18nValue>(
    () => ({
      lang,
      t: (key, vars) => translate(lang, key, vars),
      tn: (base, count, vars) => translatePlural(lang, base, count, vars),
    }),
    [lang]
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n debe usarse dentro de <I18nProvider>');
  return ctx;
}
