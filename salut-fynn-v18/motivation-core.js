(()=>{
"use strict";
const PAPA_CLIPS=window.PAPA_CLIPS||[];
let papaLast=-1;
let papaLastAt=0;
let papaTaskCount=0;
let papaNext=5+Math.floor(Math.random()*6); // 5–10 Aufgaben
let papaAttempting=false;
let papaPending=false;
const papaAudios=PAPA_CLIPS.map(src=>{const a=new Audio(src);a.preload='auto';a.volume=1;return a});

function papaPick(){
  if(PAPA_CLIPS.length<2)return 0;
  let i;
  do{i=Math.floor(Math.random()*PAPA_CLIPS.length)}while(i===papaLast);
  return i;
}

function papaBadge(){
  let el=document.getElementById('papaBadge');
  if(!el){
    el=document.createElement('div');
    el.id='papaBadge';
    el.textContent='💙 Nachricht von Papa';
    Object.assign(el.style,{position:'fixed',left:'50%',bottom:'calc(env(safe-area-inset-bottom) + 92px)',transform:'translateX(-50%) translateY(12px)',opacity:'0',zIndex:'99',background:'#17355f',color:'#fff',padding:'10px 14px',borderRadius:'999px',fontWeight:'800',fontSize:'13px',boxShadow:'0 10px 28px rgba(20,50,90,.24)',transition:'.2s',whiteSpace:'nowrap'});
    document.body.appendChild(el);
  }
  clearTimeout(el._t);
  requestAnimationFrame(()=>{el.style.opacity='1';el.style.transform='translateX(-50%) translateY(0)'});
  el._t=setTimeout(()=>{el.style.opacity='0';el.style.transform='translateX(-50%) translateY(12px)'},2400);
}

async function playPapaMotivation(force=false){
  if(!PAPA_CLIPS.length||papaAttempting)return false;
  const now=Date.now();
  if(!force&&now-papaLastAt<5000)return false;
  papaAttempting=true;
  const i=papaPick();
  const audio=papaAudios[i]||new Audio(PAPA_CLIPS[i]);
  try{
    if(window.speechSynthesis)window.speechSynthesis.cancel();
    papaAudios.forEach((a,j)=>{if(j!==i&&!a.paused){a.pause();a.currentTime=0}});
    audio.currentTime=0;
    audio.volume=1;
    await audio.play();
    papaLast=i;
    papaLastAt=Date.now();
    papaPending=false;
    papaBadge();
    return true;
  }catch(e){
    papaPending=true;
    console.warn('Papa-Audio wartet auf die nächste Berührung.',e);
    return false;
  }finally{
    papaAttempting=false;
  }
}

function resetPapaCounter(){
  papaTaskCount=0;
  papaNext=5+Math.floor(Math.random()*6);
}

function papaTaskDone(){
  papaTaskCount++;
  if(papaTaskCount<papaNext)return;
  playPapaMotivation(false).then(ok=>{if(ok)resetPapaCounter()});
}

// Falls iOS einen ersten Abspielversuch blockiert, wird beim nächsten echten Tippen erneut versucht.
document.addEventListener('click',()=>{
  if(papaPending&&!papaAttempting){
    playPapaMotivation(true).then(ok=>{if(ok)resetPapaCounter()});
  }
},{capture:true});

// Jede beantwortete Aufgabe zählt – unabhängig davon, ob sie richtig oder falsch war.
const oldRate=window.rate;
if(typeof oldRate==='function')window.rate=function(v,btn){
  const out=oldRate.apply(this,arguments);
  papaTaskDone();
  return out;
};

const oldAnswer=window.answer;
if(typeof oldAnswer==='function')window.answer=function(b,a,c){
  const out=oldAnswer.apply(this,arguments);
  papaTaskDone();
  return out;
};

const oldAnswerExam=window.answerExam;
if(typeof oldAnswerExam==='function')window.answerExam=function(b,a,c){
  const out=oldAnswerExam.apply(this,arguments);
  papaTaskDone();
  return out;
};

const resultCard=document.querySelector('#result .resultCard');
if(resultCard&&!resultCard.querySelector('.papaMotivationBtn')){
  const btn=document.createElement('button');
  btn.className='secondary papaMotivationBtn';
  btn.style.marginTop='9px';
  btn.textContent='💙 Nachricht von Papa';
  btn.onclick=()=>playPapaMotivation(true);
  const firstPrimary=resultCard.querySelector('.primary');
  if(firstPrimary)resultCard.insertBefore(btn,firstPrimary);else resultCard.appendChild(btn);
}

window.playPapaMotivation=playPapaMotivation;
window.__PAPA_MOTIVATION_STATUS=()=>({ready:PAPA_CLIPS.length===7,clips:PAPA_CLIPS.length,tasks:papaTaskCount,next:papaNext,pending:papaPending});
})();
