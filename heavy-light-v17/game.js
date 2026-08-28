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

// V17 intentionally keeps V16 gameplay physics unchanged.
const H=720,FLOOR=590,HALF=21,END=9800,BEAT=60/158;
const GRAV=2240,HGRAV=3820,JUMP=-915,SLAM=1080,COYOTE=.115,JBUF=.14;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const view={w:0,h:0,x:0,y:0,dpr:1,sc:1,vw:1280,locked:false};
let mode='menu',attempt=1,time=0,score=0,combo=1,cam=0,shake=0,flash=0,beatPulse=0,lastBeat=-1,holding=false,jumpBuffer=0,coyote=COYOTE,dead=0,zoneFlash=0,lastZone=0;
let particles=[],rings=[],trails=[];
let p={x:190,y:FLOOR-HALF,vy:0,ground:true,heavy:false,angle:0,sx:1,sy:1};

const segments=[
  {from:0,to:1760,name:'RUINEN-TOR',pal:0},
  {from:1760,to:3720,name:'TEMPELPFAD',pal:1},
  {from:3720,to:6100,name:'HIMMELS-ZITADELLE',pal:2},
  {from:6100,to:8340,name:'INFERNO-KORRIDOR',pal:3},
  {from:8340,to:END+400,name:'NEXUS-FINALE',pal:4}
];

// Level layout only: spacing is designed around the unchanged V16 jump arc.
const pits=[[1320,110],[3010,125],[4300,135],[5570,140],[6840,140],[7850,135],[9040,125]];
const obs=[
  // A — Ruinen-Tor
  {t:'spike',x:690,w:52},{t:'spike',x:940,w:78},{t:'pad',x:1190,w:88},{t:'spike',x:1510,w:52},{t:'wall',x:1660,w:70,h:112},
  // B — Tempelpfad
  {t:'gate',x:2050,w:68,h:170},{t:'spike',x:2350,w:52},{t:'spike',x:2580,w:78},{t:'pad',x:2870,w:88},{t:'wall',x:3320,w:74,h:120},{t:'gate',x:3580,w:70,h:180},
  // C — Himmels-Zitadelle
  {t:'spike',x:3900,w:52},{t:'pad',x:4180,w:88},{t:'gate',x:4700,w:70,h:186},{t:'spike',x:4990,w:52},{t:'wall',x:5280,w:76,h:126},{t:'spike',x:5850,w:78},
  // D — Inferno-Korridor
  {t:'spike',x:6310,w:78},{t:'wall',x:6580,w:78,h:132},{t:'gate',x:6940,w:72,h:190},{t:'pad',x:7270,w:88},{t:'spike',x:7570,w:78},{t:'wall',x:8140,w:80,h:136},
  // E — Nexus-Finale
  {t:'gate',x:8560,w:72,h:192},{t:'spike',x:8810,w:52},{t:'pad',x:8930,w:88},{t:'wall',x:9340,w:82,h:136},{t:'gate',x:9600,w:72,h:192}
];
const orbs=[1120,1930,2440,3190,3470,4040,4510,5130,5740,6460,7180,7700,8420,8890,9490,9700].map((x,i)=>({x,y:392-(i%3)*48,r:22,hit:false}));
const portals=[1760,3720,6100,8340,9720];
const decorPlatforms=[
  [420,270,250,1],[875,215,190,0],[1440,300,235,1],
  [1910,250,230,0],[2460,190,250,1],[3130,285,270,0],[3470,205,210,1],
  [3890,255,220,0],[4450,180,245,1],[5050,300,260,0],[5680,205,235,1],
  [6240,280,235,0],[6760,200,255,1],[7420,300,245,0],[7960,215,230,1],
  [8500,280,250,0],[9020,195,235,1],[9450,290,220,0]
];
const setpieces=[
  {type:'gatehouse',x:1450,w:560},
  {type:'bridge',x:2760,w:760},
  {type:'chains',x:4180,w:900},
  {type:'crystal',x:5260,w:680},
  {type:'forge',x:6460,w:900},
  {type:'chasm',x:7480,w:760},
  {type:'nexus',x:8680,w:1040}
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
  constructor(){this.ctx=null;this.master=null;this.music=null;this.sfx=null;this.noise=null;this.timer=0;this.next=0;this.beat=0;this.muted=localStorage.getItem('hl17-muted')==='1'}
  async unlock(){try{if(!this.ctx){const AC=window.AudioContext||window.webkitAudioContext;this.ctx=new AC();this.master=this.ctx.createGain();this.music=this.ctx.createGain();this.sfx=this.ctx.createGain();this.music.gain.value=.22;this.sfx.gain.value=.56;this.master.gain.value=this.muted?0:1;this.music.connect(this.master);this.sfx.connect(this.master);this.master.connect(this.ctx.destination);const b=this.ctx.createBuffer(1,this.ctx.sampleRate*.13,this.ctx.sampleRate);const d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);this.noise=b;this.next=this.ctx.currentTime+.04;this.timer=setInterval(()=>this.schedule(),42)}if(this.ctx.state!=='running')await this.ctx.resume();return this.ctx.state==='running'}catch(e){return false}}
  toggle(){this.muted=!this.muted;localStorage.setItem('hl17-muted',this.muted?'1':'0');if(this.master&&this.ctx)this.master.gain.setTargetAtTime(this.muted?0:1,this.ctx.currentTime,.012);updateSoundIcon()}
  osc(f,d,type='sine',v=.04,delay=0,dest){if(!this.ctx||this.muted)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain(),at=this.ctx.currentTime+Math.max(0,delay);o.type=type;o.frequency.setValueAtTime(f,at);g.gain.setValueAtTime(.0001,at);g.gain.exponentialRampToValueAtTime(v,at+.004);g.gain.exponentialRampToValueAtTime(.0001,at+d);o.connect(g).connect(dest||this.sfx);o.start(at);o.stop(at+d+.03)}
  kick(at){if(!this.ctx||this.muted)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.frequency.setValueAtTime(148,at);o.frequency.exponentialRampToValueAtTime(42,at+.13);g.gain.setValueAtTime(.085,at);g.gain.exponentialRampToValueAtTime(.0001,at+.15);o.connect(g).connect(this.music);o.start(at);o.stop(at+.16)}
  hat(at){if(!this.ctx||this.muted||!this.noise)return;const s=this.ctx.createBufferSource(),g=this.ctx.createGain(),f=this.ctx.createBiquadFilter();s.buffer=this.noise;f.type='highpass';f.frequency.value=6500;g.gain.setValueAtTime(.015,at);g.gain.exponentialRampToValueAtTime(.0001,at+.05);s.connect(f).connect(g).connect(this.music);s.start(at);s.stop(at+.06)}
  schedule(){if(!this.ctx||this.ctx.state!=='running'||mode!=='run')return;while(this.next<this.ctx.currentTime+.18){this.kick(this.next);if(this.beat%2)this.hat(this.next);const roots=[55,65.4,73.4,49];const root=roots[Math.floor(this.beat/8)%roots.length];if(this.beat%2===0)this.osc(root,.19,'triangle',.011,this.next-this.ctx.currentTime,this.music);if(this.beat%8===4)this.osc(root*4,.1,'square',.007,this.next-this.ctx.currentTime,this.music);this.beat++;this.next+=BEAT}}
  event(name){if(!this.ctx)return;const m={jump:[760,.075,'triangle',.06],heavy:[112,.07,'square',.066],land:[92,.055,'sine',.05],hit:[70,.17,'sawtooth',.09],orb:[980,.065,'sine',.045],smash:[82,.12,'square',.082],gate:[640,.09,'triangle',.055],pad:[335,.09,'triangle',.065],start:[520,.065,'triangle',.045],zone:[700,.13,'triangle',.045],finish:[660,.18,'triangle',.055]};const q=m[name];if(q)this.osc(q[0],q[1],q[2],q[3]);if(name==='finish'){this.osc(825,.16,'triangle',.05,.09);this.osc(990,.21,'triangle',.045,.18)}}
}
const audio=new AudioEngine();
function updateSoundIcon(){ui.sound.textContent=audio.muted?'×':'♪';ui.sound.classList.toggle('muted',audio.muted);ui.sound.setAttribute('aria-label',audio.muted?'Ton einschalten':'Ton ausschalten')}

