const {chromium}=require('/tmp/kanteen2026/node_modules/playwright');const cp=require('child_process');
const ROOT=process.env.ROOT,PORT=process.env.PORT||'8180';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let p=0,f=0;
const ok=(n,c,x)=>{c?p++:f++;console.log((c?'PASS ':'FAIL ')+n+(c?'':' :: '+JSON.stringify(x)))};
(async()=>{
 const srv=cp.spawn('python3',['-m','http.server',PORT,'-d',ROOT],{stdio:'ignore'});await sleep(500);
 const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
 const URL='http://127.0.0.1:'+PORT+'/index.html';
 const mk=async(opts={},init)=>{const ctx=await b.newContext({viewport:{width:390,height:844},...opts});await ctx.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/,r=>r.abort());if(init)await ctx.addInitScript(init);const pg=await ctx.newPage();pg.errs=[];pg.on('pageerror',e=>pg.errs.push(e.message));return pg};
 const vis=pg=>pg.evaluate(()=>{const e=document.getElementById('kPwaBanner');return e&&getComputedStyle(e).display!=='none'});
 // 1 unsupported browser (no beforeinstallprompt): banner shows, manual steps on Install
 let pg=await mk();await pg.goto(URL);await sleep(4800);
 ok('unsupported: banner shown after delay',await vis(pg));
 await pg.screenshot({path:'/downloads/kanteen-pwa-banner-ar-390.png'});
 await pg.click('#kPwaInstallBtn');await sleep(300);
 const man=await pg.evaluate(()=>{const m=document.getElementById('kPwaManual');return {hidden:m.hidden,t:m.textContent}});
 ok('unsupported: install shows manual steps',!man.hidden&&/المتصفح|المشاركة/.test(man.t),man);
 await pg.screenshot({path:'/downloads/kanteen-pwa-manual-ar-390.png'});
 // dismiss persists
 await pg.click('#kPwaClose');await sleep(300);
 ok('dismiss hides',!(await vis(pg)));
 await pg.reload();await sleep(4800);
 ok('after dismiss: no banner on reload',!(await vis(pg)));
 ok('dismiss flag stored',await pg.evaluate(()=>localStorage.getItem('kanteen:pwa_dismissed')==='true'));
 ok('no page errors (1)',pg.errs.length===0,pg.errs);
 // 2 EN + iOS manual
 pg=await mk({userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'},()=>{localStorage.setItem('kanteen:lang','"en"')});
 await pg.goto(URL);await sleep(4800);
 const en=await pg.evaluate(()=>[document.getElementById('kPwaTitle').textContent,document.getElementById('kPwaInstallBtn').textContent,document.getElementById('kPwaLater').textContent]);
 ok('EN banner texts',en[0]==='Install the Kanteen app'&&/Install now/.test(en[1])&&en[2]==='Later',en);
 await pg.click('#kPwaInstallBtn');await sleep(300);
 const mi=await pg.evaluate(()=>document.getElementById('kPwaManual').textContent);
 ok('iOS EN manual steps mention Share and Add to Home Screen',/Share/.test(mi)&&/Add to Home Screen/.test(mi),mi);
 await pg.screenshot({path:'/downloads/kanteen-pwa-ios-en-390.png'});
 // language switch updates banner
 await pg.evaluate(()=>{KT_LANG='ar';applyLang()});await sleep(200);
 ok('switch to AR updates banner+manual',await pg.evaluate(()=>/ثبّت/.test(document.getElementById('kPwaTitle').textContent)&&/المشاركة/.test(document.getElementById('kPwaManual').textContent)));
 ok('no page errors (2)',pg.errs.length===0,pg.errs);
 // 3 native prompt supported
 pg=await mk();await pg.goto(URL);await sleep(1200);
 await pg.evaluate(()=>{window.__prompted=0;const e=new Event('beforeinstallprompt');e.prompt=()=>{window.__prompted++;return Promise.resolve()};e.userChoice=Promise.resolve({outcome:'accepted'});window.dispatchEvent(e)});await sleep(400);
 ok('native: banner shown on beforeinstallprompt',await vis(pg));
 await pg.click('#kPwaInstallBtn');await sleep(500);
 ok('native: prompt() called, manual panel not shown',(await pg.evaluate(()=>window.__prompted))===1&&await pg.evaluate(()=>document.getElementById('kPwaManual').hidden));
 ok('native: banner hidden after choice',!(await vis(pg)));
 // 4 installed (standalone) -> no banner
 pg=await mk({},()=>{const mm=window.matchMedia.bind(window);window.matchMedia=q=>/display-mode: standalone/.test(q)?{matches:true,media:q,addEventListener(){},removeEventListener(){},addListener(){},removeListener(){}}:mm(q)});
 await pg.goto(URL);await sleep(4800);
 ok('standalone: no banner',!(await vis(pg)));
 // 5 installed flag
 pg=await mk({},()=>{localStorage.setItem('kanteen:pwa_installed','true')});await pg.goto(URL);await sleep(4800);
 ok('installed flag: no banner',!(await vis(pg)));
 // 6 appinstalled event
 pg=await mk();await pg.goto(URL);await sleep(4800);await pg.evaluate(()=>window.dispatchEvent(new Event('appinstalled')));await sleep(300);
 ok('appinstalled hides banner and sets flag',!(await vis(pg))&&await pg.evaluate(()=>localStorage.getItem('kanteen:pwa_installed')==='true'));
 // 7 desktop layout
 const d=await mk({viewport:{width:1280,height:800}});await d.goto(URL);await sleep(4800);await d.screenshot({path:'/downloads/kanteen-pwa-banner-1280.png'});
 ok('desktop banner shown',await vis(d));
 console.log(p+' pass '+f+' fail');await b.close();srv.kill();process.exit(f?1:0)})();
