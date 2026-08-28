/* Family Command · reliable event deletion · V8.5 · observer-free */
(()=>{
  'use strict';
  if(window.__fcEventDeleteV6)return;window.__fcEventDeleteV6=true;
  const TOMBSTONES='fc-deleted-events-v1',MODAL='fcDeleteConfirm';
  const deleted=()=>{try{return new Set(JSON.parse(localStorage.getItem(TOMBSTONES)||'[]'))}catch(e){return new Set()}};
  const saveDeleted=s=>{try{localStorage.setItem(TOMBSTONES,JSON.stringify([...s]))}catch(e){}};
  const ev=id=>(data?.events||[]).find(x=>String(x.id)===String(id))||null;
  function persist(){try{if(typeof save==='function')save()}catch(e){console.error('fc_delete_save',e)}}
  function redraw(){try{window.__fcV8Shell?.invalidate?.(['today','events','week'])}catch(e){};for(const id of ['today','events','week'])try{if(document.getElementById(id)?.classList.contains('active'))window.__fcV8Shell?.render?.(id)}catch(e){}}
  function commit(id){const sid=String(id||'').trim();if(!sid||!Array.isArray(data?.events))return false;const s=deleted();s.add(sid);saveDeleted(s);data.events=data.events.filter(x=>String(x.id)!==sid);persist();document.getElementById(MODAL)?.remove();document.getElementById('fcEventDetails')?.remove();try{toast('Termin gelöscht')}catch(e){}redraw();return true}
  function confirmDelete(id){const sid=String(id||'').trim();if(!sid)return;document.getElementById(MODAL)?.remove();const title=ev(sid)?.title||'diesen Termin',m=document.createElement('div');m.id=MODAL;m.className='fc-delete-confirm';m.innerHTML='<div class="fc-delete-sheet" role="dialog" aria-modal="true"><h3>Termin löschen?</h3><p></p><div><button type="button" class="fc-delete-cancel">Abbrechen</button><button type="button" class="fc-delete-yes">Löschen</button></div></div>';m.querySelector('p').textContent='„'+title+'“ wird dauerhaft gelöscht.';m.querySelector('.fc-delete-cancel').onclick=()=>m.remove();m.querySelector('.fc-delete-yes').onclick=()=>commit(sid);m.onclick=e=>{if(e.target===m)m.remove()};document.body.appendChild(m)}
  function prune(){if(!Array.isArray(data?.events))return false;const s=deleted();if(!s.size)return false;const n=data.events.length;data.events=data.events.filter(x=>!s.has(String(x.id)));return n!==data.events.length}
  window.removeEvent=function(id){confirmDelete(id);return true};try{removeEvent=window.removeEvent}catch(e){}
  window.fcRestoreDeletedEvent=function(id){const s=deleted();s.delete(String(id||''));saveDeleted(s)};
  if(prune())persist();
  if(!document.getElementById('fc-delete-v6-style')){const s=document.createElement('style');s.id='fc-delete-v6-style';s.textContent='.fc-delete-confirm{position:fixed;inset:0;z-index:100400;background:rgba(15,23,42,.42);display:flex;align-items:flex-end;justify-content:center;padding:14px 14px calc(14px + env(safe-area-inset-bottom));backdrop-filter:blur(4px)}.fc-delete-sheet{width:min(100%,520px);background:#fff;border-radius:20px;padding:18px;box-shadow:0 18px 50px rgba(15,23,42,.22)}.fc-delete-sheet h3{margin:0;color:#172033;font-size:19px}.fc-delete-sheet p{margin:7px 0 16px;color:#667085;font-size:13px}.fc-delete-sheet>div{display:grid;grid-template-columns:1fr 1fr;gap:9px}.fc-delete-sheet button{min-height:46px;border-radius:12px;font-weight:850;font-size:14px}.fc-delete-cancel{background:#f5f7fa;border:1px solid #dce3ec;color:#455267}.fc-delete-yes{background:#b4232c;border:1px solid #b4232c;color:#fff}';document.head.appendChild(s)}
  window.__fcDeleteHealth={version:6,observer:false,tombstones:true,customConfirm:true};
})();
