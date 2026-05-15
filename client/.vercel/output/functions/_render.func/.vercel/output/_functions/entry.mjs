import { renderers } from './renderers.mjs';
import { c as createExports } from './chunks/entrypoint_BJujxS25.mjs';
import { manifest } from './manifest_DI2xxqiJ.mjs';

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/api/exchange-spotify-code.astro.mjs');
const _page2 = () => import('./pages/api/generate-report.astro.mjs');
const _page3 = () => import('./pages/api/musickit-token.astro.mjs');
const _page4 = () => import('./pages/api/spotify-token.astro.mjs');
const _page5 = () => import('./pages/conversion-progress.astro.mjs');
const _page6 = () => import('./pages/load-playlist.astro.mjs');
const _page7 = () => import('./pages/login.astro.mjs');
const _page8 = () => import('./pages/privacy.astro.mjs');
const _page9 = () => import('./pages/report-card.astro.mjs');
const _page10 = () => import('./pages/select-destination.astro.mjs');
const _page11 = () => import('./pages/signup.astro.mjs');
const _page12 = () => import('./pages/spotify.astro.mjs');
const _page13 = () => import('./pages/terms.astro.mjs');
const _page14 = () => import('./pages/index.astro.mjs');

const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/api/exchange-spotify-code.ts", _page1],
    ["src/pages/api/generate-report.ts", _page2],
    ["src/pages/api/musickit-token.ts", _page3],
    ["src/pages/api/spotify-token.ts", _page4],
    ["src/pages/conversion-progress.astro", _page5],
    ["src/pages/load-playlist.astro", _page6],
    ["src/pages/login.astro", _page7],
    ["src/pages/privacy.astro", _page8],
    ["src/pages/report-card.astro", _page9],
    ["src/pages/select-destination.astro", _page10],
    ["src/pages/signup.astro", _page11],
    ["src/pages/spotify.astro", _page12],
    ["src/pages/terms.astro", _page13],
    ["src/pages/index.astro", _page14]
]);
const serverIslandMap = new Map();
const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    middleware: () => import('./_noop-middleware.mjs')
});
const _args = {
    "middlewareSecret": "dc2862ad-d5da-464a-bbc0-1960e891b577",
    "skewProtection": false
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;

export { __astrojsSsrVirtualEntry as default, pageMap };
