(()=>{
'use strict';
const base='../salut-fynn-v18/';
const files=['papa-1.js','papa-2.js','papa-3.js','papa-4-1.js','papa-4-2.js','papa-4-3.js','papa-4-4.js','papa-4-5.js','papa-5-1.js','papa-5-2.js','papa-5-3.js','papa-5-4.js','papa-6-1.js','papa-6-2.js','papa-6-3.js','papa-6-4.js','papa-7-1.js','papa-7-2.js','papa-7-3.js'];
let urls=[],ready=false,primed=false,playing=false,pending=false,last=-1,tasks=0,nextAt=5+Math.floor(Math.random()*6),lastTaskAt=0,pendingSay=null;
const audio=new Audio();audio.preload='auto';audio.playsInline=true;audio.volume=1;
let audioCtx=null,mediaSource=null,gainNode=null,compressor=null,boostReady=false;
const BOOST=4.0; // ca. +12 dB, mit Kompressor gegen harte Spitzen
function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=base+src+'?v=20c';s.async=false;s.onload=res;s.onerror=()=>rej(new Error(src));document.head.appendChild(s)})}
function b64ToUrl(b64){const bin=atob(b64),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return URL.createObjectURL(new Blob([u],{type:'audio/mp4'}))}
function dataToUrl(data){const pos=data.indexOf(',');return b64ToUrl(pos>=0?data.slice(pos+1):data)}
function pick(){if(urls.length<2)return 0;let i;do{i=Math.floor(Math.random()*urls.length)}while(i===last);return i}
function badge(){let e=document.getElementById('papaBadge');if(!e){e=document.createElement('div');e.id='papaBadge';e.textContent='💙 Nachricht von Papa';Object.assign(e.style,{position:'fixed',left:'50%',bottom:'calc(env(safe-area-inset-bottom) + 92px)',transform:'translateX(-50%) translateY(12px)',opacity:'0',zIndex:'99',background:'#17355f',color:'#fff',padding:'10px 14px',borderRadius:'999px',fontWeight:'800',fontSize:'13px',boxShadow:'0 10px 28px rgba(20,50,90,.24)',transition:'.2s',whiteSpace:'nowrap'});document.body.appendChild(e)}clearTimeout(e._t);requestAnimationFrame(()=>{e.style.opacity='1';e.style.transform='translateX(-50%) translateY(0)'});e._t=setTimeout(()=>{e.style.opacity='0';e.style.transform='translateX(-50%) translateY(12px)'},2600)}
function ensureBoost(){
  try{
    const Ctx=window.AudioContext||window.webkitAudioContext;
    if(!Ctx)return false;
    if(!audioCtx)audioCtx=new Ctx();
    if(!mediaSource){
      mediaSource=audioCtx.createMediaElementSource(audio);
      gainNode=audioCtx.createGain();
      compressor=audioCtx.createDynamicsCompressor();
      gainNode.gain.value=BOOST;
      compressor.threshold.value=-20;
      compressor.knee.value=18;
      compressor.ratio.value=6;
      compressor.attack.value=.003;
      compressor.release.value=.22;
      mediaSource.connect(gainNode).connect(compressor).connect(audioCtx.destination);
      boostReady=true;
    }
    if(audioCtx.state==='suspended')audioCtx.resume().catch(()=>{});
    return true;
  }catch(e){console.warn('Audio-Verstärkung nicht verfügbar',e);return false}
}
function prime(){if(!ready||primed||playing)return;ensureBoost();try{audio.src=urls[0];audio.volume=0;const p=audio.play();if(p&&p.then)p.then(()=>{audio.pause();audio.currentTime=0;audio.volume=1;primed=true}).catch(()=>{audio.volume=1});else{audio.pause();audio.currentTime=0;audio.volume=1;primed=true}}catch(e){audio.volume=1}}
document.addEventListener('pointerdown',()=>{ensureBoost();prime()},{capture:true});
function reset(){tasks=0;nextAt=5+Math.floor(Math.random()*6)}
function playPapa(force=false){if(!ready||!urls.length||(playing&&!force))return false;ensureBoost();const i=pick();try{if(window.speechSynthesis)window.speechSynthesis.cancel();audio.pause();audio.currentTime=0;audio.volume=1;audio.src=urls[i];const p=audio.play();if(p&&p.then){p.then(()=>{last=i;playing=true;pending=false;reset();badge()}).catch(err=>{pending=true;console.warn('Papa-Audio wartet auf nächsten Tipp',err)})}else{last=i;playing=true;pending=false;reset();badge()}return true}catch(e){pending=true;console.warn('Papa-Audio Fehler',e);return false}}
audio.addEventListener('ended',()=>{playing=false;if(pendingSay&&typeof window.__PAPA_ORIGINAL_SAY==='function'){const t=pendingSay;pendingSay=null;setTimeout(()=>window.__PAPA_ORIGINAL_SAY(t),180)}});
audio.addEventListener('error',()=>{playing=false;pending=true;console.warn('Papa-Audio konnte nicht geladen werden')});
document.addEventListener('pointerdown',()=>{if(pending&&ready&&!playing)playPapa(true)},{capture:true});
function done(){const now=Date.now();if(now-lastTaskAt<350)return;lastTaskAt=now;tasks++;if(tasks>=nextAt)playPapa(false)}
function install(){
 if(typeof window.say==='function'){window.__PAPA_ORIGINAL_SAY=window.say;window.say=function(t){if(playing){pendingSay=t;return;}return window.__PAPA_ORIGINAL_SAY(t)}}
 const r=window.rate;if(typeof r==='function')window.rate=function(){const o=r.apply(this,arguments);done();return o};
 const a=window.answer;if(typeof a==='function')window.answer=function(){const o=a.apply(this,arguments);done();return o};
 const x=window.answerExam;if(typeof x==='function')window.answerExam=function(){const o=x.apply(this,arguments);done();return o};
 const rc=document.querySelector('#result .resultCard');if(rc&&!rc.querySelector('.papaMotivationBtn')){const b=document.createElement('button');b.className='secondary papaMotivationBtn';b.style.marginTop='9px';b.textContent='💙 Nachricht von Papa';b.onclick=()=>playPapa(true);const first=rc.querySelector('.primary');if(first)rc.insertBefore(b,first);else rc.appendChild(b)}
 const manage=document.querySelector('#manage .panel');if(manage&&!manage.querySelector('.papaAudioTestBtn')){const b=document.createElement('button');b.className='secondary papaAudioTestBtn';b.style.marginTop='8px';b.textContent='💙 Papa-Aufnahme testen';b.onclick=()=>{if(!ready){if(typeof toastMsg==='function')toastMsg('Papa-Aufnahmen laden noch …');return}playPapa(true)};manage.appendChild(b)}
 window.playPapaMotivation=()=>playPapa(true);window.__PAPA_STATUS=()=>({ready,clips:urls.length,primed,playing,pending,tasks,nextAt,last,boostReady,boost:BOOST,audioContext:audioCtx?.state||'none'});
}
(async()=>{try{window.PAPA_CLIPS=[];window.PAPA_B64={};for(const f of files)await loadScript(f);const raw=[...window.PAPA_CLIPS];for(const i of [4,5,6,7])if(window.PAPA_B64[i])raw.push('data:audio/mp4;base64,'+window.PAPA_B64[i]);if(raw.length!==7)throw new Error('Erwartet 7 Aufnahmen, geladen '+raw.length);urls=raw.map(dataToUrl);ready=true;audio.src=urls[0];audio.load();install();console.log('Papa-Motivation bereit:',urls.length)}catch(e){console.warn('Papa-Motivation konnte nicht initialisiert werden',e)}})();
})();
