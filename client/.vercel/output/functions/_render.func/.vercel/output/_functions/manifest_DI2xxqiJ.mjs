import 'cookie';
import 'kleur/colors';
import { N as NOOP_MIDDLEWARE_FN } from './chunks/astro-designed-error-pages_Clwhnr-S.mjs';
import 'es-module-lexer';
import { g as decodeKey } from './chunks/astro/server_CS5QxLMK.mjs';
import 'clsx';

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///C:/Users/justc/code/SwitchTape/client/","adapterName":"@astrojs/vercel/serverless","routes":[{"file":"conversion-progress/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/conversion-progress","isIndex":false,"type":"page","pattern":"^\\/conversion-progress\\/?$","segments":[[{"content":"conversion-progress","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/conversion-progress.astro","pathname":"/conversion-progress","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"load-playlist/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/load-playlist","isIndex":false,"type":"page","pattern":"^\\/load-playlist\\/?$","segments":[[{"content":"load-playlist","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/load-playlist.astro","pathname":"/load-playlist","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"login/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/login","isIndex":false,"type":"page","pattern":"^\\/login\\/?$","segments":[[{"content":"login","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/login.astro","pathname":"/login","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"privacy/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/privacy","isIndex":false,"type":"page","pattern":"^\\/privacy\\/?$","segments":[[{"content":"privacy","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/privacy.astro","pathname":"/privacy","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"report-card/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/report-card","isIndex":false,"type":"page","pattern":"^\\/report-card\\/?$","segments":[[{"content":"report-card","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/report-card.astro","pathname":"/report-card","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"select-destination/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/select-destination","isIndex":false,"type":"page","pattern":"^\\/select-destination\\/?$","segments":[[{"content":"select-destination","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/select-destination.astro","pathname":"/select-destination","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"signup/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/signup","isIndex":false,"type":"page","pattern":"^\\/signup\\/?$","segments":[[{"content":"signup","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/signup.astro","pathname":"/signup","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"spotify/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/spotify","isIndex":false,"type":"page","pattern":"^\\/spotify\\/?$","segments":[[{"content":"spotify","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/spotify.astro","pathname":"/spotify","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"terms/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/terms","isIndex":false,"type":"page","pattern":"^\\/terms\\/?$","segments":[[{"content":"terms","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/terms.astro","pathname":"/terms","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":true,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"endpoint","isIndex":false,"route":"/_image","pattern":"^\\/_image$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/astro/dist/assets/endpoint/generic.js","pathname":"/_image","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/exchange-spotify-code","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/exchange-spotify-code\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"exchange-spotify-code","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/exchange-spotify-code.ts","pathname":"/api/exchange-spotify-code","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/generate-report","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/generate-report\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"generate-report","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/generate-report.ts","pathname":"/api/generate-report","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/musickit-token","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/musickit-token\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"musickit-token","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/musickit-token.ts","pathname":"/api/musickit-token","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/spotify-token","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/spotify-token\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"spotify-token","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/spotify-token.ts","pathname":"/api/spotify-token","prerender":false,"fallbackRoutes":[],"_meta":{"trailingSlash":"ignore"}}}],"base":"/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["C:/Users/justc/code/SwitchTape/client/src/pages/conversion-progress.astro",{"propagation":"none","containsHead":true}],["C:/Users/justc/code/SwitchTape/client/src/pages/index.astro",{"propagation":"none","containsHead":true}],["C:/Users/justc/code/SwitchTape/client/src/pages/load-playlist.astro",{"propagation":"none","containsHead":true}],["C:/Users/justc/code/SwitchTape/client/src/pages/login.astro",{"propagation":"none","containsHead":true}],["C:/Users/justc/code/SwitchTape/client/src/pages/privacy.astro",{"propagation":"none","containsHead":true}],["C:/Users/justc/code/SwitchTape/client/src/pages/report-card.astro",{"propagation":"none","containsHead":true}],["C:/Users/justc/code/SwitchTape/client/src/pages/select-destination.astro",{"propagation":"none","containsHead":true}],["C:/Users/justc/code/SwitchTape/client/src/pages/signup.astro",{"propagation":"none","containsHead":true}],["C:/Users/justc/code/SwitchTape/client/src/pages/spotify.astro",{"propagation":"none","containsHead":true}],["C:/Users/justc/code/SwitchTape/client/src/pages/terms.astro",{"propagation":"none","containsHead":true}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(o,t)=>{let i=async()=>{await(await o())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var s=(i,t)=>{let a=async()=>{await(await i())()};if(t.value){let e=matchMedia(t.value);e.matches?a():e.addEventListener(\"change\",a,{once:!0})}};(self.Astro||(self.Astro={})).media=s;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var l=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let a of e)if(a.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=l;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000@astrojs-ssr-adapter":"_@astrojs-ssr-adapter.mjs","\u0000noop-middleware":"_noop-middleware.mjs","\u0000@astrojs-ssr-virtual-entry":"entry.mjs","\u0000@astro-page:src/pages/api/exchange-spotify-code@_@ts":"pages/api/exchange-spotify-code.astro.mjs","\u0000@astro-page:src/pages/api/generate-report@_@ts":"pages/api/generate-report.astro.mjs","\u0000@astro-page:src/pages/api/musickit-token@_@ts":"pages/api/musickit-token.astro.mjs","\u0000@astro-page:src/pages/api/spotify-token@_@ts":"pages/api/spotify-token.astro.mjs","\u0000@astro-page:src/pages/conversion-progress@_@astro":"pages/conversion-progress.astro.mjs","\u0000@astro-page:src/pages/load-playlist@_@astro":"pages/load-playlist.astro.mjs","\u0000@astro-page:src/pages/privacy@_@astro":"pages/privacy.astro.mjs","\u0000@astro-page:src/pages/report-card@_@astro":"pages/report-card.astro.mjs","\u0000@astro-page:src/pages/select-destination@_@astro":"pages/select-destination.astro.mjs","\u0000@astro-page:src/pages/spotify@_@astro":"pages/spotify.astro.mjs","\u0000@astro-page:src/pages/terms@_@astro":"pages/terms.astro.mjs","\u0000@astro-page:src/pages/index@_@astro":"pages/index.astro.mjs","\u0000@astro-page:src/pages/login@_@astro":"pages/login.astro.mjs","\u0000@astro-page:src/pages/signup@_@astro":"pages/signup.astro.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000@astro-page:node_modules/astro/dist/assets/endpoint/generic@_@js":"pages/_image.astro.mjs","C:/Users/justc/code/SwitchTape/client/node_modules/astro/dist/env/setup.js":"chunks/astro/env-setup_Cr6XTFvb.mjs","\u0000@astrojs-manifest":"manifest_DI2xxqiJ.mjs","/astro/hoisted.js?q=0":"_astro/hoisted.DbkQ6GMc.js","C:/Users/justc/code/SwitchTape/client/src/components/LoginForm":"_astro/LoginForm.DpYZmXiv.js","C:/Users/justc/code/SwitchTape/client/src/components/SignupForm":"_astro/SignupForm._wlRQFKb.js","C:/Users/justc/code/SwitchTape/client/src/components/PlatformSelector":"_astro/PlatformSelector.CYE66ox1.js","C:/Users/justc/code/SwitchTape/client/src/components/SpotifyCallback":"_astro/SpotifyCallback.Bs4j67ox.js","C:/Users/justc/code/SwitchTape/client/node_modules/html2canvas/dist/html2canvas.esm.js":"_astro/html2canvas.esm.BfxBtG_O.js","C:/Users/justc/code/SwitchTape/client/src/components/ConversionProgressCard":"_astro/ConversionProgressCard.f4qVQNLF.js","C:/Users/justc/code/SwitchTape/client/src/components/LoadPlaylistCard":"_astro/LoadPlaylistCard.czCE4hZz.js","@astrojs/preact/client.js":"_astro/client.DrajYqTV.js","C:/Users/justc/code/SwitchTape/client/node_modules/@preact/signals/dist/signals.module.js":"_astro/signals.module.CapGeHVY.js","C:/Users/justc/code/SwitchTape/client/src/components/ReportCard":"_astro/ReportCard.KOFbXCxc.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[],"assets":["/404.html","/favicon-128x128.png","/favicon-96x96.png","/favicon.png","/index.html","/robots.txt","/security.txt","/sitemap.xml","/fonts/DonGraffiti-wrYx.otf","/fonts/RampartOne-Regular.ttf","/images/switchtape-logo-black.png","/images/switchtape-logo.png","/_astro/AppleMusic.m_mUZPXn.js","/_astro/client.DrajYqTV.js","/_astro/ConversionProgressCard.f4qVQNLF.js","/_astro/hoisted.DbkQ6GMc.js","/_astro/hooks.module.Cp6QNsn_.js","/_astro/html2canvas.esm.BfxBtG_O.js","/_astro/jsxRuntime.module.D5IRD36a.js","/_astro/LoadPlaylistCard.czCE4hZz.js","/_astro/login.CBeOLL-b.css","/_astro/LoginForm.DpYZmXiv.js","/_astro/PlatformSelector.CYE66ox1.js","/_astro/preact.module.MgpskPMs.js","/_astro/preload-helper.CLcXU_4U.js","/_astro/ReportCard.COWROHkT.css","/_astro/ReportCard.KOFbXCxc.js","/_astro/signals.module.CapGeHVY.js","/_astro/SignupForm._wlRQFKb.js","/_astro/spotify.pB5ZjrtY.js","/_astro/SpotifyCallback.Bs4j67ox.js","/conversion-progress/index.html","/load-playlist/index.html","/login/index.html","/privacy/index.html","/report-card/index.html","/select-destination/index.html","/signup/index.html","/spotify/index.html","/terms/index.html","/index.html"],"buildFormat":"directory","checkOrigin":false,"serverIslandNameMap":[],"key":"5pFqGK4iib+4MFSwNnwcDgENnJAXkJnjH6MBL5P+gyU=","experimentalEnvGetSecretEnabled":false});

export { manifest };
