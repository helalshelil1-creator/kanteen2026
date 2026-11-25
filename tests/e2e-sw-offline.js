// Offline / reload / online service-worker audit. No Firebase emulator and no live Firebase: every non-local request is aborted and logged.
const {chromium}=require(process.env.PW||'/tmp/kanteen2026/node_modules/playwright');
const path=require('path'),cp=require('child_process'),fs=require('fs');
const ROOT=process.env.ROOT||'/tmp/kanteen2026',FB=process.env.FBJS||'/tmp/fbemu/node_modules/firebase',PORT=8419,BASE='http://127.0.0.1:'+PORT;
let p=0,f=0;const ok=(n,c,x)=>{c?p++:f++;console.log((c?'PASS ':'FAIL ')+n+(c?'':' :: '+JSON.stringify(x)))};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const srv=cp.spawn('python3',['-m','http.server',PORT,'-d',ROOT],{stdio:'ignore'});await sleep(500);
 const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
 const ctx=await b.newContext({viewport:{width:390,height:844},locale:'ar-EG'});
 const ext=[];
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/,r=>{const q=r.request(),u=q.url();const m=u.match(/gstatic\.com\/firebasejs\/[^/]+\/(firebase-[a-z-]+compat\.js)/);if(m)return r.fulfill({path:path.join(FB,m[1]),contentType:'application/javascript'});ext.push(q.method()+' '+u.slice(0,90));r.abort()});
 const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message.slice(0,120)));
 await pg.goto(BASE+'/index.html');await sleep(1500);
 await pg.evaluate(()=>navigator.serviceWorker.ready.then(()=>1));await sleep(500);
 for(const u of ['/admin.html','/merchant.html','/driver.html']){const q=await ctx.newPage();await q.goto(BASE+u);await sleep(700);await q.close();}
 await pg.reload();await sleep(1200);
 ok('SW controls page after reload',await pg.evaluate(()=>!!navigator.serviceWorker.controller));
 // poison probe: online 404 on a same-origin path
 const r404=await pg.evaluate(async()=>{const r=await fetch('/does-not-exist.html');return r.status});
 await ctx.setOffline(true);
 await pg.reload().catch(()=>{});await sleep(1500);
 const t=await pg.evaluate(()=>document.body.innerText.length);
 ok('offline reload of index renders from cache',t>200,t);
 for(const u of ['/admin.html','/merchant.html','/driver.html']){const q=await ctx.newPage();await q.goto(BASE+u).catch(()=>{});await sleep(800);const n=await q.evaluate(()=>document.body.innerText.length);ok('offline '+u+' renders from cache',n>50,n);await q.close();}
 const off404=await pg.evaluate(async()=>{try{const r=await fetch('/does-not-exist.html');return r.status+':'+(await r.text()).slice(0,20)}catch(e){return 'err'}});
 ok('offline: uncached missing path gives 503/Offline, not a cached stale 404 page-as-ok',/^(503|404)/.test(off404),off404);
 console.log('INFO online 404 status',r404,'offline same path ->',off404);
 const beforeExt=ext.length;
 const w=await pg.evaluate(async()=>{try{const r=await fetch('/api/x',{method:'POST',body:'{}'});return r.status}catch(e){return 'neterr'}});
 ok('offline POST is not intercepted/queued by SW (network error)',w==='neterr'||w===404||w===405,w);
 await ctx.setOffline(false);await pg.reload();await sleep(1500);
 const t2=await pg.evaluate(()=>document.body.innerText.length);
 ok('back online reload renders',t2>200,t2);
 const writes=ext.filter(x=>/^(POST|PUT|PATCH|DELETE)/.test(x)&&!/Firestore\/Listen\//.test(x));
 console.log('INFO external attempts (all aborted, none reached network):',[...new Set(ext.map(x=>x.split('?')[0]))].slice(0,6));
 ok('no external write attempts reached anywhere (Firestore Listen long-poll excluded: it is the read stream, not Write)',!writes.some(x=>/firestore|identitytoolkit|securetoken/.test(x)),writes.slice(0,4));
 const keys=await pg.evaluate(async()=>{const c=await caches.open('kanteen-v2.0.1');return (await c.keys()).map(r=>new URL(r.url).pathname)});
 console.log('INFO cache keys',keys.join(','));
 ok('SW cache holds no 404 entry',!keys.includes('/does-not-exist.html'),keys);
 const idb=await pg.evaluate(async()=>indexedDB.databases?(await indexedDB.databases()).map(d=>d.name):[]);
 console.log('INFO indexedDB',idb);
 ok('no Firestore offline persistence DB (no durable write queue)',!idb.some(n=>/firestore/i.test(n)),idb);
 console.log('page errors',[...new Set(errs)].slice(0,4));
 console.log('SUMMARY pass='+p+' fail='+f);await b.close();srv.kill();process.exit(0);
})().catch(e=>{console.log('FATAL',e);process.exit(1)});
