const {chromium}=require('/tmp/kanteen2026/node_modules/playwright');
const cp=require('child_process');
const ROOT=process.env.ROOT,PORT=process.env.PORT||'8120';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const srv=cp.spawn('python3',['-m','http.server',PORT,'-d',ROOT],{stdio:'ignore'});await sleep(500);
 const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
 const ctx=await b.newContext({viewport:{width:390,height:844}});
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/,r=>r.abort());
 const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('http://127.0.0.1:'+PORT+'/index.html');await sleep(2000);
 await pg.click('#ktLangBtn');await sleep(500);
 const scan=async(label)=>{const r=await pg.evaluate(()=>{const out=[];const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){const t=n.textContent.trim();const el=n.parentElement;if(!t||!/[\u0600-\u06ff]/.test(t)||['SCRIPT','STYLE'].includes(el.tagName))continue;const r=el.getBoundingClientRect(),cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden'||(!r.width&&!r.height))continue;if(r.right<=0||r.left>=390)continue;if(el.closest('#kt-chat-panel')&&!el.closest('#kt-chat-panel.open'))continue;out.push(t.slice(0,60))}return out.filter(t=>!/All rights reserved|Firebase/.test(t)).slice(0,25)});console.log(label,r.length?JSON.stringify(r):'(no Arabic)')};
 // logged-in account
 await pg.evaluate(()=>{state.user={id:'u1',name:'Test User',phone:'01012345678',email:'a@b.co',loginMethod:'phone',createdAt:new Date().toISOString()};persist('user');navigate('/account')});await sleep(900);await scan('account-logged-in');
 await pg.screenshot({path:'/downloads/kanteen-en-account-390.png'});
 // seeded orders in every status
 const sts=['pending','confirmed','preparing','out','delivered','cancelled','pending_payment','placed'];
 await pg.evaluate(sts=>{const pid=PRODUCTS[0].id;state.orders=sts.map((s,i)=>({id:'KTN-T-'+i,status:s,items:[{id:pid,qty:2,price:20,name:'x'}],total:60,subtotal:40,fee:20,discount:0,payment:'cod',createdAt:new Date().toISOString(),name:'Test',phone:'01012345678',gov:'g',city:'c',street:'s',time:'asap'}));persist('orders');navigate('/orders')},sts);await sleep(900);await scan('orders-list');
 for(let i=0;i<sts.length;i++){await pg.evaluate(i=>navigate('/track/KTN-T-'+i),i);await sleep(900);await pg.evaluate(()=>window.scrollTo(0,document.body.scrollHeight));await scan('track-'+sts[i])}
 // chatbot
 await pg.evaluate(()=>{navigate('/');ktOpenChat()});await sleep(600);await scan('chat-open');
 const btns=await pg.$$('#kt-chat-quick button');console.log('quick count',btns.length);
 for(const q of btns){await q.click({force:true});await sleep(1300)}
 await scan('chat-after-quick');
 await pg.screenshot({path:'/downloads/kanteen-en-chat-390.png'});
 console.log('errs',errs);await b.close();srv.kill()})();
