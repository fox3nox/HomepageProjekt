import { webkit } from 'playwright';
import { createServer } from 'node:http';
import { readFile, readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import assert from 'node:assert/strict';

const root=resolve('family-command');
const server=createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root)){res.writeHead(403).end();return;}
  readFile(file,(err,bytes)=>{if(err){res.writeHead(404).end();return;}
    res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'})[extname(file)]||'application/octet-stream');res.end(bytes);});
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await webkit.launch({headless:true});
const failures=[];
async function check(name,fn){try{await fn();console.log('PASS '+name);}catch(e){failures.push(name+': '+e.message);console.error('FAIL '+name+': '+e.message);}}
try {
  const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,timezoneId:'Europe/Zurich',serviceWorkers:'block',reducedMotion:'reduce'});
  await ctx.addInitScript({content:readFileSync('family-command/e2e/mock-private-core.js','utf8')});
  const p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto(`http://127.0.0.1:${server.address().port}/?access=test`);
  await p.waitForFunction(()=>window.__fcTomorrowCalendarV9674&&window.__fcMobileSchoolDayV947);
  await p.evaluate(()=>{
    window.todayISO=()=> '2026-09-07';
    data.todos=[{id:'overdue',date:'2026-01-02',title:'Offene Rechnung',priority:true,done:false},{id:'done-old',date:'2026-01-02',title:'Erledigte Rechnung',done:true}];
    data.homework=[{id:'overdue-hw',dueDate:'2026-01-02',personId:'child-a',title:'Offene Hausaufgabe',done:false}];
    data.events=[{id:'ongoing',date:'2026-09-05',endDate:'2026-09-10',title:'Laufender Besuch',personIds:['oli']},{id:'old',date:'2026-01-02',title:'Alter Termin',personIds:['oli']}];
    data.schedules['child-a']={1:[{start:'08:20',end:'11:55',label:'Turnen',note:'Turnschuhe in den Rucksack mitnehmen'}],2:[{start:'08:20',end:'11:55',label:'Schwimmen',note:'Badehose mitnehmen'}]};
    data.reminders=[{id:'pack',personId:'child-a',days:[1,2],items:['Trinkflasche']}];
    __fcV9.invalidate(); renderToday();
  });
  await check('overdue tasks stay actionable in Today and Tasks; completed history remains accessible',async()=>{
    await p.waitForTimeout(900);
    assert.equal(await p.locator('#today [data-fc38-todo="overdue"]').count(),1);
    assert.equal(await p.locator('#today [data-fc38-homework="overdue-hw"]').count(),1,'overdue homework must be actionable in the visible mobile Today view');
    await p.locator('.fc9-nav [data-screen="homework"]').tap();await p.waitForTimeout(900);
    assert.equal(await p.locator('#homework [data-todo="overdue"]').count(),1);
    assert.equal(await p.locator('#homework [data-hw="overdue-hw"]').count(),1);
    await p.locator('[data-task-filter="done"]').tap();await p.waitForTimeout(900);
    assert.equal(await p.locator('#homework [data-todo="done-old"]').count(),1);
  });
  await check('ongoing multi-day event remains visible without an old date heading',async()=>{
    await p.locator('.fc9-nav [data-screen="events"]').tap();await p.waitForTimeout(900);
    assert.equal(await p.locator('#events [data-event="ongoing"]').count(),1);
    assert.doesNotMatch(await p.locator('#events .fc9-day-label').allTextContents().then(a=>a.join(' ')),/5\. September/);
  });
  await check('weekend selection survives repeated taps, view changes, rerenders and navigation',async()=>{
    await p.locator('[data-fc673-date="2026-09-12"]').tap();await p.waitForTimeout(100);
    assert.equal(await p.evaluate(()=>__fcV9.state.weekDate),'2026-09-12');
    for(const date of ['2026-09-13','2026-09-07','2026-09-12']){await p.locator(`[data-week-date="${date}"]`).tap();assert.equal(await p.evaluate(()=>__fcV9.state.weekDate),date);}
    for(const screen of ['tomorrow','homework','today','events'])await p.locator(`.fc9-nav [data-screen="${screen}"]`).tap();
    await p.evaluate(()=>__fcV9.render('events',true));
    assert.equal(await p.locator('#events [data-week-date].active').getAttribute('data-week-date'),'2026-09-12');
  });
  await check('Today week can select a date in the next calendar week',async()=>{
    await p.locator('.fc9-nav [data-screen="today"]').tap();
    await p.evaluate(()=>{todayISO=()=> '2026-09-11';renderToday();});await p.waitForTimeout(200);
    await p.locator('[data-fc9668-mode="week"]').last().tap();await p.waitForTimeout(900);
    await p.locator('[data-fc9668-date="2026-09-14"]').tap();await p.waitForTimeout(100);
    assert.equal(await p.evaluate(()=>__fcTodayOverviewToggleV9668API.selectedDate),'2026-09-14');
    assert.match(await p.locator('.fc9668-detail header').innerText(),/14/);
  });
  await check('tomorrow packing is idempotent and suppressed during school holidays',async()=>{
    await p.evaluate(()=>{todayISO=()=> '2026-09-07';__fcV9.invalidate();});
    await p.locator('.fc9-nav [data-screen="tomorrow"]').tap();await p.waitForTimeout(100);
    for(let i=0;i<5;i++){await p.evaluate(()=>__fcTomorrowCalendarV9674.render());await p.waitForTimeout(50);}
    assert.equal(await p.locator('#tomorrow .fc674-inline-note').count(),1);
    await p.evaluate(()=>{data.events.push({id:'holiday',title:'Herbstferien',date:'2026-09-07',endDate:'2026-09-12',personIds:['child-a']});renderTomorrow();});
    await p.waitForTimeout(100);
    const row=p.locator('#tomorrow .fc9-person').filter({hasText:'Kind A'});
    assert.equal(await row.count(),0);assert.match(await p.locator('#tomorrow').innerText(),/Kind A.*frei/);
    assert.equal(await row.locator('.fc674-inline-pack').count(),0);
  });
  await check('navigation, mobile overflow, duplicate IDs and JavaScript errors',async()=>{
    for(const screen of ['today','tomorrow','homework','today','events','more','today']){
      await p.locator(`.fc9-nav [data-screen="${screen}"]`).tap();
      assert.equal(await p.locator('.fc9-screen.active').getAttribute('id'),screen);
    }
    const health=await p.evaluate(()=>__fcV9.health());assert.equal(health.overflow,false);assert.deepEqual(health.dup,[]);assert.deepEqual(errors,[]);
    if(process.env.FC_QA_SCREENSHOT)await p.screenshot({path:process.env.FC_QA_SCREENSHOT,fullPage:false});
  });
} finally {await browser.close();await new Promise(r=>server.close(r));}
assert.deepEqual(failures,[]);
