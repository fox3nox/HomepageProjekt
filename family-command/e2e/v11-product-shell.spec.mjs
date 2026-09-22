import { chromium, webkit } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';

const PORT=4198,BASE=`http://127.0.0.1:${PORT}`;
const server=spawn('python3',['-m','http.server',String(PORT),'--directory','family-command'],{stdio:['ignore','pipe','pipe']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<60;i++){try{if((await fetch(BASE+'/index.html')).ok)return}catch{}await sleep(100)}throw new Error('local server not ready')}

const state={
  version:'v11-e2e',
  people:[
    {id:'oli',name:'Oli',role:'Papa',color:'#253a67',teachers:[],notes:[]},
    {id:'jayden',name:'Jayden',role:'Kind',school:'Schule',color:'#e98a2e',teachers:[{name:'Frau Muster',role:'Lehrperson'}],notes:[]},
    {id:'fynn',name:'Fynn',role:'Kind',school:'Schule',color:'#e0b72d',teachers:[],notes:[]},
    {id:'eliyah',name:'Elia',role:'Kind',school:'Kindergarten',color:'#4087dd',teachers:[],notes:[]}
  ],
  schedules:{
    jayden:{2:[{start:'08:20',end:'11:55',depart:'07:55',label:'Schule'}]},
    fynn:{2:[{start:'08:20',end:'11:55',depart:'08:00',label:'Schule'}]},
    eliyah:{2:[{start:'13:30',end:'15:30',depart:'13:10',label:'Kindergarten'}]}
  },
  reminders:[{id:'school-pack',personId:'fynn',days:[1,2,3,4,5],items:['Rucksack']}],
  events:[
    {id:'event-today',personIds:['fynn'],title:'Zahnarzt',date:'2026-09-22',time:'15:30',end:'16:00',note:'Versicherungskarte mitnehmen'},
    {id:'event-tomorrow',personIds:['jayden'],title:'Elternabend',date:'2026-09-23',time:'19:00',end:'20:00',note:''}
  ],
  todos:[
    {id:'todo-1',personId:'eliyah',title:'Kindergarten abmelden',date:'2026-09-22',section:'morning',priority:true,done:false,archived:false,createdAt:'2026-09-21T10:00:00Z'}
  ],
  homework:[
    {id:'hw-1',personId:'fynn',title:'Lesen üben',subject:'Deutsch',dueDate:'2026-09-22',done:false,note:''}
  ],
  pendencies:[],
  common:{school:{},care:[]}
};

async function isolate(page){
  await page.evaluate(s=>{
    for(const k of Object.keys(window.data||{}))delete window.data[k];
    Object.assign(window.data,structuredClone(s));
    window.todayISO=()=> '2026-09-22';
    window.save=()=>window.data;
    window.__fcV11?.render();
  },state);
}

