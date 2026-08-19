(()=>{
'use strict';
const base='../salut-fynn-v18/';
const files=['papa-1.js','papa-2.js','papa-3.js','papa-4-1.js','papa-4-2.js','papa-4-3.js','papa-4-4.js','papa-4-5.js','papa-5-1.js','papa-5-2.js','papa-5-3.js','papa-5-4.js','papa-6-1.js','papa-6-2.js','papa-6-3.js','papa-6-4.js','papa-7-1.js','papa-7-2.js','papa-7-3.js'];
let raw=[],buffers=[],ready=false,decoded=false,decoding=null,playing=false,pending=false,last=-1,tasks=0,nextAt=5+Math.floor(Math.random()*6),lastTaskAt=0,pendingSay=null,currentSource=null;
let audioCtx=null;
const TARGET_RMS=.30;      // bewusst kräftiger Sprachpegel
const MAX_GAIN=28;         // sehr leise Originale dürfen stark angehoben werden
const SOFT_START=.72;      // ab hier sanfte Begrenzung statt hartem Clipping
const OUT_CEILING=.97;

function loadScript(src){return new Promise((res,rej)=>{const s=document.createElement('script');s.src=base+src+'?v=20f';s.async=false;s.onload=res;s.onerror=()=>rej(new Error(src));document.head.appendChild(s)})}
function b64ToBuffer(data){const p=data.indexOf(',');const b64=p>=0?data.slice(p+1):data;const bin=atob(b64),u=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);return u.buffer}
function ctx(){if(!audioCtx){const C=window.AudioContext||window.webkitAudioContext;if(!C)throw new Error('Web Audio nicht verfügbar');audioCtx=new C()}return audioCtx}
async function unlock(){try{const c=ctx();if(c.state==='suspended')await c.resume()}catch(e){console.warn(e)}}

function analyse(buf){
 let peak=0,sum=0,n=0;
 for(let ch=0;ch<buf.numberOfChannels;ch++){
  const d=buf.getChannelData(ch);
  const step=Math.max(1,Math.floor(d.length/220000));
  for(let i=0;i<d.length;i+=step){
   const a=Math.abs(d[i]);
   if(a>peak)peak=a;
   if(a>.003){sum+=a*a;n++}
  }
 }
 const rms=n?Math.sqrt(sum/n):peak;
 const gain=Math.max(1,Math.min(MAX_GAIN,rms>0?TARGET_RMS/rms:1));
 return {peak,rms,gain};
}

function loudBuffer(input){
 const c=ctx(),m=analyse(input),out=c.createBuffer(input.numberOfChannels,input.length,input.sampleRate);
 for(let ch=0;ch<input.numberOfChannels;ch++){
  const src=input.getChannelData(ch),dst=out.getChannelData(ch);
  for(let i=0;i<src.length;i++){
   let y=src[i]*m.gain;
   const a=Math.abs(y);
   if(a>SOFT_START){
    const s=y<0?-1:1;
    y=s*(SOFT_START+(OUT_CEILING-SOFT_START)*(1-Math.exp(-(a-SOFT_START)*2.8)));
   }
   if(y>OUT_CEILING)y=OUT_CEILING;
   else if(y<-OUT_CEILING)y=-OUT_CEILING;
   dst[i]=y;
  }
 }
 console.log('Papa-Audio normalisiert: RMS',m.rms.toFixed(4),'Gain',m.gain.toFixed(1));
 return out;
}

async function decodeAll(){
 if(decoded)return true;
 if(decoding)return decoding;
 decoding=(async()=>{
  const c=ctx(),out=[];
  for(const item of raw){
   const ab=b64ToBuffer(item);
   const decodedBuf=await c.decodeAudioData(ab.slice(0));
   out.push(loudBuffer(decodedBuf));
  }
  buffers=out;
  decoded=buffers.length===7;
  return decoded;
 })().catch(e=>{console.warn('Papa-Audio konnte nicht dekodiert/normalisiert werden',e);decoded=false;return false}).finally(()=>{decoding=null});
 return decoding;
}

function pick(){if(buffers.length<2)return 0;let i;do{i=Math.floor(Math.random()*buffers.length)}while(i===last);return i}
function badge(){let e=document.getElementById('papaBadge');if(!e){e=document.createElement('div');e.id='papaBadge';e.textContent='💙 Nachricht von Papa';Object.assign(e.style,{position:'fixed',left:'50%',bottom:'calc(env(safe-area-inset-bottom) + 92px)',transform:'translateX(-50%) translateY(12px)',opacity:'0',zIndex:'99',background:'#17355f',color:'#fff',padding:'10px 14px',borderRadius:'999px',fontWeight:'800',fontSize:'13px',boxShadow:'0 10px 28px rgba(20,50,90,.24)',transition:'.2s',whiteSpace:'nowrap'});document.body.appendChild(e)}clearTimeout(e._t);requestAnimationFrame(()=>{e.style.opacity='1';e.style.transform='translateX(-50%) translateY(0)'});e._t=setTimeout(()=>{e.style.opacity='0';e.style.transform='translateX(-50%) translateY(12px)'},2600)}
function reset(){tasks=0;nextAt=5+Math.floor(Math.random()*6)}
function finishPapa(){playing=false;currentSource=null;if(pendingSay&&typeof window.__PAPA_ORIGINAL_SAY==='function'){const t=pendingSay;pendingSay=null;setTimeout(()=>window.__PAPA_ORIGINAL_SAY(t),180)}}

async function playPapa(force=false){
 if(!ready||(playing&&!force))return false;
 await unlock();
 if(!decoded){const ok=await decodeAll();if(!ok){pending=true;return false}}
 const i=pick();
 try{
  if(window.speechSynthesis)window.speechSynthesis.cancel();
  if(currentSource){try{currentSource.stop()}catch(e){}}
  const c=ctx(),src=c.createBufferSource();
  src.buffer=buffers[i];
  src.connect(c.destination);
  src.onended=finishPapa;
  currentSource=src;playing=true;pending=false;last=i;reset();badge();src.start(0);
  return true;
 }catch(e){playing=false;pending=true;console.warn('Papa-Audio Fehler',e);return false}
}

async function prepare(){await unlock();await decodeAll()}
document.addEventListener('pointerdown',()=>{if(ready&&!decoded)prepare()},{capture:true,passive:true});
document.addEventListener('pointerdown',()=>{if(pending&&ready&&!playing)playPapa(true)},{capture:true,passive:true});
function done(){const now=Date.now();if(now-lastTaskAt<350)return;lastTaskAt=now;tasks++;if(tasks>=nextAt)playPapa(false)}

function install(){
 if(typeof window.say==='function'){
  window.__PAPA_ORIGINAL_SAY=window.say;
  window.say=function(t){if(playing){pendingSay=t;return}return window.__PAPA_ORIGINAL_SAY(t)};
 }
 const r=window.rate;if(typeof r==='function')window.rate=function(){const o=r.apply(this,arguments);done();return o};
 const a=window.answer;if(typeof a==='function')window.answer=function(){const o=a.apply(this,arguments);done();return o};
 const x=window.answerExam;if(typeof x==='function')window.answerExam=function(){const o=x.apply(this,arguments);done();return o};
 const rc=document.querySelector('#result .resultCard');
 if(rc&&!rc.querySelector('.papaMotivationBtn')){
  const b=document.createElement('button');b.className='secondary papaMotivationBtn';b.style.marginTop='9px';b.textContent='💙 Nachricht von Papa';b.onclick=()=>playPapa(true);const first=rc.querySelector('.primary');if(first)rc.insertBefore(b,first);else rc.appendChild(b);
 }
 const manage=document.querySelector('#manage .panel');
 if(manage&&!manage.querySelector('.papaAudioTestBtn')){
  const b=document.createElement('button');b.className='secondary papaAudioTestBtn';b.style.marginTop='8px';b.textContent='💙 Papa-Aufnahme testen (extra laut)';
  b.onclick=async()=>{if(!ready){if(typeof toastMsg==='function')toastMsg('Papa-Aufnahmen laden noch …');return}if(typeof toastMsg==='function')toastMsg('Papa-Aufnahme wird extra laut abgespielt …');await playPapa(true)};
  manage.appendChild(b);
 }
 window.playPapaMotivation=()=>playPapa(true);
 window.__PAPA_STATUS=()=>({ready,clips:raw.length,decoded,buffers:buffers.length,playing,pending,tasks,nextAt,last,audioContext:audioCtx?.state||'none',targetRms:TARGET_RMS,maxGain:MAX_GAIN});
}

(async()=>{
 try{
  window.PAPA_CLIPS=[];window.PAPA_B64={};
  for(const f of files)await loadScript(f);
  raw=[...window.PAPA_CLIPS];
  for(const i of [4,5,6,7])if(window.PAPA_B64[i])raw.push('data:audio/mp4;base64,'+window.PAPA_B64[i]);
  if(raw.length!==7)throw new Error('Erwartet 7 Aufnahmen, geladen '+raw.length);
  ready=true;install();console.log('Papa-Motivation bereit:',raw.length);
 }catch(e){console.warn('Papa-Motivation konnte nicht initialisiert werden',e)}
})();
})();