/* Family Command · reliable event deletion v3 · 2026-08-21 */
(()=>{
  const TOMBSTONES='fc-deleted-events-v1';
  const FORCED_DELETES=['oli-aquarium-sale-20260821-1700'];
  const MODAL_ID='fcDeleteConfirm';
  let lastTouch=0;

  function loadDeleted(){try{return new Set(JSON.parse(localStorage.getItem(TOMBSTONES)||'[]'))}catch(e){return new Set()}}
  function saveDeleted(set){try{localStorage.setItem(TOMBSTONES,JSON.stringify([...set]))}catch(e){}}
  function tombstone(id){const s=loadDeleted();s.add(String(id));saveDeleted(s)}
  function persist(){try{if(typeof save==='function')save()}catch(e){console.error('fc_delete_save',e)}}
  function redraw(){
    try{if(typeof renderToday==='function')renderToday()}catch(e){console.error('fc_delete_today',e)}
    try{if(typeof renderEvents==='function')renderEvents(typeof fcEventFilter!=='undefined'?fcEventFilter:'all')}catch(e){console.error('fc_delete_events',e)}
    try{if(document.getElementById('week')?.classList.contains('active')&&typeof renderWeek==='function')renderWeek()}catch(e){}
    try{if(typeof syncPush==='function')syncPush()}catch(e){}
  }
  function removeFromData(id){
    const sid=String(id||'');if(!sid||!Array.isArray(data?.events))return false;
    const before=data.events.length;data.events=data.events.filter(x=>String(x.id)!==sid);return data.events.length!==before;
  }
  function finishDelete(id,card){
    const sid=String(id||'').trim();if(!sid)return false;
    tombstone(sid);removeFromData(sid);persist();
    try{card?.remove()}catch(e){}
    document.getElementById(MODAL_ID)?.remove();
    try{if(typeof toast==='function')toast('Termin gelöscht')}catch(e){}
    setTimeout(redraw,20);return true;
  }
  function eventById(id){return (data?.events||[]).find(x=>String(x.id)===String(id))||null}
  function showConfirm(id,card){
    const sid=String(id||'').trim();if(!sid)return;
    document.getElementById(MODAL_ID)?.remove();
    const ev=eventById(sid),title=ev?.title||'diesen Termin';
    const m=document.createElement('div');m.id=MODAL_ID;m.className='fc-delete-confirm';
    m.innerHTML='<div class="fc-delete-sheet" role="dialog" aria-modal="true"><h3>Termin löschen?</h3><p></p><div><button type="button" class="fc-delete-cancel">Abbrechen</button><button type="button" class="fc-delete-yes">Löschen</button></div></div>';
    m.querySelector('p').textContent='„'+title+'“ wird dauerhaft gelöscht.';
    m.querySelector('.fc-delete-cancel').addEventListener('click',()=>m.remove(),{once:true});
    m.querySelector('.fc-delete-yes').addEventListener('click',()=>finishDelete(sid,card),{once:true});
    m.addEventListener('click',e=>{if(e.target===m)m.remove()});
    document.body.appendChild(m);
  }
  function idFromInline(button){
    const attr=button?.getAttribute?.('onclick')||'',m=attr.match(/removeEvent\((.*)\)/);if(!m)return'';
    const raw=m[1].trim();try{return String(JSON.parse(raw))}catch(e){}return raw.replace(/^['"]|['"]$/g,'');
  }
  function inferId(button){
    const direct=button?.dataset?.fcDeleteEvent||idFromInline(button);if(direct)return String(direct);
    const card=button?.closest?.('.pro-event,.fc-month-event,.event-card,article');if(!card)return'';
    const title=(card.querySelector('h3')?.textContent||'').trim();
    const time=(card.querySelector('time')?.textContent||'').trim().slice(0,5);
    const matches=(data?.events||[]).filter(e=>(!title||String(e.title||'').trim()===title)&&(!time||String(e.time||'')===time));
    return matches.length===1?String(matches[0].id):'';
  }
  function activate(button,e){
    const id=button.dataset.fcDeleteEvent||inferId(button);if(!id)return;
    e?.preventDefault?.();e?.stopPropagation?.();e?.stopImmediatePropagation?.();
    showConfirm(id,button.closest('.pro-event,.fc-month-event,.event-card,article'));
  }
  function bindButton(button){
    if(!(button instanceof HTMLElement))return;
    const id=inferId(button);if(!id)return;
    button.dataset.fcDeleteEvent=id;button.removeAttribute('onclick');button.type='button';button.classList.add('fc-event-delete-live');
    if(button.dataset.fcDeleteBound==='1')return;button.dataset.fcDeleteBound='1';
    button.addEventListener('touchend',e=>{lastTouch=Date.now();activate(button,e)},{passive:false,capture:true});
    button.addEventListener('click',e=>{if(Date.now()-lastTouch<900){e.preventDefault();e.stopPropagation();return}activate(button,e)},true);
  }
  function bindAll(root=document){
    const scope=root?.querySelectorAll?root:document;
    scope.querySelectorAll('#events button[data-fc-delete-event],#events button[onclick*="removeEvent("],#events .pro-event-actions button,#events .fc-term-bottom button').forEach(b=>{
      if((b.textContent||'').trim()==='Löschen'||b.dataset.fcDeleteEvent||String(b.getAttribute('onclick')||'').includes('removeEvent('))bindButton(b)
    });
  }
  window.removeEvent=function(id){showConfirm(id,null);return true};
  try{removeEvent=window.removeEvent}catch(e){}
  window.fcRestoreDeletedEvent=function(id){const s=loadDeleted();s.delete(String(id||''));saveDeleted(s)};

  const style=document.createElement('style');style.id='fc-delete-v3-style';style.textContent=`
    #events .pro-event-actions,#events .fc-term-bottom{position:relative!important;z-index:20!important;pointer-events:auto!important}
    #events button.fc-event-delete-live{position:relative!important;z-index:30!important;pointer-events:auto!important;touch-action:manipulation!important;-webkit-tap-highlight-color:rgba(185,28,28,.12)!important;color:#a33b42!important;border:1px solid #e6b6ba!important;background:#fff7f7!important;cursor:pointer!important}
    #events .pro-event::before,#events .pro-event::after,#events .fc-month-event::before,#events .fc-month-event::after{pointer-events:none!important}
    .fc-delete-confirm{position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,.42);display:flex;align-items:flex-end;justify-content:center;padding:14px 14px calc(14px + env(safe-area-inset-bottom));backdrop-filter:blur(4px)}
    .fc-delete-sheet{width:min(100%,520px);background:#fff;border-radius:20px;padding:18px;box-shadow:0 18px 50px rgba(15,23,42,.22)}
    .fc-delete-sheet h3{margin:0;color:#172033;font-size:19px}.fc-delete-sheet p{margin:7px 0 16px;color:#667085;font-size:13px;line-height:1.4}
    .fc-delete-sheet>div{display:grid;grid-template-columns:1fr 1fr;gap:9px}.fc-delete-sheet button{min-height:46px;border-radius:12px;font-weight:850;font-size:14px}
    .fc-delete-cancel{background:#f5f7fa;border:1px solid #dce3ec;color:#455267}.fc-delete-yes{background:#b4232c;border:1px solid #b4232c;color:#fff}
  `;document.head.appendChild(style);

  const observer=new MutationObserver(ms=>{for(const m of ms)for(const n of m.addedNodes)if(n.nodeType===1)bindAll(n)});
  try{observer.observe(document.getElementById('events')||document.body,{childList:true,subtree:true})}catch(e){}
  document.addEventListener('click',e=>{const b=e.target?.closest?.('#events button');if(!b)return;if((b.textContent||'').trim()==='Löschen')bindButton(b)},true);

  function prune(){
    if(!Array.isArray(data?.events))return false;const deleted=loadDeleted();if(!deleted.size)return false;
    const before=data.events.length;data.events=data.events.filter(x=>!deleted.has(String(x.id)));return before!==data.events.length;
  }
  try{const deleted=loadDeleted();FORCED_DELETES.forEach(id=>deleted.add(id));saveDeleted(deleted)}catch(e){}
  try{if(prune())persist()}catch(e){}
  bindAll();setTimeout(bindAll,0);setTimeout(bindAll,500);
  window.__fcDeleteHealth={version:3,directBinding:true,customConfirm:true,tombstones:true};
})();
