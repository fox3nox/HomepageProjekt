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
 const d=await p.evaluate(()=>{const nav=getComputedStyle(document.querySelector('.fc9-nav')),main=document.querySelector('.fc9-main').getBoundingClientRect(),page=getComputedStyle(document.querySelector('#today .fc9-page'));return{navPos:nav.position,navWidth:parseFloat(nav.width),mainLeft:main.left,cols:page.gridTemplateColumns,overflow:document.documentElement.scrollWidth<=document.documentElement.clientWidth+1}});
 assert.equal(d.navPos,'fixed'); assert.ok(d.navWidth>=210&&d.navWidth<=235); assert.ok(d.mainLeft>=220); assert.ok(d.cols.split(' ').length>=2); assert.equal(d.overflow,true);
 const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'}); await mobile.addInitScript({content:seed}); const m=await mobile.newPage(); await m.goto(BASE+'/?access=test',{waitUntil:'domcontentloaded'}); await m.waitForFunction(()=>document.documentElement.dataset.fcReady==='1'); const x=await m.evaluate(()=>{const nav=getComputedStyle(document.querySelector('.fc9-nav')),shell=getComputedStyle(document.querySelector('.fc9-shell'));return{bottom:nav.bottom,left:nav.left,right:nav.right,paddingLeft:shell.paddingLeft,overflow:document.documentElement.scrollWidth<=document.documentElement.clientWidth+1}}); assert.equal(x.bottom,'0px'); assert.equal(x.left,'0px'); assert.equal(x.right,'0px'); assert.equal(parseFloat(x.paddingLeft),0); assert.equal(x.overflow,true);
 await browser.close(); console.log('dashboard redesign regression: ok');
} finally {server.kill('SIGTERM')}
