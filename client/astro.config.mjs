import { defineConfig } from 'astro/config';

export default defineConfig({
  vite: {
    define: {
      'process.env.SPOTIFY_CLIENT_ID': JSON.stringify(process.env.SPOTIFY_CLIENT_ID),
      'process.env.SPOTIFY_CLIENT_SECRET': JSON.stringify(process.env.SPOTIFY_CLIENT_SECRET),
      'process.env.SPOTIFY_ACCESS_TOKEN': JSON.stringify(process.env.SPOTIFY_ACCESS_TOKEN),
    },
  },
});