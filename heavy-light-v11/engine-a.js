const canvas=document.getElementById('game'),ctx=canvas.getContext('2d',{alpha:false});
const W=1280,H=720,FLOOR=610,START_X=220;
let DPR=1,scale=1,VW=W,last=performance.now(),running=false,finished=false,paused=false,held=false;
const $=id=>document.getElementById(id);
const ui={hud:$('hud'),menu:$('menu'),play:$('play'),result:$('result'),again:$('again'),next:$('next'),menuBtn:$('menuBtn'),restart:$('restart'),mode:$('modeBadge'),fill:$('progressFill'),flowFill:$('flowFill'),scoreLive:$('liveScore'),combo:$('combo'),sector:$('sector'),distance:$('distance'),runTag:$('runTag'),score:$('score'),title:$('resultTitle'),resultRun:$('resultRun'),rank:$('rank'),text:$('resultText'),stars:$('stars'),time:$('timeStat'),comboStat:$('comboStat'),fluxStat:$('fluxStat'),overclockStat:$('overclockStat'),overclock:$('overclock'),overclockTime:$('overclockTime'),attempt:$('attempt'),beatFlash:$('beatFlash'),rotate:$('rotate')};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
function storeNum(k){try{return Number(localStorage.getItem(k)||0)}catch{return 0}}
function store(k,v){try{localStorage.setItem(k,String(v))}catch{}}

const RUNS=[
 {id:'core',name:'CORE',tag:'PULSE CIRCUIT X · 01',end:6000,bpm:144,speed:440,accent:['#6d7cff','#83fbff'],target:14.4,objects:[
  {type:'glass',x:720,y:90,w:34,h:520,score:100},{type:'pit',x:1150,y:610,w:310,h:110,score:110},{type:'ceiling',x:1640,y:92,w:330,h:340},
  {type:'pad',x:2100,y:603,w:135,h:16,score:120},{type:'spikes',x:2320,y:586,w:135,h:24,score:125},{type:'fragile',x:2700,y:575,w:280,h:28,score:150},
  {type:'fan',x:3150,y:310,w:230,h:300,score:145},{type:'lightgate',x:3500,y:190,w:42,h:285,score:160},{type:'glass',x:3850,y:90,w:38,h:520,score:155},
  {type:'checkpoint',x:4150,y:470,w:24,h:140},{type:'saw',x:4480,y:520,r:38,score:180},{type:'pit',x:4830,y:610,w:310,h:110,score:190},
  {type:'bumper',x:5360,y:552,r:36,score:185},{type:'speedgate',x:5590,y:250,w:34,h:250,score:110},{type:'finish',x:5860,y:415,w:38,h:195}
 ],flux:[{x:990,y:505},{x:1300,y:410},{x:1830,y:500},{x:2180,y:360},{x:2470,y:500},{x:2860,y:500},{x:3260,y:300},{x:3690,y:485},{x:4370,y:450},{x:5020,y:400},{x:5480,y:395}]},
 {id:'vector',name:'VECTOR',tag:'PULSE CIRCUIT · 02',end:7040,bpm:162,speed:474,accent:['#8b6dff','#bba7ff'],target:15.1,objects:[
  {type:'pit',x:730,y:610,w:340,h:110,score:130},{type:'spikes',x:1810,y:586,w:155,h:24,score:145},{type:'lightgate',x:1260,y:185,w:44,h:295,score:165},{type:'glass',x:1600,y:90,w:38,h:520,score:150},
  {type:'fan',x:2030,y:260,w:240,h:350,score:175},{type:'bumper',x:2300,y:552,r:36,score:185},{type:'fragile',x:2610,y:560,w:300,h:32,score:185},
  {type:'checkpoint',x:3030,y:470,w:24,h:140},{type:'saw',x:3400,y:515,r:38,score:190},{type:'crusher',x:3690,y:100,w:82,h:225,phase:.5,score:195},{type:'pit',x:4050,y:610,w:350,h:110,score:210},
  {type:'glass',x:4670,y:90,w:40,h:520,score:190},{type:'lightgate',x:5030,y:180,w:42,h:300,score:195},{type:'checkpoint',x:5180,y:470,w:24,h:140},{type:'spikes',x:5550,y:586,w:130,h:24,score:225},{type:'fan',x:5750,y:240,w:245,h:370,score:205},
  {type:'bumper',x:6040,y:550,r:38,score:215},{type:'speedgate',x:6230,y:245,w:34,h:260,score:130},{type:'fragile',x:6460,y:555,w:300,h:34,score:220},{type:'finish',x:6860,y:415,w:38,h:195}
 ],flux:[{x:920,y:430},{x:1390,y:410},{x:1810,y:505},{x:2150,y:270},{x:2380,y:400},{x:2760,y:640},{x:3380,y:455},{x:3820,y:470},{x:4240,y:405},{x:4810,y:500},{x:5320,y:410},{x:5700,y:470},{x:5920,y:260},{x:6140,y:390},{x:6620,y:500}]},
 {id:'apex',name:'APEX',tag:'PULSE CIRCUIT X · 03',end:8520,bpm:176,speed:505,accent:['#ffd769','#6ef7b4'],target:17.2,objects:[
  {type:'glass',x:700,y:90,w:38,h:520,score:160},{type:'pit',x:1040,y:610,w:360,h:110,score:180},{type:'lightgate',x:1500,y:185,w:44,h:295,score:190},
  {type:'crusher',x:1880,y:100,w:82,h:235,phase:.2,score:220},{type:'fan',x:2220,y:245,w:245,h:365,score:200},{type:'bumper',x:2480,y:552,r:38,score:220},
  {type:'fragile',x:2800,y:555,w:320,h:34,score:220},{type:'slam',x:3120,y:598,w:120,h:12,score:210},{type:'checkpoint',x:3300,y:470,w:24,h:140},
  {type:'saw',x:3650,y:515,r:42,score:225},{type:'glass',x:3850,y:90,w:40,h:520,score:210},{type:'pit',x:4250,y:610,w:380,h:110,score:240},
  {type:'lightgate',x:4720,y:180,w:42,h:300,score:220},{type:'crusher',x:5100,y:100,w:82,h:235,phase:1.6,score:240},{type:'spikes',x:5350,y:586,w:165,h:24,score:230},
  {type:'fan',x:5600,y:230,w:250,h:380,score:230},{type:'bumper',x:5900,y:548,r:39,score:235},{type:'fragile',x:6200,y:555,w:315,h:34,score:240},
  {type:'checkpoint',x:6500,y:470,w:24,h:140},{type:'speedgate',x:6660,y:240,w:34,h:270,score:160},{type:'glass',x:6920,y:90,w:40,h:520,score:235},
  {type:'pit',x:7320,y:610,w:380,h:110,score:260},{type:'saw',x:7920,y:515,r:42,score:260},{type:'finish',x:8350,y:415,w:38,h:195}
 ],flux:[{x:900,y:505},{x:1220,y:400},{x:1620,y:410},{x:2070,y:480},{x:2330,y:270},{x:2600,y:395},{x:2960,y:500},{x:3480,y:460},{x:3740,y:430},{x:4080,y:395},{x:4470,y:390},{x:4850,y:410},{x:5250,y:480},{x:5710,y:250},{x:6030,y:390},{x:6380,y:500},{x:6770,y:420},{x:7130,y:490},{x:7500,y:390},{x:8140,y:430}]}

];