function reset(keepAttempt=true){time=0;score=0;combo=1;cam=0;shake=flash=beatPulse=zoneFlash=0;lastBeat=-1;holding=false;jumpBuffer=0;coyote=COYOTE;dead=0;lastZone=0;particles=[];rings=[];trails=[];p={x:190,y:FLOOR-HALF,vy:0,ground:true,heavy:false,angle:0,sx:1,sy:1};for(const o of obs){o.done=false;o.passed=false}for(const o of orbs)o.hit=false;if(!keepAttempt)attempt=1;hud()}
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
function fx(dt){shake*=Math.pow(.003,dt);flash*=Math.pow(.001,dt);beatPulse*=Math.pow(.001,dt);zoneFlash*=Math.pow(.001,dt);for(const q of particles){q.life-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=q.g*dt}particles=particles.filter(q=>q.life>0);for(const q of rings){q.life-=dt;q.r+=420*dt}rings=rings.filter(q=>q.life>0);for(const q of trails)q.life-=dt;trails=trails.filter(q=>q.life>0)}

const pals=[
  {sky0:'#120b2a',sky1:'#38235e',far:'#302854',mid:'#51417b',edge:'#7e8cff',liquid:'#4c2d83',accent:'#b9a6ff',brick:'#17172b',glow:'#6d7cff'},
  {sky0:'#071a31',sky1:'#123f67',far:'#153d62',mid:'#1e6d8c',edge:'#4ce4ff',liquid:'#075f87',accent:'#79efff',brick:'#102336',glow:'#2cc8ff'},
  {sky0:'#190b45',sky1:'#4c1682',far:'#30206a',mid:'#8336ad',edge:'#61efff',liquid:'#8b22c5',accent:'#b9f8ff',brick:'#191538',glow:'#c453ff'},
  {sky0:'#1b0305',sky1:'#650b13',far:'#42101b',mid:'#8f1c2e',edge:'#ffae2e',liquid:'#ff4d00',accent:'#ffe36b',brick:'#261315',glow:'#ff3e24'},
  {sky0:'#071629',sky1:'#183b63',far:'#182f59',mid:'#4a3a85',edge:'#71f1ff',liquid:'#342b9c',accent:'#eefcff',brick:'#101d35',glow:'#9d6dff'}
];
function rr(x,y,w,h,r=8){c.beginPath();if(c.roundRect)c.roundRect(x,y,w,h,r);else c.rect(x,y,w,h)}
function rgba(hex,a){const h=hex.replace('#',''),n=parseInt(h,16);return`rgba(${n>>16&255},${n>>8&255},${n&255},${a})`}
function mixHex(a,b,t){const A=parseInt(a.slice(1),16),B=parseInt(b.slice(1),16),ar=A>>16&255,ag=A>>8&255,ab=A&255,br=B>>16&255,bg=B>>8&255,bb=B&255;const r=Math.round(lerp(ar,br,t)),g=Math.round(lerp(ag,bg,t)),bl=Math.round(lerp(ab,bb,t));return'#'+((1<<24)+(r<<16)+(g<<8)+bl).toString(16).slice(1)}
function blendPal(a,b,t){const out={};for(const k of Object.keys(a))out[k]=mixHex(a[k],b[k],t);return out}
function paletteAt(x){const z=zoneAt(x),seg=segments[z],fade=190;if(z<segments.length-1&&x>seg.to-fade){const t=clamp((x-(seg.to-fade))/(fade*2),0,1);return blendPal(pals[z],pals[z+1],t)}if(z>0&&x<seg.from+fade){const t=clamp((x-(seg.from-fade))/(fade*2),0,1);return blendPal(pals[z-1],pals[z],t)}return pals[z]}
function brickRect(x,y,w,h,pal,edge=true){c.fillStyle=pal.brick;c.fillRect(x,y,w,h);const bh=22,bw=42;c.strokeStyle='rgba(255,255,255,.055)';c.lineWidth=2;for(let yy=y;yy<y+h;yy+=bh){const off=((Math.floor((yy-y)/bh)&1)*bw/2);for(let xx=x-off;xx<x+w;xx+=bw)c.strokeRect(xx,yy,bw,bh)}if(edge){c.fillStyle=pal.edge;c.fillRect(x,y,w,6);c.fillStyle=rgba(pal.edge,.17);c.fillRect(x,y+6,w,10)}}

