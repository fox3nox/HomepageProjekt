import { webkit } from 'playwright';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const PORT=4199,BASE=`http://127.0.0.1:${PORT}`;
const seed=readFileSync('family-command/e2e/mock-private-core.js','utf8');
const server=spawn('python3',['-m','http.server',String(PORT),'--directory','family-command'],{stdio:['ignore','pipe','pipe']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<60;i++){try{if((await fetch(BASE+'/index.html')).ok)return}catch{}await sleep(100)}throw new Error('server not ready')}
try{
  await ready();
  const browser=await webkit.launch({headless:true});
  const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await ctx.addInitScript({content:seed});
  const page=await ctx.newPage();
  await page.goto(BASE+'/?access=test',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.fcReady==='1'&&typeof window.fcEditEventDetails==='function',{timeout:20000});

  // Intended autofocus still works when the user has not touched the form.
  await page.evaluate(()=>window.fcEditEventDetails('care-fixture'));
  await page.waitForSelector('#fcEventEditName');
  await page.waitForTimeout(60);
  assert.equal(await page.evaluate(()=>document.activeElement?.id),'fcEventEditName');
  await page.locator('#fcEventEdit .fc-event-edit-cancel').click();

  // Reproduce the old race deterministically: focus the note before the 30 ms timer fires.
  await page.evaluate(()=>{
    window.fcEditEventDetails('care-fixture');
    document.querySelector('#fcEventEditNote')?.focus();
  });
  await page.waitForSelector('#fcEventEditNote');
  await page.waitForTimeout(70);
  assert.equal(await page.evaluate(()=>document.activeElement?.id),'fcEventEditNote','delayed title autofocus must not steal focus from a field the user already selected');

  await page.locator('#fcEventEditName').fill('Betreuungstermin bearbeitet');
  await page.locator('#fcEventEditNote').fill('V9.12 Edit-Test');
  await page.locator('#fcEventEdit .fc-event-edit-save').click();
  await page.waitForSelector('#fcEventEdit',{state:'detached'});
  const saved=await page.evaluate(()=>{
    const local=JSON.parse(localStorage.getItem('family-command-personal-v4')||'{}');
    return local.events?.find(e=>e.id==='care-fixture')||null;
  });
  assert.equal(saved?.title,'Betreuungstermin bearbeitet');
  assert.equal(saved?.note,'V9.12 Edit-Test');

  await ctx.close();await browser.close();
  console.log('event editor focus race regression: ok');
} finally {server.kill('SIGTERM')}
