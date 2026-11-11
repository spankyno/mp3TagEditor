# Editor Etiquetas MP3 Online

Editor ID3 de archivos MP3 moderno, rápido y **100 % en el navegador**.  
Edita metadatos y carátulas por lotes con privacidad total: los archivos **nunca salen de tu dispositivo**.

## Características

- Lectura y escritura de etiquetas ID3v2.3 (título, artista, álbum, año, género, carátula, letras, comentario, BPM, compositor…)
- Edición individual y por lotes
- Auto-etiquetado a partir del nombre de archivo
- Renombrado por lotes con plantillas
- Limpieza de etiquetas
- Exportación individual o en ZIP
- Reproductor de audio integrado
- Tema claro / oscuro
- Sin servidores ni claves API: los archivos MP3 nunca se suben (solo métricas de uso anónimas de la web)

## Ejecutar localmente

**Requisitos:** Node.js 18+

```bash
npm install
npm run dev
```

Abre http://localhost:3000

## Build de producción

```bash
npm run build
npm run preview   # opcional, sirve la carpeta dist
```

La salida queda en `dist/`.

## Despliegue en Cloudflare Pages (recomendado)

1. Sube este repositorio a GitHub.
2. En el dashboard de [Cloudflare Pages](https://dash.cloudflare.com/) → **Create a project** → **Connect to Git**.
3. Selecciona el repositorio.
4. Configura el build:
   - **Framework preset**: Vite (o None)
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node.js version**: 18 o 20 (recomendado)
5. Deploy. Cloudflare detectará automáticamente el archivo `public/_redirects` para el modo SPA.

También puedes desplegar desde el CLI:

```bash
npx wrangler pages deploy dist --project-name=editor-etiquetas-mp3
```

## Privacidad y seguridad

Toda la lógica (lectura de ID3, escritura de tags, generación de ZIP, conversión de carátulas) se ejecuta **exclusivamente en el navegador** del usuario mediante las librerías `jsmediatags` y `browser-id3-writer`.  
No existe backend, no se envían archivos a ningún servidor y no se requieren claves de API.

## Licencia

MIT

### Cabeceras de seguridad

`public/_headers` define (Cloudflare Pages) una Content-Security-Policy estricta, HSTS, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` y `Permissions-Policy`. Si añades nuevos scripts o dominios externos, actualiza la CSP en ese archivo.

### Idiomas, SEO y prerenderizado

- La web existe en español (`/`) y en inglés (`/en/`), con `hreflang`, canonical y sitemap bilingüe.
- Las traducciones están en `src/i18n/` (`es.ts` y `en.ts`, mismas claves). El contenido editorial/FAQ está en `src/i18n/seo.ts` y alimenta tanto la página como el JSON-LD `FAQPage`.
- `npm run build` genera la web, la renderiza en servidor (`src/entry-server.tsx`) y prerenderiza la pantalla inicial dentro de `dist/index.html` y `dist/en/index.html` (`scripts/prerender.mjs`); en el navegador se hidrata.

### Funciones

- **Deshacer / rehacer** (Ctrl/Cmd+Z, Ctrl+Y o Ctrl+Shift+Z): cubre ediciones, carátulas, auto-relleno, renombrado, limpieza, altas y bajas de pistas. Las pulsaciones seguidas sobre un mismo campo cuentan como un solo paso.
- **ID3v2.3 / ID3v2.4** a elegir al guardar. ID3v2.4 usa un escritor propio (`src/utils/id3v24.ts`, texto UTF-8, marco `TDRC`).

### Pruebas

`npm test` ejecuta las pruebas (escritor ID3, i18n, hidratación, historial, accesibilidad con axe-core).
