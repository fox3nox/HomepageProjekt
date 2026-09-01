import { webkit } from 'playwright';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const PORT=4187,BASE=`http://127.0.0.1:${PORT}`;
const seed=readFileSync('family-command/e2e/mock-private-core.js','utf8');
const server=spawn('python3',['-m','http.server',String(PORT),'--directory','family-command'],{stdio:['ignore','pipe','pipe']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<40;i++){try{const r=await fetch(BASE+'/index.html');if(r.ok)return}catch{}await sleep(100)}throw new Error('server not ready')}

try{
  await ready();
  const browser=await webkit.launch({headless:true});
  const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await ctx.addInitScript({content:seed});
  const page=await ctx.newPage();
  await page.goto(BASE+'/?access=test',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.fcReady==='1');
  await page.waitForFunction(()=>document.documentElement.dataset.fcIphoneDensity==='v32');

  const metrics=await page.evaluate(()=>{
    const summary=document.querySelector('#today .fc31-summary');
    const focus=document.querySelector('#today .fc9-focus');
    const firstRow=document.querySelector('#today .fc9-row');
    const eventMain=document.querySelector('#today [data-event] .fc9-row-main');
    const stat=[...document.querySelectorAll('#today .fc31-stat')];
    return {
      density:document.documentElement.dataset.fcIphoneDensity,
      dashboard:document.documentElement.dataset.fcIphoneDashboard,
      reference:document.documentElement.dataset.fcReferenceDesign,
      summaryHeight:summary?.getBoundingClientRect().height||0,
      summaryWidth:summary?.getBoundingClientRect().width||0,
      focusHeight:focus?.getBoundingClientRect().height||0,
      rowHeight:firstRow?.getBoundingClientRect().height||0,
      statCount:stat.length,
      statRoles:stat.map(x=>x.getAttribute('role')),
      statTab:stat.map(x=>x.tabIndex),
      eventTextAlign:eventMain?getComputedStyle(eventMain).textAlign:'none',
      overflow:document.documentElement.scrollWidth<=document.documentElement.clientWidth+1,
      professional:window.__fcProfessional?.version||''
    };
  });
  console.log('iphone-density-v33',JSON.stringify(metrics));
  assert.equal(metrics.density,'v32');
  assert.equal(metrics.dashboard,'v31','V9.31 dashboard contract must remain available');
  assert.equal(metrics.reference,'v33');
  assert.equal(metrics.professional,'9.33.0');
  assert.equal(metrics.overflow,true);
  assert.equal(metrics.statCount,3);
  assert.deepEqual(metrics.statRoles,['button','button','button']);
  assert.deepEqual(metrics.statTab,[0,0,0]);
  assert.ok(metrics.summaryHeight>30&&metrics.summaryHeight<=44,`summary must remain compact: ${metrics.summaryHeight}`);
  assert.ok(metrics.focusHeight<=58,`focus strip must not dominate the iPhone screen: ${metrics.focusHeight}`);
  if(metrics.rowHeight)assert.ok(metrics.rowHeight>=40&&metrics.rowHeight<=82,`first dashboard row has unexpected height: ${metrics.rowHeight}`);
  if(metrics.eventTextAlign!=='none')assert.equal(metrics.eventTextAlign,'left','calendar entries must scan left-to-right');

  const eventStat=page.locator('#today [data-fc31="events"]');
  await eventStat.click();
  await page.waitForFunction(()=>document.querySelector('#events')?.classList.contains('active'));
  assert.equal(await page.locator('#events').evaluate(x=>x.classList.contains('active')),true,'Termine summary must open the calendar');

  await browser.close();
  console.log('V9.33 iPhone density regression: ok');
} finally {server.kill('SIGTERM')}
