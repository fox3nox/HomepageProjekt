import { webkit } from 'playwright';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const PORT=4189,BASE=`http://127.0.0.1:${PORT}`,seed=readFileSync('family-command/e2e/mock-private-core.js','utf8');
const server=spawn('python3',['-m','http.server',String(PORT),'--directory','family-command'],{stdio:['ignore','pipe','pipe']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<60;i++){try{if((await fetch(BASE+'/index.html')).ok)return}catch{}await sleep(100)}throw Error('server not ready')}

try{
  await ready();
  const browser=await webkit.launch({headless:true}),ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await ctx.addInitScript({content:seed});
  const page=await ctx.newPage();
  await page.goto(BASE+'/?access=test',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.fcReady==='1'&&window.__fcV9);
  await page.evaluate(()=>{const iso=todayISO();const d=new Date(`${iso}T12:00:00`);d.setDate(d.getDate()+1);const tomorrow=d.toISOString().slice(0,10);data.todos=[{id:'gift',date:iso,title:'Pokémon-Karten als Geschenk kaufen',priority:true,done:false,section:'day'},{id:'shop',date:iso,title:'Maggi kaufen',priority:true,done:false,section:'day'},{id:'normal',date:iso,title:'Normale offene Aufgabe',priority:false,done:false,section:'day'}];data.events=[{id:'visit',personIds:['child-a'],title:'Schulbesuch',date:iso,time:'13:40',note:'PET-Flaschen mitnehmen'},{id:'birthday',personIds:['child-a'],title:'Geburtstag Alessio',date:tomorrow,time:'13:30'}];for(const p of(data.people||[]).filter(p=>p.id!=='oli')){data.schedules[p.id]??={};for(const wd of[1,2,3,4,5])data.schedules[p.id][wd]=[{start:wd===3?'07:30':'08:20',end:'11:55',label:'Schule / Kindergarten',note:wd===3?'Turnzeug einpacken':''}]}save?.();window.renderToday?.()});
  await page.waitForFunction(()=>document.documentElement.dataset.fcReferenceDashboard==='v44');
  await page.waitForFunction(()=>document.documentElement.dataset.fcMobileSchoolDay==='v49');

  const r=await page.evaluate(()=>{
    const before=JSON.stringify({todos:data.todos,events:data.events,homework:data.homework,people:data.people,schedules:data.schedules});
    window.__fcReferenceDashboard39.rebuild(true);
    window.__fcMobileSchoolDayV947?.render();
    const after=JSON.stringify({todos:data.todos,events:data.events,homework:data.homework,people:data.people,schedules:data.schedules}),dash=document.querySelector('#today>.fc38-dashboard'),source=document.querySelector('#today>.fc9-page'),tasks=[...dash.querySelectorAll('.fc38-task')],school=dash.querySelector('.fc38-schoolgrid'),avatars=[...dash.querySelectorAll('.fc38-avatar')],visibleAvatars=avatars.filter(a=>a.getBoundingClientRect().width>0),todayHead=dash.querySelector('.fc38-th.is-today'),todayCells=[...dash.querySelectorAll('.fc38-schoolcell.is-today')],mobile=dash.querySelector('.fc47-school-mobile'),avatarStyles=visibleAvatars.map(a=>{const c=getComputedStyle(a),b=a.getBoundingClientRect();return{text:a.textContent.trim(),w:b.width,h:b.height,display:c.display,align:c.alignItems,justify:c.justifyContent,font:parseFloat(c.fontSize),color:c.color}}),currentDay=new Date(`${todayISO()}T12:00:00`).getDay(),peopleCount=(data.people||[]).filter(p=>p.id!=='oli').length;
    return{same:before===after,version:window.__fcReferenceDashboard39.version,dashboard:!!dash,sourceWidth:source.getBoundingClientRect().width,overflow:document.documentElement.scrollWidth<=document.documentElement.clientWidth+1,daybar:dash.querySelector('.fc38-daybar').getBoundingClientRect().height,panels:dash.querySelectorAll('.fc38-panel').length,tasks:tasks.length,heights:tasks.map(x=>x.getBoundingClientRect().height),lines:dash.querySelectorAll('.fc38-line').length,schoolCells:school.children.length,schoolDisplay:getComputedStyle(school).display,reminders:dash.querySelectorAll('.fc38-reminders>*').length,avatars:visibleAvatars.length,avatarText:visibleAvatars.every(a=>a.textContent.trim().length===1),avatarStyles,text:dash.textContent,nav:document.querySelector('.fc9-nav').getBoundingClientRect().height,todayHead:todayHead?.textContent||'',todayCellCount:todayCells.length,currentDay,peopleCount,mobileDisplay:mobile?getComputedStyle(mobile).display:'missing',mobileTabs:mobile?.querySelectorAll('.fc47-day').length||0,mobileRows:mobile?.querySelectorAll('.fc47-child').length||0,mobileSelected:mobile?.querySelectorAll('.fc47-day.is-selected').length||0,mobileToday:mobile?.querySelectorAll('.fc47-day.is-today').length||0}
  });
  console.log('reference-v49',JSON.stringify(r));
  assert.equal(r.version,'9.44.0');
  assert.ok(r.dashboard&&r.same&&r.overflow);
  assert.ok(r.sourceWidth<=1.5);
  assert.ok(r.daybar>=46&&r.daybar<=55);
  assert.equal(r.tasks,3);
  for(const h of r.heights)assert.ok(h>=42&&h<=60);
  assert.ok(r.lines>=2);
  assert.ok(r.panels>=4);
  assert.ok(r.schoolCells>=24,'full Mon-Fri school grid must remain in the DOM for desktop/compatibility');
  assert.equal(r.schoolDisplay,'none','V9.49 hides the desktop week matrix on iPhone');
  assert.notEqual(r.mobileDisplay,'none','V9.49 mobile school-day view must be visible');
  assert.equal(r.mobileTabs,5,'mobile school-day view must offer Mo-Fr');
  assert.equal(r.mobileRows,r.peopleCount,'mobile school-day view must show every child');
  assert.equal(r.mobileSelected,1,'exactly one school day must be selected');
  assert.ok(r.mobileToday<=1,'today marker must be unique when today is a school weekday');
  assert.equal(r.reminders,2);
  assert.ok(r.avatars>=3&&r.avatarText,'visible person avatars must be identified');
  for(const a of r.avatarStyles){assert.ok(a.w>=29&&a.h>=29,'avatar must be large enough');assert.ok(a.font>=11,'avatar initial must be readable');assert.equal(a.display,'flex');assert.equal(a.align,'center');assert.equal(a.justify,'center');assert.match(a.color,/rgb\(255, 255, 255\)|rgba\(255, 255, 255/,'avatar initial must be white')}
  for(const x of['Das Wichtigste zuerst','im Überblick','Vorschau','SCHULZEITEN & WICHTIGES','NIE VERGESSEN','WICHTIG FÜR ELIYAH','Leuchtweste','Turnschuhe'])assert.ok(r.text.includes(x),x);
  assert.ok(r.nav>48);
  if(r.currentDay>=1&&r.currentDay<=5){assert.match(r.todayHead,/HEUTE/,'underlying current weekday contract must remain marked');assert.equal(r.todayCellCount,r.peopleCount,'underlying current weekday contract must cover every child row');assert.equal(r.mobileToday,1,'mobile day selector must mark today')}
  const normalOnly=await page.evaluate(()=>{for(const t of data.todos)t.priority=false;window.__fcReferenceDashboard39.rebuild(true);window.__fcMobileSchoolDayV947?.render();const d=document.querySelector('#today>.fc38-dashboard');return{kicker:d.querySelector('.fc38-kicker')?.textContent||'',subheads:d.querySelectorAll('.fc38-subhead').length}});
  assert.match(normalOnly.kicker,/OFFEN/);assert.equal(normalOnly.subheads,0,'normal-only tasks must not be mislabeled as additional tasks');
  await browser.close();
  console.log('V9.49 approved iPhone reference regression: ok');
}finally{server.kill('SIGTERM')}
