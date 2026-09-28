/* Math Academy PRO 5 — isolated full-screen learning studio */
(()=>{'use strict';
const $=id=>document.getElementById(id);
let session=null,clock=null;
const rand=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
function makeQuestion(){
 const difficulty=session.mode==='lesson'?'easy':session.mode==='battle'?'medium':session.index>5?'hard':'medium';
 const q=question(difficulty,'mix');const choices=new Set([q.answer]);
 while(choices.size<4){let n=q.answer+rand(-Math.max(8,Math.ceil(Math.abs(q.answer)*.25)),Math.max(8,Math.ceil(Math.abs(q.answer)*.25)));if(n>=0)choices.add(n)}
 return {...q,choices:[...choices].sort(()=>Math.random()-.5)};
}
function clearClock(){if(clock!==null){clearInterval(clock);clock=null}}
function launch(mode='practice',lessonId=null){
 if(session&&!confirm('Joriy mashg‘ulotdan chiqib, yangisini boshlaysizmi?'))return;
 if(mode==='lesson'&&lessonId>0&&!state.done.includes(lessonId-1)){notify('Avval oldingi darsni tugating');return}
 if(typeof stopTimer==='function')stopTimer();clearClock();
 session={mode,lessonId,index:0,score:0,hearts:5,answered:false,question:null,time:60,finished:false};
 $('studio').classList.remove('hidden');document.body.classList.add('studio-open');
 $('studioNext').onclick=null;$('studioInputForm').onsubmit=e=>{e.preventDefault();if(!$('studioInput').value.trim())return;answer(Number($('studioInput').value))};
 $('studio').setAttribute('aria-label',mode==='battle'?'Math Battle':mode==='lesson'?'Dars mashqi':'Matematika mashqi');
 if(mode==='battle'){
   clock=setInterval(()=>{if(!session||session.finished)return;session.time--;$('studioHearts').textContent='⏱ '+session.time+' s';if(session.time<=0)finish()},1000);
 }
 renderQuestion();$('studioClose').focus();
}
function renderQuestion(){
 if(!session)return;session.answered=false;session.question=makeQuestion();
 $('studioCounter').textContent=session.mode==='battle'?`⚡ ${session.score} ta to‘g‘ri · 60 soniya`:`${session.index+1} / 10 · +10 XP`;
 $('studioBar').style.width=session.mode==='battle'?((60-session.time)/60*100)+'%':(session.index*10)+'%';
 $('studioHearts').textContent=session.mode==='battle'?'⏱ '+session.time+' s':'❤️ '+session.hearts;
 $('studioTitle').textContent=({lesson:'Darsni mustahkamlang',quiz:'Bilim sinovi',battle:'Math Battle',practice:'Matematik mashqlar'})[session.mode];
 $('studioSubtitle').textContent=session.mode==='battle'?'Vaqt tugamasdan javob bering!':'To‘g‘ri javobni tanlang yoki yozing';
 $('studioIllustration').textContent=['✦','∑','π','✧','∞'][session.index%5];
 $('studioQuestion').textContent=session.question.text;
 $('studioFeedback').className='studio-feedback hidden';$('studioFeedback').textContent='';
 $('studioNext').disabled=true;$('studioNext').textContent='Javobni tanlang';$('studioHint').disabled=false;
 $('studioOptions').replaceChildren();
 session.question.choices.forEach(v=>{const b=document.createElement('button');b.type='button';b.className='studio-option';b.textContent=v;b.onclick=()=>answer(v);$('studioOptions').appendChild(b)});
 $('studioInputForm').classList.remove('hidden');$('studioInput').value='';$('studioInput').disabled=false;
}
function answer(value){
 if(!session||session.answered||session.finished)return;
 session.answered=true;const correct=value===session.question.answer;
 state.attempts++;if(correct){session.score++;recordCorrect(session.mode==='battle'?5:10)}else{if(session.mode!=='battle')session.hearts--;save()}
 document.querySelectorAll('.studio-option').forEach(b=>{b.disabled=true;if(Number(b.textContent)===session.question.answer)b.classList.add('correct');else if(Number(b.textContent)===value)b.classList.add('wrong')});
 $('studioInput').disabled=true;$('studioHint').disabled=true;
 $('studioHearts').textContent=session.mode==='battle'?'⏱ '+session.time+' s':'❤️ '+session.hearts;
 $('studioFeedback').className='studio-feedback '+(correct?'ok':'bad');
 $('studioFeedback').textContent=correct?'Ajoyib! To‘g‘ri javob! 🎉':'To‘g‘ri javob: '+session.question.answer+'. Qayta urinib ko‘rishingiz mumkin.';
 $('studioNext').disabled=false;$('studioNext').textContent=(session.mode!=='battle'&&(session.index===9||session.hearts===0))?'Natijani ko‘rish →':'Davom etish →';
}
function finish(){
 if(!session||session.finished)return;clearClock();const s=session;s.finished=true;
 if(s.mode==='lesson'&&s.lessonId!==null&&s.score>=7&&!state.done.includes(s.lessonId)){
   state.done.push(s.lessonId);state.done.sort((a,b)=>a-b);state.xp+=30;save();renderMap();
 }
 if(s.mode==='quiz'){state.quizzes++;state.bestQuiz=Math.max(state.bestQuiz,s.score*10);save()}
 if(s.mode==='battle'){state.bestBattle=Math.max(state.bestBattle,s.score);save()}
 $('studioBar').style.width='100%';$('studioIllustration').textContent=s.score>=7?'🏆':'📚';
 $('studioTitle').textContent='Mashg‘ulot yakunlandi!';
 $('studioSubtitle').textContent=s.score>=7?'Ajoyib natija!':'Mashq qilsangiz, yanada yaxshi natijaga erishasiz.';
 $('studioQuestion').textContent=s.mode==='battle'?`${s.score} ta to‘g‘ri`:`${s.score} / 10`;
 $('studioOptions').replaceChildren();$('studioInputForm').classList.add('hidden');
 $('studioFeedback').className='studio-feedback ok';
 $('studioFeedback').textContent=`${s.score*(s.mode==='battle'?5:10)} XP yig‘dingiz.`+(s.mode==='lesson'&&s.score<7?' Darsni tugatish uchun kamida 7 ta to‘g‘ri javob kerak.':'');
 $('studioNext').disabled=false;$('studioNext').textContent='Yana boshlash ↻';$('studioHint').disabled=true;
}
$('studioNext').addEventListener('click',()=>{
 if(!session)return;
 if(session.finished){const {mode,lessonId}=session;session=null;launch(mode,lessonId);return}
 if(!session.answered)return;
 session.index++;
 if((session.mode!=='battle'&&(session.index>=10||session.hearts===0))||(session.mode==='battle'&&session.time<=0))finish();else renderQuestion();
});
$('studioHint').onclick=()=>{if(!session||session.answered||session.finished)return;$('studioFeedback').className='studio-feedback ok';$('studioFeedback').textContent='Maslahat: amalni qismlarga ajrating va teskari amal bilan tekshiring.'};
$('studioClose').onclick=()=>{if(session&&!session.finished&&!confirm('Mashg‘ulotdan chiqasizmi?'))return;clearClock();session=null;$('studio').classList.add('hidden');document.body.classList.remove('studio-open');$('studioInputForm').classList.add('hidden')};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('studio').classList.contains('hidden'))$('studioClose').click()});
document.querySelectorAll('[data-studio]').forEach(b=>b.addEventListener('click',()=>launch(b.dataset.studio)));
const oldOpen=window.openLesson;if(typeof oldOpen==='function')window.openLesson=function(i){oldOpen(i);const detail=$('lessonDetail');if(detail&&!detail.querySelector('.studio-launch')){const b=document.createElement('button');b.className='studio-launch';b.textContent='✨ Ushbu dars uchun interaktiv mashq →';b.onclick=()=>launch('lesson',i);detail.appendChild(b)}};
window.launchStudio=launch;
})();
