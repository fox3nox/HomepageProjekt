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
  await page.waitForFunction(()=>document.documentElement.dataset.fcReferenceLayout==='v35');
  const result=await page.evaluate(()=>{
    const before=JSON.stringify({todos:data.todos,events:data.events,homework:data.homework,people:data.people,schedules:data.schedules});
    const after=JSON.stringify({todos:data.todos,events:data.events,homework:data.homework,people:data.people,schedules:data.schedules});
    const todo=document.querySelector('#today .fc35-priority-section');
    const overview=document.querySelector('#today .fc35-timeline-section');
    const tomorrow=document.querySelector('#today .fc35-tomorrow-section');
    const school=document.querySelector('#today .fc35-school-section');
    const pagehead=document.querySelector('#today .fc35-daybar');
    const rows=[...document.querySelectorAll('#today .fc35-priority-section [data-todo]')];
    const taskNav=document.querySelector('.fc9-nav button[data-screen="homework"]');
    return {
      layout:document.documentElement.dataset.fcReferenceLayout,
      sameData:before===after,
      overflow:document.documentElement.scrollWidth<=document.documentElement.clientWidth+1,
      pageheadHeight:pagehead?.getBoundingClientRect().height||0,
      todoHeading:todo?.querySelector('h2')?.textContent?.trim()||'',
      todoSubtitle:todo?.querySelector('.fc35-subtitle')?.textContent?.trim()||'',
      overviewHeading:overview?.querySelector('h2')?.textContent?.trim()||'',
      overviewSubtitle:overview?.querySelector('.fc35-subtitle')?.textContent?.trim()||'',
      tomorrowHeading:tomorrow?.querySelector('h2')?.textContent?.trim()||'',
      tomorrowSubtitle:tomorrow?.querySelector('.fc35-subtitle')?.textContent?.trim()||'',
      schoolHeading:school?.querySelector('h2')?.textContent?.trim()||'',
      todoRowHeights:rows.map(x=>x.getBoundingClientRect().height),
      overviewRowHeight:overview?.querySelector('[data-event]')?.getBoundingClientRect().height||0,
      navVisible:!!taskNav&&getComputedStyle(taskNav).display!=='none'&&taskNav.getBoundingClientRect().height>0,
      todoTop:todo?.getBoundingClientRect().top||0,
      overviewTop:overview?.getBoundingClientRect().top||0,
      tomorrowTop:tomorrow?.getBoundingClientRect().top||99999,
      schoolTop:school?.getBoundingClientRect().top||99999
    };
  });
  console.log('reference-layout-v35',JSON.stringify(result));
  assert.equal(result.layout,'v35');
  assert.equal(result.sameData,true,'V9.35 reference layout must never mutate family data');
  assert.equal(result.overflow,true,'mobile reference layout must not overflow horizontally');
  assert.ok(result.pageheadHeight>0&&result.pageheadHeight<=42,`day bar should be substantially more compact: ${result.pageheadHeight}`);
  assert.equal(result.todoHeading,'Heute');
  assert.equal(result.todoSubtitle,'Das Wichtigste zuerst');
  if(result.overviewHeading){assert.equal(result.overviewHeading,'Heute');assert.equal(result.overviewSubtitle,'im Überblick')}
  if(result.tomorrowHeading){assert.equal(result.tomorrowHeading,'Morgen');assert.equal(result.tomorrowSubtitle,'Vorschau')}
  if(result.schoolHeading)assert.equal(result.schoolHeading,'Schule & Wichtiges');
  assert.ok(result.todoRowHeights.length>=3,'all existing tasks must remain visible');
  for(const h of result.todoRowHeights)assert.ok(h>=36&&h<=58,`task row must stay dense but tappable: ${h}`);
  if(result.overviewRowHeight)assert.ok(result.overviewRowHeight>=38&&result.overviewRowHeight<=58,`overview row must remain compact: ${result.overviewRowHeight}`);
  assert.equal(result.navVisible,true,'existing Aufgaben bottom navigation must remain available');
  assert.ok(result.todoTop>0);
  if(result.overviewTop)assert.ok(result.todoTop<result.overviewTop,'priority block must precede daily timeline');
  if(result.tomorrowTop<99999&&result.overviewTop)assert.ok(result.overviewTop<result.tomorrowTop,'tomorrow preview must follow today overview');
  if(result.schoolTop<99999&&result.tomorrowTop<99999)assert.ok(result.tomorrowTop<result.schoolTop,'school/routine details must follow tomorrow preview');
  await browser.close();
  console.log('V9.35 mobile reference-layout regression: ok');
} finally {server.kill('SIGTERM')}
