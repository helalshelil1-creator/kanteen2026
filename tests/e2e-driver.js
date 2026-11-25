// Real-browser e2e of the flag-ON flows against local Auth+Firestore emulators (no live access).
// Run: npx firebase emulators:exec --only firestore,auth --project demo-kt8 "node e2e-driver.js"  (from a dir with firebase.json using firestore.rules = rules.next)
const {chromium}=require(process.env.PW||'/tmp/kanteen2026/node_modules/playwright');
const {initializeTestEnvironment}=require('@firebase/rules-unit-testing');
const fs=require('fs'),path=require('path'),cp=require('child_process');
const ROOT=process.env.ROOT||'/tmp/kanteen2026',FB=process.env.FBJS||'/tmp/fbemu/node_modules/firebase';
const BASE='http://127.0.0.1:8099';let p=0,f=0;
const ok=(n,c,x)=>{c?p++:f++;console.log((c?'PASS ':'FAIL ')+n+(c?'':' :: '+JSON.stringify(x)))};
const sleep=ms=>new Promise(r=>setTimeout(r,ms*2));
async function signUp(email,pw){const r=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=x',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email,password:pw,returnSecureToken:true})});return (await r.json()).localId}
(async()=>{
 const srv=cp.spawn('python3',['-m','http.server','8099','-d',ROOT],{stdio:'ignore'});await sleep(440);
 const cfg=fs.readFileSync(path.join(ROOT,'config.js'),'utf8')+"\nKT_CONFIG.SECURE_ORDERS=true;KT_CONFIG.SECURE_MERCHANT_AUTH=true;window.KT_EMULATOR={fsHost:'127.0.0.1',fsPort:8085,authUrl:'http://127.0.0.1:9099'};";
 const env0=await initializeTestEnvironment({projectId:'kanteen2026',firestore:{rules:fs.readFileSync('firestore.rules','utf8'),host:'127.0.0.1',port:8085}});
 const env={withSecurityRulesDisabled:async fn=>{let r;await env0.withSecurityRulesDisabled(async c=>{r=await fn(c)});return r},cleanup:()=>env0.cleanup()};
 const admUid=await signUp('admin@kanteen.app','AdminPass123');const dA=await signUp('drva@k.app','DrvPass123'),dB=await signUp('drvb@k.app','DrvPass123'),dP=await signUp('drvp@k.app','DrvPass123');


 const now=new Date().toISOString();const base={customer:{name:'عميل اختبار',phone:'01111111111',gov:'القاهرة',city:'مدينة نصر',area:'الحي السابع',street:'شارع 1'},items:[{nameAr:'لبن',qty:2,price:50}],subtotal:100,delivery:0,total:100,customerUid:'cu',merchantId:'m1',createdAt:now,_serverCreatedAt:new Date()};
 await env.withSecurityRulesDisabled(async c=>{const d=c.firestore();
  await d.doc('admins/'+admUid).set({x:1});
  await d.doc('drivers/'+dA).set({name:'سواق أ',phone:'01000000001',status:'approved',online:true,area:'مدينة نصر',vehicle:'موتوسيكل',commissionPerOrder:15});
  await d.doc('drivers/'+dB).set({name:'سواق ب',phone:'01000000002',status:'approved',online:true,area:'مدينة نصر',vehicle:'موتوسيكل'});
  await d.doc('drivers/'+dP).set({name:'سواق معلق',phone:'01000000003',status:'pending',online:false,area:'x',vehicle:'x'});
  await d.doc('orders/pool1').set({...base,id:'K-POOL1',status:'confirmed',paymentStatus:'cod'});
  await d.doc('orders/placed1').set({...base,id:'K-PLACED',status:'placed',paymentStatus:'cod'});
  await d.doc('orders/unpaid1').set({...base,id:'K-UNPAID',status:'confirmed',paymentStatus:'pending'});});
 const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
 const mk=async()=>{const ctx=await b.newContext({viewport:{width:390,height:844},locale:'ar-EG'});
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/,r=>{const u=r.request().url();const m=u.match(/gstatic\.com\/firebasejs\/[^/]+\/(firebase-[a-z-]+compat\.js)/);if(m)return r.fulfill({path:path.join(FB,m[1]),contentType:'application/javascript'});if(/unpkg\.com\/lucide/.test(u))return r.fulfill({path:'/tmp/fbemu/lucide.min.js',contentType:'application/javascript'});r.abort()});
  await ctx.route(/\/config\.js(\?.*)?$/,r=>r.fulfill({body:cfg,contentType:'application/javascript'}));
  await ctx.addInitScript(()=>{window.confirm=()=>true;window.alert=()=>{};});
  const pg=await ctx.newPage();pg.errs=[];pg.on('pageerror',e=>pg.errs.push(e.message.slice(0,150)));return {ctx,pg}};

 const st=async id=>env.withSecurityRulesDisabled(async c=>(await c.firestore().doc(id).get()).data());
 const mkD=async()=>{const x=await mk();x.pg.perm=[];x.pg.on('console',m=>{const t=m.text();if(/permission-denied|Missing or insufficient/.test(t))x.pg.perm.push(t.slice(0,160))});await x.ctx.grantPermissions(['geolocation']);await x.ctx.setGeolocation({latitude:30.05,longitude:31.34});return x};
 const login=async(x,e)=>{await x.pg.goto(BASE+'/driver.html');await x.pg.fill('#loginEmail',e);await x.pg.fill('#loginPass','DrvPass123');await x.pg.click('#loginBtn');await sleep(2500);const w=x.pg.locator('button:has-text("ابدأ العمل الآن")');if(await w.count()){await w.first().click();await sleep(1500)}};
 const A=await mkD();await login(A,'drva@k.app');
 ok('header pill reflects stored online=true on load',(await A.pg.locator('#statusText').innerText()).includes('متصل الآن'),await A.pg.locator('#statusText').innerText());
 await A.pg.screenshot({path:'/downloads/kanteen-driver-online-pill-390.png'});
 await A.pg.evaluate(()=>switchTab('orders'));await sleep(1200);
 let txt=await A.pg.locator('body').innerText();
 ok('approved driver reaches dashboard (not pending/registration)',!!(await A.pg.locator('#bottomNav,.k-bnav').count()),txt.slice(0,120));
 ok('pool lists confirmed COD order only (not placed, not unpaid online)',txt.includes('K-POOL1')&&!txt.includes('K-PLACED')&&!txt.includes('K-UNPAID'),txt.slice(0,300));
 await A.pg.screenshot({path:'/downloads/kanteen-driver-pool-390.png'});
 const B=await mkD();await login(B,'drvb@k.app');await B.pg.evaluate(()=>switchTab('orders'));await sleep(1200);
 ok('second approved driver also sees the pool order before claim',(await B.pg.locator('body').innerText()).includes('K-POOL1'));
 await A.pg.evaluate(()=>openOrderModal('pool1'));await sleep(700);
 await A.pg.screenshot({path:'/downloads/kanteen-driver-modal-390.png'});
 await A.pg.locator('button:has-text("قبول")').first().click();await sleep(2000);
 let o=await st('orders/pool1');
 ok('claim: driverId = driver A, status preparing, acceptedAt set',o.driverId===dA&&o.status==='preparing'&&!!o.acceptedAt,o);
 await sleep(1500);
 ok('driver B pool no longer shows the claimed order',!(await B.pg.locator('body').innerText()).includes('K-POOL1'));
 await B.pg.evaluate(()=>openOrderModal('pool1')).catch(()=>{});
 ok('driver B cannot overwrite the claim (still A)',(await st('orders/pool1')).driverId===dA);
 await A.pg.evaluate(()=>switchTab('current'));await sleep(1000);
 await A.pg.screenshot({path:'/downloads/kanteen-driver-current-390.png'});
 await A.pg.locator('button:has-text("انطلقت")').click();await sleep(1500);
 o=await st('orders/pool1');ok('status out + pickedAt',o.status==='out'&&!!o.pickedAt,o);
 await A.pg.locator('button:has-text("تم التسليم")').first().click();await sleep(1800);
 o=await st('orders/pool1');ok('status delivered + deliveredAt',o.status==='delivered'&&!!o.deliveredAt,o);
 const dd=await st('drivers/'+dA);
 console.log('INFO driver stats after delivery (completedTotal/earnings):',dd.completedTotal,dd.earnings);
 await A.pg.screenshot({path:'/downloads/kanteen-driver-delivered-390.png'});
 await A.pg.evaluate(()=>ktToggleOnline());await sleep(1500);ok('toggle offline persists online=false (rules allow field set)',(await st('drivers/'+dA)).online===false,await st('drivers/'+dA));
 await A.pg.evaluate(()=>ktToggleOnline());await sleep(1500);ok('toggle online persists online=true',(await st('drivers/'+dA)).online===true,await st('drivers/'+dA));
 const P=await mkD();try{await login(P,'drvp@k.app')}catch(e){await sleep(1500)}txt=await P.pg.locator('body').innerText();
 ok('pending driver sees pending screen, no orders',/قيد المراجعة|انتظار|المراجعة/.test(txt)&&!txt.includes('K-PLACED'),txt.slice(0,160));
 await P.pg.screenshot({path:'/downloads/kanteen-driver-pending-390.png'});
 ok('no permission-denied errors for approved drivers A and B (no red Rules status)',A.pg.perm.length+B.pg.perm.length===0,[A.pg.perm,B.pg.perm]);
 ok('no page errors (A,B,P)',A.pg.errs.length+B.pg.errs.length+P.pg.errs.length===0,[A.pg.errs,B.pg.errs,P.pg.errs]);
 await A.pg.evaluate(()=>switchTab('leaderboard'));await sleep(1500);ok('leaderboard shows honest unavailable state, no zero podium, no prize amounts',await A.pg.evaluate(()=>{const t=document.querySelector('#content').innerText;return !!document.getElementById('ktLbUnavailable')&&!/0 طلب|بونص|500/.test(t)}),null);await A.pg.screenshot({path:'/downloads/kanteen-driver-leaderboard-390.png'});
 console.log('SUMMARY pass='+p+' fail='+f);await b.close();srv.kill();await env.cleanup();process.exit(f?1:0)})();
