/* Family Command · cloud snapshots + restore · 2026-08-24 */
(()=>{
  if(window.__fcBackupManagerInstalled)return;window.__fcBackupManagerInstalled=true;

  const BASE='https://lmrvapstojcecljjdgds.supabase.co/functions/v1/family-command-backups';
  let timer=0,busy=false,lastMeta=null,lastList=[];

  function accessKey(){
    try{const p=document.cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith('fc_private_access='));if(p)return decodeURIComponent(p.split('=').slice(1).join('='))}catch(e){}
    try{return localStorage.getItem('fc-private-access-v1')||''}catch(e){return''}
  }
  function toast2(s){try{if(typeof toast==='function')toast(s)}catch(e){}}
  function cloneState(){try{return JSON.parse(JSON.stringify(data))}catch(e){throw new Error('state unavailable')}}
  async function request(path,init={}){
    const headers=new Headers(init.headers||{});headers.set('x-fc-access',accessKey());
    return fetch(BASE+path,{...init,headers,cache:'no-store'});
  }
  function fmtTime(v){try{return new Intl.DateTimeFormat('de-CH',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(new Date(v))}catch(e){return String(v||'')}}

  async function backupNow(reason='manual',silent=false){
    if(busy)return false;busy=true;
    try{
      const state=cloneState();
      const r=await request('/snapshot',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({state,reason,schemaVersion:1})});
      const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'backup failed');lastMeta=j.snapshot||lastMeta;
      if(!silent)toast2(j.skipped?'Keine Änderungen seit letzter Sicherung':'Sicherung erstellt');
      refreshPanel();return true;
    }catch(e){console.error('fc_backup_now',e);if(!silent)toast2('Sicherung konnte nicht erstellt werden');return false}
    finally{busy=false}
  }
  function scheduleBackup(reason='auto'){
    clearTimeout(timer);timer=setTimeout(()=>backupNow(reason,true),1800);
  }

  async function listSnapshots(){
    const r=await request('/list');const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'list failed');lastList=Array.isArray(j.snapshots)?j.snapshots:[];lastMeta=lastList[0]||lastMeta;return lastList;
  }
  async function getSnapshot(id){const r=await request('/get?id='+encodeURIComponent(id));const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'snapshot missing');return j.snapshot}

  function validateState(s){return !!s&&typeof s==='object'&&Array.isArray(s.people)&&Array.isArray(s.events)&&s.schedules&&typeof s.schedules==='object'}
  async function restoreSnapshot(id){
    if(!confirm('Diesen Family-Command-Stand wirklich wiederherstellen? Der aktuelle Stand wird vorher nochmals gesichert.'))return;
    try{
      await backupNow('before-restore',true);
      const snap=await getSnapshot(id),next=snap?.state;if(!validateState(next))throw new Error('invalid snapshot');
      if(typeof data==='undefined'||!data||typeof data!=='object')throw new Error('state unavailable');
      Object.keys(data).forEach(k=>delete data[k]);Object.assign(data,JSON.parse(JSON.stringify(next)));
      try{if(typeof save==='function')save()}catch(e){}
      try{if(typeof syncPush==='function')syncPush()}catch(e){}
      const active=document.querySelector('.screen.active')?.id||'today';
      try{if(typeof openScreen==='function')openScreen(active);else{renderToday?.();renderWeek?.();renderEvents?.('all');renderMore?.()}}catch(e){}
      document.getElementById('fcBackupSheet')?.remove();toast2('Sicherung wiederhergestellt');scheduleBackup('restore');
    }catch(e){console.error('fc_backup_restore',e);toast2('Sicherung konnte nicht wiederhergestellt werden')}
  }

  async function openSheet(){
    document.getElementById('fcBackupSheet')?.remove();
    const m=document.createElement('div');m.id='fcBackupSheet';m.className='fc-backup-modal';m.innerHTML='<div class="fc-backup-sheet"><div class="fc-backup-head"><div><h3>Datensicherungen</h3><p>Die letzten unterschiedlichen Family-Command-Stände.</p></div><button type="button" class="fc-backup-close">×</button></div><div class="fc-backup-list"><div class="fc-backup-empty">Wird geladen …</div></div></div>';
    m.querySelector('.fc-backup-close').onclick=()=>m.remove();m.onclick=e=>{if(e.target===m)m.remove()};document.body.appendChild(m);
    try{
      const list=await listSnapshots(),root=m.querySelector('.fc-backup-list');
      if(!list.length){root.innerHTML='<div class="fc-backup-empty">Noch keine Sicherung vorhanden.</div>';return}
      root.innerHTML=list.map((s,i)=>`<div class="fc-backup-row"><div><b>${i===0?'Aktuellste Sicherung':'Sicherung'}</b><span>${fmtTime(s.created_at)} · ${String(s.reason||'auto')}</span></div><button type="button" data-id="${String(s.id).replace(/"/g,'')}">Wiederherstellen</button></div>`).join('');
      root.querySelectorAll('[data-id]').forEach(b=>b.onclick=()=>restoreSnapshot(b.dataset.id));
    }catch(e){m.querySelector('.fc-backup-list').innerHTML='<div class="fc-backup-empty">Sicherungen konnten nicht geladen werden.</div>'}
  }

  function ensureStyle(){if(document.getElementById('fc-backup-style'))return;const s=document.createElement('style');s.id='fc-backup-style';s.textContent=`
    .fc-backup-card{margin-top:14px;padding:14px;border:1px solid #1d3047;border-radius:16px;background:#0d1928;color:#eef3f9}.fc-backup-card-head{display:flex;align-items:flex-start;justify-content:space-between;gap:12px}.fc-backup-card h3{margin:0;font-size:15px}.fc-backup-card p{margin:4px 0 0;color:#7e8fa7;font-size:11px;line-height:1.4}.fc-backup-state{font-size:10px;color:#8fa2b9;white-space:nowrap}.fc-backup-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.fc-backup-actions button{min-height:42px;border-radius:11px;border:1px solid #263a52;background:#132133;color:#dce6f2;font-size:11px;font-weight:800}.fc-backup-actions button:first-child{background:linear-gradient(145deg,#625cff,#4d7dff);border-color:transparent;color:#fff}.fc-backup-modal{position:fixed;inset:0;z-index:99999;background:rgba(0,5,13,.72);display:flex;align-items:flex-end;justify-content:center;padding:10px calc(10px + env(safe-area-inset-right)) calc(10px + env(safe-area-inset-bottom)) calc(10px + env(safe-area-inset-left));backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px)}.fc-backup-sheet{width:min(100%,460px);max-height:82dvh;overflow:auto;border:1px solid #1d3047;border-radius:22px;background:#0d1928;padding:16px;color:#fff}.fc-backup-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:12px}.fc-backup-head h3{margin:0;font-size:20px}.fc-backup-head p{margin:4px 0 0;color:#7e8fa7;font-size:11px}.fc-backup-close{width:40px;height:40px;border-radius:11px;border:1px solid #263a52;background:#132133;color:#cbd5e2;font-size:22px}.fc-backup-list{display:grid;gap:8px}.fc-backup-row{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid #1d3047;background:#091522;border-radius:13px;padding:11px}.fc-backup-row div{min-width:0}.fc-backup-row b{display:block;font-size:12px}.fc-backup-row span{display:block;margin-top:3px;color:#7e8fa7;font-size:9px}.fc-backup-row button{flex:none;min-height:38px;border-radius:10px;border:1px solid #2a405c;background:#132133;color:#aebbd0;font-size:10px;font-weight:800}.fc-backup-empty{padding:16px;color:#7e8fa7;text-align:center;font-size:11px}
  `;document.head.appendChild(s)}
  function refreshPanel(){
    const root=document.getElementById('more');if(!root)return;let card=root.querySelector('.fc-backup-card');
    if(!card){card=document.createElement('section');card.className='fc-backup-card';const host=root.querySelector('.v6-page')||root;host.appendChild(card)}
    card.innerHTML=`<div class="fc-backup-card-head"><div><h3>Cloud-Sicherung</h3><p>Automatische private Sicherungen deiner Family-Command-Daten.</p></div><span class="fc-backup-state">${lastMeta?.created_at?fmtTime(lastMeta.created_at):'Noch nicht gesichert'}</span></div><div class="fc-backup-actions"><button type="button" class="fc-backup-now">Jetzt sichern</button><button type="button" class="fc-backup-open">Sicherungen</button></div>`;
    card.querySelector('.fc-backup-now').onclick=()=>backupNow('manual');card.querySelector('.fc-backup-open').onclick=openSheet;
  }

  ensureStyle();
  try{
    if(typeof renderMore==='function'&&!window.__fcBackupRenderWrapped){window.__fcBackupRenderWrapped=true;const raw=renderMore;window.renderMore=function(...a){const out=raw.apply(this,a);refreshPanel();listSnapshots().then(refreshPanel).catch(()=>{});return out};try{renderMore=window.renderMore}catch(e){}}
  }catch(e){console.error('fc_backup_render_wrap',e)}
  try{
    if(typeof save==='function'&&!window.__fcBackupSaveWrapped){window.__fcBackupSaveWrapped=true;const raw=save;window.save=function(...a){const out=raw.apply(this,a);scheduleBackup('save');return out};try{save=window.save}catch(e){}}
  }catch(e){console.error('fc_backup_save_wrap',e)}

  window.fcBackupNow=backupNow;window.fcOpenBackups=openSheet;window.__fcBackupHealth={version:1,retention:30,restore:true};
  setTimeout(()=>{listSnapshots().catch(()=>{});backupNow('startup',true)},2600);
})();
