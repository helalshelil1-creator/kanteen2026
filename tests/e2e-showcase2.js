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
 const mkC=async(email)=>{const x=await mk();await x.pg.goto(BASE+'/index.html');await sleep(1650);await sleep(900);return x};
 const writes=[];b.on&&0;
 const A=await mkC('a@x.com');A.ctx.on('request',r=>{const u=r.url();if(/127\.0\.0\.1:8085/.test(u)&&(/Write\/channel/.test(u)||/:commit|batchWrite/.test(u)))writes.push(u.slice(-60))});await A.pg.setViewportSize({width:390,height:844});
 const routes=['/','/categories','/deals','/cart','/orders','/account','/contact'];
 const bad=[];
 for(const r of routes){await A.pg.evaluate(x=>navigate(x),r);await sleep(900);
  const o=await A.pg.evaluate(()=>({links:[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')).filter(h=>/wa\.me|^tel:|^mailto:|facebook\.com/.test(h)),txt:/1124169656/.test(document.body.innerText),enroll:[...document.querySelectorAll('a[href]')].filter(a=>/(merchant|driver)\.html/.test(a.getAttribute('href'))&&a.offsetParent&&/سجّل|سجل|انضم/.test(a.textContent)).length}));
  if(o.links.length||o.txt||o.enroll)bad.push({r,o});}
 ok('storefront routes: no WhatsApp/tel/mail/Facebook links, no business number text, no visible sign-up links',bad.length===0,bad);
 // all footer/burger links in raw DOM too
 const footer=await A.pg.evaluate(()=>({n:document.querySelectorAll('a[href^="https://wa.me"],a[href^="tel:"]').length,t:document.body.innerText.includes('01124169656')}));
 ok('layout (burger/footer) has none either',footer.n===0&&!footer.t,footer);
 // writes blocked
 const w=await A.pg.evaluate(async()=>{const out={};for(const k of ['updateOrder','saveNotification','submitRating','requestOrder','signUpEmail']){try{await KT_FB[k]({});out[k]='RESOLVED'}catch(e){out[k]='blocked'}}return out});
 ok('Firestore/Auth write helpers blocked in showcase',Object.values(w).every(v=>v==='blocked'),w);
 // checkout via real buttons
 await A.pg.evaluate(()=>navigate('/p/merchant_mLeg_p1'));await sleep(1000);
 await A.pg.locator('button:has-text("أضف")').first().click();await sleep(500);
 await A.pg.evaluate(()=>navigate('/checkout'));await sleep(900);
 ok('checkout page explains demo BEFORE the form',/عرض|تجريب/.test(await A.pg.evaluate(()=>document.body.innerText)),await A.pg.evaluate(()=>document.body.innerText.slice(0,300)));
 ok('storefront session made ZERO Firestore write requests (browse, add to cart, checkout)',writes.length===0,writes.slice(0,3));
 const before=writes.length;await A.pg.evaluate(async()=>{try{await KT_FB.init().db.collection('orders').doc('ctl').set({x:1})}catch(e){}});await sleep(1500);
 ok('control: the write detector does see a deliberate raw write',writes.length>before,{before,after:writes.length});
 // merchant / driver
 const M=await mk();await M.pg.goto(BASE+'/merchant.html#register');await sleep(2000);
 const m=await M.pg.evaluate(()=>({reg:document.querySelector('#registerForm')&&getComputedStyle(document.querySelector('#registerForm')).display,toggle:[...document.querySelectorAll('.k-login-toggle')].map(e=>getComputedStyle(e).display)}));
 await M.pg.evaluate(()=>{try{ktShowRegister()}catch(e){}});await sleep(500);
 const m2=await M.pg.evaluate(()=>getComputedStyle(document.querySelector('#registerForm')).display);
 ok('merchant.html#register direct URL and ktShowRegister(): sign-up form stays hidden, login remains',m.reg==='none'&&m2==='none'&&await M.pg.evaluate(()=>getComputedStyle(document.querySelector('#loginForm')).display!=='none'),{m,m2});
 await M.pg.screenshot({path:'/downloads/kanteen-e2e-showcase-merchant.png'});
 await M.pg.goto(BASE+'/merchant.html');await sleep(1200);await M.pg.fill('#inpPhone','01000000001');await M.pg.fill('#inpPass','NewPass123');await M.pg.click('#loginBtn');await sleep(2500);
 ok('existing merchant login still works in showcase (private panel not broken)',await M.pg.evaluate(()=>!!(window.MERCHANT&&MERCHANT.fbId)),await M.pg.evaluate(()=>String(window.MERCHANT&&MERCHANT.fbId)));
 ok('existing merchant write helper not blocked in the private panel',await M.pg.evaluate(()=>!KT_FB.__showcase),null);
 const D=await mk();await D.pg.goto(BASE+'/driver.html');await sleep(2000);
 const d=await D.pg.evaluate(()=>{const t=document.querySelector('#tabSignup');return {tab:t?getComputedStyle(t).display:'none'}});
 await D.pg.evaluate(()=>{try{ktSwitchAuthMode('signup')}catch(e){}});await sleep(400);
 const d2=await D.pg.evaluate(()=>({signupOn:document.querySelector('#tabSignup')&&document.querySelector('#tabSignup').classList.contains('on')}));
 ok('driver.html: sign-up tab hidden and cannot be switched on',d.tab==='none'&&!d2.signupOn,{d,d2});
 const errs=[A,M,D].flatMap(x=>x.pg.errs);console.log('page errors:',[...new Set(errs)].slice(0,8));
 console.log('SUMMARY pass='+p+' fail='+f);await b.close();srv.kill();await env.cleanup();process.exit(0);
})().catch(e=>{console.log('FATAL',e);process.exit(1)});
