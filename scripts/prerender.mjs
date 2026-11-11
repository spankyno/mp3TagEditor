// Prerenderiza la pantalla inicial (es y en) dentro de dist/**/index.html tras el build.
// Resultado: los rastreadores y los usuarios ven contenido real antes de que cargue el JavaScript.
import { readFile, writeFile, rm } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const { render } = await import(pathToFileURL(path.join(root, 'dist-ssr', 'entry-server.js')).href);

const pages = [
  { file: 'dist/index.html', lang: 'es' },
  { file: 'dist/en/index.html', lang: 'en' },
];

for (const { file, lang } of pages) {
  const target = path.join(root, file);
  const html = await readFile(target, 'utf8');
  if (!html.includes('<!--app-html-->')) throw new Error(`${file}: falta el marcador <!--app-html-->`);
  await writeFile(target, html.replace('<!--app-html-->', render(lang)));
  console.log(`prerender: ${file} (${lang})`);
}

await rm(path.join(root, 'dist-ssr'), { recursive: true, force: true });
