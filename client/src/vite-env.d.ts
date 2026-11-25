/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** API origin. Leave unset to use same-origin `/api` (proxied by Vite in dev). */
  readonly VITE_API_URL?: string;
  /** MapLibre style URL. Defaults to OpenFreeMap "liberty". */
  readonly VITE_MAP_STYLE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