function drawSky(camX,vw,pal,zi){const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,pal.sky0);g.addColorStop(.52,pal.sky1);g.addColorStop(1,'#06040c');c.fillStyle=g;c.fillRect(camX,0,vw,H);const orbX=camX+vw*.76,orbY=140;c.fillStyle=rgba(pal.accent,zi===4?.11:.055);c.beginPath();c.arc(orbX,orbY,zi===4?125:90,0,Math.PI*2);c.fill();c.strokeStyle=rgba(pal.accent,.08);c.lineWidth=2;c.beginPath();c.arc(orbX,orbY,zi===4?86:60,0,Math.PI*2);c.stroke();for(let i=0;i<58;i++){const x=camX+((i*197+Math.floor(camX*.13))%(vw+180))-90,y=70+((i*73)%405),a=.11+(i%5)*.03;c.fillStyle=rgba(i%4===0?pal.accent:'#fff',a);const s=i%9===0?3:2;c.fillRect(x,y,s,s)}if(zi===2||zi===4){c.fillStyle=rgba(pal.accent,.035);for(let i=0;i<7;i++){const x=camX+50+i*(vw/6);c.beginPath();c.moveTo(x,470);c.lineTo(x+70,265-(i%2)*42);c.lineTo(x+140,470);c.fill()}}}
function drawMountains(camX,vw,pal){c.save();c.translate(camX*.18,0);c.fillStyle=rgba(pal.far,.7);c.beginPath();c.moveTo(camX*.82-220,505);for(let x=camX*.82-220;x<camX*.82+vw+520;x+=180){const h=78+(Math.sin(x*.011)+1)*52;c.lineTo(x+90,505-h);c.lineTo(x+180,505)}c.lineTo(camX*.82+vw+520,545);c.lineTo(camX*.82-220,545);c.closePath();c.fill();c.restore();c.save();c.translate(camX*.34,0);c.fillStyle=rgba(pal.mid,.38);c.beginPath();c.moveTo(camX*.66-220,548);for(let x=camX*.66-220;x<camX*.66+vw+520;x+=145){const h=58+(Math.cos(x*.013)+1)*37;c.lineTo(x+72,548-h);c.lineTo(x+145,548)}c.lineTo(camX*.66+vw+520,575);c.lineTo(camX*.66-220,575);c.closePath();c.fill();c.restore()}
function drawDistantArchitecture(camX,vw,pal,zi){c.save();c.globalAlpha=zi===0?.34:zi===3?.42:.29;c.fillStyle='#060510';const step=zi===1?300:zi===4?360:420;for(let x=Math.floor((camX*.52)/step)*step-500;x<camX*.52+vw+750;x+=step){const sx=x+camX*.48,h=zi===4?330:250+(Math.abs(Math.sin(x*.01))*90);c.fillRect(sx,560-h,68,h);c.fillRect(sx-34,560-h-18,136,20);if(zi!==3){c.beginPath();c.moveTo(sx-22,560-h-18);c.lineTo(sx+34,560-h-70);c.lineTo(sx+90,560-h-18);c.fill()}c.fillStyle=rgba(pal.accent,.10);c.fillRect(sx+24,560-h+45,20,66);c.fillStyle='#060510'}c.restore()}
function drawLightBeams(camX,vw,pal,zi){c.save();c.globalCompositeOperation='screen';const count=zi===4?5:zi===2?4:2;for(let i=0;i<count;i++){const x=camX+100+((i*337+zi*91)%(Math.max(400,vw-120)));const g=c.createLinearGradient(x,80,x+80,560);g.addColorStop(0,rgba(pal.accent,.09));g.addColorStop(1,rgba(pal.accent,0));c.fillStyle=g;c.beginPath();c.moveTo(x,80);c.lineTo(x+35,80);c.lineTo(x+145,560);c.lineTo(x+45,560);c.closePath();c.fill()}c.restore()}
function drawChains(camX,vw,pal,zi){if(zi===0||zi===1||zi===2){c.save();c.strokeStyle='rgba(4,3,10,.58)';c.lineWidth=8;const spacing=zi===2?250:390;for(let x=Math.floor(camX/spacing)*spacing-200;x<camX+vw+260;x+=spacing){c.beginPath();for(let y=0;y<(zi===2?430:320);y+=24){c.moveTo(x,y);c.lineTo(x+8,y+12);c.lineTo(x,y+24)}c.stroke()}c.strokeStyle=rgba(pal.accent,.09);c.lineWidth=2;for(let x=Math.floor(camX/spacing)*spacing-200;x<camX+vw+260;x+=spacing){c.beginPath();c.moveTo(x,0);c.lineTo(x,zi===2?430:320);c.stroke()}c.restore()}}

