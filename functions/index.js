const {onCall,HttpsError}=require('firebase-functions/v2/https');
const admin=require('firebase-admin');
const crypto=require('node:crypto');
admin.initializeApp();
const db=admin.firestore();
const opts={region:'us-central1',maxInstances:10,enforceAppCheck:false};
const cleanName=s=>typeof s==='string'&&/^[\p{L}\p{N}_ .-]{3,20}$/u.test(s.trim())?s.trim():'Matematik';
exports.ensureProfile=onCall(opts,async request=>{
 if(!request.auth)throw new HttpsError('unauthenticated','Akkauntga kiring');
 const uid=request.auth.uid;const ref=db.doc(`leaderboard/${uid}`);
 const snap=await ref.get();if(snap.exists)return {ok:true};
 const nickname=cleanName(request.data?.nickname||request.auth.token.name);
 try{await ref.create({nickname,xp:0,createdAt:admin.firestore.FieldValue.serverTimestamp()})}catch(err){if(err.code!==6&&err.code!=='already-exists')throw err}
 return {ok:true};
});
exports.createArenaChallenge=onCall(opts,async request=>{
 if(!request.auth)throw new HttpsError('unauthenticated','Akkauntga kiring');
 const uid=request.auth.uid;
 const recent=await db.collection('arenaChallenges').where('uid','==',uid).where('createdAt','>',admin.firestore.Timestamp.fromMillis(Date.now()-3000)).limit(1).get();
 if(!recent.empty)throw new HttpsError('resource-exhausted','3 soniya kuting');
 const rand=(a,b)=>crypto.randomInt(a,b+1);const op=rand(0,3);let a=rand(1,30),b=rand(1,20),answer,sign;
 if(op===0){answer=a+b;sign='+'}else if(op===1){if(a<b)[a,b]=[b,a];answer=a-b;sign='−'}else if(op===2){a=rand(2,12);b=rand(2,12);answer=a*b;sign='×'}else{answer=rand(2,12);a=b*answer;sign='÷'}
 const ref=db.collection('arenaChallenges').doc();
 await ref.set({uid,answer,used:false,createdAt:admin.firestore.FieldValue.serverTimestamp(),expiresAt:admin.firestore.Timestamp.fromMillis(Date.now()+120000)});
 return {id:ref.id,question:`${a} ${sign} ${b} = ?`};
});
exports.submitArenaAnswer=onCall(opts,async request=>{
 if(!request.auth)throw new HttpsError('unauthenticated','Akkauntga kiring');
 const {challengeId,answer}=request.data||{};
 if(typeof challengeId!=='string'||!/^[A-Za-z0-9]{20}$/.test(challengeId)||!Number.isSafeInteger(answer))throw new HttpsError('invalid-argument','Javob noto‘g‘ri');
 const uid=request.auth.uid;const challengeRef=db.doc(`arenaChallenges/${challengeId}`);const profileRef=db.doc(`leaderboard/${uid}`);
 return db.runTransaction(async tx=>{
  const snap=await tx.get(challengeRef);if(!snap.exists)throw new HttpsError('not-found','Savol topilmadi');
  const c=snap.data();if(c.uid!==uid||c.used||c.expiresAt.toMillis()<Date.now())throw new HttpsError('failed-precondition','Savol muddati tugagan yoki ishlatilgan');
  const profile=await tx.get(profileRef);const correct=c.answer===answer;
  tx.update(challengeRef,{used:true});
  if(correct){if(profile.exists)tx.update(profileRef,{xp:admin.firestore.FieldValue.increment(10)});else tx.set(profileRef,{nickname:'Matematik',xp:10,createdAt:admin.firestore.FieldValue.serverTimestamp()})}
  return {correct,correctAnswer:c.answer,earned:correct?10:0};
 });
});
