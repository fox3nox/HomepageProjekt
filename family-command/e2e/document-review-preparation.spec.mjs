import { webkit, chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, readFileSync, mkdirSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import assert from 'node:assert/strict';

const root=resolve('family-command'),engineName=process.env.FC_BROWSER||'webkit';
const server=createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  const file=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+sep)){res.writeHead(403).end();return;}
  readFile(file,(error,bytes)=>{if(error){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'})[extname(file)]||'application/octet-stream');res.end(bytes);});
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await ({webkit,chromium}[engineName]).launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,timezoneId:'Europe/Zurich',serviceWorkers:'block',reducedMotion:'reduce'});
await context.addInitScript({content:readFileSync('family-command/e2e/mock-private-core.js','utf8')});
const note='Besammlung: 08:20 Uhr am Eingang. Mitnehmen: wetterfeste Kleidung, gute Schuhe, kleines Znüni und Mittagessen (Picknick). Rückkehr: 13:30 Uhr.';
const proposal={type:'event',title:'Ausflug',personId:'child-c',date:'2027-05-07',time:'08:20',end:'13:30',confidence:.99,note};
await context.addInitScript(payload=>{
  const original=window.fetch.bind(window);
  const t=window.__documentTest={items:[payload,{...payload,title:'Unsicherer Vorschlag',confidence:.2},{...payload,title:'Ungültiges Datum',date:'2027-02-30'},{...payload,title:'Unbekannte Person',personId:'unknown'}],documents:[],uploads:0,linkCalls:0,analysis:0,linkFailures:1,offlineAI:false,originalBytes:[]};
  const reply=(body,status=200)=>new Response(JSON.stringify(body),{status,headers:{'content-type':'application/json'}});
  window.fetch=async(input,init={})=>{
    const url=String(input?.url||input||'');
    if(url.includes('/family-command-ai-budgeted/document')){t.analysis++;t.context=init.body.get('context');return t.offlineAI?reply({error:'Offline'},503):reply({ok:true,parsed:{summary:'Unbestätigte KI-Zusammenfassung',items:t.items}});}
    if(url.includes('/family-command-documents/upload')){
      const file=init.body.get('file');t.uploads++;t.originalBytes=Array.from(new Uint8Array(await file.arrayBuffer()));
      const doc={id:'review-doc-'+t.uploads,title:init.body.get('title'),person_id:init.body.get('personId')||null,mime_type:file.type,created_at:'2027-05-06T06:00:00Z',links:JSON.parse(init.body.get('links')).map(x=>({source_kind:x.sourceKind,source_id:x.sourceId}))};
      t.documents.push(doc);return reply({ok:true,document:doc});
    }
    if(url.includes('/family-command-documents/link')){
      t.linkCalls++;if(t.linkFailures-->0)return reply({error:'Temporary link error'},503);
      const body=JSON.parse(init.body),doc=t.documents.find(x=>x.id===body.id);
      for(const link of body.links||[]){if(!doc.links.some(x=>x.source_kind===link.sourceKind&&x.source_id===link.sourceId))doc.links.push({source_kind:link.sourceKind,source_id:link.sourceId});}
      return reply({ok:true});
    }
    if(url.includes('/family-command-documents/list'))return reply({ok:true,documents:t.documents});
    // Never send synthetic data or test credentials to a real backend.
    if(url.includes('.supabase.co/'))return reply({ok:false,error:'Unmocked test endpoint'},401);
    return original(input,init);
  };
},proposal);
const page=await context.newPage(),errors=[];page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
const image=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aN1cAAAAASUVORK5CYII=','base64');
const file={name:'Ausflugbrief.png',mimeType:'image/png',buffer:image};
mkdirSync('qa-document-preparation',{recursive:true});
async function screenshot(name){await page.screenshot({path:`qa-document-preparation/${engineName}-${name}.png`,fullPage:false});}
async function openDocs(){await page.evaluate(()=>fcOpenSmartDocuments());await page.waitForSelector('.fc-doc-center [data-doc-upload]');}
async function analyzeFile(){await page.setInputFiles('[data-doc-file]',file);await page.click('[data-doc-upload]');await page.waitForSelector('[data-doc-review]');}
async function saveSelected(){await page.check('[data-doc-proposal="0"]');await page.click('[data-doc-confirm]');await page.waitForFunction(()=>document.querySelector('[data-doc-status]')?.textContent.includes('✓ Gespeichert'));}
async function closeDocs(){await page.locator('.fc-doc-center .fc9-close').click();await page.waitForSelector('.fc-doc-center',{state:'detached'});}
try{
  await page.clock.setFixedTime(new Date('2027-05-06T07:00:00+02:00'));
  await page.goto(`http://127.0.0.1:${server.address().port}/?access=test`);
  await page.waitForFunction(()=>window.__fcTomorrowCalendarV9674&&window.__fcSmartDocumentsHealth?.reviewRequired&&window.__fcReferenceDashboard39&&window.__fcSearch);
  await page.evaluate(()=>window.__fcLoadExtrasNow());
  await page.waitForFunction(()=>document.documentElement.dataset.fcExtras==='ready'&&Boolean(window.__fcAiBudgetGuard));
  await page.evaluate(()=>{window.__testDate='2027-05-06';window.todayISO=()=>window.__testDate;data.events=[];data.homework=[];data.todos=[];data.schedules={};data.reminders=[];window.__testSaves=0;window.save=()=>{window.__testSaves++;};__fcV9.invalidate();renderToday();});
  await openDocs();const before=await page.evaluate(()=>JSON.stringify(data));await analyzeFile();
  assert.equal(await page.evaluate(()=>JSON.stringify(data)),before,'analysis/review must not change any family data');
  assert.equal(await page.evaluate(()=>__documentTest.uploads),0,'no archive write before confirmation');
  assert.equal(await page.locator('[data-doc-proposal]:checked').count(),0);
  assert.equal(await page.locator('[data-doc-confirm]').isDisabled(),true);
  assert.equal(await page.locator('[data-doc-proposal="2"]').isDisabled(),true,'impossible date is blocked even at high confidence');
  assert.equal(await page.locator('[data-doc-proposal="3"]').isDisabled(),true,'unknown person is blocked');
  assert.equal(await page.locator('[data-doc-proposal="1"]').isDisabled(),false,'uncertainty can only be accepted explicitly');
  assert.match(await page.locator('[data-doc-review]').innerText(),/Kind C/);
  assert.match(await page.evaluate(()=>__documentTest.context),/child-c/);
  await screenshot('review');
  await page.check('[data-doc-proposal="0"]');await page.click('[data-doc-confirm]');
  await page.waitForFunction(()=>document.querySelector('[data-doc-status]')?.textContent.includes('Original bereits gespeichert'));
  assert.equal(await page.evaluate(()=>__documentTest.uploads),1);assert.equal(await page.evaluate(()=>data.events.length),1);
  const eventId=await page.evaluate(()=>data.events[0].id);
  await page.click('[data-doc-confirm]');
  await page.waitForFunction(()=>document.querySelector('[data-doc-status]')?.textContent.includes('✓ Gespeichert'));
  const saved=await page.evaluate(()=>({event:data.events[0],count:data.events.length,uploads:__documentTest.uploads,links:__documentTest.documents[0].links,bytes:__documentTest.originalBytes}));
  assert.equal(saved.count,1);assert.equal(saved.uploads,1,'known stored originals are not uploaded again after a failed link');
  assert.equal(saved.event.note,note);assert.deepEqual(saved.event.personIds,['child-c']);assert.deepEqual(saved.bytes,[...image]);
  assert.ok(saved.links.some(x=>x.source_kind==='event'&&x.source_id===eventId));
  assert.ok(saved.links.some(x=>x.source_kind==='person'&&x.source_id==='child-c'));
  // The saved status precedes the separate, asynchronous library refresh.
  await page.locator('[data-doc="review-doc-1"]').waitFor();
  assert.equal(await page.locator('[data-doc="review-doc-1"]').count(),1);
  console.log('PASS explicit review, original preservation, assignment, validation and retry');
  await closeDocs();
  await page.locator('.fc9-nav [data-screen="today"]').click();
  await page.waitForSelector('.fc38-tomorrow');assert.match(await page.locator('.fc38-tomorrow').innerText(),/Mittagessen \(Picknick\)/);
  await page.locator('.fc38-tomorrow .fc38-section-head').click();
  const tomorrow=page.locator(`#tomorrow [data-preparation-event="${eventId}"]`);
  await tomorrow.waitFor();assert.equal(await tomorrow.count(),1);assert.match(await tomorrow.innerText(),/Mittagessen \(Picknick\)/);
  for(let i=0;i<3;i++)await page.evaluate(()=>renderTomorrow());
  assert.equal(await tomorrow.count(),1,'rerenders must not duplicate packing hints');
  await screenshot('tomorrow');
  await page.evaluate(()=>__fcTomorrowCalendarV9674.openCalendarDate('2027-05-07'));
  const calendar=page.locator(`#events [data-event="${eventId}"]`);await calendar.waitFor();
  assert.match(await calendar.innerText(),/08:20–13:30/);assert.match(await calendar.innerText(),/kleines Znüni/);
  await calendar.click();await page.waitForSelector('#fcEventDetails');
  assert.match(await page.locator('.fc-detail-note').innerText(),/Besammlung: 08:20/);
  await page.locator('#fcEventDetails [data-doc="review-doc-1"]').waitFor();
  assert.equal(await page.locator('#fcEventDetails [data-doc="review-doc-1"]').count(),1);
  await page.locator('.fc-detail-close').click();
  await page.locator('.fc-search-entry').click();await page.getByRole('searchbox',{name:'Suchbegriff',exact:true}).fill('Ausflug');
  await page.waitForFunction(()=>__fcSearch.search('Ausflug').some(x=>x.group==='Dokumente'));
  const groups=await page.evaluate(()=>__fcSearch.search('Ausflug').map(x=>x.group));assert.ok(groups.includes('Termine'));assert.ok(groups.includes('Dokumente'));
  await page.getByRole('button',{name:'Suche schliessen'}).click();
  await page.locator('.fc9-nav [data-screen="today"]').click();
  assert.equal(await page.locator('#today .fc38-switch').count(),0,'Today stays focused; detailed date browsing belongs in Calendar');
  console.log('PASS tomorrow without school slots, coming days, calendar, search and original link');
  await page.clock.setFixedTime(new Date('2027-05-07T07:00:00+02:00'));
  await page.evaluate(()=>{__testDate='2027-05-07';data.schedules={'child-c':{5:[{start:'08:20',end:'11:50',label:'Kindergarten',note:'Leuchtweste mitnehmen'}]}};data.reminders=[{id:'school-pack',personId:'child-c',days:[5],items:['Trinkflasche']}];__fcV9.invalidate();renderToday();});
  for(const width of [390,1440]){
    await page.setViewportSize({width,height:width>1000?1000:844});await page.evaluate(()=>__fcReferenceDashboard39.rebuild(true));
    const child=page.locator('.fc38-child[data-focus-child="child-c"]'),packing=child.locator('[data-preparation-event]');await packing.waitFor();
    assert.equal(await packing.count(),1);assert.match(await packing.innerText(),/Ausflug · 08:20–13:30/);
    const geometry=await child.evaluate(el=>{const prep=el.querySelector('[data-preparation-event]').getBoundingClientRect();return{overflow:document.documentElement.scrollWidth>innerWidth+1,font:parseFloat(getComputedStyle(el.querySelector('[data-preparation-event]')).fontSize),overlap:[...el.querySelectorAll('b,strong,small')].filter(x=>x!==el.querySelector('[data-preparation-event]')).some(x=>{const r=x.getBoundingClientRect();return r.width>0&&r.height>0&&Math.min(r.right,prep.right)>Math.max(r.left,prep.left)+1&&Math.min(r.bottom,prep.bottom)>Math.max(r.top,prep.top)+1;})}});
    assert.equal(geometry.overflow,false);assert.equal(geometry.overlap,false);assert.ok(geometry.font>=12);
    await screenshot('today-'+width);
  }
  await page.evaluate(()=>{__testDate='2027-05-08';__fcV9.invalidate();renderToday();});
  assert.equal(await page.locator('.fc38-dashboard .fc38-event-preparation').count(),0,'no stale packing hint on the next day');
  console.log('PASS correct day and responsive non-overlapping packing hints');
  await page.setViewportSize({width:390,height:844});
  await page.evaluate(p=>{__testDate='2027-05-06';data.events[0].time='08:10';data.events[0].note='Manuell geprüfte Angaben';__documentTest.items=[p];},proposal);
  await openDocs();await analyzeFile();assert.match(await page.locator('[data-doc-review]').innerText(),/Vorhandenen Termin verknüpfen.*08:10/s);
  await saveSelected();assert.equal(await page.evaluate(()=>data.events.length),1);assert.equal(await page.evaluate(()=>data.events[0].time),'08:10');assert.equal(await page.evaluate(()=>data.events[0].note),'Manuell geprüfte Angaben');await closeDocs();
  await openDocs();await analyzeFile();await page.fill('[data-doc-title]','Manuell benannter Brief');await page.check('[data-doc-person][value="child-b"]');
  assert.equal(await page.locator('[data-doc-title]').inputValue(),'Manuell benannter Brief');assert.equal(await page.locator('[data-doc-proposal]:checked').count(),0);
  await saveSelected();assert.equal(await page.evaluate(()=>data.events.length),2);assert.deepEqual(await page.evaluate(()=>data.events[1].personIds),['child-b']);await closeDocs();
  console.log('PASS preserve manual corrections and keep different children separate');
  await page.evaluate(()=>{__documentTest.offlineAI=true;});await openDocs();await analyzeFile();
  const archiveBefore=await page.evaluate(()=>JSON.stringify(data));await page.click('[data-doc-archive]');await page.waitForFunction(()=>document.querySelector('[data-doc-status]')?.textContent.includes('✓ Gespeichert'));
  assert.equal(await page.evaluate(()=>JSON.stringify(data)),archiveBefore,'archive-only cannot create inferred data');await closeDocs();
  await page.evaluate(()=>{__documentTest.offlineAI=false;});await openDocs();await analyzeFile();const uploads=await page.evaluate(()=>__documentTest.uploads);await page.click('[data-doc-cancel]');assert.equal(await page.evaluate(()=>__documentTest.uploads),uploads);await closeDocs();
  assert.deepEqual(errors,[]);assert.deepEqual(await page.evaluate(()=>__fcV9.health().dup),[]);
  console.log('PASS AI failure fallback, cancellation and no JavaScript/duplicate-ID regressions');
}catch(error){await screenshot('failure').catch(()=>{});throw error;}finally{await browser.close();await new Promise(r=>server.close(r));}
console.log(engineName+' document review and preparation regression: ok');
