import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const base='http://127.0.0.1:4217';
const server=spawn(process.platform==='win32'?'python':'python3',['-m','http.server','4217','--directory','family-command'],{stdio:'ignore'});
let browser;
try {
  for(let i=0;i<60;i++){try{if((await fetch(base)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
  browser=await chromium.launch({headless:true});
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await context.addInitScript({content:`if(!localStorage.getItem('family-command-personal-v4')){${readFileSync('family-command/e2e/mock-private-core.js','utf8')}}`});
  await context.route('https://lmrvapstojcecljjdgds.supabase.co/**',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,commands:[],documents:[],snapshots:[],skipped:true})}));
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/?access=test');
  await page.waitForFunction(()=>document.documentElement.dataset.fcReady==='1'&&!!navigator.serviceWorker.controller);
  await page.evaluate(()=>window.__fcLoadExtrasNow());
  assert.ok((await page.evaluate(()=>caches.keys())).includes('family-command-v110'));
  await context.setOffline(true);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.fcReady==='1'&&window.__fcTomorrowCalendarV9674);
  for(const screen of ['tomorrow','events','homework','more','today']){
    await page.locator(`.fc9-nav [data-screen="${screen}"]`).tap();
    assert.equal(await page.locator('.fc9-screen.active').getAttribute('id'),screen);
  }
  await page.locator('.fc-search-entry').tap();
  await page.getByRole('searchbox',{name:'Suchbegriff',exact:true}).fill('Kind A');
  assert.match(await page.locator('.fc-search-results').innerText(),/Kind A/,'search scripts and styles must survive offline reload');
  await page.getByRole('button',{name:'Suche schliessen'}).tap();
  assert.deepEqual(errors,[],'offline reload must not produce unhandled boot errors');
  await context.setOffline(false);await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.fcReady==='1'&&window.__fcV9);
  assert.equal(await page.title(),'Familienzentrale');
  console.log('PASS real service-worker warm install, offline reload, navigation and reconnect');
} finally {await browser?.close();server.kill();}
