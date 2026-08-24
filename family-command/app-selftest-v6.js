/* Family Command · lightweight runtime self-test · 2026-08-24 */
(()=>{
  if(window.__fcSelfTestInstalled)return;window.__fcSelfTestInstalled=true;

  const state={runs:0,last:null,recentRuntimeErrors:[]};
  let timer=0;

  function connectionBadge(){
    let badge=document.getElementById('fcConnectionBadge');
    if(badge)return badge;
    badge=document.createElement('span');
    badge.id='fcConnectionBadge';
    badge.setAttribute('role','status');
    badge.setAttribute('aria-live','polite');
    badge.hidden=true;
    badge.textContent='Offline';
    const tools=document.querySelector('.aitools')||document.querySelector('.topbar-in');
    if(tools)tools.insertBefore(badge,tools.lastElementChild||null);
    const style=document.createElement('style');
    style.id='fc-selftest-style';
    style.textContent=`
      #fcConnectionBadge{min-height:30px;display:inline-flex;align-items:center;padding:0 9px;border-radius:999px;border:1px solid rgba(255,181,75,.26);background:rgba(255,181,75,.09);color:#ffc36c;font-size:9px;font-weight:800;white-space:nowrap}
      #fcConnectionBadge[hidden]{display:none!important}
    `;
    document.head.appendChild(style);
    return badge;
  }

  function updateConnection(){
    const badge=connectionBadge();if(!badge)return;
    const offline=navigator.onLine===false;
    badge.hidden=!offline;
    document.documentElement.dataset.fcOffline=offline?'1':'0';
  }

  function duplicateIds(){
    const ids=[...document.querySelectorAll('[id]')].map(x=>x.id).filter(Boolean);
    return [...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))];
  }

  function brokenInlineHandlers(){
    const out=[];
    document.querySelectorAll('[onclick],[onchange]').forEach(el=>{
      for(const attr of ['onclick','onchange']){
        const src=String(el.getAttribute(attr)||'').trim();if(!src)continue;
        if(src.endsWith('(')){out.push({tag:el.tagName.toLowerCase(),attr,reason:'truncated'});continue}
        try{
          const fn=attr==='onclick'?el.onclick:el.onchange;
          if(typeof fn!=='function')out.push({tag:el.tagName.toLowerCase(),attr,reason:'not-compiled'});
        }catch(e){out.push({tag:el.tagName.toLowerCase(),attr,reason:'compile-error'})}
      }
    });
    return out.slice(0,20);
  }

  function missingFunctions(){
    const names=['renderToday','renderWeek','renderEvents','renderHomeworkScreen','renderMore','fcOpenEventDetails','fcOpenFamilyAI','fcPrintDay','fcPrintWeek'];
    return names.filter(name=>typeof window[name]!=='function');
  }

  function activeOverflow(){
    const el=document.querySelector('.screen.active');
    if(!el)return false;
    return el.scrollWidth>el.clientWidth+3;
  }

  function run(){
    const active=document.querySelectorAll('.screen.active').length;
    const activeNav=document.querySelectorAll('.navbtn.active').length;
    const missing=missingFunctions();
    const dup=duplicateIds();
    const handlers=brokenInlineHandlers();
    const screen=document.querySelector('.screen.active')?.id||'';
    const weekButtons=screen==='week'?document.querySelectorAll('#week .v6-day').length:null;
    const expectedFilters=screen==='events'?(Array.isArray(window.data?.people)?window.data.people.length+1:null):null;
    const eventFilters=screen==='events'?document.querySelectorAll('#events .v6-filter').length:null;
    const critical=[];
    if(active!==1)critical.push('active-screen');
    if(activeNav!==1)critical.push('active-nav');
    if(missing.length)critical.push('missing-functions');
    if(handlers.length)critical.push('broken-handlers');
    if(screen==='week'&&weekButtons!==5)critical.push('week-controls');
    if(screen==='events'&&expectedFilters!==null&&eventFilters!==expectedFilters)critical.push('event-filters');
    if(activeOverflow())critical.push('horizontal-overflow');
    const report={version:'6.2',ok:critical.length===0,screen,activeScreens:active,activeNav,missingFunctions:missing,duplicateIds:dup,brokenHandlers:handlers,weekButtons,eventFilters,expectedFilters,horizontalOverflow:activeOverflow(),runtimeErrorCount:state.recentRuntimeErrors.length,critical,checkedAt:new Date().toISOString()};
    state.runs++;state.last=report;window.__fcAppSelfTest=report;
    document.documentElement.dataset.fcHealth=report.ok?'ok':'warn';
    if(!report.ok)console.warn('Family Command self-test',report);
    return report;
  }

  function schedule(){clearTimeout(timer);timer=setTimeout(run,100)}

  window.addEventListener('online',()=>{updateConnection();schedule()});
  window.addEventListener('offline',updateConnection);
  window.addEventListener('error',e=>{
    state.recentRuntimeErrors.push({type:'error',source:String(e.filename||'').split('/').pop()||'',line:Number(e.lineno)||0});
    state.recentRuntimeErrors=state.recentRuntimeErrors.slice(-5);
    schedule();
  });
  window.addEventListener('unhandledrejection',()=>{
    state.recentRuntimeErrors.push({type:'promise'});state.recentRuntimeErrors=state.recentRuntimeErrors.slice(-5);schedule();
  });

  try{
    const root=document.querySelector('.content')||document.body;
    const observer=new MutationObserver(schedule);
    observer.observe(root,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
    window.__fcSelfTestObserver=observer;
  }catch(e){}

  window.fcRunSelfTest=run;
  updateConnection();
  requestAnimationFrame(()=>{updateConnection();run()});
})();