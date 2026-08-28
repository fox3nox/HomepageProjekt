(()=>{
'use strict';

const cv=document.getElementById('game');
const c=cv.getContext('2d',{alpha:false});
const ui={
  hud:document.getElementById('hud'),menu:document.getElementById('menu'),pause:document.getElementById('pause'),result:document.getElementById('result'),
  attempt:document.getElementById('attempt'),state:document.getElementById('state'),score:document.getElementById('score'),combo:document.getElementById('combo'),percent:document.getElementById('percent'),bar:document.getElementById('progressBar'),section:document.getElementById('sectionName'),
  start:document.getElementById('startBtn'),sound:document.getElementById('soundBtn'),pauseBtn:document.getElementById('pauseBtn'),resume:document.getElementById('resumeBtn'),menuBtn:document.getElementById('menuBtn'),retry:document.getElementById('retryBtn'),resultMenu:document.getElementById('resultMenuBtn'),
  rank:document.getElementById('rank'),finalScore:document.getElementById('finalScore'),finalTime:document.getElementById('finalTime'),toast:document.getElementById('toast')
};

const H=720,FLOOR=590,HALF=21,END=9800,BEAT=60/158;
const GRAV=2240,HGRAV=3820,JUMP=-915,SLAM=1080,COYOTE=.115,JBUF=.14;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const ease=(a,b,t)=>a+(b-a)*(1-Math.pow(1-t,3));
const view={w:0,h:0,x:0,y:0,dpr:1,sc:1,vw:1280,locked:false};
let mode='menu',attempt=1,time=0,score=0,combo=1,cam=0,shake=0,flash=0,beatPulse=0,lastBeat=-1,holding=false,jumpBuffer=0,coyote=COYOTE,dead=0,zoneFlash=0,lastZone=0;
let particles=[],rings=[],trails=[],sparks=[];
let p={x:190,y:FLOOR-HALF,vy:0,ground:true,heavy:false,angle:0,sx:1,sy:1};

const segments=[
  {from:0,to:2200,name:'EMBER GATE',pal:0},
  {from:2200,to:4650,name:'VIOLET KEEP',pal:1},
  {from:4650,to:7200,name:'CRYSTAL VAULT',pal:2},
  {from:7200,to:END+400,name:'INFERNO CROWN',pal:3}
];

const pits=[[1450,118],[3310,135],[5060,145],[6870,152],[8390,142],[9250,128]];
const obs=[
  {t:'spike',x:760,w:52},{t:'spike',x:1050,w:52},{t:'pad',x:1320,w:88},
  {t:'spike',x:1750,w:52},{t:'wall',x:2050,w:70,h:112},
  {t:'gate',x:2480,w:68,h:170},{t:'spike',x:2820,w:52},{t:'spike',x:3050,w:52},
  {t:'pad',x:3185,w:88},{t:'spike',x:3650,w:52},{t:'wall',x:3990,w:74,h:120},{t:'gate',x:4350,w:70,h:180},
  {t:'spike',x:4760,w:52},{t:'spike',x:4960,w:52},{t:'pad',x:4930,w:86},
  {t:'gate',x:5480,w:70,h:186},{t:'wall',x:5850,w:76,h:126},{t:'spike',x:6160,w:52},{t:'spike',x:6400,w:52},
  {t:'pad',x:6670,w:88},{t:'gate',x:7350,w:72,h:190},{t:'spike',x:7700,w:52},{t:'wall',x:8010,w:78,h:132},
  {t:'pad',x:8240,w:88},{t:'spike',x:8700,w:52},{t:'gate',x:8950,w:72,h:192},{t:'wall',x:9470,w:82,h:136}
];
const orbs=[1180,1860,2620,3430,4180,4860,5350,6050,6550,7060,7550,8150,8580,9100,9620].map((x,i)=>({x,y:390-(i%3)*52,r:22,hit:false}));
const portals=[2200,4650,7200,9720];
const decorPlatforms=[
  [470,255,230,1],[930,210,185,0],[1580,295,240,1],[1950,220,190,0],
  [2360,280,220,1],[2920,195,230,0],[3520,285,250,1],[4140,210,210,0],
  [4800,280,225,1],[5360,200,245,0],[5980,290,235,1],[6500,220,210,0],
  [7280,285,235,1],[7810,205,250,0],[8460,292,225,1],[9040,215,235,0],[9490,300,210,1]
];

function speedAt(x){const t=clamp((x-190)/(END-190),0,1);if(t<.22)return 355;if(t<.5)return 382;if(t<.76)return 405;return 428}
function zoneAt(x){for(let i=segments.length-1;i>=0;i--)if(x>=segments[i].from)return i;return 0}
function floorAt(x){for(const q of pits)if(x>q[0]&&x<q[0]+q[1])return null;return FLOOR}

function viewport(){const vv=window.visualViewport;return {w:Math.max(1,Math.round(vv?.width||innerWidth)),h:Math.max(1,Math.round(vv?.height||innerHeight)),x:Math.round(vv?.offsetLeft||0),y:Math.round(vv?.offsetTop||0)}}
function fit(force=false){if(view.locked&&!force)return;const v=viewport();view.w=v.w;view.h=v.h;view.x=v.x;view.y=v.y;view.dpr=Math.min(2,devicePixelRatio||1);view.sc=view.h/H;view.vw=view.w/view.sc;cv.style.left=view.x+'px';cv.style.top=view.y+'px';cv.style.width=view.w+'px';cv.style.height=view.h+'px';cv.width=Math.max(1,Math.floor(view.w*view.dpr));cv.height=Math.max(1,Math.floor(view.h*view.dpr))}
function freezeView(){fit(true);view.locked=true}
function releaseView(){view.locked=false;fit(true)}
addEventListener('resize',()=>fit(false),{passive:true});
visualViewport?.addEventListener('resize',()=>fit(false),{passive:true});
visualViewport?.addEventListener('scroll',()=>fit(false),{passive:true});
addEventListener('orientationchange',()=>{releaseView();setTimeout(()=>fit(true),180)},{passive:true});

class AudioEngine{
  constructor(){this.ctx=null;this.master=null;this.music=null;this.sfx=null;this.noise=null;this.timer=0;this.next=0;this.beat=0;this.muted=localStorage.getItem('hl16-muted')==='1'}
  async unlock(){try{if(!this.ctx){const AC=window.AudioContext||window.webkitAudioContext;this.ctx=new AC();this.master=this.ctx.createGain();this.music=this.ctx.createGain();this.sfx=this.ctx.createGain();this.music.gain.value=.22;this.sfx.gain.value=.56;this.master.gain.value=this.muted?0:1;this.music.connect(this.master);this.sfx.connect(this.master);this.master.connect(this.ctx.destination);const b=this.ctx.createBuffer(1,this.ctx.sampleRate*.13,this.ctx.sampleRate);const d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);this.noise=b;this.next=this.ctx.currentTime+.04;this.timer=setInterval(()=>this.schedule(),42)}if(this.ctx.state!=='running')await this.ctx.resume();return this.ctx.state==='running'}catch(e){return false}}
  toggle(){this.muted=!this.muted;localStorage.setItem('hl16-muted',this.muted?'1':'0');if(this.master&&this.ctx)this.master.gain.setTargetAtTime(this.muted?0:1,this.ctx.currentTime,.012);updateSoundIcon()}
  osc(f,d,type='sine',v=.04,delay=0,dest){if(!this.ctx||this.muted)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain(),at=this.ctx.currentTime+Math.max(0,delay);o.type=type;o.frequency.setValueAtTime(f,at);g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(v,at+.004);g.gain.exponentialRampToValueAtTime(.0001,at+d);o.connect(g).connect(dest||this.sfx);o.start(at);o.stop(at+d+.03)}
  kick(at){if(!this.ctx||this.muted)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.frequency.setValueAtTime(148,at);o.frequency.exponentialRampToValueAtTime(42,at+.13);g.gain.setValueAtTime(.085,at);g.gain.exponentialRampToValueAtTime(.0001,at+.15);o.connect(g).connect(this.music);o.start(at);o.stop(at+.16)}
  hat(at){if(!this.ctx||this.muted||!this.noise)return;const s=this.ctx.createBufferSource(),g=this.ctx.createGain(),f=this.ctx.createBiquadFilter();s.buffer=this.noise;f.type='highpass';f.frequency.value=6500;g.gain.setValueAtTime(.015,at);g.gain.exponentialRampToValueAtTime(.0001,at+.05);s.connect(f).connect(g).connect(this.music);s.start(at);s.stop(at+.06)}
  schedule(){if(!this.ctx||this.ctx.state!=='running'||mode!=='run')return;while(this.next<this.ctx.currentTime+.18){this.kick(this.next);if(this.beat%2)this.hat(this.next);const roots=[55,65.4,73.4,49];const root=roots[Math.floor(this.beat/8)%roots.length];if(this.beat%2===0)this.osc(root,.19,'triangle',.011,this.next-this.ctx.currentTime,this.music);if(this.beat%8===4)this.osc(root*4,.1,'square',.007,this.next-this.ctx.currentTime,this.music);this.beat++;this.next+=BEAT}}
  event(name){if(!this.ctx)return;const m={jump:[760,.075,'triangle',.06],heavy:[112,.07,'square',.066],land:[92,.055,'sine',.05],hit:[70,.17,'sawtooth',.09],orb:[980,.065,'sine',.045],smash:[82,.12,'square',.082],gate:[640,.09,'triangle',.055],pad:[335,.09,'triangle',.065],start:[520,.065,'triangle',.045],zone:[700,.13,'triangle',.045],finish:[660,.18,'triangle',.055]};const q=m[name];if(q)this.osc(q[0],q[1],q[2],q[3]);if(name==='finish'){this.osc(825,.16,'triangle',.05,.09);this.osc(990,.21,'triangle',.045,.18)}}
}
const audio=new AudioEngine();
function updateSoundIcon(){ui.sound.textContent=audio.muted?'×':'♪';ui.sound.classList.toggle('muted',audio.muted);ui.sound.setAttribute('aria-label',audio.muted?'Ton einschalten':'Ton ausschalten')}

function reset(keepAttempt=true){time=0;score=0;combo=1;cam=0;shake=flash=beatPulse=zoneFlash=0;lastBeat=-1;holding=false;jumpBuffer=0;coyote=COYOTE;dead=0;lastZone=0;particles=[];rings=[];trails=[];sparks=[];p={x:190,y:FLOOR-HALF,vy:0,ground:true,heavy:false,angle:0,sx:1,sy:1};for(const o of obs){o.done=false;o.passed=false}for(const o of orbs)o.hit=false;if(!keepAttempt)attempt=1;hud()}
function startGame(){mode='run';freezeView();ui.menu.classList.add('hidden');ui.pause.classList.add('hidden');ui.result.classList.add('hidden');ui.hud.classList.remove('hidden');ui.hud.setAttribute('aria-hidden','false');reset(true);audio.event('start')}
function retry(){attempt++;mode='run';freezeView();ui.result.classList.add('hidden');ui.pause.classList.add('hidden');ui.hud.classList.remove('hidden');reset(true);audio.event('start')}
function backToMenu(){mode='menu';releaseView();ui.menu.classList.remove('hidden');ui.pause.classList.add('hidden');ui.result.classList.add('hidden');ui.hud.classList.add('hidden');reset(false)}
function pauseGame(){if(mode!=='run')return;mode='pause';ui.pause.classList.remove('hidden');ui.hud.classList.add('hidden')}
function resumeGame(){if(mode!=='pause')return;mode='run';ui.pause.classList.add('hidden');ui.hud.classList.remove('hidden');audio.unlock();audio.next=audio.ctx?audio.ctx.currentTime+.05:0}
function finish(){mode='result';ui.hud.classList.add('hidden');ui.result.classList.remove('hidden');const r=score>6400?'S':score>4800?'A':score>3300?'B':'C';ui.rank.textContent=r;ui.finalScore.textContent=String(Math.floor(score)).padStart(6,'0');ui.finalTime.textContent=time.toFixed(2)+'s';audio.event('finish');flash=1}

function hud(){const z=zoneAt(p.x);ui.attempt.textContent=attempt;ui.state.className='state '+(p.heavy?'heavy':'light');ui.state.innerHTML='<span class="stateIcon">'+(p.heavy?'●':'◇')+'</span><span>'+(p.heavy?'HEAVY':'LIGHT')+'</span>';ui.score.textContent=String(Math.floor(score)).padStart(6,'0');ui.combo.textContent=combo+'× COMBO';const k=clamp((p.x-190)/(END-190),0,1);ui.percent.textContent=Math.floor(k*100)+'%';ui.bar.style.width=(k*100).toFixed(1)+'%';ui.section.textContent=segments[z].name}
function toast(t,col='#fff'){ui.toast.textContent=t;ui.toast.style.color=col;ui.toast.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>ui.toast.classList.remove('on'),360)}
function emit(x,y,col,n=12,sp=220,g=200){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=sp*(.25+Math.random()*.85);particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.35+Math.random()*.35,max:.7,size:1.5+Math.random()*3.5,col,g})}}
function ring(x,y,col){rings.push({x,y,r:12,life:.3,max:.3,col})}
function reward(label,pts,col){score+=pts+combo*7;combo=Math.min(999,combo+1);toast(label,col);ring(p.x,p.y,col);emit(p.x,p.y,col,10,180,100);hud()}
function crash(label){if(dead>0||mode!=='run')return;dead=.52;combo=1;shake=17;flash=.78;emit(p.x,p.y,'#ff4e68',34,340,330);ring(p.x,p.y,'#ff4e68');audio.event('hit');toast(label,'#ff8e9e');try{navigator.vibrate&&navigator.vibrate(18)}catch(e){}}

