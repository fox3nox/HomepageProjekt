import { webkit } from 'playwright';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const PORT=4198,BASE=`http://127.0.0.1:${PORT}`;
const seed=readFileSync('family-command/e2e/mock-private-core.js','utf8');
const server=spawn('python3',['-m','http.server',String(PORT),'--directory','family-command'],{stdio:['ignore','pipe','pipe']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<60;i++){try{if((await fetch(BASE+'/index.html')).ok)return}catch{}await sleep(100)}throw new Error('server not ready')}
async function boot(browser,viewport,mobile=false){const ctx=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,serviceWorkers:'block'});await ctx.addInitScript({content:seed});const page=await ctx.newPage();await page.goto(BASE+'/?access=test',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.documentElement.dataset.fcReady==='1'&&window.__fcV9&&window.__fcFamilyBudget&&window.fcEditEventDetails,{timeout:20000});return{ctx,page}}
try{
 await ready();const browser=await webkit.launch({headless:true});
 const mobile=await boot(browser,{width:390,height:844},true);const page=mobile.page;
 await page.evaluate(()=>window.fcOpenFamilyBudget());await page.waitForSelector('.fc-budget-shell');await page.locator('[data-add-expense]').click();await page.waitForSelector('.fc-budget-edit-sheet');
 const budget=await page.evaluate(()=>{const sheet=document.querySelector('.fc-budget-edit-sheet'),inputs=[...sheet.querySelectorAll('input,select,textarea')],buttons=[...sheet.querySelectorAll('button')].filter(x=>x.getBoundingClientRect().width);const s=getComputedStyle(inputs.find(x=>x.tagName==='INPUT'));return{w:sheet.getBoundingClientRect().width,maxH:sheet.getBoundingClientRect().height,fieldH:Math.min(...inputs.map(x=>x.getBoundingClientRect().height)),buttonH:Math.min(...buttons.map(x=>x.getBoundingClientRect().height)),radius:parseFloat(getComputedStyle(sheet).borderRadius),focusRing:s.getPropertyValue('border-radius'),overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1}});
 console.log('form-dialog-v960-budget',JSON.stringify(budget));assert.equal(budget.overflow,false);assert.ok(budget.w<=390);assert.ok(budget.fieldH>=48);assert.ok(budget.buttonH>=44);assert.ok(budget.radius>=20);
 await page.locator('#fcBudgetEdit [data-cancel]').click();await page.evaluate(()=>{document.getElementById('fcBudgetModal')?.remove();window.fcEditEventDetails('care-fixture')});await page.waitForSelector('.fc-event-edit-sheet');
 const event=await page.evaluate(()=>{const sheet=document.querySelector('.fc-event-edit-sheet'),controls=[...sheet.querySelectorAll('input,select,textarea')],save=sheet.querySelector('.fc-event-edit-save'),close=sheet.querySelector('.fc-event-edit-close');return{w:sheet.getBoundingClientRect().width,fieldH:Math.min(...controls.map(x=>x.getBoundingClientRect().height)),saveH:save.getBoundingClientRect().height,closeW:close.getBoundingClientRect().width,closeH:close.getBoundingClientRect().height,radius:parseFloat(getComputedStyle(sheet).borderRadius),overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1}});
 console.log('form-dialog-v960-event',JSON.stringify(event));assert.equal(event.overflow,false);assert.ok(event.w<=390);assert.ok(event.fieldH>=48);assert.ok(event.saveH>=46);assert.ok(event.closeW>=44&&event.closeH>=44);assert.ok(event.radius>=20);
 await mobile.ctx.close();
 const desktop=await boot(browser,{width:1440,height:1000});await desktop.page.evaluate(()=>window.fcEditEventDetails('care-fixture'));await desktop.page.waitForSelector('.fc-event-edit-sheet');const d=await desktop.page.evaluate(()=>{const r=document.querySelector('.fc-event-edit-sheet').getBoundingClientRect();return{w:r.width,left:r.left,right:r.right,radius:parseFloat(getComputedStyle(document.querySelector('.fc-event-edit-sheet')).borderRadius),overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1}});console.log('form-dialog-v960-desktop',JSON.stringify(d));assert.equal(d.overflow,false);assert.ok(d.w>=500&&d.w<=620);assert.ok(d.left>0&&d.right<1440);assert.ok(d.radius>=24);await desktop.ctx.close();await browser.close();console.log('V9.60 form dialog regression: ok');
} finally {server.kill('SIGTERM')}
