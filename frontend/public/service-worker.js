/* eslint-disable no-restricted-globals */

// Version number - INCREMENT THIS ON EACH DEPLOY
const APP_VERSION = '2.2.0';
const CACHE_NAME = `fin-feathers-v${APP_VERSION}`;

// Critical update flag - set to true to force refresh
const IS_CRITICAL_UPDATE = true;

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html'
];

// Install event - cache resources and skip waiting
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing version ${APP_VERSION}`);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Opened cache');
        return cache.addAll(urlsToCache.map(url => new Request(url, {cache: 'reload'})));
      })
      .catch((error) => {
        console.log('[SW] Cache install failed:', error);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches and notify clients
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating version ${APP_VERSION}`);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName.startsWith('fin-feathers-')) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.matchAll({ type: 'window' }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: APP_VERSION,
            isCritical: IS_CRITICAL_UPDATE
          });
        });
      });
    })
  );
  return self.clients.claim();
});

// Fetch event - Network first for API, cache first for assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // API requests - always network, queue if offline
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request.clone())
        .catch(async (error) => {
          // If it's a POST request that failed, we might want to queue it
          if (event.request.method === 'POST') {
            console.log('[SW] API POST failed, might be offline:', url.pathname);
          }
          throw error;
        })
    );
    return;
  }

  // Static assets - Network first, then cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          // Return offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/offline.html').then(offlineResponse => {
              return offlineResponse || caches.match('/index.html');
            });
          }
          return caches.match('/index.html');
        });
      })
  );
});

// Background Sync - Retry failed POST requests
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync event:', event.tag);
  
  if (event.tag === 'sync-posts') {
    event.waitUntil(syncPendingPosts());
  }
});

// Sync pending posts from IndexedDB
async function syncPendingPosts() {
  console.log('[SW] Syncing pending posts...');
  
  // Notify clients to run their sync
  const clients = await self.clients.matchAll({ type: 'window' });
  clients.forEach(client => {
    client.postMessage({ type: 'SYNC_POSTS' });
  });
}

// Listen for messages from client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skip waiting requested');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ 
      version: APP_VERSION,
      isCritical: IS_CRITICAL_UPDATE 
    });
  }

  if (event.data && event.data.type === 'TRIGGER_SYNC') {
    // Register a sync event
    self.registration.sync.register('sync-posts')
      .catch(() => {
        // Background sync not supported, notify client to sync manually
        event.source.postMessage({ type: 'SYNC_POSTS' });
      });
  }
});

// Push notification event
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const title = data.title || 'Fin & Feathers';
  const options = {
    body: data.body || 'New update available!',
    icon: data.icon || '/logo192.png',
    badge: data.badge || '/logo192.png',
    image: data.image,
    data: { url: data.url || '/' },
    vibrate: [200, 100, 200],
    tag: 'fin-feathers-notification',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Periodic Background Sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'check-updates') {
    event.waitUntil(checkForUpdates());
  }
});

async function checkForUpdates() {
  console.log('[SW] Checking for updates...');
  // This would typically fetch a version endpoint
  // For now, just log that we checked
}
