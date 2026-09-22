import { webkit, chromium } from 'playwright';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';

const PORT=4191,BASE=`http://127.0.0.1:${PORT}`;
const server=spawn('python3',['-m','http.server',String(PORT),'--directory','family-command'],{stdio:['ignore','pipe','pipe']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<50;i++){try{if((await fetch(BASE+'/index.html')).ok)return}catch{}await sleep(100)}throw new Error('local server not ready')}

const state={
  version:'family-brain-v101',
  people:[
    {id:'oli',name:'Oli',role:'Papa',color:'#263a67',teachers:[],notes:[]},
    {id:'fynn',name:'Fynn',role:'Kind',color:'#d97914',teachers:[],notes:[]}
  ],
  schedules:{},reminders:[],
  events:[
    {id:'e-next',personIds:['fynn'],title:'Zahnarzt',date:'2026-09-29',time:'10:15',end:'',note:''},
    {id:'e-later',personIds:['fynn'],title:'Späterer Termin',date:'2026-10-15',time:'09:00',end:'',note:''}
  ],
  todos:[{id:'t-next',personId:'fynn',title:'Turnzeug einpacken',date:'2026-09-30',done:false,archived:false,note:''}],
  homework:[],pendencies:[],common:{school:{},care:[]}
};

try{
  await ready();
  const engine=process.env.FC_BROWSER==='chromium'?chromium:webkit;
  const browser=await engine.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page=await context.newPage();

  await page.route('**/family-command-documents/list',route=>route.fulfill({
    status:200,contentType:'application/json',
    body:JSON.stringify({ok:true,documents:[{
      id:'doc-autumn',person_id:'fynn',personIds:['fynn'],title:'Fynn · Quartalsbrief Herbst',
      mime_type:'application/pdf',created_at:'2026-09-01T10:00:00Z',
      summary:'Herbstbummel und wichtige Termine der Klasse',
      description:'Am Herbstbummel Regenjacke und Rucksack mitnehmen.',
      links:[{source_kind:'person',source_id:'fynn'}]
    }]})
  }));

  await page.goto(BASE+'/?access=test',{waitUntil:'domcontentloaded',timeout:20000});
  await page.waitForFunction(()=>document.documentElement.dataset.fcReady==='1',{timeout:20000});
  await page.evaluate(s=>{
    for(const k of Object.keys(window.data||{}))delete window.data[k];
    Object.assign(window.data,structuredClone(s));
    window.todayISO=()=> '2026-09-22';
  },state);
  await page.evaluate(()=>window.__fcLoadExtrasNow());
  await page.waitForFunction(()=>Boolean(window.__fcFamilyBrain),{timeout:20000});

  const next=await page.evaluate(async()=>{const r=await window.__fcFamilyBrain.answer('Welche Termine und Aufgaben hat Fynn nächste Woche?');return{answer:r.answer,context:{range:r.context.range,personIds:r.context.personIds},sources:(r.sources||[]).map(({kind,id,label})=>({kind,id,label}))}});
  assert.match(next.answer,/Zahnarzt/);
  assert.match(next.answer,/Turnzeug einpacken/);
  assert.doesNotMatch(next.answer,/Späterer Termin/);
  assert.equal(next.context.range.start,'2026-09-28');
  assert.equal(next.context.range.end,'2026-10-04');
  assert.equal(next.context.personIds.length,1);
  assert.equal(next.context.personIds[0],'fynn');

  const docs=await page.evaluate(async()=>{const r=await window.__fcFamilyBrain.answer('Wo steht etwas zum Herbstbummel?');return{answer:r.answer,sources:(r.sources||[]).map(({kind,id,label})=>({kind,id,label}))}});
  assert.match(docs.answer,/Quartalsbrief Herbst/);
  assert.equal(docs.sources.some(x=>x.kind==='document'&&x.id==='doc-autumn'),true);

  const unknown=await page.evaluate(async()=>{const r=await window.__fcFamilyBrain.answer('Wann fliegen wir nach Tokio?');return{answer:r.answer}});
  assert.match(unknown.answer,/nichts Eindeutiges|rate nicht/i);
  assert.equal(await page.evaluate(()=>window.__fcFamilyBrain.health().readOnly),true);

  await browser.close();
  console.log('family brain v10.1 regression: ok');
} finally {server.kill('SIGTERM')}
