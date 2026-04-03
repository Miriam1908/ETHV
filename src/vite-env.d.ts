/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BACKEND_URL?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_WALLET_BYPASS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
