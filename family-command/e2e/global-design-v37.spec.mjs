import { webkit } from 'playwright';
import { spawn } from 'node:child_process';
import { readFileSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';

const PORT=4197,BASE=`http://127.0.0.1:${PORT}`;
const seed=readFileSync('family-command/e2e/mock-private-core.js','utf8');
const out='family-command/e2e-artifacts';
mkdirSync(out,{recursive:true});
const server=spawn('python3',['-m','http.server',String(PORT),'--directory','family-command'],{stdio:['ignore','pipe','pipe']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<60;i++){try{if((await fetch(BASE+'/index.html')).ok)return}catch{}await sleep(100)}throw new Error('server not ready')}

try{
  await ready();
  const browser=await webkit.launch({headless:true});
  const ctx=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await ctx.addInitScript({content:seed});
  const page=await ctx.newPage();
  await page.goto(BASE+'/?access=test',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.fcReady==='1');
  await page.waitForFunction(()=>!![...document.styleSheets].find(s=>String(s.href||'').includes('v9-global-polish.css')));

  const before=await page.evaluate(()=>JSON.stringify({todos:data.todos,events:data.events,homework:data.homework,people:data.people,schedules:data.schedules}));
  const screens=['today','tomorrow','events','homework','more'];
  const metrics={};

  for(const id of screens){
    await page.locator(`.fc9-nav button[data-screen="${id}"]`).click();
    await page.waitForTimeout(140);
    metrics[id]=await page.evaluate(id=>{
      const s=document.getElementById(id),nav=document.querySelector('.fc9-nav'),active=document.querySelector(`.fc9-nav button[data-screen="${id}"]`);
      const h=s.querySelector('.fc9-pagehead h1'),cards=[...s.querySelectorAll('.fc9-card')],rows=[...s.querySelectorAll('.fc9-row,.fc9-person')],tiles=[...s.querySelectorAll('.fc9-tile')];
      const nr=nav.getBoundingClientRect(),ar=active.getBoundingClientRect(),main=document.querySelector('.fc9-main');
      return {
        active:s.classList.contains('active'),
        overflow:document.documentElement.scrollWidth<=document.documentElement.clientWidth+1,
        h1:h?parseFloat(getComputedStyle(h).fontSize):0,
        cardRadius:cards.length?Math.max(...cards.map(x=>parseFloat(getComputedStyle(x).borderRadius)||0)):0,
        maxRow:rows.length?Math.max(...rows.slice(0,10).map(x=>x.getBoundingClientRect().height)):0,
        mainPadding:parseFloat(getComputedStyle(main).paddingLeft)||0,
        navTop:nr.top,navBottom:nr.bottom,navHeight:nr.height,bottomGap:innerHeight-nr.bottom,
        activeNavBg:getComputedStyle(active).backgroundImage||getComputedStyle(active).backgroundColor,
        activeNavHeight:ar.height,
        tileRadius:tiles.length?Math.max(...tiles.map(x=>parseFloat(getComputedStyle(x).borderRadius)||0)):0,
        tileMinHeight:tiles.length?Math.min(...tiles.map(x=>x.getBoundingClientRect().height)):0,
        pageBottom:s.querySelector('.fc9-page')?.getBoundingClientRect().bottom||0
      };
    },id);
    await page.screenshot({path:`${out}/v944-${id}.png`,fullPage:false});
  }

  const after=await page.evaluate(()=>JSON.stringify({todos:data.todos,events:data.events,homework:data.homework,people:data.people,schedules:data.schedules}));
  console.log('global-design-v44',JSON.stringify(metrics));
  assert.equal(before,after,'visual redesign must not mutate family state');

  for(const [id,m] of Object.entries(metrics)){
    assert.equal(m.active,true,`${id} must render`);
    assert.equal(m.overflow,true,`${id} must not overflow horizontally`);
    assert.ok(m.h1>=26&&m.h1<=32,`${id} page title outside V9.44 scale: ${m.h1}`);
    assert.ok(m.mainPadding>=9&&m.mainPadding<=14,`${id} mobile gutter outside V9.44 range: ${m.mainPadding}`);
    assert.ok(m.navTop>0&&m.navBottom<=844,`${id} bottom navigation is clipped`);
    assert.ok(m.bottomGap>=6,`${id} bottom navigation lacks safe visible gap: ${m.bottomGap}`);
    assert.ok(m.navHeight>=66&&m.navHeight<=82,`${id} bottom navigation height invalid: ${m.navHeight}`);
    assert.ok(m.activeNavHeight>=58,`${id} active navigation target too small: ${m.activeNavHeight}`);
    assert.ok(String(m.activeNavBg).includes('gradient')||String(m.activeNavBg).includes('rgb'),`${id} active navigation lacks visual state`);
    if(m.cardRadius)assert.ok(m.cardRadius>=16&&m.cardRadius<=22,`${id} card radius outside V9.44 system: ${m.cardRadius}`);
  }

  assert.ok(metrics.tomorrow.maxRow===0||metrics.tomorrow.maxRow<=86,`tomorrow rows too tall: ${metrics.tomorrow.maxRow}`);
  assert.ok(metrics.events.maxRow===0||metrics.events.maxRow<=86,`calendar rows too tall: ${metrics.events.maxRow}`);
  assert.ok(metrics.homework.maxRow===0||metrics.homework.maxRow<=86,`task rows too tall: ${metrics.homework.maxRow}`);
  assert.ok(metrics.more.tileRadius>=18&&metrics.more.tileRadius<=22,`More tiles are not part of the redesigned component system: ${metrics.more.tileRadius}`);
  assert.ok(metrics.more.tileMinHeight>=100,`More tiles are too cramped: ${metrics.more.tileMinHeight}`);

  await browser.close();
  console.log('V9.44 complete mobile visual regression: ok');
}finally{server.kill('SIGTERM')}
