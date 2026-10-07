// Offline-capable cache for HabitRabbit.
// Network-first for the app page (so updates show up on the next open),
// cache-first for everything else. Bump CACHE_NAME when files change.
var CACHE_NAME = 'habit-tracker-v7';
var APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

self.addEventListener('install', function(event){
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return Promise.all(APP_SHELL.map(function(url){
        return fetch(new Request(url, {cache: 'reload'})).then(function(res){
          if(res.ok) return cache.put(url, res);
        });
      }));
    })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(key){ return key !== CACHE_NAME; })
            .map(function(key){ return caches.delete(key); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event){
  if(event.request.method !== 'GET') return;
  var isPage = event.request.mode === 'navigate' ||
               new URL(event.request.url).pathname.endsWith('/index.html');
  if(isPage){
    event.respondWith(
      fetch(event.request, {cache: 'reload'}).then(function(response){
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put('./index.html', copy); });
        return response;
      }).catch(function(){
        return caches.match('./index.html');
      })
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(function(cached){
      return cached || fetch(event.request);
    })
  );
});
