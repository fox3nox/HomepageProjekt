import { webkit } from 'playwright';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const PORT=4186,BASE=`http://127.0.0.1:${PORT}`;
const seed=readFileSync('family-command/e2e/mock-private-core.js','utf8');
const server=spawn('python3',['-m','http.server',String(PORT),'--directory','family-command'],{stdio:['ignore','pipe','pipe']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<40;i++){try{const r=await fetch(BASE+'/index.html');if(r.ok)return}catch{}await sleep(100)}throw new Error('server not ready')}
try{
  await ready();
  const browser=await webkit.launch({headless:true});
  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await mobile.addInitScript({content:seed});
  const p=await mobile.newPage();
  await p.goto(BASE+'/?access=test',{waitUntil:'domcontentloaded'});
  await p.waitForFunction(()=>document.documentElement.dataset.fcReady==='1');
  const x=await p.evaluate(()=>{
    const nav=document.querySelector('.fc9-nav').getBoundingClientRect();
    const shell=document.querySelector('.fc9-shell').getBoundingClientRect();
    const page=document.querySelector('#today .fc9-page');
    const sections=[...page.children].map((el,i)=>({i,order:Number(getComputedStyle(el).order||0),todo:!!el.querySelector('[data-todo]'),hw:!!el.querySelector('[data-hw]'),event:!!el.querySelector('[data-event]'),people:!!el.querySelector('.fc9-person-list'),tomorrow:!!el.querySelector('.fc9-tomorrow')}));
    const important=document.querySelector('#today .fc9-row .fc9-priority')?.closest('.fc9-row');
    const impStyle=important?getComputedStyle(important):null;
    return {
      navX:nav.x,navBottom:nav.bottom,navW:nav.width,shellX:shell.x,shellW:shell.width,
      innerW:innerWidth,innerH:innerHeight,
      overflow:document.documentElement.scrollWidth<=document.documentElement.clientWidth+1,
      sections,
      importantBg:impStyle?.backgroundImage||'',
      activeNavBg:getComputedStyle(document.querySelector('.fc9-nav button.active')).backgroundColor
    };
  });
  console.log('iphone',JSON.stringify(x));
  assert.ok(x.navX<=1&&Math.abs(x.navW-x.innerW)<=2,`mobile nav width ${JSON.stringify(x)}`);
  assert.ok(Math.abs(x.navBottom-x.innerH)<=2,`mobile nav bottom ${JSON.stringify(x)}`);
  assert.ok(x.shellX<=1&&Math.abs(x.shellW-x.innerW)<=2,`mobile shell ${JSON.stringify(x)}`);
  assert.equal(x.overflow,true,`mobile overflow ${JSON.stringify(x)}`);
  const todo=x.sections.find(s=>s.todo), event=x.sections.find(s=>s.event), people=x.sections.find(s=>s.people), tomorrow=x.sections.find(s=>s.tomorrow);
  if(todo&&event) assert.ok(todo.order<event.order,'today to-dos must rank before normal events');
  if(event&&people) assert.ok(event.order<people.order,'events must rank before routine person schedule');
  if(people&&tomorrow) assert.ok(people.order<tomorrow.order,'tomorrow preview must remain after today routine');
  assert.notEqual(x.activeNavBg,'rgba(0, 0, 0, 0)','active bottom navigation must be visibly highlighted');
  await browser.close();
  console.log('iphone clarity redesign regression: ok');
} finally {server.kill('SIGTERM')}
