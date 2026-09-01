import { webkit } from 'playwright';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const PORT=4187,BASE=`http://127.0.0.1:${PORT}`;
const seed=readFileSync('family-command/e2e/mock-private-core.js','utf8');
const server=spawn('python3',['-m','http.server',String(PORT),'--directory','family-command'],{stdio:['ignore','pipe','pipe']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<40;i++){try{const r=await fetch(BASE+'/index.html');if(r.ok)return}catch{}await sleep(100)}throw new Error('local server not ready')}

try{
  await ready();
  const browser=await webkit.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.addInitScript({content:seed});
  const page=await context.newPage();
  await page.goto(BASE+'/?access=test',{waitUntil:'domcontentloaded',timeout:15000});
  await page.waitForFunction(()=>document.documentElement.dataset.fcReady==='1'&&window.__fcV9,{timeout:10000});
  await page.evaluate(()=>{
    const iso=typeof todayISO==='function'?todayISO():(()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`})();
    data.todos=[
      {id:'ux-important',date:iso,title:'Geschenk heute kaufen',priority:true,done:false,section:'day',createdAt:new Date().toISOString()},
      {id:'ux-normal',date:iso,title:'Normale Aufgabe',priority:false,done:false,section:'day',createdAt:new Date().toISOString()}
    ];
    save?.();
    window.renderToday?.();
  });
  await page.waitForSelector('#today [data-todo="ux-important"]');
  const layout=await page.evaluate(()=>{
    const todo=document.querySelector('#today .fc9-section:has([data-todo])');
    const people=document.querySelector('#today .fc9-section:has(.fc9-person-list)');
    const important=document.querySelector('#today [data-todo="ux-important"]');
    return {todoTop:todo?.getBoundingClientRect().top,peopleTop:people?.getBoundingClientRect().top,importantBg:getComputedStyle(important).backgroundImage,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1};
  });
  assert.ok(Number.isFinite(layout.todoTop)&&Number.isFinite(layout.peopleTop),'Today sections must render');
  assert.ok(layout.todoTop<layout.peopleTop,'Actionable To-dos must appear before routine child schedule');
  assert.match(layout.importantBg,/gradient/i,'Priority To-do must receive visible emphasis');
  assert.equal(layout.overflow,false,'V9.27 must not introduce horizontal overflow');
  await browser.close();
  console.log('today clarity regression: ok');
} finally {
  server.kill('SIGTERM');
}
