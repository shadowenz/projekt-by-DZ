// Przy zmianach plików zwiększ numer wersji, np. etap8-v3 na etap8-v3.
const CACHE_PREFIX='projekt-by-dz:'+self.registration.scope+':';
const CACHE=CACHE_PREFIX+'etap8-v3';
const ASSETS=['./','./index.html','./style.css','./app.js','./speech.js','./transcription.js','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(CACHE_PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(url.origin!==self.location.origin)return;
 const assetURL=ASSETS.map(path=>new URL(path,self.registration.scope)).find(asset=>asset.pathname===url.pathname);
 if(!assetURL)return;
 event.respondWith(caches.open(CACHE).then(async cache=>{
  const cached=await cache.match(assetURL.href);
  return cached||fetch(event.request);
 }));
});
