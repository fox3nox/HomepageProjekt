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
  await p.waitForFunction(()=>document.documentElement.dataset.fcIphoneDashboard==='v31');
  const x=await p.evaluate(()=>{
    const nav=document.querySelector('.fc9-nav').getBoundingClientRect();
    const shell=document.querySelector('.fc9-shell').getBoundingClientRect();
    const summary=document.querySelector('#today .fc31-summary');
    const focus=document.querySelector('#today .fc9-focus');
    const todos=[...document.querySelectorAll('#today [data-todo]')];
    const todoSection=todos[0]?.closest('.fc9-section');
    const todoHeading=todoSection?.querySelector('.fc9-section-head h2');
    const statTexts=[...document.querySelectorAll('#today .fc31-stat span')].map(x=>x.textContent.trim());
    return {
      navX:nav.x,navBottom:nav.bottom,navW:nav.width,shellX:shell.x,shellW:shell.width,
      innerW:innerWidth,innerH:innerHeight,
      overflow:document.documentElement.scrollWidth<=document.documentElement.clientWidth+1,
      summary:!!summary,
      summaryCols:summary?getComputedStyle(summary).gridTemplateColumns:'',
      focusHeight:focus?.getBoundingClientRect().height||0,
      todoCount:todos.length,
      todoHeading:todoHeading?.textContent?.trim()||'',
      statTexts,
      dashboard:document.documentElement.dataset.fcIphoneDashboard,
      activeNavBg:getComputedStyle(document.querySelector('.fc9-nav button.active')).backgroundColor
    };
  });
  console.log('iphone-v31',JSON.stringify(x));
  assert.ok(x.navX<=1&&Math.abs(x.navW-x.innerW)<=2,`mobile nav width ${JSON.stringify(x)}`);
  assert.ok(Math.abs(x.navBottom-x.innerH)<=2,`mobile nav bottom ${JSON.stringify(x)}`);
  assert.ok(x.shellX<=1&&Math.abs(x.shellW-x.innerW)<=2,`mobile shell ${JSON.stringify(x)}`);
  assert.equal(x.overflow,true,`mobile overflow ${JSON.stringify(x)}`);
  assert.equal(x.dashboard,'v31');
  assert.equal(x.summary,true,'V9.31 must render the compact iPhone summary');
  assert.deepEqual(x.statTexts,['Wichtig','Offen','Termine']);
  assert.ok(x.focusHeight<90,`focus card must be visibly compact on iPhone: ${x.focusHeight}`);
  if(x.todoCount>0)assert.equal(x.todoHeading,'Jetzt erledigen','today task section must use the new action-first heading');
  assert.notEqual(x.activeNavBg,'rgba(0, 0, 0, 0)','active bottom navigation must be visibly highlighted');
  await browser.close();
  console.log('V9.31 iPhone dashboard regression: ok');
} finally {server.kill('SIGTERM')}
