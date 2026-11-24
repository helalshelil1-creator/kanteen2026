const {chromium}=require('/tmp/kanteen2026/node_modules/playwright');
const cp=require('child_process'),path=require('path');
const ROOT=process.env.ROOT,PORT=process.env.PORT||'8101';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let p=0,f=0;
const ok=(n,c,x)=>{c?p++:f++;console.log((c?'PASS ':'FAIL ')+n+(c?'':' :: '+JSON.stringify(x)))};
(async()=>{
 const srv=cp.spawn('python3',['-m','http.server',PORT,'-d',ROOT],{stdio:'ignore'});await sleep(500);
 const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox']});
 const ctx=await b.newContext({viewport:{width:390,height:844}});
 await ctx.route(/^https?:\/\/(?!127\.0\.0\.1|localhost)/,r=>r.abort());
 const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto('http://127.0.0.1:'+PORT+'/index.html');await sleep(1800);
 const run=async(lang)=>{await pg.evaluate(l=>{KT_LANG=l;LS.set('lang',l);applyLang();document.querySelector('#k-toasts').innerHTML=''},lang);
  return pg.evaluate(()=>{
   const all=['تمت الإضافة إلى السلة ✓','تم الحذف','املأ البيانات','اكتب رقم موبايل مصري صحيح (11 رقم يبدأ بـ 01)','📨 تم إرسال طلبك — في انتظار تأكيد المتجر (لم يتأكد بعد)','❌ الكود غير صحيح','✅ تمت الإضافة: Milk','الحد الأدنى 100 '+t('general_egp'),'⚠️ لم يُحفظ الطلب على الخادم: خطأ — أرسله عبر واتساب','⚠️ لم يُحفظ الطلب على الخادم: permission-denied — أرسله عبر واتساب','نص غير معروف'];
   document.querySelector('#k-toasts').innerHTML='';all.forEach(m=>ktToast(m));return [...document.querySelector('#k-toasts').children].map(e=>e.textContent)})};
 const en=await run('en');console.log(en.join('\n'));
 ok('EN: every known toast has no Arabic except the unknown fallback',en.slice(0,-1).every(t=>!/[\u0600-\u06ff]/.test(t)),en);
 ok('EN: unknown text unchanged',en[en.length-1]==='نص غير معروف');
 ok('EN: dynamic parts kept',en[6]==='✅ Added: Milk'&&/Minimum order 100/.test(en[7])&&/permission-denied/.test(en[9]));
 const ar=await run('ar');
 ok('AR: all messages unchanged',ar[0]==='تمت الإضافة إلى السلة ✓'&&ar[8].includes('أرسله عبر واتساب')&&ar[6]==='✅ تمت الإضافة: Milk',ar);
 await pg.evaluate(()=>{KT_LANG='en';LS.set('lang','en');applyLang();document.querySelector('#k-toasts').innerHTML='';ktToast('📨 تم إرسال طلبك — في انتظار تأكيد المتجر (لم يتأكد بعد)','success')});await sleep(300);
 await pg.screenshot({path:'/downloads/kanteen-toast-en-390.png'});
 ok('no page errors',errs.length===0,errs);
 console.log(p+' pass '+f+' fail');await b.close();srv.kill();process.exit(f?1:0)})();
