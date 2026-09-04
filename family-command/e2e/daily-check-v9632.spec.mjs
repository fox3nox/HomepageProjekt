import { webkit } from 'playwright';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const PORT=4196;
const BASE=`http://127.0.0.1:${PORT}`;
const seed=readFileSync('family-command/e2e/mock-private-core.js','utf8');
const server=spawn('python3',['-m','http.server',String(PORT),'--directory','family-command'],{stdio:['ignore','pipe','pipe']});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function ready(){for(let i=0;i<50;i++){try{const r=await fetch(`${BASE}/index.html`);if(r.ok)return}catch{}await sleep(100)}throw new Error('local server not ready')}

try{
  await ready();
  const browser=await webkit.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.addInitScript({content:seed});
  const page=await context.newPage();
  await page.goto(`${BASE}/?access=test`,{waitUntil:'domcontentloaded',timeout:15000});
  await page.waitForFunction(()=>document.documentElement.dataset.fcReady==='1'&&window.__fcDailyCheck?.version==='9.63.2',{timeout:12000});

  await page.evaluate(()=>{
    const t=todayISO();
    const move=(date,days)=>{const d=new Date(`${date}T12:00:00`);d.setDate(d.getDate()+days);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
    const yesterday=move(t,-1),tomorrow=move(t,1),day=new Date(`${t}T12:00:00`).getDay();
    data.todos=[
      {id:'dc-overdue-todo',personId:'child-a',title:'Überfälliges To-do',date:yesterday,section:'evening',priority:false,done:false,archived:false},
      {id:'dc-done-overdue',personId:'child-a',title:'Erledigtes altes To-do',date:yesterday,section:'day',done:true,archived:false},
      {id:'dc-today-todo',personId:'child-a',title:'Heute wichtig',date:t,section:'morning',priority:true,done:false,archived:false},
      {id:'dc-future-todo',personId:'oli',title:'Morgen einkaufen',date:tomorrow,section:'day',priority:false,done:false,archived:false}
    ];
    data.homework=[
      {id:'dc-overdue-hw',personId:'child-a',subject:'Mathe',title:'Überfällige Schulaufgabe',dueDate:yesterday,note:'Heft einpacken',done:false},
      {id:'dc-done-hw',personId:'child-a',subject:'Deutsch',title:'Erledigte Schulaufgabe',dueDate:yesterday,done:true},
      {id:'dc-today-hw',personId:'child-a',subject:'Deutsch',title:'Heute abgeben',dueDate:t,done:false}
    ];
    data.reminders=[
      {id:'dc-pack-a',personId:'child-a',days:[day],items:['Schultasche einpacken']},
      {id:'dc-pack-b',personId:'child-b',days:[day],items:['Sportbeutel mitnehmen']}
    ];
    data.schedules['child-a']??={};
    data.schedules['child-b']??={};
    data.schedules.oli??={};
    data.schedules['child-a'][day]=[{start:'08:20',end:'11:50',label:'Schule · Tagesschule',note:'Tagesschule holt Kind A nach der Schule ab'}];
    data.schedules['child-b'][day]=[{start:'08:20',end:'11:50',label:'Schule · Sport',note:'Turnzeug mitnehmen'}];
    data.schedules.oli[day]=[{start:'07:30',end:'12:00',label:'Arbeit Test'}];
    data.events=(data.events||[]).filter(e=>e.id!=='dc-holiday').concat([{id:'dc-holiday',personIds:['child-b'],title:'Herbstferien',date:t,endDate:t,time:'',note:''}]);
    save();
    window.renderToday?.();
  });

  await page.waitForFunction(()=>document.querySelector('#today .fc-dc-host')&&window.__fcDailyCheck.dataFor(todayISO()).overdue.length===2,{timeout:10000});
  const report=await page.evaluate(()=>{
    const t=todayISO();
    const d=new Date(`${t}T12:00:00`);d.setDate(d.getDate()+1);
    const tomorrow=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const now=window.__fcDailyCheck.dataFor(t),future=window.__fcDailyCheck.dataFor(tomorrow);
    return{
      version:window.__fcDailyCheck.version,
      health:window.__fcDailyCheck.health(),
      now:{
        date:now.date,
        overdue:now.overdue.map(x=>({title:x.title,time:x.time,overdue:x.overdue})),
        important:now.important.map(x=>x.title),
        pack:now.pack.map(x=>x.title),
        timeline:now.timeline.map(x=>({title:x.title,time:x.time,kind:x.kind})),
        count:now.count
      },
      future:{overdue:future.overdue.map(x=>x.title),important:future.important.map(x=>x.title)}
    };
  });

  assert.equal(report.version,'9.63.2');
  assert.equal(report.health.overdueCarry,true);
  assert.equal(report.health.futureIsolation,true);
  assert.equal(report.health.schoolBreakAware,true);
  assert.equal(report.health.parentSchedule,true);
  assert.equal(report.now.date,'2026-08-28','Daily check must use the canonical core test date');
  assert.deepEqual(report.now.overdue.map(x=>x.title),['Mathe · Überfällige Schulaufgabe','Überfälliges To-do']);
  assert.ok(report.now.overdue.every(x=>x.overdue===true));
  assert.ok(report.now.overdue.every(x=>x.time.startsWith('Überfällig seit ')));
  assert.ok(!report.now.overdue.some(x=>/Erledigt/.test(x.title)),'Done overdue entries must stay hidden');
  assert.deepEqual(report.now.important,['Heute wichtig','Deutsch · Heute abgeben']);
  assert.ok(report.now.pack.includes('Schultasche einpacken'));
  assert.ok(!report.now.pack.includes('Sportbeutel mitnehmen'),'School-break reminders must stay hidden');
  assert.ok(!report.now.pack.includes('Turnzeug mitnehmen'),'School-break schedule notes must stay hidden');
  assert.ok(report.now.timeline.some(x=>x.title==='Tagesschule holt Kind A nach der Schule ab'&&x.kind==='care'));
  assert.ok(report.now.timeline.some(x=>x.title==='Arbeit Test'&&x.time==='07:30–12:00'&&x.kind==='schedule'));
  assert.ok(!report.now.timeline.some(x=>x.title==='Herbstferien'),'Holiday events must not clutter the day timeline');
  assert.deepEqual(report.future.overdue,[],'Overdue carry must be confined to Today');
  assert.deepEqual(report.future.important,['Morgen einkaufen']);

  await page.evaluate(()=>window.fcOpenDailyCheck(todayISO()));
  await page.waitForSelector('#fcDailyCheckModal .fc-dc-overdue-section');
  const ui=await page.evaluate(()=>{
    const modal=document.getElementById('fcDailyCheckModal'),text=modal?.textContent||'';
    return{
      text,
      overdueRows:modal?.querySelectorAll('.fc-dc-row.fc-dc-overdue').length||0,
      quickLabels:[...modal.querySelectorAll('[data-dc-date]')].map(x=>x.textContent.trim()),
      overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,
      sheetOverflow:modal.querySelector('.fc-dc-sheet').scrollWidth>modal.querySelector('.fc-dc-sheet').clientWidth+1
    };
  });
  assert.equal(ui.overdueRows,2);
  assert.ok(ui.text.includes('Überfällig'));
  assert.ok(ui.text.includes('Tagesschule holt Kind A nach der Schule ab'));
  assert.ok(ui.text.includes('Arbeit Test'));
  assert.deepEqual(ui.quickLabels,['Heute','Morgen','Übermorgen']);
  assert.equal(ui.overflow,false);
  assert.equal(ui.sheetOverflow,false);

  await browser.close();
  console.log('daily check V9.63.2 regression: ok');
} finally {
  server.kill('SIGTERM');
}
