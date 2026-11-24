const firebase=require('firebase/compat/app').default;require('firebase/compat/auth');require('firebase/compat/firestore');
const M=require('./merchant-auth.js');
const app=firebase.initializeApp({apiKey:'x',projectId:'demo-kt3'});
const auth=app.auth();auth.useEmulator('http://127.0.0.1:9099');
const db=app.firestore();db.useEmulator('127.0.0.1',8085);
let p=0,f=0;const T=async(n,exp,fn)=>{let r;try{await fn();r='OK'}catch(e){r='ERR:'+(e.code||e.message)}const g=(exp==='OK')?r==='OK':r.startsWith('ERR');g?p++:f++;console.log((g?'PASS ':'FAIL ')+n+' -> '+r)};
(async()=>{
 await T('register new merchant (pending, no password stored)','OK',async()=>{global.reg=await M.register(auth,db,{name:'Shop',phone:'01012345678',address:'x'},'longpass1');});
 const d=(await db.doc('merchants/'+global.reg.merchantId).get()).data();
 console.log('doc keys',Object.keys(d).join(','),'has password:','password' in d);
 await auth.signOut();
 await T('login with right password','OK',async()=>{const r=await M.login(auth,db,'01012345678','longpass1');if(r.merchantId!==global.reg.merchantId)throw new Error('wrong merchant')});
 await auth.signOut();
 await T('login wrong password','ERR',()=>M.login(auth,db,'01012345678','wrongpass1'));
 await T('weak password rejected','ERR',()=>M.register(auth,db,{name:'S2',phone:'01099999999'},'123'));
 await auth.signOut();
 console.log('SUMMARY pass='+p+' fail='+f);process.exit(f?1:0);})();
