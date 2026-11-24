const {chromium}=require('/tmp/kanteen2026/node_modules/playwright');
const cp=require('child_process');
const ROOT=process.env.ROOT,PORT=process.env.PORT||'8103';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const srv=cp.spawn('python3',['-m','http.server',PORT,'-d',ROOT],{stdio:'ignore'});await sleep(500);
 const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
 const ctx=await b.newContext({viewport:{width:390,height:844}});
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/,r=>r.abort());
 const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('http://127.0.0.1:'+PORT+'/index.html');await sleep(2000);
 await pg.click('#ktLangBtn');await sleep(600);
 console.log('lang',await pg.evaluate(()=>[document.documentElement.lang,document.documentElement.dir]));
 const scan=async(label)=>{const r=await pg.evaluate(()=>{const out=[];const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode()){const t=n.textContent.trim();const el=n.parentElement;if(!t||!/[\u0600-\u06ff]/.test(t))continue;if(['SCRIPT','STYLE'].includes(el.tagName))continue;const r=el.getBoundingClientRect();const cs=getComputedStyle(el);if(cs.display==='none'||cs.visibility==='hidden'||(!r.width&&!r.height))continue;if(el.closest('#kt-chat-panel')&&!el.closest('#kt-chat-panel.open'))continue;if(r.right<=0||r.left>=390||false)continue;out.push(t.slice(0,50))}return out.slice(0,25)});console.log(label,r.length?JSON.stringify(r):'(no Arabic)')};
 for(const r of ['/','/categories','/deals','/cart','/orders','/account','/contact','/checkout']){await pg.evaluate(x=>navigate(x),r);await sleep(900);await scan(r)}
 await pg.evaluate(()=>navigate('/deals'));await sleep(900);
 console.log(await pg.evaluate(()=>[...document.querySelectorAll('button')].filter(b=>b.offsetParent).slice(0,12).map(b=>(b.getAttribute('onclick')||'')+'|'+(b.className)+'|'+b.textContent.trim().slice(0,12))));const btn=await pg.$('.k-prod-add');
 console.log('addbtn',!!btn);
 {const pid=await pg.evaluate(()=>PRODUCTS[0].id);await pg.evaluate(id=>ktQuickAdd(id,document.createElement('button')),pid);await sleep(400);console.log('toast',await pg.evaluate(()=>[...document.querySelectorAll('.k-toast')].map(e=>e.textContent)));}
 await pg.evaluate(()=>navigate('/cart'));await sleep(900);await scan('cart-with-item');
 await pg.screenshot({path:'/downloads/kanteen-en-cart-390.png'});
 await pg.evaluate(()=>{ktAddToCart&&0;navigate('/checkout')});await sleep(900);await scan('checkout1');
 await pg.fill('#co-name','Test',{timeout:3000});await pg.fill('#co-phone','01012345678',{timeout:3000});await pg.evaluate(()=>checkoutNext());await sleep(600);await scan('checkout-step2');
 await pg.selectOption('#co-gov',{index:1});await sleep(300);await pg.selectOption('#co-city',{index:1}).catch(e=>console.log('city',e.message.slice(0,60)));await pg.fill('#co-street','St 1',{timeout:3000});await pg.evaluate(()=>checkoutNext());await sleep(600);await scan('checkout-step3 time');
 await pg.evaluate(()=>checkoutNext());await sleep(600);await scan('checkout-step4 pay');
 await pg.evaluate(()=>checkoutNext());await sleep(600);await scan('checkout-step5 summary');await pg.screenshot({path:'/downloads/kanteen-en-checkout-390.png'});
 await pg.evaluate(()=>checkoutNext());await sleep(600);await scan('checkout-step6 confirm');
 const place=await pg.evaluate(()=>typeof placeOrder);console.log('placeOrder',place);
 await pg.evaluate(()=>{try{placeOrder()}catch(e){}});await sleep(700);await scan('after-confirm modal');await pg.screenshot({path:'/downloads/kanteen-en-demo-modal-390.png'});
 await pg.evaluate(()=>{try{closeModal()}catch(e){}});
 for(const r of ['/orders','/account','/wishlist','/search?q=milk','/track']){await pg.evaluate(x=>navigate(x),r);await sleep(800);await scan(r)}
 {const oid=await pg.evaluate(()=>state.orders&&state.orders[0]&&state.orders[0].id);console.log('oid',oid);if(oid){await pg.evaluate(x=>navigate('/track/'+x),oid);await sleep(1200);await scan('track-order');await pg.screenshot({path:'/downloads/kanteen-en-track-390.png',fullPage:false})}}
 await pg.evaluate(()=>navigate('/product/'+PRODUCTS[0].id));await sleep(800);await scan('product');
 await pg.evaluate(()=>navigate('/product/nope'));await sleep(800);await scan('product-nope');
console.log('errs',errs);await b.close();srv.kill()})();
