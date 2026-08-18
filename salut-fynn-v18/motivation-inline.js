(()=>{
"use strict";
const PAPA_SEGMENTS=[
{start:0,dur:4.412},{start:4.412,dur:3.298},{start:7.710,dur:4.644},
{start:12.354,dur:6.270},{start:18.624,dur:5.759},{start:24.383,dur:5.341},{start:29.724,dur:2.787}
];
let papaLast=-1,papaAudio=null,papaTimer=null,papaLastAt=0,papaWins=0,papaNext=2+Math.floor(Math.random()*3);
function papaPick(){let i;do{i=Math.floor(Math.random()*PAPA_SEGMENTS.length)}while(PAPA_SEGMENTS.length>1&&i===papaLast);return i}
function papaBadge(){let el=document.getElementById('papaBadge');if(!el){el=document.createElement('div');el.id='papaBadge';el.textContent='💙 Nachricht von Papa';Object.assign(el.style,{position:'fixed',left:'50%',bottom:'calc(env(safe-area-inset-bottom) + 92px)',transform:'translateX(-50%) translateY(12px)',opacity:'0',zIndex:'99',background:'#17355f',color:'#fff',padding:'10px 14px',borderRadius:'999px',fontWeight:'800',fontSize:'13px',boxShadow:'0 10px 28px rgba(20,50,90,.24)',transition:'.2s',whiteSpace:'nowrap'});document.body.appendChild(el)}clearTimeout(el._t);requestAnimationFrame(()=>{el.style.opacity='1';el.style.transform='translateX(-50%) translateY(0)'});el._t=setTimeout(()=>{el.style.opacity='0';el.style.transform='translateX(-50%) translateY(12px)'},2200)}
function playPapaMotivation(force=false){const now=Date.now();if(!force&&now-papaLastAt<9000)return false;const i=papaPick(),seg=PAPA_SEGMENTS[i];try{if(window.speechSynthesis)window.speechSynthesis.cancel();clearTimeout(papaTimer);if(!papaAudio){papaAudio=new Audio('papa-sprite.m4a');papaAudio.preload='auto'}else papaAudio.pause();papaAudio.currentTime=Math.max(0,seg.start+.015);const p=papaAudio.play();if(p&&p.catch)p.catch(()=>{});papaTimer=setTimeout(()=>{try{papaAudio.pause()}catch(e){}},Math.max(300,(seg.dur-.04)*1000));papaLast=i;papaLastAt=now;papaBadge();return true}catch(e){console.warn('Papa-Audio konnte nicht abgespielt werden',e);return false}}
function papaSuccess(){papaWins++;if(papaWins>=papaNext&&playPapaMotivation(false)){papaWins=0;papaNext=2+Math.floor(Math.random()*3)}}
const oldRate=window.rate;if(typeof oldRate==='function')window.rate=function(v,btn){const out=oldRate.apply(this,arguments);if(v===2)papaSuccess();return out};
const oldAnswer=window.answer;if(typeof oldAnswer==='function')window.answer=function(b,a,c){const ok=a===c,out=oldAnswer.apply(this,arguments);if(ok)papaSuccess();return out};
const oldAnswerExam=window.answerExam;if(typeof oldAnswerExam==='function')window.answerExam=function(b,a,c){const ok=a===c,out=oldAnswerExam.apply(this,arguments);if(ok)papaSuccess();return out};
const resultCard=document.querySelector('#result .resultCard');if(resultCard&&!resultCard.querySelector('.papaMotivationBtn')){const btn=document.createElement('button');btn.className='secondary papaMotivationBtn';btn.style.marginTop='9px';btn.textContent='💙 Nachricht von Papa';btn.onclick=()=>playPapaMotivation(true);const firstPrimary=resultCard.querySelector('.primary');if(firstPrimary)resultCard.insertBefore(btn,firstPrimary);else resultCard.appendChild(btn)}
window.playPapaMotivation=playPapaMotivation;
window.__papaSegments=PAPA_SEGMENTS;
})();
