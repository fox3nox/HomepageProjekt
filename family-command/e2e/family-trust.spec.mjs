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
 await context.route('https://lmrvapstojcecljjdgds.supabase.co/**',route=>route.fulfill({json:route.request().url().endsWith('/parse')?{ok:true,parsed:{summary:'Abholung prüfen',items:[{type:'event',title:'Stuhl abholen',personId:'unknown',date:'2026-08-29',time:'14:00',confidence:.99},{type:'reminder',title:'Stuhl bereitstellen',personId:'oli',date:'2026-08-29',confidence:.7}]}}:{ok:true,commands:[],documents:[],snapshots:[],skipped:true}}));
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(6000);
 await page.clock.install({time:new Date('2026-08-28T07:30:00+02:00')});
 await page.goto(`http://127.0.0.1:${server.address().port}/?access=test`);
 await page.waitForFunction(()=>document.documentElement.dataset.fcReady==='1'&&window.__fcV9);
 if(process.env.FC_TRUST_CASE!=='ai'){
  await page.evaluate(()=>{data.events=[];data.todos=[];data.homework=[];data.schedules={};data.reminders=[];data.pendencies=[{id:'small-debt',title:'Rückzahlung',amount:10,done:false}];__fcV9.invalidate();renderToday()});
  const dash=page.locator('#today > .fc38-dashboard');
  assert.doesNotMatch(await dash.locator('.fc38-priority').innerText(),/Pendenz|Alles erledigt/,'money alone is not urgent and no blanket all-done promise');
  assert.doesNotMatch(await dash.locator('.fc38-daybar').innerText(),/Pendenz/,'money stays out of the daily attention summary');
  assert.match(await dash.locator('.fc978-digest').innerText(),/Rückzahlung/,'money remains findable until explicitly completed');
  await page.evaluate(()=>{data.homework=[{id:'future-test',title:'Mathetest üben',personId:'child-b',dueDate:'2026-08-31',done:false},{id:'done-work',title:'Schon erledigt',personId:'child-a',dueDate:'2026-08-30',done:true},{id:'old-work',title:'Frist bleibt offen',personId:'child-a',dueDate:'2026-08-27',done:false}];__fcV9.invalidate();renderToday()});
  assert.match(await dash.locator('.fc38-upcoming').innerText(),/Mathetest üben/,'school work appears before the day it is due, even without calendar events');
  assert.doesNotMatch(await dash.innerText(),/Schon erledigt/);assert.match(await dash.locator('.fc38-priority').innerText(),/Frist bleibt offen/);
 }
 await page.locator('#fc9AI').click();await page.getByRole('button',{name:'Text',exact:true}).click();
 await page.locator('#aitext').fill('Morgen um 14 Uhr wird ein Stuhl abgeholt. Vorher bereitstellen.');await page.locator('#aitxt').click();
 await page.locator('.aiitem').first().waitFor();
 assert.equal(await page.locator('.aiitem').first().locator('.rem').inputValue(),'0','a missing AI reminder choice cannot disable reminders');
 assert.equal(await page.locator('.aiitem .inc:checked').count(),0,'every AI proposal requires explicit selection');
 assert.equal(await page.locator('.aiitem').first().locator('.fc-person-picker input:checked').count(),0, 'unknown person cannot silently become the first person');
 const before=await page.evaluate(()=>JSON.stringify(data));
 await page.locator('.aiitem').first().locator('.inc').check();await page.locator('#aiapply').click();
 assert.match(await page.locator('.aierr').innerText(),/Person/);assert.equal(await page.evaluate(()=>JSON.stringify(data)),before);
 await page.locator('.aiitem').first().locator('.fc-person-picker input[value="oli"]').check();
 await page.locator('.aiitem').first().locator('.fc-person-picker input[value="child-a"]').check();
 await page.locator('.aiitem').nth(1).locator('.inc').check();await page.locator('#aiapply').click();
 await page.waitForFunction(()=>!document.getElementById('fcAi'));
 assert.deepEqual(await page.evaluate(()=>data.events.find(e=>e.title==='Stuhl abholen').personIds),['oli','child-a']);
 assert.equal(await page.evaluate(()=>data.events.filter(e=>e.title==='Stuhl abholen'&&e.personIds.includes('oli')).length),1);
 assert.equal(await page.evaluate(()=>data.todos.filter(t=>t.title==='Stuhl bereitstellen'&&t.date==='2026-08-29').length),1,'a one-time reminder is an actionable task');
 assert.equal(await page.evaluate(()=>data.events.filter(e=>e.title==='Stuhl bereitstellen').length),0);
 await page.locator('#fc9AI').click();await page.getByRole('button',{name:'Dokument',exact:true}).click();
 await page.locator('.fc-doc-center').waitFor();assert.equal(await page.locator('#fcAi').count(),0,'documents use the canonical original-first review');
 await page.keyboard.press('Escape');
 for(const width of [390,393,402,430,768,1024,1440]){
  await page.setViewportSize({width,height:844});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`${width}px horizontal overflow`);
  if(process.env.FC_QA_DIR){await mkdir(process.env.FC_QA_DIR,{recursive:true});await page.screenshot({path:resolve(process.env.FC_QA_DIR,`trust-${engine}-${width}.png`)});}
 }
 await page.goto(`http://127.0.0.1:${server.address().port}/?access=test&screen=tomorrow`);
 await page.waitForFunction(()=>document.documentElement.dataset.fcReady==='1'&&__fcV9.state.screen==='tomorrow');
 assert.equal(await page.locator('#tomorrow.active').count(),1,'evening push opens tomorrow directly');
 assert.deepEqual(errors,[]);console.log(`PASS ${engine}: attention hierarchy, early school preparation, explicit AI review and canonical document entry`);
}finally{await browser.close();await new Promise(r=>server.close(r));}
