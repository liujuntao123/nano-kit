/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly PROXY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
