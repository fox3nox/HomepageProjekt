/* Familienzentrale · Cloud-Sicherungen · native V9 runtime */
(()=>{
  'use strict';
  if(window.__fcBackupManagerInstalled)return;window.__fcBackupManagerInstalled=true;

  const BASE='https://lmrvapstojcecljjdgds.supabase.co/functions/v1/family-command-backups';
  const MODAL='fcBackupSheet';
  let timer=0,busy=false,lastMeta=null,lastList=[];

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function accessKey(){
    try{const p=document.cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith('fc_private_access='));if(p)return decodeURIComponent(p.split('=').slice(1).join('='))}catch(e){}
    try{return localStorage.getItem('fc-private-access-v1')||''}catch(e){return''}
  }
  function toast2(s){try{if(typeof toast==='function')toast(s)}catch(e){}}
  function cloneState(){try{return JSON.parse(JSON.stringify(data))}catch(e){throw new Error('state unavailable')}}
  async function request(path,init={}){
    const headers=new Headers(init.headers||{}),key=accessKey();if(key)headers.set('x-fc-access',key);
    return fetch(BASE+path,{...init,headers,cache:'no-store'});
  }
  function fmtTime(v){try{return new Intl.DateTimeFormat('de-CH',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(v))}catch(e){return String(v||'')}}
  function reasonLabel(v){return({manual:'Manuell',save:'Automatisch',startup:'Beim Start','before-restore':'Vor Wiederherstellung',restore:'Nach Wiederherstellung',auto:'Automatisch'})[String(v||'')]||'Automatisch'}

  function ensureStyle(){
    if(document.getElementById('fc-backup-v9-style'))return;
    const s=document.createElement('style');s.id='fc-backup-v9-style';s.textContent=`
      .fc-bu-modal{position:fixed;inset:0;z-index:100360;background:rgba(15,23,42,.45);backdrop-filter:blur(5px);display:flex;align-items:flex-end;justify-content:center;padding:12px 12px calc(12px + env(safe-area-inset-bottom))}.fc-bu-sheet{width:min(560px,100%);max-height:90dvh;overflow:auto;background:#fff;border-radius:24px;padding:16px;box-shadow:0 22px 60px rgba(15,23,42,.25);box-sizing:border-box}.fc-bu-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}.fc-bu-head small{display:block;font-size:8px;font-weight:1000;letter-spacing:.12em;color:#7a8494}.fc-bu-head h2{margin:4px 0 0;font-size:21px;color:#172033}.fc-bu-head p{margin:5px 0 0;color:#7b899d;font-size:10px;line-height:1.45}.fc-bu-close{width:40px;height:40px;min-width:40px;border:0;border-radius:999px;background:#f1f5f9;color:#475569;font-size:22px}.fc-bu-summary{margin-top:14px;padding:12px;border:1px solid #dfe5ed;background:#f8fafc;border-radius:14px;display:flex;align-items:center;justify-content:space-between;gap:12px}.fc-bu-summary div{min-width:0}.fc-bu-summary b{display:block;color:#27364a;font-size:12px}.fc-bu-summary span{display:block;margin-top:3px;color:#7b899d;font-size:9px}.fc-bu-now{min-height:44px;flex:none;border:1px solid #263a67;border-radius:11px;background:#263a67;color:#fff;padding:0 13px;font-size:10px;font-weight:900}.fc-bu-now:disabled{opacity:.55}.fc-bu-list{display:grid;gap:8px;margin-top:12px}.fc-bu-row{min-height:58px;border:1px solid #e0e6ee;background:#fff;border-radius:13px;padding:10px;display:flex;align-items:center;justify-content:space-between;gap:10px}.fc-bu-row>div{min-width:0}.fc-bu-row b{display:block;color:#2b384b;font-size:11px}.fc-bu-row span{display:block;margin-top:3px;color:#8491a4;font-size:9px}.fc-bu-restore{min-height:42px;flex:none;border:1px solid #d8e0ea;background:#f7f9fc;color:#334155;border-radius:10px;padding:0 10px;font-size:9px;font-weight:900}.fc-bu-empty{padding:18px;border:1px dashed #d6dde7;border-radius:13px;color:#7a8494;font-size:10px;text-align:center}.fc-bu-error{padding:14px;border:1px solid #f0d4d4;background:#fff8f8;border-radius:13px;color:#9b3b3b;font-size:10px;text-align:center}
    `;document.head.appendChild(s);
  }
  function close(){document.getElementById(MODAL)?.remove()}
  function setBusy(on){busy=!!on;const b=document.querySelector(`#${MODAL} .fc-bu-now`);if(b){b.disabled=busy;b.textContent=busy?'Sichere …':'Jetzt sichern'}}

  async function backupNow(reason='manual',silent=false){
    if(busy)return false;setBusy(true);
    try{
      const state=cloneState();
      const r=await request('/snapshot',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({state,reason,schemaVersion:1})});
      const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'backup failed');lastMeta=j.snapshot||lastMeta;
      if(!silent)toast2(j.skipped?'Keine Änderungen seit letzter Sicherung':'Sicherung erstellt');
      if(document.getElementById(MODAL))await renderList();
      return true;
    }catch(e){console.error('fc_backup_now',e);if(!silent)toast2('Sicherung konnte nicht erstellt werden');return false}
    finally{setBusy(false)}
  }
  function scheduleBackup(reason='save'){clearTimeout(timer);timer=setTimeout(()=>backupNow(reason,true),1800)}

  async function listSnapshots(){
    const r=await request('/list'),j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'list failed');lastList=Array.isArray(j.snapshots)?j.snapshots:[];lastMeta=lastList[0]||lastMeta;return lastList;
  }
  async function getSnapshot(id){const r=await request('/get?id='+encodeURIComponent(id)),j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'snapshot missing');return j.snapshot}
  function validateState(s){return !!s&&typeof s==='object'&&Array.isArray(s.people)&&Array.isArray(s.events)&&s.schedules&&typeof s.schedules==='object'}
  function rerenderV9(){
    try{window.__fcV9?.invalidate?.(['today','tomorrow','events','homework','more','people']);const screen=window.__fcV9?.state?.screen||'today';window.__fcV9?.render?.(screen,true)}catch(e){console.error('fc_backup_v9_render',e)}
  }
  async function restoreSnapshot(id){
    if(!confirm('Diese Sicherung wirklich wiederherstellen? Der aktuelle Stand wird vorher nochmals gesichert.'))return;
    try{
      await backupNow('before-restore',true);
      const snap=await getSnapshot(id),next=snap?.state;if(!validateState(next))throw new Error('invalid snapshot');
      if(typeof data==='undefined'||!data||typeof data!=='object')throw new Error('state unavailable');
      Object.keys(data).forEach(k=>delete data[k]);Object.assign(data,JSON.parse(JSON.stringify(next)));
      try{if(typeof save==='function')await save()}catch(e){}
      try{if(typeof syncPush==='function')await syncPush()}catch(e){}
      rerenderV9();close();toast2('Sicherung wiederhergestellt');scheduleBackup('restore');
    }catch(e){console.error('fc_backup_restore',e);toast2('Sicherung konnte nicht wiederhergestellt werden')}
  }

  async function renderList(){
    const m=document.getElementById(MODAL);if(!m)return;
    const root=m.querySelector('.fc-bu-list'),meta=m.querySelector('.fc-bu-summary span');if(root)root.innerHTML='<div class="fc-bu-empty">Sicherungen werden geladen …</div>';
    try{
      const list=await listSnapshots();if(meta)meta.textContent=lastMeta?.created_at?'Zuletzt: '+fmtTime(lastMeta.created_at):'Noch keine Sicherung vorhanden';
      if(!root)return;if(!list.length){root.innerHTML='<div class="fc-bu-empty">Noch keine Sicherung vorhanden.</div>';return}
      root.innerHTML=list.map((s,i)=>`<div class="fc-bu-row"><div><b>${i===0?'Aktuellste Sicherung':'Sicherung'}</b><span>${esc(fmtTime(s.created_at))} · ${esc(reasonLabel(s.reason))}</span></div><button type="button" class="fc-bu-restore" data-id="${esc(s.id)}">Wiederherstellen</button></div>`).join('');
      root.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>restoreSnapshot(b.dataset.id));
    }catch(e){console.error('fc_backup_list',e);if(root)root.innerHTML='<div class="fc-bu-error">Sicherungen konnten nicht geladen werden.</div>'}
  }
  async function openSheet(){
    close();ensureStyle();const m=document.createElement('div');m.id=MODAL;m.className='fc-bu-modal';m.innerHTML=`<section class="fc-bu-sheet" role="dialog" aria-modal="true" aria-labelledby="fcBuTitle"><div class="fc-bu-head"><div><small>CLOUD-SICHERUNG</small><h2 id="fcBuTitle">Datensicherungen</h2><p>Private Sicherung deiner aktuellen Familienzentrale-Daten.</p></div><button type="button" class="fc-bu-close" aria-label="Schließen">×</button></div><div class="fc-bu-summary"><div><b>Automatische Sicherung aktiv</b><span>${lastMeta?.created_at?'Zuletzt: '+esc(fmtTime(lastMeta.created_at)):'Status wird geladen …'}</span></div><button type="button" class="fc-bu-now">Jetzt sichern</button></div><div class="fc-bu-list"><div class="fc-bu-empty">Sicherungen werden geladen …</div></div></section>`;
    m.querySelector('.fc-bu-close').onclick=close;m.onclick=e=>{if(e.target===m)close()};m.querySelector('.fc-bu-now').onclick=()=>backupNow('manual');document.body.appendChild(m);await renderList();return m;
  }

  ensureStyle();
  try{
    if(typeof save==='function'&&!window.__fcBackupSaveWrapped){window.__fcBackupSaveWrapped=true;const raw=save;window.save=function(...a){const out=raw.apply(this,a);scheduleBackup('save');return out};try{save=window.save}catch(e){}}
  }catch(e){console.error('fc_backup_save_wrap',e)}

  window.fcBackupNow=backupNow;window.fcOpenBackups=openSheet;window.__fcBackupHealth={version:2,v9Native:true,legacySelectors:false,renderWrapper:false,retention:30,restore:true};
  setTimeout(()=>{listSnapshots().catch(()=>{});backupNow('startup',true)},2600);
})();
