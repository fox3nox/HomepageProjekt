
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d',{alpha:false});
const W=1280,H=720,G=1320;let DPR=1,scale=1,ox=0,oy=0,VW=W,last=performance.now(),running=false,held=false,finished=false;
const ui={intro:document.getElementById('intro'),play:document.getElementById('play'),result:document.getElementById('result'),again:document.getElementById('again'),restart:document.getElementById('restart'),mode:document.getElementById('modeBadge'),fill:document.getElementById('progressFill'),score:document.getElementById('score'),title:document.getElementById('resultTitle'),text:document.getElementById('resultText'),rotate:document.getElementById('rotate')};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)); const lerp=(a,b,t)=>a+(b-a)*t;
let shake=0,flash=0,particles=[],sparks=[],rings=[],trails=[],worldTime=0,combo=0,bestCombo=0,points=0,perfects=0;
const player={x:220,y:470,vx:355,vy:0,r:31,targetR:31,heavy:false,grounded:false,rot:0};
const startX=220,endX=3520;
const objects=[
 {type:'glass',x:650,y:500,w:34,h:155,broken:false},
 {type:'pit',x:930,y:610,w:330,h:110},
 {type:'ceiling',x:1270,y:90,w:260,h:220},
 {type:'pad',x:1575,y:603,w:125,h:16,used:false},
 {type:'fragile',x:1840,y:575,w:270,h:28,broken:false},
 {type:'lowerTunnel',x:1835,y:640,w:285,h:80},
 {type:'fan',x:2220,y:300,w:220,h:310},
 {type:'gate',x:2570,y:430,w:34,h:180,broken:false},
 {type:'pit',x:2780,y:610,w:340,h:110},
 {type:'finish',x:3290,y:420,w:36,h:190}
];
function reset(){worldTime=0;combo=bestCombo=points=perfects=0;shake=flash=0;particles=[];sparks=[];rings=[];trails=[];held=false;finished=false;player.x=220;player.y=470;player.vx=355;player.vy=0;player.r=31;player.targetR=31;player.heavy=false;player.rot=0;for(const o of objects){if('broken'in o)o.broken=false;if('used'in o)o.used=false;if('rewarded'in o)o.rewarded=false}ui.result.classList.add('hidden');setMode(false);updateProgress();}
function resize(){const r=canvas.getBoundingClientRect();DPR=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(r.width*DPR);canvas.height=Math.round(r.height*DPR);scale=canvas.height/H;VW=canvas.width/scale;ox=0;oy=0;ui.rotate.classList.toggle('hidden',innerWidth>=innerHeight)} addEventListener('resize',resize);resize();
function setMode(h){held=h;player.heavy=h;player.targetR=h?25:35;ui.mode.classList.toggle('heavy',h);ui.mode.classList.toggle('light',!h);ui.mode.querySelector('b').textContent=h?'HEAVY':'LIGHT';ui.mode.querySelector('small').textContent=h?'HALTEN':'LOSLASSEN'}
function press(e){if(!running||finished)return;e.preventDefault();setMode(true)} function release(e){if(!running||finished)return;e?.preventDefault?.();setMode(false)}
canvas.addEventListener('pointerdown',press,{passive:false});canvas.addEventListener('pointerup',release,{passive:false});canvas.addEventListener('pointercancel',release,{passive:false});canvas.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')release(e)},{passive:false});
function emit(x,y,color,n=12,power=220){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=40+Math.random()*power;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.25+Math.random()*.55,size:2+Math.random()*5,color})}}
function spark(x,y,n=10){for(let i=0;i<n;i++){const a=-Math.PI/2+(Math.random()-.5)*1.6,s=120+Math.random()*260;sparks.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.2+Math.random()*.35})}}
function ring(x,y,color){rings.push({x,y,r:8,life:.36,color})}
function reward(label,pts){points+=pts;combo++;bestCombo=Math.max(bestCombo,combo);perfects++;flash=Math.max(flash,.18);ring(player.x,player.y,'#8bf7ff');emit(player.x,player.y,'#8bf7ff',15,250);toast(label)}
let toastT=0,toastText='';function toast(t){toastText=t;toastT=.75}
function hitPenalty(){combo=0;shake=Math.max(shake,8);flash=Math.max(flash,.10);emit(player.x,player.y,'#ff637c',15,190)}
function rectCircle(o){const cx=clamp(player.x,o.x,o.x+o.w),cy=clamp(player.y,o.y,o.y+o.h),dx=player.x-cx,dy=player.y-cy,d2=dx*dx+dy*dy;if(d2>=player.r*player.r)return null;const d=Math.sqrt(d2)||.001;return{nx:dx/d,ny:dy/d,pen:player.r-d}}
function update(dt){if(!running||finished){fx(dt);return}worldTime+=dt;player.r=lerp(player.r,player.targetR,1-Math.pow(.0005,dt));player.vx=355+(combo*7);
 const grav=player.heavy?1850:310; player.vy+=grav*dt;
 if(!player.heavy) player.vy-=360*dt;
 player.vy*=Math.pow(player.heavy?.995:.992,dt*60);
 player.x+=player.vx*dt; player.y+=player.vy*dt; player.rot+=player.vx*dt/player.r*.015;
 const inPit=objects.some(o=>o.type==='pit'&&player.x>o.x&&player.x<o.x+o.w);
 const fragile=objects.find(o=>o.type==='fragile'&&player.x>o.x&&player.x<o.x+o.w);
 let floorY=610; if(inPit) floorY=H+100; if(fragile&&fragile.broken) floorY=690;
 player.grounded=false;
 if(player.y+player.r>floorY){player.y=floorY-player.r;if(player.vy>0){if(player.heavy&&player.vy>480){spark(player.x,player.y+player.r,14);shake=Math.max(shake,5)}player.vy*=-player.heavy?.20:.58}player.grounded=true}
 if(player.y-player.r<92){player.y=92+player.r;if(player.vy<0)player.vy*=-.35}
 for(const o of objects){if(o.type==='glass'||o.type==='gate'){
   if(o.broken)continue;const c=rectCircle(o);if(c){if(player.heavy&&Math.hypot(player.vx,player.vy)>310){o.broken=true;shake=13;spark(o.x,o.y+o.h*.55,25);emit(o.x,o.y+o.h*.5,'#bff7ff',30,360);reward('CRUSH +100',100)}else{player.x-=Math.max(2,c.pen+2);player.vx*=.15;hitPenalty()}}
 } else if(o.type==='ceiling'){
   const c=rectCircle(o);if(c){player.x-=Math.max(1,c.pen*.6);player.vy=Math.max(player.vy,120);hitPenalty()}
 } else if(o.type==='pad'){
   if(player.x>o.x-player.r&&player.x<o.x+o.w+player.r&&player.y+player.r>o.y&&player.y<o.y+35&&player.vy>0){player.y=o.y-player.r;const boost=player.heavy?-690:-980;player.vy=boost;o.used=true;shake=7;emit(player.x,o.y,'#ffd45c',18,260);if(!player.heavy)reward('BOUNCE +120',120)}
 } else if(o.type==='fragile'&&!o.broken){
   if(player.x>o.x&&player.x<o.x+o.w&&player.y+player.r>o.y&&player.y<o.y+40&&player.vy>0){if(player.heavy){o.broken=true;player.vy+=260;shake=14;spark(player.x,o.y,28);emit(player.x,o.y,'#ffd45c',24,300);reward('BREAKTHROUGH +150',150)}else{player.y=o.y-player.r;player.vy*=-.5}}
 } else if(o.type==='fan'){
   if(player.x>o.x&&player.x<o.x+o.w&&player.y>o.y&&player.y<o.y+o.h&&!player.heavy){player.vy-=1180*dt; if(Math.random()<.22)particles.push({x:o.x+Math.random()*o.w,y:o.y+o.h,vx:(Math.random()-.5)*40,vy:-240-Math.random()*180,life:.7,size:2,color:'#8bf7ff'})}
 }
 }
 if(player.y>H+70){hitPenalty();toast('ZU SCHWER!');player.x=Math.max(220,player.x-170);player.y=485;player.vy=-120;setMode(false)}
 const glass=objects[0];if(!glass.broken&&player.x>glass.x-150&&player.x<glass.x-40&&player.heavy&&combo===0){}
 const firstPit=objects[1];if(player.x>firstPit.x+30&&player.x<firstPit.x+firstPit.w-20&&!player.heavy&&player.y<565&&!firstPit.rewarded){firstPit.rewarded=true;reward('FLOAT +100',100)}
 const fan=objects.find(o=>o.type==='fan');if(player.x>fan.x+70&&player.x<fan.x+fan.w-20&&!player.heavy&&player.y<330&&!fan.rewarded){fan.rewarded=true;reward('LIFT +140',140)}
 const secondPit=objects.filter(o=>o.type==='pit')[1];if(player.x>secondPit.x+50&&player.x<secondPit.x+secondPit.w-20&&!player.heavy&&player.y<565&&!secondPit.rewarded){secondPit.rewarded=true;reward('FLOAT +180',180)}
 if(player.x>=endX){finish()}
 updateProgress();fx(dt);trails.push({x:player.x,y:player.y,life:.22,r:player.r*.7,heavy:player.heavy});if(trails.length>32)trails.shift();}
