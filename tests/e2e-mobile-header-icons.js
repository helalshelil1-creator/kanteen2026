// Header icons + mobile product search at 390/320/1100, AR/EN. All non-local requests aborted (icons must come from /vendor, not a CDN). Counts geolocation calls.
const {chromium}=require(process.env.PW||'/tmp/kanteen2026/node_modules/playwright');const cp=require('child_process');
const PORT=8441,BASE='http://127.0.0.1:'+PORT,OUT=process.env.OUT||'/downloads';let p=0,f=0;
const ok=(n,c,x)=>{c?p++:f++;console.log((c?'PASS ':'FAIL ')+n+(c?'':' :: '+JSON.stringify(x)))};const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const s=cp.spawn('python3',['-m','http.server',PORT,'-d',process.env.ROOT||'/tmp/kanteen2026'],{stdio:'ignore'});await sleep(500);
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
for(const [w,lang] of [[390,'ar'],[390,'en'],[320,'ar'],[1100,'ar']]){
 const c=await b.newContext({viewport:{width:w,height:w>800?800:844},locale:lang==='en'?'en-US':'ar-EG'});
 await c.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());
 await c.addInitScript(()=>{window.__geo=0;const g={getCurrentPosition(a,e){window.__geo++;e&&e({code:1})},watchPosition(){window.__geo++;return 1},clearWatch(){}};Object.defineProperty(navigator,'geolocation',{value:g,configurable:true})});
 const pg=await c.newPage();await pg.goto(BASE+'/index.html');await sleep(2500);
 if(lang==='en'){await pg.evaluate(()=>{if(typeof ktToggleLang==='function'&&document.documentElement.lang!=='en')ktToggleLang()});await sleep(800)}
 const hdr=await pg.evaluate(()=>[...document.querySelectorAll('#k-header button, #k-header .k-logo')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&getComputedStyle(e).display!=='none'}).map(e=>{const r=e.getBoundingClientRect();return {id:e.id||e.className.toString().slice(0,18),x:Math.round(r.left),w:Math.round(r.width),h:Math.round(r.height),svg:!!e.querySelector('svg path,svg circle,svg line,svg rect'),lab:e.getAttribute('aria-label')||''}}));
 const btns=hdr.filter(h=>/k-.*-btn|ktLangBtn/.test(h.id));
 ok(w+'/'+lang+' header buttons all inside viewport',btns.every(h=>h.x>=0&&h.x+h.w<=w),btns);
 ok(w+'/'+lang+' icon buttons render a real SVG (not empty frames)',btns.filter(h=>h.id!=='ktLangBtn').every(h=>h.svg),btns);
 ok(w+'/'+lang+' tap targets >= 32px',btns.every(h=>h.w>=32&&h.h>=32),btns.map(h=>h.id+':'+h.w+'x'+h.h));
 ok(w+'/'+lang+' no horizontal overflow',await pg.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),0);
 await pg.screenshot({path:OUT+'/kt-hdr-'+w+'-'+lang+'.png',clip:{x:0,y:0,width:w,height:90}});
 const geo0=await pg.evaluate(()=>window.__geo);
 if(w<=768){await pg.click('#k-search-btn');await sleep(700);
  const geo1=await pg.evaluate(()=>window.__geo);ok(w+'/'+lang+' opening product search calls geolocation 0 extra times',geo1===geo0,[geo0,geo1]);
  const st=await pg.evaluate(()=>{const e=document.getElementById('ktLocStatus');return e?e.innerText.trim().slice(0,40)+'|'+getComputedStyle(e).display:''});console.log('INFO loc status row text',st);ok(w+'/'+lang+' GPS failure line hidden in the product search bar',/\|none$/.test(st),st);
  await pg.screenshot({path:OUT+'/kt-search-open-'+w+'-'+lang+'.png'});
  const q=lang==='en'?'milk':'لبن';await pg.fill('#k-search-input-m',q);await pg.press('#k-search-input-m','Enter');await sleep(1500);
  const r=await pg.evaluate(()=>({h:location.hash,t:document.body.innerText.slice(0,300)}));
  ok(w+'/'+lang+' product search routes to results',/#\/search\?q=/.test(r.h),r.h);
  await pg.screenshot({path:OUT+'/kt-search-results-'+w+'-'+lang+'.png'});
 } else {
  await pg.fill('#k-search-input',lang==='en'?'milk':'لبن');await pg.press('#k-search-input','Enter');await sleep(1500);
  ok('1100 desktop header search routes',await pg.evaluate(()=>/#\/search\?q=/.test(location.hash)),0);
  await pg.screenshot({path:OUT+'/kt-search-results-1100-ar.png'});
 }
 await c.close()}
console.log('SUMMARY pass='+p+' fail='+f);await b.close();s.kill()})()
