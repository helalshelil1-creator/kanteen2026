const {initializeTestEnvironment}=require('@firebase/rules-unit-testing');const fs=require('fs');
const MA=require('/tmp/kanteen2026/merchant-auth.js');let p=0,f=0;const ok=(n,c,x)=>{c?p++:f++;console.log((c?'PASS ':'FAIL ')+n+(c?'':' :: '+JSON.stringify(x)))};
(async()=>{const env=await initializeTestEnvironment({projectId:'demo-t3',firestore:{rules:fs.readFileSync('firestore.rules','utf8'),host:'127.0.0.1',port:8085}});
await env.withSecurityRulesDisabled(async c=>{const d=c.firestore();await d.doc('merchants/a').set({name:'A',status:'approved',ownerUid:null,password:'S1',phone:'1',products:[]});await d.doc('merchants/b').set({name:'B',status:'pending',ownerUid:null,password:'S2'});await d.doc('merchants/c').set({name:'C',status:'approved',ownerUid:null,phone:'3'});await d.doc('admins/ad').set({a:1})});
const db=env.authenticatedContext('ad').firestore();
const pub=await MA.adminPublishProjection(db,null);
ok('publish: 2 approved published, 1 unpublished, no errors',pub.published===2&&pub.unpublished===1&&pub.errors.length===0,pub);
globalThis.snap=await db.collection('merchants').get();globalThis.pubs=await db.collection('merchantsPublic').get();
ok('publish did not delete any password',globalThis.snap.docs.filter(d=>d.data().password!==undefined).length===2);
ok('projection has no password and only approved ids',globalThis.pubs.size===2&&globalThis.pubs.docs.every(d=>d.data().password===undefined&&d.data().status==='approved'));
const pv=await MA.adminPreviewPasswordFields(db);
ok('preview: 3 merchants, 2 with password, 1 approved with password, ids only',pv.merchants===3&&pv.withPassword===2&&pv.approvedWithPassword===1&&JSON.stringify(pv).indexOf('S1')<0&&JSON.stringify(pv).indexOf('S2')<0,pv);
let e1='';try{await MA.adminDeletePasswordFields(db,null,pv.docs.map(d=>d.id),1)}catch(e){e1=e.message}
ok('delete refuses on count mismatch',/count-mismatch/.test(e1),e1);
let e2='';try{await MA.adminDeletePasswordFields(db,null,[],0)}catch(e){e2=e.message}
ok('delete refuses empty list',/count-mismatch/.test(e2),e2);
const FV=require('firebase/compat/app').default.firestore.FieldValue;
const dr=await MA.adminDeletePasswordFields(db,FV.delete(),pv.docs.map(d=>d.id),2);
const after=await db.collection('merchants').get();
ok('delete with matching count removes only password on listed docs, keeps other fields',dr.removed===2&&dr.errors.length===0&&after.docs.every(d=>d.data().password===undefined)&&after.docs.find(d=>d.id==='a').data().name==='A'&&after.docs.find(d=>d.id==='a').data().phone==='1',dr);
console.log('SUMMARY pass='+p+' fail='+f);await env.cleanup();process.exit(f?1:0)})();
