const {initializeTestEnvironment}=require('@firebase/rules-unit-testing');const fs=require('fs');
const RULES=process.env.RULES||'firestore.rules';let p=0,f=0;
const T=async(n,exp,fn)=>{let r;try{await fn();r='ALLOW'}catch(e){r='DENY'}const g=r===exp;g?p++:f++;console.log((g?'PASS':'FAIL')+' ['+exp+'] '+n+(g?'':'  <-- got '+r))};
(async()=>{
 const env=await initializeTestEnvironment({projectId:'demo-kt9',firestore:{rules:fs.readFileSync(RULES,'utf8'),host:'127.0.0.1',port:8085}});
 const seed=()=>env.withSecurityRulesDisabled(async c=>{const d=c.firestore();
  await d.doc('admins/adm').set({x:1});
  await d.doc('merchants/m1').set({name:'M',status:'approved',ownerUid:'own1'});
  await d.doc('drivers/drvA').set({name:'A',status:'approved',online:true});
  await d.doc('drivers/drvP').set({name:'P',status:'pending',online:false});
  const o={customerUid:'cust1',merchantId:'m1',status:'placed',total:50,items:[{id:'p',qty:1}],itemQty:{p:1}};
  await d.doc('orders/oPlaced').set(o);
  await d.doc('orders/oOut').set({...o,status:'out',driverId:'drvA'});
  await d.doc('orders/oPendDrv').set({...o,status:'out',driverId:'drvQ'});await d.doc('drivers/drvQ').set({status:'pending'});await d.doc('drivers/drvS').set({status:'suspended'});await d.doc('orders/oSusp').set({...o,status:'out',driverId:'drvS'});});
 await seed();
 const as=u=>env.authenticatedContext(u).firestore(), anon=()=>env.unauthenticatedContext().firestore();
 console.log('RULES='+RULES);
 // drivers
 await T('driver self-registers as pending','ALLOW',()=>as('newD').doc('drivers/newD').set({name:'N',status:'pending'}));
 await T('driver self-registers already approved','DENY',()=>as('newD2').doc('drivers/newD2').set({name:'N',status:'approved'}));
 await T('driver registers under another uid','DENY',()=>as('x').doc('drivers/y').set({name:'N',status:'pending'}));
 await T('driver edits own status to approved','DENY',()=>as('drvP').doc('drivers/drvP').update({status:'approved'}));
 await T('driver toggles own online + lat/lng','ALLOW',()=>as('drvA').doc('drivers/drvA').update({online:false,lat:30,lng:31,lastSeen:1}));
 await T('driver edits another driver','DENY',()=>as('drvA').doc('drivers/drvP').update({online:true}));
 await T('admin approves driver','ALLOW',()=>as('adm').doc('drivers/drvP').update({status:'approved'}));
 await T('customer cannot self-promote via drivers doc update','DENY',()=>as('cust1').doc('drivers/drvA').update({status:'suspended'}));
 await T('anon reads drivers','DENY',()=>anon().doc('drivers/drvA').get());
 await T('any signed-in user reads drivers (KNOWN PII EXPOSURE, needs data split)','ALLOW',()=>as('cust1').doc('drivers/drvA').get());
 // orders: driver
 await T('assigned driver reads own order','ALLOW',()=>as('drvA').doc('orders/oOut').get());
 await T('unassigned driver reads order','DENY',()=>as('drvP').doc('orders/oOut').get());
 await T('assigned driver sets delivered','ALLOW',()=>as('drvA').doc('orders/oOut').update({status:'delivered',deliveredAt:1}));
 await T('driver changes total','DENY',()=>as('drvA').doc('orders/oOut').update({total:1}));
 await T('driver reassigns driverId','DENY',()=>as('drvA').doc('orders/oOut').update({driverId:'drvA2'}));
 await T('driver updates order not assigned to them','DENY',()=>as('drvA').doc('orders/oPlaced').update({status:'delivered'}));
 await T('assigned driver jumps placed->delivered','DENY',async()=>{await env.withSecurityRulesDisabled(c=>c.firestore().doc('orders/oJump').set({customerUid:'cust1',merchantId:'m1',status:'placed',driverId:'drvA',total:5}));await as('drvA').doc('orders/oJump').update({status:'delivered'})});
 await T('PENDING (unapproved) driver assigned to order cannot update it','DENY',()=>as('drvQ').doc('orders/oPendDrv').update({status:'delivered'}));
 await T('driver out->delivered after confirmed->out path: preparing->out','ALLOW',async()=>{await env.withSecurityRulesDisabled(c=>c.firestore().doc('orders/oPrep').set({customerUid:'cust1',merchantId:'m1',status:'preparing',driverId:'drvA',total:5}));await as('drvA').doc('orders/oPrep').update({status:'out',pickedAt:1})});
 await T('driver backwards out->preparing','DENY',()=>as('drvA').doc('orders/oPrep').update({status:'preparing'}));
 await T('driver sets cancelled','DENY',()=>as('drvA').doc('orders/oPrep').update({status:'cancelled'}));
 await T('driver posts location/notes without status change','ALLOW',()=>as('drvA').doc('orders/oPrep').update({driverLat:1,driverLng:2,driverNotes:'x'}));
 await T('SUSPENDED driver assigned to order cannot update it','DENY',()=>as('drvS').doc('orders/oSusp').update({status:'delivered'}));
 // customer
 await T('customer reads own order','ALLOW',()=>as('cust1').doc('orders/oPlaced').get());
 await T('other customer reads order','DENY',()=>as('c2').doc('orders/oPlaced').get());
 await T('customer cancels own placed','ALLOW',()=>as('cust1').doc('orders/oPlaced').update({status:'cancelled',cancelledAt:1}));
 await T('customer sets own out order delivered','DENY',()=>as('cust1').doc('orders/oOut').update({status:'delivered'}));
 await T('customer edits total on placed','DENY',async()=>{await env.withSecurityRulesDisabled(c=>c.firestore().doc('orders/oP2').set({customerUid:'cust1',merchantId:'m1',status:'placed',total:50}));await as('cust1').doc('orders/oP2').update({total:1})});
 await T('customer creates order status delivered','DENY',()=>as('cust1').doc('orders/oN1').set({customerUid:'cust1',merchantId:'m1',status:'delivered',total:5,items:[{}],itemQty:{a:1}}));
 await T('customer creates valid placed order','ALLOW',()=>as('cust1').doc('orders/oN2').set({customerUid:'cust1',merchantId:'m1',status:'placed',total:5,items:[{}],itemQty:{a:1}}));
 // merchant
 await T('merchant owner confirms placed','ALLOW',()=>as('own1').doc('orders/oP2').update({status:'confirmed',confirmedAt:1}));
 await T('merchant skips confirmed->out','DENY',()=>as('own1').doc('orders/oP2').update({status:'out'}));
 await T('merchant sets delivered','DENY',()=>as('own1').doc('orders/oP2').update({status:'delivered'}));
 await T('merchant sets driverId','DENY',()=>as('own1').doc('orders/oP2').update({driverId:'drvA'}));
 await T('merchant of other shop','DENY',()=>as('own9').doc('orders/oP2').update({status:'preparing'}));
 // admin
 await T('admin updates any order status, assigns driver','ALLOW',()=>as('adm').doc('orders/oP2').update({status:'out',driverId:'drvA'}));
 await T('anon reads orders','DENY',()=>anon().doc('orders/oP2').get());
 console.log('SUMMARY pass='+p+' fail='+f);await env.cleanup();process.exit(0)})();
