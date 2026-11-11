import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import { fileURLToPath } from 'url';
import { seoContent } from './src/i18n/seo';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Inyecta en cada HTML el JSON-LD de FAQPage generado desde src/i18n/seo.ts,
 * de modo que el marcado estructurado y el texto visible nunca se desincronizan.
 */
function faqJsonLd(): Plugin {
  return {
    name: 'faq-jsonld',
    transformIndexHtml(html) {
      const lang = html.includes('<html lang="en"') ? 'en' : 'es';
      const data = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        inLanguage: lang,
        mainEntity: seoContent[lang].faq.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      };
      // "<" se escapa para que el JSON nunca pueda cerrar la etiqueta <script>
      return html.replace('__FAQ_JSONLD__', JSON.stringify(data).replace(/</g, '\\u003c'));
    },
  };
}

export default defineConfig(({ isSsrBuild }) => ({
  plugins: [react(), tailwindcss(), faqJsonLd()],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      jsmediatags: path.resolve(__dirname, 'node_modules/jsmediatags/dist/jsmediatags.min.js'),
    },
  },
  build: {
    outDir: isSsrBuild ? 'dist-ssr' : 'dist',
    copyPublicDir: !isSsrBuild,
    sourcemap: false,
    target: 'es2022',
    rollupOptions: isSsrBuild
      ? {}
      : {
          // Dos páginas estáticas: español (/) e inglés (/en/)
          input: {
            main: path.resolve(__dirname, 'index.html'),
            en: path.resolve(__dirname, 'en/index.html'),
          },
          output: {
            manualChunks(id) {
              if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/') || id.includes('node_modules/scheduler')) {
                return 'react-vendor';
              }
            },
          },
        },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
}));
