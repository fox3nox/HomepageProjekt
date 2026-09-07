/* Family Command · document review before every import; originals stay private. */
(()=>{
  'use strict';
  if(window.__fcSmartDocumentsInstalled)return;
  window.__fcSmartDocumentsInstalled=true;

  const DOC='https://lmrvapstojcecljjdgds.supabase.co/functions/v1/family-command-documents';
  const AI='https://lmrvapstojcecljjdgds.supabase.co/functions/v1/family-command-ai-budgeted/document';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const key=()=>{try{const p=document.cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith('fc_private_access='));if(p)return decodeURIComponent(p.split('=').slice(1).join('='))}catch{}try{return localStorage.getItem('fc-private-access-v1')||''}catch{return''}};
  const people=()=>Array.isArray(window.data?.people)?window.data.people:[];
  const headers=()=>({'x-fc-access':key()});
  const isoNow=()=>new Date().toISOString();
  const norm=s=>String(s||'').trim().toLocaleLowerCase('de-CH').replace(/\s+/g,' ');
  let docs=[],filter='all',search='';
  const reviews=new WeakMap();

  function installStyle(){
    if(document.getElementById('fc-smart-doc-style'))return;
    const s=document.createElement('style');
    s.id='fc-smart-doc-style';
    s.textContent=`
      .fc-doc-center{--doc-accent:#2167e8;--doc-ink:#102a50;--doc-muted:#71809a;--doc-line:#dce5f0;--doc-soft:#f5f8fc}
      .fc-doc-center .fc9-sheet{width:min(760px,calc(100vw - 20px));max-height:min(900px,calc(100dvh - 24px));overflow:hidden;display:flex;flex-direction:column}
      .fc-doc-center .fc9-sheet-head{flex:0 0 auto;padding-bottom:14px}
      .fc-doc-center .fc9-sheet-head p{max-width:560px}
      .fc-doc-scroll{overflow:auto;overscroll-behavior:contain;padding-bottom:max(20px,env(safe-area-inset-bottom))}
      .fc-doc-upload{margin:0 16px 16px;padding:16px;border:1px solid var(--doc-line);border-radius:20px;background:linear-gradient(180deg,#f8fbff,#f4f8fd);display:grid;gap:13px}
      .fc-doc-upload-title{display:flex;align-items:flex-start;gap:11px}.fc-doc-upload-title .icon{width:40px;height:40px;border-radius:12px;background:#e9f1ff;color:var(--doc-accent);display:grid;place-items:center;font-size:20px;flex:0 0 40px}
      .fc-doc-upload-title b{display:block;color:var(--doc-ink);font-size:15px}.fc-doc-upload-title span{display:block;color:var(--doc-muted);font-size:12px;line-height:1.35;margin-top:2px}
      .fc-doc-file-picker{position:relative;min-height:58px;border:1.5px dashed #b9c9df;border-radius:15px;background:#fff;display:flex;align-items:center;justify-content:center;text-align:center;padding:10px 14px;color:#405875;font-weight:800;font-size:13px;cursor:pointer}
      .fc-doc-file-picker input{position:absolute;inset:0;width:100%;height:100%;opacity:0;cursor:pointer}.fc-doc-file-picker.has-file{border-style:solid;border-color:#9dc1ff;background:#f7fbff;color:#1758c9}
      .fc-doc-file-name{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
      .fc-doc-assign-head{display:flex;align-items:center;justify-content:space-between;gap:12px}.fc-doc-assign-head b{font-size:12px;color:#425775}.fc-doc-assign-actions{display:flex;gap:5px}.fc-doc-mini{border:0;background:transparent;color:#2867c9;font-size:11px;font-weight:800;padding:6px;cursor:pointer}
      .fc-doc-people{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.fc-doc-person{position:relative;border:1px solid var(--doc-line);border-radius:13px;padding:10px 11px;background:#fff;display:flex;align-items:center;gap:8px;min-height:42px;cursor:pointer;color:#334b69;font-size:12px;font-weight:800;overflow:hidden}.fc-doc-person input{position:absolute;inset:0;width:100%;height:100%;margin:0;opacity:0;cursor:pointer;z-index:2}.fc-doc-person .dot,.fc-doc-person>span{pointer-events:none}.fc-doc-person .dot{width:9px;height:9px;border-radius:50%;background:var(--person,#7b8aa1);box-shadow:0 0 0 3px color-mix(in srgb,var(--person,#7b8aa1) 18%,transparent)}.fc-doc-person.selected{border-color:#8ab5ff;background:#edf5ff;color:#1458c7;box-shadow:inset 0 0 0 1px #c7dcff}.fc-doc-person.selected:after{content:'✓';margin-left:auto;color:#1762dc;font-size:12px;pointer-events:none}
      .fc-doc-auto-mode{padding:9px 11px;border-radius:12px;background:#edf8f4;color:#147257;font-size:11px;font-weight:750;line-height:1.4}
      .fc-doc-upload .save{border:0;border-radius:14px;min-height:46px;padding:11px 14px;background:#1767e8;color:#fff;font-weight:850;font-size:13px;box-shadow:0 7px 16px rgba(23,103,232,.18);cursor:pointer}.fc-doc-upload .save:disabled{opacity:.55;box-shadow:none}
      .fc-doc-status{font-size:11px;font-weight:700;color:#5e6f87;line-height:1.4}.fc-doc-auto{display:inline-flex;padding:7px 10px;border-radius:10px;background:#eaf7f2;color:#15765a;font-size:11px;font-weight:800}
      .fc-doc-library{padding:2px 16px 0}.fc-doc-library-head{display:flex;align-items:end;justify-content:space-between;gap:10px;margin:0 0 10px}.fc-doc-library-head h3{margin:0;color:var(--doc-ink);font-size:18px}.fc-doc-count{color:var(--doc-muted);font-size:11px;font-weight:750}
      .fc-doc-search{position:relative;margin-bottom:10px}.fc-doc-search input{width:100%;height:43px;border:1px solid var(--doc-line);border-radius:14px;background:#f8fafc;padding:0 38px 0 37px;color:var(--doc-ink);font:inherit;font-size:13px;outline:none}.fc-doc-search input:focus{border-color:#8db7f6;box-shadow:0 0 0 3px rgba(37,109,224,.09);background:#fff}.fc-doc-search:before{content:'⌕';position:absolute;left:13px;top:50%;transform:translateY(-52%);color:#72839a;font-size:19px}.fc-doc-search-clear{position:absolute;right:7px;top:50%;transform:translateY(-50%);border:0;background:transparent;color:#75859b;width:30px;height:30px;border-radius:50%;font-size:17px;cursor:pointer}
      .fc-doc-filters{display:flex;gap:7px;overflow:auto;padding:1px 0 12px;scrollbar-width:none}.fc-doc-filters::-webkit-scrollbar{display:none}.fc-doc-filters button{flex:0 0 auto;border:1px solid var(--doc-line);border-radius:999px;padding:8px 11px;background:#fff;color:#52657f;font-size:11px;font-weight:800;white-space:nowrap;cursor:pointer}.fc-doc-filters button.active{background:#173d7a;color:#fff;border-color:#173d7a}.fc-doc-filters .n{opacity:.68;margin-left:3px}
      .fc9-doc-list{display:grid;gap:8px;padding-bottom:4px}.fc-doc-item{width:100%;border:1px solid var(--doc-line);border-radius:16px;background:#fff;padding:12px;display:grid;grid-template-columns:42px minmax(0,1fr) 20px;gap:11px;align-items:center;text-align:left;cursor:pointer;min-height:68px}.fc-doc-item:active{transform:scale(.995)}.fc-doc-type{width:42px;height:42px;border-radius:12px;background:#f0f4fa;display:grid;place-items:center;font-size:20px}.fc-doc-main{min-width:0}.fc-doc-main b{display:block;color:var(--doc-ink);font-size:13px;line-height:1.28;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.fc-doc-meta{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-top:5px;color:#76869c;font-size:10.5px}.fc-doc-chip{display:inline-flex;align-items:center;border-radius:999px;background:#f1f5fa;padding:3px 7px;color:#556a85;font-weight:750}.fc-doc-chevron{color:#9aaaBD;font-size:22px;font-weight:400}.fc-doc-center .fc9-empty{border:1px dashed #d7e0eb;border-radius:15px;background:#fafbfd;padding:22px 14px;color:#75859a;text-align:center;font-size:12px}
      .fc-doc-review{display:grid;gap:12px;min-width:0}.fc-doc-review[hidden]{display:none}.fc-doc-review h3{margin:0;font-size:17px;color:var(--doc-ink)}
      .fc-doc-review>p{margin:0;font-size:13px;line-height:1.5}.fc-doc-review label{font-size:13px;line-height:1.5;color:var(--doc-ink)}
      .fc-doc-review input[type="text"]{box-sizing:border-box;display:block;width:100%;min-height:44px;font:inherit;font-size:16px;border:1px solid var(--doc-line);border-radius:10px;padding:10px}
      .fc-doc-proposal{display:grid;grid-template-columns:24px minmax(0,1fr);gap:10px;border:1px solid var(--doc-line);border-radius:12px;padding:12px;background:#fff;overflow-wrap:anywhere}
      .fc-doc-proposal input{width:22px;height:22px;margin:2px 0}.fc-doc-proposal b,.fc-doc-proposal small{display:block}.fc-doc-proposal small{font-size:12px;line-height:1.5;margin-top:5px;color:#52657f;white-space:pre-wrap}
      .fc-doc-proposal .fc-doc-warning{color:#8a4b00}.fc-doc-review button{min-height:44px;font:inherit;border-radius:12px;border:1px solid var(--doc-line);padding:10px 12px;cursor:pointer}
      @media(max-width:520px){.fc-doc-center .fc9-sheet{width:calc(100vw - 12px);max-height:calc(100dvh - 12px)}.fc-doc-center .fc9-sheet-head{padding-left:16px;padding-right:16px}.fc-doc-upload,.fc-doc-library{margin-left:0;margin-right:0}.fc-doc-people{grid-template-columns:repeat(2,minmax(0,1fr))}.fc-doc-upload{border-radius:18px}.fc-doc-main b{font-size:12.5px}}
    `;
    document.head.appendChild(s);
  }

  function linkedPeople(d){
    const ids=new Set();
    if(d.person_id)ids.add(String(d.person_id));
    for(const l of d.links||[]){
      if(String(l.source_kind)==='person'&&l.source_id)ids.add(String(l.source_id));
      const m=String(l.source_id||'').match(/^(jayden|fynn|eliyah|oli)(?:-|$)/);
      if(m)ids.add(m[1]);
    }
    return [...ids];
  }
  function personLabel(ids){return ids.map(id=>people().find(p=>p.id===id)?.name||id).join(' · ')||'Nicht zugeordnet'}
  function dateLabel(raw){const s=String(raw||'').slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return'';const [y,m,d]=s.split('-');return `${d}.${m}.${y}`}
  function typeMeta(d){const mime=String(d.mime_type||'').toLowerCase();if(mime.includes('pdf'))return{icon:'📄',label:'PDF'};if(mime.startsWith('image/'))return{icon:'🖼️',label:'Bild'};return{icon:'📎',label:'Datei'}}
  function visibleDocs(){
    const q=norm(search);
    return docs.filter(d=>filter==='all'||linkedPeople(d).includes(filter)).filter(d=>{
      if(!q)return true;
      const ids=linkedPeople(d);
      return norm([d.title,personLabel(ids),d.mime_type,dateLabel(d.created_at)].join(' ')).includes(q);
    }).sort((a,b)=>String(b.created_at||'').localeCompare(String(a.created_at||'')));
  }
  function filterCount(id){return id==='all'?docs.length:docs.filter(d=>linkedPeople(d).includes(id)).length}
  function renderFilters(m){
    m.querySelectorAll('[data-doc-filter]').forEach(b=>{
      const id=b.dataset.docFilter;
      b.classList.toggle('active',id===filter);
      const n=b.querySelector('.n');if(n)n.textContent=String(filterCount(id));
    });
  }
  function render(m){
    const root=m.querySelector('[data-docs]'),shown=visibleDocs();
    const count=m.querySelector('[data-doc-count]');
    if(count)count.textContent=`${shown.length} ${shown.length===1?'Dokument':'Dokumente'}`;
    root.innerHTML=shown.length?shown.map(d=>{
      const ids=linkedPeople(d),type=typeMeta(d),date=dateLabel(d.created_at);
      return `<button type="button" class="fc-doc-item" data-doc="${esc(d.id)}" aria-label="${esc(d.title||'Dokument')} öffnen"><span class="fc-doc-type" aria-hidden="true">${type.icon}</span><span class="fc-doc-main"><b>${esc(d.title||'Dokument')}</b><span class="fc-doc-meta"><span class="fc-doc-chip">${esc(personLabel(ids))}</span>${date?`<span>${esc(date)}</span>`:''}<span>${type.label}</span></span></span><span class="fc-doc-chevron" aria-hidden="true">›</span></button>`;
    }).join(''):`<div class="fc9-empty">${search?'Keine Dokumente passen zu deiner Suche.':'Keine Dokumente in diesem Filter.'}</div>`;
    root.querySelectorAll('[data-doc]').forEach(b=>b.onclick=()=>window.fcOpenOriginal?.(b.dataset.doc));
    renderFilters(m);
  }
  async function load(m){
    docs=await window.__fcDocumentLibrary.list({refresh:true});
    render(m);
  }

  const personSet=a=>JSON.stringify([...new Set(Array.isArray(a)?a.map(String):[])].sort());
  const samePeople=(a,b)=>personSet(a)===personSet(b);
  function sameEvent(a,b){return norm(a.title)===norm(b.title)&&String(a.date||'')===String(b.date||'')&&samePeople(a.personIds,b.personIds)}
  function sameHomework(a,b){return norm(a.title)===norm(b.title)&&String(a.dueDate||'')===String(b.dueDate||'')&&String(a.personId||'')===String(b.personId||'')}
  function validDate(value){return /^\d{4}-\d{2}-\d{2}$/.test(String(value||''))&&!Number.isNaN(Date.parse(value+'T12:00:00Z'))&&new Date(value+'T12:00:00Z').toISOString().slice(0,10)===value}
  const validTime=value=>!value||/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(value));
  const targetIds=(x,manual)=>[...new Set(manual.length?manual:(Array.isArray(x.personIds)?x.personIds:[x.personId]).filter(Boolean))].map(String);
  function matchingEvents(x,ids){
    const matches=(window.data?.events||[]).filter(e=>sameEvent(e,{...x,personIds:ids}));
    const exact=matches.filter(e=>String(e.time||'')===String(x.time||''));
    return exact.length?exact:matches;
  }
  function issues(x,manual){
    const out=[],ids=targetIds(x,manual);
    if(!['event','homework','reminder'].includes(x.type))out.push('Unbekannter Eintragstyp');
    if(!String(x.title||'').trim())out.push('Titel fehlt');
    if(!validDate(x.date))out.push('Datum fehlt oder ist ungültig');
    if(ids.some(id=>!people().some(p=>String(p.id)===id)))out.push('Person nicht in der Familie gefunden');
    if(x.type!=='reminder'&&!ids.length)out.push('Person fehlt – oben manuell zuordnen');
    if(x.type==='event'){
      if(!validTime(x.time)||!validTime(x.end))out.push('Uhrzeit ungültig');
      if(x.end&&!x.time)out.push('Startzeit fehlt');
      if(x.endDate&&(!validDate(x.endDate)||x.endDate<x.date))out.push('Enddatum ungültig');
      if(x.time&&x.end&&(!x.endDate||x.endDate===x.date)&&x.end<x.time)out.push('Ende liegt vor dem Beginn');
      if(matchingEvents(x,ids).length>1)out.push('Mehrere passende Termine – bitte im Kalender prüfen');
    }
    return out;
  }
  function cleanFileBase(name){return String(name||'Dokument').replace(/\.[^.]+$/,'').replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim()}
  function semanticTitle(summary,ids,file){
    const names=ids.map(id=>people().find(p=>p.id===id)?.name||id);
    const clean=String(summary||'').replace(/\s+/g,' ').trim().replace(/[.!?]+$/,'').slice(0,90);
    let base=clean||cleanFileBase(file.name)||'Dokument';
    if(names.length){const prefix=names.join(' + ');if(!norm(base).startsWith(norm(prefix)))base=`${prefix} · ${base}`}
    return `${base} · ${new Date().toLocaleDateString('de-CH')}`.slice(0,180);
  }
  function groupItems(items){
    const out=[];
    for(const x of Array.isArray(items)?items:[]){
      if(!x||typeof x!=='object')continue;
      if(x.type==='event'){
        const hit=out.find(y=>y.type==='event'&&norm(y.title)===norm(x.title)&&y.date===x.date&&y.time===x.time&&y.endDate===x.endDate&&y.end===x.end&&String(y.note||'')===String(x.note||''));
        if(hit){hit.personIds=[...new Set([...hit.personIds,...targetIds(x,[])])];hit.confidence=Math.min(Number(hit.confidence||0),Number(x.confidence||0));continue}
        out.push({...x,personIds:[...new Set([...(Array.isArray(x.personIds)?x.personIds:[]),x.personId].filter(Boolean).map(String))]});
      }else out.push({...x});
    }
    return out;
  }
  function applyItems(items,docId,manualIds=[]){
    if(!items.length)return[];
    const D=window.data;if(!D||typeof window.save!=='function')throw new Error('Familienzustand nicht verfügbar.');
    // Revalidate the whole confirmed selection before making any change.
    for(const x of items)if(issues(x,manualIds).length)throw new Error('Vorschläge haben sich geändert. Bitte erneut prüfen.');
    D.events=Array.isArray(D.events)?D.events:[];D.homework=Array.isArray(D.homework)?D.homework:[];D.todos=Array.isArray(D.todos)?D.todos:[];
    const links=[],uid=type=>`doc-${docId}-${type}-${crypto.randomUUID()}`;
    for(const x of items){
      const ids=targetIds(x,manualIds);
      if(x.type==='event'){
        let hit=matchingEvents(x,ids)[0];
        if(!hit){hit={id:uid('event'),date:x.date,time:x.time||'',end:x.end||'',endDate:x.endDate||'',title:String(x.title),note:String(x.note||''),personIds:ids,reminderLead:Number.isInteger(x.reminderLead)?x.reminderLead:30};D.events.push(hit)}
        // Existing, possibly manually corrected fields are never overwritten by AI.
        links.push({sourceKind:'event',sourceId:hit.id});
      }else if(x.type==='homework'){
        for(const personId of ids){const candidate={personId,dueDate:x.date,title:x.title};let hit=D.homework.find(h=>sameHomework(h,candidate));if(!hit){hit={id:uid('hw'),personId,dueDate:x.date,subject:String(x.subject||''),title:String(x.title),note:String(x.note||''),done:false};D.homework.push(hit)}links.push({sourceKind:'homework',sourceId:hit.id})}
      }else if(x.type==='reminder'){
        for(const personId of ids.length?ids:['']){let hit=D.todos.find(t=>norm(t.title)===norm(x.title)&&String(t.date||'')===String(x.date)&&String(t.personId||'')===personId);
          if(!hit){hit={id:uid('todo'),date:x.date,title:String(x.title),note:String(x.note||''),personId,section:'day',done:false,archived:false,priority:false,createdAt:isoNow()};D.todos.push(hit)}
          links.push({sourceKind:'todo',sourceId:hit.id});
        }
      }
    }
    if(links.length){window.save();window.__fcV9?.invalidate?.();}
    return [...new Map(links.map(x=>[x.sourceKind+':'+x.sourceId,x])).values()];
  }
  async function linkDocument(id,links){if(!id||!links.length)return;const r=await fetch(DOC+'/link',{method:'POST',headers:{...headers(),'content-type':'application/json'},body:JSON.stringify({id,links})});if(!r.ok)throw new Error('link failed')}
  async function analyze(file){const fd=new FormData();fd.append('file',file);fd.append('now',isoNow());fd.append('context','Erzeuge nur Vorschläge aus dem Original, keine Vermutungen. Die vorhandenen Personen und Schulen: '+JSON.stringify(people().map(p=>({id:p.id,name:p.name,school:p.school||''})))+'. Mitnehmen, Besammlung, Rückkehr und Wetterhinweise wörtlich in der Notiz erhalten. Unklare Personen oder Daten leer lassen.');const r=await fetch(AI,{method:'POST',headers:headers(),body:fd}),j=await r.json();if(!r.ok)throw new Error(j.message||j.error||'analysis failed');return j}
  async function uploadOriginal(file,title,ids){const fd=new FormData();fd.append('file',file);fd.append('title',title);if(ids.length===1)fd.append('personId',ids[0]);fd.append('links',JSON.stringify(ids.map(id=>({sourceKind:'person',sourceId:id}))));const r=await fetch(DOC+'/upload',{method:'POST',headers:headers(),body:fd}),j=await r.json();if(!r.ok)throw new Error(j.error||'upload failed');return j.document}

  function selectedIds(m){return [...m.querySelectorAll('[data-doc-person]:checked')].map(x=>x.value)}
  function syncAssignment(m){
    const ids=selectedIds(m);
    m.querySelectorAll('.fc-doc-person').forEach(l=>l.classList.toggle('selected',Boolean(l.querySelector('input')?.checked)));
    const auto=m.querySelector('[data-doc-auto-mode]');
    if(auto)auto.textContent=ids.length?`Manuelle Zuordnung aktiv: ${personLabel(ids)}. Diese Auswahl hat Vorrang vor Family AI.`:'Automatische Zuordnung aktiv. Family AI schlägt Personen vor; du bestätigst die Zuordnung vor dem Speichern.';
  }
  function syncFile(m){
    const input=m.querySelector('[data-doc-file]'),f=input?.files?.[0],picker=m.querySelector('.fc-doc-file-picker'),name=m.querySelector('[data-doc-file-name]');
    picker?.classList.toggle('has-file',Boolean(f));
    if(name)name.textContent=f?`${f.name} · ${Math.max(1,Math.round(f.size/1024))} KB`:'Foto oder PDF auswählen';
  }
  function lockInput(m,locked){m.querySelectorAll('[data-doc-file],[data-doc-person],[data-doc-select-all],[data-doc-select-none],[data-doc-upload]').forEach(x=>x.disabled=locked)}
  function discardReview(m){
    reviews.delete(m);m.querySelector('[data-doc-review]')?.remove();lockInput(m,false);
    m.querySelector('[data-doc-upload]').hidden=false;
  }
  function showReview(m,review,focusReview=true){
    const editedTitle=m.querySelector('[data-doc-title]')?.value;if(editedTitle!==undefined)review.title=editedTitle;
    m.querySelector('[data-doc-review]')?.remove();
    const manual=selectedIds(m),rows=review.items.map((x,i)=>{
      const errors=issues(x,manual),ids=targetIds(x,manual),existing=x.type==='event'?matchingEvents(x,ids)[0]:null;
      const detail=[({event:'Termin',homework:'Hausaufgabe',reminder:'Aufgabe'})[x.type]||'Eintrag',dateLabel(x.date),[x.time,x.end].filter(Boolean).join('–'),x.endDate?'Bis '+dateLabel(x.endDate):'',personLabel(ids)].filter(Boolean).join(' · ');
      return `<label class="fc-doc-proposal"><input type="checkbox" data-doc-proposal="${i}" ${errors.length?'disabled':''}><span><b>${esc(x.title||'Ohne Titel')}</b><small>${esc(detail)}</small>${x.note?`<small>${esc(x.note)}</small>`:''}${Number(x.confidence||0)<.85?'<small class="fc-doc-warning">Unsichere Erkennung – nur auswählen, wenn du sie im Original geprüft hast.</small>':''}${existing?`<small>Vorhandenen Termin verknüpfen: ${esc(existing.title)} · ${esc([existing.time,existing.end].filter(Boolean).join('–'))}. Seine Angaben bleiben unverändert.</small>`:''}${errors.length?`<small class="fc-doc-warning">${esc(errors.join(' · '))}</small>`:''}</span></label>`;
    }).join('');
    const box=document.createElement('section');box.className='fc-doc-review';box.dataset.docReview='1';box.tabIndex=-1;
    box.innerHTML=`<h3>Vorschläge prüfen</h3><p>Noch nichts übernommen. Vergleiche die Angaben mit dem Original und wähle nur bestätigte Einträge aus. Eine KI-Sicherheit ist kein Beleg.</p><label>Dokumenttitel<input type="text" data-doc-title maxlength="180" value="${esc(review.title)}"></label>${rows||'<p>Keine verwertbaren Vorschläge. Das Original kann trotzdem abgelegt werden.</p>'}<button type="button" class="save" data-doc-confirm disabled>Ausgewählte Einträge bestätigen &amp; speichern</button><button type="button" data-doc-archive>Nur Original ablegen</button><button type="button" data-doc-cancel>Abbrechen</button>`;
    m.querySelector('[data-doc-status]').before(box);m.querySelector('[data-doc-upload]').hidden=true;
    box.querySelectorAll('[data-doc-proposal]').forEach(x=>x.onchange=()=>{box.querySelector('[data-doc-confirm]').disabled=!box.querySelector('[data-doc-proposal]:checked')});
    box.querySelector('[data-doc-confirm]').onclick=()=>commitReview(m,false);
    box.querySelector('[data-doc-archive]').onclick=()=>commitReview(m,true);
    box.querySelector('[data-doc-cancel]').onclick=()=>{discardReview(m);m.querySelector('[data-doc-status]').textContent='Abgebrochen. Es wurde nichts übernommen.';m.querySelector('[data-doc-upload]').focus()};
    if(focusReview){box.focus({preventScroll:true});box.scrollIntoView({block:'nearest'});}
  }
  async function upload(m){
    const file=m.querySelector('[data-doc-file]').files?.[0];if(!file)return alert('Bitte zuerst ein Foto oder PDF auswählen.');
    const status=m.querySelector('[data-doc-status]');lockInput(m,true);
    try{
      status.textContent='Dokument wird gelesen – noch keine Übernahme …';let parsed=null;
      try{parsed=await analyze(file)}catch(e){console.warn('fc_smart_docs_ai',e)}
      if(!m.isConnected)return;
      const reviewItems=groupItems(parsed?.parsed?.items||[]);const reviewTitle=window.__fcSemanticDocumentTitleV973?.title?.({items:reviewItems,summary:parsed?.parsed?.summary||'',people:people(),manualIds:selectedIds(m)})||semanticTitle(parsed?.parsed?.summary||'',selectedIds(m),file);const review={file,items:reviewItems,title:reviewTitle,document:null,links:null,busy:false};
      reviews.set(m,review);showReview(m,review);
      status.textContent=parsed?'Personen und Datum prüfen. Die Übernahme erfolgt erst nach deiner Bestätigung.':'Erkennung nicht verfügbar. Du kannst das Original ohne neue Termine oder Aufgaben ablegen.';
    }catch(e){console.error('fc_smart_docs_review',e);status.textContent='Dokument konnte nicht geprüft werden.'}finally{lockInput(m,false)}
  }
  async function commitReview(m,archiveOnly){
    const review=reviews.get(m);if(!review||review.busy)return;
    const box=m.querySelector('[data-doc-review]'),status=m.querySelector('[data-doc-status]');
    if(!review.document){
      const items=archiveOnly?[]:[...box.querySelectorAll('[data-doc-proposal]:checked')].map(x=>review.items[Number(x.dataset.docProposal)]);
      if(!archiveOnly&&!items.length)return;
      const manual=selectedIds(m),errors=items.flatMap(x=>issues(x,manual));
      const title=box.querySelector('[data-doc-title]').value.trim();
      if(!title||errors.length){status.textContent=errors.length?errors.join(' · '):'Bitte einen Dokumenttitel angeben.';return;}
      review.confirmed={items,manual,title,ids:[...new Set([...manual,...items.flatMap(x=>targetIds(x,manual))])]};
    }
    review.busy=true;lockInput(m,true);box.querySelectorAll('button,input').forEach(x=>x.disabled=true);
    try{
      const c=review.confirmed;
      if(!review.document){status.textContent='Bestätigtes Original wird sicher gespeichert …';review.document=await uploadOriginal(review.file,c.title,c.ids);if(!review.document?.id)throw new Error('Dokumentantwort enthält keine ID');}
      if(review.links===null){review.links=applyItems(c.items,review.document.id,c.manual);}
      const links=[...c.ids.map(id=>({sourceKind:'person',sourceId:id})),...review.links];
      if(links.length){status.textContent='Bestätigte Einträge werden mit dem Original verknüpft …';await linkDocument(review.document.id,links);}
      window.__fcDocumentLibrary?.invalidate?.();
      const count=review.links.length;discardReview(m);m.querySelector('[data-doc-file]').value='';m.querySelectorAll('[data-doc-person]').forEach(x=>x.checked=false);syncAssignment(m);syncFile(m);
      status.textContent=`✓ Gespeichert${count?' · '+count+' bestätigte Einträge verknüpft':''}. Den Cloud-Speicherstatus zeigt die Sync-Anzeige.`;
      try{await load(m)}catch{status.textContent+=' Die Dokumentliste konnte noch nicht aktualisiert werden.';}
    }catch(e){
      console.error('fc_smart_docs_commit',e);
      status.textContent=review.document?'Original bereits gespeichert. Die Verarbeitung ist noch nicht vollständig. Erneut versuchen lädt es nicht nochmals hoch.':'Speichern fehlgeschlagen. Es wurden keine Einträge übernommen.';
      const retry=box.querySelector('[data-doc-confirm]');retry.disabled=false;retry.textContent=review.document?'Verarbeitung erneut versuchen':'Speichern erneut versuchen';retry.onclick=()=>commitReview(m,archiveOnly);
      if(review.document){const cancel=box.querySelector('[data-doc-cancel]');cancel.disabled=false;cancel.textContent='Original behalten und schliessen';cancel.onclick=async()=>{discardReview(m);m.querySelector('[data-doc-file]').value='';syncFile(m);status.textContent='Original bleibt gespeichert. Eine eventuell offene Verknüpfung kann beim Termin unter „Vorhandenes Original wählen“ ergänzt werden.';try{await load(m)}catch{}};}
      if(!review.document){box.querySelectorAll('input,button').forEach(x=>x.disabled=false);box.querySelectorAll('[data-doc-proposal]').forEach(x=>x.disabled=issues(review.items[Number(x.dataset.docProposal)],selectedIds(m)).length>0);}
    }finally{review.busy=false;if(!review.document)lockInput(m,false)}
  }

  async function open(){
    installStyle();filter='all';search='';document.getElementById('fc9Modal')?.remove();
    const m=document.createElement('div');m.id='fc9Modal';m.className='fc9-modal fc-doc-center';const ps=people();
    m.innerHTML=`<section class="fc9-sheet"><div class="fc9-sheet-head"><div><small>DOKUMENTE</small><h2>Dokumentenzentrale</h2><p>Originale sicher ablegen, Personen zuordnen und wichtige Termine oder Aufgaben automatisch erkennen.</p></div><button class="fc9-close" aria-label="Schliessen">×</button></div><div class="fc-doc-scroll"><div class="fc-doc-upload"><div class="fc-doc-upload-title"><span class="icon" aria-hidden="true">＋</span><div><b>Neues Dokument</b><span>Ein Foto oder PDF genügt. Das Original bleibt unverändert erhalten.</span></div></div><label class="fc-doc-file-picker"><input data-doc-file type="file" accept="image/*,application/pdf" capture="environment"><span class="fc-doc-file-name" data-doc-file-name>Foto oder PDF auswählen</span></label><div class="fc-doc-assign-head"><b>ZUORDNUNG</b><div class="fc-doc-assign-actions"><button type="button" class="fc-doc-mini" data-doc-select-all>Alle Personen</button><button type="button" class="fc-doc-mini" data-doc-select-none>Automatisch</button></div></div><div class="fc-doc-people">${ps.map(p=>`<label class="fc-doc-person" style="--person:${esc(p.color||'#71809a')}"><input data-doc-person type="checkbox" value="${esc(p.id)}"><span class="dot" aria-hidden="true"></span><span>${esc(p.name)}</span></label>`).join('')}</div><div class="fc-doc-auto-mode" data-doc-auto-mode>Automatische Zuordnung aktiv. Family AI schlägt Personen vor; du bestätigst die Zuordnung vor dem Speichern.</div><button type="button" class="save" data-doc-upload>Dokument prüfen</button><div class="fc-doc-status" data-doc-status>Keine automatische Übernahme: Zuerst Vorschläge prüfen, dann ausdrücklich bestätigen.</div></div><div class="fc-doc-library"><div class="fc-doc-library-head"><h3>Meine Dokumente</h3><span class="fc-doc-count" data-doc-count>Wird geladen …</span></div><div class="fc-doc-search"><input type="search" data-doc-search placeholder="Dokumente durchsuchen" autocomplete="off" aria-label="Dokumente durchsuchen"><button type="button" class="fc-doc-search-clear" data-doc-search-clear aria-label="Suche löschen" hidden>×</button></div><div class="fc-doc-filters"><button data-doc-filter="all" class="active">Alle <span class="n">0</span></button>${ps.map(p=>`<button data-doc-filter="${esc(p.id)}">${esc(p.name)} <span class="n">0</span></button>`).join('')}</div><div class="fc9-doc-list" data-docs><div class="fc9-empty">Wird geladen …</div></div></div></div></section>`;
    m.querySelector('.fc9-close').onclick=()=>m.remove();m.onclick=e=>{if(e.target===m)m.remove()};
    m.querySelectorAll('[data-doc-filter]').forEach(b=>b.onclick=()=>{filter=b.dataset.docFilter;render(m)});
    m.querySelectorAll('[data-doc-person]').forEach(x=>x.onchange=()=>{syncAssignment(m);const r=reviews.get(m);if(r)showReview(m,r,false)});
    m.querySelector('[data-doc-select-all]').onclick=()=>{m.querySelectorAll('[data-doc-person]').forEach(x=>x.checked=true);syncAssignment(m);const r=reviews.get(m);if(r)showReview(m,r,false)};
    m.querySelector('[data-doc-select-none]').onclick=()=>{m.querySelectorAll('[data-doc-person]').forEach(x=>x.checked=false);syncAssignment(m);const r=reviews.get(m);if(r)showReview(m,r,false)};
    m.querySelector('[data-doc-file]').onchange=()=>{discardReview(m);syncFile(m);m.querySelector('[data-doc-status]').textContent='Neues Original ausgewählt. Bitte erneut prüfen.'};
    const searchInput=m.querySelector('[data-doc-search]'),clear=m.querySelector('[data-doc-search-clear]');
    searchInput.oninput=()=>{search=searchInput.value;clear.hidden=!search;render(m)};
    clear.onclick=()=>{searchInput.value='';search='';clear.hidden=true;searchInput.focus();render(m)};
    m.querySelector('[data-doc-upload]').onclick=()=>upload(m);
    document.body.appendChild(m);syncAssignment(m);syncFile(m);
    try{await load(m)}catch{m.querySelector('[data-doc-count]').textContent='Nicht verfügbar';m.querySelector('[data-docs]').innerHTML='<div class="fc9-empty">Dokumente konnten nicht geladen werden.</div>'}
  }

  document.addEventListener('click',e=>{const b=e.target?.closest?.('[data-feature="docs"]');if(!b)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();open()},true);
  window.fcOpenSmartDocuments=open;
  window.__fcSmartDocumentsHealth={version:'1.3.0',reviewRequired:true,automaticImport:false,filters:true,filterCounts:true,search:true,newestFirst:true,directUpload:true,multiPerson:true,selectAll:true,aiAutoAssign:true,manualOverride:true,autoLink:true,dedupe:true,confidenceThreshold:.85,preservesOriginal:true,semanticNaming:true};
})();
