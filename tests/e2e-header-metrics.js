const {chromium}=require('/tmp/kanteen2026/node_modules/playwright');const cp=require('child_process');
(async()=>{const s=cp.spawn('python3',['-m','http.server','8433','-d','/tmp/kanteen2026'],{stdio:'ignore'});await new Promise(r=>setTimeout(r,500));
const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
for(const w of [390,360,320]){const c=await b.newContext({viewport:{width:w,height:844},locale:'ar-EG'});await c.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());const p=await c.newPage();await p.goto('http://127.0.0.1:8433/index.html');await new Promise(r=>setTimeout(r,2500));
const m=await p.evaluate(()=>{const h=document.querySelector('header,.header,#header,.topbar')||document.body;const out=[];h.querySelectorAll('input,button,a,img,select').forEach(e=>{const r=e.getBoundingClientRect();if(r.width&&r.top<120)out.push([e.tagName,e.id||e.className.toString().slice(0,30),Math.round(r.left),Math.round(r.top),Math.round(r.width),Math.round(r.height)])});return {hdr:h.tagName+'.'+h.className,items:out}});
console.log(w,JSON.stringify(m));await p.screenshot({path:'/downloads/kt-hdr-'+w+'.png',clip:{x:0,y:0,width:w,height:160}});await c.close()}
await b.close();s.kill()})()
