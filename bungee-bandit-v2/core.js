export const W = 1280;
export const H = 720;
export const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
export const dist = (a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function pointSegDist(px,py,x1,y1,x2,y2){
  const vx=x2-x1, vy=y2-y1, l2=vx*vx+vy*vy || 1;
  const t=clamp(((px-x1)*vx+(py-y1)*vy)/l2,0,1);
  const x=x1+t*vx, y=y1+t*vy;
  return Math.hypot(px-x,py-y);
}
export function circleRect(p,r,g){
  const cx=clamp(p.x,g.x,g.x+g.w), cy=clamp(p.y,g.y,g.y+g.h);
  const dx=p.x-cx, dy=p.y-cy, d2=dx*dx+dy*dy;
  if(d2>=r*r) return null;
  const d=Math.sqrt(d2)||0.001;
  return {nx:dx/d,ny:dy/d,pen:r-d};
}
export function calcLaunch(player,pointer){
  // Direct-swipe aiming: move the finger in the SAME direction you want to fly.
  // The speed curve is deliberately generous for iPhone landscape play so the
  // top of the level is reachable with a comfortable thumb swipe.
  const dx=pointer.x-player.x, dy=pointer.y-player.y;
  const raw=Math.hypot(dx,dy);
  const DEAD_ZONE=24;
  const MAX_SWIPE=360;
  if(raw<DEAD_ZONE) return null;
  const used=Math.min(MAX_SWIPE,raw);
  const t=clamp((used-DEAD_ZONE)/(MAX_SWIPE-DEAD_ZONE),0,1);
  const speed=520+t*820;
  return {vx:(dx/raw)*speed, vy:(dy/raw)*speed, power:t};
}
export function starsFor(seconds,shots,par){
  if(seconds<=par && shots<=3) return 3;
  if(seconds<=par*1.55 && shots<=5) return 2;
  return 1;
}
export const LEVELS=[
  {
    name:'MUSEUM', subtitle:'Der einfache Job', required:3, par:24,
    anchor:[155,545], start:[235,535], van:[54,492,170,116],
    loot:[[520,470],[795,252],[1040,470]],
    glass:[], bumpers:[[660,490,48]], lasers:[],
    palette:['#18293f','#0b1423','#58d8ff','#ffcc35']
  },
  {
    name:'JUWELENBÖRSE', subtitle:'Jetzt wird es laut', required:4, par:31,
    anchor:[150,545], start:[235,535], van:[52,492,170,116],
    loot:[[470,185],[650,465],[900,175],[1080,455]],
    glass:[[555,115,22,285],[845,315,22,245]],
    bumpers:[[440,430,42],[745,300,45],[1000,360,46]], lasers:[],
    palette:['#211c46','#0c1022','#cf70ff','#ffd447']
  },
  {
    name:'LASER-VAULT', subtitle:'Ein Fehler und der Alarm geht los', required:5, par:38,
    anchor:[150,545], start:[235,535], van:[52,492,170,116],
    loot:[[435,170],[630,425],[770,145],[980,435],[1100,220]],
    glass:[[520,105,22,250],[880,250,22,300]],
    bumpers:[[450,400,40],[710,330,44],[1050,385,44]],
    lasers:[[570,255,800,255,1.0],[905,180,1110,180,1.25]],
    palette:['#34182d','#0c101b','#ff596f','#ffd447']
  }
];