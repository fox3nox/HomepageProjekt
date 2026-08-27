const canvas=document.getElementById('game'),ctx=canvas.getContext('2d',{alpha:false});
const W=1280,H=720,FLOOR=610,START_X=220;
let DPR=1,scale=1,VW=W,last=performance.now(),running=false,finished=false,paused=false,held=false;
const $=id=>document.getElementById(id);
const ui={hud:$('hud'),menu:$('menu'),play:$('play'),result:$('result'),again:$('again'),next:$('next'),menuBtn:$('menuBtn'),restart:$('restart'),mode:$('modeBadge'),fill:$('progressFill'),flowFill:$('flowFill'),scoreLive:$('liveScore'),combo:$('combo'),sector:$('sector'),distance:$('distance'),runTag:$('runTag'),score:$('score'),title:$('resultTitle'),resultRun:$('resultRun'),rank:$('rank'),text:$('resultText'),stars:$('stars'),time:$('timeStat'),comboStat:$('comboStat'),fluxStat:$('fluxStat'),overclockStat:$('overclockStat'),overclock:$('overclock'),overclockTime:$('overclockTime'),attempt:$('attempt'),beatFlash:$('beatFlash'),rotate:$('rotate')};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
function storeNum(k){try{return Number(localStorage.getItem(k)||0)}catch{return 0}}
function store(k,v){try{localStorage.setItem(k,String(v))}catch{}}

const RUNS=[
 {id:'core',name:'CORE',tag:'PULSE CIRCUIT · 01',end:5500,bpm:138,speed:408,accent:['#6d7cff','#8cf8ff'],target:14.8,objects:[
  {type:'glass',x:720,y:90,w:34,h:520,score:100},{type:'pit',x:1110,y:610,w:320,h:110,score:110},{type:'spikes',x:2140,y:586,w:145,h:24,score:120},{type:'ceiling',x:1510,y:92,w:350,h:340},
  {type:'pad',x:1960,y:603,w:135,h:16,score:120},{type:'fragile',x:2290,y:575,w:300,h:28,score:150},{type:'fan',x:2760,y:310,w:240,h:300,score:145},
  {type:'lightgate',x:3110,y:190,w:42,h:285,score:160},{type:'glass',x:3460,y:90,w:38,h:520,score:150},{type:'checkpoint',x:3790,y:470,w:24,h:140},{type:'saw',x:3990,y:520,r:38,score:180},
  {type:'pit',x:4090,y:610,w:370,h:110,score:190},{type:'bumper',x:4660,y:552,r:36,score:185},{type:'speedgate',x:4950,y:250,w:34,h:250,score:110},{type:'finish',x:5340,y:415,w:38,h:195}
 ],flux:[{x:990,y:505},{x:1270,y:420},{x:1720,y:500},{x:2100,y:375},{x:2470,y:645},{x:2900,y:300},{x:3300,y:485},{x:3950,y:505},{x:4320,y:420},{x:4780,y:385}]},
 {id:'vector',name:'VECTOR',tag:'PULSE CIRCUIT · 02',end:6900,bpm:154,speed:440,accent:['#8b6dff','#bba7ff'],target:16.3,objects:[
  {type:'pit',x:730,y:610,w:340,h:110,score:130},{type:'spikes',x:1810,y:586,w:155,h:24,score:145},{type:'lightgate',x:1260,y:185,w:44,h:295,score:165},{type:'glass',x:1600,y:90,w:38,h:520,score:150},
  {type:'fan',x:2030,y:260,w:240,h:350,score:175},{type:'bumper',x:2300,y:552,r:36,score:185},{type:'fragile',x:2610,y:560,w:300,h:32,score:185},
  {type:'checkpoint',x:3030,y:470,w:24,h:140},{type:'saw',x:3400,y:515,r:38,score:190},{type:'crusher',x:3690,y:100,w:82,h:225,phase:.5,score:195},{type:'pit',x:4050,y:610,w:350,h:110,score:210},
  {type:'glass',x:4670,y:90,w:40,h:520,score:190},{type:'lightgate',x:5030,y:180,w:42,h:300,score:195},{type:'checkpoint',x:5250,y:470,w:24,h:140},{type:'spikes',x:5350,y:586,w:130,h:24,score:225},{type:'fan',x:5570,y:240,w:245,h:370,score:205},
  {type:'bumper',x:5860,y:550,r:38,score:215},{type:'speedgate',x:6040,y:245,w:34,h:260,score:130},{type:'fragile',x:6260,y:555,w:300,h:34,score:220},{type:'finish',x:6730,y:415,w:38,h:195}
 ],flux:[{x:920,y:430},{x:1390,y:410},{x:1810,y:505},{x:2150,y:270},{x:2380,y:400},{x:2760,y:640},{x:3380,y:455},{x:3820,y:470},{x:4240,y:405},{x:4810,y:500},{x:5170,y:400},{x:5700,y:260},{x:5940,y:385},{x:6420,y:640}]},
 {id:'apex',name:'APEX',tag:'PULSE CIRCUIT · 03',end:7750,bpm:168,speed:472,accent:['#ffd45c','#72efad'],target:18.2,objects:[
  {type:'glass',x:700,y:90,w:38,h:520,score:160},{type:'pit',x:1010,y:610,w:380,h:110,score:180},{type:'lightgate',x:1480,y:185,w:44,h:295,score:190},
  {type:'crusher',x:1880,y:100,w:82,h:235,phase:.2,score:220},{type:'fan',x:2220,y:245,w:245,h:365,score:200},{type:'bumper',x:2470,y:552,r:38,score:220},
  {type:'fragile',x:2770,y:555,w:320,h:34,score:220},{type:'slam',x:3090,y:598,w:120,h:12,score:210},{type:'checkpoint',x:3200,y:470,w:24,h:140},{type:'saw',x:3400,y:515,r:42,score:225},{type:'glass',x:3520,y:90,w:40,h:520,score:210},
  {type:'pit',x:3830,y:610,w:410,h:110,score:240},{type:'lightgate',x:4360,y:180,w:42,h:300,score:220},{type:'crusher',x:4760,y:100,w:82,h:235,phase:1.6,score:240},{type:'spikes',x:4950,y:586,w:165,h:24,score:230},
  {type:'fan',x:5150,y:230,w:250,h:380,score:230},{type:'bumper',x:5410,y:548,r:39,score:235},{type:'fragile',x:5720,y:555,w:315,h:34,score:240},{type:'checkpoint',x:5900,y:470,w:24,h:140},
  {type:'speedgate',x:6000,y:240,w:34,h:270,score:160},{type:'glass',x:6190,y:90,w:40,h:520,score:235},{type:'checkpoint',x:6350,y:470,w:24,h:140},{type:'pit',x:6510,y:610,w:400,h:110,score:260},{type:'saw',x:7160,y:515,r:42,score:260},{type:'finish',x:7580,y:415,w:38,h:195}
 ],flux:[{x:900,y:505},{x:1220,y:400},{x:1600,y:410},{x:2070,y:480},{x:2330,y:270},{x:2590,y:395},{x:2940,y:640},{x:3370,y:500},{x:3680,y:505},{x:4030,y:395},{x:4490,y:400},{x:4930,y:480},{x:5260,y:245},{x:5520,y:390},{x:5900,y:640},{x:6320,y:505},{x:6700,y:390},{x:7350,y:430}]}
];

