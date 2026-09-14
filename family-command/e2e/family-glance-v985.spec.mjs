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
  await Promise.all([accessPage.waitForLoadState('domcontentloaded'),accessPage.locator('#fcAccessRetry').click()]);
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
    data.todos=[{id:'today-important',title:'Wichtige Unterlagen mitnehmen',date:'2026-09-14',done:false,priority:true}];
    data.events=[{id:'first-event',personIds:['oli'],title:'Erster Termin',date:'2026-09-14',time:'08:15'}];
    window.__fcV9.invalidate();renderToday();
  });
  const priority=page.locator('#today .fc38-priority');
  assert.equal(await priority.locator(':scope > :first-child').evaluate(e=>e.classList.contains('fc38-focus')),true,'the next action must be the first priority content');
  assert.match(await priority.locator('.fc38-focus').innerText(),/08:15.*Erster Termin/s);
  assert.match(await priority.locator('header').innerText(),/JETZT WICHTIG.*1 offener Punkt/s);
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
  assert.deepEqual(errors,[]);
  console.log(`PASS ${engine}: access guidance, next-action-first Today and compact calendar month picker`);
}finally{await browser.close();await new Promise(r=>server.close(r));}
