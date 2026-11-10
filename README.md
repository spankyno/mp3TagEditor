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
- Sin servidores, sin claves API, sin telemetría

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