function fx(dt){toastT=Math.max(0,toastT-dt);for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=420*dt;p.vx*=.985}particles=particles.filter(p=>p.life>0);for(const s of sparks){s.life-=dt;s.x+=s.vx*dt;s.y+=s.vy*dt;s.vy+=780*dt;s.vx*=.98}sparks=sparks.filter(s=>s.life>0);for(const r of rings){r.life-=dt;r.r+=260*dt}rings=rings.filter(r=>r.life>0);for(const t of trails)t.life-=dt;trails=trails.filter(t=>t.life>0);shake*=Math.pow(.012,dt);flash*=Math.pow(.01,dt)}
function updateProgress(){ui.fill.style.width=`${clamp((player.x-startX)/(endX-startX)*100,0,100)}%`}
function finish(){finished=true;running=false;const score=Math.round(points+bestCombo*75+Math.max(0,250-worldTime*4));ui.score.textContent=score.toLocaleString('de-CH');ui.title.textContent=bestCombo>=5?'PERFEKTER FLOW!':bestCombo>=3?'SAUBER!':'GESCHAFFT!';ui.text.textContent=`Beste Combo: ${bestCombo} · ${perfects} perfekte Wechsel · ${worldTime.toFixed(1)}s`;setTimeout(()=>ui.result.classList.remove('hidden'),380)}
