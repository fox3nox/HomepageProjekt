/* Family Command · runtime health guard · 2026-08-21 */
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

  /* pro-ui is loaded after the secure transport layer and defines its own opener;
     restore the authenticated opener as the final authority. */
  try{window.fcSecureTransportRefresh?.()}catch(e){}

  /* Prompt an installed Home-Screen app to pick up the hardened service worker. */
  try{navigator.serviceWorker?.getRegistration('./').then(r=>r?.update()).catch(()=>{})}catch(e){}

  window.__fcRuntimeHealth={legacyPushDisabled:true,unifiedTodayTimer:true,secureDocumentOpener:true,installedAt:new Date().toISOString()};
})();