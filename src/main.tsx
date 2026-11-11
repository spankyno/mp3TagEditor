import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App.tsx';
import { I18nProvider, detectLang } from './i18n';
import './index.css';

const container = document.getElementById('root')!;
const app = (
  <I18nProvider lang={detectLang()}>
    <App />
  </I18nProvider>
);

// Si la página llega prerenderizada (build de producción) se hidrata; si no (dev), se renderiza desde cero.
if (container.firstElementChild) {
  hydrateRoot(container, app);
} else {
  createRoot(container).render(app);
}
