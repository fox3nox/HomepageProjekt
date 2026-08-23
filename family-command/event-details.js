/* Family Command · event details + originals · 2026-08-23 */
(()=>{
  const DOC_BASE='https://lmrvapstojcecljjdgds.supabase.co/functions/v1/family-command-documents';
  const MODAL='fcEventDetails';
  const PICKER='fcDocPicker';
  const MONTH_SHORT=['JAN','FEB','MÄR','APR','MAI','JUN','JUL','AUG','SEP','OKT','NOV','DEZ'];
  const esc2=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const accessKey=()=>{try{const p=document.cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith('fc_private_access='));if(p)return decodeURIComponent(p.split('=').slice(1).join('='))}catch(e){}try{return localStorage.getItem('fc-private-access-v1')||''}catch(e){return''}};
  async function docFetch(path,opts={}){const h=new Headers(opts.headers||{});h.set('x-fc-access',accessKey());return fetch(DOC_BASE+path,{...opts,headers:h,cache:'no-store'})}
  async function docs(){const r=await docFetch('/list');if(!r.ok)throw new Error('Dokumente konnten nicht geladen werden');const j=await r.json();return j.documents||[]}
  function ev(id){return (data?.events||[]).find(x=>String(x.id)===String(id))||null}
  function people(e){return (e?.personIds||[]).map(id=>typeof person==='function'?person(id):null).filter(Boolean)}
  function dateLong(s){try{return new Intl.DateTimeFormat('de-CH',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(s+'T12:00:00'))}catch(e){return s}}
  function reminderText(n){n=Number(n);if(n===-1)return'Keine Erinnerung';if(n===0)return'Automatisch';if(n===60)return'1 Stunde vorher';if(n===90)return'1½ Stunden vorher';if(n===120)return'2 Stunden vorher';return n>0?n+' Minuten vorher':'Automatisch'}
  function toast2(t){try{if(typeof toast==='function')toast(t)}catch(e){}}

  async function attached(eventId){try{return (await docs()).filter(d=>d.source_kind==='event'&&String(d.source_id)===String(eventId))}catch(e){return[]}}

  window.fcEventUploadFile=async function(eventId,input,closePicker=false){
    const file=input?.files?.[0];if(!file)return;
    if(file.size>15728640){toast2('Datei ist zu gross · maximal 15 MB');input.value='';return}
    const e=ev(eventId);if(!e){toast2('Termin nicht gefunden');return}
    const holder=input.closest('.fc-detail-upload,.fc-picker-upload');const label=holder?.querySelector('b');const old=label?.textContent||'';if(label)label.textContent='Wird gespeichert …';input.disabled=true;
    try{
      const f=new FormData();f.append('file',file,file.name);f.append('personId',(e.personIds||[])[0]||'');f.append('title','Original · '+e.title);f.append('sourceKind','event');f.append('sourceId',String(e.id));
      const r=await docFetch('/upload',{method:'POST',body:f});const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Upload fehlgeschlagen');
      toast2('Original gespeichert und angeheftet');
      if(closePicker)document.getElementById(PICKER)?.remove();
      try{if(typeof renderEvents==='function'&&document.getElementById('events')?.classList.contains('active'))await renderEvents(typeof fcEventFilter==='string'?fcEventFilter:'all')}catch(e){}
      if(document.getElementById(MODAL))await window.fcOpenEventDetails(eventId,true);
      try{if(typeof renderDocs==='function'&&document.getElementById('more')?.classList.contains('active'))await renderDocs()}catch(e){}
    }catch(err){console.error('fc_event_upload',err);toast2('Original konnte nicht gespeichert werden')}
    finally{input.disabled=false;input.value='';if(label)label.textContent=old||'Foto oder Dokument auswählen'}
  };

  window.fcAttachExistingDoc=async function(docId,eventId){
    try{const r=await docFetch('/link',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({id:docId,sourceKind:'event',sourceId:eventId})});if(!r.ok)throw new Error();document.getElementById(PICKER)?.remove();toast2('Original angeheftet');if(document.getElementById(MODAL))await window.fcOpenEventDetails(eventId,true);if(typeof renderEvents==='function'&&document.getElementById('events')?.classList.contains('active'))await renderEvents(typeof fcEventFilter==='string'?fcEventFilter:'all')}catch(e){toast2('Dokument konnte nicht angeheftet werden')}
  };

  window.fcPickOriginal=async function(eventId){
    const e=ev(eventId);if(!e)return;
    let all=[];try{all=await docs()}catch(err){}
    document.getElementById(PICKER)?.remove();
    const m=document.createElement('div');m.id=PICKER;m.className='pro-modal fc-picker-modal';
    const existing=all.length?all.map(d=>'<button type="button" class="fc-picker-existing" data-doc="'+esc2(d.id)+'"><span class="pro-doc-icon">'+(String(d.mime_type||'').includes('pdf')?'PDF':'DOC')+'</span><div><b>'+esc2(d.title)+'</b><small>'+esc2(String(d.created_at||'').slice(0,10))+'</small></div></button>').join(''):'<div class="pro-empty">Noch kein anderes Original gespeichert.</div>';
    const fileId='fcEventPickerFile';
    m.innerHTML='<div class="pro-sheet fc-picker-sheet"><div class="pro-sheet-head"><div><h3>Original zu „'+esc2(e.title)+'“</h3><p>Direkt fotografieren/hochladen oder ein vorhandenes Original wählen.</p></div><button type="button" class="fc-picker-close">×</button></div><input id="'+fileId+'" type="file" accept="image/*,application/pdf" capture="environment" hidden><label class="fc-picker-upload" for="'+fileId+'"><span>＋</span><div><b>Foto oder Dokument hochladen</b><small>Wird sofort mit diesem Termin verknüpft.</small></div></label><div class="fc-picker-sep">ODER VORHANDENES ORIGINAL</div><div class="pro-picker-list">'+existing+'</div></div>';
    m.querySelector('.fc-picker-close').onclick=()=>m.remove();m.onclick=x=>{if(x.target===m)m.remove()};
    m.querySelector('#'+fileId).onchange=x=>window.fcEventUploadFile(eventId,x.target,true);
    m.querySelectorAll('.fc-picker-existing').forEach(b=>b.onclick=()=>window.fcAttachExistingDoc(b.dataset.doc,eventId));
    document.body.appendChild(m);
  };
  try{fcPickOriginal=window.fcPickOriginal}catch(e){}

  window.fcOpenEventDetails=async function(eventId,replace=false){
    const e=ev(eventId);if(!e)return;
    let ds=await attached(eventId);document.getElementById(MODAL)?.remove();
    const ps=people(e),fileId='fcDetailFile';const m=document.createElement('div');m.id=MODAL;m.className='fc-detail-modal';
    const docHtml=ds.length?ds.map(d=>'<button type="button" class="fc-detail-doc" data-doc="'+esc2(d.id)+'"><span>'+(String(d.mime_type||'').includes('pdf')?'PDF':'ORIGINAL')+'</span><div><b>'+esc2(d.title)+'</b><small>Original öffnen</small></div><em>›</em></button>').join(''):'<div class="fc-detail-no-doc">Noch kein Original angeheftet.</div>';
    const time=e.time?(esc2(e.time)+(e.end?'–'+esc2(e.end):'')+' Uhr'):'Keine Uhrzeit';
    m.innerHTML='<section class="fc-detail-sheet" role="dialog" aria-modal="true"><header><div><small>TERMINDETAILS</small><h2>'+esc2(e.title)+'</h2></div><button type="button" class="fc-detail-close">×</button></header><div class="fc-detail-grid"><div><span>Datum</span><b>'+esc2(dateLong(e.date))+'</b></div><div><span>Zeit</span><b>'+time+'</b></div></div><div class="fc-detail-people">'+ps.map(p=>'<span>'+esc2(p.name)+'</span>').join('')+'</div>'+(e.note?'<div class="fc-detail-note"><span>Informationen</span><p>'+esc2(e.note)+'</p></div>':'')+'<div class="fc-detail-rem"><span>Erinnerung</span><b>'+esc2(reminderText(e.reminderLead))+'</b></div><div class="fc-detail-docs"><div class="fc-detail-head"><div><span>ORIGINALE</span><b>'+ds.length+' angeheftet</b></div></div>'+docHtml+'<input id="'+fileId+'" type="file" accept="image/*,application/pdf" capture="environment" hidden><label class="fc-detail-upload" for="'+fileId+'"><span>＋</span><div><b>Foto oder Dokument hinzufügen</b><small>Direkt an diesen Termin anhängen</small></div></label></div></section>';
    m.querySelector('.fc-detail-close').onclick=()=>m.remove();m.onclick=x=>{if(x.target===m)m.remove()};m.querySelector('#'+fileId).onchange=x=>window.fcEventUploadFile(eventId,x.target,false);m.querySelectorAll('.fc-detail-doc').forEach(b=>b.onclick=()=>{if(typeof fcOpenOriginal==='function')fcOpenOriginal(b.dataset.doc)});document.body.appendChild(m);
  };

  function idFromCard(card){
    const direct=card?.dataset?.eventId;if(direct)return direct;
    for(const b of card?.querySelectorAll?.('button')||[]){if(b.dataset?.fcDeleteEvent)return b.dataset.fcDeleteEvent;const s=String(b.getAttribute('onclick')||''),m=s.match(/(?:removeEvent|fcPickOriginal)\((['"])(.*?)\1\)/);if(m)return m[2]}
    const title=(card?.querySelector('h3')?.textContent||'').trim(),tm=(card?.querySelector('time')?.textContent||'').trim().slice(0,5);const ms=(data?.events||[]).filter(e=>String(e.title||'').trim()===title&&(!tm||String(e.time||'')===tm));return ms.length===1?String(ms[0].id):'';
  }
  function enhanceEventCards(){document.querySelectorAll('#events .pro-event').forEach(card=>{const id=idFromCard(card);if(!id)return;card.dataset.eventId=id;card.classList.add('fc-detail-clickable');if(card.dataset.fcDetailBound==='1')return;card.dataset.fcDetailBound='1';card.addEventListener('click',x=>{if(x.target.closest('button,a,input,label,select,textarea'))return;window.fcOpenEventDetails(id)});});}

  function addDaysISO(n){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+n);return d.toISOString().slice(0,10)}
  function next7DateMap(){const m=new Map();for(let i=1;i<=7;i++){const s=addDaysISO(i),d=new Date(s+'T12:00:00');m.set(String(d.getDate()).padStart(2,'0')+' '+MONTH_SHORT[d.getMonth()],s)}return m}
  function normal(s){return String(s||'').replace(/\s+/g,' ').trim().toLowerCase()}
  function enhance7Day(){const dm=next7DateMap();document.querySelectorAll('.fc-7day-row').forEach(row=>{const lab=(row.querySelector('.fc-7day-date span')?.textContent||'').trim().toUpperCase(),date=dm.get(lab);if(!date)return;row.querySelectorAll('.fc-7day-items .event').forEach(sp=>{const txt=normal(sp.textContent),matches=(data?.events||[]).filter(e=>(e.date===date||((e.endDate||'')&&e.date<=date&&e.endDate>=date))&&normal((e.time?e.time+' · ':'')+e.title)===txt);if(matches.length!==1)return;const id=String(matches[0].id);sp.dataset.eventId=id;sp.classList.add('fc-7day-open');if(sp.dataset.fcDetailBound==='1')return;sp.dataset.fcDetailBound='1';sp.tabIndex=0;sp.setAttribute('role','button');sp.addEventListener('click',()=>window.fcOpenEventDetails(id));sp.addEventListener('keydown',x=>{if(x.key==='Enter'||x.key===' '){x.preventDefault();window.fcOpenEventDetails(id)}});});});}
  function enhanceAll(){enhanceEventCards();enhance7Day()}

  try{if(typeof renderEvents==='function'){const base=renderEvents;const wrapped=async function(...a){const out=await base.apply(this,a);enhanceEventCards();return out};window.renderEvents=wrapped;try{renderEvents=wrapped}catch(e){}}}catch(e){}
  try{if(typeof renderToday==='function'){const base=renderToday;const wrapped=function(...a){const out=base.apply(this,a);enhance7Day();requestAnimationFrame(enhance7Day);return out};window.renderToday=wrapped;try{renderToday=wrapped}catch(e){}}}catch(e){}
  try{if(typeof renderWeek==='function'){const base=renderWeek;const wrapped=function(...a){const out=base.apply(this,a);enhance7Day();requestAnimationFrame(enhance7Day);return out};window.renderWeek=wrapped;try{renderWeek=wrapped}catch(e){}}}catch(e){}
  const ob=new MutationObserver(()=>queueMicrotask(enhanceAll));try{ob.observe(document.querySelector('.content')||document.body,{subtree:true,childList:true})}catch(e){}

  const st=document.createElement('style');st.id='fc-event-details-style';st.textContent=`
    #events .pro-event.fc-detail-clickable{cursor:pointer}.fc-7day-open{display:block!important;border-radius:8px;padding:5px 7px!important;margin:-2px -4px!important;background:#f7f9fc!important;border:1px solid #e3e9f0!important;cursor:pointer;touch-action:manipulation}.fc-7day-open:after{content:' ›';font-weight:1000;color:#64748b}
    .fc-detail-modal,.fc-picker-modal{position:fixed;inset:0;z-index:100300;background:rgba(15,23,42,.48);backdrop-filter:blur(5px);display:flex;align-items:flex-end;justify-content:center;padding:12px}.fc-detail-sheet,.fc-picker-sheet{width:min(560px,100%);max-height:92dvh;overflow:auto;background:#fff;border-radius:24px;padding:16px;margin-bottom:max(2px,env(safe-area-inset-bottom));box-shadow:0 22px 60px rgba(15,23,42,.28)}.fc-detail-sheet header{display:flex;justify-content:space-between;align-items:flex-start;gap:10px}.fc-detail-sheet header small{font-size:8px;font-weight:1000;letter-spacing:.13em;color:#788394}.fc-detail-sheet h2{margin:4px 0 0;font-size:23px;line-height:1.12;color:#172033;letter-spacing:-.025em}.fc-detail-close,.fc-picker-close{width:38px;height:38px;border:0;border-radius:999px;background:#f1f5f9;font-size:22px;color:#475569;flex:none}.fc-detail-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:16px}.fc-detail-grid>div,.fc-detail-rem{background:#f7f9fc;border:1px solid #e2e8f0;border-radius:13px;padding:10px}.fc-detail-grid span,.fc-detail-rem span,.fc-detail-note span,.fc-detail-head span{display:block;font-size:8px;font-weight:1000;letter-spacing:.1em;color:#7a8494}.fc-detail-grid b,.fc-detail-rem b{display:block;margin-top:4px;font-size:12px;color:#27364a}.fc-detail-people{display:flex;gap:6px;flex-wrap:wrap;margin:9px 0}.fc-detail-people span{background:#edf3fb;color:#315f97;border:1px solid #cfdaea;border-radius:999px;padding:6px 9px;font-size:9px;font-weight:900}.fc-detail-note{border:1px solid #dfe5ec;border-radius:14px;padding:11px;margin-top:8px}.fc-detail-note p{margin:5px 0 0;font-size:12px;line-height:1.5;color:#46546a;white-space:pre-wrap}.fc-detail-rem{margin-top:8px}.fc-detail-docs{margin-top:15px;border-top:1px solid #e5eaf0;padding-top:13px;display:grid;gap:8px}.fc-detail-head b{display:block;margin-top:3px;font-size:13px;color:#27364a}.fc-detail-doc{width:100%;border:1px solid #dfe5ec;background:#fff;border-radius:13px;padding:10px;display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:center;text-align:left}.fc-detail-doc>span{background:#edf3fb;color:#315f97;border-radius:9px;padding:8px;font-size:8px;font-weight:1000}.fc-detail-doc b{display:block;font-size:11px;color:#27364a}.fc-detail-doc small{display:block;font-size:8px;color:#7a8494;margin-top:2px}.fc-detail-doc em{font-style:normal;font-size:20px;color:#667085}.fc-detail-no-doc{font-size:10px;color:#7a8494;padding:4px 1px}.fc-detail-upload,.fc-picker-upload{border:1.5px dashed #9fb6d2;background:#f2f7fc;color:#315f82;border-radius:14px;padding:11px;display:flex;align-items:center;gap:10px;cursor:pointer;touch-action:manipulation}.fc-detail-upload>span,.fc-picker-upload>span{width:32px;height:32px;border-radius:10px;background:#426aa3;color:#fff;display:grid;place-items:center;font-size:20px;font-weight:500;flex:none}.fc-detail-upload b,.fc-picker-upload b{display:block;font-size:11px}.fc-detail-upload small,.fc-picker-upload small{display:block;font-size:8px;color:#66809b;margin-top:2px}.fc-picker-sep{font-size:7px;font-weight:1000;letter-spacing:.1em;color:#98a2b3;margin:12px 2px 5px}.fc-picker-existing{width:100%;border:1px solid #e0e6ed;background:#fff;border-radius:12px;padding:9px;display:flex;gap:9px;align-items:center;text-align:left}.fc-picker-existing div{min-width:0}.fc-picker-existing b{display:block;font-size:10px;color:#27364a;overflow-wrap:anywhere}.fc-picker-existing small{display:block;font-size:8px;color:#7a8494;margin-top:2px}
    @media(max-width:430px){.fc-detail-grid{grid-template-columns:1fr}.fc-detail-sheet,.fc-picker-sheet{border-radius:22px;padding:15px}}
  `;document.head.appendChild(st);
  enhanceAll();setTimeout(enhanceAll,300);window.__fcEventDetailsHealth={version:1,directUpload:true,sevenDayNavigation:true,eventDetails:true};
})();
