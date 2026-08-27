const canvas=document.getElementById('game'),ctx=canvas.getContext('2d',{alpha:false});
const W=1280,H=720,FLOOR=610,START_X=220;
let DPR=1,scale=1,VW=W,last=performance.now(),running=false,finished=false,paused=false,held=false;
const $=id=>document.getElementById(id);
const ui={hud:$('hud'),menu:$('menu'),play:$('play'),result:$('result'),again:$('again'),next:$('next'),menuBtn:$('menuBtn'),restart:$('restart'),mode:$('modeBadge'),fill:$('progressFill'),flowFill:$('flowFill'),scoreLive:$('liveScore'),combo:$('combo'),sector:$('sector'),distance:$('distance'),runTag:$('runTag'),score:$('score'),title:$('resultTitle'),resultRun:$('resultRun'),rank:$('rank'),text:$('resultText'),stars:$('stars'),time:$('timeStat'),comboStat:$('comboStat'),fluxStat:$('fluxStat'),overclockStat:$('overclockStat'),overclock:$('overclock'),overclockTime:$('overclockTime'),rotate:$('rotate')};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
function storeNum(k){try{return Number(localStorage.getItem(k)||0)}catch{return 0}}
function store(k,v){try{localStorage.setItem(k,String(v))}catch{}}

const RUNS=[
 {id:'core',name:'CORE',tag:'FLOW CIRCUIT · 01',end:5300,accent:['#6d7cff','#8cf8ff'],target:15.5,objects:[
  {type:'glass',x:720,y:90,w:34,h:520,score:100},{type:'pit',x:1110,y:610,w:320,h:110,score:110},{type:'ceiling',x:1510,y:92,w:350,h:340},
  {type:'pad',x:1960,y:603,w:135,h:16,score:120},{type:'fragile',x:2290,y:575,w:300,h:28,score:150},{type:'fan',x:2760,y:310,w:240,h:300,score:145},
  {type:'lightgate',x:3110,y:190,w:42,h:285,score:160},{type:'glass',x:3460,y:90,w:38,h:520,score:150},{type:'checkpoint',x:3790,y:470,w:24,h:140},
  {type:'pit',x:4090,y:610,w:370,h:110,score:190},{type:'bumper',x:4660,y:552,r:36,score:185},{type:'finish',x:5140,y:415,w:38,h:195}
 ],flux:[{x:990,y:505},{x:1270,y:420},{x:1720,y:500},{x:2100,y:375},{x:2470,y:645},{x:2900,y:300},{x:3300,y:485},{x:3950,y:505},{x:4320,y:420},{x:4780,y:385}]},
 {id:'vector',name:'VECTOR',tag:'FLOW CIRCUIT · 02',end:6250,accent:['#8b6dff','#bba7ff'],target:17.5,objects:[
  {type:'pit',x:730,y:610,w:340,h:110,score:130},{type:'lightgate',x:1260,y:185,w:44,h:295,score:165},{type:'glass',x:1600,y:90,w:38,h:520,score:150},
  {type:'fan',x:2030,y:260,w:240,h:350,score:175},{type:'bumper',x:2300,y:552,r:36,score:185},{type:'fragile',x:2610,y:560,w:300,h:32,score:185},
  {type:'checkpoint',x:3030,y:470,w:24,h:140},{type:'crusher',x:3380,y:100,w:82,h:235,phase:.5,score:195},{type:'pit',x:3760,y:610,w:380,h:110,score:210},
  {type:'glass',x:4380,y:90,w:40,h:520,score:190},{type:'lightgate',x:4740,y:180,w:42,h:300,score:195},{type:'fan',x:5130,y:240,w:245,h:370,score:205},
  {type:'bumper',x:5430,y:550,r:38,score:215},{type:'fragile',x:5720,y:555,w:300,h:34,score:220},{type:'finish',x:6080,y:415,w:38,h:195}
 ],flux:[{x:920,y:430},{x:1390,y:410},{x:1810,y:505},{x:2150,y:270},{x:2380,y:400},{x:2760,y:640},{x:3240,y:505},{x:3580,y:470},{x:3980,y:405},{x:4520,y:500},{x:4880,y:400},{x:5260,y:260},{x:5580,y:385},{x:5880,y:640}]},
 {id:'apex',name:'APEX',tag:'FLOW CIRCUIT · 03',end:7200,accent:['#ffd45c','#72efad'],target:19.8,objects:[
  {type:'glass',x:700,y:90,w:38,h:520,score:160},{type:'pit',x:1010,y:610,w:380,h:110,score:180},{type:'lightgate',x:1480,y:185,w:44,h:295,score:190},
  {type:'crusher',x:1880,y:100,w:82,h:235,phase:.2,score:220},{type:'fan',x:2220,y:245,w:245,h:365,score:200},{type:'bumper',x:2470,y:552,r:38,score:220},
  {type:'fragile',x:2770,y:555,w:320,h:34,score:220},{type:'checkpoint',x:3200,y:470,w:24,h:140},{type:'glass',x:3520,y:90,w:40,h:520,score:210},
  {type:'pit',x:3830,y:610,w:410,h:110,score:240},{type:'lightgate',x:4360,y:180,w:42,h:300,score:220},{type:'crusher',x:4760,y:100,w:82,h:235,phase:1.6,score:240},
  {type:'fan',x:5150,y:230,w:250,h:380,score:230},{type:'bumper',x:5410,y:548,r:39,score:235},{type:'fragile',x:5720,y:555,w:315,h:34,score:240},
  {type:'glass',x:6190,y:90,w:40,h:520,score:235},{type:'pit',x:6510,y:610,w:400,h:110,score:260},{type:'finish',x:7020,y:415,w:38,h:195}
 ],flux:[{x:900,y:505},{x:1220,y:400},{x:1600,y:410},{x:2070,y:480},{x:2330,y:270},{x:2590,y:395},{x:2940,y:640},{x:3370,y:500},{x:3680,y:505},{x:4030,y:395},{x:4490,y:400},{x:4930,y:480},{x:5260,y:245},{x:5520,y:390},{x:5900,y:640},{x:6320,y:505},{x:6700,y:390}]}
];

