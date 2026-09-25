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
    oli:{
      2:[{start:'07:30',end:'12:00',depart:'07:00',label:'Arbeit LANDI'},{start:'13:00',end:'17:00',depart:'',label:'Arbeit LANDI'}],
      3:[{start:'07:30',end:'12:00',depart:'07:00',label:'Arbeit LANDI'},{start:'13:00',end:'17:00',depart:'',label:'Arbeit LANDI'}]
    },
    jayden:{2:[{start:'08:20',end:'11:55',depart:'07:55',label:'Schule'}]},
    fynn:{2:[{start:'08:20',end:'11:55',depart:'08:00',label:'Schule'}]},
    eliyah:{2:[{start:'13:30',end:'15:30',depart:'13:10',label:'Kindergarten'}]}
  },
  reminders:[{id:'school-pack',personId:'fynn',days:[1,2,3,4,5],items:['Rucksack']},{id:'eli-pack',personId:'eliyah',days:[1,2,3,4,5],items:['Leuchtweste']}],
  events:[
    {id:'event-today',personIds:['fynn'],title:'Zahnarzt',date:'2026-09-22',time:'15:30',end:'16:00',note:'Versicherungskarte mitnehmen'},
    {id:'oli-work-conflict',personIds:['oli'],title:'Arzttermin',date:'2026-09-22',time:'09:00',end:'09:30',note:'Testkonflikt während LANDI-Arbeit'},
    {id:'oli-srk-coverage',personIds:['oli'],title:'SRK Betreuung',date:'2026-09-22',time:'07:00',end:'08:00',note:'Betreuung während der Arbeit',eventRole:'care-coverage',requiresPresence:false},
    {id:'event-tomorrow',personIds:['jayden'],title:'Elternabend',date:'2026-09-23',time:'19:00',end:'20:00',note:'',source:'bluewin'},
    {id:'holiday-elia',personIds:['eliyah'],title:'Herbstferien',date:'2026-09-21',endDate:'2026-09-25',note:''}
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
  await page.waitForFunction(()=>document.documentElement.dataset.fc11==='1'&&document.documentElement.dataset.fc12==='1'&&Boolean(window.__fcV11),{timeout:20000});
  await isolate(page);
  await page.waitForFunction(()=>document.querySelector('[data-title]')?.textContent==='Heute',{timeout:5000});

  await page.locator('.fc11-main [data-brain]').click();
  await page.waitForSelector('#fcFamilyBrain',{state:'visible',timeout:12000});
  await page.click('#fcFamilyBrain [data-close]');

  assert.equal(await page.locator('.fc11-bottom-nav [data-fc11-screen]').count(),5,'mobile navigation has five clear destinations');
  assert.equal(await page.evaluate(()=>document.documentElement.dataset.fcDesign),'v12','V12 ASI design mode is active');
  assert.equal(await page.evaluate(()=>[...document.styleSheets].some(s=>String(s.href||'').includes('v12.css'))),true,'V12 design stylesheet is loaded');
  const v12Computed=await page.evaluate(()=>({
    nextRadius:getComputedStyle(document.querySelector('.fc11-next')).borderRadius,
    navRadius:getComputedStyle(document.querySelector('.fc11-bottom-nav')).borderRadius,
    bodyBg:getComputedStyle(document.body).backgroundImage
  }));
  assert.equal(v12Computed.nextRadius,'28px','V12 hero radius is active');
  assert.equal(v12Computed.navRadius,'24px','V12 floating navigation radius is active');
  assert.match(v12Computed.bodyBg,/gradient/i,'V12 ambient background is active');
  assert.equal(await page.locator('.fc11-kid').count(),3,'today shows all three child rows');
  assert.equal(await page.locator('.fc11-prep-section').count(),1,'Today shows automatic tomorrow preparation');
  const prepText=await page.locator('.fc11-prep-section').innerText();
  assert.match(prepText,/MORGEN VORBEREITEN[\s\S]*Um 07:00 Uhr los[\s\S]*Rucksack/,'tomorrow prep includes work departure and school reminder');
  assert.doesNotMatch(prepText,/Leuchtweste/,'holiday child preparation is suppressed');
  const prepRucksack=page.locator('.fc11-prep-item').filter({hasText:'Rucksack'});
  await prepRucksack.click();
  assert.equal(await prepRucksack.getAttribute('aria-pressed'),'true','tomorrow prep can be checked off');
  await page.evaluate(()=>window.__fcV11.render());
  assert.equal(await page.locator('.fc11-prep-item').filter({hasText:'Rucksack'}).getAttribute('aria-pressed'),'true','prep check survives rerender');
  assert.equal(await page.locator('[data-action-center="conflicts"]').count(),1,'Today action center surfaces a detected scheduling conflict');
  const conflictHealth=await page.evaluate(()=>window.__fcConflictAssistant?.audit?.());
  assert.ok(conflictHealth?.high>=1,'conflict assistant detects work overlap');
  const conflictText=conflictHealth.conflicts.map(x=>x.title+' '+x.detail).join('\n');
  assert.match(conflictText,/Arbeit überschneidet sich mit Termin[\s\S]*Arzttermin/);
  assert.doesNotMatch(conflictText,/SRK Betreuung/,'care coverage must never be treated as Oli being double-booked');
  assert.equal(await page.locator('.fc11-kid[data-holiday="1"]').count(),1,'a holiday remains scoped to the affected child');
  for(const id of ['jayden','fynn'])assert.doesNotMatch(await page.locator(`.fc11-kid[data-kid="${id}"]`).innerText(),/Heute frei/,'a completed school day must not look like a free day');
  assert.match(await page.locator('.fc11-kid[data-holiday="1"]').innerText(),/Elia[\s\S]*Herbstferien[\s\S]*Nur Elia · schulfrei/i);
  assert.equal(await page.locator('.fc11-kid').last().getAttribute('data-kid'),'eliyah','holiday-only child must not outrank children with a normal school day');
  assert.equal((await page.locator('.fc11-kids').innerText()).match(/Herbstferien/g)?.length,1,'holiday wording appears only on the affected child');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),true,'mobile must not overflow horizontally');
  const todayWork=page.locator('.fc11-today-section .fc11-row.work');
  assert.equal(await todayWork.count(),1,'today briefing shows the adult work schedule');
  assert.match(await todayWork.innerText(),/07:00[\s\S]*los[\s\S]*Oli[\s\S]*Arbeit LANDI[\s\S]*07:30–17:00[\s\S]*Pause 12:00–13:00/);
  assert.equal(await page.locator('.fc11-today-section .fc11-row').first().getAttribute('class'),'fc11-row work','today work is the first planned item');
  const todayBox=await page.locator('.fc11-today-section').boundingBox(),tomorrowBriefingBox=await page.locator('.fc11-tomorrow-section').boundingBox();
  assert.ok(todayBox&&tomorrowBriefingBox&&todayBox.y<tomorrowBriefingBox.y,'today work must appear before the tomorrow preview');

  const tomorrowWork=page.locator('.fc11-tomorrow-section .fc11-row.work');
  assert.equal(await tomorrowWork.count(),1,'split work shift appears once in tomorrow briefing');
  assert.match(await tomorrowWork.innerText(),/07:00[\s\S]*los[\s\S]*Oli[\s\S]*Arbeit LANDI[\s\S]*07:30–17:00[\s\S]*Pause 12:00–13:00/);
  assert.match(await page.locator('.fc11-tomorrow-section [data-event="event-tomorrow"]').innerText(),/Bluewin[\s\S]*Elternabend/,'automated event shows provenance');
  assert.equal(await page.locator('.fc11-tomorrow-section .fc11-row').first().getAttribute('class'),'fc11-row work','departure is the first tomorrow item');

  const navBox=await page.locator('.fc11-bottom-nav').boundingBox();
  assert.ok(navBox && navBox.x>=0 && navBox.x+navBox.width<=390.5,'bottom navigation fits viewport');
  const addBox=await page.locator('[data-add]').first().boundingBox();
  assert.ok(addBox && addBox.x+addBox.width<=390.5,'header actions fit viewport');

  const lastToday=page.locator('.fc11-home .fc11-row').last();
  await lastToday.evaluate(el=>el.scrollIntoView({block:'center'}));
  const lastBox=await lastToday.boundingBox(),navClearance=await page.locator('.fc11-bottom-nav').boundingBox();
  assert.ok(lastBox&&navClearance&&lastBox.y+lastBox.height<=navClearance.y-4,'last today row must be fully visible above the fixed tab bar after scrolling');
  await page.screenshot({path:'qa-v11/mobile-home-390x844.png',fullPage:true});
  await page.evaluate(()=>{
    const roles={jayden:'5. Klasse · Schuljahr 2026/27',fynn:'3. Klasse · Klasse 34e',eliyah:'Kindergarten Rosenweg 1'};
    window.data.people.forEach(p=>{if(roles[p.id])p.role=roles[p.id]});
    window.__fcV11.render();
  });
  assert.equal(await page.locator('.fc11-kid').count(),3,'class and kindergarten role descriptions still identify all children');
  assert.equal(await page.locator('.fc11-kid[data-holiday="1"]').count(),1,'a single-child break remains scoped after child detection');
  await page.evaluate(()=>{window.data.events.find(e=>e.id==='holiday-elia').personIds=['jayden','fynn','eliyah'];window.__fcV11.render()});
  assert.equal(await page.locator('.fc11-kid').count(),0,'shared holiday replaces three redundant child rows');
  assert.match(await page.locator('.fc11-shared-holiday').innerText(),/Herbstferien[\s\S]*Schulfrei/i);
  assert.equal(await page.locator('.fc11-holiday-people span').count(),3,'all children remain visible as compact avatars');
  assert.match(await page.locator('.fc11-holiday-people').getAttribute('aria-label'),/Jayden, Fynn, Elia/);
  assert.doesNotMatch(await page.locator('.fc11-home').innerText(),/Nur Elia/,'shared holiday must not look child-specific');
  assert.equal((await page.locator('.fc11-home').innerText()).match(/Herbstferien/g)?.length,1,'shared holiday appears once in the daily briefing');
  const tomorrowBox=await page.locator('.fc11-tomorrow-section').boundingBox(),sharedNav=await page.locator('.fc11-bottom-nav').boundingBox();
  assert.ok(tomorrowBox&&sharedNav&&tomorrowBox.y<sharedNav.y,'tomorrow briefing starts in the first mobile viewport during shared holidays');
  await page.screenshot({path:'qa-v11/mobile-shared-holiday-390x844.png',fullPage:true});
  await isolate(page);

  await page.click('[data-tomorrow-plan]');
  assert.equal(await page.locator('[data-title]').innerText(),'Plan');
  assert.equal(await page.locator('.fc11-week-strip button').count(),7);
  await page.click('[data-plan-person="oli"]');
  assert.match(await page.locator('.fc11-plan-person').innerText(),/Oli[\s\S]*07:30–12:00[\s\S]*07:00 los[\s\S]*Arbeit LANDI/,'adult work remains visible in Plan');
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
  assert.equal(await page.locator('#fc11SystemSheet').count(),0,'system tools stay closed by default');
  await page.locator('[data-system-security]').click();
  await page.waitForSelector('#fc11SystemSheet',{state:'visible'});
  assert.equal(await page.locator('#fc11SystemSheet [data-tool="connections"]').count(),1,'System & Sicherheit exposes connections directly');
  assert.equal(await page.locator('#fc11SystemSheet [data-tool="integrity"]').count(),1,'System & Sicherheit exposes data integrity directly');
  assert.equal(await page.locator('#fc11SystemSheet [data-system-sync]').count(),1,'System & Sicherheit exposes one-tap connector sync');
  assert.equal(await page.locator('#fc11SystemSheet .fc11-sync-panel').count(),1,'System & Sicherheit shows connector history panel');
  assert.equal(await page.locator('#fc11SystemSheet .fc11-activity-panel').count(),1,'System & Sicherheit shows family change journal');
  assert.equal(await page.locator('#fc11SystemSheet [data-system-activity]').count(),1,'System & Sicherheit exposes full change journal');
  assert.equal(await page.locator('#fc11SystemSheet [data-tool="conflicts"]').count(),1,'System & Sicherheit exposes conflict assistant directly');
  await page.click('#fc11SystemSheet [data-tool="conflicts"]');
  await page.waitForSelector('#fc11ConflictSheet',{state:'visible'});
  assert.match(await page.locator('#fc11ConflictSheet').innerText(),/Konflikt-Assistent[\s\S]*Arbeit überschneidet sich mit Termin[\s\S]*Arzttermin/);
  const intended=page.locator('#fc11ConflictSheet .fc11-conflict-item').filter({hasText:'Arzttermin'});
  await intended.locator('[data-conflict-ignore]').click();
  await page.waitForSelector('#fc11ConflictSheet',{state:'visible'});
  const ignoredAudit=await page.evaluate(()=>window.__fcConflictAssistant.audit());
  assert.doesNotMatch(ignoredAudit.conflicts.map(x=>x.detail).join('\n'),/Arzttermin/,'intended overlap is removed from active conflicts');
  assert.match(ignoredAudit.ignored.map(x=>x.detail).join('\n'),/Arzttermin/,'intended overlap remains recoverable');
  await page.locator('#fc11ConflictSheet .fc11-conflict-ignored').evaluate(el=>{el.open=true});
  await page.locator('#fc11ConflictSheet .fc11-conflict-item').filter({hasText:'Arzttermin'}).locator('[data-conflict-restore]').click();
  await page.waitForSelector('#fc11ConflictSheet',{state:'visible'});
  const restoredAudit=await page.evaluate(()=>window.__fcConflictAssistant.audit());
  assert.match(restoredAudit.conflicts.map(x=>x.detail).join('\n'),/Arzttermin/,'ignored conflict can be restored');
  await page.click('#fc11ConflictSheet [data-close]');
  await page.locator('[data-system-security]').click();
  await page.waitForSelector('#fc11SystemSheet',{state:'visible'});
  await page.click('#fc11SystemSheet [data-tool="integrity"]');
  await page.waitForSelector('#fc11IntegritySheet',{state:'visible'});
  assert.match(await page.locator('#fc11IntegritySheet').innerText(),/Datenprüfung/);
  await page.click('#fc11IntegritySheet [data-close]');
  await page.locator('[data-system-security]').click();
  await page.waitForSelector('#fc11SystemSheet',{state:'visible'});
  await page.click('#fc11SystemSheet [data-system-activity]');
  await page.waitForSelector('#fc11ActivitySheet',{state:'visible'});
  assert.match(await page.locator('#fc11ActivitySheet').innerText(),/Änderungsjournal/);
  await page.click('#fc11ActivitySheet [data-close]');
  await page.locator('[data-system-security]').click();
  await page.waitForSelector('#fc11SystemSheet',{state:'visible'});
  await page.click('#fc11SystemSheet [data-close]');
  await page.evaluate(()=>{const probe=document.createElement('div');probe.dataset.scrollProbe='1';probe.style.height='420px';document.querySelector('#fc11Main')?.append(probe)});
  const scrollContract=await page.evaluate(()=>({html:getComputedStyle(document.documentElement).overflowY,body:getComputedStyle(document.body).overflowY,scrollHeight:document.documentElement.scrollHeight,viewport:innerHeight,top:scrollY}));
  assert.notEqual(scrollContract.html,'hidden','V11 must never lock html vertical scrolling');
  assert.notEqual(scrollContract.body,'hidden','V11 must never lock body vertical scrolling');
  assert.ok(scrollContract.scrollHeight>scrollContract.viewport,'More must have a scrollable page when content is taller than the viewport');
  await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
  await page.waitForTimeout(80);
  assert.ok(await page.evaluate(()=>scrollY>40),'More must scroll down on iPhone');
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.waitForTimeout(40);
  await page.click('[data-person-card="fynn"]');
  await page.waitForSelector('#fc11PersonSheet');
  assert.match(await page.locator('#fc11PersonSheet').innerText(),/Fynn/);
  await page.click('#fc11PersonSheet [data-close]');
  await page.evaluate(()=>{if(document.documentElement.scrollHeight<=innerHeight){const probe=document.createElement('div');probe.style.height='420px';document.querySelector('#fc11Main')?.append(probe)}});
  await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
  await page.waitForTimeout(80);
  assert.ok(await page.evaluate(()=>scrollY>40),'closing a V11 modal must not leave page scrolling locked');
  await page.evaluate(()=>window.scrollTo(0,0));

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
  await page.click('[data-system-security]');
  await page.waitForSelector('#fc11SystemSheet',{state:'visible'});
  await page.click('#fc11SystemSheet [data-tool="push"]');
  await page.waitForSelector('#fcReminderCenter',{state:'visible'});
  assert.match(await page.locator('#fcReminderCenter').innerText(),/Rucksack/);
  assert.equal(await page.evaluate(()=>window.__v11PushCalls),0,'opening reminders must not request push permission automatically');
  await page.click('#fcReminderCenter [data-close]');

  await page.screenshot({path:'qa-v11/mobile-390x844.png',fullPage:true});
  for(const [width,height] of [[375,812],[430,932]]){
    await page.setViewportSize({width,height});
    for(const screen of ['today','more']){
      await page.evaluate(target=>window.__fcV11.open(target),screen);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),true,`${screen} must fit ${width}×${height}`);
      await page.screenshot({path:`qa-v11/mobile-${screen}-${width}x${height}.png`,fullPage:true});
    }
  }
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
  await desktopPage.setViewportSize({width:1440,height:1000});
  assert.equal(await desktopPage.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+1),true,'desktop must fit 1440×1000');
  await desktopPage.screenshot({path:'qa-v11/desktop-1440x1000.png',fullPage:true});
  assert.deepEqual(desktopErrors,[],'no uncaught browser errors on desktop');

  await desktop.close();
  await browser.close();
  console.log('family command v11 regression: ok');
} finally {
  server.kill('SIGTERM');
}
