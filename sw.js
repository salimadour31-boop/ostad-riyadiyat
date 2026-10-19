/* Service worker : tout en cache pour un usage hors ligne. */
const CACHE = 'ostad-v2';
const ASSETS = ["./", "index.html", "manifest.webmanifest", "css/app.css", "js/programme.js", "js/bank.js", "js/lessons.js", "js/situations.js", "js/fig.js", "js/omml.js", "js/core.js", "js/i18n.js", "js/db.js", "js/app.js",
  "icons/icon-192.png", "icons/icon-512.png", "vendor/katex/katex.min.css", "vendor/katex/katex.min.js", "vendor/katex/contrib/auto-render.min.js", "vendor/docx/docx.umd.js",
   "vendor/katex/fonts/KaTeX_AMS-Regular.woff2",  "vendor/katex/fonts/KaTeX_Caligraphic-Bold.woff2",  "vendor/katex/fonts/KaTeX_Caligraphic-Regular.woff2",  "vendor/katex/fonts/KaTeX_Fraktur-Bold.woff2",  "vendor/katex/fonts/KaTeX_Fraktur-Regular.woff2",  "vendor/katex/fonts/KaTeX_Main-Bold.woff2",  "vendor/katex/fonts/KaTeX_Main-BoldItalic.woff2",  "vendor/katex/fonts/KaTeX_Main-Italic.woff2",  "vendor/katex/fonts/KaTeX_Main-Regular.woff2",  "vendor/katex/fonts/KaTeX_Math-BoldItalic.woff2",  "vendor/katex/fonts/KaTeX_Math-Italic.woff2",  "vendor/katex/fonts/KaTeX_SansSerif-Bold.woff2",  "vendor/katex/fonts/KaTeX_SansSerif-Italic.woff2",  "vendor/katex/fonts/KaTeX_SansSerif-Regular.woff2",  "vendor/katex/fonts/KaTeX_Script-Regular.woff2",  "vendor/katex/fonts/KaTeX_Size1-Regular.woff2",  "vendor/katex/fonts/KaTeX_Size2-Regular.woff2",  "vendor/katex/fonts/KaTeX_Size3-Regular.woff2",  "vendor/katex/fonts/KaTeX_Size4-Regular.woff2",  "vendor/katex/fonts/KaTeX_Typewriter-Regular.woff2"];
self.addEventListener('install', e => e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())));
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(r => r || fetch(e.request).then(res => { const cp = res.clone(); if (res.ok) caches.open(CACHE).then(c => c.put(e.request, cp)); return res; }).catch(() => caches.match('index.html'))));
});
