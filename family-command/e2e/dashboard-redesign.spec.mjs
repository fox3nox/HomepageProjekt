import { webkit } from 'playwright';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const PORT=4186,BASE=`http://127.0.0.1:${PORT}`;
const seed=readFileSync('family-command/e2e/mock-private-core.js','utf8');
const server=spawn('python3',['-m','http.server',String(PORT),'--directory','family-command'],{stdio:['ignore','pipe','pipe']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<40;i++){try{const r=await fetch(BASE+'/index.html');if(r.ok)return}catch{}await sleep(100)}throw new Error('server not ready')}
async function openApp(browser,options){const context=await browser.newContext({...options,serviceWorkers:'block'});await context.addInitScript({content:seed});const page=await context.newPage();await page.goto(BASE+'/?access=test',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.documentElement.dataset.fcReady==='1');await page.waitForFunction(()=>document.documentElement.dataset.fcIphoneDashboard==='v31');return{context,page}}
try{
  await ready();
  const browser=await webkit.launch({headless:true});

  const mobile=await openApp(browser,{viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const p=mobile.page;
  const x=await p.evaluate(()=>{
    const nav=document.querySelector('.fc9-nav').getBoundingClientRect();
    const shell=document.querySelector('.fc9-shell').getBoundingClientRect();
    const school=document.querySelector('.fc38-schoolgrid')?.getBoundingClientRect();
    const summary=document.querySelector('#today .fc31-summary');
    const focus=document.querySelector('#today .fc9-focus');
    const todos=[...document.querySelectorAll('#today [data-todo]')];
    const todoSection=todos[0]?.closest('.fc9-section');
    const todoHeading=todoSection?.querySelector('.fc9-section-head h2');
    const statTexts=[...document.querySelectorAll('#today .fc31-stat span')].map(x=>x.textContent.trim());
    const activeStyle=getComputedStyle(document.querySelector('.fc9-nav button.active'));
    return {
      navX:nav.x,navBottom:nav.bottom,navW:nav.width,shellX:shell.x,shellW:shell.width,
      innerW:innerWidth,innerH:innerHeight,
      overflow:document.documentElement.scrollWidth<=document.documentElement.clientWidth+1,
      schoolWidth:school?.width||0,
      schoolFont:school?parseFloat(getComputedStyle(document.querySelector('.fc38-schoolcell b')).fontSize):0,
      summary:!!summary,
      summaryCols:summary?getComputedStyle(summary).gridTemplateColumns:'',
      focusHeight:focus?.getBoundingClientRect().height||0,
      todoCount:todos.length,
      todoHeading:todoHeading?.textContent?.trim()||'',
      statTexts,
      dashboard:document.documentElement.dataset.fcIphoneDashboard,
      reference:document.documentElement.dataset.fcReferenceDesign,
      polish:document.documentElement.dataset.fcGlobalPolish,
      activeNavBg:activeStyle.backgroundImage!=='none'?activeStyle.backgroundImage:activeStyle.backgroundColor
    };
  });
  console.log('iphone-v46',JSON.stringify(x));
  assert.ok(x.navX>=7&&x.navX<=9&&Math.abs(x.navW-(x.innerW-16))<=3,`mobile floating nav width ${JSON.stringify(x)}`);
  assert.ok(x.innerH-x.navBottom>=5&&x.innerH-x.navBottom<=10,`mobile floating nav safe gap ${JSON.stringify(x)}`);
  assert.ok(x.shellX<=1&&Math.abs(x.shellW-x.innerW)<=2,`mobile shell ${JSON.stringify(x)}`);
  assert.equal(x.overflow,true,`mobile root overflow ${JSON.stringify(x)}`);
  assert.ok(x.schoolWidth>=640,'school week should be horizontally scrollable instead of unreadably compressed');
  assert.ok(x.schoolFont>=9,'school labels must remain readable on iPhone');
  assert.equal(x.dashboard,'v31');
  assert.equal(x.reference,'v33');
  assert.equal(x.polish,'v46');
  assert.equal(x.summary,true,'compact iPhone summary must remain available');
  assert.deepEqual(x.statTexts,['Wichtig','Offen','Termine']);
  assert.ok(x.focusHeight<90,`focus card must stay compact on iPhone: ${x.focusHeight}`);
  if(x.todoCount>0)assert.equal(x.todoHeading,'Heute – Das Wichtigste zuerst','today task section must follow the reference hierarchy');
  assert.ok(String(x.activeNavBg).includes('gradient')||String(x.activeNavBg).includes('rgb'),'active bottom navigation must be visibly highlighted');
  await mobile.context.close();

  const desktop=await openApp(browser,{viewport:{width:1440,height:1000}});
  const d=await desktop.page.evaluate(()=>{
    const shell=document.querySelector('.fc9-shell').getBoundingClientRect();
    const nav=document.querySelector('.fc9-nav').getBoundingClientRect();
    const main=document.querySelector('.fc9-main').getBoundingClientRect();
    const top=document.querySelector('.fc9-topbar').getBoundingClientRect();
    const navStyle=getComputedStyle(document.querySelector('.fc9-nav'));
    const navInStyle=getComputedStyle(document.querySelector('.fc9-nav-in'));
    const moreStyle=getComputedStyle(document.querySelector('#more .fc9-more-grid'));
    return {
      innerW:innerWidth,shellW:shell.width,navX:nav.x,navW:nav.width,navH:nav.height,
      mainX:main.x,mainW:main.width,topW:top.width,
      rootOverflow:document.documentElement.scrollWidth<=document.documentElement.clientWidth+1,
      navPosition:navStyle.position,navDirection:navInStyle.flexDirection,
      moreCols:moreStyle.gridTemplateColumns,
      h1:parseFloat(getComputedStyle(document.querySelector('#today .fc9-pagehead h1')).fontSize)
    };
  });
  console.log('desktop-v46',JSON.stringify(d));
  assert.equal(d.rootOverflow,true,`desktop root overflow ${JSON.stringify(d)}`);
  assert.ok(Math.abs(d.shellW-d.innerW)<=2,'desktop shell must use full viewport width');
  assert.ok(d.navX<=1&&d.navW>=220&&d.navW<=228,`desktop navigation rail ${JSON.stringify(d)}`);
  assert.ok(d.mainX>=d.navW,'desktop main content must sit beside the navigation rail');
  assert.ok(d.mainW>=900&&d.mainW<=1240,`desktop main content width ${JSON.stringify(d)}`);
  assert.equal(d.navPosition,'sticky');
  assert.equal(d.navDirection,'column');
  assert.ok(d.h1>=38,'desktop title hierarchy should scale up');
  assert.ok(d.moreCols.split(' ').length>=4,'wide desktop utility grid should use four columns');
  await desktop.context.close();

  await browser.close();
  console.log('V9.46 iPhone + desktop responsive regression: ok');
} finally {server.kill('SIGTERM')}