function requestJump(){jumpBuffer=JBUF}
function doJump(){p.vy=JUMP;p.ground=false;coyote=0;jumpBuffer=0;p.sx=.88;p.sy=1.14;ring(p.x,p.y+HALF,'#66efff');emit(p.x,p.y+HALF,'#66efff',13,220,130);audio.event('jump');shake=Math.max(shake,2.1)}
function setHeavy(h){if(mode!=='run'||holding===h)return;holding=h;p.heavy=h;if(h){jumpBuffer=0;if(!p.ground){p.vy=Math.max(p.vy,SLAM);shake=Math.max(shake,3);audio.event('heavy');emit(p.x,p.y,'#ffb331',8,145,150)}}else requestJump();hud()}

function spikeHit(o){const hx=HALF-5,hy=HALF-6;return p.x+hx>o.x+8&&p.x-hx<o.x+o.w-8&&p.y+hy>FLOOR-48}
function rectHit(o){const hx=HALF-4,hy=HALF-4,y=FLOOR-o.h;return p.x+hx>o.x+5&&p.x-hx<o.x+o.w-5&&p.y+hy>y+4&&p.y-hy<FLOOR-4}

function step(dt){
  if(mode!=='run')return;
  if(dead>0){dead-=dt;fx(dt);if(dead<=0)retry();return}
  time+=dt;
  jumpBuffer=Math.max(0,jumpBuffer-dt);
  coyote=p.ground?COYOTE:Math.max(0,coyote-dt);
  const speed=speedAt(p.x);
  p.vy+=(p.heavy?HGRAV:GRAV)*dt;
  p.x+=speed*dt;
  p.y+=p.vy*dt;
  p.angle+=speed*dt/64;
  p.sx+=(1-p.sx)*Math.min(1,dt*18);p.sy+=(1-p.sy)*Math.min(1,dt*18);

  const fy=floorAt(p.x);p.ground=false;
  if(fy!==null&&p.y+HALF>=fy&&p.vy>=0){const imp=p.vy;p.y=fy-HALF;p.vy=0;p.ground=true;coyote=COYOTE;p.angle=Math.round(p.angle/(Math.PI/2))*(Math.PI/2);if(imp>380){p.sx=1.12;p.sy=.88;ring(p.x,fy,p.heavy?'#ffb331':'#dfffff');audio.event('land');if(p.heavy){emit(p.x,fy,'#ff9c24',16,230,310);shake=Math.max(shake,5.5)}}}
  if(!p.heavy&&jumpBuffer>0&&(p.ground||coyote>0))doJump();
  if(p.y>H+90)crash('VOID');

  const zi=zoneAt(p.x);if(zi!==lastZone){lastZone=zi;zoneFlash=1;audio.event('zone');toast(segments[zi].name,'#d8fbff')}
  const bi=Math.floor(time/BEAT);if(bi!==lastBeat){lastBeat=bi;beatPulse=1;score+=3}

  for(const o of obs){
    if(o.done)continue;
    if(o.t==='spike'&&spikeHit(o)){crash('SPIKE');break}
    if(o.t==='wall'&&rectHit(o)){if(p.heavy){o.done=true;reward('SHATTER',185,'#ffbf47');audio.event('smash');shake=Math.max(shake,8);emit(o.x+o.w/2,FLOOR-o.h/2,'#ff8122',28,300,300)}else{crash('HOLD');break}}
    if(o.t==='gate'&&p.x+HALF-3>o.x&&p.x-HALF+3<o.x+o.w&&p.y+HALF-3>FLOOR-o.h){if(p.heavy){crash('RELEASE');break}else{o.done=true;reward('PHASE',170,'#6cefff');audio.event('gate')}}
    if(o.t==='pad'&&!o.done&&p.x+HALF>o.x&&p.x-HALF<o.x+o.w&&p.y+HALF>FLOOR-27&&p.vy>=0){o.done=true;p.y=FLOOR-HALF;p.vy=-1040;p.ground=false;reward('LAUNCH',145,'#ffe069');audio.event('pad');emit(p.x,FLOOR,'#ffd75a',22,290,300)}
    if(!o.passed&&p.x>o.x+o.w+26){o.passed=true;if(o.t==='spike'){score+=85;combo=Math.min(999,combo+1)}}
  }
  for(const q of orbs){if(!q.hit&&Math.abs(p.x-q.x)<40&&Math.abs(p.y-q.y)<58){q.hit=true;reward('ENERGY',115,'#a8faff');audio.event('orb')}}
  if(p.x>=END){finish();return}
  trails.push({x:p.x,y:p.y,life:.24,max:.24,heavy:p.heavy,angle:p.angle});if(trails.length>46)trails.shift();hud();fx(dt)
}
function fx(dt){shake*=Math.pow(.003,dt);flash*=Math.pow(.001,dt);beatPulse*=Math.pow(.001,dt);zoneFlash*=Math.pow(.001,dt);for(const q of particles){q.life-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=q.g*dt}particles=particles.filter(q=>q.life>0);for(const q of rings){q.life-=dt;q.r+=420*dt}rings=rings.filter(q=>q.life>0);for(const q of trails)q.life-=dt;trails=trails.filter(q=>q.life>0);for(const s of sparks){s.life-=dt;s.x+=s.vx*dt;s.y+=s.vy*dt}sparks=sparks.filter(s=>s.life>0)}

