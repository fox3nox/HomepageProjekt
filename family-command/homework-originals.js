/* Family Command · homework originals · 2026-08-24 */
(()=>{
  if(window.__fcHomeworkOriginalsInstalled)return;window.__fcHomeworkOriginalsInstalled=true;

  const DOC_BASE='https://lmrvapstojcecljjdgds.supabase.co/functions/v1/family-command-documents';
  let cache=null;

  function accessKey(){
    try{const p=document.cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith('fc_private_access='));if(p)return decodeURIComponent(p.split('=').slice(1).join('='))}catch(e){}
    try{return localStorage.getItem('fc-private-access-v1')||''}catch(e){return''}
  }
  function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
  function toast2(s){try{if(typeof toast==='function')toast(s)}catch(e){}}
  async function request(path,init={}){
    const headers=new Headers(init.headers||{});headers.set('x-fc-access',accessKey());
    return fetch(DOC_BASE+path,{...init,headers,cache:'no-store'});
  }
  async function docs(force=false){
    if(cache&&!force)return cache;
    const r=await request('/list');if(!r.ok)throw new Error('Dokumente konnten nicht geladen werden');
    const j=await r.json();cache=Array.isArray(j.documents)?j.documents:[];return cache;
  }
  function linked(d,kind,id){
    if(String(d?.source_kind||'')===kind&&String(d?.source_id||'')===String(id))return true;
    return Array.isArray(d?.links)&&d.links.some(x=>String(x?.source_kind||'')===kind&&String(x?.source_id||'')===String(id));
  }
  async function forHomework(id){return (await docs()).filter(d=>linked(d,'homework',id))}

  function ensureStyle(){if(document.getElementById('fc-hw-original-style'))return;const s=document.createElement('style');s.id='fc-hw-original-style';s.textContent=`
    .fc-hw-originals{margin:4px 0 12px;padding:12px;border:1px solid #1d3047;background:#091522;border-radius:14px}.fc-hw-originals>div:first-child{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}.fc-hw-originals h3{margin:0!important;font-size:12px!important;color:#f2f5f9!important}.fc-hw-originals small{color:#7e8fa7;font-size:9px}.fc-hw-docs{display:grid;gap:7px}.fc-hw-doc{width:100%;min-height:44px;border:1px solid #263a52;background:#0d1c2c;color:#e8edf5;border-radius:11px;padding:9px 10px;display:flex;align-items:center;gap:9px;text-align:left}.fc-hw-doc strong{flex:none;min-width:34px;font-size:9px;color:#8dafff}.fc-hw-doc span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:11px;font-weight:750}.fc-hw-add-original{width:100%;min-height:42px;margin-top:8px;border:1px dashed #334a67;background:transparent;color:#aebbd0;border-radius:11px;font-size:11px;font-weight:750}.fc-hw-original-empty{font-size:10px;color:#7e8fa7;padding:2px 0 4px}.fc-hw-uploading{opacity:.65;pointer-events:none}
  `;document.head.appendChild(s)}

  async function enhanceMenu(id){
    const menu=document.getElementById('v6HwMenu'),sheet=menu?.querySelector('.v6-sheet');if(!sheet)return;
    sheet.querySelector('.fc-hw-originals')?.remove();
    const box=document.createElement('section');box.className='fc-hw-originals';box.innerHTML='<div><h3>Original & Vorlage</h3><small>Privat gespeichert</small></div><div class="fc-hw-docs"><div class="fc-hw-original-empty">Wird geladen …</div></div><button type="button" class="fc-hw-add-original">＋ Foto oder PDF hinzufügen</button>';
    const actions=sheet.querySelector('.v6-sheet-actions');sheet.insertBefore(box,actions||null);
    box.querySelector('.fc-hw-add-original').onclick=()=>pickFile(id,box);
    try{
      const list=await forHomework(id);const root=box.querySelector('.fc-hw-docs');
      if(!list.length)root.innerHTML='<div class="fc-hw-original-empty">Noch kein Original mit dieser Aufgabe verknüpft.</div>';
      else root.innerHTML=list.map(d=>`<button type="button" class="fc-hw-doc" data-doc="${esc(d.id)}"><strong>${String(d.mime_type||'').includes('pdf')?'PDF':'BILD'}</strong><span>${esc(d.title||'Original')}</span></button>`).join('');
      root.querySelectorAll('[data-doc]').forEach(b=>b.onclick=()=>{if(typeof fcOpenOriginal==='function')fcOpenOriginal(b.dataset.doc)});
    }catch(e){box.querySelector('.fc-hw-docs').innerHTML='<div class="fc-hw-original-empty">Originale konnten nicht geladen werden.</div>'}
  }

  function pickFile(id,box){
    const h=(Array.isArray(data?.homework)?data.homework:[]).find(x=>String(x.id)===String(id));if(!h)return;
    const input=document.createElement('input');input.type='file';input.accept='image/*,application/pdf';input.style.display='none';
    input.onchange=async()=>{const file=input.files?.[0];if(!file){input.remove();return}if(file.size>15*1024*1024){toast2('Datei ist größer als 15 MB');input.remove();return}
      box.classList.add('fc-hw-uploading');
      try{
        const form=new FormData();form.append('file',file);form.append('personId',h.personId||'');form.append('title',file.name||h.title||'Hausaufgabe Original');form.append('sourceKind','homework');form.append('sourceId',String(id));
        const r=await request('/upload',{method:'POST',body:form});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Upload fehlgeschlagen');cache=null;toast2('Original gespeichert und angeheftet');await enhanceMenu(id);
      }catch(e){console.error('fc_hw_original_upload',e);toast2('Original konnte nicht gespeichert werden')}
      finally{box.classList.remove('fc-hw-uploading');input.remove()}
    };
    document.body.appendChild(input);input.click();
  }

  ensureStyle();
  const raw=window.v6HomeworkMenu;
  if(typeof raw==='function'){
    window.v6HomeworkMenu=function(id){const out=raw.call(this,id);queueMicrotask(()=>enhanceMenu(id));return out};
    try{v6HomeworkMenu=window.v6HomeworkMenu}catch(e){}
  }
  window.fcHomeworkOriginals={list:forHomework,refresh:()=>{cache=null},version:'1'};
})();
