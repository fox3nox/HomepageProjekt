const BPM = 140;
const BEAT = 60 / BPM;
const BASE_SPEED = 360;
const BEAT_DIST = BASE_SPEED * BEAT;
const WORLD_H = 720;
const START_X = 320;
const LEVEL_X0 = 500;
const END_BEAT = 108;
const END_X = LEVEL_X0 + END_BEAT * BEAT_DIST;
const FIXED = 1 / 120;
const MODES = { CUBE: 'cube', WAVE: 'wave', BALL: 'ball' };
const X = (beat) => LEVEL_X0 + beat * BEAT_DIST;

class BeatAudio {
  constructor(){ this.ctx=null; this.started=false; this.nextBeat=0; this.index=-1; }
  start(){
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!this.ctx) this.ctx = new Ctx();
    this.ctx.resume?.();
    this.started=true;
  }
  resume(){ this.ctx?.resume?.(); }
  reset(time=0){ this.nextBeat=time; this.index=-1; }
  tick(simTime){
    if (!this.started || !this.ctx) return false;
    let hit=false;
    while (simTime + 0.01 >= this.nextBeat){
      this.index += 1;
      this.hit(this.index % 4 === 0);
      this.nextBeat += BEAT;
      hit=true;
    }
    return hit;
  }
  hit(downbeat=false){
    const now=this.ctx.currentTime;
    const o=this.ctx.createOscillator();
    const g=this.ctx.createGain();
    o.type='sine'; o.frequency.setValueAtTime(downbeat?82:122,now); o.frequency.exponentialRampToValueAtTime(downbeat?42:72,now+.09);
    g.gain.setValueAtTime(downbeat?.17:.07,now); g.gain.exponentialRampToValueAtTime(.0001,now+.11);
    o.connect(g).connect(this.ctx.destination); o.start(now); o.stop(now+.12);
  }
  portal(){
    if (!this.started || !this.ctx) return;
    const now=this.ctx.currentTime;
    [360,540,820].forEach((f,i)=>{const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(.05,now+i*.025);g.gain.exponentialRampToValueAtTime(.0001,now+.18+i*.025);o.connect(g).connect(this.ctx.destination);o.start(now+i*.025);o.stop(now+.2+i*.025)});
  }
  death(){
    if (!this.started || !this.ctx) return;
    const now=this.ctx.currentTime; const o=this.ctx.createOscillator(),g=this.ctx.createGain();
    o.type='sawtooth';o.frequency.setValueAtTime(130,now);o.frequency.exponentialRampToValueAtTime(35,now+.2);g.gain.setValueAtTime(.08,now);g.gain.exponentialRampToValueAtTime(.0001,now+.22);o.connect(g).connect(this.ctx.destination);o.start(now);o.stop(now+.23);
  }
}

function rect(x,y,w,h,kind='solid'){ return {x,y,w,h,kind}; }
function spike(x,y,size=44,down=false){ return {x,y,w:size,h:size,down}; }
function portal(beat,mode,y=120,h=480,speed=null){ return {x:X(beat)-34,y,w:68,h,mode,speed,used:false}; }
function orb(beat,y){ return {x:X(beat),y,r:34,used:false}; }

function buildLevel(){
  const solids=[]; const spikes=[]; const portals=[]; const orbs=[]; const decor=[];
  const ground=(b0,b1,y=600)=>solids.push(rect(X(b0),y,Math.max(40,X(b1)-X(b0)),WORLD_H-y,'ground'));
  const platform=(b,w,y,h=64)=>solids.push(rect(X(b),y,w*BEAT_DIST,h,'platform'));
  const sp=(b,y=556,count=1,step=.28,down=false)=>{ for(let i=0;i<count;i++) spikes.push(spike(X(b+i*step),y,44,down)); };

  // ACT 1 — CUBE: teach one-beat / half-beat jumps.
  ground(-2,12); sp(3); sp(6); sp(8,556,2,.3);
  ground(12,18); platform(12.8,1.0,500); sp(15.2); orbs.push(orb(16.8,470));
  ground(18.8,24); platform(18.1,.7,540); platform(20.1,.9,485); platform(22.2,.8,530); sp(23.2);
  ground(24.5,31.8); sp(25.5,556,3,.28); platform(27.6,1.0,500); sp(29.6,556,2,.3);
  portals.push(portal(32,MODES.WAVE,110,500,400));

  // ACT 2 — WAVE: alternating corridor gates.
  solids.push(rect(X(32),0,X(56)-X(32),105,'ceiling'));
  solids.push(rect(X(32),620,X(56)-X(32),100,'ground'));
  [35,41,47,53].forEach((b,i)=>solids.push(rect(X(b),i%2?0:410,72,i%2?280:210,'pillar')));
  [38,44,50].forEach((b,i)=>solids.push(rect(X(b),i%2?430:0,72,i%2?190:255,'pillar')));
  sp(36.4,366,1,.3,false); sp(39.5,105,1,.3,true); sp(45.5,105,1,.3,true); sp(51.5,576,1,.3,false);
  portals.push(portal(56,MODES.BALL,100,520,360));

  // ACT 3 — BALL: flip gravity between floor / ceiling.
  solids.push(rect(X(56),0,X(78)-X(56),90,'ceiling'));
  solids.push(rect(X(56),630,X(78)-X(56),90,'ground'));
  [59,65,71].forEach(b=>solids.push(rect(X(b),390,85,240,'pillar'));
  [62,68,74].forEach(b=>solids.push(rect(X(b),90,85,240,'pillar'));
  sp(60.4,586,2,.3); sp(63.4,90,2,.3,true); sp(69.4,586,2,.3); sp(72.4,90,2,.3,true);
  portals.push(portal(78,MODES.CUBE,110,500,430));

  // ACT 4 — CUBE FINALE: faster, denser but readable.
  ground(78,84); sp(80.2,556,2,.3); sp(82.5);
  ground(84.7,90); platform(84,.8,530); platform(86,.8,470); platform(88.2,.9,520); sp(89.4);
  ground(90.8,98); sp(92,556,3,.28); orbs.push(orb(94.5,450)); sp(96.2,556,2,.3);
  ground(99,109); platform(99,.7,535); platform(100.8,.7,485); platform(102.6,.7,435); platform(104.4,.8,490); sp(106.1,556,3,.28);

  // Decorative crystal beats.
  for(let b=1;b<END_BEAT;b+=2.5) decor.push({x:X(b),y:530-((Math.floor(b)%3)*26),scale:.34+((Math.floor(b)%4)*.05)});
  return {solids,spikes,portals,orbs,decor};
}

const LEVEL = buildLevel();
