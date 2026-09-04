import { webkit } from 'playwright';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const PORT=4197,BASE=`http://127.0.0.1:${PORT}`;
const seed=readFileSync('family-command/e2e/mock-private-core.js','utf8');
const server=spawn('python3',['-m','http.server',String(PORT),'--directory','family-command'],{stdio:['ignore','pipe','pipe']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<60;i++){try{if((await fetch(BASE+'/index.html')).ok)return}catch{}await sleep(100)}throw Error('server not ready')}
async function boot(browser,viewport,mobile=false){const ctx=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,serviceWorkers:'block'});await ctx.addInitScript({content:seed});const page=await ctx.newPage();await page.goto(BASE+'/?access=test',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>document.documentElement.dataset.fcReady==='1'&&window.__fcFamilyContacts?.version==='9.61.5',{timeout:20000});return{ctx,page}}

try{
  await ready();
  const browser=await webkit.launch({headless:true});
  const {ctx,page}=await boot(browser,{width:390,height:844},true);
  await page.locator('.fc9-nav button[data-screen="more"]').click();
  await page.waitForSelector('#more [data-feature="people"]');
  await page.locator('#more [data-feature="people"]').click();
  await page.waitForSelector('.fc-contacts-shell');

  const layout=await page.evaluate(()=>{
    const shell=document.querySelector('.fc-contacts-shell').getBoundingClientRect();
    const title=document.querySelector('.fc-contacts-shell h2').getBoundingClientRect();
    const titleStyle=getComputedStyle(document.querySelector('.fc-contacts-shell h2'));
    const add=document.querySelector('.fc-contacts-new').getBoundingClientRect();
    const controls=[...document.querySelectorAll('#fcContactsModal button,#fcContactsModal a,#fcContactsModal input,#fcContactsModal select')].filter(x=>{const r=x.getBoundingClientRect();return r.width&&r.height&&getComputedStyle(x).visibility!=='hidden'});
    return {w:shell.width,titleTop:title.top,titleSize:parseFloat(titleStyle.fontSize),titleColor:titleStyle.color,addH:add.height,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,min:Math.min(...controls.map(x=>x.getBoundingClientRect().height)),health:window.__fcFamilyContacts.health()};
  });
  assert.equal(layout.overflow,false);
  assert.ok(layout.w<=390);
  assert.ok(layout.titleTop>=0,'contacts title must be visible in the people screen');
  assert.ok(layout.titleSize>=28,'contacts title must keep approved hierarchy');
  assert.ok(layout.addH>=50,'primary contact CTA must match mobile design');
  assert.ok(layout.min>=40);
  assert.equal(layout.health.approvedContactDesign,true);
  assert.equal(layout.health.directCall,true);

  await page.locator('.fc-contacts-new').click();
  await page.locator('#fcContactName').fill('Praxis Buchsi');
  await page.locator('#fcContactOrg').fill('Hausarzt');
  await page.locator('#fcContactCat').selectOption('Arzt');
  await page.locator('#fcContactPhone').fill('+41 62 555 12 34');
  await page.locator('#fcContactEmail').fill('praxis@example.ch');
  const personOptions=await page.locator('#fcContactPerson option').count();if(personOptions>1)await page.locator('#fcContactPerson').selectOption({index:1});
  const before=await page.evaluate(()=>window.__fcFamilyContacts.health().contacts);
  await page.locator('#fcContactEdit [data-save]').click();
  await page.waitForFunction(n=>window.__fcFamilyContacts.health().contacts===n+1,before);

  const praxis=page.locator('.fc-contact-card').filter({hasText:'Praxis Buchsi'});
  assert.match(await praxis.innerText(),/Praxis Buchsi/);
  assert.match(await praxis.innerText(),/Arzt/);
  assert.match(await praxis.locator('.fc-contact-call').getAttribute('href'),/^tel:\+41625551234$/);
  assert.equal(await praxis.locator('.fc-contact-more').count(),1);
  const visual=await praxis.evaluate(el=>{const name=getComputedStyle(el.querySelector('b')),meta=getComputedStyle(el.querySelector('small')),avatar=el.querySelector('.fc-contact-avatar').getBoundingClientRect();return{nameColor:name.color,nameSize:parseFloat(name.fontSize),nameWeight:name.fontWeight,metaColor:meta.color,avatarW:avatar.width,avatarH:avatar.height,radius:getComputedStyle(el).borderRadius}});
  assert.ok(visual.nameSize>=17);
  assert.ok(Number(visual.nameWeight)>=700);
  assert.ok(visual.avatarW>=48&&visual.avatarH>=48);
  assert.match(visual.radius,/px/);

  await page.locator('[data-contact-search]').fill('Praxis');assert.equal(await page.locator('.fc-contact-card').count(),1);
  await page.locator('[data-contact-search]').fill('');
  await page.locator('[data-contact-cat]').selectOption('Arzt');assert.equal(await page.locator('.fc-contact-card').count(),1);
  await praxis.locator('.fc-contact-more').click();
  assert.equal(await page.locator('#fcContactEmail').inputValue(),'praxis@example.ch');
  await page.locator('#fcContactName').fill('Hausarzt Buchsi');
  await page.locator('#fcContactEdit [data-save]').click();
  assert.match(await page.locator('.fc-contact-card').innerText(),/Hausarzt Buchsi/);
  page.on('dialog',d=>d.accept());
  const edited=page.locator('.fc-contact-card').filter({hasText:'Hausarzt Buchsi'});
  await edited.locator('.fc-contact-more').click();
  await page.locator('#fcContactEdit [data-delete]').click();
  await page.waitForFunction(n=>window.__fcFamilyContacts.health().contacts===n,before);
  await ctx.close();

  const desktop=await boot(browser,{width:1440,height:1000});
  await desktop.page.locator('.fc9-nav button[data-screen="more"]').click();
  await desktop.page.locator('#more [data-feature="people"]').click();
  await desktop.page.waitForSelector('.fc-contacts-shell');
  const d=await desktop.page.evaluate(()=>{const r=document.querySelector('.fc-contacts-shell').getBoundingClientRect();return{w:r.width,left:r.left,right:r.right,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,cols:getComputedStyle(document.querySelector('.fc-contacts-tools')).gridTemplateColumns}});
  assert.equal(d.overflow,false);assert.ok(d.w>=700&&d.w<=940);assert.ok(d.left>0&&d.right<1440);assert.match(d.cols,/px/);
  await desktop.ctx.close();await browser.close();
  console.log('V9.61.5 family contacts regression: ok');
}finally{server.kill('SIGTERM')}
