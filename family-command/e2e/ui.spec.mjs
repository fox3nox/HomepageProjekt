import { webkit } from 'playwright';
import { spawn } from 'node:child_process';
import { readFileSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';

const PORT=4173,BASE=`http://127.0.0.1:${PORT}`,ART='family-command/e2e-artifacts';
mkdirSync(ART,{recursive:true});
const stateSeed=readFileSync('family-command/e2e/mock-private-core.js','utf8');
const deferred=['push-v2.js','runtime-health.js','family-ai-v2.js','ai-budget-guard.js','family-ai-original-links.js','backup-manager.js','app-selftest-v6.js'];
const server=spawn('python3',['-m','http.server',String(PORT),'--directory','family-command'],{stdio:['ignore','pipe','pipe']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<40;i++){try{const r=await fetch(BASE+'/index.html');if(r.ok)return}catch{}await sleep(100)}throw new Error('local server not ready')}
async function textVisible(page,text){return page.locator('.fc9-screen.active').getByText(text,{exact:false}).first().isVisible().catch(()=>false)}
async function appClick(page,id){return page.locator(`.fc9-nav button[data-screen="${id}"]`).evaluate(el=>{const t=performance.now();el.click();return Math.round((performance.now()-t)*10)/10})}

async function runViewport(browser,name,width,height){
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});
  await context.addInitScript({content:stateSeed});
  await context.addInitScript(()=>{try{Object.defineProperty(navigator,'canShare',{configurable:true,value:()=>true});Object.defineProperty(navigator,'share',{configurable:true,value:async payload=>{const f=payload?.files?.[0];window.__fcLastShare=f?{name:f.name,type:f.type,size:f.size}:null}})}catch{}});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push('pageerror: '+e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});
  await page.route('**/functions/v1/family-command-chat-commands*',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,commands:[]}),headers:{'access-control-allow-origin':'*'}}));
  await page.route('**/functions/v1/family-command-documents/**',r=>r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({documents:[]}),headers:{'access-control-allow-origin':'*'}}));
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

  await appClick(page,'tomorrow');
  assert.ok(await textVisible(page,'Morgen erledigen'));
  assert.ok(await textVisible(page,'Testaufgabe für morgen'));
  assert.ok(await textVisible(page,'bereits erledigt vorbereitet'));

  await page.evaluate(()=>window.__fcLoadExtrasNow());
  await page.waitForFunction(()=>window.__fcPrintPlannerV2?.version==='3.0.0');
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

  const health=await page.evaluate(()=>window.__fcV9.health());
  assert.deepEqual(health.dup,[]);assert.equal(health.overflow,false);assert.equal(health.tomorrowTodos.length,1);
  assert.ok(health.nav.every(x=>x.h>=44),`touch targets: ${JSON.stringify(health.nav)}`);
  for(let i=0;i<12;i++){const id=i%2?'today':'tomorrow';await appClick(page,id);await page.waitForFunction(x=>document.getElementById(x)?.classList.contains('active'),id)}
  assert.equal(await page.locator('.fc9-screen.active').count(),1);
  assert.equal(errors.length,0,'browser errors: '+errors.join(' | '));
  await context.close();
  return{name,width,height,boot,timings,runtime,dayShare,weekShare};
}

let browser;
try{await ready();browser=await webkit.launch({headless:true});const results=[await runViewport(browser,'iphone-390',390,844),await runViewport(browser,'iphone-430',430,932)];console.log(JSON.stringify({ok:true,results},null,2))}finally{if(browser)await browser.close();server.kill('SIGTERM')}
