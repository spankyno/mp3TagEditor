import { renderToString } from 'react-dom/server';
import App from './App.tsx';
import { I18nProvider, type Lang } from './i18n';

/** Renderiza la pantalla inicial a HTML para prerenderizarla en el build */
export function render(lang: Lang): string {
  return renderToString(
    <I18nProvider lang={lang}>
      <App />
    </I18nProvider>
  );
}
