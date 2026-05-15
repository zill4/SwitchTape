/// <reference path="../.astro/types.d.ts" />
interface ImportMetaEnv {
    readonly PUBLIC_SPOTIFY_CLIENT_ID: string;
    readonly SPOTIFY_CLIENT_ID: string;
    readonly SPOTIFY_CLIENT_SECRET: string;
    readonly GEMINI_API_KEY: string;
    readonly APPLE_MUSIC_PRIVATE_KEY: string;
    readonly APPLE_MUSIC_TEAM_ID: string;
    readonly APPLE_MUSIC_KEY_ID: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