const pals=[
  {sky0:'#2b0018',sky1:'#82003c',far:'#50104b',mid:'#9e185f',edge:'#ff7920',lava:'#ff4d00',accent:'#ffbd32',brick:'#281123',glow:'#ff315d'},
  {sky0:'#0d0028',sky1:'#45067a',far:'#28105f',mid:'#6f19a7',edge:'#45e4ff',lava:'#d720ff',accent:'#69ecff',brick:'#17102f',glow:'#ad4dff'},
  {sky0:'#050a35',sky1:'#241081',far:'#17317e',mid:'#4931b0',edge:'#43ebff',lava:'#087dff',accent:'#88f4ff',brick:'#0e1946',glow:'#4f6dff'},
  {sky0:'#160006',sky1:'#560712',far:'#36101e',mid:'#84162a',edge:'#ffb426',lava:'#ff6100',accent:'#ffe166',brick:'#241013',glow:'#ff3e24'}
];
function rr(x,y,w,h,r=8){c.beginPath();if(c.roundRect)c.roundRect(x,y,w,h,r);else c.rect(x,y,w,h)}
function rgba(hex,a){const h=hex.replace('#',''),n=parseInt(h,16);return`rgba(${n>>16&255},${n>>8&255},${n&255},${a})`}
function brickRect(x,y,w,h,pal,edge=true){c.fillStyle=pal.brick;c.fillRect(x,y,w,h);const bh=22,bw=42;c.strokeStyle='rgba(255,255,255,.06)';c.lineWidth=2;for(let yy=y;yy<y+h;yy+=bh){const off=((Math.floor((yy-y)/bh)&1)*bw/2);for(let xx=x-off;xx<x+w;xx+=bw)c.strokeRect(xx,yy,bw,bh)}if(edge){c.fillStyle=pal.edge;c.fillRect(x,y,w,6);c.fillStyle=rgba(pal.edge,.18);c.fillRect(x,y+6,w,9)}}

