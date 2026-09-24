/* ═══════════════════════════════════════════════════════════
   🍊 Kanteen — Service Worker (PWA)
   ═══════════════════════════════════════════════════════════ */
const CACHE_NAME = 'kanteen-v2.0.0';
const CACHE_URLS = [
  '/', '/index.html', '/admin.html', '/merchant.html', '/driver.html',
  '/logo.png', '/manifest.json'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(CACHE_URLS).catch(function(err){
        console.warn('Cache partial fail:', err);
      });
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; })
            .map(function(k){ return caches.delete(k); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event){
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (url.pathname.indexOf('/api/') === 0) return;

  event.respondWith(
    fetch(req).then(function(res){
      var resClone = res.clone();
      caches.open(CACHE_NAME).then(function(cache){
        cache.put(req, resClone).catch(function(){});
      });
      return res;
    }).catch(function(){
      return caches.match(req).then(function(cached){
        if (cached) return cached;
        if (req.headers.get('accept') && req.headers.get('accept').indexOf('text/html') !== -1){
          return caches.match('/index.html');
        }
        return new Response('Offline', { status: 503, statusText: 'Offline' });
      });
    })
  );
});

self.addEventListener('message', function(event){
  if (event.data && event.data.type === 'SKIP_WAITING'){ self.skipWaiting(); }
});

self.addEventListener('push', function(event){
  var data = event.data ? event.data.json() : {};
  var title = data.title || 'كانتِين | Kanteen';
  var options = {
    body: data.body || 'لديك إشعار جديد',
    icon: '/logo.png', badge: '/logo.png',
    vibrate: [200, 100, 200], dir: 'rtl', lang: 'ar',
    data: { url: data.url || '/' }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event){
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url || '/'));
});