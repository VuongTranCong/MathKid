/**
 * MathKid Service Worker
 * Handles offline functionality and caching for the PWA
 */

const CACHE_NAME = 'mathkid-v1.0.0';
const CACHE_VERSION = 1;

// Files to cache for offline functionality
const CACHE_FILES = [
    '/MathKid/',
    '/MathKid/index.html',
    '/MathKid/settings.html',
    '/MathKid/css/main.css',
    '/MathKid/css/settings.css',
    '/MathKid/css/kids.css',
    '/MathKid/js/app.js',
    '/MathKid/js/math-engine.js',
    '/MathKid/js/storage.js',
    '/MathKid/js/settings.js',
    '/MathKid/manifest.json',
    '/MathKid/icons/icon-72x72.png',
    '/MathKid/icons/icon-96x96.png',
    '/MathKid/icons/icon-128x128.png',
    '/MathKid/icons/icon-144x144.png',
    '/MathKid/icons/icon-152x152.png',
    '/MathKid/icons/icon-192x192.png',
    '/MathKid/icons/icon-512x512.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching app shell files...');
                return cache.addAll(CACHE_FILES);
            })
            .then(() => {
                console.log('[SW] All files cached successfully');
                // Force the waiting service worker to become the active service worker
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('[SW] Failed to cache files:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');

    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        // Delete old cache versions
                        if (cacheName !== CACHE_NAME) {
                            console.log('[SW] Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[SW] Service worker activated');
                // Claim control of all clients immediately
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Only handle GET requests
    if (event.request.method !== 'GET') {
        return;
    }

    // Skip cross-origin requests
    if (!event.request.url.startsWith(self.location.origin)) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version if available
                if (response) {
                    console.log('[SW] Serving from cache:', event.request.url);
                    return response;
                }

                // Otherwise fetch from network
                console.log('[SW] Fetching from network:', event.request.url);
                return fetch(event.request)
                    .then((response) => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Clone the response since it can only be consumed once
                        const responseToCache = response.clone();

                        // Add to cache for future use
                        caches.open(CACHE_NAME)
                            .then((cache) => {
                                cache.put(event.request, responseToCache);
                                console.log('[SW] Cached:', event.request.url);
                            });

                        return response;
                    })
                    .catch((error) => {
                        console.log('[SW] Network fetch failed:', error);

                        // If it's a navigation request and we're offline, return the main page
                        if (event.request.mode === 'navigate') {
                            return caches.match('/index.html');
                        }

                        // For other requests, try to return a meaningful fallback
                        if (event.request.destination === 'image') {
                            // Return a placeholder for images
                            return new Response('', {
                                status: 204,
                                statusText: 'No Content'
                            });
                        }

                        // Return a generic offline response
                        return new Response('Offline', {
                            status: 503,
                            statusText: 'Service Unavailable'
                        });
                    });
            })
    );
});

// Background sync (if supported)
self.addEventListener('sync', (event) => {
    console.log('[SW] Background sync:', event.tag);

    if (event.tag === 'sync-game-data') {
        event.waitUntil(syncGameData());
    }
});

// Push notifications (if needed in future)
self.addEventListener('push', (event) => {
    console.log('[SW] Push received:', event);

    const options = {
        body: 'Time for some math practice!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        tag: 'math-reminder',
        requireInteraction: false,
        actions: [
            {
                action: 'open',
                title: 'Open MathKid',
                icon: '/icons/icon-72x72.png'
            },
            {
                action: 'close',
                title: 'Maybe later',
                icon: '/icons/icon-72x72.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification('MathKid', options)
    );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] Notification click:', event);

    event.notification.close();

    if (event.action === 'open') {
        event.waitUntil(
            clients.matchAll({ type: 'window' })
                .then((clientList) => {
                    // If app is already open, focus it
                    for (const client of clientList) {
                        if (client.url === '/' && 'focus' in client) {
                            return client.focus();
                        }
                    }

                    // Otherwise open new window
                    if (clients.openWindow) {
                        return clients.openWindow('/');
                    }
                })
        );
    }
});

// Message handling (for communication with main thread)
self.addEventListener('message', (event) => {
    console.log('[SW] Message received:', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'CACHE_UPDATE') {
        event.waitUntil(updateCache());
    }

    if (event.data && event.data.type === 'GET_CACHE_STATUS') {
        getCacheStatus().then((status) => {
            event.ports[0].postMessage(status);
        });
    }
});

// Helper functions

/**
 * Sync game data (placeholder for future implementation)
 */
async function syncGameData() {
    try {
        console.log('[SW] Syncing game data...');
        // This could sync with a backend in the future
        return Promise.resolve();
    } catch (error) {
        console.error('[SW] Failed to sync game data:', error);
        throw error;
    }
}

/**
 * Update cache with new files
 */
async function updateCache() {
    try {
        const cache = await caches.open(CACHE_NAME);
        console.log('[SW] Updating cache...');

        // Fetch and cache updated files
        const updates = CACHE_FILES.map(async (file) => {
            try {
                const response = await fetch(file, { cache: 'reload' });
                if (response.status === 200) {
                    await cache.put(file, response);
                    console.log('[SW] Updated cache for:', file);
                }
            } catch (error) {
                console.warn('[SW] Failed to update cache for:', file, error);
            }
        });

        await Promise.all(updates);
        console.log('[SW] Cache update complete');
    } catch (error) {
        console.error('[SW] Cache update failed:', error);
        throw error;
    }
}

/**
 * Get cache status information
 */
async function getCacheStatus() {
    try {
        const cache = await caches.open(CACHE_NAME);
        const requests = await cache.keys();

        const status = {
            cacheName: CACHE_NAME,
            version: CACHE_VERSION,
            cachedFiles: requests.length,
            expectedFiles: CACHE_FILES.length,
            isFullyCached: requests.length >= CACHE_FILES.length,
            lastUpdated: new Date().toISOString()
        };

        console.log('[SW] Cache status:', status);
        return status;
    } catch (error) {
        console.error('[SW] Failed to get cache status:', error);
        return {
            cacheName: CACHE_NAME,
            version: CACHE_VERSION,
            cachedFiles: 0,
            expectedFiles: CACHE_FILES.length,
            isFullyCached: false,
            error: error.message
        };
    }
}

/**
 * Periodic cleanup of old data
 */
async function performCleanup() {
    try {
        // Clean up old caches
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(name => name !== CACHE_NAME);

        for (const oldCache of oldCaches) {
            await caches.delete(oldCache);
            console.log('[SW] Deleted old cache:', oldCache);
        }

        // Could add more cleanup logic here (e.g., old storage data)
        console.log('[SW] Cleanup complete');
    } catch (error) {
        console.error('[SW] Cleanup failed:', error);
    }
}

// Perform cleanup on activation
self.addEventListener('activate', (event) => {
    event.waitUntil(
        Promise.all([
            performCleanup(),
            self.clients.claim()
        ])
    );
});

// Handle errors
self.addEventListener('error', (event) => {
    console.error('[SW] Service worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('[SW] Unhandled promise rejection:', event.reason);
    event.preventDefault();
});

console.log('[SW] Service worker script loaded');