function drawSky(camX,vw,pal,zi){const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,pal.sky0);g.addColorStop(.47,pal.sky1);g.addColorStop(1,'#08000e');c.fillStyle=g;c.fillRect(camX,0,vw,H);const moonX=camX+vw*.72,moonY=145;c.fillStyle=rgba(pal.accent,.07);c.beginPath();c.arc(moonX,moonY,105,0,Math.PI*2);c.fill();c.fillStyle=rgba('#ffffff',.035);c.beginPath();c.arc(moonX,moonY,72,0,Math.PI*2);c.fill();for(let i=0;i<52;i++){const x=camX+((i*197+Math.floor(camX*.13))%(vw+160))-80,y=70+((i*73)%390),a=.12+(i%5)*.03;c.fillStyle=rgba(i%4===0?pal.accent:'#fff',a);const s=i%8===0?3:2;c.fillRect(x,y,s,s)}if(zi===2){c.fillStyle=rgba('#b8f7ff',.06);for(let i=0;i<7;i++){const x=camX+90+i*(vw/6.5);c.beginPath();c.moveTo(x,430);c.lineTo(x+55,320-(i%2)*45);c.lineTo(x+110,430);c.fill()}}}
function drawMountains(camX,vw,pal){c.save();c.translate(camX*.18,0);c.fillStyle=rgba(pal.far,.72);c.beginPath();c.moveTo(camX*.82-200,500);for(let x=camX*.82-200;x<camX*.82+vw+500;x+=180){const h=85+(Math.sin(x*.011)+1)*52;c.lineTo(x+90,500-h);c.lineTo(x+180,500)}c.lineTo(camX*.82+vw+500,540);c.lineTo(camX*.82-200,540);c.closePath();c.fill();c.restore();c.save();c.translate(camX*.34,0);c.fillStyle=rgba(pal.mid,.40);c.beginPath();c.moveTo(camX*.66-200,545);for(let x=camX*.66-200;x<camX*.66+vw+500;x+=140){const h=60+(Math.cos(x*.013)+1)*36;c.lineTo(x+70,545-h);c.lineTo(x+140,545)}c.lineTo(camX*.66+vw+500,570);c.lineTo(camX*.66-200,570);c.closePath();c.fill();c.restore()}
function drawTemple(camX,vw,pal){c.save();c.globalAlpha=.26;c.fillStyle='#07000d';for(let x=Math.floor((camX*.5)/430)*430-500;x<camX*.5+vw+700;x+=430){const sx=x+camX*.5;c.fillRect(sx,275,72,285);c.fillRect(sx-34,258,140,22);c.fillRect(sx-9,215,90,45);c.beginPath();c.moveTo(sx-22,215);c.lineTo(sx+36,158);c.lineTo(sx+94,215);c.fill();c.fillStyle=rgba(pal.accent,.12);c.fillRect(sx+24,315,24,70);c.fillStyle='#07000d'}c.restore()}
function drawChains(camX,vw,pal){c.save();c.strokeStyle='rgba(5,1,12,.62)';c.lineWidth=9;for(let x=Math.floor(camX/360)*360-180;x<camX+vw+260;x+=360){c.beginPath();for(let y=0;y<350;y+=24){c.moveTo(x,y);c.lineTo(x+8,y+12);c.lineTo(x,y+24)}c.stroke()}c.strokeStyle=rgba(pal.accent,.08);c.lineWidth=2;for(let x=Math.floor(camX/360)*360-180;x<camX+vw+260;x+=360){c.beginPath();c.moveTo(x,0);c.lineTo(x,350);c.stroke()}c.restore()}
function drawLava(camX,vw,pal){const y=645;c.fillStyle=pal.lava;c.fillRect(camX,y,vw,H-y);c.strokeStyle=pal.accent;c.lineWidth=4;c.shadowBlur=16;c.shadowColor=pal.lava;c.beginPath();let first=true;for(let x=camX-40;x<=camX+vw+40;x+=18){const yy=y+Math.sin(x*.029+time*3.1)*6+Math.sin(x*.073-time*2.2)*3;if(first){c.moveTo(x,yy);first=false}else c.lineTo(x,yy)}c.stroke();c.shadowBlur=0;for(let x=Math.floor(camX/135)*135;x<camX+vw+140;x+=135){const bob=(Math.sin(time*2.2+x)*.5+.5)*10;c.fillStyle=rgba(pal.accent,.48);c.fillRect(x+42,y+20-bob,5,5);c.fillRect(x+55,y+31-bob,3,3)}}
function drawGround(camX,vw,pal){const start=Math.floor((camX-100)/48)*48,end=camX+vw+140;for(let x=start;x<end;x+=48){if(floorAt(x+24)===null)continue;c.fillStyle=pal.brick;c.fillRect(x,FLOOR,48,64);c.fillStyle=pal.edge;c.fillRect(x,FLOOR,48,6);c.fillStyle=rgba(pal.edge,.2);c.fillRect(x,FLOOR+6,48,8);c.strokeStyle='rgba(255,255,255,.05)';c.strokeRect(x,FLOOR+15,48,25);c.strokeRect(x+12,FLOOR+40,36,24)}drawLava(camX,vw,pal)}
function drawPlatform(x,y,w,spikes,pal){brickRect(x,y,w,46,pal);c.fillStyle='#080510';c.fillRect(x+22,y+46,w-44,18);if(spikes){for(let px=x+18;px<x+w-20;px+=31){c.fillStyle='#effbff';c.beginPath();c.moveTo(px,y+46);c.lineTo(px+12,y+75);c.lineTo(px+24,y+46);c.fill()}}c.strokeStyle='rgba(5,1,12,.75)';c.lineWidth=8;c.beginPath();c.moveTo(x+w*.5,y-230);c.lineTo(x+w*.5,y);c.stroke();c.strokeStyle=rgba(pal.accent,.13);c.lineWidth=2;c.stroke()}
function drawTorch(x,y,pal){c.fillStyle='#241127';c.fillRect(x-8,y,16,32);c.fillStyle=pal.accent;c.fillRect(x-11,y-5,22,8);const flick=Math.sin(time*12+x)*6;c.shadowBlur=20;c.shadowColor=pal.edge;c.fillStyle=pal.edge;c.beginPath();c.moveTo(x,y-8);c.quadraticCurveTo(x-17,y-28,x+flick*.2,y-46-flick);c.quadraticCurveTo(x+17,y-28,x,y-8);c.fill();c.fillStyle='#fff3a0';c.beginPath();c.moveTo(x,y-10);c.quadraticCurveTo(x-7,y-24,x,y-34);c.quadraticCurveTo(x+7,y-24,x,y-10);c.fill();c.shadowBlur=0}
function drawDecor(camX,vw,pal){for(const d of decorPlatforms){if(d[0]+d[2]<camX-100||d[0]>camX+vw+100)continue;drawPlatform(d[0],d[1],d[2],d[3],pal);if((d[0]/10|0)%2===0)drawTorch(d[0]+34,d[1]-8,pal)}for(let x=Math.floor(camX/620)*620-620;x<camX+vw+620;x+=620)if((x/620|0)%2===0)drawTorch(x+120,525,pal)}
function drawPortal(x,y,pal){const pulse=1+Math.sin(time*5+x)*.05;c.save();c.translate(x,y);c.scale(pulse,pulse);c.shadowBlur=25;c.shadowColor=pal.accent;c.strokeStyle=pal.accent;c.lineWidth=8;c.beginPath();c.ellipse(0,0,29,62,0,0,Math.PI*2);c.stroke();c.shadowBlur=0;c.strokeStyle='rgba(255,255,255,.38)';c.lineWidth=3;c.beginPath();c.ellipse(0,0,18,50,0,0,Math.PI*2);c.stroke();c.fillStyle='rgba(3,0,12,.78)';c.beginPath();c.ellipse(0,0,14,45,0,0,Math.PI*2);c.fill();for(let i=0;i<8;i++){const a=time*1.8+i*Math.PI/4;c.fillStyle=i%2?pal.edge:pal.accent;c.fillRect(Math.cos(a)*42-3,Math.sin(a)*68-3,6,6)}c.restore()}
function drawOrb(q,pal){if(q.hit)return;const s=1+Math.sin(time*6+q.x)*.08;c.save();c.translate(q.x,q.y);c.scale(s,s);c.shadowBlur=26;c.shadowColor=pal.accent;c.fillStyle='#e4ffff';c.beginPath();c.arc(0,0,10,0,Math.PI*2);c.fill();c.strokeStyle=pal.accent;c.lineWidth=6;c.beginPath();c.arc(0,0,24,0,Math.PI*2);c.stroke();c.strokeStyle=rgba(pal.accent,.4);c.lineWidth=3;for(let i=0;i<4;i++){const a=i*Math.PI/2+time*.7;c.beginPath();c.arc(0,0,36,a+.16,a+1.12);c.stroke()}c.shadowBlur=0;c.restore()}
function drawSpike(o,pal){for(let x=o.x;x<o.x+o.w;x+=26){c.shadowBlur=13;c.shadowColor='#ff465d';const g=c.createLinearGradient(0,FLOOR-52,0,FLOOR);g.addColorStop(0,'#ffffff');g.addColorStop(.38,'#ff8b9a');g.addColorStop(1,'#ff334f');c.fillStyle=g;c.beginPath();c.moveTo(x,FLOOR);c.lineTo(x+13,FLOOR-52);c.lineTo(x+26,FLOOR);c.fill();c.shadowBlur=0;c.strokeStyle='rgba(20,0,10,.65)';c.lineWidth=3;c.stroke()}}
function drawWall(o,pal){if(o.done)return;brickRect(o.x,FLOOR-o.h,o.w,o.h,pal);c.fillStyle='#ffc84f';c.fillRect(o.x+9,FLOOR-o.h+18,o.w-18,8);c.strokeStyle='rgba(255,201,79,.28)';c.lineWidth=3;c.strokeRect(o.x+12,FLOOR-o.h+31,o.w-24,o.h-45);c.fillStyle='#05000a';c.font='900 24px monospace';c.textAlign='center';c.fillText('●',o.x+o.w/2,FLOOR-o.h/2+8);c.textAlign='start'}
function drawGate(o,pal){if(o.done)return;const x=o.x+o.w/2,y=FLOOR-o.h/2;c.save();c.translate(x,y);c.shadowBlur=24;c.shadowColor='#59eaff';c.strokeStyle='#67ebff';c.lineWidth=7;c.beginPath();c.ellipse(0,0,25,o.h*.46,0,0,Math.PI*2);c.stroke();c.shadowBlur=0;c.strokeStyle='rgba(255,255,255,.38)';c.lineWidth=2;c.beginPath();c.ellipse(0,0,16,o.h*.4,0,0,Math.PI*2);c.stroke();for(let i=0;i<7;i++){const a=time*2+i*.9;c.fillStyle=i%2?'#8b6bff':'#70f3ff';c.fillRect(Math.cos(a)*38-3,Math.sin(a)*o.h*.47-3,6,6)}c.restore()}
function drawPad(o){if(o.done)return;c.shadowBlur=18;c.shadowColor='#ffd65a';c.fillStyle='#ffe768';c.fillRect(o.x,FLOOR-10,o.w,10);c.shadowBlur=0;c.fillStyle='#ff8b20';for(let i=0;i<3;i++){const x=o.x+16+i*24;c.beginPath();c.moveTo(x,FLOOR-18);c.lineTo(x+10,FLOOR-31);c.lineTo(x+20,FLOOR-18);c.fill()}}
function drawWarning(o,pal){const dist=o.x-p.x;if(dist<60||dist>280)return;const x=o.x-65,y=FLOOR-(o.t==='wall'?145:o.t==='gate'?205:100);c.save();c.globalAlpha=clamp((280-dist)/130,.15,.8);c.font='900 13px monospace';c.textAlign='center';c.fillStyle=o.t==='wall'?'#ffd05b':o.t==='gate'?'#6cefff':'#ff6075';c.fillText(o.t==='wall'?'HOLD':o.t==='gate'?'LIGHT':'JUMP',x,y);c.fillStyle=rgba(c.fillStyle,.18);c.restore();c.textAlign='start'}
function drawEffects(){for(const t of trails){const a=t.life/t.max;c.save();c.globalAlpha=a*.44;c.translate(t.x,t.y);c.rotate(t.angle*.35);c.fillStyle=t.heavy?'#ff9c21':'#4ce9ff';c.fillRect(-21-58*(1-a),-11,42+58*(1-a),22);c.restore()}for(const r of rings){c.globalAlpha=clamp(r.life/r.max,0,1);c.strokeStyle=r.col;c.lineWidth=4;c.beginPath();c.arc(r.x,r.y,r.r,0,Math.PI*2);c.stroke()}c.globalAlpha=1;for(const q of particles){c.globalAlpha=clamp(q.life/q.max,0,1);c.fillStyle=q.col;c.fillRect(q.x-q.size/2,q.y-q.size/2,q.size,q.size)}c.globalAlpha=1}
function drawPlayer(){c.save();c.translate(p.x,p.y);c.rotate(p.angle);c.scale(p.sx,p.sy);const col=p.heavy?'#ffbd42':'#54e9ff',col2=p.heavy?'#ff5d20':'#7f69ff';c.shadowBlur=p.heavy?26:28;c.shadowColor=col;const g=c.createLinearGradient(-HALF,-HALF,HALF,HALF);g.addColorStop(0,'#f4ffff');g.addColorStop(.18,col);g.addColorStop(1,col2);c.fillStyle=g;rr(-HALF,-HALF,HALF*2,HALF*2,7);c.fill();c.shadowBlur=0;c.lineWidth=4;c.strokeStyle='#07101a';c.stroke();c.lineWidth=2;c.strokeStyle='rgba(255,255,255,.72)';rr(-HALF+4,-HALF+4,HALF*2-8,HALF*2-8,5);c.stroke();c.fillStyle='#07101a';c.fillRect(-9,-5,6,7);c.fillRect(6,-5,6,7);c.fillRect(-6,9,15,4);c.fillStyle='#dfffff';c.fillRect(-7,-4,2,2);c.fillRect(8,-4,2,2);c.restore()}

