import React from 'react';
import { ChevronDown } from 'lucide-react';
import { seoContent } from '../i18n/seo';
import { useI18n } from '../i18n';

/**
 * Contenido editorial visible (y prerenderizado en el HTML) para posicionamiento:
 * qué es ID3, pasos, funciones y preguntas frecuentes.
 */
export const SeoContent: React.FC = () => {
  const { lang } = useI18n();
  const c = seoContent[lang];

  return (
    <div className="max-w-3xl mx-auto mt-14 space-y-10 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
      <section aria-labelledby="seo-what" className="space-y-3">
        <h2 id="seo-what" className="text-xl font-bold text-slate-900 dark:text-white">
          {c.whatTitle}
        </h2>
        {c.whatParagraphs.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </section>

      <section aria-labelledby="seo-steps" className="space-y-3">
        <h2 id="seo-steps" className="text-xl font-bold text-slate-900 dark:text-white">
          {c.stepsTitle}
        </h2>
        <ol className="list-decimal pl-5 space-y-2 marker:font-semibold marker:text-indigo-700 dark:marker:text-indigo-400">
          {c.steps.map((s) => (
            <li key={s.title}>
              <strong className="text-slate-900 dark:text-white">{s.title}.</strong> {s.text}
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="seo-features" className="space-y-3">
        <h2 id="seo-features" className="text-xl font-bold text-slate-900 dark:text-white">
          {c.featuresTitle}
        </h2>
        <ul className="list-disc pl-5 space-y-1.5 marker:text-indigo-600">
          {c.features.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="seo-faq" className="space-y-3">
        <h2 id="seo-faq" className="text-xl font-bold text-slate-900 dark:text-white">
          {c.faqTitle}
        </h2>
        <div className="space-y-2">
          {c.faq.map((item) => (
            <details
              key={item.q}
              className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3"
            >
              <summary className="cursor-pointer list-none flex items-center justify-between gap-3 font-semibold text-slate-900 dark:text-white rounded-md">
                <span>{item.q}</span>
                <ChevronDown
                  aria-hidden="true"
                  className="w-4 h-4 shrink-0 text-slate-500 transition-transform group-open:rotate-180"
                />
              </summary>
              <p className="mt-2 text-slate-700 dark:text-slate-300">{item.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
};
