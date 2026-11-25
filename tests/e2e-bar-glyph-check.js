const {chromium}=require('/tmp/kanteen2026/node_modules/playwright');const cp=require('child_process');
(async()=>{const s=cp.spawn('python3',['-m','http.server','8443','-d','/tmp/kanteen2026'],{stdio:'ignore'});await new Promise(r=>setTimeout(r,500));
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
for(const l of ['ar','en']){const c=await b.newContext({viewport:{width:390,height:844},locale:l==='en'?'en-US':'ar-EG'});await c.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());const p=await c.newPage();await p.goto('http://127.0.0.1:8443/index.html');await new Promise(r=>setTimeout(r,2500));
if(l==='en'){await p.evaluate(()=>ktToggleLang());await new Promise(r=>setTimeout(r,800))}
await p.click('#k-search-btn');await new Promise(r=>setTimeout(r,800));
console.log(l,await p.evaluate(()=>[...document.querySelectorAll('.kt-locbar-btn,.kt-locbar-submit')].map(e=>[e.innerText.trim(),!!e.querySelector('svg path,svg circle,svg rect'),/[\u{1F300}-\u{1FAFF}]/u.test(e.textContent)])));
await p.screenshot({path:'/downloads/kt-bar-glyphs-'+l+'.png',clip:{x:0,y:70,width:390,height:230}});await c.close()}
await b.close();s.kill()})()