let selectedRun=0,activeRun=RUNS[0],END_X=activeRun.end,objects=[],flux=[];
const player={x:START_X,y:505,vx:350,vy:0,r:33,targetR:33,heavy:false,grounded:false,rot:0};
let particles=[],sparks=[],rings=[],trails=[],shockwaves=[],worldTime=0,combo=0,bestCombo=0,points=0,perfects=0,fluxCount=0,fluxChain=0,lastFluxAt=-99,checkpointX=START_X,shake=0,flash=0,toastT=0,toastText='',lastSwitchT=-99,lastSwitchX=START_X,failLock=0,hitStop=0,audioCtx=null,flowMeter=0,overclockT=0,overclockCount=0,beatPulse=0,lastBeat=-1,lastHalfBeat=-1,deadT=0,respawnLabel='',jumpBuffer=0,coyote=0,airRecoverUsed=false,speedBoostT=0,attempt=1,checkpointState=null;

function cloneRun(i){selectedRun=i;activeRun=RUNS[i];END_X=activeRun.end;objects=activeRun.objects.map(o=>({...o,done:false}));flux=activeRun.flux.map(f=>({...f,taken:false}));refreshMenu()}
function audio(){try{return audioCtx||=(new(window.AudioContext||window.webkitAudioContext))}catch{return null}}
function tone(freq=440,d=.06,type='sine',vol=.035){const a=audio();if(!a)return;try{const o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(vol,a.currentTime);g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+d);o.connect(g).connect(a.destination);o.start();o.stop(a.currentTime+d)}catch{}}
function haptic(ms=12){try{navigator.vibrate?.(ms)}catch{}}
function resize(){const r=canvas.getBoundingClientRect();DPR=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(r.width*DPR);canvas.height=Math.round(r.height*DPR);scale=canvas.height/H;VW=canvas.width/scale;ui.rotate.classList.toggle('hidden',innerWidth>=innerHeight)}
addEventListener('resize',resize);resize();addEventListener('visibilitychange',()=>{paused=document.hidden;if(paused&&running)setMode(false,false)});