let selectedRun=0,activeRun=RUNS[0],END_X=activeRun.end,objects=[],flux=[];
const player={x:START_X,y:505,vx:350,vy:0,r:33,targetR:33,heavy:false,grounded:false,rot:0};
let particles=[],sparks=[],rings=[],trails=[],shockwaves=[],worldTime=0,combo=0,bestCombo=0,points=0,perfects=0,fluxCount=0,fluxChain=0,lastFluxAt=-99,checkpointX=START_X,shake=0,flash=0,toastT=0,toastText='',lastSwitchT=-99,lastSwitchX=START_X,failLock=0,hitStop=0,audioCtx=null,audioMaster=null,audioNoise=null,flowMeter=0,overclockT=0,overclockCount=0,beatPulse=0,lastBeat=-1,lastHalfBeat=-1,deadT=0,respawnLabel='',jumpBuffer=0,coyote=0,airRecoverUsed=false,speedBoostT=0,attempt=1,checkpointState=null,landingPulse=0,gatePulse=0,gateColor='#8cf8ff';

function cloneRun(i){selectedRun=i;activeRun=RUNS[i];END_X=activeRun.end;objects=activeRun.objects.map(o=>({...o,done:false}));flux=activeRun.flux.map(f=>({...f,taken:false}));refreshMenu()}
function audio(){try{if(!audioCtx){audioCtx=new(window.AudioContext||window.webkitAudioContext)();audioMaster=audioCtx.createGain();audioMaster.gain.value=.48;const comp=audioCtx.createDynamicsCompressor();comp.threshold.value=-20;comp.knee.value=18;comp.ratio.value=4;comp.attack.value=.004;comp.release.value=.16;audioMaster.connect(comp).connect(audioCtx.destination);const len=Math.max(1,Math.floor(audioCtx.sampleRate*.2));audioNoise=audioCtx.createBuffer(1,len,audioCtx.sampleRate);const d=audioNoise.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;}return audioCtx}catch{return null}}
function outNode(){audio();return audioMaster||audioCtx?.destination}
function tone(freq=440,d=.06,type='sine',vol=.035,detune=0){const a=audio();if(!a)return;try{const o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.value=freq;o.detune.value=detune;g.gain.setValueAtTime(Math.max(.0001,vol),a.currentTime);g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+d);o.connect(g).connect(outNode());o.start();o.stop(a.currentTime+d)}catch{}}
function kick(accent=false){const a=audio();if(!a)return;try{const o=a.createOscillator(),g=a.createGain(),t=a.currentTime;o.type='sine';o.frequency.setValueAtTime(accent?118:102,t);o.frequency.exponentialRampToValueAtTime(42,t+.10);g.gain.setValueAtTime(accent?.18:.125,t);g.gain.exponentialRampToValueAtTime(.0001,t+.14);o.connect(g).connect(outNode());o.start(t);o.stop(t+.15)}catch{}}
function hat(open=false){const a=audio();if(!a||!audioNoise)return;try{const src=a.createBufferSource(),hp=a.createBiquadFilter(),g=a.createGain(),t=a.currentTime;src.buffer=audioNoise;hp.type='highpass';hp.frequency.value=open?6200:7600;g.gain.setValueAtTime(open?.028:.018,t);g.gain.exponentialRampToValueAtTime(.0001,t+(open?.09:.035));src.connect(hp).connect(g).connect(outNode());src.start(t);src.stop(t+(open?.10:.045))}catch{}}
function snare(){const a=audio();if(!a||!audioNoise)return;try{const src=a.createBufferSource(),bp=a.createBiquadFilter(),g=a.createGain(),t=a.currentTime;src.buffer=audioNoise;bp.type='bandpass';bp.frequency.value=1850;bp.Q.value=.7;g.gain.setValueAtTime(.075,t);g.gain.exponentialRampToValueAtTime(.0001,t+.11);src.connect(bp).connect(g).connect(outNode());src.start(t);src.stop(t+.12);tone(180,.07,'triangle',.025)}catch{}}
function bass(note=55,accent=false){const a=audio();if(!a)return;try{const o=a.createOscillator(),lp=a.createBiquadFilter(),g=a.createGain(),t=a.currentTime;o.type='sawtooth';o.frequency.value=note;lp.type='lowpass';lp.frequency.value=accent?520:340;g.gain.setValueAtTime(accent?.035:.024,t);g.gain.exponentialRampToValueAtTime(.0001,t+.11);o.connect(lp).connect(g).connect(outNode());o.start(t);o.stop(t+.12)}catch{}}
function haptic(ms=12){try{navigator.vibrate?.(ms)}catch{}}
function resize(){const r=canvas.getBoundingClientRect();DPR=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(r.width*DPR);canvas.height=Math.round(r.height*DPR);scale=canvas.height/H;VW=canvas.width/scale;ui.rotate.classList.toggle('hidden',innerWidth>=innerHeight)}
addEventListener('resize',resize);resize();addEventListener('visibilitychange',()=>{paused=document.hidden;if(paused&&running)setMode(false,false)});

