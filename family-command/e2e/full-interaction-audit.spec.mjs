import { webkit } from 'playwright';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const PORT=4189,BASE=`http://127.0.0.1:${PORT}`;
const seed=readFileSync('family-command/e2e/mock-private-core.js','utf8');
const server=spawn('python3',['-m','http.server',String(PORT),'--directory','family-command'],{stdio:['ignore','pipe','pipe']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<50;i++){try{const r=await fetch(BASE+'/index.html');if(r.ok)return}catch{}await sleep(100)}throw new Error('server not ready')}

try{
  await ready();
  const browser=await webkit.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.addInitScript({content:seed});
  const page=await context.newPage();

  const pageErrors=[];const consoleErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e?.stack||e)));
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
  await page.route('**/family-command-documents/list',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({documents:[{id:'doc-audit',title:'Audit Dokument',created_at:'2026-09-03T10:00:00Z',mime_type:'application/pdf'}]})}));

  await page.goto(BASE+'/?access=test',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.fcReady==='1');
  await page.waitForFunction(()=>document.documentElement.dataset.fcGlobalPolish==='v49');

  await page.evaluate(()=>{
    window.__auditCalls=[];
    const hit=(name,...args)=>window.__auditCalls.push([name,...args]);
    window.__fcLoadExtrasNow=async()=>true;
    window.fcOpenFamilyAI=(...a)=>hit('ai',...a);
    window.fcPrintDay=(...a)=>hit('daypdf',...a);
    window.fcPrintWeek=(...a)=>hit('weekpdf',...a);
    window.fcOpenBackups=(...a)=>hit('backup',...a);
    window.enablePush=(...a)=>hit('push',...a);
    window.exportData=(...a)=>hit('export',...a);
    window.fcOpenOriginal=(...a)=>hit('doc',...a);
    window.fcOpenEventDetails=(...a)=>hit('event',...a);
    window.confirm=()=>true;
  });

  async function openScreen(id){await page.click(`.fc9-nav button[data-screen="${id}"]`);await page.waitForFunction(x=>document.querySelector(`#${x}`)?.classList.contains('active'),id)}
  async function closeModal(){const close=page.locator('#fc9Modal .fc9-close');if(await close.count())await close.click();await page.waitForFunction(()=>!document.querySelector('#fc9Modal'))}
  async function expectModal(title){await page.waitForSelector('#fc9Modal');assert.match((await page.locator('#fc9Modal h2').innerText()).trim(),title)}
  async function expectCall(name){await page.waitForFunction(n=>(window.__auditCalls||[]).some(x=>x[0]===n),name)}

  const taskSemantics=await page.evaluate(()=>{
    const root=document.querySelector('#today .fc38-dashboard');
    if(!root)return null;
    const probe=document.createElement('div');
    probe.className='fc38-task';
    probe.innerHTML='<span class="fc38-check" aria-hidden="true"></span><span class="fc38-taskicon" aria-hidden="true">💰</span><div class="fc38-taskcopy"><strong>Probe CHF 8</strong></div><button type="button" class="fc38-go">›</button>';
    root.appendChild(probe);
    const check=probe.querySelector('.fc38-check'),icon=probe.querySelector('.fc38-taskicon');
    const a=check.getBoundingClientRect(),b=icon.getBoundingClientRect(),visual=getComputedStyle(check,'::after');
    const result={overlap:Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left))*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)),checkW:a.width,checkH:a.height,visualW:parseFloat(visual.width),visualH:parseFloat(visual.height),iconW:b.width,iconH:b.height,iconText:icon.textContent.trim()};
    probe.remove();return result;
  });
  assert.ok(taskSemantics,'today reference dashboard must exist');
  assert.equal(taskSemantics.overlap,0,'task checkbox and money icon must never overlap');
  assert.ok(taskSemantics.checkW>=42&&taskSemantics.checkH>=42,`checkbox must retain an accessible touch target: ${JSON.stringify(taskSemantics)}`);
  assert.ok(taskSemantics.visualW>=20&&taskSemantics.visualW<=24&&taskSemantics.visualH>=20&&taskSemantics.visualH<=24,`visible checkbox must stay compact and distinct from the money icon: ${JSON.stringify(taskSemantics)}`);
  assert.ok(taskSemantics.iconW>=30&&taskSemantics.iconW<=36&&taskSemantics.iconH>=30&&taskSemantics.iconH<=36,`money icon tile should remain a separate category tile: ${JSON.stringify(taskSemantics)}`);

  for(const id of ['today','tomorrow','events','homework','more'])await openScreen(id);
  await openScreen('today');

  const quick=[['event',/Neuer Termin/i],['todo',/Neues To-do/i],['hw',/Neue Schulaufgabe/i],['pend',/Neue Pendenz/i]];
  for(const [kind,title] of quick){
    await page.click('#fc9Add');await expectModal(/Was möchtest du eintragen/i);
    await page.click(`#fc9Modal [data-q="${kind}"]`);await expectModal(title);await closeModal();
  }

  await openScreen('homework');
  await page.click('[data-new-todo]');await expectModal(/Neues To-do/i);
  await page.fill('#fc9TodoTitle','UI Audit To-do');
  await page.click('#fc9Modal [data-save]');
  await page.waitForSelector('#homework [data-todo]');
  assert.ok((await page.locator('#homework').innerText()).includes('UI Audit To-do'),'saved To-do must render');
  let auditTodo=page.locator('#homework [data-todo]').filter({hasText:'UI Audit To-do'});
  await auditTodo.locator('input[type="checkbox"]').click();
  await page.waitForFunction(()=>!document.querySelector('#homework')?.innerText.includes('UI Audit To-do'));

  for(const f of ['open','today','done']){await page.click(`[data-task-filter="${f}"]`);assert.ok(await page.locator(`[data-task-filter="${f}"]`).evaluate(el=>el.classList.contains('active')),`task filter ${f} must become active`)}
  assert.ok((await page.locator('#homework').innerText()).includes('UI Audit To-do'),'completed To-do must render in Done filter');

  await page.click('[data-task-filter="open"]');
  await page.click('[data-new-hw]');await expectModal(/Neue Schulaufgabe/i);
  await page.fill('#fc9HwTitle','UI Audit Schule');
  await page.click('#fc9Modal [data-save]');
  assert.ok((await page.locator('#homework').innerText()).includes('UI Audit Schule'),'saved school task must render');

  await openScreen('events');
  await page.click('[data-cal-mode="week"]');assert.ok(await page.locator('[data-cal-mode="week"]').evaluate(el=>el.classList.contains('active')));
  const weekDay=page.locator('[data-week-date]').first();if(await weekDay.count())await weekDay.click();
  await page.click('[data-cal-mode="agenda"]');
  const filters=page.locator('[data-filter]');for(let i=0;i<Math.min(await filters.count(),3);i++){const value=await filters.nth(i).getAttribute('data-filter');await page.click(`[data-filter="${value}"]`);assert.ok(await page.locator(`[data-filter="${value}"]`).evaluate(el=>el.classList.contains('active')))}
  await page.click('[data-filter="all"]');
  const monthLabel=async()=>page.locator('.fc9-month b').innerText();const m0=await monthLabel();await page.click('[data-month="1"]');const m1=await monthLabel();assert.notEqual(m1,m0,'next month button must change month');await page.click('[data-month="-1"]');
  await page.click('[data-new-event]');await expectModal(/Neuer Termin/i);await closeModal();
  const eventRow=page.locator('#events [data-event]').first();if(await eventRow.count()){await eventRow.click();await expectCall('event')}

  await openScreen('more');
  await page.click('[data-feature="people"]');await page.waitForFunction(()=>document.querySelector('#people')?.classList.contains('active'));await page.click('#people [data-back]');
  await page.click('[data-feature="docs"]');await expectModal(/Dokumentenzentrale/i);await page.waitForSelector('#fc9Modal [data-doc="doc-audit"]');await page.click('#fc9Modal [data-doc="doc-audit"]');await expectCall('doc');await closeModal();
  for(const k of ['ai','daypdf','weekpdf','backup','export']){await page.click(`[data-feature="${k}"]`);await expectCall(k)}
  await page.click('[data-feature="push"]');await expectModal(/Erinnerungen/i);await page.click('#fc9Modal [data-save]');await expectCall('push');

  await openScreen('more');await page.click('[data-add-pend]');await expectModal(/Neue Pendenz/i);await page.fill('#fc9PendTitle','UI Audit Pendenz');await page.fill('#fc9PendAmount','12.50');await page.click('#fc9Modal [data-save]');assert.ok((await page.locator('#more').innerText()).includes('UI Audit Pendenz'));
  const pend=page.locator('#more .fc9-pend-row').filter({hasText:'UI Audit Pendenz'});await pend.locator('input[type="checkbox"]').click();
  await page.waitForFunction(()=>!document.querySelector('#more')?.innerText.includes('UI Audit Pendenz'));

  await page.evaluate(()=>window.__auditCalls=[]);await page.click('#fc9AI');await expectCall('ai');

  for(const id of ['today','tomorrow','events','homework','more']){
    await openScreen(id);
    const bad=await page.evaluate(screen=>[...document.querySelectorAll(`#${screen} button`)].filter(b=>{const r=b.getBoundingClientRect(),s=getComputedStyle(b);return s.display!=='none'&&s.visibility!=='hidden'&&!b.disabled&&(r.width<12||r.height<12)}).map(b=>({text:b.textContent.trim(),w:b.getBoundingClientRect().width,h:b.getBoundingClientRect().height})),id);
    assert.deepEqual(bad,[],`${id} has unusable button tap targets: ${JSON.stringify(bad)}`);
  }

  assert.deepEqual(pageErrors,[],`page errors: ${JSON.stringify(pageErrors)}`);
  const unexpectedConsole=consoleErrors.filter(x=>!/service worker|favicon|fc9_deferred/i.test(x));
  assert.deepEqual(unexpectedConsole,[],`console errors: ${JSON.stringify(unexpectedConsole)}`);

  console.log('V9.50 full interaction audit: ok');
  await context.close();await browser.close();
} finally {server.kill('SIGTERM')}
