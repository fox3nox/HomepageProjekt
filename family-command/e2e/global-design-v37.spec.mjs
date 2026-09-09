import assert from 'node:assert/strict';
import { chromium, webkit } from 'playwright';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const engine=(process.env.FC_BROWSER||'webkit').toLowerCase();
const browserType=engine==='chromium'?chromium:webkit;
const here=path.dirname(fileURLToPath(import.meta.url));
const appDir=path.resolve(here,'..');
const server=spawn('python3',['-m','http.server','4173','--bind','127.0.0.1','--directory',appDir],{stdio:'ignore'});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
await wait(700);
try{
  const browser=await browserType.launch({headless:true});
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  await page.goto('http://127.0.0.1:4173/?access=test',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.fcReady==='1',{timeout:20000});
  await page.waitForTimeout(700);

  const metrics={};
  for(const screen of ['today','tomorrow','events','homework','more']){
    await page.locator(`.fc9-nav button[data-screen="${screen}"]`).click();
    await page.waitForTimeout(120);
    metrics[screen]=await page.evaluate(id=>{
      const root=document.getElementById(id),pageEl=root?.querySelector('.fc9-page'),h1=root?.querySelector('h1');
      const nav=document.querySelector('.fc9-nav'),activeNav=nav?.querySelector('button.active');
      const rows=[...root?.querySelectorAll('.fc9-row,.fc9-event,.fc9-person,.fc38-event,.fc38-task,.fc38-child')||[]].filter(x=>x.offsetParent!==null);
      const card=root?.querySelector('.fc9-card,.fc38-panel,.fc38-priority,.fc38-tomorrow');
      const tile=root?.querySelector('.fc9-tile');
      const nr=nav?.getBoundingClientRect(),ar=activeNav?.getBoundingClientRect();
      const cs=x=>x?getComputedStyle(x):null;
      return{
        active:root?.classList.contains('active')||false,
        overflow:document.documentElement.scrollHeight>=document.documentElement.clientHeight,
        h1:parseFloat(cs(h1)?.fontSize||'0'),
        cardRadius:parseFloat(cs(card)?.borderRadius||'0'),
        maxRow:rows.length?Math.max(...rows.map(x=>x.getBoundingClientRect().height)):0,
        mainPadding:parseFloat(cs(pageEl)?.paddingLeft||'0'),
        navTop:nr?.top||0,navBottom:nr?.bottom||0,navHeight:nr?.height||0,
        bottomGap:innerHeight-(nr?.bottom||innerHeight),
        activeNavBg:cs(activeNav)?.backgroundImage||'',activeNavHeight:ar?.height||0,
        tileRadius:parseFloat(cs(tile)?.borderRadius||'0'),tileMinHeight:parseFloat(cs(tile)?.minHeight||'0'),
        pageBottom:pageEl?.getBoundingClientRect().bottom||0
      }
    },screen);
  }
  const schoolFocus=await page.evaluate(()=>{
    const headers=[...document.querySelectorAll('#today .fc38-school-head .is-today')];
    const cells=[...document.querySelectorAll('#today .fc38-school-row .is-today')];
    const h=headers[0];return{headers:headers.length,cells:cells.length,label:h?.textContent?.trim()||'',headerBg:h?getComputedStyle(h).backgroundImage:''}
  });
  console.log('global-design-v81',JSON.stringify({...metrics,schoolFocus}));

  for(const [id,m] of Object.entries(metrics)){
    assert.equal(m.active,true,`${id} must be active when selected`);
    assert.ok(m.h1>=27&&m.h1<=31,`${id} page title scale drifted: ${m.h1}`);
    assert.ok(m.mainPadding>=10&&m.mainPadding<=16,`${id} side padding drifted: ${m.mainPadding}`);
    assert.ok(m.navHeight>=64&&m.navHeight<=76,`${id} bottom nav height drifted: ${m.navHeight}`);
    assert.ok(m.bottomGap>=0&&m.bottomGap<=12,`${id} bottom nav safe-area drifted: ${m.bottomGap}`);
    assert.ok(m.activeNavHeight>=44,`${id} active nav target too small: ${m.activeNavHeight}`);
  }
  assert.ok(metrics.today.cardRadius>=16&&metrics.today.cardRadius<=22,'Today surfaces must stay in the component radius system');
  assert.equal(schoolFocus.headers,1,'school grid must mark exactly one current weekday header');
  assert.ok(schoolFocus.cells>=1,'school grid must visually carry the current weekday through the child rows');
  assert.equal(schoolFocus.label,'HEUTE','current school day must have an explicit HEUTE label');
  assert.ok(String(schoolFocus.headerBg).includes('gradient'),'current school day needs a visible highlighted background');
  assert.ok(metrics.tomorrow.maxRow===0||metrics.tomorrow.maxRow<=120,`tomorrow rows too tall: ${metrics.tomorrow.maxRow}`);
  assert.ok(metrics.events.maxRow===0||metrics.events.maxRow<=86,`calendar rows too tall: ${metrics.events.maxRow}`);
  assert.ok(metrics.homework.maxRow===0||metrics.homework.maxRow<=86,`task rows too tall: ${metrics.homework.maxRow}`);
  assert.ok(metrics.more.tileRadius>=14&&metrics.more.tileRadius<=22,`More tiles are not part of the component system: ${metrics.more.tileRadius}`);
  assert.ok(metrics.more.tileMinHeight>=60&&metrics.more.tileMinHeight<=76,`More tiles must stay compact and tappable: ${metrics.more.tileMinHeight}`);

  await browser.close();
  console.log('V9.81 complete mobile visual regression: ok');
}finally{server.kill('SIGTERM')}
