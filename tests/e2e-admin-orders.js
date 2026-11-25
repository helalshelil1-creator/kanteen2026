// Real-browser e2e of the flag-ON flows against local Auth+Firestore emulators (no live access).
// Run: npx firebase emulators:exec --only firestore,auth --project demo-kt8 "node e2e-admin-orders.js"  (from a dir with firebase.json using firestore.rules = rules.next)
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
 const admUid=await signUp('admin@kanteen.app','AdminPass123');

 await env.withSecurityRulesDisabled(async c=>{const d=c.firestore();
  await d.doc('admins/'+admUid).set({x:1});
  await d.doc('drivers/dP').set({name:'مندوب جديد',phone:'01000000010',status:'pending',online:false,area:'مدينة نصر',vehicle:'موتوسيكل'});
  await d.doc('drivers/dR').set({name:'مندوب للرفض',phone:'01000000012',status:'pending',online:false,area:'x',vehicle:'عجلة'});
  await d.doc('drivers/dA').set({name:'مندوب معتمد',phone:'01000000011',status:'approved',online:true,area:'المعادي',vehicle:'سيارة'});
  await d.doc('notifications/n1').set({type:'new_driver',driverName:'مندوب جديد',phone:'01000000010',read:false,createdAt:new Date().toISOString(),_serverCreatedAt:new Date()});
  await d.doc('notifications/n2').set({type:'new_order',orderId:'K1',total:100,read:false,createdAt:new Date().toISOString(),_serverCreatedAt:new Date()});
  await d.doc('orders/o1').set({id:'K-1',customerUid:'cu',status:'placed',total:100,items:[{nameAr:'لبن',qty:1,price:100}],customer:{name:'عميل',phone:'01111111111'},createdAt:new Date().toISOString(),_serverCreatedAt:new Date()});});
 const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
 const mk=async()=>{const ctx=await b.newContext({viewport:{width:390,height:844},locale:'ar-EG'});
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/,r=>{const u=r.request().url();const m=u.match(/gstatic\.com\/firebasejs\/[^/]+\/(firebase-[a-z-]+compat\.js)/);if(m)return r.fulfill({path:path.join(FB,m[1]),contentType:'application/javascript'});r.abort()});
  await ctx.route(/\/config\.js(\?.*)?$/,r=>r.fulfill({body:cfg,contentType:'application/javascript'}));
  await ctx.addInitScript(()=>{window.confirm=()=>true;window.alert=()=>{};});
  const pg=await ctx.newPage();pg.errs=[];pg.on('pageerror',e=>pg.errs.push(e.message.slice(0,150)));return {ctx,pg}};
 const st=async id=>env.withSecurityRulesDisabled(async c=>(await c.firestore().doc(id).get()).data());

 await env.withSecurityRulesDisabled(async c=>{const d=c.firestore();await d.doc('orders/o2').set({id:'K-2',customerUid:'cu',merchantId:'m1',status:'preparing',total:240,items:[{nameAr:'أرز',qty:2,price:120}],customer:{name:'عميل ثاني',phone:'01122222222',gov:'القاهرة',city:'مدينة نصر'},createdAt:new Date().toISOString(),_serverCreatedAt:new Date()});});
 const ad=await mk();await ad.pg.goto(BASE+'/admin.html');await ad.pg.fill('#inpEmail','admin@kanteen.app');await ad.pg.fill('#inpPass','AdminPass123');await ad.pg.click('#loginBtn');await sleep(1500);
 await ad.pg.evaluate(()=>switchTab('orders'));await sleep(1100);
 let txt=await ad.pg.locator('#content').innerText();
 ok('orders tab lists the placed order (K-1) with customer, total',txt.includes('K-1')&&txt.includes('عميل'),txt.slice(0,250));
 await ad.pg.screenshot({path:'/downloads/kanteen-admin-orders-review-390.png'});
 await ad.pg.evaluate(()=>ktViewOrderDetails('o1'));await sleep(700);
 const m=await ad.pg.locator('.k-modal,#modal,[class*=modal]').first().innerText().catch(()=>'');
 ok('details modal shows order id, item and a confirm button',m.includes('K-1')&&m.includes('لبن')&&m.includes('تأكيد'),m.slice(0,200));
 await ad.pg.screenshot({path:'/downloads/kanteen-admin-order-modal-390.png'});
 await ad.pg.evaluate(()=>closeModal());await sleep(300);
 await ad.pg.locator('.k-merchant-card:has-text("K-1") button:has-text("تأكيد")').first().click();await sleep(1400);
 const o=await st('orders/o1');ok('admin confirm: status confirmed, confirmedAt, confirmedBy admin, history entry',o.status==='confirmed'&&!!o.confirmedAt&&o.confirmedBy==='admin'&&(o.statusHistory||[]).some(x=>x.status==='confirmed'),o);
 await ad.pg.evaluate(()=>switchTab('orders'));await sleep(1000);
 txt=await ad.pg.locator('#content').innerText();
 ok('all-orders tab lists both orders (K-1 confirmed, K-2 preparing)',txt.includes('K-1')&&txt.includes('K-2'),txt.slice(0,300));
 await ad.pg.screenshot({path:'/downloads/kanteen-admin-orders-all-390.png'});
 ok('no page errors',ad.pg.errs.length===0,ad.pg.errs);
 console.log('SUMMARY pass='+p+' fail='+f);await b.close();srv.kill();await env.cleanup();process.exit(f?1:0)})();
