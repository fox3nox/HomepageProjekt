import { webkit } from 'playwright';
import { spawn } from 'node:child_process';
import { readFileSync, mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';

const PORT=4174,BASE=`http://127.0.0.1:${PORT}`,ART='family-command/e2e-artifacts';
const SUPABASE_FUNCTIONS='https://lmrvapstojcecljjdgds.supabase.co/functions/v1/';
mkdirSync(ART,{recursive:true});
const stateSeed=readFileSync('family-command/e2e/mock-private-core.js','utf8');
const server=spawn('python3',['-m','http.server',String(PORT),'--directory','family-command'],{stdio:['ignore','pipe','pipe']});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function ready(){for(let i=0;i<50;i++){try{const r=await fetch(BASE+'/index.html');if(r.ok)return}catch{}await sleep(100)}throw new Error('local server not ready')}

const readable={
  kind:'schedule',title:'Test-Stundenplan',subtitle:'Lesbare Testfassung',
  columns:['Zeit','Montag','Dienstag','Mittwoch','Donnerstag','Freitag'],
  rows:[['08:20–09:05','Mathematik','Deutsch','Sport','Musik','Werken'],['09:10–09:55','Deutsch','Mathematik','Schwimmen','NMG','Englisch']],
  notes:['Die Lesefassung bleibt unabhängig von der Fotoauflösung gut lesbar.'],legend:['NMG = Natur, Mensch, Gesellschaft']
};
const svg='data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1273"><rect width="100%" height="100%" fill="white"/><text x="60" y="100" font-size="44" fill="black">Original Testdokument</text></svg>');

async function runViewport(browser,name,width,height){
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,serviceWorkers:'block',userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'});
  await context.addInitScript({content:stateSeed});
  const page=await context.newPage(),errors=[],originalRequests=[];
  page.on('pageerror',e=>errors.push('pageerror: '+e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});
  page.on('response',r=>{if(r.status()>=400)errors.push(`http ${r.status()}: ${r.url()}`)});
  await page.route(SUPABASE_FUNCTIONS+'**',route=>{
    const u=new URL(route.request().url());
    if(u.pathname.includes('/family-command-documents/list'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,documents:[{id:'doc-fixture',title:'Test-Stundenplan',mime_type:'image/png',created_at:'2026-08-30T08:00:00Z',has_readable:true,has_original:true,readable_version:'test'}]}),headers:{'access-control-allow-origin':'*'}});
    if(u.pathname.includes('/family-command-documents/readable'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,title:'Test-Stundenplan',content:readable,version:'test'}),headers:{'access-control-allow-origin':'*'}});
    if(u.pathname.includes('/family-command-documents/file')){originalRequests.push(u.search);return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,url:svg,title:'Test-Stundenplan',mimeType:'image/svg+xml',isOriginal:u.searchParams.get('original')==='1'}),headers:{'access-control-allow-origin':'*'}})}
    if(u.pathname.includes('/family-command-chat-commands'))return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,commands:[]}),headers:{'access-control-allow-origin':'*'}});
    return route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({ok:true,test:true}),headers:{'access-control-allow-origin':'*'}});
  });
  await page.goto(BASE+'/?access=test',{waitUntil:'domcontentloaded',timeout:15000});
  await page.waitForFunction(()=>document.documentElement.dataset.fcReady==='1'&&window.__fcV9&&window.__fcDocumentViewerHealth,{timeout:10000});
  const health=await page.evaluate(()=>window.__fcDocumentViewerHealth);
  assert.deepEqual(health,{version:'1.1.0',v9Native:true,readable:true,original:true,originalPath:true,zoom:true,legacyWrapper:false});

  await page.evaluate(()=>window.__fcV9.open('more'));
  await page.locator('#more [data-feature="docs"]').click();
  await page.waitForSelector('#fc9Modal .fc9-doc-list');
  const doc=page.locator('#fc9Modal [data-doc="doc-fixture"]');
  await doc.waitFor({state:'visible'});
  assert.ok(await doc.isVisible(),'document fixture must be listed');
  await doc.click();
  await page.waitForSelector('#fcDocumentViewer .fc-dv-readable');
  assert.ok(await page.getByText('Lesefassung',{exact:true}).last().isVisible());
  assert.ok(await page.getByText('Test-Stundenplan',{exact:true}).last().isVisible());
  assert.ok(await page.getByText('Mathematik',{exact:true}).first().isVisible());
  assert.ok(await page.getByText('Die Lesefassung bleibt unabhängig von der Fotoauflösung gut lesbar.',{exact:true}).isVisible());
  const readableGeom=await page.evaluate(()=>({vw:innerWidth,doc:document.documentElement.scrollWidth,shell:document.querySelector('#fcDocumentViewer .fc-dv-shell')?.getBoundingClientRect().width||0}));
  assert.ok(readableGeom.doc<=readableGeom.vw+1,`readable viewer page overflow: ${JSON.stringify(readableGeom)}`);
  assert.ok(readableGeom.shell<=readableGeom.vw+1,`viewer shell overflow: ${JSON.stringify(readableGeom)}`);
  await page.screenshot({path:`${ART}/${name}-document-readable.png`,fullPage:false});

  await page.locator('#fcDocumentViewer [data-mode="original"]').click();
  await page.waitForSelector('#fcDocumentViewer .fc-dv-original-img');
  assert.ok(originalRequests.some(q=>new URLSearchParams(q).get('original')==='1'),'Original tab must request original=1');
  assert.equal((await page.locator('#fcDocumentViewer [data-zoom-label]').innerText()).trim(),'100 %');
  await page.locator('#fcDocumentViewer [data-zoom-in]').click();
  assert.equal((await page.locator('#fcDocumentViewer [data-zoom-label]').innerText()).trim(),'125 %');
  const zoom=await page.locator('#fcDocumentViewer .fc-dv-original-img').evaluate(img=>({width:img.style.width,src:img.getAttribute('src')}));
  assert.equal(zoom.width,'125%');
  assert.ok(String(zoom.src).startsWith('data:image/svg+xml'));
  await page.screenshot({path:`${ART}/${name}-document-original-zoom.png`,fullPage:false});
  await page.locator('#fcDocumentViewer [data-fit]').click();
  assert.equal((await page.locator('#fcDocumentViewer [data-zoom-label]').innerText()).trim(),'100 %');
  await page.locator('#fcDocumentViewer .fc-dv-close').click();
  await page.waitForSelector('#fcDocumentViewer',{state:'detached'});
  assert.deepEqual(errors,[],`browser errors: ${errors.join('\n')}`);
  await context.close();
}

let browser;
try{
  await ready();browser=await webkit.launch({headless:true});
  await runViewport(browser,'iphone-390',390,844);
  await runViewport(browser,'iphone-430',430,932);
  console.log('V9.14 document viewer WebKit E2E passed');
}finally{if(browser)await browser.close();server.kill('SIGTERM')}