let selectedRun=0,activeRun=RUNS[0],END_X=activeRun.end,objects=[],flux=[];
const player={x:START_X,y:505,vx:350,vy:0,r:33,targetR:33,heavy:false,grounded:false,rot:0};
let particles=[],sparks=[],rings=[],trails=[],shockwaves=[],worldTime=0,combo=0,bestCombo=0,points=0,perfects=0,fluxCount=0,fluxChain=0,lastFluxAt=-99,checkpointX=START_X,shake=0,flash=0,toastT=0,toastText='',lastSwitchT=-99,lastSwitchX=START_X,failLock=0,hitStop=0,audioCtx=null,flowMeter=0,overclockT=0,overclockCount=0;

function cloneRun(i){selectedRun=i;activeRun=RUNS[i];END_X=activeRun.end;objects=activeRun.objects.map(o=>({...o,done:false}));flux=activeRun.flux.map(f=>({...f,taken:false}));refreshMenu()}
function audio(){try{return audioCtx||=(new(window.AudioContext||window.webkitAudioContext))}catch{return null}}
function tone(freq=440,d=.06,type='sine',vol=.035){const a=audio();if(!a)return;try{const o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(vol,a.currentTime);g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+d);o.connect(g).connect(a.destination);o.start();o.stop(a.currentTime+d)}catch{}}
function haptic(ms=12){try{navigator.vibrate?.(ms)}catch{}}
function resize(){const r=canvas.getBoundingClientRect();DPR=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(r.width*DPR);canvas.height=Math.round(r.height*DPR);scale=canvas.height/H;VW=canvas.width/scale;ui.rotate.classList.toggle('hidden',innerWidth>=innerHeight)}
addEventListener('resize',resize);resize();addEventListener('visibilitychange',()=>{paused=document.hidden;if(paused&&running)setMode(false,false)});

