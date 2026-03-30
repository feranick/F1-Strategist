// ═══════════════════════════════════════════════════════════
// F1 Strategist — Service Worker
// ═══════════════════════════════════════════════════════════

const APP_VER = new URL(self.location).searchParams.get('v') || '1.0';
const CACHE_VERSION = 'f1-strategist-v' + APP_VER;

const PRECACHE_URLS = [
    './',
    './index.html',
    './manifest.json',
    './favicon.ico',
    './icon.png',
    './icon192.png'
];

const CDN_HOSTS = [
    'cdn.tailwindcss.com',
    'fonts.googleapis.com',
    'fonts.gstatic.com'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_VERSION)
            .then(cache => cache.addAll(PRECACHE_URLS))
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

    if (CDN_HOSTS.some(host => url.hostname.includes(host))) {
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
        .catch(() => cached); 
    return cached || fetchPromise;
}