function resetRun(){
 worldTime=0;combo=0;bestCombo=0;points=0;perfects=0;fluxCount=0;fluxChain=0;lastFluxAt=-99;checkpointX=START_X;flowMeter=0;overclockT=0;overclockCount=0;beatPulse=0;lastBeat=-1;lastHalfBeat=-1;deadT=0;respawnLabel='';jumpBuffer=0;coyote=0;airRecoverUsed=false;speedBoostT=0;attempt=1;
 shake=0;flash=0;particles=[];sparks=[];rings=[];trails=[];shockwaves=[];held=false;finished=false;paused=false;failLock=0;hitStop=0;landingPulse=0;gatePulse=0;gateColor='#8cf8ff';
 player.x=START_X;player.y=505;player.vx=350;player.vy=0;player.r=33;player.targetR=33;player.heavy=false;player.rot=0;lastSwitchT=-99;lastSwitchX=START_X;
 objects=activeRun.objects.map(o=>({...o,done:false}));flux=activeRun.flux.map(f=>({...f,taken:false}));checkpointState={x:START_X,time:0,points:0,perfects:0,fluxCount:0,flowMeter:0,overclockCount:0,bestCombo:0,objects:objects.map(()=>false),flux:flux.map(()=>false)};ui.result.classList.add('hidden');setMode(false,false);updateHud();
}
function startRun(i=selectedRun){cloneRun(i);resetRun();ui.menu.classList.add('hidden');ui.result.classList.add('hidden');ui.hud.classList.remove('hidden');ui.mode.classList.remove('hidden');running=true;const a=audio();a?.resume?.();setTimeout(()=>{if(running){kick(true);bass(selectedRun===2?65.4:55,true)}},45)}
function showMenu(){running=false;finished=false;ui.result.classList.add('hidden');ui.hud.classList.add('hidden');ui.mode.classList.add('hidden');ui.overclock.classList.add('hidden');ui.menu.classList.remove('hidden');refreshMenu()}