function resetRun(){
 worldTime=0;combo=0;bestCombo=0;points=0;perfects=0;fluxCount=0;fluxChain=0;lastFluxAt=-99;checkpointX=START_X;flowMeter=0;overclockT=0;overclockCount=0;
 shake=0;flash=0;particles=[];sparks=[];rings=[];trails=[];shockwaves=[];held=false;finished=false;paused=false;failLock=0;hitStop=0;
 player.x=START_X;player.y=505;player.vx=350;player.vy=0;player.r=33;player.targetR=33;player.heavy=false;player.rot=0;lastSwitchT=-99;lastSwitchX=START_X;
 objects=activeRun.objects.map(o=>({...o,done:false}));flux=activeRun.flux.map(f=>({...f,taken:false}));ui.result.classList.add('hidden');setMode(false,false);updateHud();
}
function startRun(i=selectedRun){cloneRun(i);resetRun();ui.menu.classList.add('hidden');ui.result.classList.add('hidden');ui.hud.classList.remove('hidden');ui.mode.classList.remove('hidden');running=true;audio()?.resume?.()}
function showMenu(){running=false;finished=false;ui.result.classList.add('hidden');ui.hud.classList.add('hidden');ui.mode.classList.add('hidden');ui.overclock.classList.add('hidden');ui.menu.classList.remove('hidden');refreshMenu()}

function setMode(h,fx=true){if(player.heavy===h&&held===h)return;held=h;player.heavy=h;player.targetR=h?25:36;lastSwitchT=worldTime;lastSwitchX=player.x;ui.mode.classList.toggle('heavy',h);ui.mode.classList.toggle('light',!h);ui.mode.querySelector('b').textContent=h?'HEAVY':'LIGHT';ui.mode.querySelector('small').textContent=h?'HALTEN':'LOSLASSEN';if(fx){ring(player.x,player.y,h?'#ffd45c':'#8cf8ff',.28);tone(h?132:540,.05,h?'square':'sine',.025)}}
function press(e){if(!running||finished||paused)return;e.preventDefault();audio()?.resume?.();setMode(true)}function release(e){if(!running||finished||paused)return;e?.preventDefault?.();setMode(false)}
canvas.addEventListener('pointerdown',press,{passive:false});canvas.addEventListener('pointerup',release,{passive:false});canvas.addEventListener('pointercancel',release,{passive:false});canvas.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')release(e)},{passive:false});

function emit(x,y,color,n=12,power=220,gravity=420){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=35+Math.random()*power;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.24+Math.random()*.55,size:2+Math.random()*5,color,gravity})}}
function spark(x,y,n=10){for(let i=0;i<n;i++){const a=-Math.PI/2+(Math.random()-.5)*1.75,s=100+Math.random()*300;sparks.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.18+Math.random()*.35})}}
function ring(x,y,color,life=.38){rings.push({x,y,r:8,life,max:life,color})}function shock(x,y,color){shockwaves.push({x,y,r:16,life:.3,max:.3,color})}function toast(t){toastText=t;toastT=.78}function perfectWindow(){return worldTime-lastSwitchT<.55||Math.abs(player.x-lastSwitchX)<155}
function chargeFlow(v){if(overclockT>0)return;flowMeter=clamp(flowMeter+v,0,100);if(flowMeter>=100)activateOverclock()}
function activateOverclock(){flowMeter=0;overclockT=5;overclockCount++;toast('OVERCLOCK · ×2 SCORE');flash=.26;shake=7;ring(player.x,player.y,'#ffffff',.55);emit(player.x,player.y,'#bba7ff',30,300,100);tone(980,.18,'triangle',.06);haptic(30)}
function reward(label,pts,forcePerfect=false){const perfect=forcePerfect||perfectWindow(),mult=1+Math.min(1.5,combo*.11),oc=overclockT>0?2:1,gain=Math.round(pts*mult*(perfect?1.25:1)*oc);points+=gain;combo++;bestCombo=Math.max(bestCombo,combo);if(perfect)perfects++;chargeFlow(perfect?18:9);flash=Math.max(flash,.15);ring(player.x,player.y,perfect?'#ffd45c':'#8cf8ff');emit(player.x,player.y,perfect?'#ffd45c':'#8cf8ff',perfect?22:13,260);toast(`${perfect?'PERFECT · ':''}${label} +${gain}`);tone(perfect?760:560,.07,'triangle',.045);hitStop=Math.max(hitStop,perfect?.04:.022);if(perfect)haptic(16);updateHud()}
function fail(label='MISS'){if(failLock>0)return;failLock=.55;combo=0;flowMeter=Math.max(0,flowMeter-28);shake=Math.max(shake,10);flash=Math.max(flash,.09);hitStop=Math.max(hitStop,.04);emit(player.x,player.y,'#ff5e78',18,220);toast(label);tone(105,.11,'sawtooth',.05);haptic(24);updateHud()}
function rectCircle(o){const cx=clamp(player.x,o.x,o.x+o.w),cy=clamp(player.y,o.y,o.y+o.h),dx=player.x-cx,dy=player.y-cy,d2=dx*dx+dy*dy;if(d2>=player.r*player.r)return null;const d=Math.sqrt(d2)||.001;return{nx:dx/d,ny:dy/d,pen:player.r-d}}
function respawn(label='ZU SCHWER!'){fail(label);setMode(false,false);player.x=Math.max(START_X,checkpointX);player.y=505;player.vy=-80;player.vx=310;shock(player.x,player.y,'#ff5e78')}

