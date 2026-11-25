// Real-browser e2e of the flag-ON flows against local Auth+Firestore emulators (no live access).
// Run: npx firebase emulators:exec --only firestore,auth --project demo-kt8 "node e2e-secure-flags.js"  (from a dir with firebase.json using firestore.rules = rules.next)
const {chromium}=require(process.env.PW||'/tmp/kanteen2026/node_modules/playwright');
const {initializeTestEnvironment}=require('@firebase/rules-unit-testing');
const fs=require('fs'),path=require('path'),cp=require('child_process');
const ROOT=process.env.ROOT||'/tmp/kanteen2026',FB=process.env.FBJS||'/tmp/fbemu/node_modules/firebase';
const BASE='http://127.0.0.1:8317';let p=0,f=0;
const ok=(n,c,x)=>{c?p++:f++;console.log((c?'PASS ':'FAIL ')+n+(c?'':' :: '+JSON.stringify(x)))};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function signUp(email,pw){const r=await fetch('http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=x',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({email,password:pw,returnSecureToken:true})});return (await r.json()).localId}
(async()=>{
 const srv=cp.spawn('python3',['-m','http.server','8317','-d',ROOT],{stdio:'ignore'});await sleep(440);
 {const h=require('crypto').createHash('sha256');const live=await (await fetch(BASE+'/app.js')).text();const want=fs.readFileSync(path.join(ROOT,'app.js'),'utf8');const same=h.update(live).digest('hex')===require('crypto').createHash('sha256').update(want).digest('hex');console.log('SERVED_TREE_CHECK',same,ROOT);if(!same){srv.kill();process.exit(3)}}
 const cfg=fs.readFileSync(path.join(ROOT,'config.js'),'utf8')+"\nwindow.KT_EMULATOR={fsHost:'127.0.0.1',fsPort:8085,authUrl:'http://127.0.0.1:9099'};";
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
 const mkC=async(email)=>{const x=await mk();await x.pg.goto(BASE+'/index.html');await sleep(1650);await sleep(900);return x};
 const A=await mkC('a@x.com');await A.pg.setViewportSize({width:390,height:844});
 await A.pg.evaluate(()=>{window.__opens=0;window.open=()=>{window.__opens++;return null}});
 await A.pg.evaluate(()=>navigate('/p/'+PRODUCTS[0].id));await sleep(1200);
 await A.pg.locator('button:has-text("أضف")').first().click();await sleep(600);
 await A.pg.evaluate(()=>navigate('/checkout'));await sleep(900);
 await A.pg.fill('#co-name','ع');await A.pg.fill('#co-phone','01001234567');await A.pg.click('button:has-text("التالي")');await sleep(500);
 const gov=await A.pg.evaluate(()=>[...document.querySelectorAll('#co-gov option')].find(o=>o.value).value);await A.pg.selectOption('#co-gov',gov);await sleep(400);
 const city=await A.pg.evaluate(()=>[...document.querySelectorAll('#co-city option')].find(o=>o.value).value);await A.pg.selectOption('#co-city',city);await A.pg.fill('#co-street','x');
 await A.pg.click('button:has-text("التالي")');await sleep(500);await A.pg.click('button:has-text("التالي")');await sleep(500);
 const payTxt=await A.pg.evaluate(()=>document.body.innerText);
 ok('showcase: payment step offers no InstaPay / Vodafone Cash',!/InstaPay/.test(payTxt)&&!/فودافون/.test(payTxt),payTxt.slice(-200));
 await A.pg.click('text=الدفع عند الاستلام');await sleep(400);await A.pg.click('button:has-text("التالي")');await sleep(500);await A.pg.click('button:has-text("التالي")');await sleep(500);
 await A.pg.click('button:has-text("تأكيد الطلب")');await sleep(1800);
 const vis=await A.pg.evaluate(()=>({n:!!document.querySelector('[data-testid="showcase-notice"]'),txt:document.body.innerText,opens:window.__opens,orders:state.orders.length}));
 const cnt=await env.withSecurityRulesDisabled(async c=>(await c.firestore().collection('orders').get()).size);
 ok('showcase: confirm shows demo notice, no order saved, no WhatsApp opened, no local order',vis.n&&/لم يُرسَل أي طلب/.test(vis.txt)&&cnt===0&&vis.opens===0&&vis.orders===0,{n:vis.n,cnt,opens:vis.opens,orders:vis.orders});
 await A.pg.screenshot({path:'/downloads/kanteen-e2e-showcase-notice.png'});
 console.log('page errors:',[...new Set(A.pg.errs)].slice(0,8));
 console.log('SUMMARY pass='+p+' fail='+f);await b.close();srv.kill();await env.cleanup();process.exit(0);
})().catch(e=>{console.log('FATAL',e);process.exit(1)});