function resetRun(){
 worldTime=0;combo=0;bestCombo=0;points=0;perfects=0;fluxCount=0;fluxChain=0;lastFluxAt=-99;checkpointX=START_X;flowMeter=0;overclockT=0;overclockCount=0;beatPulse=0;lastBeat=-1;lastHalfBeat=-1;deadT=0;respawnLabel='';jumpBuffer=0;coyote=0;airRecoverUsed=false;speedBoostT=0;attempt=1;
 shake=0;flash=0;particles=[];sparks=[];rings=[];trails=[];shockwaves=[];held=false;finished=false;paused=false;failLock=0;hitStop=0;
 player.x=START_X;player.y=505;player.vx=350;player.vy=0;player.r=33;player.targetR=33;player.heavy=false;player.rot=0;lastSwitchT=-99;lastSwitchX=START_X;
 objects=activeRun.objects.map(o=>({...o,done:false}));flux=activeRun.flux.map(f=>({...f,taken:false}));checkpointState={x:START_X,time:0,points:0,perfects:0,fluxCount:0,flowMeter:0,overclockCount:0,bestCombo:0,objects:objects.map(()=>false),flux:flux.map(()=>false)};ui.result.classList.add('hidden');setMode(false,false);updateHud();
}
function startRun(i=selectedRun){cloneRun(i);resetRun();ui.menu.classList.add('hidden');ui.result.classList.add('hidden');ui.hud.classList.remove('hidden');ui.mode.classList.remove('hidden');running=true;audio()?.resume?.()}
function showMenu(){running=false;finished=false;ui.result.classList.add('hidden');ui.hud.classList.add('hidden');ui.mode.classList.add('hidden');ui.overclock.classList.add('hidden');ui.menu.classList.remove('hidden');refreshMenu()}

function jumpNow(power=-930){player.vy=power;player.grounded=false;coyote=0;jumpBuffer=0;airRecoverUsed=false;shock(player.x,player.y+player.r,'#8cf8ff');emit(player.x,player.y+player.r,'#8cf8ff',16,210,120);shake=Math.max(shake,3.5);tone(650,.04,'triangle',.018)}
function setMode(h,fx=true){
 if(player.heavy===h&&held===h)return;
 const wasHeavy=player.heavy;held=h;player.heavy=h;player.targetR=h?25:34;lastSwitchT=worldTime;lastSwitchX=player.x;
 ui.mode.classList.toggle('heavy',h);ui.mode.classList.toggle('light',!h);ui.mode.querySelector('b').textContent=h?'HEAVY':'LIGHT';ui.mode.querySelector('small').textContent=h?'HALTEN':'LOSLASSEN';
 if(!h&&wasHeavy){
   jumpBuffer=.12;
   if(player.grounded||coyote>0)jumpNow(-955);
   else if(!airRecoverUsed){player.vy=Math.max(-180,player.vy-175);airRecoverUsed=true;jumpBuffer=0}
 }else if(h&&!wasHeavy&&!player.grounded){player.vy+=260;airRecoverUsed=true}
 if(fx){
   ring(player.x,player.y,h?'#ffd45c':'#8cf8ff',.23);tone(h?112:640,.04,h?'square':'triangle',.024);
   const phase=((worldTime*(activeRun.bpm||140)/60)%1),d=Math.min(phase,1-phase);
   if(d<.085){chargeFlow(7);flash=Math.max(flash,.09);toast(h?'SYNC · DROP':'SYNC · LIFT')}
 }
}
function press(e){if(!running||finished||paused)return;e.preventDefault();audio()?.resume?.();setMode(true)}function release(e){if(!running||finished||paused)return;e?.preventDefault?.();setMode(false)}
canvas.addEventListener('pointerdown',press,{passive:false});canvas.addEventListener('pointerup',release,{passive:false});canvas.addEventListener('pointercancel',release,{passive:false});canvas.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')release(e)},{passive:false});