function jumpNow(power=-1010){player.vy=power;player.grounded=false;coyote=0;jumpBuffer=0;airRecoverUsed=false;shock(player.x,player.y+player.r,'#8cf8ff');emit(player.x,player.y+player.r,'#8cf8ff',22,260,110);shake=Math.max(shake,5.1);tone(720,.045,'triangle',.026);tone(360,.05,'sine',.012)}
function setMode(h,fx=true){
 if(player.heavy===h&&held===h)return;
 const wasHeavy=player.heavy;held=h;player.heavy=h;player.targetR=h?24:32;lastSwitchT=worldTime;lastSwitchX=player.x;
 ui.mode.classList.toggle('heavy',h);ui.mode.classList.toggle('light',!h);ui.mode.querySelector('b').textContent=h?'HEAVY':'LIGHT';ui.mode.querySelector('small').textContent=h?'HALTEN':'LOSLASSEN';
 if(!h&&wasHeavy){
   const dive=clamp(Math.max(0,player.vy),0,1100);
   jumpBuffer=.18;
   if(player.grounded||coyote>0)jumpNow(-1125-Math.min(85,dive*.06));
   else if(!airRecoverUsed){player.vy=Math.min(-260,player.vy-(310+Math.min(240,dive*.22)));airRecoverUsed=true;jumpBuffer=0;shock(player.x,player.y,'#8cf8ff');emit(player.x,player.y,'#8cf8ff',14,180,60)}
 }else if(h&&!wasHeavy&&!player.grounded){player.vy+=520;shake=Math.max(shake,2.5)}
 if(fx){
   const c=h?'#ffd45c':'#8cf8ff';
   ring(player.x,player.y,c,.26);shock(player.x,player.y,c);emit(player.x,player.y,c,h?8:10,150,70);tone(h?112:640,.04,h?'square':'triangle',.024);
   const phase=((worldTime*(activeRun.bpm||140)/60)%1),d=Math.min(phase,1-phase);
   if(d<.105){chargeFlow(8);flash=Math.max(flash,.10);toast(h?'SYNC DROP':'SYNC LIFT');tone(h?220:880,.045,'triangle',.018);surge(c,.38)}
 }
}
function press(e){if(!running||finished||paused)return;e.preventDefault();audio()?.resume?.();setMode(true)}function release(e){if(!running||finished||paused)return;e?.preventDefault?.();setMode(false)}
canvas.addEventListener('pointerdown',press,{passive:false});canvas.addEventListener('pointerup',release,{passive:false});canvas.addEventListener('pointercancel',release,{passive:false});canvas.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')release(e)},{passive:false});
addEventListener('keydown',e=>{if((e.code==='Space'||e.code==='ArrowDown')&&!e.repeat){e.preventDefault();if(running&&!finished)setMode(true)}if(e.code==='KeyR'&&running){e.preventDefault();resetRun();running=true}});addEventListener('keyup',e=>{if(e.code==='Space'||e.code==='ArrowDown'){e.preventDefault();if(running&&!finished)setMode(false)}});

