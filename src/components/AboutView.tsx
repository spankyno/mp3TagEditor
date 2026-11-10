import React from 'react';
import {
  ShieldCheck,
  Cpu,
  Layers,
  FileCode,
  Music,
  Download,
  Lock,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Disc3,
  CheckCircle2,
} from 'lucide-react';

interface AboutViewProps {
  onBackToEditor: () => void;
  onLoadDemos: () => void;
}

export const AboutView: React.FC<AboutViewProps> = ({ onBackToEditor, onLoadDemos }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-12">
      {/* Hero Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-900/60 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Editor de Etiquetas ID3 100% en el Navegador</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Editor Etiquetas MP3 Online
        </h1>

        <p className="text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Una herramienta profesional, moderna y libre creada para normalizar, editar y gestionar metadatos
          ID3 de tus archivos MP3 por lotes, garantizando privacidad absoluta gracias a procesamiento client-side en tu memoria RAM.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onBackToEditor}
            className="px-5 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm transition-all active:scale-95 inline-flex items-center gap-2"
          >
            <span>Ir al Editor</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              onLoadDemos();
              onBackToEditor();
            }}
            className="px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Cargar pistas de prueba</span>
          </button>
        </div>
      </div>

      {/* Step by Step Guide */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Disc3 className="w-5 h-5 text-indigo-600" />
          <span>¿Cómo funciona la aplicación paso a paso?</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Paso 1
            </span>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
              Carga tus canciones MP3
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Arrastra y suelta tus archivos MP3 o elígelos desde el selector de archivos. Puedes cargar decenas de canciones simultáneamente (hasta 300-500 MB en total).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Paso 2
            </span>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
              Edición individual o por lotes
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Selecciona una pista para modificar título, artista, año, pista, BPM o letras. Para discos completos, selecciona múltiples pistas y actualiza artista, álbum o año con 1 clic.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Paso 3
            </span>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
              Carátula de Álbum (APIC)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Visualiza la portada original, sube una nueva en alta resolución (JPG o PNG recomendada de 500x500 a 1000x1000 px) o elimínala. Puedes aplicar la misma carátula a todas las pistas seleccionadas.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Paso 4
            </span>
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
              Herramientas avanzadas y descarga
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Auto-rellena etiquetas desde el nombre de archivo o renombra tus MP3 basándote en los nuevos metadatos. Descarga canciones individuales o empaqueta todo en un archivo ZIP al instante.
            </p>
          </div>
        </div>
      </div>

      {/* Privacy Guarantee */}
      <div className="bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-xl">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Compromiso de Privacidad: 100% Client-Side
            </h2>
            <p className="text-xs text-emerald-800 dark:text-emerald-300">
              Tus archivos musicales son exclusivamente tuyos.
            </p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          A diferencia de los convertidores en línea tradicionales que obligan a subir tus archivos a servidores remotos (con riesgo de filtraciones, tiempos de espera largos y límites de ancho de banda),
          <strong> Editor Etiquetas MP3 Online realiza la lectura binaria y escritura de cabeceras ID3 en la memoria de tu propio navegador web</strong>.
          Ni un solo byte de audio o imagen sale de tu equipo.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Sin límites artificiales</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Sin registro ni cuentas</span>
          </div>
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Sin marcas de agua</span>
          </div>
        </div>
      </div>

      {/* Tech Stack */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-600" />
          <span>Stack Tecnológico Utilizado</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="font-semibold text-slate-900 dark:text-white block">
              browser-id3-writer
            </span>
            <p className="text-slate-500 dark:text-slate-400">
              Inyección directa de marcos ID3v2.3 en ArrayBuffers binarios con codificación ISO-8859-1 y Unicode.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="font-semibold text-slate-900 dark:text-white block">
              jsmediatags
            </span>
            <p className="text-slate-500 dark:text-slate-400">
              Lectura y análisis de metadatos ID3v1, ID3v2.2, ID3v2.3 y ID3v2.4 en streaming de bytes.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="font-semibold text-slate-900 dark:text-white block">
              JSZip
            </span>
            <p className="text-slate-500 dark:text-slate-400">
              Compresión y empaquetado multi-archivo en formato .zip en tiempo real con seguimiento de progreso.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="font-semibold text-slate-900 dark:text-white block">
              React 19 & TypeScript
            </span>
            <p className="text-slate-500 dark:text-slate-400">
              Arquitectura de componentes tipada, reactiva y de alto rendimiento.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="font-semibold text-slate-900 dark:text-white block">
              Tailwind CSS v4
            </span>
            <p className="text-slate-500 dark:text-slate-400">
              Motor de estilos moderno con compatibilidad nativa para modo oscuro e interfaces fluidas.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="font-semibold text-slate-900 dark:text-white block">
              HTML5 Audio & Canvas API
            </span>
            <p className="text-slate-500 dark:text-slate-400">
              Preescucha de canciones en tiempo real y normalización de carátulas gráficas.
            </p>
          </div>
        </div>
      </div>

      {/* Author & Contact Info */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4 shadow-2xs transition-colors">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          <span>Autor y Canales de Contacto</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
          Esta aplicación fue diseñada y desarrollada por <strong className="text-slate-800 dark:text-slate-200">Aitor Sánchez Gutiérrez</strong>.
          Si tienes sugerencias, comentarios o deseas ponerte en contacto:
        </p>

        <div className="flex flex-wrap gap-3 pt-2 text-xs">
          <a
            href="https://aitorsanchez.pages.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 rounded-xl font-medium transition-colors inline-flex items-center gap-1.5"
          >
            <span>Blog oficial (aitorsanchez.pages.dev)</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>
          <a
            href="https://aitorhub.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700/80 rounded-xl font-medium transition-colors inline-flex items-center gap-1.5"
          >
            <span>Aitor Hub (aitorhub.vercel.app)</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>
          <a
            href="https://aitorsanchez.pages.dev/contacto"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow-2xs transition-all active:scale-95 inline-flex items-center gap-1.5"
          >
            <span>Formulario de Contacto</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>
        </div>
      </div>
    </div>
  );
};
