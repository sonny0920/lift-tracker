/* The Logbook — service worker for offline use.
   HTML uses network-first (so new deploys show up), everything else
   (fonts, icons) is cache-first with runtime caching. */
const CACHE = "logbook-v1";
const CORE = ["./", "./index.html", "./manifest.json"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const isHTML = req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html");
  if (isHTML){
    // network-first: always try to get the freshest page, fall back to cache offline
    e.respondWith(
      fetch(req).then(res => { const c = res.clone(); caches.open(CACHE).then(x => x.put(req, c)); return res; })
        .catch(() => caches.match(req).then(h => h || caches.match("./index.html")))
    );
  } else {
    // cache-first for assets/fonts
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        const c = res.clone(); caches.open(CACHE).then(x => x.put(req, c)); return res;
      }).catch(() => hit))
    );
  }
});
