/* Family Command · reliable event deletion v2 · 2026-08-21 */
(()=>{
  const TOMBSTONES='fc-deleted-events-v1';
  const MIGRATION='fc-delete-migration-20260821-v2';
  const FORCED_DELETES=['oli-aquarium-sale-20260821-1700'];

  function loadDeleted(){
    try{return new Set(JSON.parse(localStorage.getItem(TOMBSTONES)||'[]'))}
    catch(e){return new Set()}
  }
  function saveDeleted(set){
    try{localStorage.setItem(TOMBSTONES,JSON.stringify([...set]))}catch(e){}
  }
  function persist(){
    try{if(typeof save==='function')save()}catch(e){console.error('event_delete_save',e)}
  }
  function redraw(){
    try{if(typeof renderToday==='function')renderToday()}catch(e){console.error('event_delete_today',e)}
    try{if(typeof renderEvents==='function')renderEvents(typeof fcEventFilter!=='undefined'?fcEventFilter:'all')}catch(e){console.error('event_delete_events',e)}
    try{if(document.getElementById('week')?.classList.contains('active')&&typeof renderWeek==='function')renderWeek()}catch(e){}
    try{if(typeof renderHomeworkScreen==='function'&&document.getElementById('people')?.classList.contains('active'))renderHomeworkScreen()}catch(e){}
    try{if(typeof syncPush==='function')syncPush()}catch(e){}
  }
  function removeFromData(id){
    const sid=String(id||'');
    if(!sid||!Array.isArray(data?.events))return false;
    const before=data.events.length;
    data.events=data.events.filter(x=>String(x.id)!==sid);
    return data.events.length!==before;
  }
  function tombstone(id){
    const deleted=loadDeleted();
    deleted.add(String(id));
    saveDeleted(deleted);
  }
  function directDelete(id,{ask=true,card=null}={}){
    const sid=String(id||'').trim();if(!sid)return false;
    const ev=(data?.events||[]).find(x=>String(x.id)===sid);
    const label=ev?.title?` „${ev.title}“`:'';
    if(ask&&!confirm(`Termin${label} wirklich löschen?`))return false;

    tombstone(sid);
    removeFromData(sid);
    persist();

    /* Give immediate visual feedback even if another renderer is slow. */
    try{card?.remove()}catch(e){}
    try{if(typeof toast==='function')toast('Termin gelöscht')}catch(e){}
    setTimeout(redraw,0);
    return true;
  }

  /* Public API used by all current and legacy inline buttons. */
  window.removeEvent=function(id){return directDelete(id,{ask:true})};
  try{removeEvent=window.removeEvent}catch(e){}

  window.fcRestoreDeletedEvent=function(id){
    const deleted=loadDeleted();deleted.delete(String(id||''));saveDeleted(deleted)
  };

  function idFromInline(button){
    const attr=button?.getAttribute?.('onclick')||'';
    const m=attr.match(/removeEvent\((.*)\)/);if(!m)return'';
    const raw=m[1].trim();
    try{return String(JSON.parse(raw))}catch(e){}
    return raw.replace(/^['"]|['"]$/g,'');
  }

  /* Capture the click before fragile historical inline handlers can swallow it. */
  if(!window.__fcDeleteDelegateInstalled){
    window.__fcDeleteDelegateInstalled=true;
    document.addEventListener('click',e=>{
      const b=e.target?.closest?.('button[onclick*="removeEvent("],button[data-fc-delete-event]');
      if(!b)return;
      const id=b.dataset?.fcDeleteEvent||idFromInline(b);if(!id)return;
      e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
      const card=b.closest('.pro-event,.fc-month-event,.event-card,article');
      directDelete(id,{ask:true,card});
    },true);
  }

  function prune(){
    if(!Array.isArray(data?.events))return false;
    const deleted=loadDeleted();if(!deleted.size)return false;
    const before=data.events.length;
    data.events=data.events.filter(x=>!deleted.has(String(x.id)));
    return data.events.length!==before;
  }

  /* User explicitly requested the Nano Cube appointment to be deleted. */
  try{
    if(localStorage.getItem(MIGRATION)!=='1'){
      const deleted=loadDeleted();FORCED_DELETES.forEach(id=>deleted.add(id));saveDeleted(deleted);
      localStorage.setItem(MIGRATION,'1');
    }
  }catch(e){}

  try{if(prune()){persist();setTimeout(redraw,0)}}catch(e){console.error('event_delete_prune',e)}
  window.__fcDeleteHealth={version:2,delegate:true,tombstones:true};
})();
