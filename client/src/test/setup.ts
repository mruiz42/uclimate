import '@testing-library/jest-dom/vitest';

// Node >= 25 has its own (file-backed, here unconfigured) localStorage global that shadows
// jsdom's. Point the global back at jsdom's in-memory storage.
const jsdomStorage = (globalThis as { jsdom?: { window: Window } }).jsdom?.window.localStorage;
if (jsdomStorage) {
  Object.defineProperty(globalThis, 'localStorage', { value: jsdomStorage, configurable: true });
}
