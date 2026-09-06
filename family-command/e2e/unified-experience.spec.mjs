import { webkit, chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import assert from 'node:assert/strict';

const root=resolve('family-command');
const server=createServer((req,res)=>{
  const file=resolve(root,'.'+(new URL(req.url,'http://localhost').pathname==='/'?'/index.html':new URL(req.url,'http://localhost').pathname));
  if(!file.startsWith(root)){res.writeHead(403).end();return;}
  readFile(file,(err,bytes)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'})[extname(file)]||'application/octet-stream');res.end(bytes);});
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const failures=[];
async function check(name,fn){try{await fn();console.log('PASS '+name);}catch(e){failures.push(name+': '+e.message);console.error('FAIL '+name+': '+e.stack);}}
try{
for(const [name,engine,width,height] of [['iPhone WebKit',webkit,390,844],['Desktop Chromium',chromium,1440,1000]]){
 const browser=await engine.launch({headless:true});
 try{
 const context=await browser.newContext({viewport:{width,height},isMobile:width<720,hasTouch:width<720,timezoneId:'Europe/Zurich',serviceWorkers:'block',reducedMotion:'reduce'});
 await context.addInitScript({content:readFileSync('family-command/e2e/mock-private-core.js','utf8')});
 const page=await context.newPage(),errors=[];page.setDefaultTimeout(8000);page.on('pageerror',e=>errors.push(e.message));
 await page.clock.setFixedTime(new Date('2026-09-07T06:30:00+02:00'));
 await page.goto(`http://127.0.0.1:${server.address().port}/?access=test`);
 await page.waitForFunction(()=>window.__fcTomorrowCalendarV9674&&window.__fcV9&&window.__fcDialogs);
 await page.evaluate(()=>{
  todayISO=()=> '2026-09-07';
  data.todos=[{id:'permission',title:'Einverständnis für den Ausflug abgeben',date:'2026-09-07',priority:true,done:false}];
  data.homework=[{id:'math',personId:'child-a',title:'Seite 42',subject:'Mathematik',dueDate:'2026-09-07',done:false}];
  data.events=[{id:'dental',title:'Zahnarztkontrolle',date:'2026-09-07',time:'15:00',personIds:['child-b'],note:'Versicherungskarte mitnehmen'}];
  data.schedules={'child-a':{1:[{start:'07:30',end:'11:55',depart:'07:05',label:'Schule'}]},'child-b':{},'child-c':{}};
  __fcV9.invalidate();renderToday();
 });
 await check(name+' shares the daily focus without changing data',async()=>{
  const result=await page.evaluate(()=>{const before=JSON.stringify(data);__fcReferenceDashboard39.rebuild(true);const dashboard=document.querySelector('.fc38-dashboard'),focus=dashboard.querySelector('.fc38-focus').getBoundingClientRect(),child=dashboard.querySelector('.fc38-child').getBoundingClientRect(),main=document.querySelector('.fc9-main').getBoundingClientRect();return{same:before===JSON.stringify(data),basisInert:document.querySelector('#today>.fc9-page').inert,focusBottom:focus.bottom,childBottom:child.bottom,mainBottom:main.bottom,columns:getComputedStyle(dashboard).gridTemplateColumns.split(' ').length};});
  assert.equal(result.same,true);assert.equal(result.basisInert,true);
  assert.ok(result.focusBottom<result.mainBottom&&result.childBottom<result.mainBottom,'next action and first child are visible before scrolling');
  assert.equal(result.columns,width<1000?1:2);
  assert.match(await page.locator('.fc38-focus').innerText(),/07:05.*Kind A/);
  assert.equal(await page.locator('.fc38-taskicon').count(),0,'category emoji must not look like a second checkbox');
  for(const sel of ['.fc38-check','.fc38-go','.fc38-switch button'])for(const box of await page.locator(sel).evaluateAll(els=>els.map(e=>({w:e.getBoundingClientRect().width,h:e.getBoundingClientRect().height}))))assert.ok(box.w>=44&&box.h>=44,sel+JSON.stringify(box));
  await page.locator('[data-fc9668-mode=week]').click();assert.equal(await page.locator('.fc9668-day').count(),7);await page.locator('[data-fc9668-mode=day]').click();
 });
 await check(name+' navigation restores the actual content scroll position',async()=>{
  await page.locator('.fc9-nav [data-screen=more]').click();
  await page.locator('[data-fc-budget]').waitFor();
  await page.evaluate(()=>{document.querySelector('.fc9-main').scrollTop=900;window.scrollTo(0,900);});
  assert.ok(await page.evaluate(()=>document.querySelector('.fc9-main').scrollTop+window.scrollY)>0);
  await page.locator('.fc9-nav [data-screen=homework]').click();
  assert.equal(await page.evaluate(()=>document.querySelector('.fc9-main').scrollTop+window.scrollY),0);
 });
 await check(name+' tasks and calendar meet readable type and touch sizes',async()=>{
  for(const screen of ['homework','events']){
   await page.locator(`.fc9-nav [data-screen=${screen}]`).click();
   const result=await page.locator('#'+screen).evaluate(root=>({title:[...root.querySelectorAll('.fc9-row-main b')].map(e=>parseFloat(getComputedStyle(e).fontSize)),meta:[...root.querySelectorAll('.fc9-row-main span')].map(e=>parseFloat(getComputedStyle(e).fontSize)),small:[...root.querySelectorAll('button')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&r.height&&r.height<44}).map(e=>e.outerHTML.slice(0,100))}));
   assert.ok(result.title.length);assert.ok(result.title.every(n=>n>=14),JSON.stringify(result));assert.ok(result.meta.every(n=>n>=12),JSON.stringify(result));assert.deepEqual(result.small,[]);
  }
 });
 await check(name+' task dialog validates, traps focus and closes with Escape',async()=>{
  await page.locator('.fc9-nav [data-screen=homework]').click();
  const opener=page.locator('#homework [data-hw="math"] .fc9-danger');await opener.focus();await opener.click();
  const dialog=page.getByRole('dialog',{name:'Schulaufgabe bearbeiten'});await dialog.waitFor();
  assert.equal(await page.locator('.app').evaluate(e=>e.inert),true);
  const fields=await dialog.locator('input,textarea,select').evaluateAll(es=>es.map(e=>({font:parseFloat(getComputedStyle(e).fontSize),labels:e.labels.length})));
  assert.ok(fields.every(e=>e.font>=16&&e.labels>0),JSON.stringify(fields));
  const first=dialog.locator('button,input,select,textarea').first(),last=dialog.locator('button,input,select,textarea').last();
  await last.focus();await page.keyboard.press('Tab');assert.equal(await first.evaluate(e=>e===document.activeElement),true);
  await page.keyboard.press('Shift+Tab');assert.equal(await last.evaluate(e=>e===document.activeElement),true);
  await page.locator('#fc9HwTitle').fill('');await dialog.locator('[data-save]').click();
  assert.equal(await dialog.count(),1);assert.equal(await page.locator('#fc9HwTitle').getAttribute('aria-invalid'),'true');assert.match(await dialog.getByRole('alert').innerText(),/markierten Felder/);
  assert.equal(await page.evaluate(()=>data.homework[0].title),'Seite 42','invalid save must not mutate data');
  await page.keyboard.press('Escape');await dialog.waitFor({state:'detached'});
  assert.equal(await page.locator('.app').evaluate(e=>e.inert),false);assert.equal(await opener.evaluate(e=>e===document.activeElement),true);
 });
 await check(name+' grouped destinations, nested dialogs and local open-source icons',async()=>{
  await page.locator('.fc9-nav [data-screen=more]').click();
  assert.equal(await page.locator('.fc-more-group').count(),3);
  assert.deepEqual(await page.locator('[data-more-group=daily] .fc9-tile b').allTextContents(),['Einkaufen & Listen','Mahlzeiten','Rezepte & Favoriten']);
  for(const [group,key] of [['daily','data-fc-shopping'],['daily','data-fc-meals'],['daily','data-fc-recipes'],['family','data-feature=docs'],['family','data-feature=people'],['manage','data-fc-budget']])assert.equal(await page.locator(`[data-more-group=${group}] [${key}] svg.fc-icon`).count(),1,group+'/'+key);
  await page.locator('#more [data-fc-recipes]').click();await page.locator('.fc-recipes-new').click();
  await page.waitForFunction(()=>document.querySelector('#fcRecipesModal')?.inert);
  assert.equal(await page.getByRole('dialog').count(),1,'only top modal is exposed to accessibility tools');
  await page.keyboard.press('Escape');await page.locator('#fcRecipeEdit').waitFor({state:'detached'});
  assert.equal(await page.locator('#fcRecipesModal').evaluate(e=>e.inert),false);
  assert.equal(await page.locator('.fc-recipes-new').evaluate(e=>e===document.activeElement),true);
  await page.keyboard.press('Escape');await page.locator('#fcRecipesModal').waitFor({state:'detached'});
  assert.equal(await page.locator('.app').evaluate(e=>e.inert),false);
  assert.equal(await page.locator('.fc9-nav svg.fc-icon').count(),5);
 });
 await check(name+' responsive screens stay inside narrow and tablet viewports',async()=>{
  for(const w of (width<720?[320,375,430,768]:[1024,1280])){
   await page.setViewportSize({width:w,height});
   for(const screen of ['today','tomorrow','events','homework','more']){
    await page.locator(`.fc9-nav [data-screen=${screen}]`).click();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,screen+' at '+w);
   }
  }
 });
 await check(name+' no page exceptions or viewport overflow',async()=>{assert.deepEqual(errors,[]);assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);});
 }finally{await browser.close();}
}
}finally{server.close();}
assert.deepEqual(failures,[],failures.join('\n'));
console.log('Unified experience: both renderers passed');
