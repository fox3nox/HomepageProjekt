/* Family Command · read-only runtime self-test v6.5 · 2026-08-24 */
(()=>{
  if(window.__fcSelfTestInstalled)return;window.__fcSelfTestInstalled=true;
  const state={runs:0,last:null,recentRuntimeErrors:[]};let timer=0;

  function connectionBadge(){
    let badge=document.getElementById('fcConnectionBadge');if(badge)return badge;
    badge=document.createElement('span');badge.id='fcConnectionBadge';badge.setAttribute('role','status');badge.setAttribute('aria-live','polite');badge.hidden=true;badge.textContent='Offline';
    const tools=document.querySelector('.aitools')||document.querySelector('.topbar-in');if(tools)tools.insertBefore(badge,tools.lastElementChild||null);
    if(!document.getElementById('fc-selftest-style')){const style=document.createElement('style');style.id='fc-selftest-style';style.textContent='#fcConnectionBadge{min-height:30px;display:inline-flex;align-items:center;padding:0 9px;border-radius:999px;border:1px solid rgba(255,181,75,.26);background:rgba(255,181,75,.09);color:#ffc36c;font-size:9px;font-weight:800;white-space:nowrap}#fcConnectionBadge[hidden]{display:none!important}';document.head.appendChild(style)}return badge;
  }
  function updateConnection(){const badge=connectionBadge();if(!badge)return;const offline=navigator.onLine===false;badge.hidden=!offline;document.documentElement.dataset.fcOffline=offline?'1':'0'}
  function duplicateIds(){const ids=[...document.querySelectorAll('[id]')].map(x=>x.id).filter(Boolean);return[...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))]}
  function brokenInlineHandlers(){const out=[];document.querySelectorAll('[onclick],[onchange]').forEach(el=>{for(const attr of ['onclick','onchange']){const src=String(el.getAttribute(attr)||'').trim();if(!src)continue;if(src.endsWith('(')){out.push({tag:el.tagName.toLowerCase(),attr,reason:'truncated'});continue}try{const fn=attr==='onclick'?el.onclick:el.onchange;if(typeof fn!=='function')out.push({tag:el.tagName.toLowerCase(),attr,reason:'not-compiled'})}catch(e){out.push({tag:el.tagName.toLowerCase(),attr,reason:'compile-error'})}}});return out.slice(0,20)}
  function missingFunctions(){const names=['renderToday','renderWeek','renderEvents','renderHomeworkScreen','renderMore','fcOpenEventDetails','fcOpenFamilyAI','fcPrintDay','fcPrintWeek'];return names.filter(name=>typeof window[name]!=='function')}
  function peopleCount(){try{return typeof data!=='undefined'&&Array.isArray(data?.people)?data.people.length:null}catch(e){return null}}
  function activeOverflow(){const el=document.querySelector('.screen.active');return el?el.scrollWidth>el.clientWidth+3:false}

  function run(){
    const active=document.querySelectorAll('.screen.active').length,activeNav=document.querySelectorAll('.navbtn.active').length,missing=missingFunctions(),dup=duplicateIds(),handlers=brokenInlineHandlers(),screen=document.querySelector('.screen.active')?.id||'';
    const weekButtons=screen==='week'?document.querySelectorAll('#week .v6-day').length:null,pc=screen==='events'?peopleCount():null,expectedFilters=pc===null?null:pc+1,eventFilters=screen==='events'?document.querySelectorAll('#events .v6-filter').length:null,overflow=activeOverflow(),navOk=screen==='people'?activeNav<=1:activeNav===1,critical=[];
    if(active!==1)critical.push('active-screen');if(!navOk)critical.push('active-nav');if(missing.length)critical.push('missing-functions');if(handlers.length)critical.push('broken-handlers');if(screen==='week'&&weekButtons!==5)critical.push('week-controls');if(screen==='events'&&expectedFilters!==null&&eventFilters!==expectedFilters)critical.push('event-filters');if(overflow)critical.push('horizontal-overflow');
    if(window.__fcSmokeTest&&window.__fcSmokeTest.ok===false)critical.push('smoke-tests');
    const report={version:'6.5',readOnly:true,ok:critical.length===0,screen,activeScreens:active,activeNav,missingFunctions:missing,duplicateIds:dup,brokenHandlers:handlers,weekButtons,eventFilters,expectedFilters,horizontalOverflow:overflow,runtimeErrorCount:state.recentRuntimeErrors.length,smokeTest:window.__fcSmokeTest?{ok:window.__fcSmokeTest.ok,tests:window.__fcSmokeTest.tests}:null,todayRelevance:!!window.__fcTodayRelevanceInstalled,critical,checkedAt:new Date().toISOString()};
    state.runs++;state.last=report;window.__fcAppSelfTest=report;document.documentElement.dataset.fcHealth=report.ok?'ok':'warn';if(!report.ok)console.warn('Family Command self-test',report);return report;
  }
  function scheduleTest(){clearTimeout(timer);timer=setTimeout(run,120)}
  function loadTodayRelevance(){
    if(window.__fcTodayRelevanceInstalled||document.querySelector('script[data-fc-today-relevance]'))return;
    const s=document.createElement('script');s.dataset.fcTodayRelevance='1';s.src='./today-relevance.js?v=20260824-relevance1';s.onload=()=>{try{if(document.getElementById('today')?.classList.contains('active')&&typeof renderToday==='function')renderToday()}catch(e){}scheduleTest()};s.onerror=()=>console.error('fc_today_relevance_load');document.body.appendChild(s);
  }

  window.addEventListener('online',()=>{updateConnection();scheduleTest()});window.addEventListener('offline',updateConnection);
  window.addEventListener('error',e=>{state.recentRuntimeErrors.push({type:'error',source:String(e.filename||'').split('/').pop()||'',line:Number(e.lineno)||0});state.recentRuntimeErrors=state.recentRuntimeErrors.slice(-5);scheduleTest()});
  window.addEventListener('unhandledrejection',()=>{state.recentRuntimeErrors.push({type:'promise'});state.recentRuntimeErrors=state.recentRuntimeErrors.slice(-5);scheduleTest()});
  try{const root=document.querySelector('.content')||document.body,observer=new MutationObserver(scheduleTest);observer.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});window.__fcSelfTestObserver=observer}catch(e){}
  window.fcRunSelfTest=run;updateConnection();loadTodayRelevance();requestAnimationFrame(()=>{updateConnection();run()});
})();
