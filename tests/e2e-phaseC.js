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
 const mkC=async(email)=>{const x=await mk();await x.pg.goto(BASE+'/index.html');await sleep(1650);await x.pg.evaluate(e=>KT_FB.signUpEmail(e,'CustPass123','عميل'),email);await sleep(900);return x};
 const odoc=async id=>env.withSecurityRulesDisabled(async c=>(await c.firestore().doc('orders/'+id).get()).data());
 const upd=async(id,d)=>env.withSecurityRulesDisabled(async c=>{await c.firestore().doc('orders/'+id).update(d)});
 const A=await mkC('a@x.com'),B=await mkC('b@x.com');
 await A.pg.setViewportSize({width:390,height:844});
 const CODE='KTN-T-1';
 const res=await A.pg.evaluate(async(code)=>{
   var o={id:code,user:'guest',customer:{name:'ع',phone:'0100',street:'s'},items:[{id:'merchant_mLeg_p1',nameAr:'لبن',nameEn:'Milk',emoji:'🥛',price:25,qty:2}],subtotal:25,delivery:25,discount:0,total:25,payment:'cod',paymentStatus:'cod',status:'placed',pendingConfirm:true,createdAt:new Date().toISOString()};
   state.orders.unshift(o);persist('orders');
   try{var r=await KT_FB.requestOrder({code:code,merchantId:'mLeg',items:[{id:'p1',qty:2,price:25,nameAr:'لبن'}],delivery:25,discount:0,payment:'cod',customer:o.customer});return r}catch(e){return {err:e.code||e.message}}},CODE);
 ok('customer A request stored',!!res.fbId,res);
 await A.pg.evaluate(c=>navigate('/track/'+c),CODE);await sleep(1500);
 const txt=()=>A.pg.evaluate(()=>document.body.innerText);
 let t=await txt();ok('track: pending banner, not confirmed',/في انتظار تأكيد المتجر/.test(t),t.slice(0,300));
 await A.pg.screenshot({path:'/downloads/kanteen-e2e-track-pending.png'});
 // other customer: denied
 const den=await B.pg.evaluate(async(a)=>{const db=firebase.firestore();const out={};
   try{await db.collection('orders').where('id','==',a.code).get().then(s=>out.unfiltered=s.size)}catch(e){out.unfiltered='denied:'+e.code}
   try{const u=firebase.auth().currentUser;const s=await db.collection('orders').where('id','==',a.code).where('customerUid','==',u.uid).get();out.own=s.size}catch(e){out.own='err:'+e.code}
   try{await db.doc('orders/'+a.fb).get();out.direct='READ'}catch(e){out.direct='denied:'+e.code}
   try{const u=firebase.auth().currentUser;await db.collection('orders').where('id','==',a.code).where('customerUid','==','someone-else').get().then(s=>out.spoof=s.size)}catch(e){out.spoof='denied:'+e.code}
   return out},{code:CODE,fb:res.fbId});
 ok('other customer: unfiltered query denied, direct read denied, own-filtered query empty, spoofed uid filter denied',/denied/.test(den.unfiltered)&&/denied/.test(den.direct)&&den.own===0&&/denied/.test(den.spoof),den);
 // requote
 await upd(res.fbId,{quoteStatus:'awaiting_customer',quotedTotal:75});await sleep(1500);
 t=await txt();ok('track: requote banner shows requested 25 and shop total 75, not confirmed',/غير مؤكد حتى تتفق/.test(t)&&/75/.test(t),t.slice(0,400));
 await A.pg.screenshot({path:'/downloads/kanteen-e2e-track-requote.png'});
 // confirm (status confirmed)
 await upd(res.fbId,{status:'confirmed',stockTaken:true,confirmedTotal:75,quoteStatus:'agreed_recorded_by_merchant'});await sleep(1500);
 let st=await A.pg.evaluate(c=>{const o=state.orders.find(x=>x.id===c);return {s:o.status,p:o.pendingConfirm,c:o.confirmedTotal}},CODE);
 t=await txt();ok('track: confirmed state synced, pending cleared, requote banner gone',st.s==='confirmed'&&!st.p&&st.c===75&&!/غير مؤكد حتى تتفق/.test(t)&&!/في انتظار تأكيد المتجر/.test(t),{st,t:t.slice(0,200)});
 // reload
 await A.pg.reload();await sleep(2200);await A.pg.evaluate(c=>navigate('/track/'+c),CODE);await sleep(1500);
 st=await A.pg.evaluate(c=>{const o=state.orders.find(x=>x.id===c);return o&&{s:o.status}},CODE);
 ok('after reload: order and confirmed status persist',st&&st.s==='confirmed',st);
 // cancel while listening after reload
 await upd(res.fbId,{status:'cancelled'});await sleep(1500);
 st=await A.pg.evaluate(c=>state.orders.find(x=>x.id===c).status,CODE);ok('after reload the listener still updates (cancelled)',st==='cancelled',st);
 await A.pg.screenshot({path:'/downloads/kanteen-e2e-track-cancelled.png'});
 const errs=[A,B].flatMap(x=>x.pg.errs);console.log('page errors:',[...new Set(errs)].slice(0,8));
 console.log('SUMMARY pass='+p+' fail='+f);await b.close();srv.kill();await env.cleanup();process.exit(0);
})().catch(e=>{console.log('FATAL',e);process.exit(1)});
