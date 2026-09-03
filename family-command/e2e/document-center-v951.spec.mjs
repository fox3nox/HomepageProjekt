import { webkit } from 'playwright';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const PORT=4184,BASE=`http://127.0.0.1:${PORT}`;
const server=spawn('python3',['-m','http.server',String(PORT),'--directory','family-command'],{stdio:['ignore','pipe','pipe']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<50;i++){try{if((await fetch(BASE+'/index.html')).ok)return}catch{}await sleep(100)}throw new Error('local server not ready')}
const state={version:'docs-v951-e2e',people:[{id:'oli',name:'Oli',role:'Papa',color:'#263a67',teachers:[],notes:[]},{id:'jayden',name:'Jayden',role:'Kind',color:'#3478f6',teachers:[],notes:[]},{id:'fynn',name:'Fynn',role:'Kind',color:'#d97914',teachers:[],notes:[]},{id:'eliyah',name:'Eliyah',role:'Kind',color:'#16a477',teachers:[],notes:[]}],schedules:{},reminders:[],events:[],todos:[],homework:[],pendencies:[],common:{school:{},care:[]}};
const documents=[
  {id:'doc-multi',title:'Jayden + Fynn · Elternabend',mime_type:'application/pdf',created_at:'2026-09-03T12:00:00Z',links:[{source_kind:'person',source_id:'jayden'},{source_kind:'person',source_id:'fynn'}]},
  {id:'doc-f',person_id:'fynn',title:'Fynn · Wochenplan',mime_type:'image/jpeg',created_at:'2026-09-01T10:00:00Z',links:[{source_kind:'person',source_id:'fynn'}]},
  {id:'doc-j',person_id:'jayden',title:'Jayden · Elternbrief',mime_type:'application/pdf',created_at:'2026-08-30T10:00:00Z',links:[{source_kind:'person',source_id:'jayden'}]}
];

try{
  await ready();
  const browser=await webkit.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page=await context.newPage();
  await page.route('**/family-command-documents/list',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,documents})}));
  await page.goto(BASE+'/?access=test',{waitUntil:'domcontentloaded',timeout:20000});
  await page.waitForFunction(()=>document.documentElement.dataset.fcReady==='1'&&window.__fcSmartDocumentsHealth?.version==='1.2.0',{timeout:20000});
  await page.evaluate(s=>{for(const k of Object.keys(window.data||{}))delete window.data[k];Object.assign(window.data,structuredClone(s));window.save=()=>{}},state);
  await page.click('[data-screen="more"]');
  await page.click('[data-feature="docs"]');
  await page.waitForSelector('.fc-doc-center',{timeout:20000});

  assert.equal(await page.locator('[data-doc]').count(),3,'all documents should be visible');
  assert.match(await page.locator('[data-doc-count]').innerText(),/^3 Dokumente$/);
  assert.equal(await page.locator('[data-doc]').first().getAttribute('data-doc'),'doc-multi','newest document should be first');
  assert.match(await page.locator('[data-doc-filter="jayden"]').innerText(),/2/,'Jayden filter count');
  assert.match(await page.locator('[data-doc-filter="fynn"]').innerText(),/2/,'Fynn filter count');

  await page.click('[data-doc-filter="fynn"]');
  assert.equal(await page.locator('[data-doc]').count(),2,'Fynn filter should include multi-person documents');
  await page.click('[data-doc-filter="all"]');
  await page.fill('[data-doc-search]','Elternbrief');
  assert.equal(await page.locator('[data-doc]').count(),1,'search should narrow documents');
  assert.match(await page.locator('[data-doc]').innerText(),/Jayden · Elternbrief/);
  await page.click('[data-doc-search-clear]');
  assert.equal(await page.locator('[data-doc]').count(),3,'clear search should restore documents');

  await page.click('[data-doc-select-all]');
  assert.equal(await page.locator('[data-doc-person]:checked').count(),4,'all people shortcut should select everyone');
  assert.equal(await page.locator('.fc-doc-person.selected').count(),4,'selected person chips should be visually active');
  assert.match(await page.locator('[data-doc-auto-mode]').innerText(),/Manuelle Zuordnung aktiv/);
  await page.click('[data-doc-select-none]');
  assert.equal(await page.locator('[data-doc-person]:checked').count(),0,'automatic shortcut should clear manual override');
  assert.match(await page.locator('[data-doc-auto-mode]').innerText(),/Automatische Zuordnung aktiv/);

  await page.setInputFiles('[data-doc-file]',{name:'schule-info.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4')});
  assert.match(await page.locator('[data-doc-file-name]').innerText(),/schule-info\.pdf/);
  assert.equal(await page.locator('.fc-doc-file-picker.has-file').count(),1,'selected file should have a visible state');

  await page.evaluate(()=>{window.fcOpenOriginal=id=>{window.__v951Opened=id}});
  await page.click('[data-doc="doc-multi"]');
  assert.equal(await page.evaluate(()=>window.__v951Opened),'doc-multi','document row should open the native viewer hook');

  const geometry=await page.evaluate(()=>{
    const modal=document.querySelector('.fc-doc-center'),sheet=document.querySelector('.fc-doc-center .fc9-sheet'),item=document.querySelector('.fc-doc-item');
    const mr=modal.getBoundingClientRect(),sr=sheet.getBoundingClientRect(),ir=item.getBoundingClientRect();
    return {sheetLeft:sr.left,sheetRight:sr.right,sheetTop:sr.top,sheetBottom:sr.bottom,viewportW:innerWidth,viewportH:innerHeight,itemHeight:ir.height,bodyScrollW:document.documentElement.scrollWidth,modalWidth:mr.width};
  });
  assert.ok(geometry.sheetLeft>=0&&geometry.sheetRight<=geometry.viewportW+1,'document sheet must fit iPhone width');
  assert.ok(geometry.sheetTop>=0&&geometry.sheetBottom<=geometry.viewportH+1,'document sheet must fit iPhone height');
  assert.ok(geometry.itemHeight>=60,'document rows must remain comfortably tappable');
  assert.ok(geometry.bodyScrollW<=geometry.viewportW+1,'document center must not cause horizontal page overflow');

  const health=await page.evaluate(()=>window.__fcSmartDocumentsHealth);
  assert.equal(health.search,true);
  assert.equal(health.filterCounts,true);
  assert.equal(health.newestFirst,true);
  assert.equal(health.semanticNaming,true);
  await browser.close();
  console.log('V9.51 document center regression: ok');
} finally {server.kill('SIGTERM')}
