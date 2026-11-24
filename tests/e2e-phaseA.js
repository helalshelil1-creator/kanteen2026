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
 await env.withSecurityRulesDisabled(async c=>{const d=c.firestore();
  await d.doc('admins/'+admUid).set({x:1});
  await d.doc('merchants/mLeg').set({name:'متجر قديم',phone:'+201000000001',status:'approved',ownerUid:null,password:'PLAIN123',owner:'x',address:'a',products:[{id:'p1',name:'لبن',price:20,stock:5,emoji:'🥛'}],whatsapp:'+201000000001'});
  await d.doc('merchants/mPend').set({name:'قيد المراجعة',phone:'+201000000002',status:'pending',ownerUid:null,password:'P2',products:[]});});
 const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
 const mk=async(cfgX)=>{const ctx=await b.newContext({viewport:{width:1100,height:900},locale:'ar-EG'});
  await ctx.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/,r=>{const u=r.request().url();const m=u.match(/gstatic\.com\/firebasejs\/[^/]+\/(firebase-[a-z-]+compat\.js)/);if(m)return r.fulfill({path:path.join(FB,m[1]),contentType:'application/javascript'});r.abort()});
  await ctx.route(/\/config\.js(\?.*)?$/,r=>r.fulfill({body:cfgX||cfg,contentType:'application/javascript'}));
  await ctx.addInitScript(()=>{window.confirm=()=>true;});
  const pg=await ctx.newPage();pg.errs=[];pg.on('pageerror',e=>pg.errs.push(e.message.slice(0,150)));pg.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|net::ERR/.test(m.text()))pg.errs.push('console:'+m.text().slice(0,150))});return {ctx,pg}};
 const cfgOld=fs.readFileSync(path.join(ROOT,'config.js'),'utf8')+"\nwindow.KT_EMULATOR={fsHost:'127.0.0.1',fsPort:8085,authUrl:'http://127.0.0.1:9099'};";
 const anon=await mk();await anon.pg.goto(BASE+'/index.html');await sleep(1375);
 const ev=(pg,fn,a)=>pg.evaluate(fn,a);
 // S1 fail-closed for anonymous storefront before migration
 let r=await ev(anon.pg,async()=>{const i=KT_FB.init();const out={};try{await i.db.collection('merchants').doc('mLeg').get();out.direct='allowed'}catch(e){out.direct=e.code}
   try{await i.db.collection('merchants').where('status','==','approved').get();out.q='allowed'}catch(e){out.q=e.code}
   const s=await i.db.collection('merchantsPublic').get();out.pub=s.size;return out});
 ok('anon direct get of legacy password doc denied',r.direct==='permission-denied',r);ok('anon approved-merchants query denied',r.q==='permission-denied',r);ok('merchantsPublic empty before migration',r.pub===0,r);
 // S2 admin migration via real UI
 const ad=await mk();await ad.pg.goto(BASE+'/admin.html');await ad.pg.fill('#inpEmail','admin@kanteen.app');await ad.pg.fill('#inpPass','AdminPass123');await ad.pg.click('#loginBtn');await sleep(1375);
 await ad.pg.evaluate(()=>switchTab('merchants'));await sleep(660);
 ok('admin sees migrate + code buttons',(await ad.pg.locator('button:has-text("ترحيل التجار")').count())===1);
 await ad.pg.click('button:has-text("ترحيل التجار")');await sleep(1650);
 const mig=await ad.pg.evaluate(()=>window._ktMigration);ok('migration result published=1 passwordsRemoved=2(legacy+pending) stock created',mig&&mig.published===1&&mig.passwordsRemoved===2&&mig.stockCreated===1&&mig.errors.length===0,mig);
 r=await ev(anon.pg,async()=>{const i=KT_FB.init();const s=await i.db.collection('merchantsPublic').get();return {n:s.size,hasPw:s.docs.some(d=>'password' in d.data()||'ownerUid' in d.data()),name:s.docs[0]&&s.docs[0].data().name}});
 ok('public projection now lists approved merchant without secrets',r.n===1&&!r.hasPw,r);
 const left=await env.withSecurityRulesDisabled(async c=>{const d=c.firestore();return (await d.doc('merchants/mLeg').get()).data().password})
 // OLD CLIENT (flags OFF) against migrated data + rules.next must fail closed
 const oc=await mk(cfgOld);await oc.pg.goto(BASE+'/index.html');await sleep(2500);
 r=await oc.pg.evaluate(()=>({n:(window.ktMerchantsCache||[]).length}));ok('old storefront (flag off) gets no merchants (denied) and does not crash',r.n===0&&oc.pg.errs.filter(e=>!/^console:/.test(e)).length===0,[r,oc.pg.errs]);
 const om=await mk(cfgOld);await om.pg.goto(BASE+'/merchant.html');await sleep(1200);await om.pg.fill('#inpPhone','01000000001');await om.pg.fill('#inpPass','PLAIN123');await om.pg.click('#loginBtn');await sleep(2200);
 ok('old merchant login (flag off) cannot log in after migration',await om.pg.evaluate(()=>!MERCHANT||!MERCHANT.fbId)&&(await om.pg.locator('#errBox').isVisible()),await om.pg.locator('#errBox').innerText());
 await om.pg.fill('#inpPass','');await om.pg.click('#loginBtn');await sleep(800);
 // S3 code issue (UI)
 await ad.pg.evaluate(()=>ktIssueCode('mLeg'));await sleep(825);
 const code=(await ad.pg.locator('#ktCodeBox').innerText()).trim();ok('activation code issued (32 hex)',/^[0-9a-f]{32}$/.test(code),code.length);
 // S4 merchant claim via UI
 const mc=await mk();await mc.pg.goto(BASE+'/merchant.html');await sleep(825);
 ok('claim link visible with flag on',await mc.pg.locator('#ktClaimLink').isVisible());
 await mc.pg.click('#ktClaimLink a');await mc.pg.fill('#clPhone','01000000001');await mc.pg.fill('#clCode',code);await mc.pg.fill('#clPass','NewPass123');await mc.pg.click('#clBtn');await sleep(1925);
 let mid=await mc.pg.evaluate(()=>MERCHANT&&MERCHANT.fbId);ok('claim logs merchant in and binds ownerUid',mid==='mLeg',mid);
 const mrec=await env.withSecurityRulesDisabled(async c=>{const d=c.firestore();const m=(await d.doc('merchants/mLeg').get()).data();const a=(await d.doc('merchantActivations/'+code).get()).data();return {own:!!m.ownerUid,pw:m.password,used:a.used}});
 ok('merchant doc owned, no password, code used',mrec.own&&mrec.pw===undefined&&mrec.used===true,mrec);
 const mc2=await mk();await mc2.pg.goto(BASE+'/merchant.html');await sleep(660);await mc2.pg.click('#ktClaimLink a');await mc2.pg.fill('#clPhone','01000000001');await mc2.pg.fill('#clCode',code);await mc2.pg.fill('#clPass','NewPass123');await mc2.pg.click('#clBtn');await sleep(1375);
 ok('replay of used code is refused',(await mc2.pg.locator('#clErr').innerText()).includes('الكود'));
 // login wrong / right
 const ml=await mk();await ml.pg.goto(BASE+'/merchant.html');await sleep(660);
 await ml.pg.fill('#inpPhone','01000000001');await ml.pg.fill('#inpPass','PLAIN123');await ml.pg.click('#loginBtn');await sleep(1100);
 ok('old plaintext password no longer logs in',(await ml.pg.locator('#errBox').isVisible()));
 await ml.pg.fill('#inpPass','NewPass123');await ml.pg.click('#loginBtn');await sleep(1650);
 mid=await ml.pg.evaluate(()=>MERCHANT&&MERCHANT.fbId);ok('login with new password works',mid==='mLeg',mid);
 // S5 products save + stock rules
 let st=await ml.pg.evaluate(async()=>{const i=KT_FB.init();const s=await i.db.collection('merchants').doc('mLeg').collection('stock').doc('p1').get();return s.data().qty});ok('stock doc seeded from product stock=5',st===5,st);
 await ml.pg.evaluate(()=>ktSaveProducts([{id:'p1',name:'لبن',price:25,stock:8,emoji:'🥛'}]));await sleep(1375);
 r=await ml.pg.evaluate(async()=>{const i=KT_FB.init();const s=await i.db.collection('merchants').doc('mLeg').collection('stock').doc('p1').get();const pub=await i.db.collection('merchantsPublic').doc('mLeg').get();return {q:s.data().qty,price:pub.data().products[0].price}});
 ok('restock raises stock, projection price updated',r.q===8&&r.price===25,r);
 await ml.pg.evaluate(()=>ktSaveProducts([{id:'p1',name:'لبن',price:25,stock:2,emoji:'🥛'}]));await sleep(1375);
 st=await ml.pg.evaluate(async()=>{const s=await KT_FB.init().db.collection('merchants').doc('mLeg').collection('stock').doc('p1').get();return s.data().qty});ok('manual stock decrease ignored (stays 8)',st===8,st);
 const errs=[ad,mc,ml,anon].flatMap(x=>x.pg.errs);console.log('page errors:',[...new Set(errs)].slice(0,8));
 console.log('SUMMARY pass='+p+' fail='+f);await b.close();srv.kill();await env.cleanup();process.exit(0);
})().catch(e=>{console.log('FATAL',e);process.exit(1)});
