/* Family Command · stable Today/Tomorrow addons · 2026-08-24 */
(()=>{
  if(window.__fcTodayAddonsStabilizerInstalled)return;
  window.__fcTodayAddonsStabilizerInstalled=true;
  let queued=false,repairing=false;

  function needs(root){
    if(!root||!root.querySelector('.v6-page'))return false;
    return !root.querySelector('.fc-daily-check')||!root.querySelector('.fc-todo-card');
  }
  function repair(){
    queued=false;
    if(repairing)return;
    const today=document.getElementById('today'),tomorrow=document.getElementById('tomorrow');
    if(!needs(today)&&!needs(tomorrow))return;
    repairing=true;
    try{
      window.__fcDailyChecklist?.render?.();
      window.__fcTodo?.render?.();
    }catch(e){console.error('fc_addon_stabilizer',e)}
    finally{repairing=false}
  }
  function schedule(){
    if(queued||document.documentElement.dataset.fcReady!=='1')return;
    queued=true;
    requestAnimationFrame(repair);
  }
  for(const id of ['today','tomorrow']){
    const root=document.getElementById(id);
    if(!root)continue;
    new MutationObserver(schedule).observe(root,{childList:true,subtree:true});
  }
  if(typeof window.openScreen==='function'&&!window.openScreen.__fcAddonStable){
    const raw=window.openScreen;
    const wrapped=function(...args){const out=raw.apply(this,args);setTimeout(schedule,0);return out};
    wrapped.__fcAddonStable=true;
    window.openScreen=wrapped;
    try{openScreen=wrapped}catch(e){}
  }
  window.__fcTodayAddonsStabilizer={version:1,repair,schedule};
})();