function drawLiquid(camX,vw,pal,zi){const y=648,alpha=zi===0?.5:zi===1?.62:zi===2?.72:zi===3?1:.78;c.fillStyle=rgba(pal.liquid,alpha);c.fillRect(camX,y,vw,H-y);c.strokeStyle=pal.accent;c.lineWidth=zi===3?5:3;c.shadowBlur=zi===3?18:12;c.shadowColor=pal.liquid;c.beginPath();let first=true;for(let x=camX-40;x<=camX+vw+40;x+=18){const yy=y+Math.sin(x*.029+time*3.1)*5+Math.sin(x*.073-time*2.2)*3;if(first){c.moveTo(x,yy);first=false}else c.lineTo(x,yy)}c.stroke();c.shadowBlur=0;for(let x=Math.floor(camX/138)*138;x<camX+vw+140;x+=138){const bob=(Math.sin(time*2.2+x)*.5+.5)*10;c.fillStyle=rgba(pal.accent,.35);c.fillRect(x+42,y+20-bob,4,4);c.fillRect(x+55,y+31-bob,3,3)}}
function drawGround(camX,vw,pal,zi){const start=Math.floor((camX-100)/48)*48,end=camX+vw+140;for(let x=start;x<end;x+=48){if(floorAt(x+24)===null)continue;c.fillStyle=pal.brick;c.fillRect(x,FLOOR,48,66);c.fillStyle=pal.edge;c.fillRect(x,FLOOR,48,6);c.fillStyle=rgba(pal.edge,.18);c.fillRect(x,FLOOR+6,48,9);c.strokeStyle='rgba(255,255,255,.05)';c.strokeRect(x,FLOOR+16,48,24);if(zi===0){c.beginPath();c.moveTo(x+8,FLOOR+52);c.lineTo(x+24,FLOOR+43);c.lineTo(x+40,FLOOR+52);c.stroke()}else if(zi===1){c.strokeRect(x+14,FLOOR+43,20,14)}else if(zi===2){c.beginPath();c.arc(x+24,FLOOR+51,10,0,Math.PI*2);c.stroke()}else if(zi===3){c.strokeStyle=rgba('#ffb134',.16);c.beginPath();c.moveTo(x+5,FLOOR+55);c.lineTo(x+20,FLOOR+42);c.lineTo(x+30,FLOOR+57);c.lineTo(x+44,FLOOR+46);c.stroke()}else{c.strokeStyle=rgba('#87efff',.15);c.beginPath();c.moveTo(x+8,FLOOR+51);c.lineTo(x+24,FLOOR+40);c.lineTo(x+40,FLOOR+51);c.lineTo(x+24,FLOOR+61);c.closePath();c.stroke()}}drawLiquid(camX,vw,pal,zi)}
function drawPlatform(x,y,w,spikes,pal,zi){brickRect(x,y,w,46,pal);c.fillStyle='#070610';c.fillRect(x+22,y+46,w-44,18);c.fillStyle=rgba(pal.edge,.14);c.fillRect(x+8,y+10,w-16,4);if(spikes){for(let px=x+18;px<x+w-20;px+=31){c.fillStyle='#f1fbff';c.beginPath();c.moveTo(px,y+46);c.lineTo(px+12,y+75);c.lineTo(px+24,y+46);c.fill()}}if(zi===2){c.strokeStyle='rgba(5,3,12,.72)';c.lineWidth=8;c.beginPath();c.moveTo(x+w*.5,y-250);c.lineTo(x+w*.5,y);c.stroke();c.strokeStyle=rgba(pal.accent,.13);c.lineWidth=2;c.stroke()}else{c.fillStyle=rgba(pal.accent,.12);c.fillRect(x+w*.5-3,y+46,6,24)}}
function drawTorch(x,y,pal,zi){c.fillStyle='#211326';c.fillRect(x-8,y,16,32);c.fillStyle=pal.accent;c.fillRect(x-11,y-5,22,8);const flick=Math.sin(time*12+x)*6;c.shadowBlur=zi===3?24:18;c.shadowColor=pal.edge;c.fillStyle=zi===3?'#ff9c27':pal.edge;c.beginPath();c.moveTo(x,y-8);c.quadraticCurveTo(x-17,y-28,x+flick*.2,y-46-flick);c.quadraticCurveTo(x+17,y-28,x,y-8);c.fill();c.fillStyle='#fff2a0';c.beginPath();c.moveTo(x,y-10);c.quadraticCurveTo(x-7,y-24,x,y-34);c.quadraticCurveTo(x+7,y-24,x,y-10);c.fill();c.shadowBlur=0}
function drawDecor(camX,vw,pal,zi){for(const d of decorPlatforms){if(d[0]+d[2]<camX-100||d[0]>camX+vw+100)continue;drawPlatform(d[0],d[1],d[2],d[3],pal,zi);if((d[0]/10|0)%2===0)drawTorch(d[0]+34,d[1]-8,pal,zi)}for(let x=Math.floor(camX/660)*660-660;x<camX+vw+660;x+=660)if((x/660|0)%2===0&&zi!==4)drawTorch(x+130,527,pal,zi)}

