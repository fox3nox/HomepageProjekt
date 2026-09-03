import { webkit } from 'playwright';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const PORT=4195,BASE=`http://127.0.0.1:${PORT}`;
const seed=readFileSync('family-command/e2e/mock-private-core.js','utf8');
const server=spawn('python3',['-m','http.server',String(PORT),'--directory','family-command'],{stdio:['ignore','pipe','pipe']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<60;i++){try{if((await fetch(BASE+'/index.html')).ok)return}catch{}await sleep(100)}throw new Error('server not ready')}

async function boot(browser,viewport,mobile=false){
  const ctx=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,serviceWorkers:'block'});
  await ctx.addInitScript({content:seed});
  const page=await ctx.newPage();
  await page.goto(BASE+'/?access=test',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.fcReady==='1'&&window.__fcV9&&window.__fcShoppingLists?.version==='9.53.0',{timeout:20000});
  return {ctx,page};
}

try{
  await ready();
  const browser=await webkit.launch({headless:true});
  const {ctx,page}=await boot(browser,{width:390,height:844},true);

  await page.locator('.fc9-nav button[data-screen="more"]').click();
  await page.waitForSelector('#more [data-fc-shopping]');
  assert.match(await page.locator('#more [data-fc-shopping]').innerText(),/Einkaufen & Listen/);
  await page.locator('#more [data-fc-shopping]').click();
  await page.waitForSelector('#fcShoppingModal .fc-shopping-shell');

  let layout=await page.evaluate(()=>{
    const modal=document.querySelector('#fcShoppingModal'),shell=document.querySelector('.fc-shopping-shell'),buttons=[...modal.querySelectorAll('button')].filter(b=>{const r=b.getBoundingClientRect();return r.width>0&&r.height>0});
    return {overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,shellW:shell.getBoundingClientRect().width,viewport:innerWidth,minButton:Math.min(...buttons.map(b=>b.getBoundingClientRect().height)),tabs:document.querySelectorAll('[data-shopping-list]').length,title:document.querySelector('.fc-shopping-title h3')?.textContent||'',health:window.__fcShoppingLists.health()};
  });
  console.log('shopping-v953-mobile-initial',JSON.stringify(layout));
  assert.equal(layout.overflow,false);assert.ok(layout.shellW<=390);assert.ok(layout.minButton>=44);assert.equal(layout.tabs,1);assert.equal(layout.title,'Einkauf');assert.equal(layout.health.cloudCompatible,true);assert.equal(layout.health.objectMergeModel,true);

  await page.locator('#fcShoppingNewItem').fill('Äpfel');
  await page.locator('.fc-shopping-add button').click();
  await page.waitForSelector('#fcShoppingEdit');
  await page.locator('#fcShopQty').fill('2 kg');
  await page.locator('#fcShopCat').selectOption({label:'Lebensmittel'});
  const personOptions=await page.locator('#fcShopPerson option').evaluateAll(opts=>opts.map(o=>({value:o.value,text:o.textContent})));
  const targetPerson=personOptions.find(o=>o.value!=='all');
  if(targetPerson)await page.locator('#fcShopPerson').selectOption(targetPerson.value);
  await page.locator('#fcShoppingEdit [data-save]').click();
  await page.waitForSelector('.fc-shopping-item');

  let state=await page.evaluate(()=>{const s=data.shopping,l=s.lists[s.activeListId],rows=Object.values(l.items||{}).filter(x=>x&&!x.archived);return{lists:Object.values(s.lists||{}).filter(x=>x&&!x.archived).length,rows:rows.map(x=>({title:x.title,quantity:x.quantity,category:x.category,personId:x.personId,done:x.done})),tile:document.querySelector('#more [data-fc-shopping] span')?.textContent||''}});
  console.log('shopping-v953-after-add',JSON.stringify(state));
  assert.equal(state.lists,1);assert.equal(state.rows.length,1);assert.equal(state.rows[0].title,'Äpfel');assert.equal(state.rows[0].quantity,'2 kg');assert.equal(state.rows[0].category,'Lebensmittel');assert.equal(state.rows[0].done,false);assert.match(state.tile,/1 offen/);

  await page.locator('.fc-shopping-item .fc-shopping-check').click();
  await page.waitForFunction(()=>{const s=data.shopping,l=s.lists[s.activeListId],x=Object.values(l.items||{})[0];return x?.done===true});
  assert.ok(await page.locator('.fc-shopping-done summary').isVisible());
  assert.match(await page.locator('.fc-shopping-done summary').innerText(),/Erledigt \(1\)/);
  assert.match(await page.locator('#more [data-fc-shopping] span').innerText(),/0 offen/);

  await page.locator('.fc-shopping-new-list').click();
  await page.locator('#fcShopListName').fill('Drogerie');
  await page.locator('#fcShoppingEdit [data-save]').click();
  await page.waitForFunction(()=>document.querySelectorAll('[data-shopping-list]').length===2);
  assert.equal(await page.locator('.fc-shopping-title h3').innerText(),'Drogerie');
  await page.locator('#fcShoppingNewItem').fill('Zahnpasta');
  await page.locator('.fc-shopping-add button').click();
  await page.locator('#fcShopCat').selectOption({label:'Drogerie'});
  await page.locator('#fcShoppingEdit [data-save]').click();
  await page.waitForFunction(()=>window.__fcShoppingLists.health().openItems===1);

  const firstTab=page.locator('[data-shopping-list]').filter({hasText:'Einkauf'}).first();
  await firstTab.click();
  assert.equal(await page.locator('.fc-shopping-title h3').innerText(),'Einkauf');
  assert.ok(await page.locator('.fc-shopping-done summary').isVisible());

  // Delete/archive an item and ensure it does not reappear after render.
  await page.locator('.fc-shopping-done summary').click();
  await page.locator('.fc-shopping-done .fc-shopping-edit').click();
  await page.waitForSelector('#fcShoppingEdit [data-remove]');
  page.on('dialog',d=>d.accept());
  await page.locator('#fcShoppingEdit [data-remove]').click();
  await page.waitForFunction(()=>document.querySelectorAll('.fc-shopping-item').length===0);
  const archived=await page.evaluate(()=>{const s=data.shopping,l=s.lists[s.activeListId];return Object.values(l.items||{}).filter(x=>x?.archived).length});
  assert.equal(archived,1);

  await ctx.close();

  const desktop=await boot(browser,{width:1440,height:1000},false);
  await desktop.page.locator('.fc9-nav button[data-screen="more"]').click();
  await desktop.page.waitForSelector('#more [data-fc-shopping]');
  await desktop.page.locator('#more [data-fc-shopping]').click();
  await desktop.page.waitForSelector('#fcShoppingModal .fc-shopping-shell');
  const d=await desktop.page.evaluate(()=>{const shell=document.querySelector('.fc-shopping-shell').getBoundingClientRect(),layout=getComputedStyle(document.querySelector('.fc-shopping-layout'));return{w:shell.width,h:shell.height,left:shell.left,right:shell.right,viewport:innerWidth,cols:layout.gridTemplateColumns,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1}});
  console.log('shopping-v953-desktop',JSON.stringify(d));
  assert.equal(d.overflow,false);assert.ok(d.w>=760&&d.w<=1000);assert.ok(d.left>0&&d.right<d.viewport);assert.match(d.cols,/220px/);
  await desktop.ctx.close();
  await browser.close();
  console.log('V9.53 shopping lists regression: ok');
} finally {server.kill('SIGTERM')}
