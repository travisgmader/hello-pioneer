/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LEADER?: string;
  readonly VITE_LEADER_EMAIL?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
