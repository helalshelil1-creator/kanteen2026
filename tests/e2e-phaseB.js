// Real-browser e2e of the flag-ON flows against local Auth+Firestore emulators (no live access).
// Run: npx firebase emulators:exec --only firestore,auth --project demo-kt8 "node e2e-secure-flags.js"  (from a dir with firebase.json using firestore.rules = rules.next)
const {chromium}=require(process.env.PW||'/tmp/kanteen2026/node_modules/playwright');
const {initializeTestEnvironment}=require('@firebase/rules-unit-testing');
const fs=require('fs'),path=require('path'),cp=require('child_process');
const ROOT=process.env.ROOT||'/tmp/kanteen2026',FB=process.env.FBJS||'/tmp/fbemu/node_modules/firebase';
const BASE='http://127.0.0.1:8099';let p=0,f=0;
const ok=(n,c,x)=>{c?p++:f++;console.log((c?'PASS ':'FAIL ')+n+(c?'':' :: '+JSON.stringify(x)))};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function signUp(email,pw){const r=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=x',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email,password:pw,returnSecureToken:true})});return (await r.json()).localId}
(async()=>{
 const srv=cp.spawn('python3',['-m','http.server','8099','-d',ROOT],{stdio:'ignore'});await sleep(440);
 const cfg=fs.readFileSync(path.join(ROOT,'config.js'),'utf8')+"\nKT_CONFIG.SECURE_ORDERS=true;KT_CONFIG.SECURE_MERCHANT_AUTH=true;window.KT_EMULATOR={fsHost:'127.0.0.1',fsPort:8085,authUrl:'http://127.0.0.1:9099'};";
 const env0=await initializeTestEnvironment({projectId:'kanteen2026',firestore:{rules:fs.readFileSync('firestore.rules','utf8'),host:'127.0.0.1',port:8085}});
 const env={withSecurityRulesDisabled:async fn=>{let r;await env0.withSecurityRulesDisabled(async c=>{r=await fn(c)});return r},cleanup:()=>env0.cleanup()};
 const admUid=await signUp('admin@kanteen.app','AdminPass123');
 const ownUid=await signUp('201000000001@merchants.kanteen.invalid','NewPass123');
 await env.withSecurityRulesDisabled(async c=>{const d=c.firestore();
  await d.doc('admins/'+admUid).set({x:1});
  const prod=[{id:'p1',name:'لبن',price:25,stock:8,emoji:'🥛'}];
  await d.doc('merchants/mLeg').set({name:'متجر قديم',phone:'+201000000001',status:'approved',ownerUid:ownUid,owner:'x',address:'a',products:prod,whatsapp:'+201000000001'});
  await d.doc('merchantsPublic/mLeg').set({name:'متجر قديم',phone:'+201000000001',status:'approved',products:prod,whatsapp:'+201000000001'});
  await d.doc('merchants/mLeg/stock/p1').set({qty:8});});
 const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
 const mk=async(cfgX)=>{const ctx=await b.newContext({viewport:{width:1100,height:900},locale:'ar-EG'});
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/,r=>{const u=r.request().url();const m=u.match(/gstatic\.com\/firebasejs\/[^/]+\/(firebase-[a-z-]+compat\.js)/);if(m)return r.fulfill({path:path.join(FB,m[1]),contentType:'application/javascript'});r.abort()});
  await ctx.route(/\/config\.js(\?.*)?$/,r=>r.fulfill({body:cfgX||cfg,contentType:'application/javascript'}));
  await ctx.addInitScript(()=>{window.confirm=()=>true;});
  const pg=await ctx.newPage();pg.errs=[];pg.on('pageerror',e=>pg.errs.push(e.message.slice(0,150)));pg.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|net::ERR/.test(m.text()))pg.errs.push('console:'+m.text().slice(0,150))});return {ctx,pg}};
 const ad=await mk();await ad.pg.goto(BASE+'/admin.html');await ad.pg.fill('#inpEmail','admin@kanteen.app');await ad.pg.fill('#inpPass','AdminPass123');await ad.pg.click('#loginBtn');await sleep(1500);
 const anon=await mk();await anon.pg.goto(BASE+'/index.html');await sleep(1500);
 const ev=(pg,fn,a)=>pg.evaluate(fn,a);
 const ml=await mk();await ml.pg.goto(BASE+'/merchant.html');await sleep(1000);await ml.pg.fill('#inpPhone','01000000001');await ml.pg.fill('#inpPass','NewPass123');await ml.pg.click('#loginBtn');await sleep(2000);
 ok('merchant (claimed earlier) logs in',await ml.pg.evaluate(()=>MERCHANT&&MERCHANT.fbId)==='mLeg');
 // S6 storefront reads projection; customer requests orders
 const cu=await mk();await cu.pg.goto(BASE+'/index.html');await sleep(1650);
 r=await cu.pg.evaluate(()=>({n:ktMerchantsCache.length,pw:ktMerchantsCache.some(m=>'password' in m),prod:ktMerchantProducts.length}));ok('storefront shows merchant products from merchantsPublic',r.n===1&&!r.pw&&r.prod===1,r);
 ok('storefront merchant card/product in PRODUCTS',await cu.pg.evaluate(()=>!!PRODUCTS.find(p=>String(p.id).indexOf('merchant_mLeg_p1')===0)));
 await cu.pg.evaluate(()=>KT_FB.signUpEmail('cust@x.com','CustPass123','عميل'));await sleep(825);
 const mkReq=(code,price,qty)=>cu.pg.evaluate(async([c,pr,q])=>{try{return await KT_FB.requestOrder({code:c,merchantId:'mLeg',items:[{id:'p1',qty:q,price:pr,nameAr:'لبن'}],delivery:25,discount:0,payment:'cod',customer:{name:'ع',phone:'0100',street:'s'}})}catch(e){return {err:e.code||e.message}}},[code,price,qty]);
 const honest=await mkReq('K-H',25,1);const forged=await mkReq('K-F',0.01,2);
 ok('honest + forged requests stored pending',honest.fbId&&forged.fbId,[honest,forged]);
 // S7 merchant UI: orders
 await sleep(825);
 const ordersSeen=await ml.pg.evaluate(()=>FB_ORDERS.map(o=>o.id+':'+o.status));ok('merchant UI listener receives both orders under rules',ordersSeen.length===2,ordersSeen);
 // forged: confirm -> quote, not confirmed (MOBILE viewport for the proof)
 await ml.pg.setViewportSize({width:390,height:844});
 await ml.pg.evaluate(id=>openOrderModal(id),forged.fbId);await sleep(300);
 await ml.pg.click('button:has-text("مراجعة الأسعار وتأكيد الطلب")');await sleep(1400);
 const odoc=async id=>env.withSecurityRulesDisabled(async c=>(await c.firestore().doc('orders/'+id).get()).data());
 const sq=async()=>env.withSecurityRulesDisabled(async c=>(await c.firestore().doc('merchants/mLeg/stock/p1').get()).data().qty);
 let fo=await odoc(forged.fbId);ok('forged order NOT confirmed; quoted 75 (25*2+25) awaiting customer; stock unchanged 8',fo.status==='placed'&&fo.quoteStatus==='awaiting_customer'&&fo.quotedTotal===75&&await sq()===8,{s:fo.status,q:fo.quoteStatus,t:fo.quotedTotal});
 const geo=await ml.pg.evaluate(()=>{const tt=document.querySelector('.k-toast');const box=[...document.querySelectorAll('div')].filter(d=>/بانتظار موافقة العميل/.test(d.innerText)&&d.children.length<8&&d.offsetHeight>0).pop();const r=e=>e&&e.getBoundingClientRect();const T=r(tt),B=r(box);return {toast:T&&{t:T.top,b:T.bottom},box:B&&{t:B.top,b:B.bottom},overlap:!!(T&&B&&T.bottom>B.top&&T.top<B.bottom)}});
 await ml.pg.screenshot({path:'/downloads/kanteen-e2e-quote-mobile-toast.png'});
 ok('mobile: toast visible and does NOT overlap the awaiting-customer price box',geo.toast&&geo.box&&!geo.overlap,geo);
 await ml.pg.waitForFunction(()=>!document.querySelector('.k-toast'),null,{timeout:9000}).catch(()=>{});
 const txt=await ml.pg.locator('#modalContent, .k-modal').first().innerText().catch(()=>'');
 ok('after toast expires the modal still shows requested + quoted totals and awaiting-customer wording',/بانتظار موافقة العميل/.test(txt)&&/75/.test(txt),txt.slice(0,200));
 await ml.pg.screenshot({path:'/downloads/kanteen-e2e-quote-mobile.png'});
 await ml.pg.click('button:has-text("العميل وافق")');await ml.pg.dblclick('button:has-text("العميل وافق")').catch(()=>{});await sleep(1375);
 fo=await odoc(forged.fbId);ok('after merchant records agreement: confirmed at 75, stock 6, stockTaken',fo.status==='confirmed'&&fo.confirmedTotal===75&&fo.stockTaken===true&&await sq()===6,{s:fo.status,t:fo.confirmedTotal,q:await sq()});
 // honest: confirm directly
 await ml.pg.evaluate(id=>openOrderModal(id),honest.fbId);await sleep(300);await ml.pg.click('button:has-text("مراجعة الأسعار وتأكيد الطلب")');await sleep(1375);
 let ho=await odoc(honest.fbId);ok('honest order (total matches catalog) confirmed, stock 5',ho.status==='confirmed'&&ho.totalCorrected===false&&await sq()===5,{s:ho.status,q:await sq()});
 // cancel with double click -> restore once
 await ml.pg.evaluate(id=>openOrderModal(id),honest.fbId);await sleep(300);
 const cb=ml.pg.locator('button:has-text("إلغاء الطلب")');await cb.first().click();await cb.first().click({timeout:800}).catch(()=>{});await sleep(1375);
 ho=await odoc(honest.fbId);ok('cancel (double-click) restores stock exactly once: 6, status cancelled',ho.status==='cancelled'&&ho.stockTaken===false&&await sq()===6,{s:ho.status,q:await sq()});
 // eligibility: suspend via admin UI -> projection removed, orders can't be accepted
 await ad.pg.evaluate(()=>suspendMerchant('mLeg'));await sleep(1375);
 r=await ev(anon.pg,async()=>(await KT_FB.init().db.collection('merchantsPublic').get()).size);ok('suspend removes merchant from public projection',r===0,r);
 const errs=[ad,ml,cu,anon].flatMap(x=>x.pg.errs);console.log('page errors:',[...new Set(errs)].slice(0,8));
 console.log('SUMMARY pass='+p+' fail='+f);await b.close();srv.kill();await env.cleanup();process.exit(0);
})().catch(e=>{console.log('FATAL',e);process.exit(1)});
