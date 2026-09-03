import { webkit } from 'playwright';
import { spawn } from 'node:child_process';
import { readFileSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';

const PORT=4208,BASE=`http://127.0.0.1:${PORT}`,OUT='family-command/e2e-artifacts-v958';
const seed=readFileSync('family-command/e2e/mock-private-core.js','utf8');
mkdirSync(OUT,{recursive:true});
const server=spawn('python3',['-m','http.server',String(PORT),'--directory','family-command'],{stdio:['ignore','pipe','pipe']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<60;i++){try{if((await fetch(BASE+'/index.html')).ok)return}catch{}await sleep(100)}throw new Error('server not ready')}
async function boot(browser,viewport,mobile=false){const ctx=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,serviceWorkers:'block'});await ctx.addInitScript({content:seed});const page=await ctx.newPage();await page.goto(BASE+'/?access=test',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.documentElement.dataset.fcReady==='1');await page.waitForFunction(()=>[...document.styleSheets].some(s=>String(s.href||'').includes('v9-unified-design-v958.css')));return{ctx,page}}
async function snapCore(page,prefix){const renderedHeight=page.viewportSize()?.height||0;for(const id of ['today','tomorrow','events','homework','more']){await page.locator(`.fc9-nav button[data-screen="${id}"]`).click();await page.waitForTimeout(120);const m=await page.evaluate(id=>{const root=document.getElementById(id),nav=document.querySelector('.fc9-nav'),r=nav.getBoundingClientRect();return{id,active:root.classList.contains('active'),overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,navTop:r.top,navBottom:r.bottom,navHeight:r.height,h1:parseFloat(getComputedStyle(root.querySelector('.fc9-pagehead h1')||root.querySelector('h1')).fontSize)||0}},id);assert.equal(m.active,true);assert.equal(m.overflow,false,`${id} must not overflow`);assert.ok(m.navTop>=0&&m.navBottom<=renderedHeight+1,`${id} navigation must stay inside rendered viewport (${m.navTop}-${m.navBottom} / ${renderedHeight})`);assert.ok(m.navHeight>=44&&m.navHeight<=100,`${id} navigation height must remain usable and compact`);await page.screenshot({path:`${OUT}/${prefix}-${id}.png`,fullPage:false})}}
async function snapFeature(page,selector,name,closeSelector){await page.locator('.fc9-nav button[data-screen="more"]').click();await page.waitForSelector(selector);await page.locator(selector).click();await page.waitForTimeout(120);const m=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1}));assert.equal(m.overflow,false,`${name} must not overflow root`);await page.screenshot({path:`${OUT}/iphone-${name}.png`,fullPage:false});await page.locator(closeSelector).click();await page.waitForTimeout(80)}
try{
 await ready();const browser=await webkit.launch({headless:true});
 const mobile=await boot(browser,{width:390,height:844},true);await snapCore(mobile.page,'iphone');
 await snapFeature(mobile.page,'#more [data-fc-shopping]','shopping','.fc-shopping-close');
 await snapFeature(mobile.page,'#more [data-fc-meals]','meals','.fc-meal-close');
 await snapFeature(mobile.page,'#more [data-fc-recipes]','recipes','.fc-recipes-close');
 await snapFeature(mobile.page,'#more [data-fc-budget]','budget','.fc-budget-close');
 await snapFeature(mobile.page,'#more [data-fc-contacts]','contacts','.fc-contacts-close');
 await mobile.ctx.close();
 const desktop=await boot(browser,{width:1440,height:1000});await snapCore(desktop.page,'desktop');
 await desktop.page.locator('.fc9-nav button[data-screen="more"]').click();const more=await desktop.page.evaluate(()=>{const grid=document.querySelector('#more .fc9-more-grid'),r=grid.getBoundingClientRect();return{w:r.width,cols:getComputedStyle(grid).gridTemplateColumns,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1}});assert.equal(more.overflow,false);assert.ok(more.w>=800);assert.match(more.cols,/px.*px.*px.*px/);await desktop.page.screenshot({path:`${OUT}/desktop-more-full.png`,fullPage:false});
 await desktop.ctx.close();await browser.close();console.log('V9.58 visual audit: ok');
}finally{server.kill('SIGTERM')}
