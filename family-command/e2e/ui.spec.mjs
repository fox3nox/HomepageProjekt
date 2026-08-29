import { webkit } from 'playwright';
import { spawn } from 'node:child_process';
import { readFileSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';

const PORT=4173,BASE=`http://127.0.0.1:${PORT}`,ART='family-command/e2e-artifacts';
mkdirSync(ART,{recursive:true});
const mock=readFileSync('family-command/e2e/mock-private-core.js','utf8');
const deferred=['push-v2.js','runtime-health.js','family-ai-v2.js','ai-budget-guard.js','family-ai-original-links.js','backup-manager.js','app-selftest-v6.js'];
const server=spawn('python3',['-m','http.server',String(PORT),'--directory','family-command'],{stdio:['ignore','pipe','pipe']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<40;i++){try{const r=await fetch(BASE+'/index.html');if(r.ok)return}catch{}await sleep(100)}throw new Error('local server not ready')}
async function textVisible(page,text){return page.locator('.fc9-screen.active').getByText(text,{exact:false}).first().isVisible().catch(()=>false)}
async function diagnostics(page,label){const d=await page.evaluate(()=>({boot:document.documentElement.dataset.fcBoot||'',v9Ready:document.documentElement.dataset.fcV9Ready||'',appReady:document.documentElement.dataset.fcReady||'',brand:document.documentElement.dataset.fcBrand||'',pastEvents:document.documentElement.dataset.fcPastEvents||'',bootPresent:!!document.getElementById('fcBoot'),appVisibility:getComputedStyle(document.getElementById('fcApp')).visibility,health:window.__fcV9?.health?.()||null,v9Data:window.__fcV9Data||null,dataTodos:(typeof data!=='undefined'&&Array.isArray(data?.todos))?data.todos.map(t=>({id:t.id,clientRef:t.clientRef,sourceCommandId:t.sourceCommandId,title:t.title,date:t.date,done:t.done,archived:t.archived})):null,chatTodos:window.__fcChatCommandSync?.all?.()?.map?.(t=>({title:t.title,date:t.date,clientRef:t.clientRef,sourceCommandId:t.sourceCommandId}))||null,todayHTML:document.getElementById('today')?.innerHTML||'',todayText:document.getElementById('today')?.innerText||'',tomorrowText:document.getElementById('tomorrow')?.innerText||''}));console.log('FC9_DIAG '+label+' '+JSON.stringify(d));return d}
async function appClick(page,id){return page.locator(`.fc9-nav button[data-screen="${id}"]`).evaluate(el=>{const t=performance.now();el.click();return Math.round((performance.now()-t)*10)/10})}
async function runViewport(browser,name,width,height){
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});
  await context.addInitScript(()=>{
    try{Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});Object.defineProperty(navigator,'share',{configurable:true,value:async payload=>{const f=payload?.files?.[0];window.__fcLastShare=f?{name:f.name,type:f.type,size:f.size}:null;return undefined}})}catch{}
  });
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push('pageerror: '+e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});
  await page.route('**/functions/v1/family-command-private-app*',r=>r.fulfill({status:200,contentType:'application/javascript',body:mock,headers:{'access-control-allow-origin':'*'}}));
  await page.route('**/functions/v1/family-command-chat-commands*',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,commands:[]}),headers:{'access-control-allow-origin':'*'}}));
  await page.route('**/functions/v1/family-command-documents/**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({documents:[]}),headers:{'access-control-allow-origin':'*'}}));
  for(const file of deferred)await page.route(`**/${file}?*`,r=>r.fulfill({status:200,contentType:'application/javascript',body:'/* deferred disabled in e2e */'}));
  const start=Date.now();await page.goto(BASE+'/?access=test',{waitUntil:'domcontentloaded',timeout:15000});
  await page.waitForFunction(()=>document.documentElement.dataset.fcV9Ready==='1',{timeout:10000});
  await page.waitForFunction(()=>document.documentElement.dataset.fcReady==='1'&&!document.getElementById('fcBoot')&&getComputedStyle(document.getElementById('fcApp')).visibility==='visible',{timeout:10000});
  const boot=Date.now()-start;
  await page.screenshot({path:`${ART}/${name}-boot.png`,fullPage:false});
  const bootDiag=await diagnostics(page,name+'-boot');
  assert.equal(await page.locator('.fc9-screen.active').count(),1,'exactly one active screen after boot');
  assert.equal(await page.title(),'Familienzentrale','professional app title');
  assert.equal((await page.locator('.fc9-brand b').innerText()).trim(),'Familienzentrale','professional header brand');
  assert.ok(await textVisible(page,'Fruchtfliegenfalle für meine Frau in der LANDI kaufen'),'Today preview must contain LANDI todo; diag='+JSON.stringify(bootDiag));
  await page.screenshot({path:`${ART}/${name}-today.png`,fullPage:false});
  const timings={};
  for(const [id,label] of [['tomorrow','Morgen'],['events','Kalender'],['homework','Aufgaben'],['more','Mehr'],['today','Heute']]){
    timings[id]=await appClick(page,id);
    await page.waitForFunction(x=>document.getElementById(x)?.classList.contains('active'),id);
    assert.ok(timings[id]<250,`${label} app render should complete under 250ms, got ${timings[id]}ms`);
    assert.equal(await page.locator('.fc9-screen.active').count(),1,`${label}: exactly one active screen`);
    assert.ok((await page.locator(`#${id}`).innerText()).trim().length>0,`${label}: active screen must contain content`);
    if(id==='events'){
      await page.waitForSelector('#events .fc9-past-toggle',{state:'visible'});
      assert.ok(await textVisible(page,'SRK Betreuung – Frau Roth Nicole'),'Upcoming SRK event remains visible');
      assert.equal(await textVisible(page,'Kaffee bei Tanja'),false,'Past event is hidden by default');
      assert.ok(await textVisible(page,'Vergangene Termine'),'Past event disclosure is visible');
    }
    if(id!=='today')await page.screenshot({path:`${ART}/${name}-${id}.png`,fullPage:false});
  }
  await appClick(page,'events');await page.waitForFunction(()=>document.getElementById('events')?.classList.contains('active'));
  await page.waitForSelector('#events .fc9-past-toggle',{state:'visible'});
  await page.locator('.fc9-past-toggle').click();
  assert.ok(await textVisible(page,'Kaffee bei Tanja'),'Past event appears after disclosure');
  assert.ok(await textVisible(page,'Vergangen'),'Past event receives clear visual status');
  await page.screenshot({path:`${ART}/${name}-events-past.png`,fullPage:false});
  await appClick(page,'tomorrow');await page.waitForFunction(()=>document.getElementById('tomorrow')?.classList.contains('active'));
  const tomorrowDiag=await diagnostics(page,name+'-tomorrow');
  assert.ok(await textVisible(page,'Morgen erledigen'),'Tomorrow must render its own todo section; diag='+JSON.stringify(tomorrowDiag));
  assert.ok(await textVisible(page,'Fruchtfliegenfalle für meine Frau in der LANDI kaufen'),'Tomorrow must contain LANDI todo; diag='+JSON.stringify(tomorrowDiag));
  assert.ok(await textVisible(page,'bereits bezahlt, kein Geld mehr verlangen'),'Tomorrow must keep paid note');

  await page.evaluate(()=>window.__fcLoadExtrasNow());
  await page.waitForFunction(()=>window.__fcPrintPlannerV2?.version==='3.0.0');
  await page.evaluate(()=>window.fcPrintDay('2026-08-29'));
  await page.waitForSelector('#fcPrintOverlay .fp-day-sheet');
  assert.ok(await page.getByText('Fruchtfliegenfalle für meine Frau in der LANDI kaufen',{exact:false}).last().isVisible(),'Day print preview includes personal todo');
  assert.ok(await page.getByText('SRK Betreuung – Frau Roth Nicole',{exact:false}).last().isVisible(),'Day print preview includes SRK appointment');
  const dayGeom=await page.evaluate(()=>({vw:innerWidth,scrollW:document.getElementById('fcPrintOverlay')?.scrollWidth||0,sheetW:document.querySelector('.fp-day-sheet')?.getBoundingClientRect().width||0}));
  assert.ok(dayGeom.scrollW<=dayGeom.vw+1,`Day print preview must not overflow horizontally: ${JSON.stringify(dayGeom)}`);
  await page.screenshot({path:`${ART}/${name}-print-day.png`,fullPage:false});
  await page.locator('[data-pdf-action]').click();
  await page.waitForFunction(()=>window.__fcLastShare?.type==='application/pdf'&&window.__fcLastShare?.size>1000);
  const dayShare=await page.evaluate(()=>({share:window.__fcLastShare,bytes:Number(document.documentElement.dataset.fcPrintPdfBytes||0),kind:document.documentElement.dataset.fcPrintPdfKind||''}));
  assert.equal(dayShare.kind,'day');assert.ok(dayShare.bytes>1000,`Day PDF should contain data: ${JSON.stringify(dayShare)}`);
  await page.locator('[data-close-print]').click();await page.waitForSelector('#fcPrintOverlay',{state:'detached'});

  await page.evaluate(()=>window.fcPrintWeek('2026-08-24'));
  await page.waitForSelector('#fcPrintOverlay .fp-week-sheet');
  assert.ok(await page.getByText('Kaffee bei Tanja',{exact:false}).last().isVisible(),'Week preview contains Friday event');
  const weekGeom=await page.evaluate(()=>({vw:innerWidth,scrollW:document.getElementById('fcPrintOverlay')?.scrollWidth||0,cols:getComputedStyle(document.querySelector('.fp-week-grid')).gridTemplateColumns}));
  assert.ok(weekGeom.scrollW<=weekGeom.vw+1,`Week print preview must not overflow horizontally: ${JSON.stringify(weekGeom)}`);
  if(width<=700)assert.ok(!weekGeom.cols.includes(' '),`Mobile week preview should stack days instead of five cramped columns: ${weekGeom.cols}`);
  await page.screenshot({path:`${ART}/${name}-print-week.png`,fullPage:false});
  await page.evaluate(()=>{window.__fcLastShare=null});
  await page.locator('[data-pdf-action]').click();
  await page.waitForFunction(()=>window.__fcLastShare?.type==='application/pdf'&&window.__fcLastShare?.size>1000);
  const weekShare=await page.evaluate(()=>({share:window.__fcLastShare,bytes:Number(document.documentElement.dataset.fcPrintPdfBytes||0),kind:document.documentElement.dataset.fcPrintPdfKind||''}));
  assert.equal(weekShare.kind,'week');assert.ok(weekShare.bytes>1000,`Week PDF should contain data: ${JSON.stringify(weekShare)}`);
  await page.locator('[data-close-print]').click();

  const health=await page.evaluate(()=>window.__fcV9.health());
  assert.deepEqual(health.dup,[],'no duplicate IDs');assert.equal(health.overflow,false,'no horizontal overflow');assert.equal(health.tomorrowTodos.length,1,'exactly one tomorrow todo in fixture');
  assert.ok(health.nav.every(x=>x.h>=44),`all nav touch targets >=44px: ${JSON.stringify(health.nav)}`);
  const geometry=await page.evaluate(()=>({vw:innerWidth,vh:innerHeight,bodyW:document.documentElement.scrollWidth,screenH:document.querySelector('.fc9-screen.active')?.scrollHeight||0,navBottom:Math.round(document.querySelector('.fc9-nav')?.getBoundingClientRect().bottom||0)}));
  assert.ok(geometry.screenH<=height*1.35,`Tomorrow representative view should remain compact: ${geometry.screenH}px for ${height}px viewport`);
  for(let i=0;i<12;i++){const id=i%2?'today':'tomorrow';await appClick(page,id);await page.waitForFunction(x=>document.getElementById(x)?.classList.contains('active'),id)}
  assert.equal(await page.locator('.fc9-screen.active').count(),1,'rapid tab switching remains stable');
  assert.equal(errors.length,0,'browser errors: '+errors.join(' | '));
  await context.close();return{name,width,height,boot,timings,geometry,health,dayShare,weekShare};
}
let browser;
try{await ready();browser=await webkit.launch({headless:true});const results=[];results.push(await runViewport(browser,'iphone-390',390,844));results.push(await runViewport(browser,'iphone-430',430,932));console.log(JSON.stringify({ok:true,results},null,2))}finally{if(browser)await browser.close();server.kill('SIGTERM')}