function drawArch(x,base,w,h,pal,bright=.12){c.save();c.fillStyle='rgba(5,5,13,.76)';c.fillRect(x,base-h,w*.22,h);c.fillRect(x+w*.78,base-h,w*.22,h);c.beginPath();c.arc(x+w*.5,base-h,w*.39,Math.PI,0);c.lineTo(x+w*.89,base-h);c.arc(x+w*.5,base-h,w*.25,0,Math.PI,true);c.closePath();c.fill();c.strokeStyle=rgba(pal.accent,bright);c.lineWidth=5;c.strokeRect(x+8,base-h+8,w*.22-16,h-16);c.strokeRect(x+w*.78+8,base-h+8,w*.22-16,h-16);c.restore()}
function drawSetpieces(camX,vw,pal,zi){for(const s of setpieces){if(s.x+s.w<camX-300||s.x>camX+vw+300)continue;if(s.type==='gatehouse'){drawArch(s.x,578,s.w,300,pal,.18);c.fillStyle=rgba(pal.accent,.10);c.fillRect(s.x+s.w*.48,270,s.w*.04,270);for(let i=0;i<4;i++)drawTorch(s.x+70+i*(s.w-140)/3,530,pal,zi)}
    else if(s.type==='bridge'){c.save();c.globalAlpha=.58;for(let i=0;i<4;i++)drawArch(s.x+i*185,620,170,200,pal,.12);c.fillStyle=rgba(pal.edge,.16);c.fillRect(s.x-40,410,s.w+80,7);c.restore()}
    else if(s.type==='chains'){c.save();c.strokeStyle='rgba(3,2,10,.72)';c.lineWidth=15;for(let i=0;i<4;i++){const xx=s.x+100+i*220;c.beginPath();for(let y=0;y<520;y+=30){c.moveTo(xx,y);c.lineTo(xx+11,y+15);c.lineTo(xx,y+30)}c.stroke()}c.fillStyle=rgba(pal.accent,.07);for(let i=0;i<3;i++){const xx=s.x+160+i*260;c.beginPath();c.arc(xx,330+(i%2)*60,92,0,Math.PI*2);c.fill()}c.restore()}
    else if(s.type==='crystal'){c.save();c.globalCompositeOperation='screen';for(let i=0;i<6;i++){const xx=s.x+70+i*105,hh=120+(i%3)*55;c.fillStyle=rgba(i%2?pal.accent:pal.edge,.10);c.beginPath();c.moveTo(xx,560);c.lineTo(xx+42,560-hh);c.lineTo(xx+84,560);c.closePath();c.fill();c.strokeStyle=rgba(pal.accent,.18);c.stroke()}c.restore()}
    else if(s.type==='forge'){c.save();const cx=s.x+s.w*.5;c.fillStyle='rgba(7,3,7,.55)';c.beginPath();c.moveTo(cx-190,470);c.lineTo(cx-155,245);c.lineTo(cx-70,180);c.lineTo(cx,150);c.lineTo(cx+70,180);c.lineTo(cx+155,245);c.lineTo(cx+190,470);c.closePath();c.fill();c.shadowBlur=24;c.shadowColor='#ff8f24';c.fillStyle='#ffb02c';c.fillRect(cx-85,310,55,16);c.fillRect(cx+30,310,55,16);c.shadowBlur=0;c.fillStyle=rgba('#ff5a00',.12);c.fillRect(cx-210,470,420,95);c.restore()}
    else if(s.type==='chasm'){c.save();const cx=s.x+s.w*.48;const g=c.createLinearGradient(cx-100,180,cx+100,620);g.addColorStop(0,rgba('#ffdf75',.03));g.addColorStop(.45,rgba('#ff6a00',.16));g.addColorStop(1,rgba('#ff3b00',0));c.fillStyle=g;c.beginPath();c.moveTo(cx-130,140);c.lineTo(cx+130,140);c.lineTo(cx+280,620);c.lineTo(cx-260,620);c.closePath();c.fill();for(let i=0;i<6;i++){c.fillStyle='rgba(6,4,7,.72)';c.fillRect(s.x+i*135,230+(i%2)*70,74,300);c.fillStyle=rgba('#ff9b2f',.09);c.fillRect(s.x+i*135+15,260+(i%2)*70,44,180)}c.restore()}
    else if(s.type==='nexus'){c.save();const cx=s.x+s.w*.56,cy=365;for(let j=0;j<2;j++){const ox=cx+(j?180:-180);c.shadowBlur=32;c.shadowColor=j?pal.accent:'#9f6cff';c.strokeStyle=j?pal.edge:'#9f6cff';c.lineWidth=9;c.beginPath();c.ellipse(ox,cy,80,150,0,0,Math.PI*2);c.stroke();c.shadowBlur=0;c.strokeStyle=rgba('#ffffff',.18);c.lineWidth=2;for(let k=0;k<3;k++){c.beginPath();c.ellipse(ox,cy,54+k*12,110+k*14,0,time*.12+k*.4,Math.PI*2+time*.12+k*.4);c.stroke()}}c.globalCompositeOperation='screen';const rg=c.createRadialGradient(cx,cy,10,cx,cy,330);rg.addColorStop(0,rgba('#dffcff',.20));rg.addColorStop(.45,rgba('#6eeeff',.07));rg.addColorStop(1,rgba('#7f5fff',0));c.fillStyle=rg;c.beginPath();c.arc(cx,cy,330,0,Math.PI*2);c.fill();c.restore()}}
}

