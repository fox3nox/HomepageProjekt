import { webkit } from 'playwright';
import { createServer } from 'node:http';
import { readFile, readFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';
import assert from 'node:assert/strict';

const root=resolve('family-command');
const server=createServer((req,res)=>{
  const file=resolve(root,'.'+(new URL(req.url,'http://localhost').pathname==='/'?'/index.html':new URL(req.url,'http://localhost').pathname));
  if(!file.startsWith(root)){res.writeHead(403).end();return;}
  readFile(file,(err,bytes)=>{if(err){res.writeHead(404).end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.png':'image/png','.svg':'image/svg+xml'})[extname(file)]||'application/octet-stream');res.end(bytes);});
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await webkit.launch({headless:true}),failures=[];
async function check(name,fn){try{await fn();console.log('PASS '+name);}catch(e){failures.push(name+': '+e.message);console.error('FAIL '+name+': '+e.message);}}
try{
  const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,timezoneId:'Europe/Zurich',serviceWorkers:'block',reducedMotion:'reduce'});
  await ctx.addInitScript({content:readFileSync('family-command/e2e/mock-private-core.js','utf8')});
  const p=await ctx.newPage(),errors=[];let smartDocumentLoads=0;p.setDefaultTimeout(8000);p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>{if(new URL(r.url()).pathname.endsWith('/smart-documents.js'))smartDocumentLoads++;});
  await p.clock.setFixedTime(new Date('2026-09-07T06:00:00+02:00'));
  let documentsOffline=false,documentRequests=0;
  await p.route('**/family-command-documents/list',r=>{documentRequests++;return documentsOffline?r.abort('internetdisconnected'):r.fulfill({json:{documents:[{id:'doc-search',title:'Zahnarztrechnung',document_type:'Rechnung',summary:'Kontrolle',metadata:{deadline:'2026-09-18'},tags:['Versicherung'],links:[{source_kind:'person',source_id:'child-a'}]}]}});});
  await p.route('**/family-command-documents/readable?id=doc-search',r=>r.fulfill({json:{title:'Zahnarztrechnung',content:{title:'Zahnarztrechnung',sections:[{paragraph:'Testdokument für Kind A'}]}}}));
  await p.goto(`http://127.0.0.1:${server.address().port}/?access=test`);
  await p.waitForFunction(()=>window.__fcSearch&&window.__fcMobileSchoolDayV947&&document.querySelector('.fc38-child'));
  await p.evaluate(()=>{
    todayISO=()=> '2026-09-07';
    data.events=[{id:'dental',title:'Zahnarzt',date:'2026-09-17',personIds:['child-a'],time:'10:00'}, {id:'past-dental',title:'Zahnarzt früher',date:'2026-01-02'}, {id:'today-event',title:'Bibliothek',date:'2026-09-07',time:'16:00',personIds:['child-a']}];
    data.todos=[{id:'dental-todo',date:'2026-01-02',title:'Zahnarzt anrufen',priority:true},{id:'done-dental',date:'2026-01-02',title:'Zahnarzt erledigt',done:true}];
    data.homework=[{id:'hw-focus',personId:'child-a',dueDate:'2026-01-02',subject:'Deutsch',title:'Zahnarzt Aufsatz',done:false}];
    data.people[1].notes=[{title:'Zahnarzt Nachkontrolle',content:'In sechs Monaten kontrollieren'}];
    data.contacts={version:1,entries:{dental:{id:'dental',name:'Zahnarzt Müller',personId:'child-a',phone:'000000000',category:'Zahnarzt'}}};
    data.shopping={version:1,activeListId:'other',lists:{other:{id:'other',title:'Alltag',items:{}},dent:{id:'dent',title:'Zahnarzt Einkauf',items:{brush:{id:'brush',title:'Zahnbürste'}}}}};
    data.recipes={version:1,items:{soup:{id:'soup',title:'Gemüsesuppe',note:'Nach dem Zahnarzt',ingredients:[{name:'Rüebli'}]}}};
    data.pendencies=[{id:'bill',title:'Zahnarzt Rechnung prüfen',personId:'oli',done:false}];
    data.schedules={'child-a':{1:[{start:'08:20',end:'11:55',label:'Turnen',note:'Turnschuhe in den Rucksack'}],2:[{start:'08:20',end:'11:55',label:'Schwimmen',note:'Badehose mitnehmen'}]},'child-b':{1:[{start:'07:30',end:'12:00',depart:'07:05',label:'Schule'}]},'child-c':{}};
    data.reminders=[{id:'bottle',personId:'child-a',days:[1,2],items:['Trinkflasche']}];
    __fcV9.invalidate();renderToday();
  });
  await check('next action uses recorded departures; urgent work and per-child packing are visible',async()=>{
    assert.match(await p.locator('.fc38-focus').innerText(),/07:05 · Kind B los/);
    assert.match(await p.locator('.fc38-focus button').innerText(),/2 dringende Aufgaben/);
    const child=p.locator('[data-focus-child="child-a"]');assert.match(await child.innerText(),/08:20.*11:55/);assert.match(await child.innerText(),/Trinkflasche/);assert.match(await child.innerText(),/Turnschuhe/);
    assert.doesNotMatch(await child.innerText(),/07:55|Leuchtweste|Znüni/);
    assert.equal(await p.locator('.fc38-reminders').count(),0);
    assert.equal(await p.locator('.fc38-school').getAttribute('open'),null);
    const urgentBox=await p.locator('.fc38-focus button').boundingBox();assert.ok(urgentBox.y+urgentBox.height<760,'urgent action is above the navigation without scrolling');
    const firstChild=await child.boundingBox();assert.ok(firstChild.y+firstChild.height<760,'first child with packing is above the navigation');
    await p.locator('[data-fc38-homework="hw-focus"] .fc38-check').tap();
    assert.equal(await p.evaluate(()=>data.homework[0].done),true);
    assert.equal(await p.locator('[data-fc38-homework="hw-focus"]').count(),0);
    await p.evaluate(()=>{data.homework[0].done=false;renderToday();});
    await p.locator('[data-focus-event="today-event"]').tap();await p.waitForSelector('#fcEventDetails');assert.match(await p.locator('#fcEventDetails h2').innerText(),/Bibliothek/);await p.locator('.fc-detail-close').tap();
  });
  await check('holidays, weekend, swimming, no guessed packing and reminder changes',async()=>{
    await p.evaluate(()=>{data.events.push({id:'holiday',title:'Ferien',date:'2026-09-07',endDate:'2026-09-07',personIds:['child-a']});renderToday();});
    assert.doesNotMatch(await p.locator('[data-focus-child="child-a"]').innerText(),/Trinkflasche|Turnzeug|Turnschuhe/);
    await p.evaluate(()=>{todayISO=()=> '2026-09-08';renderToday();});
    assert.match(await p.locator('[data-focus-child="child-a"]').innerText(),/Schwimmen/);
    assert.match(await p.locator('[data-focus-child="child-a"]').innerText(),/Badehose/);
    await p.evaluate(()=>{data.reminders[0].items=['Neue Trinkflasche'];renderToday();});
    assert.match(await p.locator('[data-focus-child="child-a"]').innerText(),/Neue Trinkflasche/);
    await p.evaluate(()=>{todayISO=()=> '2026-09-12';renderToday();});
    assert.doesNotMatch(await p.locator('.fc38-children').innerText(),/Trinkflasche|Turnzeug|Badehose/);
    await p.evaluate(()=>{todayISO=()=> '2026-09-07';data.events=data.events.filter(x=>x.id!=='holiday');renderToday();});
  });
  await check('search groups existing sources, people links, metadata, umlauts and typos without mutating state',async()=>{
    await p.locator('.fc-search-entry').tap();
    await p.waitForFunction(()=>__fcDocumentLibrary.cached().length===1);
    const result=await p.evaluate(()=>{const before=JSON.stringify(data),matches=__fcSearch.search('Zahnarzt'),after=JSON.stringify(data);return{same:before===after,groups:[...new Set(matches.map(x=>x.group))],doc:matches.find(x=>x.group==='Dokumente'),typo:__fcSearch.search('Zahnarztz').length,umlaut:__fcSearch.search('Muller').map(x=>x.title),metadata:__fcSearch.search('Versicherung').length,people:__fcSearch.search('Kind A').map(x=>x.group),past:matches.filter(x=>x.id==='past-dental'||x.id==='done-dental')}});
    assert.equal(result.same,true,'search must not mutate canonical data');assert.deepEqual(result.groups.sort(),['Termine','Aufgaben','Hausaufgaben','Dokumente','Notizen','Kontakte','Einkauf','Rezepte','Pendenzen'].sort());
    assert.equal(result.doc.meta,'Kind A');assert.ok(result.typo>0);assert.ok(result.umlaut.includes('Zahnarzt Müller'));assert.equal(result.metadata,1);assert.ok(result.people.includes('Personen'));assert.deepEqual(result.past,[]);
    await p.getByRole('searchbox',{name:'Suchbegriff',exact:true}).fill('Zahnarzt');
    assert.ok(await p.locator('.fc-search-results section').count()>=9);
    await p.getByRole('checkbox',{name:'Vergangenes und Erledigtes einbeziehen'}).check();
    assert.match(await p.locator('.fc-search-results').innerText(),/Zahnarzt früher/);assert.match(await p.locator('.fc-search-results').innerText(),/Zahnarzt erledigt/);
    await p.getByRole('button',{name:'Suche schliessen'}).tap();
    assert.equal(await p.locator('.fc-search-entry').evaluate(x=>x===document.activeElement),true,'search close restores focus to entry');
  });
  async function findAndTap(query,title){await p.locator('.fc-search-entry').tap();await p.getByRole('searchbox',{name:'Suchbegriff',exact:true}).fill(query);await p.locator('.fc-search-results button').filter({hasText:title}).first().tap();}
  await check('search actions open the matching task, note, contact, shopping list and recipe',async()=>{
    await findAndTap('Zahnarztrechnung','Zahnarztrechnung');await p.waitForSelector('.fc-dv-readable');assert.match(await p.locator('#fcDocumentViewer').innerText(),/Testdokument für Kind A/);await p.locator('.fc-dv-close').tap();
    await findAndTap('Zahnarzt 17','Zahnarzt');await p.waitForSelector('#fcEventDetails');assert.equal(await p.locator('#fcEventDetails h2').innerText(),'Zahnarzt');await p.locator('.fc-detail-close').tap();
    await findAndTap('Zahnarzt anrufen','Zahnarzt anrufen');assert.equal(await p.locator('#fc9TodoTitle').inputValue(),'Zahnarzt anrufen');await p.locator('.fc9-modal').evaluate(x=>x.remove());
    await findAndTap('Aufsatz','Aufsatz');assert.equal(await p.locator('#fc9HwTitle').inputValue(),'Zahnarzt Aufsatz');await p.locator('.fc9-modal').evaluate(x=>x.remove());
    await findAndTap('Nachkontrolle','Nachkontrolle');assert.match(await p.locator('.fc-search-note').innerText(),/sechs Monaten/);await p.locator('.fc-search-note button').tap();
    await findAndTap('Muller','Müller');assert.equal(await p.locator('[data-contact-search]').inputValue(),'Zahnarzt Müller');
    await findAndTap('Zahnbürste','Zahnbürste');assert.equal(await p.locator('[data-shopping-list="dent"]').getAttribute('aria-selected'),'true');await p.locator('.fc-shopping-close').tap();
    await findAndTap('Gemusesuppe','Gemüsesuppe');assert.equal(await p.locator('#fcRecipesModal input[type="search"]').inputValue(),'Gemüsesuppe');await p.locator('.fc-recipes-close').tap();
    await findAndTap('Rechnung prüfen','Rechnung prüfen');assert.equal(await p.locator('[data-pend="bill"]').evaluate(x=>x===document.activeElement),true);
  });
  await check('document failure preserves local and cached search, safe rendering and keyboard escape',async()=>{
    documentsOffline=true;await p.evaluate(()=>__fcDocumentLibrary.invalidate());
    await p.locator('.fc-search-entry').tap();await p.waitForFunction(()=>document.querySelector('.fc-search-status')?.textContent.includes('momentan nicht erreichbar'));
    await p.getByRole('searchbox',{name:'Suchbegriff',exact:true}).fill('Zahnarzt');assert.match(await p.locator('.fc-search-results').innerText(),/Zahnarztrechnung/);assert.match(await p.locator('.fc-search-results').innerText(),/Zahnarzt anrufen/);
    await p.keyboard.press('Escape');await p.waitForSelector('#fcSearchDialog',{state:'detached'});
    await p.keyboard.press('Control+k');await p.keyboard.press('Control+k');assert.equal(await p.locator('#fcSearchDialog').count(),1);await p.keyboard.press('Escape');await p.waitForSelector('#fcSearchDialog',{state:'detached'});
    await p.evaluate(()=>{data.todos.push({id:'escaped',date:todayISO(),title:'<img src=x onerror=alert(1)>',done:false});fcOpenSearch();});
    await p.getByRole('searchbox',{name:'Suchbegriff',exact:true}).fill('img');assert.equal(await p.locator('.fc-search-results img').count(),0);assert.match(await p.locator('.fc-search-results').innerText(),/<img/);await p.keyboard.press('Escape');
    assert.ok(documentRequests>=2);
  });
  await check('navigation, touch targets, responsive search, unique IDs and no JavaScript errors',async()=>{
    for(const screen of ['today','tomorrow','homework','today','events','more','today']){await p.locator(`.fc9-nav [data-screen="${screen}"]`).tap();assert.equal(await p.locator('.fc9-screen.active').getAttribute('id'),screen);}
    for(const width of [375,390,430,1024]){await p.setViewportSize({width,height:844});await p.locator('.fc-search-entry').click();await p.getByRole('searchbox',{name:'Suchbegriff',exact:true}).fill('Zahnarzt');const metrics=await p.locator('#fcSearchDialog').evaluate(m=>({overflow:m.scrollWidth>m.clientWidth,small:[...m.querySelectorAll('button')].filter(b=>b.getBoundingClientRect().height<44).length}));assert.equal(metrics.overflow,false);assert.equal(metrics.small,0);await p.keyboard.press('Escape');}
    assert.deepEqual(await p.evaluate(()=>__fcV9.health().dup),[]);assert.deepEqual(errors,[]);
    assert.equal(smartDocumentLoads,1,'managed boot must not also load the obsolete standalone document script');
    await p.setViewportSize({width:390,height:844});await p.locator('.fc9-nav [data-screen="today"]').tap();
    if(process.env.FC_QA_SCREENSHOT)await p.screenshot({path:process.env.FC_QA_SCREENSHOT,fullPage:false});
  });
}finally{await browser.close();await new Promise(r=>server.close(r));}
assert.deepEqual(failures,[]);
