import { webkit } from 'playwright';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const PORT=4182,BASE=`http://127.0.0.1:${PORT}`;
const seed=readFileSync('family-command/e2e/mock-private-core.js','utf8');
const server=spawn('python3',['-m','http.server',String(PORT),'--directory','family-command'],{stdio:['ignore','pipe','pipe']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<40;i++){try{const r=await fetch(BASE+'/index.html');if(r.ok)return}catch{}await sleep(100)}throw new Error('local server not ready')}

try{
  await ready();
  const browser=await webkit.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.addInitScript({content:seed});
  const page=await context.newPage();
  await page.goto(BASE+'/?access=test',{waitUntil:'domcontentloaded',timeout:15000});
  await page.waitForFunction(()=>document.documentElement.dataset.fcReady==='1'&&window.__fcCloudState?.health?.().visibleSyncStatus===true,{timeout:10000});
  await page.waitForSelector('#fcCloudStatus',{state:'visible',timeout:5000});
  assert.match((await page.locator('#fcCloudStatus').innerText()).trim(),/Gesichert/,'initial cloud status must show Gesichert');

  await page.evaluate(()=>window.__fcCloudState.schedule('e2e-status',1500));
  await page.waitForFunction(()=>document.querySelector('#fcCloudStatus')?.textContent.includes('Speichert'));
  assert.equal((await page.locator('#fcCloudStatus').getAttribute('data-tone')),'busy');

  await page.evaluate(()=>window.dispatchEvent(new Event('offline')));
  await page.waitForFunction(()=>document.querySelector('#fcCloudStatus')?.textContent.includes('Offline'));
  assert.equal((await page.locator('#fcCloudStatus').getAttribute('data-tone')),'offline');

  await page.evaluate(()=>window.dispatchEvent(new Event('online')));
  await page.waitForFunction(()=>document.querySelector('#fcCloudStatus')?.textContent.includes('Gesichert'));
  assert.equal((await page.locator('#fcCloudStatus').getAttribute('data-tone')),'ok');

  await browser.close();
  console.log('sync status regression: ok');
} finally {
  server.kill('SIGTERM');
}