function drawPortal(x,y,pal,final=false){const pulse=1+Math.sin(time*5+x)*.05;c.save();c.translate(x,y);c.scale(pulse,pulse);c.shadowBlur=final?36:25;c.shadowColor=pal.accent;c.strokeStyle=pal.accent;c.lineWidth=final?10:8;c.beginPath();c.ellipse(0,0,final?38:29,final?78:62,0,0,Math.PI*2);c.stroke();c.shadowBlur=0;c.strokeStyle='rgba(255,255,255,.38)';c.lineWidth=3;c.beginPath();c.ellipse(0,0,final?24:18,final?62:50,0,0,Math.PI*2);c.stroke();c.fillStyle='rgba(3,0,12,.76)';c.beginPath();c.ellipse(0,0,final?19:14,final?56:45,0,0,Math.PI*2);c.fill();for(let i=0;i<(final?12:8);i++){const a=time*1.8+i*Math.PI/(final?6:4);c.fillStyle=i%2?pal.edge:pal.accent;c.fillRect(Math.cos(a)*(final?56:42)-3,Math.sin(a)*(final?88:68)-3,6,6)}c.restore()}
function drawOrb(q,pal){if(q.hit)return;const s=1+Math.sin(time*6+q.x)*.08;c.save();c.translate(q.x,q.y);c.scale(s,s);c.shadowBlur=26;c.shadowColor=pal.accent;c.fillStyle='#e4ffff';c.beginPath();c.arc(0,0,10,0,Math.PI*2);c.fill();c.strokeStyle=pal.accent;c.lineWidth=6;c.beginPath();c.arc(0,0,24,0,Math.PI*2);c.stroke();c.strokeStyle=rgba(pal.accent,.38);c.lineWidth=3;for(let i=0;i<4;i++){const a=i*Math.PI/2+time*.7;c.beginPath();c.arc(0,0,36,a+.16,a+1.12);c.stroke()}c.shadowBlur=0;c.restore()}
function drawSpike(o,pal){for(let x=o.x;x<o.x+o.w;x+=26){c.shadowBlur=13;c.shadowColor='#ff465d';const g=c.createLinearGradient(0,FLOOR-52,0,FLOOR);g.addColorStop(0,'#ffffff');g.addColorStop(.38,'#ff8b9a');g.addColorStop(1,'#ff334f');c.fillStyle=g;c.beginPath();c.moveTo(x,FLOOR);c.lineTo(x+13,FLOOR-52);c.lineTo(x+26,FLOOR);c.fill();c.shadowBlur=0;c.strokeStyle='rgba(20,0,10,.65)';c.lineWidth=3;c.stroke()}}
function drawWall(o,pal){if(o.done)return;brickRect(o.x,FLOOR-o.h,o.w,o.h,pal);c.fillStyle='#ffc84f';c.fillRect(o.x+9,FLOOR-o.h+18,o.w-18,8);c.strokeStyle='rgba(255,201,79,.30)';c.lineWidth=3;c.strokeRect(o.x+12,FLOOR-o.h+31,o.w-24,o.h-45);c.strokeStyle='rgba(255,224,126,.18)';c.beginPath();c.moveTo(o.x+18,FLOOR-o.h+38);c.lineTo(o.x+o.w-18,FLOOR-20);c.moveTo(o.x+o.w-20,FLOOR-o.h+42);c.lineTo(o.x+24,FLOOR-28);c.stroke();c.fillStyle='#08050a';c.font='900 24px monospace';c.textAlign='center';c.fillText('●',o.x+o.w/2,FLOOR-o.h/2+8);c.textAlign='start'}
function drawGate(o,pal){if(o.done)return;const x=o.x+o.w/2,y=FLOOR-o.h/2;c.save();c.translate(x,y);c.shadowBlur=25;c.shadowColor='#59eaff';c.strokeStyle='#67ebff';c.lineWidth=7;c.beginPath();c.ellipse(0,0,25,o.h*.46,0,0,Math.PI*2);c.stroke();c.shadowBlur=0;c.strokeStyle='rgba(255,255,255,.38)';c.lineWidth=2;c.beginPath();c.ellipse(0,0,16,o.h*.4,0,0,Math.PI*2);c.stroke();for(let i=0;i<8;i++){const a=time*2+i*Math.PI/4;c.fillStyle=i%2?'#8b6bff':'#70f3ff';c.fillRect(Math.cos(a)*38-3,Math.sin(a)*o.h*.47-3,6,6)}c.restore()}
function drawPad(o){if(o.done)return;c.shadowBlur=20;c.shadowColor='#ffd65a';c.fillStyle='#ffe768';c.fillRect(o.x,FLOOR-11,o.w,11);c.shadowBlur=0;c.fillStyle='#ff8b20';for(let i=0;i<3;i++){const x=o.x+16+i*24;c.beginPath();c.moveTo(x,FLOOR-18);c.lineTo(x+10,FLOOR-32);c.lineTo(x+20,FLOOR-18);c.fill()}c.fillStyle='rgba(255,239,125,.22)';c.fillRect(o.x+7,FLOOR-17,o.w-14,3)}
function drawWarning(o){const dist=o.x-p.x;if(dist<75||dist>285)return;const x=o.x-58,y=FLOOR-(o.t==='wall'?150:o.t==='gate'?210:o.t==='pad'?85:105);c.save();c.globalAlpha=clamp((285-dist)/135,.13,.76);c.font='900 12px monospace';c.textAlign='center';c.fillStyle=o.t==='wall'?'#ffd05b':o.t==='gate'?'#6cefff':o.t==='pad'?'#ffe36a':'#ff687b';c.fillText(o.t==='wall'?'HOLD':o.t==='gate'?'LIGHT':o.t==='pad'?'LAUNCH':'JUMP',x,y);c.restore();c.textAlign='start'}
function drawEffects(){for(const t of trails){const a=t.life/t.max;c.save();c.globalAlpha=a*.44;c.translate(t.x,t.y);c.rotate(t.angle*.35);c.fillStyle=t.heavy?'#ff9c21':'#4ce9ff';c.fillRect(-21-58*(1-a),-11,42+58*(1-a),22);c.restore()}for(const r of rings){c.globalAlpha=clamp(r.life/r.max,0,1);c.strokeStyle=r.col;c.lineWidth=4;c.beginPath();c.arc(r.x,r.y,r.r,0,Math.PI*2);c.stroke()}c.globalAlpha=1;for(const q of particles){c.globalAlpha=clamp(q.life/q.max,0,1);c.fillStyle=q.col;c.fillRect(q.x-q.size/2,q.y-q.size/2,q.size,q.size)}c.globalAlpha=1}
function drawPlayer(){c.save();c.translate(p.x,p.y);c.rotate(p.angle);c.scale(p.sx,p.sy);const col=p.heavy?'#ffbd42':'#54e9ff',col2=p.heavy?'#ff5d20':'#7f69ff';c.shadowBlur=p.heavy?26:28;c.shadowColor=col;const g=c.createLinearGradient(-HALF,-HALF,HALF,HALF);g.addColorStop(0,'#f4ffff');g.addColorStop(.18,col);g.addColorStop(1,col2);c.fillStyle=g;rr(-HALF,-HALF,HALF*2,HALF*2,7);c.fill();c.shadowBlur=0;c.lineWidth=4;c.strokeStyle='#07101a';c.stroke();c.lineWidth=2;c.strokeStyle='rgba(255,255,255,.72)';rr(-HALF+4,-HALF+4,HALF*2-8,HALF*2-8,5);c.stroke();c.fillStyle='#07101a';c.fillRect(-9,-5,6,7);c.fillRect(6,-5,6,7);c.fillRect(-6,9,15,4);c.fillStyle='#dfffff';c.fillRect(-7,-4,2,2);c.fillRect(8,-4,2,2);c.restore()}
function drawForeground(camX,vw,pal,zi){c.save();c.globalAlpha=zi===3?.38:.24;c.fillStyle='#030309';for(let x=Math.floor((camX+80)/310)*310-310;x<camX+vw+320;x+=310){const h=34+((x/31|0)%3)*17;c.fillRect(x,FLOOR+52-h,28,h);c.beginPath();c.moveTo(x-18,FLOOR+52);c.lineTo(x+14,FLOOR+25-h);c.lineTo(x+48,FLOOR+52);c.fill()}c.fillStyle=rgba(pal.accent,.08);for(let x=Math.floor(camX/270)*270-270;x<camX+vw+300;x+=270)c.fillRect(x+44,FLOOR+34,34,3);c.restore()}

