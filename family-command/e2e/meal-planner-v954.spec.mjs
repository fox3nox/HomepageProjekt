import { webkit } from 'playwright';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const PORT=4196,BASE=`http://127.0.0.1:${PORT}`;
const seed=readFileSync('family-command/e2e/mock-private-core.js','utf8');
const server=spawn('python3',['-m','http.server',String(PORT),'--directory','family-command'],{stdio:['ignore','pipe','pipe']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<60;i++){try{if((await fetch(BASE+'/index.html')).ok)return}catch{}await sleep(100)}throw new Error('server not ready')}
async function boot(browser,viewport,mobile=false){const ctx=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,serviceWorkers:'block'});await ctx.addInitScript({content:seed});const page=await ctx.newPage();await page.goto(BASE+'/?access=test',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.documentElement.dataset.fcReady==='1'&&window.__fcMealPlanner?.version==='9.54.0'&&window.__fcShoppingLists?.version==='9.53.0',{timeout:20000});return{ctx,page}}

try{
  await ready();
  const browser=await webkit.launch({headless:true});
  const {ctx,page}=await boot(browser,{width:390,height:844},true);
  await page.locator('.fc9-nav button[data-screen="more"]').click();
  await page.waitForSelector('#more [data-fc-meals]');
  assert.match(await page.locator('#more [data-fc-meals]').innerText(),/Mahlzeiten/);
  await page.locator('#more [data-fc-meals]').click();
  await page.waitForSelector('#fcMealModal .fc-meal-shell');

  const initial=await page.evaluate(()=>{const shell=document.querySelector('.fc-meal-shell').getBoundingClientRect(),buttons=[...document.querySelectorAll('#fcMealModal button')].filter(b=>{const r=b.getBoundingClientRect();return r.width&&r.height});return{overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,shellW:shell.width,days:document.querySelectorAll('.fc-meal-day').length,minButton:Math.min(...buttons.map(b=>b.getBoundingClientRect().height)),health:window.__fcMealPlanner.health()}});
  console.log('meal-v954-mobile-initial',JSON.stringify(initial));
  assert.equal(initial.overflow,false);assert.ok(initial.shellW<=390);assert.equal(initial.days,7);assert.ok(initial.minButton>=42);assert.equal(initial.health.shoppingIntegration,true);assert.equal(initial.health.cloudCompatible,true);assert.equal(initial.health.objectMergeModel,true);

  const todayDay=page.locator('.fc-meal-day.today');
  const dinner=todayDay.locator('[data-meal-type="dinner"]');
  await dinner.click();
  await page.waitForSelector('#fcMealEdit');
  await page.locator('#fcMealTitle').fill('Spaghetti Bolognese');
  await page.locator('#fcMealNote').fill('Familienessen');
  await page.locator('[data-add-ing]').click();
  let rows=page.locator('[data-ing-row]');
  await rows.nth(0).locator('[data-ing-name]').fill('Spaghetti');
  await rows.nth(0).locator('[data-ing-qty]').fill('500 g');
  await rows.nth(0).locator('[data-ing-cat]').selectOption({label:'Lebensmittel'});
  await page.locator('[data-add-ing]').click();
  rows=page.locator('[data-ing-row]');
  await rows.nth(1).locator('[data-ing-name]').fill('Tomatensauce');
  await rows.nth(1).locator('[data-ing-qty]').fill('2 Gläser');
  await page.locator('#fcMealEdit [data-save]').click();
  await page.waitForFunction(()=>window.__fcMealPlanner.health().planned===1);
  assert.match(await todayDay.locator('[data-meal-type="dinner"]').innerText(),/Spaghetti Bolognese/);
  assert.match(await page.locator('#more [data-fc-meals] span').innerText(),/1 geplant/);

  await todayDay.locator('[data-meal-type="dinner"]').click();
  await page.waitForSelector('#fcMealEdit [data-shop]');
  await page.locator('#fcMealEdit [data-shop]').click();
  await page.waitForFunction(()=>window.__fcShoppingLists.health().openItems===2);
  let shopping=await page.evaluate(()=>{const s=data.shopping,l=s.lists[s.activeListId];return Object.values(l.items||{}).filter(x=>x&&!x.archived&&!x.done).map(x=>({title:x.title,quantity:x.quantity,source:x.source,sourceMealId:x.sourceMealId}))});
  console.log('meal-v954-shopping',JSON.stringify(shopping));
  assert.deepEqual(shopping.map(x=>x.title).sort(),['Spaghetti','Tomatensauce']);assert.equal(shopping.every(x=>x.source==='meal-planner'),true);assert.ok(shopping.every(x=>x.sourceMealId));

  // Add the same ingredients again: open duplicates must be suppressed.
  await todayDay.locator('[data-meal-type="dinner"]').click();
  await page.locator('#fcMealEdit [data-shop]').click();
  await page.waitForTimeout(100);
  assert.equal((await page.evaluate(()=>window.__fcShoppingLists.health().openItems)),2);

  // Week navigation keeps a distinct object-map week.
  await page.locator('#fcMealModal [data-week="1"]').click();
  await page.waitForTimeout(80);
  assert.equal(await page.locator('.fc-meal-card.filled').count(),0);
  await page.locator('#fcMealModal [data-week="-1"]').click();
  await page.waitForTimeout(80);
  assert.equal(await page.locator('.fc-meal-card.filled').count(),1);

  // Delete the meal and verify it disappears without affecting shopping items.
  await page.locator('.fc-meal-day.today [data-meal-type="dinner"]').click();
  page.on('dialog',d=>d.accept());
  await page.locator('#fcMealEdit [data-delete]').click();
  await page.waitForFunction(()=>window.__fcMealPlanner.health().planned===0);
  assert.equal(await page.locator('.fc-meal-card.filled').count(),0);
  assert.equal(await page.evaluate(()=>window.__fcShoppingLists.health().openItems),2);
  await ctx.close();

  const desktop=await boot(browser,{width:1440,height:1000},false);
  await desktop.page.locator('.fc9-nav button[data-screen="more"]').click();
  await desktop.page.waitForSelector('#more [data-fc-meals]');
  await desktop.page.locator('#more [data-fc-meals]').click();
  await desktop.page.waitForSelector('#fcMealModal .fc-meal-shell');
  const d=await desktop.page.evaluate(()=>{const shell=document.querySelector('.fc-meal-shell').getBoundingClientRect(),days=getComputedStyle(document.querySelector('.fc-meal-days'));return{w:shell.width,h:shell.height,left:shell.left,right:shell.right,viewport:innerWidth,cols:days.gridTemplateColumns,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,dayCount:document.querySelectorAll('.fc-meal-day').length}});
  console.log('meal-v954-desktop',JSON.stringify(d));
  assert.equal(d.overflow,false);assert.ok(d.w>=1000&&d.w<=1180);assert.ok(d.left>0&&d.right<d.viewport);assert.equal(d.dayCount,7);assert.ok(d.cols.split(' ').length>=7);
  await desktop.ctx.close();await browser.close();
  console.log('V9.54 meal planner regression: ok');
} finally {server.kill('SIGTERM')}
