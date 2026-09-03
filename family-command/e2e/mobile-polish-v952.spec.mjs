import { webkit } from 'playwright';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const PORT=4194,BASE=`http://127.0.0.1:${PORT}`;
const seed=readFileSync('family-command/e2e/mock-private-core.js','utf8');
const server=spawn('python3',['-m','http.server',String(PORT),'--directory','family-command'],{stdio:['ignore','pipe','pipe']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<50;i++){try{if((await fetch(BASE+'/index.html')).ok)return}catch{}await sleep(100)}throw new Error('server not ready')}
try{
  await ready();
  const browser=await webkit.launch({headless:true});
  const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await ctx.addInitScript({content:seed});
  const page=await ctx.newPage();
  await page.goto(BASE+'/?access=test',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.fcReady==='1');
  await page.waitForFunction(()=>document.documentElement.dataset.fcMobilePolish==='v52'&&document.documentElement.dataset.fcMobileDashboardPolish==='v52',{timeout:20000});
  await page.evaluate(()=>{const iso=typeof todayISO==='function'?todayISO():new Date().toISOString().slice(0,10);window.data.events=Array.isArray(window.data.events)?window.data.events:[];window.data.events.push({id:'v952-all-day',date:iso,time:'',title:'V9.52 Ganztagstest',personIds:['jayden'],note:''});window.__fcReferenceDashboard39?.rebuild(true)});
  await page.waitForFunction(()=>[...document.querySelectorAll('#today .fc38-line time.fc52-all-day')].some(x=>x.textContent==='Ganztägig'));
  const m=await page.evaluate(()=>{
    const header=document.querySelector('.fc9-topbar-in'),nav=document.querySelector('.fc9-nav'),buttons=[...document.querySelectorAll('.fc9-nav button')],main=document.querySelector('.fc9-main'),taskIcon=document.querySelector('#today .fc38-taskicon');
    const allDay=[...document.querySelectorAll('#today .fc38-line time.fc52-all-day')];
    const panels=[...document.querySelectorAll('#today .fc38-panel')];
    return {polish:document.documentElement.dataset.fcMobilePolish,dashboard:document.documentElement.dataset.fcMobileDashboardPolish,legacyPolish:document.documentElement.dataset.fcGlobalPolish,legacyDashboard:document.documentElement.dataset.fcReferenceDashboard,headerH:header?.getBoundingClientRect().height||0,navH:nav?.getBoundingClientRect().height||0,navButtons:buttons.map(b=>b.getBoundingClientRect().height),overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,mainOverflow:main?main.scrollWidth>main.clientWidth+1:false,allDayCount:allDay.length,allDayText:allDay.map(x=>x.textContent),taskIconBg:taskIcon?getComputedStyle(taskIcon).backgroundColor:'',panelRadius:panels[0]?parseFloat(getComputedStyle(panels[0]).borderRadius):0};
  });
  console.log('mobile-polish-v952',JSON.stringify(m));
  assert.equal(m.polish,'v52');assert.equal(m.dashboard,'v52');assert.equal(m.legacyPolish,'v49');assert.equal(m.legacyDashboard,'v39');
  assert.equal(m.overflow,false);assert.equal(m.mainOverflow,false);
  assert.ok(m.headerH<=86,`mobile header must stay compact: ${m.headerH}`);
  assert.ok(m.navH<=72,`bottom navigation must stay compact: ${m.navH}`);
  assert.ok(m.navButtons.every(h=>h>=44),`all nav touch targets must remain >=44px: ${m.navButtons}`);
  assert.ok(m.allDayCount>=1,'all-day agenda entries must use the dedicated status badge');
  assert.ok(m.allDayText.every(x=>x==='Ganztägig'));
  assert.ok(m.panelRadius>=14,'today panels should retain calm rounded grouping');
  await browser.close();
  console.log('V9.52 mobile polish regression: ok');
} finally {server.kill('SIGTERM')}
