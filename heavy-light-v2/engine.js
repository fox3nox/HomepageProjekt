const canvas=document.getElementById('game'),ctx=canvas.getContext('2d',{alpha:false});
const W=1280,H=720;let DPR=1,scale=1,VW=W,last=performance.now(),running=false,held=false,finished=false,paused=false;
const $=id=>document.getElementById(id);
const ui={intro:$('intro'),play:$('play'),result:$('result'),again:$('again'),restart:$('restart'),mode:$('modeBadge'),fill:$('progressFill'),liveScore:$('liveScore'),combo:$('combo'),sector:$('sector'),score:$('score'),title:$('resultTitle'),text:$('resultText'),stars:$('stars'),time:$('timeStat'),comboStat:$('comboStat'),fluxStat:$('fluxStat'),rotate:$('rotate'),fever:$('fever')};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function storageNum(k){try{return Number(localStorage.getItem(k)||0)}catch{return 0}}
const START_X=220,END_X=8700,FLOOR=610;
const SECTORS=[{x:0,name:'SEKTOR 1 · BASIS'},{x:2050,name:'SEKTOR 2 · FLOW'},{x:4150,name:'SEKTOR 3 · PRESSURE'},{x:6250,name:'SEKTOR 4 · MASTER'}];
const objects=[
 {type:'glass',x:720,y:90,w:34,h:520,done:false,score:100},
 {type:'pit',x:1100,y:610,w:320,h:110,done:false,score:100},
 {type:'ceiling',x:1510,y:92,w:350,h:340,done:false},
 {type:'pad',x:1940,y:603,w:135,h:16,done:false,score:120},
 {type:'fragile',x:2270,y:575,w:300,h:28,done:false,score:150},
 {type:'fan',x:2730,y:310,w:240,h:300,done:false,score:140},
 {type:'glass',x:3210,y:90,w:38,h:520,done:false,score:130},
 {type:'checkpoint',x:3490,y:470,w:24,h:140,done:false},
 {type:'crusher',x:3770,y:100,w:80,h:235,phase:.4,done:false},
 {type:'pit',x:4070,y:610,w:360,h:110,done:false,score:180},
 {type:'fan',x:4550,y:250,w:230,h:360,done:false,score:180},
 {type:'fragile',x:4930,y:560,w:290,h:32,done:false,score:180},
 {type:'glass',x:5420,y:90,w:40,h:520,done:false,score:170},
 {type:'pit',x:5680,y:610,w:370,h:110,done:false,score:220},
 {type:'checkpoint',x:6300,y:470,w:24,h:140,done:false},
 {type:'glass',x:6630,y:90,w:40,h:520,done:false,score:210},
 {type:'pit',x:6950,y:610,w:410,h:110,done:false,score:260},
 {type:'crusher',x:7500,y:100,w:82,h:235,phase:1.7,done:false},
 {type:'fan',x:7800,y:235,w:245,h:375,done:false,score:240},
 {type:'fragile',x:8190,y:555,w:300,h:34,done:false,score:240},
 {type:'finish',x:8550,y:415,w:38,h:195,done:false}
];
const flux=[
 {x:990,y:505,taken:false},{x:1275,y:415,taken:false},{x:1710,y:500,taken:false},{x:2050,y:365,taken:false},{x:2470,y:645,taken:false},
 {x:2860,y:300,taken:false},{x:3360,y:500,taken:false},{x:3980,y:520,taken:false},{x:4250,y:410,taken:false},{x:4660,y:270,taken:false},
 {x:5080,y:640,taken:false},{x:5535,y:500,taken:false},{x:5880,y:385,taken:false},{x:6110,y:500,taken:false},
 {x:6490,y:500,taken:false},{x:6840,y:520,taken:false},{x:7150,y:395,taken:false},{x:7620,y:500,taken:false},{x:7920,y:235,taken:false},{x:8330,y:640,taken:false}
];
const player={x:START_X,y:505,vx:350,vy:0,r:33,targetR:33,heavy:false,grounded:false,rot:0};
let particles=[],sparks=[],rings=[],trails=[],shockwaves=[],worldTime=0,combo=0,bestCombo=0,points=0,perfects=0,fluxCount=0,checkpointX=START_X,shake=0,flash=0,toastT=0,toastText='',lastSwitchT=-99,lastSwitchX=START_X,failLock=0,audioCtx=null,bestScore=storageNum('hl2_best'),bestTime=storageNum('hl2_time');
function audio(){try{return audioCtx||=(new(window.AudioContext||window.webkitAudioContext))}catch{return null}}
function tone(freq=440,d=.06,type='sine',vol=.035){const a=audio();if(!a)return;try{const o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(vol,a.currentTime);g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+d);o.connect(g).connect(a.destination);o.start();o.stop(a.currentTime+d)}catch{}}
function haptic(ms=12){try{navigator.vibrate?.(ms)}catch{}}
function resize(){const r=canvas.getBoundingClientRect();DPR=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(r.width*DPR);canvas.height=Math.round(r.height*DPR);scale=canvas.height/H;VW=canvas.width/scale;ui.rotate.classList.toggle('hidden',innerWidth>=innerHeight)}
addEventListener('resize',resize);resize();
function reset(){worldTime=0;combo=bestCombo=points=perfects=fluxCount=0;checkpointX=START_X;shake=flash=0;particles=[];sparks=[];rings=[];trails=[];shockwaves=[];held=false;finished=false;paused=false;failLock=0;player.x=START_X;player.y=505;player.vx=350;player.vy=0;player.r=33;player.targetR=33;player.heavy=false;player.rot=0;lastSwitchT=-99;lastSwitchX=START_X;for(const o of objects)o.done=false;for(const f of flux)f.taken=false;ui.result.classList.add('hidden');ui.fever.classList.add('hidden');setMode(false,false);updateHud()}
function setMode(h,fx=true){if(player.heavy===h&&held===h)return;held=h;player.heavy=h;player.targetR=h?25:36;lastSwitchT=worldTime;lastSwitchX=player.x;ui.mode.classList.toggle('heavy',h);ui.mode.classList.toggle('light',!h);ui.mode.querySelector('b').textContent=h?'HEAVY':'LIGHT';ui.mode.querySelector('small').textContent=h?'HALTEN':'LOSLASSEN';if(fx){ring(player.x,player.y,h?'#ffd45c':'#8cf8ff',.28);tone(h?130:520,.045,h?'square':'sine',.025)}}
function press(e){if(!running||finished||paused)return;e.preventDefault();audio()?.resume?.();setMode(true)}
function release(e){if(!running||finished||paused)return;e?.preventDefault?.();setMode(false)}
canvas.addEventListener('pointerdown',press,{passive:false});canvas.addEventListener('pointerup',release,{passive:false});canvas.addEventListener('pointercancel',release,{passive:false});canvas.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')release(e)},{passive:false});
addEventListener('visibilitychange',()=>{paused=document.hidden;if(paused&&running)setMode(false,false)});
function emit(x,y,color,n=12,power=220,gravity=420){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=35+Math.random()*power;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.24+Math.random()*.55,size:2+Math.random()*5,color,gravity})}}
function spark(x,y,n=10){for(let i=0;i<n;i++){const a=-Math.PI/2+(Math.random()-.5)*1.75,s=100+Math.random()*300;sparks.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.18+Math.random()*.35})}}
function ring(x,y,color,life=.38){rings.push({x,y,r:8,life,max:life,color})}
function shock(x,y,color){shockwaves.push({x,y,r:16,life:.3,max:.3,color})}
function toast(t){toastText=t;toastT=.72}
function perfectWindow(){return worldTime-lastSwitchT<.58||Math.abs(player.x-lastSwitchX)<165}
function reward(label,pts,forcePerfect=false){const perfect=forcePerfect||perfectWindow();const mult=1+Math.min(1.5,combo*.12);const gain=Math.round(pts*mult*(perfect?1.25:1));points+=gain;combo++;bestCombo=Math.max(bestCombo,combo);if(perfect)perfects++;flash=Math.max(flash,.16);ring(player.x,player.y,perfect?'#ffd45c':'#8cf8ff');emit(player.x,player.y,perfect?'#ffd45c':'#8cf8ff',perfect?22:13,260);toast(`${perfect?'PERFECT · ':''}${label} +${gain}`);tone(perfect?760:560,.07,'triangle',.045);if(perfect)haptic(18);updateHud()}
function fail(label='MISS'){if(failLock>0)return;failLock=.55;combo=0;shake=Math.max(shake,10);flash=Math.max(flash,.09);emit(player.x,player.y,'#ff5e78',18,220);toast(label);tone(105,.11,'sawtooth',.055);haptic(28);updateHud()}
function rectCircle(o){const cx=clamp(player.x,o.x,o.x+o.w),cy=clamp(player.y,o.y,o.y+o.h),dx=player.x-cx,dy=player.y-cy,d2=dx*dx+dy*dy;if(d2>=player.r*player.r)return null;const d=Math.sqrt(d2)||.001;return{nx:dx/d,ny:dy/d,pen:player.r-d}}
function respawn(label='ZU SCHWER!'){fail(label);setMode(false,false);player.x=Math.max(START_X,checkpointX);player.y=505;player.vy=-80;player.vx=310;shock(player.x,player.y,'#ff5e78')}
function update(dt){if(!running||finished||paused){fx(dt);return}worldTime+=dt;failLock=Math.max(0,failLock-dt);player.r=lerp(player.r,player.targetR,1-Math.pow(.0007,dt));const fever=combo>=5;player.vx=(320+Math.min(65,combo*6))*(fever?1.045:1);const gravity=player.heavy?1880:330;player.vy+=gravity*dt;if(!player.heavy)player.vy-=420*dt;player.vy*=Math.pow(player.heavy?.995:.989,dt*60);player.x+=player.vx*dt;player.y+=player.vy*dt;player.rot+=player.vx*dt/player.r*.016;
 const activePit=objects.find(o=>o.type==='pit'&&player.x>o.x&&player.x<o.x+o.w);
 const fragile=objects.find(o=>o.type==='fragile'&&player.x>o.x&&player.x<o.x+o.w);
 let floorY=FLOOR;if(activePit)floorY=H+100;if(fragile&&fragile.done)floorY=688;
 player.grounded=false;if(player.y+player.r>floorY){player.y=floorY-player.r;if(player.vy>0){if(player.heavy&&player.vy>440){spark(player.x,player.y+player.r,12);shake=Math.max(shake,4)}player.vy*=-player.heavy?.16:.53}player.grounded=true}
 if(player.y-player.r<88){player.y=88+player.r;if(player.vy<0)player.vy*=-.28;fail('ZU LEICHT!')}
 for(const o of objects){
  if(o.type==='glass'&&!o.done){const c=rectCircle(o);if(c){if(player.heavy){o.done=true;shake=13;spark(o.x,o.y+o.h*.55,28);emit(o.x,o.y+o.h*.5,'#c6f9ff',35,380);shock(o.x,o.y+o.h*.55,'#8cf8ff');reward('CRUSH',o.score)}else{player.x-=Math.max(2,c.pen+2);player.vx*=.18;fail('HALTEN!')}}}
  else if(o.type==='ceiling'){const c=rectCircle(o);if(c){player.x-=Math.max(1,c.pen*.7);player.vy=Math.max(player.vy,110);if(!player.heavy)fail('ZU GROSS!')}}
  else if(o.type==='pad'&&!o.done){if(player.x>o.x-player.r&&player.x<o.x+o.w+player.r&&player.y+player.r>o.y&&player.y<o.y+38&&player.vy>0){player.y=o.y-player.r;player.vy=player.heavy?-640:-1030;o.done=true;shake=7;emit(player.x,o.y,'#ffd45c',20,270);shock(player.x,o.y,'#ffd45c');if(!player.heavy)reward('BOOST',o.score);else fail('LOSLASSEN!')}}
  else if(o.type==='fragile'&&!o.done){if(player.x>o.x&&player.x<o.x+o.w&&player.y+player.r>o.y&&player.y<o.y+45&&player.vy>0){if(player.heavy){o.done=true;player.vy+=260;shake=14;spark(player.x,o.y,30);emit(player.x,o.y,'#ffd45c',28,320);shock(player.x,o.y,'#ffd45c');reward('BREAK',o.score)}else{player.y=o.y-player.r;player.vy*=-.48}}}
  else if(o.type==='fan'){if(player.x>o.x&&player.x<o.x+o.w&&player.y>o.y&&player.y<o.y+o.h&&!player.heavy){player.vy-=1260*dt;if(Math.random()<.2)particles.push({x:o.x+Math.random()*o.w,y:o.y+o.h,vx:(Math.random()-.5)*35,vy:-230-Math.random()*190,life:.65,size:2,color:'#8cf8ff',gravity:0});if(!o.done&&player.x>o.x+o.w*.42&&player.y<o.y+90){o.done=true;reward('LIFT',o.score)}}}
  else if(o.type==='checkpoint'&&!o.done&&player.x>o.x){o.done=true;checkpointX=o.x+65;points+=100;toast('CHECKPOINT +100');tone(660,.09,'triangle',.035);ring(o.x,o.y,'#72efad');updateHud()}
  else if(o.type==='crusher'){const cyc=(Math.sin(worldTime*2.4+o.phase)+1)/2;const bottom=125+cyc*255;const hazard={x:o.x,y:88,w:o.w,h:bottom-88};const c=rectCircle(hazard);if(c){player.x-=Math.max(6,c.pen+5);player.vy=Math.max(player.vy,160);fail('TIMING!')}}
 }
 for(const f of flux){if(!f.taken&&Math.hypot(player.x-f.x,player.y-f.y)<player.r+20){f.taken=true;fluxCount++;points+=75+combo*5;emit(f.x,f.y,'#bba7ff',18,180,100);ring(f.x,f.y,'#bba7ff');tone(900,.045,'sine',.03);updateHud()}}
 for(const pit of objects.filter(o=>o.type==='pit')){if(!pit.done&&player.x>pit.x+45&&player.x<pit.x+pit.w-25&&!player.heavy&&player.y<575){pit.done=true;reward('FLOAT',pit.score)}}
 if(player.y>H+72){respawn('ZU SCHWER!')}
 if(player.x>=END_X)finish();
 updateHud();fx(dt);trails.push({x:player.x,y:player.y,life:fever?.34:.24,r:player.r*(fever?.82:.7),heavy:player.heavy});if(trails.length>fever?48:34)trails.shift();
}
function fx(dt){toastT=Math.max(0,toastT-dt);for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.gravity??420)*dt;p.vx*=.985}particles=particles.filter(p=>p.life>0);for(const s of sparks){s.life-=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=800*dt;s.vx*=.98}sparks=sparks.filter(s=>s.life>0);for(const r of rings){r.life-=dt;r.r+=280*dt}rings=rings.filter(r=>r.life>0);for(const s of shockwaves){s.life-=dt;s.r+=360*dt}shockwaves=shockwaves.filter(s=>s.life>0);for(const t of trails)t.life-=dt;trails=trails.filter(t=>t.life>0);shake*=Math.pow(.015,dt);flash*=Math.pow(.01,dt)}
function updateHud(){ui.fill.style.width=`${clamp((player.x-START_X)/(END_X-START_X)*100,0,100)}%`;ui.liveScore.textContent=Math.round(points).toLocaleString('de-CH');ui.combo.textContent=`×${combo}`;const s=[...SECTORS].reverse().find(s=>player.x>=s.x)||SECTORS[0];ui.sector.textContent=s.name;ui.fever.classList.toggle('hidden',combo<5);if(combo>=5)ui.fever.querySelector('b').textContent=combo}
function finish(){finished=true;running=false;const timeBonus=Math.max(0,1200-worldTime*12),score=Math.round(points+bestCombo*85+perfects*35+fluxCount*40+timeBonus);const starN=score>=4400?3:score>=3200?2:1;const isBest=score>bestScore;bestScore=Math.max(bestScore,score);if(!bestTime||worldTime<bestTime)bestTime=worldTime;try{localStorage.setItem('hl2_best',bestScore);localStorage.setItem('hl2_time',bestTime)}catch{}ui.score.textContent=score.toLocaleString('de-CH');ui.title.textContent=starN===3?'PERFEKTER FLOW!':starN===2?'SAUBER!':'GESCHAFFT!';ui.stars.textContent='★'.repeat(starN)+'☆'.repeat(3-starN);ui.time.textContent=`${worldTime.toFixed(1)}s`;ui.comboStat.textContent=`×${bestCombo}`;ui.fluxStat.textContent=`${fluxCount}/${flux.length}`;ui.text.textContent=`${perfects} perfekte Wechsel · ${Math.round(timeBonus)} Zeitbonus${isBest?' · NEUER BESTSCORE!':` · Best ${bestScore.toLocaleString('de-CH')}`}`;tone(740,.23,'triangle',.065);setTimeout(()=>ui.result.classList.remove('hidden'),350)}
