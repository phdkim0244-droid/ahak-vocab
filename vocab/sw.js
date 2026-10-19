/* ahak-vocab 서비스 워커 — 설치 시 전체 자산 프리캐시, 캐시 우선, 새 버전 자동 교체 (tools/build.py 가 생성) */
const VERSION='c9c0acd705';
const CACHE='ahak-vocab-'+VERSION;
const ASSETS=["./", "./index.html", "./data.js", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png", "./apple-touch-icon.png", "../shared/fonts/NotoSerifKR-hanja.woff2"];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('ahak-vocab-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request; if(req.method!=='GET') return;
  const url=new URL(req.url); if(url.origin!==location.origin) return;
  e.respondWith(
    caches.match(req,{ignoreSearch:true}).then(hit=>hit||fetch(req).then(res=>{
      if(res&&res.ok&&res.type==='basic'){ const copy=res.clone(); caches.open(CACHE).then(c=>c.put(req,copy)); }
      return res;
    }).catch(()=>req.mode==='navigate'?caches.match('./index.html'):undefined))
  );
});
