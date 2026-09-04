import { webkit } from 'playwright';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const PORT=4197;
const BASE=`http://127.0.0.1:${PORT}`;
const seed=readFileSync('family-command/e2e/mock-private-core.js','utf8');
const server=spawn('python3',['-m','http.server',String(PORT),'--directory','family-command'],{stdio:['ignore','pipe','pipe']});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function ready(){for(let i=0;i<50;i++){try{const r=await fetch(`${BASE}/index.html`);if(r.ok)return}catch{}await sleep(100)}throw new Error('local server not ready')}

try{
  await ready();
  const browser=await webkit.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.addInitScript({content:seed});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(String(error?.stack||error)));
  await page.goto(`${BASE}/?access=test`,{waitUntil:'domcontentloaded',timeout:15000});
  await page.waitForFunction(()=>document.documentElement.dataset.fcReady==='1'&&window.__fcFamilyContacts?.health?.().stableTile===true,{timeout:12000});

  // Immediate tap in the same task as the first More render. This reproduces the former race before
  // the MutationObserver had time to replace the base V9 tile handler.
  await page.evaluate(()=>{
    window.openScreen('more');
    document.querySelector('#more [data-feature="people"]')?.click();
  });
  await page.waitForSelector('#people.active #fcContactsModal',{timeout:5000});
  assert.equal(await page.locator('#fcContactsModal h2').innerText(),'Personen & Kontakte');
  await page.click('#fcContactsModal [data-back]');
  await page.waitForFunction(()=>document.querySelector('#more')?.classList.contains('active'));

  // A stable subtitle must not rewrite itself every 20 ms and retrigger its own observer.
  const mutationCount=await page.evaluate(async()=>{
    window.openScreen('more');
    const span=document.querySelector('#more [data-feature="people"] span');
    if(!span)throw new Error('people tile subtitle missing');
    await new Promise(resolve=>setTimeout(resolve,80));
    let count=0;
    const observer=new MutationObserver(records=>{count+=records.length});
    observer.observe(span,{childList:true,subtree:true,characterData:true});
    await new Promise(resolve=>setTimeout(resolve,220));
    observer.disconnect();
    return count;
  });
  assert.equal(mutationCount,0,'contact tile subtitle must settle instead of creating a self-triggering mutation loop');

  const health=await page.evaluate(()=>window.__fcFamilyContacts.health());
  assert.equal(health.stableTile,true);
  assert.equal(health.delegatedRouting,true);
  assert.deepEqual(errors,[]);

  await context.close();
  await browser.close();
  console.log('family contacts stability regression: ok');
} finally {
  server.kill('SIGTERM');
}
