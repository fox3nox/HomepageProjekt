import { webkit } from 'playwright';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const PORT=4186,BASE=`http://127.0.0.1:${PORT}`;
const seed=readFileSync('family-command/e2e/mock-private-core.js','utf8');
const server=spawn('python3',['-m','http.server',String(PORT),'--directory','family-command'],{stdio:['ignore','pipe','pipe']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<40;i++){try{const r=await fetch(BASE+'/index.html');if(r.ok)return}catch{}await sleep(100)}throw new Error('server not ready')}
async function openApp(browser,options){const context=await browser.newContext({...options,serviceWorkers:'block'});await context.addInitScript({content:seed});const page=await context.newPage();await page.goto(BASE+'/?access=test',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.documentElement.dataset.fcReady==='1');await page.waitForFunction(()=>document.documentElement.dataset.fcGlobalPolish==='v49');return{context,page}}
try{
  await ready();
  const browser=await webkit.launch({headless:true});

  const mobile=await openApp(browser,{viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const p=mobile.page;
  await p.waitForFunction(()=>document.documentElement.dataset.fcIphoneDashboard==='v31');
  await p.waitForFunction(()=>document.documentElement.dataset.fcMobileSchoolDay==='v672');
  await p.waitForFunction(()=>document.documentElement.dataset.fcIphoneLayout==='v48');
  const x=await p.evaluate(()=>{
    const navEl=document.querySelector('.fc9-nav');
    const mainEl=document.querySelector('.fc9-main');
    const topEl=document.querySelector('.fc9-topbar');
    const nav=navEl.getBoundingClientRect();
    const main=mainEl.getBoundingClientRect();
    const top=topEl.getBoundingClientRect();
    const shell=document.querySelector('.fc9-shell').getBoundingClientRect();
    const schoolGrid=document.querySelector('.fc38-schoolgrid');
    const mobileSchool=document.querySelector('.fc47-school-mobile');
    const summary=document.querySelector('#today .fc31-summary');
    const focus=document.querySelector('#today .fc9-focus');
    const todos=[...document.querySelectorAll('#today [data-todo]')];
    const todoSection=todos[0]?.closest('.fc9-section');
    const todoHeading=todoSection?.querySelector('.fc9-section-head h2');
    const statTexts=[...document.querySelectorAll('#today .fc31-stat span')].map(x=>x.textContent.trim());
    const activeStyle=getComputedStyle(document.querySelector('.fc9-nav button.active'));
    const navStyle=getComputedStyle(navEl),mainStyle=getComputedStyle(mainEl),bodyStyle=getComputedStyle(document.body);

    const probe=document.createElement('button');
    probe.className='fc38-line';
    probe.innerHTML='<time>Ganztägig</time><span class="fc38-avatar" style="--person:#3478f6">J</span><div><strong>Probe</strong><span>Layout</span></div><i>›</i>';
    document.querySelector('#today .fc38-dashboard')?.appendChild(probe);
    const probeTime=probe.querySelector('time')?.getBoundingClientRect();
    const probeAvatar=probe.querySelector('.fc38-avatar')?.getBoundingClientRect();
    const allDayGap=probeTime&&probeAvatar?probeAvatar.left-probeTime.right:null;
    probe.remove();

    return {
      navX:nav.x,navTop:nav.top,navBottom:nav.bottom,navW:nav.width,
      mainTop:main.top,mainBottom:main.bottom,
      topBottom:top.bottom,
      shellX:shell.x,shellW:shell.width,shellH:shell.height,
      innerW:innerWidth,innerH:innerHeight,
      overflow:document.documentElement.scrollWidth<=document.documentElement.clientWidth+1,
      rootVerticalFit:document.documentElement.scrollHeight<=innerHeight+1,
      legacySchoolDisplay:schoolGrid?getComputedStyle(schoolGrid).display:'missing',
      mobileSchoolDisplay:mobileSchool?getComputedStyle(mobileSchool).display:'missing',
      schoolTabs:document.querySelectorAll('.fc47-day').length,
      schoolRows:document.querySelectorAll('.fc47-child').length,
      selectedSchoolDays:document.querySelectorAll('.fc47-day.is-selected').length,
      summary:!!summary,
      focusHeight:focus?.getBoundingClientRect().height||0,
      todoCount:todos.length,
      todoHeading:todoHeading?.textContent?.trim()||'',
      statTexts,
      dashboard:document.documentElement.dataset.fcIphoneDashboard,
      reference:document.documentElement.dataset.fcReferenceDesign,
      polish:document.documentElement.dataset.fcGlobalPolish,
      schoolMode:document.documentElement.dataset.fcMobileSchoolDay,
      iphoneLayout:document.documentElement.dataset.fcIphoneLayout,
      navPosition:navStyle.position,
      mainOverflowY:mainStyle.overflowY,
      bodyOverflowY:bodyStyle.overflowY,
      allDayGap,
      activeNavBg:activeStyle.backgroundImage!=='none'?activeStyle.backgroundImage:activeStyle.backgroundColor
    };
  });
  console.log('iphone-v49',JSON.stringify(x));
  assert.ok(x.navX>=7&&x.navX<=9&&Math.abs(x.navW-(x.innerW-16))<=3,`mobile tab bar width ${JSON.stringify(x)}`);
  assert.ok(x.innerH-x.navBottom>=5&&x.innerH-x.navBottom<=10,`mobile tab bar safe gap ${JSON.stringify(x)}`);
  assert.ok(x.mainBottom<=x.navTop+1,`main content viewport must end before bottom navigation ${JSON.stringify(x)}`);
  assert.ok(x.topBottom<=x.mainTop+1,`top bar must not overlap main viewport ${JSON.stringify(x)}`);
  assert.ok(Math.abs(x.shellH-x.innerH)<=2,`mobile shell must fit dynamic viewport ${JSON.stringify(x)}`);
  assert.ok(x.shellX<=1&&Math.abs(x.shellW-x.innerW)<=2,`mobile shell ${JSON.stringify(x)}`);
  assert.equal(x.navPosition,'relative','mobile navigation must participate in layout instead of overlaying content');
  assert.equal(x.mainOverflowY,'auto','main area must own vertical scrolling');
  assert.equal(x.bodyOverflowY,'hidden','body must not scroll behind the fixed app chrome');
  assert.equal(x.rootVerticalFit,true,'mobile root must not create a second vertical scroll area');
  assert.equal(x.overflow,true,`mobile root horizontal overflow ${JSON.stringify(x)}`);
  assert.ok(x.allDayGap!==null&&x.allDayGap>=4,`all-day label must not collide with avatar ${JSON.stringify(x)}`);
  assert.equal(x.legacySchoolDisplay,'none','legacy weekly school matrix must be hidden on iPhone');
  assert.notEqual(x.mobileSchoolDisplay,'none','mobile school-day view must be visible on iPhone');
  assert.equal(x.schoolTabs,5,'mobile school-day view must expose Monday to Friday');
  assert.equal(x.schoolRows,3,'mobile school-day view must show all three children');
  assert.equal(x.selectedSchoolDays,1,'exactly one school day must be selected');
  assert.equal(x.dashboard,'v31');
  assert.equal(x.reference,'v33');
  assert.equal(x.polish,'v49');
  assert.equal(x.schoolMode,'v672');
  assert.equal(x.iphoneLayout,'v48');
  assert.equal(x.summary,true,'compact iPhone summary must remain available');
  assert.deepEqual(x.statTexts,['Wichtig','Offen','Termine']);
  assert.ok(x.focusHeight<90,`focus card must stay compact on iPhone: ${x.focusHeight}`);
  if(x.todoCount>0)assert.equal(x.todoHeading,'Heute – Das Wichtigste zuerst','today task section must follow the reference hierarchy');
  assert.ok(String(x.activeNavBg).includes('gradient')||String(x.activeNavBg).includes('rgb'),'active bottom navigation must be visibly highlighted');
  await mobile.context.close();

  const desktop=await openApp(browser,{viewport:{width:1440,height:1000}});
  await desktop.page.click('.fc9-nav button[data-screen="more"]');
  await desktop.page.waitForSelector('#more .fc9-more-grid');
  const d=await desktop.page.evaluate(()=>{
    const shell=document.querySelector('.fc9-shell').getBoundingClientRect();
    const nav=document.querySelector('.fc9-nav').getBoundingClientRect();
    const main=document.querySelector('.fc9-main').getBoundingClientRect();
    const navStyle=getComputedStyle(document.querySelector('.fc9-nav'));
    const navInStyle=getComputedStyle(document.querySelector('.fc9-nav-in'));
    const moreStyle=getComputedStyle(document.querySelector('#more .fc9-more-grid'));
    return {
      innerW:innerWidth,shellW:shell.width,navX:nav.x,navW:nav.width,
      mainX:main.x,mainW:main.width,
      rootOverflow:document.documentElement.scrollWidth<=document.documentElement.clientWidth+1,
      navPosition:navStyle.position,navDirection:navInStyle.flexDirection,
      moreCols:moreStyle.gridTemplateColumns,
      h1:parseFloat(getComputedStyle(document.querySelector('#more .fc9-pagehead h1')).fontSize),
      polish:document.documentElement.dataset.fcGlobalPolish,
      iphoneLayout:document.documentElement.dataset.fcIphoneLayout,
      mobileSchoolPresent:Boolean(document.querySelector('.fc47-school-mobile'))
    };
  });
  console.log('desktop-v49',JSON.stringify(d));
  assert.equal(d.rootOverflow,true,`desktop root overflow ${JSON.stringify(d)}`);
  assert.ok(Math.abs(d.shellW-d.innerW)<=2,'desktop shell must use full viewport width');
  assert.ok(d.navX<=1&&d.navW>=220&&d.navW<=228,`desktop navigation rail ${JSON.stringify(d)}`);
  assert.ok(d.mainX>=d.navW,'desktop main content must sit beside the navigation rail');
  assert.ok(d.mainW>=900&&d.mainW<=1240,`desktop main content width ${JSON.stringify(d)}`);
  assert.equal(d.navPosition,'sticky');
  assert.equal(d.navDirection,'column');
  assert.ok(d.h1>=38,'desktop title hierarchy should scale up');
  assert.ok(d.moreCols.split(' ').length===3,'grouped desktop destinations should use three columns');
  assert.equal(d.polish,'v49');
  assert.equal(d.iphoneLayout,'v48');
  assert.equal(d.mobileSchoolPresent,false,'desktop must keep the weekly school matrix instead of injecting the mobile school-day view');
  await desktop.context.close();

  await browser.close();
  console.log('V9.49 iPhone + desktop responsive regression: ok');
} finally {server.kill('SIGTERM')}