function render(){
  const d=view.dpr,sc=view.sc;
  c.setTransform(1,0,0,1,0,0);c.fillStyle='#040008';c.fillRect(0,0,cv.width,cv.height);
  const speed=speedAt(p.x),anchor=Math.min(345,view.vw*.29),look=clamp((speed-355)*.35,0,28),desired=Math.max(0,p.x-anchor+look);cam=lerp(cam,desired,.16);if(p.x-cam>view.vw*.46)cam=p.x-view.vw*.46;
  const zi=zoneAt(p.x),pal=paletteAt(p.x);
  c.setTransform(d*sc,0,0,d*sc,-cam*d*sc,0);
  drawSky(cam,view.vw,pal,zi);drawMountains(cam,view.vw,pal);drawDistantArchitecture(cam,view.vw,pal,zi);drawLightBeams(cam,view.vw,pal,zi);drawChains(cam,view.vw,pal,zi);drawSetpieces(cam,view.vw,pal,zi);
  c.save();if(shake>.1)c.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);drawDecor(cam,view.vw,pal,zi);drawGround(cam,view.vw,pal,zi);
  for(const x of portals)if(x>cam-140&&x<cam+view.vw+140)drawPortal(x,395,pal,x===9720);
  for(const q of orbs)if(q.x>cam-80&&q.x<cam+view.vw+80)drawOrb(q,pal);
  for(const o of obs){if(o.x+o.w<cam-110||o.x>cam+view.vw+110)continue;if(o.t==='spike')drawSpike(o,pal);else if(o.t==='wall')drawWall(o,pal);else if(o.t==='gate')drawGate(o,pal);else if(o.t==='pad')drawPad(o);if(!o.done)drawWarning(o)}
  drawEffects();drawPlayer();drawForeground(cam,view.vw,pal,zi);c.restore();
  c.setTransform(1,0,0,1,0,0);
  if(beatPulse>.01){c.fillStyle=`rgba(255,255,255,${beatPulse*.02})`;c.fillRect(0,0,cv.width,cv.height)}
  if(zoneFlash>.01){c.fillStyle=`rgba(110,230,255,${zoneFlash*.042})`;c.fillRect(0,0,cv.width,cv.height)}
  if(flash>.01){c.fillStyle=`rgba(255,255,255,${Math.min(.34,flash*.38)})`;c.fillRect(0,0,cv.width,cv.height)}
  const vg=c.createRadialGradient(cv.width*.5,cv.height*.5,cv.height*.13,cv.width*.5,cv.height*.5,cv.width*.72);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.36)');c.fillStyle=vg;c.fillRect(0,0,cv.width,cv.height)
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
const api={state:()=>({mode,attempt,time,score,combo,x:p.x,y:p.y,vy:p.vy,ground:p.ground,heavy:p.heavy,cam,speed:speedAt(p.x),zone:zoneAt(p.x),zoneName:segments[zoneAt(p.x)].name,view:{...view},audio:audio.ctx?audio.ctx.state:'none'}),start:startGame,pause:pauseGame,resume:resumeGame,input:setHeavy};
if(new URLSearchParams(location.search).has('test'))api.debugSetX=x=>{p.x=clamp(Number(x)||190,190,END-80);p.y=FLOOR-HALF;p.vy=0;p.ground=true;cam=Math.max(0,p.x-Math.min(345,view.vw*.29));lastZone=zoneAt(p.x);hud()};
window.__HL17__=api;
})();
