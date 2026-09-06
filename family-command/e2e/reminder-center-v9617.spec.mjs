import { webkit } from 'playwright';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const PORT=4217,BASE=`http://127.0.0.1:${PORT}`;
const rawSeed=readFileSync('family-command/e2e/mock-private-core.js','utf8');
const seed=rawSeed.replace('reminders:[],',`reminders:[
  {id:'daily-a',personId:'child-a',days:[1,2,3,4,5],items:['Rucksack','Znüni-Box']},
  {id:'wed-c',personId:'child-c',days:[3],items:['Turnschuhe','Trinkflasche']}
],`);
const server=spawn('python3',['-m','http.server',String(PORT),'--directory','family-command'],{stdio:['ignore','pipe','pipe']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<60;i++){try{if((await fetch(BASE+'/index.html')).ok)return}catch{}await sleep(100)}throw Error('server not ready')}

try{
  await ready();
  const browser=await webkit.launch({headless:true});
  const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await ctx.addInitScript({content:seed});
  const page=await ctx.newPage();
  await page.goto(BASE+'/?access=test',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.fcReady==='1'&&window.__fcReminderCenter?.version==='9.61.7',{timeout:20000});
  await page.locator('.fc9-nav button[data-screen="more"]').click();
  const tile=page.locator('#more [data-feature="push"]');
  await tile.waitFor();
  await page.waitForFunction(()=>document.querySelector('#more [data-feature="push"]')?.textContent.includes('2 Merklisten'));
  assert.match(await tile.innerText(),/2 Merklisten/);
  await tile.click();
  await page.waitForSelector('#fcReminderCenter');
  const health=await page.evaluate(()=>window.__fcReminderCenter.health());
  assert.equal(health.groups,2);
  assert.equal(health.items,4);
  assert.equal(health.readOnlyRules,true);
  assert.equal(await page.locator('.fc-reminder-group').count(),2);
  assert.match(await page.locator('#fcReminderCenter').innerText(),/Kind A/);
  assert.match(await page.locator('#fcReminderCenter').innerText(),/Mo–Fr/);
  assert.match(await page.locator('#fcReminderCenter').innerText(),/Rucksack/);
  assert.match(await page.locator('#fcReminderCenter').innerText(),/Znüni-Box/);
  assert.match(await page.locator('#fcReminderCenter').innerText(),/Kind C/);
  assert.match(await page.locator('#fcReminderCenter').innerText(),/Mi/);
  assert.match(await page.locator('#fcReminderCenter').innerText(),/Turnschuhe/);
  const layout=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,pushHeight:document.querySelector('#fcReminderCenter [data-push]').getBoundingClientRect().height}));
  assert.equal(layout.overflow,false);
  assert.ok(layout.pushHeight>=44);
  await page.locator('#fcReminderCenter [data-close]').click();
  assert.equal(await page.locator('#fcReminderCenter').count(),0);
  await ctx.close();await browser.close();
  console.log('V9.61.7 reminder center regression: ok');
}finally{server.kill('SIGTERM')}
