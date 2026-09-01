import { webkit } from 'playwright';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const PORT=4197,BASE=`http://127.0.0.1:${PORT}`;
const seed=readFileSync('family-command/e2e/mock-private-core.js','utf8');
const server=spawn('python3',['-m','http.server',String(PORT),'--directory','family-command'],{stdio:['ignore','pipe','pipe']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<60;i++){try{if((await fetch(BASE+'/index.html')).ok)return}catch{}await sleep(100)}throw new Error('server not ready')}
try{
 await ready();const browser=await webkit.launch({headless:true});const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});await ctx.addInitScript({content:seed});const page=await ctx.newPage();await page.goto(BASE+'/?access=test',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.documentElement.dataset.fcReady==='1');await page.waitForFunction(()=>document.documentElement.dataset.fcGlobalDesign==='v37');
 const before=await page.evaluate(()=>JSON.stringify({todos:data.todos,events:data.events,homework:data.homework,people:data.people,schedules:data.schedules}));
 const screens=['today','tomorrow','events','homework','more'];const metrics={};
 for(const id of screens){await page.locator(`.fc9-nav button[data-screen="${id}"]`).click();await page.waitForTimeout(80);metrics[id]=await page.evaluate(id=>{const s=document.getElementById(id);const h=s.querySelector('.fc9-pagehead h1');const cards=[...s.querySelectorAll('.fc9-card')];const rows=[...s.querySelectorAll('.fc9-row,.fc9-person')];return{active:s.classList.contains('active'),overflow:document.documentElement.scrollWidth<=document.documentElement.clientWidth+1,h1:h?parseFloat(getComputedStyle(h).fontSize):0,maxCardRadius:cards.length?Math.max(...cards.map(x=>parseFloat(getComputedStyle(x).borderRadius)||0)):0,maxRow:rows.length?Math.max(...rows.slice(0,8).map(x=>x.getBoundingClientRect().height)):0,mainPadding:parseFloat(getComputedStyle(document.querySelector('.fc9-main')).paddingLeft)||0};},id)}
 const after=await page.evaluate(()=>JSON.stringify({todos:data.todos,events:data.events,homework:data.homework,people:data.people,schedules:data.schedules}));
 console.log('global-design-v37',JSON.stringify(metrics));assert.equal(before,after,'visual design must not mutate family state');
 for(const [id,m] of Object.entries(metrics)){assert.equal(m.active,true,`${id} must render`);assert.equal(m.overflow,true,`${id} must not overflow horizontally`);if(id!=='today')assert.ok(m.h1>0&&m.h1<=25,`${id} page title too large: ${m.h1}`);assert.ok(m.maxCardRadius<=12,`${id} cards should be reference-like, not oversized rounded tiles: ${m.maxCardRadius}`);assert.ok(m.mainPadding<=10,`${id} should use dense mobile gutters: ${m.mainPadding}`)}
 assert.ok(metrics.tomorrow.maxRow===0||metrics.tomorrow.maxRow<=55,`tomorrow rows too tall: ${metrics.tomorrow.maxRow}`);assert.ok(metrics.events.maxRow===0||metrics.events.maxRow<=55,`calendar rows too tall: ${metrics.events.maxRow}`);assert.ok(metrics.homework.maxRow===0||metrics.homework.maxRow<=55,`task rows too tall: ${metrics.homework.maxRow}`);
 await browser.close();console.log('V9.37 global mobile design regression: ok');
}finally{server.kill('SIGTERM')}
