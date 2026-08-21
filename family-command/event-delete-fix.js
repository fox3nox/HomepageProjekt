/* Family Command · reliable event deletion · 2026-08-21 */
(()=>{
  const TOMBSTONES='fc-deleted-events-v1';
  function loadDeleted(){try{return new Set(JSON.parse(localStorage.getItem(TOMBSTONES)||'[]'))}catch(e){return new Set()}}
  function saveDeleted(set){try{localStorage.setItem(TOMBSTONES,JSON.stringify([...set]))}catch(e){}}
  function rerender(){
    try{if(typeof save==='function')save()}catch(e){}
    try{if(typeof renderToday==='function')renderToday()}catch(e){}
    try{if(typeof renderEvents==='function')renderEvents(typeof fcEventFilter!=='undefined'?fcEventFilter:'all')}catch(e){}
    try{if(document.getElementById('week')?.classList.contains('active')&&typeof renderWeek==='function')renderWeek()}catch(e){}
    try{if(typeof syncPush==='function')syncPush()}catch(e){}
  }
  window.removeEvent=function(id){
    const sid=String(id||'');if(!sid)return;
    const ev=(data?.events||[]).find(x=>String(x.id)===sid);
    const label=ev?.title?` „${ev.title}“`:'';
    if(!confirm(`Termin${label} wirklich löschen?`))return;
    const deleted=loadDeleted();deleted.add(sid);saveDeleted(deleted);
    if(Array.isArray(data?.events)) data.events=data.events.filter(x=>String(x.id)!==sid);
    rerender();
    try{if(typeof toast==='function')toast('Termin gelöscht')}catch(e){}
  };
  window.fcRestoreDeletedEvent=function(id){const deleted=loadDeleted();deleted.delete(String(id||''));saveDeleted(deleted)};
  function prune(){
    if(!Array.isArray(data?.events))return;
    const deleted=loadDeleted();if(!deleted.size)return;
    const before=data.events.length;
    data.events=data.events.filter(x=>!deleted.has(String(x.id)));
    if(data.events.length!==before)rerender();
  }
  try{prune()}catch(e){}
})();