function emit(x,y,color,n=12,power=220,gravity=420){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=35+Math.random()*power;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.24+Math.random()*.55,size:2+Math.random()*5,color,gravity})}}
function spark(x,y,n=10){for(let i=0;i<n;i++){const a=-Math.PI/2+(Math.random()-.5)*1.75,s=100+Math.random()*300;sparks.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.18+Math.random()*.35})}}
function ring(x,y,color,life=.38){rings.push({x,y,r:8,life,max:life,color})}function shock(x,y,color){shockwaves.push({x,y,r:16,life:.3,max:.3,color})}function surge(color='#8cf8ff',power=.72){gatePulse=Math.max(gatePulse,power);gateColor=color;flash=Math.max(flash,.12+power*.1);shake=Math.max(shake,3+power*8);hitStop=Math.max(hitStop,.012+power*.018)}function toast(t){toastText=t;toastT=.78}function perfectWindow(){return worldTime-lastSwitchT<.55||Math.abs(player.x-lastSwitchX)<155}
function chargeFlow(v){if(overclockT>0)return;flowMeter=clamp(flowMeter+v,0,100);if(flowMeter>=100)activateOverclock()}
function activateOverclock(){flowMeter=0;overclockT=5.0;overclockCount++;toast('OVERDRIVE · HYPER FLOW');flash=.26;shake=7;ring(player.x,player.y,'#ffffff',.55);emit(player.x,player.y,'#bba7ff',30,300,100);tone(980,.18,'triangle',.06);haptic(30)}
function reward(label,pts,forcePerfect=false){const perfect=forcePerfect||perfectWindow(),mult=1+Math.min(1.5,combo*.11),oc=overclockT>0?2:1,gain=Math.round(pts*mult*(perfect?1.35:1)*oc);points+=gain;combo++;bestCombo=Math.max(bestCombo,combo);if(perfect)perfects++;chargeFlow(perfect?18:9);flash=Math.max(flash,.15);ring(player.x,player.y,perfect?'#ffd45c':'#8cf8ff');emit(player.x,player.y,perfect?'#ffd45c':'#8cf8ff',perfect?22:13,260);toast(`${perfect?'PERFECT · ':''}${label} +${gain}`);tone(perfect?760:560,.07,'triangle',.045);hitStop=Math.max(hitStop,perfect?.035:.018);if(perfect)haptic(16);updateHud()}
function fail(label='MISS'){if(failLock>0)return;failLock=.55;combo=0;flowMeter=Math.max(0,flowMeter-20);shake=Math.max(shake,10);flash=Math.max(flash,.09);hitStop=Math.max(hitStop,.04);emit(player.x,player.y,'#ff5e78',18,220);toast(label);tone(105,.11,'sawtooth',.05);haptic(24);updateHud()}
function rectCircle(o){const cx=clamp(player.x,o.x,o.x+o.w),cy=clamp(player.y,o.y,o.y+o.h),dx=player.x-cx,dy=player.y-cy,d2=dx*dx+dy*dy;if(d2>=player.r*player.r)return null;const d=Math.sqrt(d2)||.001;return{nx:dx/d,ny:dy/d,pen:player.r-d}}
function respawn(label='CRASH!'){if(checkpointState){worldTime=checkpointState.time;points=checkpointState.points;perfects=checkpointState.perfects;fluxCount=checkpointState.fluxCount;flowMeter=checkpointState.flowMeter;overclockCount=checkpointState.overclockCount;bestCombo=checkpointState.bestCombo;objects.forEach((o,i)=>o.done=!!checkpointState.objects[i]);flux.forEach((f,i)=>f.taken=!!checkpointState.flux[i]);}combo=0;overclockT=0;lastBeat=-1;lastHalfBeat=-1;setMode(false,false);player.x=Math.max(START_X,checkpointX);player.y=FLOOR-34;player.vy=0;player.vx=activeRun.speed||390;player.grounded=true;coyote=.12;jumpBuffer=0;airRecoverUsed=false;speedBoostT=0;shock(player.x,player.y,'#ff5e78');updateHud()}
function hardCrash(label='CRASH!'){if(deadT>0)return;fail(label);attempt++;deadT=.105;respawnLabel=label;hitStop=Math.max(hitStop,.065);emit(player.x,player.y,'#ff466b',46,430);spark(player.x,player.y,22);shock(player.x,player.y,'#ff466b');shake=Math.max(shake,17);tone(52,.14,'sawtooth',.07)}
function beatTick(){const bpm=activeRun.bpm||140,half=Math.floor(worldTime*bpm/60*2),beat=Math.floor(half/2);if(half!==lastHalfBeat){lastHalfBeat=half;hat(half%4===3);if(half%2)bass(selectedRun===2?65.4:selectedRun===1?58.3:55,false)}if(beat!==lastBeat){lastBeat=beat;beatPulse=1;const q=beat%4,accent=q===0;kick(accent);if(q===1||q===3)snare();bass(accent?(selectedRun===2?65.4:55):(selectedRun===1?49:43.65),accent)}}

