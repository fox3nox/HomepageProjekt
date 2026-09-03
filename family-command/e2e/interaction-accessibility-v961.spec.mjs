import { webkit } from 'playwright';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const PORT=4201,BASE=`http://127.0.0.1:${PORT}`;
const seed=readFileSync('family-command/e2e/mock-private-core.js','utf8');
const server=spawn('python3',['-m','http.server',String(PORT),'--directory','family-command'],{stdio:['ignore','pipe','pipe']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<60;i++){try{if((await fetch(BASE+'/index.html')).ok)return}catch{}await sleep(100)}throw new Error('server not ready')}
async function boot(browser,viewport,mobile=false){const ctx=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,serviceWorkers:'block'});await ctx.addInitScript({content:seed});const page=await ctx.newPage();await page.goto(BASE+'/?access=test',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.documentElement.dataset.fcReady==='1'&&window.__fcV9&&window.fcEditEventDetails,{timeout:20000});await page.waitForFunction(()=>getComputedStyle(document.documentElement).getPropertyValue('--fc61-focus').trim()==='#1b73e8',{timeout:10000});return{ctx,page}}
try{
  await ready();const browser=await webkit.launch({headless:true});

  const mobile=await boot(browser,{width:390,height:844},true),mp=mobile.page;
  await mp.evaluate(()=>window.fcEditEventDetails('care-fixture'));await mp.waitForSelector('.fc-event-edit-sheet');
  const mobileState=await mp.evaluate(()=>{const sheet=document.querySelector('.fc-event-edit-sheet'),controls=[...sheet.querySelectorAll('input,select,textarea')],close=sheet.querySelector('.fc-event-edit-close');return{css:getComputedStyle(document.documentElement).getPropertyValue('--fc61-focus').trim(),fontSizes:controls.map(x=>parseFloat(getComputedStyle(x).fontSize)),closeW:close.getBoundingClientRect().width,closeH:close.getBoundingClientRect().height,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1}});
  console.log('v961-mobile',JSON.stringify(mobileState));
  assert.equal(mobileState.css,'#1b73e8');assert.equal(mobileState.overflow,false);assert.ok(mobileState.fontSizes.every(x=>x>=16),`iPhone fields must be >=16px: ${mobileState.fontSizes}`);assert.ok(mobileState.closeW>=44&&mobileState.closeH>=44,`close target must be >=44px: ${mobileState.closeW}x${mobileState.closeH}`);
  await mobile.ctx.close();

  const desktop=await boot(browser,{width:1440,height:1000}),dp=desktop.page;
  await dp.evaluate(()=>{const b=document.createElement('button');b.id='fc61FocusProbe';b.textContent='Fokusprobe';b.style.position='fixed';b.style.left='12px';b.style.top='12px';b.style.zIndex='999999';document.body.prepend(b);document.body.setAttribute('tabindex','-1');document.body.focus()});
  await dp.keyboard.press('Tab');
  const focus=await dp.evaluate(()=>{const e=document.activeElement,s=getComputedStyle(e);return{id:e?.id||'',outlineStyle:s.outlineStyle,outlineWidth:parseFloat(s.outlineWidth)||0,outlineColor:s.outlineColor}});
  console.log('v961-focus',JSON.stringify(focus));assert.equal(focus.id,'fc61FocusProbe');assert.equal(focus.outlineStyle,'solid');assert.ok(focus.outlineWidth>=2);assert.equal(focus.outlineColor,'rgb(27, 115, 232)');

  const disabled=await dp.evaluate(()=>{const b=document.createElement('button');b.disabled=true;b.textContent='Disabled';document.body.appendChild(b);const s=getComputedStyle(b);return{opacity:parseFloat(s.opacity),cursor:s.cursor}});
  console.log('v961-disabled',JSON.stringify(disabled));assert.ok(disabled.opacity<=.5);assert.equal(disabled.cursor,'not-allowed');

  await dp.emulateMedia({reducedMotion:'reduce'});const motion=await dp.evaluate(()=>{const b=document.querySelector('#fc61FocusProbe'),s=getComputedStyle(b);return{transition:s.transitionDuration,animation:s.animationDuration}});console.log('v961-motion',JSON.stringify(motion));assert.ok(parseFloat(motion.transition)<=.01);assert.ok(parseFloat(motion.animation)<=.01);
  await desktop.ctx.close();await browser.close();console.log('V9.61 interaction accessibility regression: ok');
} finally {server.kill('SIGTERM')}
