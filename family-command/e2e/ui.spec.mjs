import { webkit } from 'playwright';
import { spawn } from 'node:child_process';
import { readFileSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';

const PORT=4173,BASE=`http://127.0.0.1:${PORT}`,ART='family-command/e2e-artifacts';
const SUPABASE_FUNCTIONS='https://lmrvapstojcecljjdgds.supabase.co/functions/v1/';
mkdirSync(ART,{recursive:true});
const stateSeed=readFileSync('family-command/e2e/mock-private-core.js','utf8');
const deferred=['push-v2.js','runtime-health.js','ai-budget-guard.js','family-ai-original-links.js'];
const server=spawn('python3',['-m','http.server',String(PORT),'--directory','family-command'],{stdio:['ignore','pipe','pipe']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<40;i++){try{const r=await fetch(BASE+'/index.html');if(r.ok)return}catch{}await sleep(100)}throw new Error('local server not ready')}
async function textVisible(page,text){return page.locator('.fc9-screen.active').getByText(text,{exact:false}).first().isVisible().catch(()=>false)}
async function appClick(page,id){return page.locator(`.fc9-nav button[data-screen="${id}"]`).evaluate(el=>{const t=performance.now();el.click();return Math.round((performance.now()-t)*10)/10})}

async function runViewport(browser,name,width,height){
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,serviceWorkers:'block',userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});
  await context.addInitScript({content:stateSeed});
  await context.addInitScript(()=>{try{Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});Object.defineProperty(navigator,'share',{configurable:true,value:async payload=>{const f=payload?.files?.[0];window.__fcLastShare=f?{name:f.name,type:f.type,size:f.size}:null}})}catch{}});
  const page=await context.newPage(),errors=[],unexpectedExternal=[],backendCalls={backupList:0,backupSnapshot:0};
  page.on('pageerror',e=>errors.push('pageerror: '+e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});
  page.on('response',r=>{if(r.status()>=400)errors.push(`http ${r.status()}: ${r.url()}`)});

  /* The local UI test never reaches a real Supabase function. */
  await page.route(SUPABASE_FUNCTIONS+'**',route=>{
    const url=route.request().url();
    if(url.includes('/family-command-chat-commands'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,commands:[]}),headers:{'access-control-allow-origin':'*'}});
    if(url.includes('/family-command-documents'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,documents:[]}),headers:{'access-control-allow-origin':'*'}});
    if(url.includes('/family-command-backups')){
      if(url.includes('/snapshot')){backendCalls.backupSnapshot++;return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,skipped:false,snapshot:{id:'snap-new',created_at:'2026-08-30T06:30:00Z',reason:'manual'}}),headers:{'access-control-allow-origin':'*'}})}
      if(url.includes('/get'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,snapshot:{id:'snap-1',state:{people:[],events:[],schedules:{}}}}),headers:{'access-control-allow-origin':'*'}});
      backendCalls.backupList++;return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,snapshots:[{id:'snap-1',created_at:'2026-08-29T18:00:00Z',reason:'auto'}]}),headers:{'access-control-allow-origin':'*'}});
    }
    unexpectedExternal.push(url);
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,test:true}),headers:{'access-control-allow-origin':'*'}});
  });
  for(const file of deferred)await page.route(`**/${file}?*`,r=>r.fulfill({status:200,contentType:'application/javascript',body:'/* deferred disabled in e2e */'}));

  const start=Date.now();
  await page.goto(BASE+'/?access=test',{waitUntil:'domcontentloaded',timeout:15000});
  await page.waitForFunction(()=>document.documentElement.dataset.fcV9Ready==='1',{timeout:10000});
  await page.waitForFunction(()=>document.documentElement.dataset.fcReady==='1'&&!document.getElementById('fcBoot')&&getComputedStyle(document.getElementById('fcApp')).visibility==='visible',{timeout:10000});
  const boot=Date.now()-start;

  const runtime=await page.evaluate(()=>({core:window.__fcCoreRuntime?.health?.(),cloud:window.__fcCloudState?.health?.(),boot:document.documentElement.dataset.fcBoot||''}));
  assert.equal(runtime.core?.legacyBundle,false,'legacy private UI bundle must not be active');
  assert.equal(runtime.boot,'v9-runtime-ok','minimal runtime boot marker');
  assert.equal(runtime.cloud?.status,'test','cloud layer remains deterministic in local E2E');
  assert.equal(await page.title(),'Familienzentrale');
  assert.equal((await page.locator('.fc9-brand b').innerText()).trim(),'Familienzentrale');
  assert.equal(await page.locator('.fc9-screen.active').count(),1);
  assert.ok(await textVisible(page,'Testaufgabe für morgen'),'Today preview contains private-rule test todo');
  await page.screenshot({path:`${ART}/${name}-today.png`,fullPage:false});

  const timings={};
  for(const [id,label] of [['tomorrow','Morgen'],['events','Kalender'],['homework','Aufgaben'],['more','Mehr'],['today','Heute']]){
    timings[id]=await appClick(page,id);
    await page.waitForFunction(x=>document.getElementById(x)?.classList.contains('active'),id);
    assert.ok(timings[id]<250,`${label} render under 250 ms; got ${timings[id]} ms`);
    assert.equal(await page.locator('.fc9-screen.active').count(),1);
    assert.ok((await page.locator(`#${id}`).innerText()).trim().length>0);
    if(id==='events'){
      await page.waitForSelector('#events .fc9-past-toggle',{state:'visible'});
      assert.ok(await textVisible(page,'Betreuungstermin'),'upcoming fixture remains visible');
      assert.equal(await textVisible(page,'Vergangener Testtermin'),false);
      assert.ok(await textVisible(page,'Vergangene Termine'));
    }
    await page.screenshot({path:`${ART}/${name}-${id}.png`,fullPage:false});
  }

  await appClick(page,'events');
  await page.locator('.fc9-past-toggle').click();
  assert.ok(await textVisible(page,'Vergangener Testtermin'));
  assert.ok(await textVisible(page,'Vergangen'));

  /* Event details, editing, deleting and original picker are native to event-details.js. */
  const eventRow=page.locator('#events [data-event]').filter({hasText:'Betreuungstermin'}).first();
  assert.ok(await eventRow.isVisible());
  await eventRow.click();
  await page.waitForSelector('#fcEventDetails .fc-detail-sheet');
  assert.ok(await page.locator('#fcEventDetails').getByText('Betreuungstermin',{exact:false}).first().isVisible());
  const eventDetailsHealth=await page.evaluate(()=>window.__fcEventDetailsHealth||null);
  assert.equal(eventDetailsHealth?.version,3);
  assert.equal(eventDetailsHealth?.v9Native,true);
  assert.equal(eventDetailsHealth?.mutationObserver,false);
  assert.equal(eventDetailsHealth?.renderWrappers,false);
  assert.equal(eventDetailsHealth?.legacySelectors,false);
  assert.equal(eventDetailsHealth?.nativeActions,true);
  assert.equal(eventDetailsHealth?.editNative,true);
  assert.equal(eventDetailsHealth?.deleteViaTombstones,true);
  assert.equal(await page.locator('#fcEventDetails [class*="pro-"]').count(),0);
  const detailGeom=await page.evaluate(()=>({vw:innerWidth,scrollW:document.getElementById('fcEventDetails')?.scrollWidth||0}));
  assert.ok(detailGeom.scrollW<=detailGeom.vw+1,`event detail overflow: ${JSON.stringify(detailGeom)}`);

  await page.locator('#fcEventDetails .fc-detail-edit').click();
  await page.waitForSelector('#fcEventEdit .fc-event-edit-sheet');
  assert.equal(await page.locator('#fcEventEdit [class*="fc9-"]').count(),0,'event editor must not depend on V9 modal classes');
  await page.locator('#fcEventEditName').fill('Betreuungstermin bearbeitet');
  await page.locator('#fcEventEditNote').fill('V9.12 Edit-Test');
  await page.locator('#fcEventEdit .fc-event-edit-save').click();
  await page.waitForSelector('#fcEventEdit',{state:'detached'});
  await page.waitForSelector('#fcEventDetails .fc-detail-sheet');
  await page.locator('#fcEventDetails').getByText('Betreuungstermin bearbeitet',{exact:false}).first().waitFor({state:'visible',timeout:10000});
  const persistedEdit=await page.evaluate(()=>{try{return JSON.parse(localStorage.getItem('family-command-personal-v4')||'{}').events?.find(e=>e.id==='care-fixture')||null}catch{return null}});
  assert.equal(persistedEdit?.title,'Betreuungstermin bearbeitet','edited event title must be persisted');
  assert.equal(persistedEdit?.note,'V9.12 Edit-Test','edited event note must be persisted');

  await page.locator('#fcEventDetails .fc-detail-pick').click();
  await page.waitForSelector('#fcDocPicker .fc-picker-sheet');
  assert.equal(await page.locator('#fcDocPicker [class*="pro-"]').count(),0);
  assert.ok(await page.getByText('Noch kein anderes Original gespeichert.',{exact:false}).last().isVisible());
  const pickerGeom=await page.evaluate(()=>({vw:innerWidth,scrollW:document.getElementById('fcDocPicker')?.scrollWidth||0}));
  assert.ok(pickerGeom.scrollW<=pickerGeom.vw+1,`event picker overflow: ${JSON.stringify(pickerGeom)}`);
  await page.locator('#fcDocPicker .fc-picker-close').click();
  await page.waitForSelector('#fcDocPicker',{state:'detached'});
  await page.locator('#fcEventDetails .fc-detail-close').click();
  await page.waitForSelector('#fcEventDetails',{state:'detached'});

  await appClick(page,'homework');
  await page.locator('#homework [data-edit-hw]').first().click();
  await page.waitForSelector('#fc9Modal');
  await page.getByRole('button',{name:'Originale anzeigen'}).click();
  await page.waitForSelector('#fcHwOriginalModal');
  const hwOriginals=await page.evaluate(()=>({
    version:window.fcHomeworkOriginals?.version||'',
    v9Version:window.__fcV9?.version||'',
    oldGlobals:{
      homeworkMenu:typeof window.v6HomeworkMenu,
      openHomework:typeof window.v6OpenHomework,
      editHomework:typeof window.v6EditHomework,
      editEvent:typeof window.v6EditEvent,
      v8Shell:typeof window.__fcV8Shell,
      eventDeleteV6:typeof window.__fcEventDeleteV6
    },
    nativeDeleteGuard:window.__fcEventDeleteInstalled===true
  }));
  assert.equal(hwOriginals.version,'3.0.0');
  assert.equal(hwOriginals.v9Version,'9.9.0');
  assert.deepEqual(hwOriginals.oldGlobals,{homeworkMenu:'undefined',openHomework:'undefined',editHomework:'undefined',editEvent:'undefined',v8Shell:'undefined',eventDeleteV6:'undefined'});
  assert.equal(hwOriginals.nativeDeleteGuard,true);
  await page.locator('#fcHwOriginalModal .fc-hwo-close').click();

  await appClick(page,'tomorrow');
  assert.ok(await textVisible(page,'Morgen erledigen'));
  assert.ok(await textVisible(page,'Testaufgabe für morgen'));
  assert.ok(await textVisible(page,'bereits erledigt vorbereitet'));

  await page.evaluate(()=>window.__fcLoadExtrasNow());
  await page.waitForFunction(()=>window.__fcPrintPlannerV2?.version==='3.0.0');
  await page.waitForFunction(()=>window.__fcSelfTestV9?.version==='9.0.0');
  await page.waitForFunction(()=>window.__fcBackupHealth?.version===2);
  const selfTest=await page.evaluate(()=>window.fcRunSelfTest?.());
  assert.equal(selfTest?.legacyLoaders,false,'V9 self-test must never load legacy modules');
  assert.equal(selfTest?.ok,true,'V9 self-test must pass: '+JSON.stringify(selfTest?.critical||[]));

  /* V9-native backup UI: More -> Sicherung -> list -> manual snapshot. */
  await appClick(page,'more');
  await page.locator('#more [data-feature="backup"]').click();
  await page.waitForSelector('#fcBackupSheet .fc-bu-sheet');
  const backupHealth=await page.evaluate(()=>window.__fcBackupHealth||null);
  assert.equal(backupHealth?.v9Native,true);assert.equal(backupHealth?.legacySelectors,false);assert.equal(backupHealth?.renderWrapper,false);
  assert.ok(await page.getByText('Aktuellste Sicherung',{exact:false}).last().isVisible());
  const backupGeom=await page.evaluate(()=>({vw:innerWidth,scrollW:document.getElementById('fcBackupSheet')?.scrollWidth||0}));
  assert.ok(backupGeom.scrollW<=backupGeom.vw+1,`backup sheet overflow: ${JSON.stringify(backupGeom)}`);
  const beforeManual=backendCalls.backupSnapshot;
  await page.locator('#fcBackupSheet .fc-bu-now').click();
  for(let i=0;i<50&&backendCalls.backupSnapshot===beforeManual;i++)await sleep(20);
  assert.ok(backendCalls.backupSnapshot>beforeManual,'manual backup must call snapshot endpoint');
  assert.ok(backendCalls.backupList>=1,'backup sheet must load snapshot list');
  await page.locator('#fcBackupSheet .fc-bu-close').click();
  await page.waitForSelector('#fcBackupSheet',{state:'detached'});

  await page.evaluate(()=>window.fcPrintDay('2026-08-29'));
  await page.waitForSelector('#fcPrintOverlay .fp-day-sheet');
  assert.ok(await page.getByText('Testaufgabe für morgen',{exact:false}).last().isVisible());
  assert.ok(await page.getByText('Betreuungstermin',{exact:false}).last().isVisible());
  const dayGeom=await page.evaluate(()=>({vw:innerWidth,scrollW:document.getElementById('fcPrintOverlay')?.scrollWidth||0}));
  assert.ok(dayGeom.scrollW<=dayGeom.vw+1,`day preview overflow: ${JSON.stringify(dayGeom)}`);
  await page.locator('[data-pdf-action]').click();
  await page.waitForFunction(()=>window.__fcLastShare?.type==='application/pdf'&&window.__fcLastShare?.size>1000);
  const dayShare=await page.evaluate(()=>({share:window.__fcLastShare,bytes:Number(document.documentElement.dataset.fcPrintPdfBytes||0),kind:document.documentElement.dataset.fcPrintPdfKind||''}));
  assert.equal(dayShare.kind,'day');assert.ok(dayShare.bytes>1000);
  await page.locator('[data-close-print]').click();

  await page.evaluate(()=>window.fcPrintWeek('2026-08-24'));
  await page.waitForSelector('#fcPrintOverlay .fp-week-sheet');
  assert.ok(await page.getByText('Kaffee-Termin',{exact:false}).last().isVisible());
  const weekGeom=await page.evaluate(()=>({vw:innerWidth,scrollW:document.getElementById('fcPrintOverlay')?.scrollWidth||0,cols:getComputedStyle(document.querySelector('.fp-week-grid')).gridTemplateColumns}));
  assert.ok(weekGeom.scrollW<=weekGeom.vw+1,`week preview overflow: ${JSON.stringify(weekGeom)}`);
  if(width<=700)assert.ok(!weekGeom.cols.includes(' '),`mobile week should stack: ${weekGeom.cols}`);
  await page.evaluate(()=>{window.__fcLastShare=null});
  await page.locator('[data-pdf-action]').click();
  await page.waitForFunction(()=>window.__fcLastShare?.type==='application/pdf'&&window.__fcLastShare?.size>1000);
  const weekShare=await page.evaluate(()=>({share:window.__fcLastShare,bytes:Number(document.documentElement.dataset.fcPrintPdfBytes||0),kind:document.documentElement.dataset.fcPrintPdfKind||''}));
  assert.equal(weekShare.kind,'week');assert.ok(weekShare.bytes>1000);
  await page.locator('[data-close-print]').click();

  const deleteHealth=await page.evaluate(()=>window.__fcDeleteHealth||null);
  assert.equal(deleteHealth?.v9Native,true,'event deletion must be V9-native');
  assert.equal(deleteHealth?.legacyGuard,false,'legacy V6 delete guard must stay removed');
  await page.evaluate(()=>window.fcOpenEventDetails('visit-fixture'));
  await page.waitForSelector('#fcEventDetails .fc-detail-delete');
  await page.locator('#fcEventDetails .fc-detail-delete').click();
  await page.waitForSelector('#fcDeleteConfirm');
  await page.locator('#fcDeleteConfirm .fc-delete-yes').click();
  await page.waitForSelector('#fcDeleteConfirm',{state:'detached'});
  assert.equal(await page.evaluate(()=>data.events.some(e=>e.id==='visit-fixture')),false,'deleted event removed from state');
  assert.ok(await page.evaluate(()=>JSON.parse(localStorage.getItem('fc-deleted-events-v1')||'[]').includes('visit-fixture')),'deleted event persisted as tombstone');

  const health=await page.evaluate(()=>window.__fcV9.health());
  assert.deepEqual(health.dup,[]);assert.equal(health.overflow,false);assert.equal(health.tomorrowTodos.length,1);
  assert.ok(health.nav.every(x=>x.h>=44),`touch targets: ${JSON.stringify(health.nav)}`);
  for(let i=0;i<12;i++){const id=i%2?'today':'tomorrow';await appClick(page,id);await page.waitForFunction(x=>document.getElementById(x)?.classList.contains('active'),id)}
  assert.equal(await page.locator('.fc9-screen.active').count(),1);
  assert.deepEqual(unexpectedExternal,[],'unexpected external Supabase calls: '+unexpectedExternal.join(' | '));
  assert.equal(errors.length,0,'browser errors: '+errors.join(' | '));
  await context.close();
  return{name,width,height,boot,timings,runtime,selfTest,backupHealth,eventDetailsHealth,deleteHealth,backendCalls,hwOriginals,dayShare,weekShare};
}

let browser;
try{await ready();browser=await webkit.launch({headless:true});const results=[await runViewport(browser,'iphone-390',390,844),await runViewport(browser,'iphone-430',430,932)];console.log(JSON.stringify({ok:true,results},null,2))}finally{if(browser)await browser.close();server.kill('SIGTERM')}
