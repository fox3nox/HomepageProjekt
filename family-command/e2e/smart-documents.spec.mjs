import { webkit } from 'playwright';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const PORT=4183,BASE=`http://127.0.0.1:${PORT}`;
const server=spawn('python3',['-m','http.server',String(PORT),'--directory','family-command'],{stdio:['ignore','pipe','pipe']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<50;i++){try{if((await fetch(BASE+'/index.html')).ok)return}catch{}await sleep(100)}throw new Error('local server not ready')}
const state={version:'smart-doc-e2e',people:[{id:'oli',name:'Oli',role:'Papa',color:'#263a67',teachers:[],notes:[]},{id:'jayden',name:'Jayden',role:'Kind',color:'#3478f6',teachers:[],notes:[]},{id:'fynn',name:'Fynn',role:'Kind',color:'#d97914',teachers:[],notes:[]},{id:'eliyah',name:'Eliyah',role:'Kind',color:'#16a477',teachers:[],notes:[]}],schedules:{},reminders:[],events:[{id:'existing-phone',personIds:['fynn'],title:'Telefongespräch',date:'2026-09-08',time:'10:00',end:'',note:''}],todos:[],homework:[],pendencies:[],common:{school:{},care:[]}};
const aiPayload={ok:true,parsed:{summary:'Wochenblatt Schule',items:[{type:'event',personId:'fynn',title:'Telefongespräch',date:'2026-09-08',time:'10:00',endDate:'',end:'',note:'',reminderLead:30,confidence:.99},{type:'homework',personId:'fynn',title:'2er- und 4er-Reihe aufsagen',subject:'Math',date:'2026-09-04',time:'',endDate:'',end:'',note:'Freiwillig',reminderLead:-1,confidence:.98},{type:'event',personId:'jayden',title:'Manuell korrigierter Termin',date:'2026-09-12',time:'09:00',endDate:'',end:'',note:'',reminderLead:30,confidence:.99},{type:'event',personId:'jayden',title:'Unsicherer Termin',date:'2026-09-11',time:'',endDate:'',end:'',note:'',reminderLead:30,confidence:.5}]}};
let uploaded=false;
try{
  await ready();
  const browser=await webkit.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page=await context.newPage();
  const browserConsole=[];
  page.on('console',msg=>browserConsole.push(`${msg.type()}: ${msg.text()}`));
  page.on('pageerror',error=>browserConsole.push(`pageerror: ${error?.stack||error}`));

  await page.addInitScript(payload=>{
    const baseFetch=window.fetch.bind(window);
    window.__smartDocAiCalls=0;
    window.fetch=async(input,init)=>{
      const url=String(input?.url||input||'');
      if(url.includes('/family-command-ai-budgeted/document')){
        window.__smartDocAiCalls++;
        return new Response(JSON.stringify(payload),{status:200,headers:{'content-type':'application/json'}});
      }
      return baseFetch(input,init);
    };
  },aiPayload);

  await page.route('**/family-command-documents/list',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,documents:[{id:'doc-j',person_id:'jayden',title:'Jayden · Elternbrief',mime_type:'application/pdf',created_at:'2026-08-30T10:00:00Z',links:[{source_kind:'person',source_id:'jayden'}]},{id:'doc-f',person_id:'fynn',title:'Fynn · Wochenplan',mime_type:'image/jpeg',created_at:'2026-08-31T10:00:00Z',links:[{source_kind:'person',source_id:'fynn'}]},...(uploaded?[{id:'doc-new',person_id:'fynn',title:'Fynn · Wochenblatt',mime_type:'image/png',created_at:'2026-08-31T19:00:00Z',links:[{source_kind:'person',source_id:'fynn'}]}]:[])]})}));
  await page.route('**/family-command-documents/upload',async route=>{uploaded=true;await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,document:{id:'doc-new',person_id:'fynn',title:'Fynn · Wochenblatt',mime_type:'image/png',created_at:'2026-08-31T19:00:00Z',links:[{source_kind:'person',source_id:'fynn'}]}})})});
  await page.route('**/family-command-documents/link',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true})}));
  await page.goto(BASE+'/?access=test',{waitUntil:'domcontentloaded',timeout:20000});
  await page.waitForFunction(()=>document.documentElement.dataset.fcReady==='1'&&window.__fcSmartDocumentsHealth?.aiAutoAssign===true,{timeout:20000});

  await page.evaluate(()=>window.__fcLoadExtrasNow());
  await page.waitForFunction(()=>document.documentElement.dataset.fcExtras==='ready'&&Boolean(window.__fcAiBudgetGuard),{timeout:20000});

  const isolate=async()=>page.evaluate(s=>{
    for(const k of Object.keys(window.data||{}))delete window.data[k];
    Object.assign(window.data,structuredClone(s));
    window.save=()=>localStorage.setItem('family-command-personal-v4',JSON.stringify(window.data));
    window.save();
  },state);

  await isolate();
  await page.click('[data-screen="more"]');
  await page.click('[data-feature="docs"]');
  await page.waitForSelector('text=Dokumentenzentrale',{timeout:20000});

  // Opening the document center starts an async list request. Wait for the mocked list itself
  // instead of relying on a fixed sleep; adding unrelated critical modules must not make this flaky.
  await isolate();
  await page.waitForFunction(()=>document.querySelectorAll('[data-doc]').length===2,{timeout:20000});

  assert.equal(await page.locator('[data-doc]').count(),2,'all filter must show both documents');
  await page.click('[data-doc-filter="fynn"]');
  await page.waitForFunction(()=>document.querySelectorAll('[data-doc]').length===1,{timeout:5000});
  assert.equal(await page.locator('[data-doc]').count(),1,'Fynn filter must only show Fynn documents');
  assert.match(await page.locator('[data-doc]').innerText(),/Fynn/);
  await page.check('[data-doc-person][value="fynn"]');
  await page.setInputFiles('[data-doc-file]',{name:'wochenblatt.png',mimeType:'image/png',buffer:Buffer.from('89504e470d0a1a0a','hex')});
  await page.click('[data-doc-upload]');
  await page.waitForFunction(()=>document.querySelector('[data-doc-status]')?.textContent.includes('Gespeichert'),{timeout:20000});
  const aiCalls=await page.evaluate(()=>window.__smartDocAiCalls);
  if(aiCalls!==1){
    const prediag=await page.evaluate(()=>{const i=document.querySelector('[data-doc-file]'),f=i?.files?.[0];return{status:document.querySelector('[data-doc-status]')?.textContent||'',selected:[...document.querySelectorAll('[data-doc-person]:checked')].map(x=>x.value),file:f?{name:f.name,type:f.type,size:f.size,ctor:f.constructor?.name}:null,fetchWrapped:typeof window.fetch==='function',aiCalls:window.__smartDocAiCalls||0}});
    console.error('smart documents AI pre-assert diagnostic:',JSON.stringify(prediag,null,2));
  }
  assert.equal(aiCalls,1,'upload must call the approved AI route exactly once');
  await page.waitForFunction(()=>window.data.homework.some(h=>h.title.includes('2er- und 4er'))&&window.data.events.some(e=>e.title==='Manuell korrigierter Termin'),{timeout:30000});
  assert.equal(window.__fcSmartDocumentsHealth?.version,'1.1.0');
  const post=await page.evaluate(()=>({events:window.data.events,homework:window.data.homework,health:window.__fcSmartDocumentsHealth,console:[]}));
  assert.equal(post.events.filter(e=>e.title==='Telefongespräch').length,1,'dedupe must retain only one matching event');
  assert.equal(post.events.some(e=>e.title==='Unsicherer Termin'),false,'low-confidence AI item must not be applied automatically');
  assert.equal(post.events.some(e=>e.title==='Manuell korrigierter Termin'&&(e.personIds||[]).includes('jayden')),true,'manual person assignment must override AI person');
  assert.equal(post.homework.some(h=>h.title.includes('2er- und 4er')&&h.personId==='fynn'),true,'AI homework must be linked to Fynn');
  assert.equal(post.health.filters,true);
  assert.equal(post.health.directUpload,true);
  assert.equal(post.health.multiPerson,true);
  assert.equal(post.health.aiAutoAssign,true);
  assert.equal(post.health.manualOverride,true);
  assert.equal(post.health.autoLink,true);
  assert.equal(post.health.dedupe,true);
  assert.equal(post.health.confidenceThreshold,.85);
  assert.equal(post.health.preservesOriginal,true);

  const bad=browserConsole.filter(x=>/pageerror|TypeError|ReferenceError|SyntaxError|family_command_v9_boot/i.test(x));
  assert.deepEqual(bad,[],`browser errors: ${bad.join('\n')}`);
  await context.close();await browser.close();
  console.log('smart documents regression: ok');
}finally{server.kill('SIGTERM')}
