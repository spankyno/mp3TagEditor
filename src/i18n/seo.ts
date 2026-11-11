import type { Lang } from './index';

/**
 * Contenido editorial indexable (única fuente de verdad):
 *  - se muestra bajo el editor (componente SeoContent),
 *  - se prerenderiza en el HTML estático durante el build,
 *  - alimenta el JSON-LD FAQPage de cada idioma (ver vite.config.ts).
 */
export interface SeoContentData {
  whatTitle: string;
  whatParagraphs: string[];
  stepsTitle: string;
  steps: { title: string; text: string }[];
  featuresTitle: string;
  features: string[];
  faqTitle: string;
  faq: { q: string; a: string }[];
}

export const seoContent: Record<Lang, SeoContentData> = {
  es: {
    whatTitle: '¿Qué es un editor de etiquetas ID3 para MP3?',
    whatParagraphs: [
      'Las etiquetas ID3 son los metadatos que viajan dentro de un archivo MP3: título, artista, álbum, año, número de pista, género, letra y la carátula del disco. Reproductores, móviles y coches las usan para mostrar y ordenar tu música.',
      'Este editor de etiquetas MP3 online te permite corregirlas o completarlas directamente en el navegador, canción a canción o por lotes, sin instalar nada y sin subir tus archivos a ningún servidor.',
    ],
    stepsTitle: 'Cómo editar las etiquetas de un MP3 en 4 pasos',
    steps: [
      { title: 'Carga tus MP3', text: 'Arrastra los archivos a la zona de carga o selecciónalos desde tu dispositivo.' },
      { title: 'Edita las etiquetas', text: 'Selecciona una pista para cambiar título, artista, álbum, año, género o letra. Si eliges varias, los cambios se aplican a todas a la vez.' },
      { title: 'Añade o cambia la carátula', text: 'Sube una imagen JPG, PNG o WebP y asígnala a una pista o a un disco entero.' },
      { title: 'Descarga el resultado', text: 'Guarda cada canción por separado o todas en un ZIP, en ID3v2.3 (máxima compatibilidad) o ID3v2.4.' },
    ],
    featuresTitle: 'Qué puedes hacer con este editor de metadatos MP3',
    features: [
      'Editar título, artista, álbum, artista del álbum, año, pista, género, compositor, BPM, comentarios y letras.',
      'Edición por lotes: cambia el álbum, el artista o la carátula de un disco completo con un solo clic.',
      'Auto-rellenar etiquetas a partir del nombre del archivo con plantillas como pista - artista - título.',
      'Renombrar archivos MP3 usando sus etiquetas ID3.',
      'Limpiar etiquetas: quitar carátulas, comentarios, letras o todos los metadatos.',
      'Deshacer y rehacer cambios con Ctrl+Z y Ctrl+Y.',
      'Funciona sin conexión a servidores: tus archivos no salen de tu equipo.',
    ],
    faqTitle: 'Preguntas frecuentes',
    faq: [
      {
        q: '¿Es gratis? ¿Necesito registrarme?',
        a: 'Es totalmente gratuito, sin registro, sin cuentas y sin marcas de agua.',
      },
      {
        q: '¿Se suben mis archivos MP3 a algún servidor?',
        a: 'No. La lectura y escritura de las etiquetas ocurre en la memoria de tu propio navegador, así que el audio y las imágenes nunca salen de tu equipo. Solo se registran métricas anónimas de uso de la web.',
      },
      {
        q: '¿Qué diferencia hay entre ID3v2.3 e ID3v2.4?',
        a: 'ID3v2.3 es la versión más compatible con reproductores, coches y programas antiguos. ID3v2.4 es más reciente y guarda el texto en UTF-8, pero algunos dispositivos viejos no la leen bien. Si dudas, usa ID3v2.3.',
      },
      {
        q: '¿Cómo añado o cambio la carátula de un MP3?',
        a: 'Selecciona la canción (o varias), pulsa en la zona de carátula y elige una imagen JPG, PNG o WebP de hasta 10 MB. Se recomienda un tamaño entre 500×500 y 1000×1000 píxeles.',
      },
      {
        q: '¿Puedo editar varias canciones a la vez?',
        a: 'Sí. Selecciona varias pistas (con Mayús o Ctrl) y rellena solo los campos que quieras cambiar: se aplicarán a todas las seleccionadas.',
      },
      {
        q: '¿Puedo deshacer un cambio?',
        a: 'Sí. Usa los botones Deshacer y Rehacer o los atajos Ctrl+Z y Ctrl+Y (Cmd en Mac). También puedes revertir una pista a sus etiquetas originales.',
      },
      {
        q: '¿Qué límites tiene?',
        a: 'Por sesión puedes cargar hasta 200 pistas, con un máximo de 100 MB por archivo, para que el navegador no se quede sin memoria.',
      },
      {
        q: '¿Funciona en el móvil?',
        a: 'Sí, funciona en cualquier navegador moderno de ordenador, tablet o móvil.',
      },
    ],
  },
  en: {
    whatTitle: 'What is an ID3 tag editor for MP3 files?',
    whatParagraphs: [
      'ID3 tags are the metadata stored inside an MP3 file: title, artist, album, year, track number, genre, lyrics and the album cover. Players, phones and car stereos use them to display and sort your music.',
      'This online MP3 tag editor lets you fix or complete them right in your browser, one song at a time or in batches, with nothing to install and without uploading your files to any server.',
    ],
    stepsTitle: 'How to edit MP3 tags in 4 steps',
    steps: [
      { title: 'Load your MP3 files', text: 'Drag the files onto the drop zone or pick them from your device.' },
      { title: 'Edit the tags', text: 'Select a track to change its title, artist, album, year, genre or lyrics. If you select several, changes apply to all of them at once.' },
      { title: 'Add or change the cover art', text: 'Upload a JPG, PNG or WebP image and assign it to one track or a whole album.' },
      { title: 'Download the result', text: 'Save each song separately or all of them in a ZIP, as ID3v2.3 (best compatibility) or ID3v2.4.' },
    ],
    featuresTitle: 'What you can do with this MP3 metadata editor',
    features: [
      'Edit title, artist, album, album artist, year, track, genre, composer, BPM, comments and lyrics.',
      'Batch editing: change the album, artist or cover of a whole record with a single click.',
      'Auto-fill tags from the file name using patterns like track - artist - title.',
      'Rename MP3 files using their ID3 tags.',
      'Clean tags: remove cover art, comments, lyrics or all metadata.',
      'Undo and redo changes with Ctrl+Z and Ctrl+Y.',
      'No server processing: your files never leave your device.',
    ],
    faqTitle: 'Frequently asked questions',
    faq: [
      {
        q: 'Is it free? Do I need to sign up?',
        a: 'It is completely free, with no sign-up, no accounts and no watermarks.',
      },
      {
        q: 'Are my MP3 files uploaded to a server?',
        a: 'No. Tags are read and written in your own browser’s memory, so audio and images never leave your device. Only anonymous website usage metrics are recorded.',
      },
      {
        q: 'What is the difference between ID3v2.3 and ID3v2.4?',
        a: 'ID3v2.3 is the most compatible version with players, car stereos and older software. ID3v2.4 is newer and stores text as UTF-8, but some older devices do not read it properly. If in doubt, use ID3v2.3.',
      },
      {
        q: 'How do I add or change the cover art of an MP3?',
        a: 'Select the song (or several), click the cover area and choose a JPG, PNG or WebP image of up to 10 MB. A size between 500×500 and 1000×1000 pixels is recommended.',
      },
      {
        q: 'Can I edit several songs at once?',
        a: 'Yes. Select several tracks (with Shift or Ctrl) and fill in only the fields you want to change: they will be applied to every selected track.',
      },
      {
        q: 'Can I undo a change?',
        a: 'Yes. Use the Undo and Redo buttons or the Ctrl+Z and Ctrl+Y shortcuts (Cmd on Mac). You can also revert a track to its original tags.',
      },
      {
        q: 'What are the limits?',
        a: 'Per session you can load up to 200 tracks, with a maximum of 100 MB per file, so the browser does not run out of memory.',
      },
      {
        q: 'Does it work on mobile?',
        a: 'Yes, it works in any modern browser on desktop, tablet or phone.',
      },
    ],
  },
};
