class PulseScene extends Phaser.Scene {
  constructor(){ super('Pulse'); this.acc=0; this.simTime=0; this.audioBeat=0; this.attempt=1; this.started=false; this.dead=false; this.finished=false; this.pausedRun=false; this.actionHeld=false; this.jumpBuffer=0; this.visualAngle=0; this.beatPulse=0; this.modeTextTimer=0; }
  preload(){
    this.load.svg('bg',svgUri(ART.bg),{width:1600,height:900});
    this.load.svg('stone',svgUri(ART.tile),{width:64,height:64});
    this.load.svg('cube',svgUri(ART.cube),{width:100,height:100});
    this.load.svg('wave',svgUri(ART.wave),{width:100,height:100});
    this.load.svg('ball',svgUri(ART.ball),{width:100,height:100});
    this.load.svg('spike',svgUri(ART.spike),{width:80,height:80});
    this.load.svg('portal',svgUri(ART.portal),{width:120,height:180});
    this.load.svg('crystal',svgUri(ART.crystal),{width:70,height:100});
    this.load.svg('orb',svgUri(ART.orb),{width:100,height:100});
  }
  create(){
    window.pulsebreakScene=this;
    this.audio=new BeatAudio();
    this.cameras.main.setBackgroundColor('#030612');
    this.bg=this.add.image(0,0,'bg').setOrigin(0).setScrollFactor(0).setDepth(-50).setAlpha(.9);
    this.bgTint=this.add.rectangle(0,0,100,100,0x6deaff,.0).setOrigin(0).setScrollFactor(0).setDepth(-45);
    this.fog=this.add.graphics().setScrollFactor(0).setDepth(-40);
    this.makeWorld();
    this.playerSprite=this.add.image(START_X,520,'cube').setDepth(20).setDisplaySize(58,58);
    this.player={x:START_X,y:520,w:42,h:42,vx:BASE_SPEED,vy:0,mode:MODES.CUBE,gravity:1,onGround:false};
    this.makeTrail();
    this.input.on('pointerdown',()=>{ if(this.started&&!this.dead&&!this.finished&&!this.pausedRun){this.actionHeld=true;this.actionPress();} });
    this.input.on('pointerup',()=>{this.actionHeld=false});
    this.input.keyboard?.on('keydown-SPACE',()=>{ if(this.started&&!this.dead&&!this.finished&&!this.pausedRun){this.actionHeld=true;this.actionPress();} });
    this.input.keyboard?.on('keyup-SPACE',()=>{this.actionHeld=false});
    this.scale.on('resize',()=>this.resizeView()); this.resizeView();
    this.updateHud();
  }
  makeWorld(){
    this.solidsVisual=[]; this.spikeVisual=[]; this.portalVisual=[]; this.orbVisual=[];
    for(const d of LEVEL.decor){ const im=this.add.image(d.x,d.y,'crystal').setScale(d.scale).setAlpha(.38).setDepth(-5); this.solidsVisual.push(im); }
    for(const s of LEVEL.solids){
      const ts=this.add.tileSprite(s.x,s.y,s.w,s.h,'stone').setOrigin(0).setDepth(2);
      ts.setTint(s.kind==='pillar'?0x4444aa:0x6a63ff); ts.setAlpha(s.kind==='ground'?.96:.94); this.solidsVisual.push(ts);
      const edge=this.add.rectangle(s.x,s.y, s.w,4,0x70efff,.85).setOrigin(0).setDepth(3); this.solidsVisual.push(edge);
    }
    for(const sp of LEVEL.spikes){
      const im=this.add.image(sp.x+sp.w/2,sp.y+sp.h/2,'spike').setDisplaySize(sp.w+12,sp.h+12).setDepth(8);
      if(sp.down) im.setFlipY(true); this.spikeVisual.push(im);
    }
    for(const p of LEVEL.portals){ const im=this.add.image(p.x+p.w/2,p.y+p.h/2,'portal').setDisplaySize(92,150).setDepth(9).setAlpha(.92); this.portalVisual.push({data:p,img:im}); }
    for(const o of LEVEL.orbs){ const im=this.add.image(o.x,o.y,'orb').setDisplaySize(72,72).setDepth(10); this.orbVisual.push({data:o,img:im}); }
    this.finishGate=this.add.image(END_X,350,'portal').setDisplaySize(130,250).setTint(0xff72dc).setDepth(10);
  }
  makeTrail(){
    this.trail=[];
    for(let i=0;i<12;i++){ this.trail.push(this.add.rectangle(0,0,12-i*.55,12-i*.55, i%2?0x9c7cff:0x64eaff, .42-i*.022).setDepth(15)); }
  }
  resizeView(){
    const w=this.scale.width,h=this.scale.height; const zoom=Math.max(.62,h/WORLD_H); this.cameras.main.setZoom(zoom);
    this.bg.setDisplaySize(w/zoom,h/zoom); this.bgTint.setSize(w/zoom,h/zoom);
  }
  startRun(){
    this.audio.start(); this.started=true; this.attempt=1; this.resetPlayer(false);
    document.querySelector('#start-screen').classList.remove('visible'); document.querySelector('#hud').classList.add('visible'); document.querySelector('#pause-btn').classList.add('visible');
  }
  resetPlayer(increment=true){
    if(increment) this.attempt++;
    this.dead=false;this.finished=false;this.pausedRun=false;this.simTime=0;this.acc=0;this.beatPulse=0;this.jumpBuffer=0;this.visualAngle=0;this.actionHeld=false;
    Object.assign(this.player,{x:START_X,y:520,vx:BASE_SPEED,vy:0,mode:MODES.CUBE,gravity:1,onGround:false});
    LEVEL.portals.forEach(p=>p.used=false);LEVEL.orbs.forEach(o=>o.used=false); this.portalVisual.forEach(v=>v.img.setAlpha(.92));this.orbVisual.forEach(v=>v.img.setAlpha(1));
    this.setModeSprite(); this.audio.reset(0); this.cameras.main.scrollX=0; this.updateHud();
  }
  togglePause(){ this.pausedRun=!this.pausedRun; document.querySelector('#pause-btn').textContent=this.pausedRun?'▶':'Ⅱ'; }
  setModeSprite(){
    const key=this.player.mode===MODES.CUBE?'cube':this.player.mode===MODES.WAVE?'wave':'ball'; this.playerSprite.setTexture(key); this.playerSprite.setDisplaySize(this.player.mode===MODES.WAVE?64:58,this.player.mode===MODES.WAVE?64:58); this.modeTextTimer=.9; this.updateHud();
  }
  actionPress(){
    if(this.tryOrb()) return;
    if(this.player.mode===MODES.CUBE){ this.jumpBuffer=.10; }
    else if(this.player.mode===MODES.BALL){ this.player.gravity*=-1; this.player.vy=120*this.player.gravity; this.player.onGround=false; this.spawnBurst(this.player.x,this.player.y+this.player.h/2,0xffc060,9); }
  }
  tryOrb(){
    for(const o of LEVEL.orbs){ if(o.used) continue; const dx=(this.player.x+this.player.w/2)-o.x,dy=(this.player.y+this.player.h/2)-o.y; if(dx*dx+dy*dy<78*78){o.used=true;this.player.vy=-930*this.player.gravity;this.player.onGround=false;const v=this.orbVisual.find(v=>v.data===o);v?.img.setAlpha(.18);this.spawnBurst(o.x,o.y,0x73f7ff,18);this.audio.portal();return true;} } return false;
  }
  fixedStep(dt){
    if(!this.started||this.dead||this.finished||this.pausedRun) return;
    this.simTime+=dt; if(this.audio.tick(this.simTime)) this.beatPulse=1; this.beatPulse=Math.max(0,this.beatPulse-dt*3.8); this.jumpBuffer=Math.max(0,this.jumpBuffer-dt);
    const p=this.player; const prev={x:p.x,y:p.y,bottom:p.y+p.h,top:p.y};
    if(p.mode===MODES.CUBE){
      if(p.onGround && this.jumpBuffer>0){p.vy=-780;p.onGround=false;this.jumpBuffer=0;this.spawnBurst(p.x+p.w/2,p.y+p.h,0x72f1ff,7)}
      p.vy=Math.min(1600,p.vy+2250*dt); p.x+=p.vx*dt;p.y+=p.vy*dt; p.onGround=false; this.resolveSurface(prev,1);
      if(!p.onGround) this.visualAngle+=7.8*dt; else this.visualAngle=Math.round(this.visualAngle/(Math.PI/2))*(Math.PI/2);
    } else if(p.mode===MODES.WAVE){
      const target=this.actionHeld?-335:335; p.vy=Phaser.Math.Linear(p.vy,target,.22); p.x+=p.vx*dt;p.y+=p.vy*dt;
      if(this.overlapsAnySolid()||this.overlapsSpike()) return this.kill(); this.visualAngle=Math.atan2(p.vy,p.vx);
    } else {
      p.vy+=2250*p.gravity*dt; p.vy=Phaser.Math.Clamp(p.vy,-1500,1500); p.x+=p.vx*dt;p.y+=p.vy*dt; p.onGround=false; this.resolveSurface(prev,p.gravity); this.visualAngle+=5.5*dt*p.gravity;
    }
    if(this.overlapsSpike()) return this.kill(); if(p.y>WORLD_H+80||p.y<-120) return this.kill();
    this.checkPortals(); if(p.x>=END_X) this.finish();
  }
  resolveSurface(prev,gravityDir){
    const p=this.player; let landed=false;
    for(const s of LEVEL.solids){
      if(p.x+p.w<=s.x||p.x>=s.x+s.w||p.y+p.h<=s.y||p.y>=s.y+s.h) continue;
      if(gravityDir>0 && p.vy>=0 && prev.bottom<=s.y+5){p.y=s.y-p.h;p.vy=0;p.onGround=true;landed=true;break;}
      if(gravityDir<0 && p.vy<=0 && prev.top>=s.y+s.h-5){p.y=s.y+s.h;p.vy=0;p.onGround=true;landed=true;break;}
      return this.kill();
    }
    return landed;
  }
  overlapsAnySolid(){ const p=this.player; return LEVEL.solids.some(s=>p.x<s.x+s.w&&p.x+p.w>s.x&&p.y<s.y+s.h&&p.y+p.h>s.y); }
  overlapsSpike(){
    const p=this.player; return LEVEL.spikes.some(s=>{const ix=s.x+s.w*.22,iw=s.w*.56,iy=s.down?s.y+s.h*.1:s.y+s.h*.28,ih=s.h*.62;return p.x<ix+iw&&p.x+p.w>ix&&p.y<iy+ih&&p.y+p.h>iy});
  }
  checkPortals(){
    const p=this.player;
    for(const po of LEVEL.portals){ if(po.used)continue; if(p.x+p.w>po.x&&p.x<po.x+po.w&&p.y+p.h>po.y&&p.y<po.y+po.h){po.used=true;p.mode=po.mode;p.vx=po.speed||p.vx;p.vy=0;p.gravity=1;p.onGround=false;if(p.mode===MODES.WAVE)p.y=330;if(p.mode===MODES.BALL)p.y=500;if(p.mode===MODES.CUBE)p.y=500;this.audio.portal();this.cameras.main.flash(110,90,230,255,false);this.spawnBurst(p.x+p.w/2,p.y+p.h/2,0x9f72ff,28);this.setModeSprite();const v=this.portalVisual.find(v=>v.data===po);v?.img.setAlpha(.25);} }
  }
  kill(){
    if(this.dead||this.finished)return;this.dead=true;this.audio.death();this.spawnBurst(this.player.x+20,this.player.y+20,0xff4cae,32);this.cameras.main.shake(170,.014);this.cameras.main.flash(90,255,50,120,false);this.playerSprite.setVisible(false);
    setTimeout(()=>{if(this.dead){this.playerSprite.setVisible(true);this.resetPlayer(true)}},430);
  }
  finish(){
    if(this.finished)return;this.finished=true;this.spawnBurst(this.player.x,this.player.y,0x72f1ff,50);this.cameras.main.flash(220,110,245,255,false);
    document.querySelector('#result-kicker').textContent='SIGNAL GESICHERT';document.querySelector('#result-title').textContent='100%';document.querySelector('#result-copy').textContent=`Crystal Rise · ${this.attempt} Versuch${this.attempt===1?'':'e'}`;document.querySelector('#result').classList.add('visible');
  }
  spawnBurst(x,y,color,count=16){
    for(let i=0;i<count;i++){const r=this.add.rectangle(x,y,Phaser.Math.Between(3,7),Phaser.Math.Between(3,7),color,1).setDepth(30);const a=Math.random()*Math.PI*2,dist=Phaser.Math.Between(30,110);this.tweens.add({targets:r,x:x+Math.cos(a)*dist,y:y+Math.sin(a)*dist,alpha:0,scale:.2,duration:Phaser.Math.Between(240,520),ease:'Quad.Out',onComplete:()=>r.destroy()})}
  }
  update(time,delta){
    const dt=Math.min(.05,delta/1000);this.acc+=dt;while(this.acc>=FIXED){this.fixedStep(FIXED);this.acc-=FIXED}
    const p=this.player;this.playerSprite.setPosition(p.x+p.w/2,p.y+p.h/2).setRotation(this.visualAngle);
    this.updateTrail();this.updateCamera();this.updateEffects(dt);this.updateHud();
  }
  updateTrail(){
    const p=this.player;const headX=p.x+p.w/2,headY=p.y+p.h/2;this.trail.forEach((t,i)=>{const lag=(i+1)*17;t.x=Phaser.Math.Linear(t.x||headX,headX-lag,.28);t.y=Phaser.Math.Linear(t.y||headY,headY,.24);t.alpha=(.5-i*.03)*(this.dead?0:.9)});
  }
  updateCamera(){
    const cam=this.cameras.main;const viewW=this.scale.width/cam.zoom;const target=Math.max(0,this.player.x-viewW*.28);cam.scrollX=Phaser.Math.Linear(cam.scrollX,target,.12);cam.scrollY=0;
  }
  updateEffects(dt){
    const pulse=this.beatPulse;this.bgTint.setFillStyle(this.player.mode===MODES.WAVE?0x6cff9a:this.player.mode===MODES.BALL?0xffa64d:0x776cff,.03+pulse*.065);
    this.portalVisual.forEach((v,i)=>{if(v.data.used)return;v.img.rotation+=dt*(i%2?-.7:.7);v.img.setScale(1+pulse*.035)});
    this.orbVisual.forEach(v=>{if(v.data.used)return;v.img.rotation-=dt*.8;v.img.setScale(.56+pulse*.04)});
  }
  updateHud(){
    const progress=Phaser.Math.Clamp((this.player.x-START_X)/(END_X-START_X),0,1);document.querySelector('#progress-fill').style.width=`${(progress*100).toFixed(1)}%`;document.querySelector('#progress-text').textContent=`${Math.floor(progress*100)}%`;document.querySelector('#attempt-text').textContent=`TRY ${this.attempt}`;document.querySelector('#mode-label').textContent=this.player.mode.toUpperCase();
  }
}

const config={type:Phaser.AUTO,parent:'game',backgroundColor:'#03050d',width:1280,height:720,transparent:false,pixelArt:false,antialias:true,roundPixels:false,scale:{mode:Phaser.Scale.RESIZE,autoCenter:Phaser.Scale.CENTER_BOTH,width:'100%',height:'100%'},render:{powerPreference:'high-performance',antialias:true},scene:[PulseScene]};
const game=new Phaser.Game(config);
document.querySelector('#start-btn').addEventListener('click',()=>window.pulsebreakScene?.startRun());
document.querySelector('#retry-btn').addEventListener('click',()=>{document.querySelector('#result').classList.remove('visible');window.pulsebreakScene?.resetPlayer(true)});
document.querySelector('#pause-btn').addEventListener('click',e=>{e.stopPropagation();window.pulsebreakScene?.togglePause()});
window.addEventListener('contextmenu',e=>e.preventDefault());
