// (1) GPS permission denied after an explicit My Location / Nearby tap keeps its failure feedback visible; load-time failure stays hidden.
// (2) Tablet 600px AR/EN header fit. Geolocation stubbed (denied), all non-local requests aborted, no data writes.
const {chromium}=require(process.env.PW||'/tmp/kanteen2026/node_modules/playwright');const cp=require('child_process');
const PORT=8442,BASE='http://127.0.0.1:'+PORT,OUT=process.env.OUT||'/downloads';let p=0,f=0;
const ok=(n,c,x)=>{c?p++:f++;console.log((c?'PASS ':'FAIL ')+n+(c?'':' :: '+JSON.stringify(x)))};const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const s=cp.spawn('python3',['-m','http.server',PORT,'-d',process.env.ROOT||'/tmp/kanteen2026'],{stdio:'ignore'});await sleep(500);
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const mk=async(w,lang)=>{const c=await b.newContext({viewport:{width:w,height:844},locale:lang==='en'?'en-US':'ar-EG'});
 await c.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());
 await c.addInitScript(()=>{window.__geo=0;Object.defineProperty(navigator,'geolocation',{value:{getCurrentPosition(a,e){window.__geo++;setTimeout(()=>e&&e({code:1,message:'denied'}),30)},watchPosition(){return 1},clearWatch(){}},configurable:true})});
 const pg=await c.newPage();await pg.goto(BASE+'/index.html');await sleep(2600);if(lang==='en'){await pg.evaluate(()=>{if(typeof ktToggleLang==='function'&&document.documentElement.lang!=='en')ktToggleLang()});await sleep(700)}return {c,pg}};
const vis=(pg,sel)=>pg.evaluate(s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return getComputedStyle(e).display!=='none'&&r.width>0},sel);
// (1)
{const {c,pg}=await mk(390,'ar');
 await pg.click('#k-search-btn');await sleep(700);
 ok('load-time failure line hidden when bar opened for search',(await vis(pg,'#ktLocStatus'))===false);
 const g0=await pg.evaluate(()=>window.__geo);
 await pg.click('.kt-locbar-btn');await sleep(4500);
 ok('explicit My Location tap: GPS requested',(await pg.evaluate(()=>window.__geo))>g0,g0);
 const t=await pg.evaluate(()=>document.getElementById('ktLocText').innerText);
 ok('explicit My Location denied: failure line visible',(await vis(pg,'#ktLocStatus'))===true,t);
 console.log('INFO status text after denied tap:',t);
 await pg.screenshot({path:OUT+'/kt-loc-denied-explicit-390.png'});
 await pg.click('#k-search-btn');await sleep(500);await pg.click('#k-search-btn');await sleep(700);
 ok('reopening the bar for search hides the stale failure again',(await vis(pg,'#ktLocStatus'))===false);
 const g1=await pg.evaluate(()=>window.__geo);
 await pg.click('.kt-locbar-submit:has-text("القريبة")');await sleep(4500);
 const toast=await pg.evaluate(()=>document.body.innerText.match(/لم نتمكن[^\n]*/)?.[0]||'');
 ok('Nearby stores tap: GPS requested and failure feedback shown (toast or status)',(await pg.evaluate(()=>window.__geo))>g1&&(/لم نتمكن|فشل/.test(toast)||(await vis(pg,'#ktLocStatus'))===true),toast);
 await c.close()}
// (2)
for(const lang of ['ar','en']){const {c,pg}=await mk(600,lang);
 const hdr=await pg.evaluate(()=>[...document.querySelectorAll('#k-header button, #k-header .k-logo')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&getComputedStyle(e).display!=='none'}).map(e=>{const r=e.getBoundingClientRect();return {id:e.id||e.className.toString().slice(0,14),x:Math.round(r.left),w:Math.round(r.width),h:Math.round(r.height),svg:!!e.querySelector('svg path,svg circle,svg line,svg rect')}}));
 const btns=hdr.filter(h=>/k-.*-btn|ktLangBtn/.test(h.id));
 ok('600/'+lang+' header buttons inside viewport, >=32px, icons present',btns.every(h=>h.x>=0&&h.x+h.w<=600&&h.w>=32&&h.h>=32)&&btns.filter(h=>h.id!=='ktLangBtn').every(h=>h.svg),btns);
 ok('600/'+lang+' no horizontal overflow',await pg.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),0);
 await pg.screenshot({path:OUT+'/kt-hdr-600-'+lang+'.png',clip:{x:0,y:0,width:600,height:90}});
 await pg.click('#k-search-btn');await sleep(600);await pg.fill('#k-search-input-m',lang==='en'?'milk':'لبن');await pg.press('#k-search-input-m','Enter');await sleep(1400);
 ok('600/'+lang+' product search routes',await pg.evaluate(()=>/#\/search\?q=/.test(location.hash)),0);
 await c.close()}
console.log('SUMMARY pass='+p+' fail='+f);await b.close();s.kill()})()
