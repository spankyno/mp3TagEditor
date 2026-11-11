import '@testing-library/jest-dom/vitest';
// Utilidades del entorno jsdom que el navegador real sí tiene
let counter = 0;
if (!URL.createObjectURL) {
  (URL as unknown as { createObjectURL: (o: Blob) => string }).createObjectURL = () => `blob:test/${++counter}`;
}
if (!URL.revokeObjectURL) {
  (URL as unknown as { revokeObjectURL: (u: string) => void }).revokeObjectURL = () => {};
}
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
if (typeof window !== 'undefined') window.scrollTo = (() => {}) as typeof window.scrollTo;