function update(dt){
 if(!running||finished||paused){fx(dt);return}if(hitStop>0){hitStop=Math.max(0,hitStop-dt);fx(dt*.35);return}
 worldTime+=dt;failLock=Math.max(0,failLock-dt);overclockT=Math.max(0,overclockT-dt);player.r=lerp(player.r,player.targetR,1-Math.pow(.0007,dt));
 const fever=combo>=5,oc=overclockT>0;player.vx=(330+Math.min(72,combo*5.5))*(fever?1.035:1)*(oc?1.13:1);
 const gravity=player.heavy?1880:330;player.vy+=gravity*dt;if(!player.heavy)player.vy-=420*dt;player.vy*=Math.pow(player.heavy?.995:.989,dt*60);player.x+=player.vx*dt;player.y+=player.vy*dt;player.rot+=player.vx*dt/player.r*.016;
 const activePit=objects.find(o=>o.type==='pit'&&player.x>o.x&&player.x<o.x+o.w),fragile=objects.find(o=>o.type==='fragile'&&player.x>o.x&&player.x<o.x+o.w);let floorY=FLOOR;if(activePit)floorY=H+100;if(fragile&&fragile.done)floorY=688;
 player.grounded=false;if(player.y+player.r>floorY){player.y=floorY-player.r;if(player.vy>0){if(player.heavy&&player.vy>440){spark(player.x,player.y+player.r,12);shake=Math.max(shake,4)}player.vy*=-(player.heavy?.16:.53)}player.grounded=true}if(player.y-player.r<88){player.y=88+player.r;if(player.vy<0)player.vy*=-.28;fail('ZU LEICHT!')}
 for(const o of objects){
  if(o.type==='glass'&&!o.done){const c=rectCircle(o);if(c){if(player.heavy){o.done=true;shake=13;spark(o.x,o.y+o.h*.55,28);emit(o.x,o.y+o.h*.5,'#ffd45c',34,380);shock(o.x,o.y+o.h*.55,'#ffd45c');reward('CRUSH',o.score)}else{player.x-=Math.max(2,c.pen+2);player.vx*=.18;fail('HALTEN!')}}}
  else if(o.type==='ceiling'){const c=rectCircle(o);if(c){player.x-=Math.max(1,c.pen*.7);player.vy=Math.max(player.vy,110);if(!player.heavy)fail('ZU GROSS!')}}
  else if(o.type==='pad'&&!o.done){if(player.x>o.x-player.r&&player.x<o.x+o.w+player.r&&player.y+player.r>o.y&&player.y<o.y+38&&player.vy>0){player.y=o.y-player.r;player.vy=player.heavy?-640:-1030;o.done=true;shake=7;emit(player.x,o.y,'#ffd45c',20,270);shock(player.x,o.y,'#ffd45c');if(!player.heavy)reward('BOOST',o.score);else fail('LOSLASSEN!')}}
  else if(o.type==='fragile'&&!o.done){if(player.x>o.x&&player.x<o.x+o.w&&player.y+player.r>o.y&&player.y<o.y+45&&player.vy>0){if(player.heavy){o.done=true;player.vy+=260;shake=14;spark(player.x,o.y,30);emit(player.x,o.y,'#ffd45c',28,320);shock(player.x,o.y,'#ffd45c');reward('BREAK',o.score)}else{player.y=o.y-player.r;player.vy*=-.48}}}
  else if(o.type==='fan'){if(player.x>o.x&&player.x<o.x+o.w&&player.y>o.y&&player.y<o.y+o.h&&!player.heavy){player.vy-=1260*dt;if(Math.random()<.2)particles.push({x:o.x+Math.random()*o.w,y:o.y+o.h,vx:(Math.random()-.5)*35,vy:-230-Math.random()*190,life:.65,size:2,color:'#8cf8ff',gravity:0});if(!o.done&&player.x>o.x+o.w*.45&&player.y<o.y+95){o.done=true;reward('LIFT',o.score)}}}
  else if(o.type==='lightgate'){const c=rectCircle(o);if(c&&player.heavy){player.x-=Math.max(3,c.pen+3);player.vx*=.4;fail('LOSLASSEN!')}else if(!o.done&&!player.heavy&&player.x>o.x+o.w*.55&&player.y>o.y-10&&player.y<o.y+o.h+10){o.done=true;ring(o.x+o.w*.5,player.y,'#8cf8ff');emit(o.x+o.w*.5,player.y,'#8cf8ff',16,180,80);reward('PHASE',o.score,true)}}
  else if(o.type==='bumper'&&!o.done){const dx=player.x-o.x,dy=player.y-o.y,limit=player.r+o.r;if(dx*dx+dy*dy<limit*limit&&player.vy>-280){const d=Math.max(.001,Math.hypot(dx,dy)),nx=dx/d,ny=dy/d;player.x=o.x+nx*(limit+2);player.y=o.y+ny*(limit+2);player.vy=player.heavy?-620:-1010;player.vx+=player.heavy?0:24;shake=Math.max(shake,player.heavy?5:8);ring(o.x,o.y,player.heavy?'#ff9aa9':'#8cf8ff');emit(o.x,o.y,player.heavy?'#ff9aa9':'#8cf8ff',player.heavy?12:20,player.heavy?160:240);o.done=true;if(player.heavy)fail('ZU SCHWER!');else reward('BOUNCE',o.score,true)}}
  else if(o.type==='checkpoint'&&!o.done&&player.x>o.x){o.done=true;checkpointX=o.x+65;points+=100;chargeFlow(12);toast('CHECKPOINT +100');tone(660,.09,'triangle',.035);ring(o.x,o.y,'#72efad');updateHud()}
  else if(o.type==='crusher'){const cyc=(Math.sin(worldTime*2.4+o.phase)+1)/2,bottom=125+cyc*255,hazard={x:o.x,y:88,w:o.w,h:bottom-88},c=rectCircle(hazard);if(c){player.x-=Math.max(6,c.pen+5);player.vy=Math.max(player.vy,160);fail('TIMING!')}else if(!o.done&&player.x>o.x+o.w+60){o.done=true;reward('DODGE',o.score||190,true)}}
 }
 for(const f of flux){if(!f.taken&&Math.hypot(player.x-f.x,player.y-f.y)<player.r+20){f.taken=true;fluxCount++;fluxChain=(worldTime-lastFluxAt<1.25)?fluxChain+1:1;lastFluxAt=worldTime;const bonus=75+combo*5+Math.min(90,fluxChain*12)*(overclockT>0?2:1);points+=bonus;chargeFlow(5);emit(f.x,f.y,'#bba7ff',18,180,100);ring(f.x,f.y,'#bba7ff');tone(900,.045,'sine',.03);if(fluxChain>=3)toast(`FLUX CHAIN ×${fluxChain} +${bonus}`);updateHud()}}
 for(const pit of objects.filter(o=>o.type==='pit'))if(!pit.done&&player.x>pit.x+45&&player.x<pit.x+pit.w-25&&!player.heavy&&player.y<575){pit.done=true;reward('FLOAT',pit.score)}
 if(player.y>H+72)respawn('ZU SCHWER!');if(player.x>=END_X)finish();updateHud();fx(dt);trails.push({x:player.x,y:player.y,life:oc?.40:(fever?.34:.24),r:player.r*(oc?.9:(fever?.82:.7)),heavy:player.heavy});if(trails.length>(oc?58:fever?48:34))trails.shift();
}