try{
  await ready();
  mkdirSync('qa-v11',{recursive:true});
  const engine=process.env.FC_BROWSER==='webkit'?webkit:chromium;
  const browser=await engine.launch({headless:true});

  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  const page=await mobile.newPage();
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e?.stack||e)));
  await page.route('**/family-command-documents/list',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,documents:[
    {id:'doc-1',person_id:'fynn',title:'Fynn · Quartalsbrief Herbst',mime_type:'application/pdf',created_at:'2026-09-20T10:00:00Z',links:[{source_kind:'person',source_id:'fynn'}]},
    {id:'doc-2',person_id:'jayden',title:'Jayden · Elterninformation',mime_type:'image/jpeg',created_at:'2026-09-21T10:00:00Z',links:[{source_kind:'person',source_id:'jayden'}]}
  ]})}));
  await page.goto(BASE+'/?access=test',{waitUntil:'domcontentloaded',timeout:20000});
  await page.waitForFunction(()=>document.documentElement.dataset.fc11==='1'&&Boolean(window.__fcV11),{timeout:20000});
  await isolate(page);
  await page.waitForFunction(()=>document.querySelector('[data-title]')?.textContent==='Heute',{timeout:5000});

  await page.locator('.fc11-main [data-brain]').click();
  await page.waitForSelector('#fcFamilyBrain',{state:'visible',timeout:12000});
  await page.click('#fcFamilyBrain [data-close]');

  assert.equal(await page.locator('.fc11-bottom-nav [data-fc11-screen]').count(),5,'mobile navigation has five clear destinations');
  assert.equal(await page.locator('.fc11-kid').count(),3,'today shows all three child rows');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),true,'mobile must not overflow horizontally');

  const navBox=await page.locator('.fc11-bottom-nav').boundingBox();
  assert.ok(navBox && navBox.x>=0 && navBox.x+navBox.width<=390.5,'bottom navigation fits viewport');
  const addBox=await page.locator('[data-add]').first().boundingBox();
  assert.ok(addBox && addBox.x+addBox.width<=390.5,'header actions fit viewport');

  const lastToday=page.locator('.fc11-home .fc11-row').last();
  await lastToday.evaluate(el=>el.scrollIntoView({block:'center'}));
  const lastBox=await lastToday.boundingBox(),navClearance=await page.locator('.fc11-bottom-nav').boundingBox();
  assert.ok(lastBox&&navClearance&&lastBox.y+lastBox.height<=navClearance.y-4,'last today row must be fully visible above the fixed tab bar after scrolling');
  await page.screenshot({path:'qa-v11/mobile-home-390x844.png',fullPage:true});

  await page.click('.fc11-bottom-nav [data-fc11-screen="plan"]');
  assert.equal(await page.locator('[data-title]').innerText(),'Plan');
  assert.equal(await page.locator('.fc11-week-strip button').count(),7);
  await page.click('[data-plan-person="fynn"]');
  assert.equal(await page.locator('.fc11-plan-person').count(),1,'person filter narrows daily schedule');

  await page.click('.fc11-bottom-nav [data-fc11-screen="tasks"]');
  assert.equal(await page.locator('[data-title]').innerText(),'Aufgaben');
  assert.equal(await page.locator('[data-todo="todo-1"]').count(),1);
  await page.screenshot({path:'qa-v11/mobile-tasks-390x844.png',fullPage:true});
  await page.locator('[data-todo="todo-1"] .fc11-check').click();
  await page.waitForFunction(()=>window.data.todos.find(x=>x.id==='todo-1')?.done===true,{timeout:5000});

  await page.click('.fc11-bottom-nav [data-fc11-screen="docs"]');
  await page.waitForFunction(()=>document.querySelectorAll('[data-document]').length===2,{timeout:8000});
  assert.equal(await page.locator('[data-document]').count(),2);
  await page.click('[data-doc-person="fynn"]');
  assert.equal(await page.locator('[data-document]').count(),1,'document filter is person-specific');

  await page.click('[data-add]');
  await page.waitForSelector('#fc11AddSheet');
  assert.equal(await page.locator('#fc11AddSheet [data-kind]').count(),4,'quick add stays simple');
  await page.click('#fc11AddSheet [data-close]');

  await page.click('.fc11-bottom-nav [data-fc11-screen="more"]');
  await page.click('[data-person-card="fynn"]');
  await page.waitForSelector('#fc11PersonSheet');
  assert.match(await page.locator('#fc11PersonSheet').innerText(),/Fynn/);
  await page.click('#fc11PersonSheet [data-close]');

  await page.click('[data-tool="contacts"]');
  await page.waitForSelector('#fcContactsModal .fc-contacts-shell',{state:'visible'});
  assert.match(await page.locator('#fcContactsModal h2').innerText(),/Personen & Kontakte/);
  await page.click('#fcContactsModal [data-back]');

  await page.click('[data-tool="recipes"]');
  await page.waitForSelector('#fcRecipesModal .fc-recipes-shell',{state:'visible'});
  await page.click('#fcRecipesModal .fc-recipes-close');

  await page.click('[data-tool="budget"]');
  await page.waitForSelector('#fcBudgetModal .fc-budget-shell',{state:'visible'});
  await page.click('#fcBudgetModal .fc-budget-close');

  await page.evaluate(()=>{window.__v11PushCalls=0;window.enablePush=()=>{window.__v11PushCalls++}});
  await page.click('[data-tool="push"]');
  await page.waitForSelector('#fcReminderCenter',{state:'visible'});
  assert.match(await page.locator('#fcReminderCenter').innerText(),/Rucksack/);
  assert.equal(await page.evaluate(()=>window.__v11PushCalls),0,'opening reminders must not request push permission automatically');
  await page.click('#fcReminderCenter [data-close]');

  await page.screenshot({path:'qa-v11/mobile-390x844.png',fullPage:true});
  assert.deepEqual(pageErrors,[],'no uncaught browser errors on mobile');
  await mobile.close();

  const desktop=await browser.newContext({viewport:{width:1280,height:900},serviceWorkers:'block'});
  const desktopPage=await desktop.newPage();
  const desktopErrors=[];desktopPage.on('pageerror',e=>desktopErrors.push(String(e?.stack||e)));
  await desktopPage.route('**/family-command-documents/list',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,documents:[]})}));
  await desktopPage.goto(BASE+'/?access=test',{waitUntil:'domcontentloaded',timeout:20000});
  await desktopPage.waitForFunction(()=>document.documentElement.dataset.fc11==='1'&&Boolean(window.__fcV11),{timeout:20000});
  await isolate(desktopPage);

  assert.notEqual(await desktopPage.locator('.fc11-sidebar').evaluate(el=>getComputedStyle(el).display),'none','desktop sidebar is visible');
  assert.equal(await desktopPage.locator('.fc11-bottom-nav').evaluate(el=>getComputedStyle(el).display),'none','desktop hides mobile tab bar');
  assert.equal(await desktopPage.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),true,'desktop must not overflow horizontally');
  await desktopPage.screenshot({path:'qa-v11/desktop-1280x900.png',fullPage:true});
  assert.deepEqual(desktopErrors,[],'no uncaught browser errors on desktop');

  await desktop.close();
  await browser.close();
  console.log('family command v11 regression: ok');
} finally {
  server.kill('SIGTERM');
}
