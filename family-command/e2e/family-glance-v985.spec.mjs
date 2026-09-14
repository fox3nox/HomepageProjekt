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
  const access=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const accessPage=await access.newPage();
  await accessPage.goto(base);
  await accessPage.waitForFunction(()=>document.documentElement.dataset.fcAccess==='required');
  assert.equal(await accessPage.locator('#fcAccessTitle').innerText(),'Persönlicher Zugang fehlt');
  assert.equal(await accessPage.locator('.fc-access-steps li').count(),2);
  assert.ok((await accessPage.locator('#fcAccessRetry').boundingBox()).height>=44);
  assert.equal(await accessPage.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  if(process.env.FC_QA_DIR){await mkdir(process.env.FC_QA_DIR,{recursive:true});await accessPage.screenshot({path:resolve(process.env.FC_QA_DIR,`access-mobile-${engine}.png`)});}
  await Promise.all([accessPage.waitForEvent('domcontentloaded'),accessPage.locator('#fcAccessRetry').click()]);
  await accessPage.waitForFunction(()=>document.documentElement.dataset.fcAccess==='required');
  await access.close();

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
    data.homework=[];
    data.schedules={};
    data.todos=[{id:'today-important',title:'Wichtige Unterlagen mitnehmen',date:'2026-09-14',done:false,priority:true}];
    data.events=[{id:'first-event',personIds:['oli'],title:'Erster Termin',date:'2026-09-14',time:'08:15'}];
    window.__fcV9.invalidate();renderToday();
  });
  const priority=page.locator('#today .fc38-priority');
  assert.equal(await priority.locator(':scope > :first-child').evaluate(e=>e.classList.contains('fc38-focus')),true,'the next action must be the first priority content');
  assert.match(await priority.locator('.fc38-focus').innerText(),/08:15.*Erster Termin/s);
  assert.match(await priority.locator('header').innerText(),/1 offener Punkt/);
  if(process.env.FC_QA_DIR)await page.screenshot({path:resolve(process.env.FC_QA_DIR,`today-mobile-${engine}.png`)});

  await page.locator('.fc9-nav [data-screen="events"]').click();
  await page.waitForFunction(()=>document.querySelector('#events .fc-calendar-disclosure'));
  const month=await page.locator('#events .fc9-month').boundingBox(),picker=await page.locator('#events .fc-calendar-disclosure summary').boundingBox();
  assert.ok(Math.abs(month.y-picker.y)<=4,'month picker must share the compact month row');
  assert.equal(await page.locator('.fc-calendar-disclosure').evaluate(e=>e.open),false);
  await page.locator('.fc-calendar-disclosure summary').click();
  assert.equal(await page.locator('.fc-calendar-disclosure').evaluate(e=>e.open),true);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  if(process.env.FC_QA_DIR)await page.screenshot({path:resolve(process.env.FC_QA_DIR,`calendar-mobile-${engine}.png`)});
  // A realistic evening: preserve every field while reducing duplicate preparation.
  await page.clock.setFixedTime(new Date('2026-09-14T20:12:00+02:00'));
  await page.evaluate(()=>{
    data.homework=[{id:'sign',personId:'child-b',title:'Wochenheft unterschreiben',dueDate:'2026-09-15',done:false}];
    data.todos=[];
    data.reminders=[{id:'bag',personId:'child-c',days:[2],items:['Rucksack','Znüni-Box']}];
    for(const p of data.people.filter(p=>p.id!=='oli'))data.schedules[p.id]={2:[{start:'08:20',end:'11:50',depart:'07:55',label:'Schule'},{start:'13:30',end:'15:05',label:'Schule'}]};
    data.events=[{id:'all-day',personIds:['child-a'],title:'Zähneputzen',date:'2026-09-14'},
      {id:'ended',personIds:['oli'],title:'Fertiger Termin',date:'2026-09-14',time:'16:00',end:'17:00'},
      {id:'unknown-end',personIds:['oli'],title:'Begonnener Termin',date:'2026-09-14',time:'20:00'},
      {id:'future',personIds:['oli','child-a'],title:'Gemeinsamer Ausflug',date:'2026-09-17',time:'09:00'},
      {id:'tomorrow-event',personIds:['oli'],title:'Morgen Termin',date:'2026-09-15',time:'10:00'}];
    __fcV9.invalidate();__fcV9.open('today');__fcReferenceDashboard39.rebuild(true);
  });
  const before=await page.evaluate(()=>JSON.stringify(data)),dash=page.locator('#today > .fc38-dashboard');
  assert.match(await dash.locator('.fc38-focus').innerText(),/Morgen.*07:55/s);
  assert.equal(await dash.locator('.fc38-child').count(),3);
  assert.equal(await dash.locator('.fc38-tomorrow .fc38-pack').count(),0,'school preparation is not duplicated in the evening');
  assert.doesNotMatch(await dash.locator('.fc38-tomorrow').innerText(),/Wochenheft|Rucksack/);
  assert.equal(await dash.locator('.fc978-today-detail').count(),0,'expired starts and untimed notes cannot claim to be upcoming');
  assert.equal(await dash.locator('.fc986-day-notes').evaluate(e=>e.open),false);
  await dash.locator('.fc986-day-notes summary').click();
  assert.match(await dash.locator('.fc986-day-notes').innerText(),/Zähneputzen.*Beginn vorbei · Ende offen/s);
  assert.match(await dash.locator('.fc38-upcoming').innerText(),/In 3 Tagen/);
  assert.equal(await dash.locator('[data-focus-event="future"] .fc-person-badge').count(),2);
  await dash.locator('.fc986-day-notes summary').click();
  for(const width of [375,390,430,1280]){
    await page.setViewportSize({width,height:844});
    const header=await page.locator('.fc9-brand>b').evaluate(e=>{const s=getComputedStyle(e),top=getComputedStyle(document.querySelector('.fc9-topbar-in'));return {filter:s.filter,shadow:s.textShadow,transform:s.transform,padding:parseFloat(top.paddingTop)}});
    if(width<720){assert.ok(header.padding>=24);assert.equal(header.filter,'none');assert.equal(header.shadow,'none');assert.equal(header.transform,'none');}
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width}px overflow`);
    if(process.env.FC_QA_DIR)await page.screenshot({path:resolve(process.env.FC_QA_DIR,`glance-evening-${engine}-${width}.png`)});
  }
  await page.setViewportSize({width:390,height:844});
  await page.locator('.fc9-nav [data-screen="events"]').click();
  assert.match(await page.locator('#events').innerText(),/In 3 Tagen/);
  // Labels survive daylight-saving calendar-day boundaries, not just 24h intervals.
  assert.equal(await page.evaluate(()=>{const original=todayISO;todayISO=()=> '2026-10-24';try{return __fcGlanceTime.day('2026-10-26')}finally{todayISO=original}}),'Übermorgen');
  assert.equal(await page.evaluate(()=>JSON.stringify(data)),before,'view-only changes preserve all dates, times, colors and completion flags');
  assert.deepEqual(errors,[]);
  console.log(`PASS ${engine}: access guidance, next-action-first Today and compact calendar month picker`);
}finally{await browser.close();await new Promise(r=>server.close(r));}
