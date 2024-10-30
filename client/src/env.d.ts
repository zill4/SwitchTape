/// <reference path="../.astro/types.d.ts" />
interface ImportMetaEnv {
    readonly SPOTIFY_CLIENT_ID: string;
    readonly SPOTIFY_CLIENT_SECRET: string;
    readonly SPOTIFY_ACCESS_TOKEN: string;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }