import { webkit } from 'playwright';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const PORT=4183,BASE=`http://127.0.0.1:${PORT}`;
const server=spawn('python3',['-m','http.server',String(PORT),'--directory','family-command'],{stdio:['ignore','pipe','pipe']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<40;i++){try{const r=await fetch(BASE+'/index.html');if(r.ok)return}catch{}await sleep(100)}throw new Error('local server not ready')}
const state={version:'smart-doc-e2e',people:[{id:'oli',name:'Oli',role:'Papa',color:'#263a67',teachers:[],notes:[]},{id:'jayden',name:'Jayden',role:'Kind',color:'#3478f6',teachers:[],notes:[]},{id:'fynn',name:'Fynn',role:'Kind',color:'#d97914',teachers:[],notes:[]},{id:'eliyah',name:'Eliyah',role:'Kind',color:'#16a477',teachers:[],notes:[]}],schedules:{},reminders:[],events:[{id:'existing-phone',personIds:['fynn'],title:'Telefongespräch',date:'2026-09-08',time:'10:00',end:'',note:''}],todos:[],homework:[],pendencies:[],common:{school:{},care:[]}};
let uploaded=false;
try{
 await ready();
 const browser=await webkit.launch({headless:true});
 const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
 const page=await context.newPage();
 await page.route('**/family-command-documents/list',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,documents:[{id:'doc-j',person_id:'jayden',title:'Jayden · Elternbrief',mime_type:'application/pdf',created_at:'2026-08-30T10:00:00Z',links:[{source_kind:'person',source_id:'jayden'}]},{id:'doc-f',person_id:'fynn',title:'Fynn · Wochenplan',mime_type:'image/jpeg',created_at:'2026-08-31T10:00:00Z',links:[{source_kind:'person',source_id:'fynn'}]},...(uploaded?[{id:'doc-new',person_id:'fynn',title:'Fynn · Wochenblatt',mime_type:'image/png',created_at:'2026-08-31T19:00:00Z',links:[{source_kind:'person',source_id:'fynn'}]}]:[])]})}));
 await page.route('**/family-command-ai-budgeted/document',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,parsed:{summary:'Wochenblatt Schule',items:[{type:'event',personId:'fynn',title:'Telefongespräch',subject:'',date:'2026-09-08',time:'10:00',endDate:'',end:'',note:'',reminderLead:30,confidence:.99},{type:'homework',personId:'fynn',title:'2er- und 4er-Reihe aufsagen',subject:'Math',date:'2026-09-04',time:'',endDate:'',end:'',note:'Freiwillig',reminderLead:-1,confidence:.98},{type:'event',personId:'jayden',title:'Manuell korrigierter Termin',subject:'',date:'2026-09-12',time:'09:00',endDate:'',end:'',note:'',reminderLead:30,confidence:.99},{type:'event',personId:'jayden',title:'Unsicherer Termin',subject:'',date:'2026-09-11',time:'',endDate:'',end:'',note:'',reminderLead:30,confidence:.5}]}})}));
 await page.route('**/family-command-documents/upload',async route=>{uploaded=true;await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,document:{id:'doc-new',person_id:'fynn',title:'Fynn · Wochenblatt',mime_type:'image/png',created_at:'2026-08-31T19:00:00Z',links:[{source_kind:'person',source_id:'fynn'}]}})})});
 await page.route('**/family-command-documents/link',async route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true})}));
 await page.goto(BASE+'/?access=test',{waitUntil:'domcontentloaded',timeout:20000});
 await page.waitForFunction(()=>document.documentElement.dataset.fcReady==='1'&&window.__fcSmartDocumentsHealth?.aiAutoAssign===true,{timeout:20000});
 // Seed after boot: other E2E/bootstrap fixtures may legitimately rewrite localStorage during startup.
 // The smart-documents regression must start from one deterministic in-memory state.
 await page.evaluate(s=>{for(const k of Object.keys(window.data||{}))delete window.data[k];Object.assign(window.data,structuredClone(s));localStorage.setItem('family-command-personal-v4',JSON.stringify(window.data));window.save?.();},state);
 await page.click('[data-screen="more"]');
 await page.click('[data-feature="docs"]');
 await page.waitForSelector('text=Dokumentenzentrale',{timeout:20000});
 assert.equal(await page.locator('[data-doc]').count(),2,'all filter must show both documents');
 await page.click('[data-doc-filter="fynn"]');
 assert.equal(await page.locator('[data-doc]').count(),1,'Fynn filter must only show Fynn documents');
 assert.match(await page.locator('[data-doc]').innerText(),/Fynn/);
 await page.check('[data-doc-person][value="fynn"]');
 await page.setInputFiles('[data-doc-file]',{name:'wochenblatt.png',mimeType:'image/png',buffer:Buffer.from('89504e470d0a1a0a','hex')});
 await page.click('[data-doc-upload]');
 await page.waitForFunction(()=>document.querySelector('[data-doc-status]')?.textContent.includes('Gespeichert'),{timeout:20000});
 await page.waitForFunction(()=>window.data?.homework?.some(h=>h.title==='2er- und 4er-Reihe aufsagen'&&h.personId==='fynn')&&window.data?.events?.some(e=>e.title==='Manuell korrigierter Termin'&&Array.isArray(e.personIds)&&e.personIds.length===1&&e.personIds[0]==='fynn'),{timeout:20000});
 const result=await page.evaluate(()=>({events:window.data.events,homework:window.data.homework,health:window.__fcSmartDocumentsHealth}));
 assert.equal(result.events.filter(e=>e.title==='Telefongespräch'&&e.date==='2026-09-08').length,1,'existing event must not be duplicated');
 assert.equal(result.homework.filter(h=>h.title==='2er- und 4er-Reihe aufsagen'&&h.personId==='fynn').length,1,'high-confidence homework must be created for manual assignment');
 const corrected=result.events.find(e=>e.title==='Manuell korrigierter Termin');
 assert.deepEqual(corrected?.personIds,['fynn'],'manual Fynn selection must override AI Jayden assignment');
 assert.equal(result.events.some(e=>e.title==='Unsicherer Termin'),false,'low-confidence extraction must not be auto-created');
 assert.equal(result.health.confidenceThreshold,.85);
 assert.equal(result.health.manualOverride,true);
 await browser.close();
 console.log('smart documents regression: ok');
} finally {server.kill('SIGTERM')}
