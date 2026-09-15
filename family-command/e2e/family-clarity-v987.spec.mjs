import {openView} from './navigation.mjs';
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium,webkit} from 'playwright';

const root=resolve('family-command'),engine=process.env.FC_BROWSER||'webkit';
const server=createServer(async(req,res)=>{
  const path=new URL(req.url,'http://localhost').pathname,file=resolve(root,'.'+(path==='/'?'/index.html':path));
  if(!file.startsWith(root+sep))return res.writeHead(403).end();
  try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'})[extname(file)]||'application/octet-stream');res.end(await readFile(file));}
  catch{res.writeHead(404).end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await({chromium,webkit})[engine].launch({headless:true});
try{
  const base=`http://127.0.0.1:${server.address().port}/`;
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,timezoneId:'Europe/Zurich',serviceWorkers:'block'});
  await context.addInitScript({content:await readFile(root+'/e2e/mock-private-core.js','utf8')});
  await context.route('https://lmrvapstojcecljjdgds.supabase.co/**',r=>r.fulfill({json:{ok:true,commands:[],documents:[],snapshots:[],skipped:true}}));
  await context.route('**/e2e/mock-private-rules.js',r=>r.fulfill({body:'window.FC_PRIVATE_RULES={tasks:[],scheduleRules:{departures:[],notes:[],pickupRules:[]},pushRules:{ruleTransforms:[],taskFilters:[]}};'}));
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.clock.install({time:new Date('2026-09-14T07:00:00+02:00')});
  await page.goto(base+'?access=test');
  await page.waitForFunction(()=>document.documentElement.dataset.fcReady==='1'&&window.__fcV9&&window.__fcReferenceDashboard39);
  await page.evaluate(()=>{
    todayISO=()=> '2026-09-14';
    data.homework=[{id:'h-tom',personId:'child-b',title:'Unterschrift abgeben',dueDate:'2026-09-15',done:false},{id:'h-now',personId:'child-a',title:'Heute lesen',dueDate:'2026-09-14',done:false}];
    data.todos=[{id:'no-owner',title:'Unterlagen',date:'2026-09-15',done:false},{id:'parent-task',personId:'oli',title:'Elternaufgabe',date:'2026-09-14',done:false},{id:'no-date',title:'Ohne Termin',priority:true,done:false}];
    data.reminders=[];data.schedules={};
    for(const p of data.people.filter(p=>p.id!=='oli'))data.schedules[p.id]={2:[{start:'08:20',end:'11:50',depart:'07:55',label:'Schule'}]};
    data.events=[{id:'shared',title:'Gemeinsamer Termin',date:'2026-09-15',time:'09:00',end:'10:00',personIds:['oli','child-b']},{id:'single',title:'Nur Kind A',date:'2026-09-15',time:'10:00',personIds:['child-a']},{id:'no-time',title:'Ohne Uhrzeit',date:'2026-09-14',personIds:[]},{id:'next',title:'Nächster Termin',date:'2026-09-14',time:'08:15',end:'09:00',personIds:['oli']}];
    __fcV9.invalidate();__fcV9.open('today');
  });
  const before=await page.evaluate(()=>JSON.stringify(data));
  assert.deepEqual(await page.locator('.fc9-nav button span').allTextContents(),['Übersicht','Plan','Familie']);
  assert.equal(await page.locator('#today > .fc38-dashboard [data-next-event="next"]').count(),1);
  assert.equal(await page.locator('#today > .fc38-dashboard [data-focus-event="next"]').count(),0,'focus event is not repeated in the day list');
  assert.equal((await page.locator('#today > .fc38-dashboard').innerText()).match(/Heute lesen/g)?.length,1,'task appears once with its owner');
  assert.equal(await page.locator('#today .fc38-upcoming,#today .fc38-tomorrow,#today .fc978-digest').count(),0,'overview has no repeated future or money lists');

  await page.locator('#today [data-next-event="next"]').click();
  await page.locator('#fcEventDetails').waitFor();
  assert.match(await page.locator('#fcEventDetails').innerText(),/Nächster Termin/);
  await page.keyboard.press('Escape');
  await page.locator('#today .fc986-day-notes summary').click();
  await page.evaluate(()=>__fcReferenceDashboard39.rebuild(true));
  assert.equal(await page.locator('#today .fc986-day-notes').evaluate(e=>e.open),true,'minute/data rebuild preserves expanded details');
  await openView(page,'tomorrow');
  await page.locator('[data-tomorrow-person="child-b"]').click();
  assert.equal(await page.locator('#tomorrow .fc9-person').count(),1);
  assert.equal(await page.locator('#tomorrow [data-event="shared"]').count(),1);
  assert.equal(await page.locator('#tomorrow [data-event="single"]').count(),0);
  await page.locator('#tomorrow [data-tomorrow-tasks]').click();
  assert.equal(await page.evaluate(()=>__fcV9.state.taskFilter),'tomorrow');
  assert.equal(await page.locator('#homework [data-hw="h-tom"]').count(),1);
  assert.equal(await page.locator('#homework [data-hw="h-now"]').count(),0);
  await page.locator('#homework [data-task-person="all"]').click();
  assert.equal(await page.locator('#homework [data-todo="no-owner"]').count(),1);
  await page.locator('#homework [data-task-person="unassigned"]').click();
  assert.equal(await page.locator('#homework [data-hw]').count(),0);
  assert.equal(await page.locator('#homework [data-todo="no-owner"]').count(),1);
  await page.locator('#homework [data-task-filter="open"]').click();
  assert.equal(await page.locator('#homework [data-deadline="Ohne Frist"] [data-todo="no-date"]').count(),1);
  await openView(page,'tomorrow');
  await page.locator('#tomorrow [data-cal-tom]').click();
  assert.equal(await page.evaluate(()=>__fcV9.state.weekDate),'2026-09-15');
  assert.equal(await page.evaluate(()=>__fcV9.state.calendarMode),'week');
  assert.equal(await page.locator('#events .fc9-person').count(),1,'week school rows follow person filter');
  assert.equal(await page.locator('#events [data-event="shared"] .fc-person-badge').count(),2,'shared event never loses other owners through a filter');
  await page.locator('[data-week-shift="7"]').click();
  assert.equal(await page.evaluate(()=>__fcV9.state.weekDate),'2026-09-22');
  await page.locator('[data-week-shift="-7"]').click();
  assert.equal(await page.evaluate(()=>__fcV9.state.weekDate),'2026-09-15');
  await page.locator('#events [data-filter="oli"]').click();
  assert.equal(await page.locator('#events .fc9-person').count(),0);
  await page.locator('#events [data-filter="all"]').click();
  assert.equal(await page.locator('#events .fc9-person').count(),3);
  for(const screen of ['today','tomorrow','events','homework','more']){
    await openView(page,'+screen+');
    for(const width of [375,390,430,1280]){
      await page.setViewportSize({width,height:844});
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,screen+' overflows '+width);
      const small=await page.locator('#'+screen+' .fc987-person-filters button,#'+screen+' .fc987-week-navigation button').evaluateAll(buttons=>buttons.filter(b=>b.getBoundingClientRect().width<44||b.getBoundingClientRect().height<44||b.scrollWidth>b.clientWidth+1||b.scrollHeight>b.clientHeight+1).map(b=>b.textContent));
      assert.deepEqual(small,[],screen+' filter touch targets and unclipped labels');
      if(process.env.FC_QA_EMBED_PREVIEW==='1'&&engine==='chromium'&&width===390)console.log('FC_VISUAL_'+screen+':'+(await page.screenshot({type:'jpeg',quality:65})).toString('base64'));
      if(process.env.FC_QA_DIR){await mkdir(process.env.FC_QA_DIR,{recursive:true});await page.screenshot({path:resolve(process.env.FC_QA_DIR,`clarity-${screen}-${engine}-${width}.png`)});}
    }
  }
  await page.evaluate(()=>{__fcV9.state.calendarMode='agenda';__fcV9.open('events')});
  await page.clock.setFixedTime(new Date('2026-09-14T09:01:00+02:00'));
  await page.evaluate(()=>__fcClarity.refresh());
  assert.equal(await page.locator('#events .fc9-past-list [data-event="next"]').count(),1,'elapsed event moves to history during an open session');
  assert.equal(await page.evaluate(()=>JSON.stringify(data)),before,'every navigation, filter and expansion is read-only');
  assert.deepEqual(errors,[]);
  console.log(`PASS ${engine}: focus destination, filter ownership, day navigation, deadline groups, expanded details, three destinations and their five views at four widths; zero data changes`);
}finally{await browser.close();await new Promise(r=>server.close(r));}
