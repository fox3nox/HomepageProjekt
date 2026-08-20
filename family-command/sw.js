const CACHE='family-command-v2';
const ASSETS=['./','./index.html','./styles.css?v=20260820-1','./app.js?v=20260820-1','./manifest.webmanifest'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).catch(()=>{}));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(fetch(e.request).then(r=>{const copy=r.clone();caches.open(CACHE).then(c=>c.put(e.request,copy)).catch(()=>{});return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))))});
self.addEventListener('push',e=>{let p={};try{p=e.data?e.data.json():{}}catch(_){p={body:e.data?e.data.text():''}}e.waitUntil(self.registration.showNotification(p.title||'Family Command',{body:p.body||'',tag:p.tag||'family-command',data:{url:p.url||'./'},icon:undefined,badge:undefined}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const target=new URL('./',self.location.href).href;e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(list=>{for(const w of list){if('focus'in w){w.navigate(target);return w.focus()}}return clients.openWindow(target)}))});
