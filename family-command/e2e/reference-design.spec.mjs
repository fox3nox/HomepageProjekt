import { webkit } from 'playwright';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const PORT=4189,BASE=`http://127.0.0.1:${PORT}`;
const seed=readFileSync('family-command/e2e/mock-private-core.js','utf8');
const server=spawn('python3',['-m','http.server',String(PORT),'--directory','family-command'],{stdio:['ignore','pipe','pipe']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<50;i++){try{const r=await fetch(BASE+'/index.html');if(r.ok)return}catch{}await sleep(100)}throw new Error('server not ready')}
try {
  await ready();
  const browser=await webkit.launch({headless:true});
  const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await ctx.addInitScript({content:seed});
  const page=await ctx.newPage();
  await page.goto(BASE+'/?access=test',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.fcReady==='1'&&window.__fcProfessional);
  await page.evaluate(()=>{
    const iso=typeof todayISO==='function'?todayISO():(()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`})();
    const tomorrow=(()=>{const d=new Date(`${iso}T12:00:00`);d.setDate(d.getDate()+1);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`})();
    const day=new Date(`${iso}T12:00:00`).getDay();
    data.todos=[
      {id:'gift',date:iso,title:'Pokémon-Karten als Geschenk kaufen',priority:true,done:false,section:'day',createdAt:'2026-09-01T08:00:00Z'},
      {id:'shop',date:iso,title:'Maggi kaufen',priority:true,done:false,section:'day',createdAt:'2026-09-01T08:01:00Z'},
      {id:'normal',date:iso,title:'Normale offene Aufgabe',priority:false,done:false,section:'day',createdAt:'2026-09-01T08:02:00Z'}
    ];
    data.events=[...(data.events||[]),{id:'tomorrow-birthday',personIds:['child-a'],title:'Geburtstag Alessio',date:tomorrow,time:'13:30',end:'16:00',note:'Geburtstag'}];
    for(const p of (data.people||[]).filter(p=>p.id!=='oli')){data.schedules[p.id]??={};data.schedules[p.id][day]=[{start:'00:00',end:'23:59',label:'Schule / Kindergarten'}]}
    save?.();window.renderToday?.();
  });
  await page.waitForFunction(()=>document.documentElement.dataset.fcReferenceFidelity==='v34');
  const result=await page.evaluate(()=>{
    const before=JSON.stringify({todos:data.todos,events:data.events,homework:data.homework,people:data.people,schedules:data.schedules});
    window.__fcProfessional.enhanceToday();
    const after=JSON.stringify({todos:data.todos,events:data.events,homework:data.homework,people:data.people,schedules:data.schedules});
    const todoSec=document.querySelector('#today .fc33-priority-section');
    const overview=document.querySelector('#today .fc33-overview-section');
    const family=document.querySelector('#today .fc33-family-section');
    const tomorrow=document.querySelector('#today .fc33-tomorrow-section');
    const firstTodo=document.querySelector('#today [data-todo]');
    const summary=document.querySelector('#today .fc31-summary');
    const pagehead=document.querySelector('#today .fc9-pagehead');
    return {
      version:window.__fcProfessional.version,
      reference:document.documentElement.dataset.fcReferenceDesign,
      fidelity:document.documentElement.dataset.fcReferenceFidelity,
      sameData:before===after,
      tagline:document.querySelector('#today .fc33-tagline')?.textContent?.trim(),
      taglineDisplay:getComputedStyle(document.querySelector('#today .fc33-tagline')).display,
      summaryDisplay:summary?getComputedStyle(summary).display:'missing',
      pageheadHeight:pagehead?.getBoundingClientRect().height||0,
      todoHeading:todoSec?.querySelector('h2')?.textContent?.trim(),
      kickerLabel:todoSec?.querySelector('.fc33-kicker span:first-child')?.textContent?.trim()||'',
      kickerCount:todoSec?.querySelector('.fc33-count')?.textContent?.trim()||'',
      secondaryLabel:todoSec?.querySelector('.fc34-more-label')?.textContent?.trim()||'',
      secondaryCount:todoSec?.querySelectorAll('.fc34-secondary-task').length||0,
      taskIcon:firstTodo?.querySelector('.fc33-task-icon')?.textContent||'',
      overviewHeading:overview?.querySelector('h2')?.textContent?.trim()||'',
      familyHeading:family?.querySelector('h2')?.textContent?.trim()||'',
      tomorrowHeading:tomorrow?.querySelector('h2')?.textContent?.trim()||'',
      avatarCount:document.querySelectorAll('#today .fc33-avatar,#today .fc34-avatar').length,
      taskBadge:document.querySelector('.fc9-nav button[data-screen="tasks"] .fc34-nav-badge')?.textContent?.trim()||'',
      overflow:document.documentElement.scrollWidth<=document.documentElement.clientWidth+1,
      todoTop:todoSec?.getBoundingClientRect().top||0,
      overviewTop:overview?.getBoundingClientRect().top||0,
      tomorrowTop:tomorrow?.getBoundingClientRect().top||99999,
      familyTop:family?.getBoundingClientRect().top||99999
    };
  });
  console.log('reference-fidelity-v34',JSON.stringify(result));
  assert.equal(result.version,'9.33.0');
  assert.equal(result.reference,'v33');
  assert.equal(result.fidelity,'v34');
  assert.equal(result.sameData,true,'visual enhancement must not mutate family data');
  assert.equal(result.tagline,'Das Wichtigste zuerst');
  assert.equal(result.taglineDisplay,'none','duplicate tagline must not consume iPhone space');
  assert.equal(result.summaryDisplay,'none','reference-faithful mobile view must not show the redundant metric strip');
  assert.ok(result.pageheadHeight>0&&result.pageheadHeight<55,`mobile day header must stay compact: ${result.pageheadHeight}`);
  assert.equal(result.todoHeading,'Heute – Das Wichtigste zuerst');
  assert.equal(result.kickerLabel,'NOCH ERLEDIGEN');
  assert.equal(result.kickerCount,'2','priority count must match the two important tasks, not all open tasks');
  assert.equal(result.secondaryLabel,'Weitere offene Aufgaben');
  assert.equal(result.secondaryCount,1,'normal open tasks must remain visible but visually secondary');
  assert.ok(result.taskIcon,'task icon must be present');
  if(result.overviewHeading)assert.equal(result.overviewHeading,'Heute im Überblick');
  assert.equal(result.familyHeading,'Schule & Familie heute');
  assert.equal(result.tomorrowHeading,'Morgen – Vorschau');
  assert.ok(result.avatarCount>=3,'reference-style person avatars must remain visible');
  assert.equal(result.taskBadge,'3','bottom navigation must expose all open tasks without a metric strip');
  assert.equal(result.overflow,true,'reference design must not overflow horizontally');
  assert.ok(result.todoTop>0&&result.todoTop<result.familyTop,'important tasks must stay above family/routine information');
  if(result.overviewTop)assert.ok(result.todoTop<result.overviewTop,'important tasks must stay above the daily overview');
  assert.ok(result.tomorrowTop<result.familyTop,'tomorrow preview must stay ahead of lower-priority family routine details');
  await browser.close();
  console.log('V9.34 reference fidelity regression: ok');
} finally {server.kill('SIGTERM')}