function emit(x,y,color,n=12,power=220,gravity=420){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=35+Math.random()*power;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.24+Math.random()*.55,size:2+Math.random()*5,color,gravity})}}
function spark(x,y,n=10){for(let i=0;i<n;i++){const a=-Math.PI/2+(Math.random()-.5)*1.75,s=100+Math.random()*300;sparks.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.18+Math.random()*.35})}}
function ring(x,y,color,life=.38){rings.push({x,y,r:8,life,max:life,color})}function shock(x,y,color){shockwaves.push({x,y,r:16,life:.3,max:.3,color})}function toast(t){toastText=t;toastT=.78}function perfectWindow(){return worldTime-lastSwitchT<.55||Math.abs(player.x-lastSwitchX)<155}
function chargeFlow(v){if(overclockT>0)return;flowMeter=clamp(flowMeter+v,0,100);if(flowMeter>=100)activateOverclock()}
function activateOverclock(){flowMeter=0;overclockT=5;overclockCount++;toast('OVERDRIVE · ×2 SCORE');flash=.26;shake=7;ring(player.x,player.y,'#ffffff',.55);emit(player.x,player.y,'#bba7ff',30,300,100);tone(980,.18,'triangle',.06);haptic(30)}
function reward(label,pts,forcePerfect=false){const perfect=forcePerfect||perfectWindow(),mult=1+Math.min(1.5,combo*.11),oc=overclockT>0?2:1,gain=Math.round(pts*mult*(perfect?1.25:1)*oc);points+=gain;combo++;bestCombo=Math.max(bestCombo,combo);if(perfect)perfects++;chargeFlow(perfect?18:9);flash=Math.max(flash,.15);ring(player.x,player.y,perfect?'#ffd45c':'#8cf8ff');emit(player.x,player.y,perfect?'#ffd45c':'#8cf8ff',perfect?22:13,260);toast(`${perfect?'PERFECT · ':''}${label} +${gain}`);tone(perfect?760:560,.07,'triangle',.045);hitStop=Math.max(hitStop,perfect?.04:.022);if(perfect)haptic(16);updateHud()}
function fail(label='MISS'){if(failLock>0)return;failLock=.55;combo=0;flowMeter=Math.max(0,flowMeter-28);shake=Math.max(shake,10);flash=Math.max(flash,.09);hitStop=Math.max(hitStop,.04);emit(player.x,player.y,'#ff5e78',18,220);toast(label);tone(105,.11,'sawtooth',.05);haptic(24);updateHud()}
function rectCircle(o){const cx=clamp(player.x,o.x,o.x+o.w),cy=clamp(player.y,o.y,o.y+o.h),dx=player.x-cx,dy=player.y-cy,d2=dx*dx+dy*dy;if(d2>=player.r*player.r)return null;const d=Math.sqrt(d2)||.001;return{nx:dx/d,ny:dy/d,pen:player.r-d}}
function respawn(label='CRASH!'){if(checkpointState){worldTime=checkpointState.time;points=checkpointState.points;perfects=checkpointState.perfects;fluxCount=checkpointState.fluxCount;flowMeter=checkpointState.flowMeter;overclockCount=checkpointState.overclockCount;bestCombo=checkpointState.bestCombo;objects.forEach((o,i)=>o.done=!!checkpointState.objects[i]);flux.forEach((f,i)=>f.taken=!!checkpointState.flux[i]);}combo=0;overclockT=0;lastBeat=-1;lastHalfBeat=-1;setMode(false,false);player.x=Math.max(START_X,checkpointX);player.y=FLOOR-34;player.vy=0;player.vx=activeRun.speed||390;player.grounded=true;coyote=.11;jumpBuffer=0;airRecoverUsed=false;speedBoostT=0;shock(player.x,player.y,'#ff5e78');updateHud()}
function hardCrash(label='CRASH!'){if(deadT>0)return;fail(label);attempt++;deadT=.16;respawnLabel=label;hitStop=Math.max(hitStop,.065);emit(player.x,player.y,'#ff466b',38,390);spark(player.x,player.y,18);shock(player.x,player.y,'#ff466b');shake=Math.max(shake,15)}
function beatTick(){const bpm=activeRun.bpm||140,half=Math.floor(worldTime*bpm/60*2),beat=Math.floor(half/2);if(half!==lastHalfBeat){lastHalfBeat=half;if(half%2){tone(760,.022,'triangle',.006)}}if(beat!==lastBeat){lastBeat=beat;beatPulse=1;const accent=beat%4===0;tone(accent?68:92,.045,'sine',accent?.024:.012)}}