function render(){
  const d=view.dpr,sc=view.sc;
  c.setTransform(1,0,0,1,0,0);c.fillStyle='#040008';c.fillRect(0,0,cv.width,cv.height);
  const speed=speedAt(p.x),anchor=Math.min(345,view.vw*.29),look=clamp((speed-355)*.35,0,28),desired=Math.max(0,p.x-anchor+look);cam=lerp(cam,desired,.16);if(p.x-cam>view.vw*.46)cam=p.x-view.vw*.46;
  const zi=zoneAt(p.x),pal=pals[zi];
  c.setTransform(d*sc,0,0,d*sc,-cam*d*sc,0);
  drawSky(cam,view.vw,pal,zi);drawMountains(cam,view.vw,pal);drawTemple(cam,view.vw,pal);drawChains(cam,view.vw,pal);
  c.save();if(shake>.1)c.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);drawDecor(cam,view.vw,pal);drawGround(cam,view.vw,pal);
  for(const x of portals)if(x>cam-120&&x<cam+view.vw+120)drawPortal(x,395,pal);
  for(const q of orbs)if(q.x>cam-80&&q.x<cam+view.vw+80)drawOrb(q,pal);
  for(const o of obs){if(o.x+o.w<cam-100||o.x>cam+view.vw+100)continue;if(o.t==='spike')drawSpike(o,pal);else if(o.t==='wall')drawWall(o,pal);else if(o.t==='gate')drawGate(o,pal);else if(o.t==='pad')drawPad(o);if(!o.done&&(o.t==='wall'||o.t==='gate'||o.t==='spike'))drawWarning(o,pal)}
  drawEffects();drawPlayer();c.restore();
  c.setTransform(1,0,0,1,0,0);
  if(beatPulse>.01){c.fillStyle=`rgba(255,255,255,${beatPulse*.022})`;c.fillRect(0,0,cv.width,cv.height)}
  if(zoneFlash>.01){c.fillStyle=`rgba(100,225,255,${zoneFlash*.045})`;c.fillRect(0,0,cv.width,cv.height)}
  if(flash>.01){c.fillStyle=`rgba(255,255,255,${Math.min(.34,flash*.38)})`;c.fillRect(0,0,cv.width,cv.height)}
  const vg=c.createRadialGradient(cv.width*.5,cv.height*.5,cv.height*.12,cv.width*.5,cv.height*.5,cv.width*.7);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.38)');c.fillStyle=vg;c.fillRect(0,0,cv.width,cv.height)
}

