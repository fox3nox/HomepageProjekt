/* Familienzentrale · read-only V9 runtime self-test · no legacy loaders */
(()=>{
  'use strict';
  if(window.__fcSelfTestV9Installed)return;window.__fcSelfTestV9Installed=true;
  const state={runs:0,last:null,recentRuntimeErrors:[]};
  let timer=0,interval=0;
  const REQUIRED=['renderToday','renderTomorrow','renderWeek','renderEvents','renderHomeworkScreen','renderMore','fcOpenEventDetails','fcOpenFamilyAI','fcPrintDay','fcPrintWeek'];
  function duplicateIds(){const ids=[...document.querySelectorAll('[id]')].map(x=>x.id).filter(Boolean);return[...new Set(ids.filter((id,i)=>ids.indexOf(id)!==i))]}
  function activeScreen(){return document.querySelector('.fc9-screen.active')}
  function navHealth(){return[...document.querySelectorAll('.fc9-nav button[data-screen]')].map(b=>{const r=b.getBoundingClientRect();return{id:b.dataset.screen||'',w:Math.round(r.width),h:Math.round(r.height),active:b.classList.contains('active')}})}
  function missingFunctions(){return REQUIRED.filter(name=>typeof window[name]!=='function')}
  function run(){
    let v9=null,v11=null,core=null,cloud=null;try{v9=window.__fcV9?.health?.()||null}catch(e){}try{v11=window.__fcV11?.health?.()||null}catch(e){}try{core=window.__fcCoreRuntime?.health?.()||null}catch(e){}try{cloud=window.__fcCloudState?.health?.()||null}catch(e){}
    const dup=duplicateIds(),missing=missingFunctions(),critical=[];
    if(!core)critical.push('core-health');if(core?.legacyBundle!==false)critical.push('legacy-bundle');if(dup.length)critical.push('duplicate-ids');if(missing.length)critical.push('missing-functions');
    let report;
    if(v11){
      const visibleNav=[...document.querySelectorAll('.fc11-bottom-nav [data-fc11-screen],.fc11-sidebar [data-fc11-screen]')].filter(b=>{const s=getComputedStyle(b),r=b.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0});
      const activeNav=visibleNav.filter(b=>b.classList.contains('active')).length;
      const touch=visibleNav.filter(b=>{const r=b.getBoundingClientRect();return r.height<44||r.width<40}).map(b=>{const r=b.getBoundingClientRect();return{id:b.dataset.fc11Screen||'',w:Math.round(r.width),h:Math.round(r.height)}});
      if(!Array.isArray(v11.nav)||v11.nav.length!==5)critical.push('v11-navigation');
      if(activeNav!==1)critical.push('active-nav');
      if(v11.overflow===true||document.documentElement.scrollWidth>document.documentElement.clientWidth+1)critical.push('horizontal-overflow');
      if(touch.length)critical.push('touch-targets');
      report={version:'11.0.0',shell:'v11',readOnly:true,legacyLoaders:false,ok:critical.length===0,screen:v11.screen||'',activeNav,missingFunctions:missing,duplicateIds:dup,horizontalOverflow:v11.overflow===true,touchTargets:touch,core,cloudStatus:cloud?.status||'',v11,v9,critical,runtimeErrorCount:state.recentRuntimeErrors.length,checkedAt:new Date().toISOString()};
    }else{
      const active=document.querySelectorAll('.fc9-screen.active').length,screen=activeScreen(),nav=navHealth(),overflow=!!screen&&screen.scrollWidth>screen.clientWidth+3,touch=nav.filter(x=>x.h<44||x.w<40),activeNav=nav.filter(x=>x.active).length;
      if(!v9)critical.push('v9-health');if(active!==1)critical.push('active-screen');if(activeNav!==1)critical.push('active-nav');if(overflow||v9?.overflow===true)critical.push('horizontal-overflow');if(touch.length)critical.push('touch-targets');if(Array.isArray(v9?.dup)&&v9.dup.length)critical.push('v9-duplicate-ids');
      report={version:'9.0.0',shell:'v9',readOnly:true,legacyLoaders:false,ok:critical.length===0,screen:screen?.id||'',activeScreens:active,activeNav,missingFunctions:missing,duplicateIds:dup,horizontalOverflow:overflow,touchTargets:touch,core,cloudStatus:cloud?.status||'',v9,critical,runtimeErrorCount:state.recentRuntimeErrors.length,checkedAt:new Date().toISOString()};
    }
    state.runs++;state.last=report;window.__fcAppSelfTest=report;document.documentElement.dataset.fcHealth=report.ok?'ok':'warn';if(!report.ok)console.warn('Familienzentrale self-test',report);return report;
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(run,180)}
  window.addEventListener('online',schedule);window.addEventListener('offline',schedule);window.addEventListener('pageshow',schedule);document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
  window.addEventListener('error',e=>{state.recentRuntimeErrors.push({type:'error',source:String(e.filename||'').split('/').pop()||'',line:Number(e.lineno)||0});state.recentRuntimeErrors=state.recentRuntimeErrors.slice(-5);schedule()});
  window.addEventListener('unhandledrejection',()=>{state.recentRuntimeErrors.push({type:'promise'});state.recentRuntimeErrors=state.recentRuntimeErrors.slice(-5);schedule()});
  window.fcRunSelfTest=run;requestAnimationFrame(schedule);interval=setInterval(()=>{if(!document.hidden)run()},60000);window.__fcSelfTestV9={run,health:()=>state.last,stop:()=>{clearTimeout(timer);clearInterval(interval)},version:'11-aware'};
})();
