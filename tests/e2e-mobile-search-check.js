const {chromium}=require('/tmp/kanteen2026/node_modules/playwright');const cp=require('child_process');
(async()=>{const s=cp.spawn('python3',['-m','http.server','8434','-d','/tmp/kanteen2026'],{stdio:'ignore'});await new Promise(r=>setTimeout(r,500));
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
const c=await b.newContext({viewport:{width:390,height:844},locale:'ar-EG'});await c.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());const p=await c.newPage();await p.goto('http://127.0.0.1:8434/index.html');await new Promise(r=>setTimeout(r,2500));
const ov=await p.evaluate(()=>document.documentElement.scrollWidth);
await p.click('#k-search-btn');await new Promise(r=>setTimeout(r,800));
await p.screenshot({path:'/downloads/kt-search-open-390.png'});
const inp=await p.evaluate(()=>{const i=[...document.querySelectorAll('input[type=search],input')].filter(e=>{const r=e.getBoundingClientRect();return r.width>50&&r.height>10});return i.map(e=>[e.id,Math.round(e.getBoundingClientRect().width)])});
console.log('scrollWidth',ov,'visible inputs after tap',JSON.stringify(inp),'hash',await p.evaluate(()=>location.hash));
const el=await p.$('#k-search-input-m');if(el){await el.fill('لبن');await el.press('Enter');await new Promise(r=>setTimeout(r,1500));console.log('after enter hash',await p.evaluate(()=>location.hash),'barHidden',await p.evaluate(()=>document.getElementById('ktLocBar').classList.contains('k-hidden')),'bodyHasResults',await p.evaluate(()=>document.body.innerText.length));await p.screenshot({path:'/downloads/kt-search-results-390.png'})}else console.log('no input');
await b.close();s.kill()})()
