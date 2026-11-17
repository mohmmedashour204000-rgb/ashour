const C='zabtaha-aa73353e13';
const PRE=['./','seed.js','fonts/fonts.css','manifest.webmanifest','logo/icon-192.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(PRE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET'||new URL(r.url).origin!==location.origin)return;
 const html=r.mode==='navigate'||/\.(html|js)$/.test(new URL(r.url).pathname)&&!/xlsx/.test(r.url)||new URL(r.url).pathname.endsWith('/');
 if(html){e.respondWith(new Promise(res=>{let done=false;const hit=()=>caches.match(r,{ignoreSearch:true}).then(m=>{if(m&&!done){done=true;res(m)}});
  const t=setTimeout(hit,2500);fetch(r).then(n=>{clearTimeout(t);if(n.ok){const cp=n.clone();caches.open(C).then(c=>c.put(r,cp))}if(!done){done=true;res(n)}}).catch(()=>{clearTimeout(t);hit().then(()=>{if(!done)res(Response.error())})})}))}
 else e.respondWith(caches.match(r).then(m=>m||fetch(r).then(n=>{if(n.ok){const cp=n.clone();caches.open(C).then(c=>c.put(r,cp))}return n})))});
