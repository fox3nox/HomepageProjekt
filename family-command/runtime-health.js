/* Family Command · runtime health guard · 2026-08-24 */
(()=>{
  /* The original private bundle still contains its first-generation push helper.
     Push v2/push3 is authoritative; suppress only the retired /push/* helper calls. */
  try{
    if(typeof window.post==='function'){
      const legacyPost=window.post.bind(window);
      window.post=async function(path,payload){
        if(String(path||'').startsWith('/push/'))return{ok:true,skipped:true,reason:'legacy-push-disabled'};
        return legacyPost(path,payload);
      };
      try{post=window.post}catch(e){}
    }
  }catch(e){}

  /* Several historical UI upgrades each installed a 60-second Today timer.
     Keep one timer only. */
  for(const name of ['__fc4Timer','__fcPastFocusTimer','__fcCleanTodayTimer']){
    try{if(window[name])clearInterval(window[name]);window[name]=null}catch(e){}
  }
  try{if(window.__fcUnifiedTodayTimer)clearInterval(window.__fcUnifiedTodayTimer)}catch(e){}
  window.__fcUnifiedTodayTimer=setInterval(()=>{
    try{if(document.getElementById('today')?.classList.contains('active')&&typeof renderToday==='function')renderToday()}catch(e){}
  },60000);

  /* Collapse bursts of identical state-sync requests caused by layered historical render/save wrappers. */
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

  /* Pro6 uses compact generated markup. The first Pro6 build JSON-stringified dynamic
     ids directly into double-quoted HTML event attributes. Safari then parses e.g.
     onclick="v6SelectWeekDay("2026-08-18")" into two attributes and the control
     becomes inert. Repair this parser split centrally for onclick/onchange so every
     affected Pro6 control is fixed, not only week days and person filters. */
  try{
    const HANDLERS=['onclick','onchange'];
    const repairElement=el=>{
      if(!el?.getAttribute)return 0;
      let fixed=0;
      for(const handler of HANDLERS){
        const prefix=String(el.getAttribute(handler)||'').trim();
        if(!prefix||!prefix.endsWith('('))continue;
        const extras=[...el.attributes].filter(a=>a.name!==handler&&a.value===''&&a.name.includes('"')&&a.name.endsWith('"'));
        for(const extra of extras){
          const i=extra.name.indexOf('"');
          if(i<=0)continue;
          const raw=extra.name.slice(0,i),tail=extra.name.slice(i+1,-1);
          if(!tail.endsWith(')'))continue;
          const safe=raw.replace(/\\/g,'\\\\').replace(/"/g,'\\"');
          el.setAttribute(handler,prefix+'"'+safe+'"'+tail);
          el.removeAttribute(extra.name);
          fixed++;
          break;
        }
      }
      return fixed;
    };
    const repairTree=root=>{
      let n=0;
      if(root?.nodeType===1)n+=repairElement(root);
      const scope=root?.querySelectorAll?root:document;
      scope.querySelectorAll?.('[onclick],[onchange]').forEach(el=>{n+=repairElement(el)});
      if(n){window.__fcInteractionRepairCount=(window.__fcInteractionRepairCount||0)+n}
      return n;
    };
    window.fcRepairPro6Interactions=repairTree;
    repairTree(document);
    if(!window.__fcInteractionRepairObserver){
      let queued=false;
      const ob=new MutationObserver(records=>{
        if(queued)return;queued=true;
        queueMicrotask(()=>{
          queued=false;
          for(const r of records)for(const n of r.addedNodes)repairTree(n);
        });
      });
      ob.observe(document.documentElement||document.body,{childList:true,subtree:true});
      window.__fcInteractionRepairObserver=ob;
    }
  }catch(e){console.error('fc_interaction_repair',e)}

  /* pro-ui is loaded after the secure transport layer and defines its own opener;
     restore the authenticated opener as the final authority. */
  try{window.fcSecureTransportRefresh?.()}catch(e){}

  /* Prompt an installed Home-Screen app to pick up the hardened service worker. */
  try{navigator.serviceWorker?.getRegistration('./').then(r=>r?.update()).catch(()=>{})}catch(e){}

  window.__fcRuntimeHealth={legacyPushDisabled:true,unifiedTodayTimer:true,syncPushDeduped:true,secureDocumentOpener:true,interactionRepair:true,installedAt:new Date().toISOString()};
})();