let last=performance.now();function loop(now){const dt=Math.min(.03,(now-last)/1000);last=now;step(dt);render();requestAnimationFrame(loop)}

cv.addEventListener('pointerdown',e=>{if(mode!=='run')return;e.preventDefault();audio.unlock();setHeavy(true)},{passive:false});
addEventListener('pointerup',e=>{if(mode!=='run')return;e.preventDefault();setHeavy(false)},{passive:false});
addEventListener('pointercancel',()=>{if(mode==='run')setHeavy(false)},{passive:true});
addEventListener('keydown',e=>{if(e.code==='Space'&&!e.repeat){e.preventDefault();if(mode==='menu'){audio.unlock();startGame()}else setHeavy(true)}if(e.code==='Escape'){if(mode==='run')pauseGame();else if(mode==='pause')resumeGame()}},{passive:false});
addEventListener('keyup',e=>{if(e.code==='Space'){e.preventDefault();setHeavy(false)}},{passive:false});
ui.start.addEventListener('pointerdown',()=>audio.unlock(),{passive:true});ui.start.addEventListener('click',()=>{audio.unlock();startGame()});
ui.sound.addEventListener('pointerdown',e=>{e.stopPropagation();audio.unlock()},{passive:true});ui.sound.addEventListener('click',e=>{e.stopPropagation();audio.toggle()});
ui.pauseBtn.addEventListener('click',e=>{e.stopPropagation();pauseGame()});ui.resume.addEventListener('pointerdown',()=>audio.unlock(),{passive:true});ui.resume.addEventListener('click',resumeGame);ui.menuBtn.addEventListener('click',backToMenu);ui.retry.addEventListener('pointerdown',()=>audio.unlock(),{passive:true});ui.retry.addEventListener('click',retry);ui.resultMenu.addEventListener('click',backToMenu);
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&audio.ctx?.state==='suspended')audio.ctx.resume().catch(()=>{});if(document.hidden&&mode==='run')pauseGame()});

fit(true);updateSoundIcon();reset(true);requestAnimationFrame(loop);
window.__HL16__={state:()=>({mode,attempt,time,score,combo,x:p.x,y:p.y,vy:p.vy,ground:p.ground,heavy:p.heavy,cam,speed:speedAt(p.x),zone:zoneAt(p.x),view:{...view},audio:audio.ctx?audio.ctx.state:'none'}),start:startGame,pause:pauseGame,resume:resumeGame,input:setHeavy};
})();
