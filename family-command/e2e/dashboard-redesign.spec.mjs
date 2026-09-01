import { webkit } from 'playwright';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const PORT=4186,BASE=`http://127.0.0.1:${PORT}`;
const seed=readFileSync('family-command/e2e/mock-private-core.js','utf8');
const server=spawn('python3',['-m','http.server',String(PORT),'--directory','family-command'],{stdio:['ignore','pipe','pipe']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<40;i++){try{const r=await fetch(BASE+'/index.html');if(r.ok)return}catch{}await sleep(100)}throw new Error('server not ready')}
try{
 await ready(); const browser=await webkit.launch({headless:true});
 const desktop=await browser.newContext({viewport:{width:1366,height:900},serviceWorkers:'block'}); await desktop.addInitScript({content:seed}); const p=await desktop.newPage(); await p.goto(BASE+'/?access=test',{waitUntil:'domcontentloaded'}); await p.waitForFunction(()=>document.documentElement.dataset.fcReady==='1');
 const d=await p.evaluate(()=>{const nav=document.querySelector('.fc9-nav').getBoundingClientRect(),main=document.querySelector('.fc9-main').getBoundingClientRect(),page=document.querySelector('#today .fc9-page').getBoundingClientRect(),style=getComputedStyle(document.querySelector('.fc9-nav'));return{navX:nav.x,navW:nav.width,navH:nav.height,mainX:main.x,pageW:page.width,position:style.position,overflow:document.documentElement.scrollWidth<=document.documentElement.clientWidth+1}});
 console.log('desktop',JSON.stringify(d)); assert.equal(d.position,'fixed'); assert.ok(d.navX<=1&&d.navW>=205&&d.navW<=240,`desktop sidebar ${JSON.stringify(d)}`); assert.ok(d.mainX>=200,`desktop content offset ${JSON.stringify(d)}`); assert.ok(d.pageW>=700,`desktop canvas ${JSON.stringify(d)}`); assert.equal(d.overflow,true,`desktop overflow ${JSON.stringify(d)}`);
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'}); await mobile.addInitScript({content:seed}); const m=await mobile.newPage(); await m.goto(BASE+'/?access=test',{waitUntil:'domcontentloaded'}); await m.waitForFunction(()=>document.documentElement.dataset.fcReady==='1'); const x=await m.evaluate(()=>{const nav=document.querySelector('.fc9-nav').getBoundingClientRect(),shell=document.querySelector('.fc9-shell').getBoundingClientRect();return{navX:nav.x,navBottom:nav.bottom,navW:nav.width,shellX:shell.x,shellW:shell.width,innerW:innerWidth,innerH:innerHeight,overflow:document.documentElement.scrollWidth<=document.documentElement.clientWidth+1}}); console.log('mobile',JSON.stringify(x)); assert.ok(x.navX<=1&&Math.abs(x.navW-x.innerW)<=2,`mobile nav width ${JSON.stringify(x)}`); assert.ok(Math.abs(x.navBottom-x.innerH)<=2,`mobile nav bottom ${JSON.stringify(x)}`); assert.ok(x.shellX<=1&&Math.abs(x.shellW-x.innerW)<=2,`mobile shell ${JSON.stringify(x)}`); assert.equal(x.overflow,true,`mobile overflow ${JSON.stringify(x)}`);
 await browser.close(); console.log('dashboard redesign regression: ok');
} finally {server.kill('SIGTERM')}
