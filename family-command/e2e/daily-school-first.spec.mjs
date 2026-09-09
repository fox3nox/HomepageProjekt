import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdir} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {chromium,webkit} from 'playwright';
const root=resolve('family-command'),engine=process.env.FC_BROWSER||'webkit';
const server=createServer(async(req,res)=>{const path=new URL(req.url,'http://localhost').pathname,file=resolve(root,'.'+(path==='/'?'/index.html':path));if(!file.startsWith(root+sep))return res.writeHead(403).end();try{res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'})[extname(file)]||'application/octet-stream');res.end(await readFile(file));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await({chromium,webkit})[engine].launch({headless:true});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,timezoneId:'Europe/Zurich',serviceWorkers:'block'});
 await context.addInitScript({content:await readFile(root+'/e2e/mock-private-core.js','utf8')});
 await context.route('https://lmrvapstojcecljjdgds.supabase.co/**',r=>r.fulfill({json:{ok:true,commands:[],documents:[],snapshots:[],skipped:true}}));
 await context.route('**/e2e/mock-private-rules.js',r=>r.fulfill({body:'window.FC_PRIVATE_RULES={tasks:[],scheduleRules:{departures:[],notes:[],pickupRules:[]},pushRules:{ruleTransforms:[],taskFilters:[]}};'}));
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install({time:new Date('2026-09-10T07:30:00+02:00')});
 await page.goto(`http://127.0.0.1:${server.address().port}/?access=test`);
 await page.waitForFunction(()=>document.documentElement.dataset.fcReady==='1'&&window.__fcV9);
 await page.evaluate(()=>{
  todayISO=()=> '2026-09-10';
  data.todos=[{id:'old-child-debt',title:'Kind A schuldet mir CHF 8 wegen Spiele',date:'2026-08-29',done:false,priority:false},{id:'old-adult-debt',title:'Anna schuldet mir CHF 10 wegen Entsorgungskosten',date:'2026-09-07',done:false,priority:true},{id:'real-deadline',title:'Rechnung CHF 40 heute bezahlen',date:'2026-09-10',done:false,priority:true}];
  data.pendencies=[{id:'child-money',title:'Kind A schuldet mir CHF 10',amount:10,done:false},{id:'adult-money',title:'Anna schuldet mir CHF 10',amount:10,done:false}];
  data.homework=[{id:'math',personId:'child-a',title:'Matheblatt',dueDate:'2026-09-10',done:false},{id:'read',personId:'child-b',title:'Lesebuch',dueDate:'2026-09-11',done:false}];
  data.events=[{id:'appointment',personIds:['oli'],title:'Persönlicher Termin',date:'2026-09-10',time:'09:00'},{id:'trip',personIds:['child-c'],title:'Ausflug',date:'2026-09-11',time:'08:30',note:'Mitnehmen: Leuchtweste'}];
  data.reminders=[{id:'gym',personId:'child-a',days:[4,5],items:['Turnzeug']}];
  for(const p of data.people.filter(p=>p.id!=='oli'))data.schedules[p.id]={4:[{start:'08:20',end:'11:50',depart:'07:55',label:'Schule'}],5:[{start:'08:00',end:'11:40',depart:'07:35',label:'Schule'},{start:'13:30',end:'15:15',depart:'13:05',label:'Schule'}]};
  __fcV9.invalidate();renderToday();
 });
 const dash=page.locator('#today > .fc38-dashboard');
 if(process.env.FC_QA_DIR){await mkdir(process.env.FC_QA_DIR,{recursive:true});await page.screenshot({path:resolve(process.env.FC_QA_DIR,`school-morning-${engine}.png`)});}
 const unchanged=await page.evaluate(()=>JSON.stringify(data));
 assert.doesNotMatch(await page.evaluate(()=>JSON.stringify(pushSnapshot().tasks)),/schuldet mir/,'debt memos do not enter the morning/evening task digest');
 assert.doesNotMatch(await dash.locator('.fc38-priority').innerText(),/schuldet|Spiele|Entsorgungskosten/,'overdue debt TODOs must not become daily urgency');
 assert.match(await dash.locator('.fc38-priority').innerText(),/Matheblatt/,'today schoolwork stays ahead of ordinary priorities');
 assert.match(await dash.locator('.fc38-priority').innerText(),/Rechnung CHF 40 heute bezahlen/,'real payment deadlines remain actionable');
 assert.match(await dash.locator('.fc38-focus').innerText(),/07:55/);
 assert.match(await dash.locator('.fc38-children').innerText(),/08:20.*11:50/s);
 assert.match(await dash.locator('[data-focus-child="child-a"]').innerText(),/Turnzeug.*Matheblatt/s);
 assert.equal(await dash.locator('.fc978-digest').evaluate(x=>x.open),false,'administration is collapsed by default');
 assert.doesNotMatch(await dash.innerText(),/schuldet/);
 assert.match(await dash.locator('.fc978-today-detail').innerText(),/Persönlicher Termin/);
 await dash.locator('.fc978-digest > summary').click();
 assert.match(await dash.locator('.fc978-digest').innerText(),/Kind A schuldet mir CHF 10/);
 await dash.locator('.fc978-pendency').first().click();
 assert.equal(await page.locator('#more [data-pend="child-money"]').count(),1,'debts remain accessible with their actual amounts');
 await page.locator('.fc9-nav [data-screen="today"]').click();
 await page.clock.setFixedTime(new Date('2026-09-10T22:00:00+02:00'));
 await page.evaluate(()=>__fcReferenceDashboard39.rebuild(true));
 const kids=dash.locator('.fc38-children');
 assert.match(await kids.locator('header').innerText(),/morgen/i,'evening shows the next day explicitly');
 assert.equal(await kids.locator('[data-focus-child]').count(),3);
 assert.match(await kids.innerText(),/07:35 los/);assert.match(await kids.innerText(),/08:00–11:40.*13:30–15:15/s,'morning and afternoon are distinct, not one uninterrupted school span');
 assert.match(await kids.locator('[data-focus-child="child-b"]').innerText(),/Lesebuch/);
 assert.match(await kids.locator('[data-focus-child="child-a"]').innerText(),/heute f\u00e4llig/,'today homework cannot silently become due tomorrow');
 assert.match(await kids.locator('[data-focus-child="child-c"]').innerText(),/Leuchtweste/);
 assert.match(await dash.locator('.fc38-focus').innerText(),/morgen.*07:35|07:35.*morgen/i);
 for(const width of [390,393,402,430,768,1024,1440]){
  await page.setViewportSize({width,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width}px overflow`);
  const child=await kids.boundingBox(),money=await dash.locator('.fc978-digest').boundingBox();assert.ok(child.y+child.height<=money.y,`${width}px school before administration`);
  if(process.env.FC_QA_DIR)await page.screenshot({path:resolve(process.env.FC_QA_DIR,`school-evening-${engine}-${width}.png`)});
 }
 assert.equal(await page.evaluate(()=>JSON.stringify(data)),unchanged,'priority changes never alter debts, completion or dates');
 assert.deepEqual(errors,[]);
 console.log(`PASS ${engine}: actual legacy debt TODO case, morning school, evening preparation, payment deadlines and unchanged records`);
}finally{await browser.close();await new Promise(r=>server.close(r));}
