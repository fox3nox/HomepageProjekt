/* Family Command · retired legacy compatibility shim · 2026-08-21
   The former file accumulated old UI overrides and contained a syntax error.
   Current functionality lives in the private bundle plus the dedicated runtime files.
   This small shim remains only so an older cached index can still boot safely. */
(()=>{
  if(typeof window.fcEventFilter==='undefined')window.fcEventFilter='all';
  if(typeof window.removeEvent!=='function'){
    window.removeEvent=function(id){
      try{
        const e=(data?.events||[]).find(x=>String(x.id)===String(id));if(!e)return;
        if(!confirm('Termin „'+e.title+'“ wirklich löschen?'))return;
        data.events=data.events.filter(x=>String(x.id)!==String(id));
        if(typeof save==='function')save();
        if(typeof renderEvents==='function')renderEvents(window.fcEventFilter||'all');
        if(typeof renderToday==='function')renderToday();
        if(typeof syncPush==='function')syncPush();
        if(typeof toast==='function')toast('Termin gelöscht');
      }catch(e){}
    };
    try{removeEvent=window.removeEvent}catch(e){}
  }
})();
