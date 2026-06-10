// ═══════════════════════════════════════════════════════════
// F1 Strategist — Service Worker
// ═══════════════════════════════════════════════════════════

const APP_VER = new URL(self.location.href).searchParams.get('v') || '1.0';
const CACHE_VERSION = 'f1-strategist-v' + APP_VER;

// Core files: install fails if these can't be cached (they must exist).
const PRECACHE_CORE = [
    './',
    './index.html',
    './manifest.json'
];

// Best-effort: a missing icon should not break the entire install.
const PRECACHE_OPTIONAL = [
    './images/favicon.ico',
    './images/icon.png',
    './images/icon192.png'
];

// All third-party hosts the app loads from (must include every CDN
// referenced in index.html, or those assets won't work offline).
const CDN_HOSTS = [
    'cdn.tailwindcss.com',
    'cdn.jsdelivr.net',
    'fonts.googleapis.com',
    'fonts.gstatic.com'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then(cache =>
                cache.addAll(PRECACHE_CORE).then(() =>
                    Promise.allSettled(PRECACHE_OPTIONAL.map(url => cache.add(url)))
                )
            )
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => name !== CACHE_VERSION && name.startsWith('f1-strategist'))
                    .map(name => caches.delete(name))
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    if (event.request.method !== 'GET' || !url.protocol.startsWith('http')) return;

    if (CDN_HOSTS.some(host => url.hostname === host || url.hostname.endsWith('.' + host))) {
        event.respondWith(staleWhileRevalidate(event.request));
        return;
    }

    if (url.origin === location.origin) {
        event.respondWith(cacheFirst(event.request));
        return;
    }
});

async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_VERSION);
            cache.put(request, response.clone());
        }
        return response;
    } catch (err) {
        // For navigations, fall back to the cached app shell.
        if (request.mode === 'navigate') {
            const shell = await caches.match('./index.html');
            if (shell) return shell;
        }
        return new Response('Offline', { status: 503 });
    }
}

async function staleWhileRevalidate(request) {
    const cache = await caches.open(CACHE_VERSION);
    const cached = await cache.match(request);
    const fetchPromise = fetch(request)
        .then(response => {
            if (response.ok) cache.put(request, response.clone());
            return response;
        })
        .catch(() => cached || new Response('Offline', { status: 503 }));
    return cached || fetchPromise;
}