function fx(dt){toastT=Math.max(0,toastT-dt);for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.gravity??420)*dt;p.vx*=.985}particles=particles.filter(p=>p.life>0);for(const s of sparks){s.life-=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=800*dt;s.vx*=.98}sparks=sparks.filter(s=>s.life>0);for(const r of rings){r.life-=dt;r.r+=280*dt}rings=rings.filter(r=>r.life>0);for(const s of shockwaves){s.life-=dt;s.r+=360*dt}shockwaves=shockwaves.filter(s=>s.life>0);for(const t of trails)t.life-=dt;trails=trails.filter(t=>t.life>0);shake*=Math.pow(.015,dt);flash*=Math.pow(.01,dt)}
function updateHud(){const pct=clamp((player.x-START_X)/(END_X-START_X)*100,0,100);ui.fill.style.width=`${pct}%`;ui.distance.textContent=`${Math.round(pct)}%`;ui.flowFill.style.width=`${flowMeter}%`;ui.scoreLive.textContent=Math.round(points).toLocaleString('de-CH');ui.combo.textContent=`×${combo}`;ui.sector.textContent=`${activeRun.name} RUN`;ui.runTag.textContent=activeRun.tag;ui.overclock.classList.toggle('hidden',overclockT<=0);if(overclockT>0)ui.overclockTime.textContent=overclockT.toFixed(1)}
function finish(){finished=true;running=false;const timeBonus=Math.max(0,1100-worldTime*13),score=Math.round(points+bestCombo*80+perfects*34+fluxCount*35+timeBonus),ratio=worldTime/activeRun.target;let rank='C',starN=1;if(score>3300&&ratio<1.32){rank='B';starN=2}if(score>4300&&ratio<1.15){rank='A';starN=3}if(score>5100&&ratio<1.03&&perfects>=6){rank='S';starN=3}const key=`hl6_${activeRun.id}`,prevScore=storeNum(key+'_score'),prevTime=storeNum(key+'_time'),isBest=score>prevScore;if(isBest)store(key+'_score',score);if(!prevTime||worldTime<prevTime)store(key+'_time',worldTime);store(key+'_stars',Math.max(storeNum(key+'_stars'),starN));ui.score.textContent=score.toLocaleString('de-CH');ui.title.textContent=rank==='S'?'PERFEKTER FLOW!':rank==='A'?'STARKER RUN!':rank==='B'?'SAUBER!':'GESCHAFFT!';ui.rank.textContent=rank;ui.stars.textContent='★'.repeat(starN)+'☆'.repeat(3-starN);ui.time.textContent=`${worldTime.toFixed(1)}s`;ui.comboStat.textContent=`×${bestCombo}`;ui.fluxStat.textContent=`${fluxCount}/${flux.length}`;ui.overclockStat.textContent=`${overclockCount}×`;ui.resultRun.textContent=`${activeRun.name} · COMPLETE`;ui.text.textContent=`${perfects} perfekte Aktionen · ${Math.round(timeBonus)} Zeitbonus${isBest?' · NEUER BESTSCORE!':prevScore?` · Best ${prevScore.toLocaleString('de-CH')}`:''}`;ui.next.classList.toggle('hidden',selectedRun>=RUNS.length-1);tone(740,.23,'triangle',.065);setTimeout(()=>{ui.hud.classList.add('hidden');ui.mode.classList.add('hidden');ui.overclock.classList.add('hidden');ui.result.classList.remove('hidden')},320)}
function refreshMenu(){document.querySelectorAll('.runCard').forEach((el,i)=>{el.classList.toggle('active',i===selectedRun);const run=RUNS[i],score=storeNum(`hl6_${run.id}_score`),stars=storeNum(`hl6_${run.id}_stars`),record=$(`record${i}`);record.textContent=score?`${'★'.repeat(stars)} ${score.toLocaleString('de-CH')}`:'NEU'});ui.play.textContent=`RUN 0${selectedRun+1} STARTEN`}

document.querySelectorAll('.runCard').forEach(el=>el.onclick=()=>{cloneRun(Number(el.dataset.run))});ui.play.onclick=()=>startRun(selectedRun);ui.restart.onclick=()=>{resetRun();running=true};ui.again.onclick=()=>startRun(selectedRun);ui.next.onclick=()=>startRun(Math.min(RUNS.length-1,selectedRun+1));ui.menuBtn.onclick=showMenu;
cloneRun(0);showMenu();requestAnimationFrame(function frame(now){const dt=Math.min(.03,(now-last)/1000||.016);last=now;update(dt);draw();requestAnimationFrame(frame)});
window.__HL6__={player,get objects(){return objects},get flux(){return flux},RUNS,startRun,setMode,state:()=>({run:selectedRun,x:player.x,y:player.y,heavy:player.heavy,points,combo,bestCombo,fluxCount,flowMeter,overclockT,overclockCount,finished,worldTime,checkpointX})};
