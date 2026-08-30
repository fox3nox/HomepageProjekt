/* Familienzentrale · V9 runtime health guard */
(()=>{
  'use strict';
  if(window.__fcRuntimeHealthInstalled)return;window.__fcRuntimeHealthInstalled=true;

  /* Keep exactly one lightweight minute refresh for the active Today view. */
  for(const name of ['__fc4Timer','__fcPastFocusTimer','__fcCleanTodayTimer','__fcUnifiedTodayTimer']){
    try{if(window[name])clearInterval(window[name]);window[name]=null}catch(e){}
  }
  window.__fcUnifiedTodayTimer=setInterval(()=>{
    try{if(document.getElementById('today')?.classList.contains('active'))window.__fcV9?.render?.('today',true)}catch(e){}
  },60000);

  /* Collapse bursts of push-state synchronization into one request. */
  try{
    if(typeof window.syncPush==='function'&&!window.__fcSyncPushDeduped){
      window.__fcSyncPushDeduped=true;
      const rawSync=window.syncPush.bind(window);
      let timer=null,pending=null,waiters=[];
      const wrapped=function(){
        if(pending)return pending;
        if(timer)clearTimeout(timer);
        const promise=new Promise((resolve,reject)=>{waiters.push({resolve,reject});timer=setTimeout(async()=>{
          timer=null;
          try{pending=Promise.resolve(rawSync());const result=await pending;const ws=waiters.splice(0);ws.forEach(w=>w.resolve(result))}
          catch(err){const ws=waiters.splice(0);ws.forEach(w=>w.reject(err))}
          finally{pending=null}
        },120)});
        return promise;
      };
      window.syncPush=wrapped;try{syncPush=wrapped}catch(e){}
    }
  }catch(e){console.error('fc_sync_dedupe',e)}

  /* Ask an installed Home-Screen app to check for the current service worker. */
  try{navigator.serviceWorker?.getRegistration('./').then(r=>r?.update()).catch(()=>{})}catch(e){}

  window.__fcRuntimeHealth={
    version:2,
    minimalRuntime:!!window.__fcCoreRuntime,
    legacyBundle:false,
    unifiedTodayTimer:true,
    syncPushDeduped:!!window.__fcSyncPushDeduped,
    cloudState:window.__fcCloudState?.health?.().status||'unknown',
    installedAt:new Date().toISOString()
  };
})();
