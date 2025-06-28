// Service Worker za Pilana App
const CACHE_NAME = 'pilana-app-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/favicon.ico',
  '/icons/apple-touch-icon.png'
];

// Install event - cache osnovne resurse
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Fetch event - serve iz cache-a ako je dostupan
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Vrati iz cache-a ako postoji
        if (response) {
          return response;
        }
        
        // Inače fetch iz network-a
        return fetch(event.request).then(
          (response) => {
            // Provjeri da li je validan response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Kloniraj response
            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

// Activate event - cleanup starih cache-ova
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Background sync za offline funkcionalnost
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

function doBackgroundSync() {
  // Implementacija background sync-a
  console.log('Background sync triggered');
  return Promise.resolve();
}

// Push notification podrška
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nova obavještenja',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Otvori aplikaciju',
        icon: '/icons/icon-192x192.png'
      },
      {
        action: 'close',
        title: 'Zatvori',
        icon: '/icons/icon-192x192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Pilana App', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
}); 