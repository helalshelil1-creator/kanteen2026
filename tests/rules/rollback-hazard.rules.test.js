// Run with the OLD rules (firestore.rules). Documents why rolling rules back after migration is unsafe.
const {initializeTestEnvironment}=require('@firebase/rules-unit-testing');const fs=require('fs');
(async()=>{const env=await initializeTestEnvironment({projectId:'demo-kt9',firestore:{rules:fs.readFileSync('firestore.rules','utf8'),host:'127.0.0.1',port:8085}});
 await env.withSecurityRulesDisabled(async c=>{await c.firestore().doc('merchants/m1').set({name:'M',phone:'+201000000001',status:'approved',ownerUid:'u1'})});
 let r='DENY';try{const s=await env.unauthenticatedContext().firestore().collection('merchants').where('status','==','approved').get();r=s.size?'ALLOW(doc without password readable; legacy client would skip the password compare)':'EMPTY'}catch(e){}
 console.log('OLD RULES on migrated data: anonymous query ->',r);
 console.log('SUMMARY hazard-documented='+(r.startsWith('ALLOW')));await env.cleanup();process.exit(0)})();
