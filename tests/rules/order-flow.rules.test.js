const {initializeTestEnvironment}=require('@firebase/rules-unit-testing');const fs=require('fs');
const flow=require('./order-flow.js');
let p=0,f=0;const T=async(n,exp,fn)=>{let r,m='';try{await fn();r='ALLOW'}catch(e){r='DENY';m=' ('+String(e.message).slice(0,60)+')'}const g=r===exp;g?p++:f++;console.log((g?'PASS':'FAIL')+' ['+exp+'] '+n+(g?'':m))};
(async()=>{
 const env=await initializeTestEnvironment({projectId:'demo-kt6',firestore:{rules:fs.readFileSync('firestore.rules','utf8'),host:'127.0.0.1',port:8085}});
 const reset=async(stock)=>{await env.clearFirestore();await env.withSecurityRulesDisabled(async c=>{const d=c.firestore();
  await d.doc('admins/adm').set({x:1});
  await d.doc('merchants/m1').set({name:'M',status:'approved',ownerUid:'own1',products:[{id:'p1',name:'A',price:10},{id:'p2',name:'B',price:100}]});
  await d.doc('merchants/m1/stock/p1').set({qty:stock});await d.doc('merchants/m1/stock/p2').set({qty:5});});};
 const cust=u=>env.authenticatedContext(u);const own=()=>env.authenticatedContext('own1').firestore();
 const req=async(u,qty,price,total,code)=>{const c=cust(u);return flow.requestOrder(c.firestore(),{uid:u},{merchantId:'m1',code:code||'K-'+u,items:[{id:'p1',qty:qty,price:price,nameAr:'A'}],delivery:25,discount:0,payment:'cod',customer:{phone:'1',street:'s'}})};
 await reset(1);
 const r1=await req('c1',1,10); const r2=await req('c2',1,10);
 await T('pending request created with status placed, stock untouched','ALLOW',async()=>{await (async c=>{const F=c.firestore();const q=await F.doc('orders/'+r1.fbId).get();const st=await F.doc('merchants/m1/stock/p1').get();if(q.data().status!=='placed'||st.data().qty!==1)throw new Error('bad')})(cust('adm'))});
 const res=await Promise.allSettled([flow.acceptOrder(own(),r1.fbId),flow.acceptOrder(own(),r2.fbId)]);
 const ok=res.filter(x=>x.status==='fulfilled').length;
 await T('CONCURRENCY: 2 competing accepts for last unit -> exactly 1 wins','ALLOW',async()=>{if(ok!==1)throw new Error('wins='+ok+' '+res.map(x=>x.status))});
 await T('final stock is 0 not negative','ALLOW',async()=>{await (async c=>{const st=await c.firestore().doc('merchants/m1/stock/p1').get();if(st.data().qty!==0)throw new Error('qty='+st.data().qty)})(cust('adm'))});
 await T('loser order remains placed (not confirmed)','ALLOW',async()=>{await (async c=>{const F=c.firestore();const a=await F.doc('orders/'+r1.fbId).get(),b=await F.doc('orders/'+r2.fbId).get();const sts=[a.data().status,b.data().status].sort().join();if(sts!=='confirmed,placed')throw new Error(sts)})(cust('adm'))});
 // 5 competing for stock 3
 await reset(3);const ids=[];for(let i=0;i<5;i++)ids.push((await req('u'+i,1,10)).fbId);
 const r5=await Promise.allSettled(ids.map(i=>flow.acceptOrder(own(),i)));
 await T('CONCURRENCY: 5 competing, stock 3 -> exactly 3 confirmed, stock 0','ALLOW',async()=>{const w=r5.filter(x=>x.status==='fulfilled').length;await (async c=>{const st=await c.firestore().doc('merchants/m1/stock/p1').get();if(w!==3||st.data().qty!==0)throw new Error('wins='+w+' qty='+st.data().qty+' '+r5.filter(x=>x.status==='rejected').map(x=>x.reason.code+':'+String(x.reason.message).slice(0,40)).join('|'))})(cust('adm'))});
 // tamper
 await reset(5);
 const tr=await req('c9',2,0.01,0);
 await T('TAMPER: forged price 0.01 request accepted into pending (rules cannot price-check)','ALLOW',async()=>{});
 let out;await T('TAMPER: accept recomputes from catalog, not submitted total','ALLOW',async()=>{out=await flow.acceptOrder(own(),tr.fbId);if(out.confirmedTotal!==45||!out.totalCorrected)throw new Error(JSON.stringify(out))});
 await T('TAMPER: order doc shows confirmedTotal=45, submitted kept, totalCorrected=true','ALLOW',async()=>{await (async c=>{const d=(await c.firestore().doc('orders/'+tr.fbId).get()).data();if(d.confirmedTotal!==45||d.total>=45||d.totalCorrected!==true)throw new Error(JSON.stringify([d.confirmedTotal,d.total]))})(cust('adm'))});
 // rules-level constraints on accept
 await reset(5);const a=await req('c1',2,10);const b=await req('c2',2,10);
 const O=own();
 await T('RULE: owner arbitrary stock decrease with no order link','DENY',()=>O.doc('merchants/m1/stock/p1').update({qty:0}));
 await T('RULE: decrement larger than order qty (links order but wrong amount)','DENY',async()=>{const bt=O.batch();bt.update(O.doc('orders/'+a.fbId),{status:'confirmed'});bt.update(O.doc('merchants/m1/stock/p1'),{qty:0,lastOrderId:a.fbId});await bt.commit()});
 await T('RULE: stock decrement while order stays placed (no confirm in same batch)','DENY',()=>O.doc('merchants/m1/stock/p1').update({qty:3,lastOrderId:a.fbId}));
 await T('RULE: exact decrement + confirm in one batch','ALLOW',async()=>{const bt=O.batch();bt.update(O.doc('orders/'+a.fbId),{status:'confirmed'});bt.update(O.doc('merchants/m1/stock/p1'),{qty:3,lastOrderId:a.fbId});await bt.commit()});
 await T('RULE: replay same order link again','DENY',()=>O.doc('merchants/m1/stock/p1').update({qty:1,lastOrderId:a.fbId}));
 await T('RULE: owner of another shop cannot touch stock','DENY',()=>env.authenticatedContext('own9').firestore().doc('merchants/m1/stock/p1').update({qty:99}));
 await T('RULE: customer cannot read or write stock','DENY',()=>cust('c1').firestore().doc('merchants/m1/stock/p1').update({qty:99}));
 await T('RULE: owner restock (increase) allowed','ALLOW',()=>O.doc('merchants/m1/stock/p1').update({qty:20}));
 await T('RULE: owner cannot jump order placed->delivered','DENY',()=>O.doc('orders/'+b.fbId).update({status:'delivered'}));
 await T('RULE: owner cannot change submitted total field','DENY',()=>O.doc('orders/'+b.fbId).update({total:1}));
 console.log('SUMMARY pass='+p+' fail='+f);await env.cleanup();process.exit(0);})();
