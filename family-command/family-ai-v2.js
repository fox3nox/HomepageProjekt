/* Family Command · Family AI v2 · secure + dynamic · 2026-08-23 */
(()=>{
  if(window.__fcFamilyAIV2)return;window.__fcFamilyAIV2=true;
  const AI='https://lmrvapstojcecljjdgds.supabase.co/functions/v1/family-command-ai-budgeted';
  const DOC='https://lmrvapstojcecljjdgds.supabase.co/functions/v1/family-command-documents';
  const state={file:null,result:null,recorder:null,stream:null,chunks:[],timer:null,started:0,returnFocus:null};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const accessKey=()=>{try{const p=document.cookie.split(';').map(x=>x.trim()).find(x=>x.startsWith('fc_private_access='));if(p)return decodeURIComponent(p.slice('fc_private_access='.length))}catch(e){}try{return localStorage.getItem('fc-private-access-v1')||''}catch(e){return''}};
  const nowZurich=()=>{const s=new Intl.DateTimeFormat('sv-SE',{timeZone:'Europe/Zurich',dateStyle:'short',timeStyle:'medium'}).format(new Date());return s.replace(' ','T')};
  const people=()=>Array.isArray(data?.people)?data.people.filter(p=>p&&p.id&&p.name):[];
  const normalize=s=>String(s||'').trim().toLowerCase().replace(/\s+/g,' ');

  async function api(base,path,init={}){
    const headers=new Headers(init.headers||{}),key=accessKey();if(key)headers.set('x-fc-access',key);
    const r=await fetch(base+path,{...init,headers,cache:'no-store'}),j=await r.json().catch(()=>({}));
    if(!r.ok||j.ok===false){const e=new Error(j.message||j.error||('HTTP '+r.status));e.status=r.status;e.payload=j;throw e}return j;
  }
  function toast2(t){try{if(typeof toast==='function')toast(t)}catch(e){}}
  function modal(){return document.getElementById('fcAi')}
  function setBusy(on,label='Family AI denkt …'){
    const m=modal();if(!m)return;m.setAttribute('aria-busy',String(on));
    m.querySelectorAll('button,input,textarea,select').forEach(el=>{if(!el.classList.contains('aix'))el.disabled=on});
    const box=m.querySelector('.aibusy');if(box){box.hidden=!on;const s=box.querySelector('span');if(s)s.textContent=label}
  }
  function clearError(){const e=modal()?.querySelector('.aierr');if(e)e.hidden=true}
  function error(message){const e=modal()?.querySelector('.aierr');if(e){e.hidden=false;e.textContent=String(message||'Unbekannter Fehler')}setBusy(false)}

  function modeBody(mode){
    if(mode==='voice')return '<button type="button" class="aimic" id="aimic"><i aria-hidden="true">●</i><b>Aufnahme starten</b><span>Sprich frei – Termine, Aufgaben und Erinnerungen werden erkannt.</span></button><small id="aistat">Bereit</small>';
    if(mode==='doc')return '<input id="aifile" type="file" accept="image/*,application/pdf" capture="environment" hidden><label class="aifile" for="aifile"><b>Foto oder Dokument auswählen</b><span id="aifn">Foto oder PDF · maximal 12 MB</span></label><textarea id="aictx" placeholder="Optionaler Hinweis, z. B. Einladung oder Schulbrief"></textarea><button type="button" class="aigo" id="aidoc">Dokument auslesen</button>';
    return '<textarea id="aitext" class="aitext" placeholder="Schreib einfach frei …\n\nz. B. Morgen um 14 Uhr ist ein Arzttermin."></textarea><button type="button" class="aigo" id="aitxt">Mit Family AI auswerten</button>';
  }
  function setMode(mode){
    stopRecording(true);state.file=null;state.result=null;clearError();
    modal()?.querySelectorAll('[data-ai-mode]').forEach(b=>b.classList.toggle('active',b.dataset.aiMode===mode));
    const body=document.getElementById('aibody'),results=document.getElementById('aires');if(body)body.innerHTML=modeBody(mode);if(results)results.innerHTML='';bindMode();
  }
  function close(){stopRecording(true);modal()?.remove();const el=state.returnFocus;state.returnFocus=null;setTimeout(()=>{try{el?.focus?.()}catch(e){}},0)}
  function open(mode='voice'){
    stopRecording(true);modal()?.remove();state.file=null;state.result=null;state.returnFocus=document.activeElement;
    const m=document.createElement('div');m.id='fcAi';m.className='aimodal';m.innerHTML='<section class="aisheet" role="dialog" aria-modal="true" aria-labelledby="fcAiTitle"><header><div><strong id="fcAiTitle"><i aria-hidden="true">AI</i> Family AI</strong><p>Sag, schreib oder zeig mir, was eingetragen werden soll.</p></div><button type="button" class="aix" aria-label="Schliessen">×</button></header><nav aria-label="Eingabeart"><button type="button" data-ai-mode="voice">Sprechen</button><button type="button" data-ai-mode="text">Text</button><button type="button" data-ai-mode="doc">Dokument</button></nav><main id="aibody">'+modeBody(mode)+'</main><div class="aibusy" hidden><i></i><span>Family AI denkt …</span></div><div class="aierr" role="alert" hidden></div><div id="aires"></div></section>';
    m.addEventListener('click',e=>{if(e.target===m)close()});m.querySelector('.aix').onclick=close;m.querySelectorAll('[data-ai-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.aiMode===mode);b.onclick=()=>setMode(b.dataset.aiMode)});document.body.appendChild(m);bindMode();setTimeout(()=>m.querySelector(mode==='text'?'#aitext':mode==='voice'?'#aimic':'label[for="aifile"]')?.focus?.(),0);
  }
  window.fcOpenFamilyAI=open;

  function bindMode(){
    const q=id=>document.getElementById(id);if(q('aitxt'))q('aitxt').onclick=parseText;if(q('aimic'))q('aimic').onclick=toggleMic;if(q('aidoc'))q('aidoc').onclick=parseDocument;
    if(q('aifile'))q('aifile').onchange=e=>{state.file=e.target.files?.[0]||null;const n=q('aifn');if(n)n.textContent=state.file?state.file.name:'Foto oder PDF · maximal 12 MB'};
  }
  async function parseText(){
    const text=(document.getElementById('aitext')?.value||'').trim();if(!text)return error('Schreib zuerst etwas.');clearError();setBusy(true,'Ich ordne alles für dich …');
    try{const j=await api(AI,'/parse',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({text,now:nowZurich()})});state.result=j.parsed;showResult(j.transcript||'')}catch(e){error('Auswertung fehlgeschlagen. '+e.message)}finally{setBusy(false)}
  }
  async function parseDocument(){
    if(!state.file)return error('Wähle zuerst ein Dokument.');if(state.file.size>12000000)return error('Die Datei ist zu gross. Maximal 12 MB.');clearError();setBusy(true,'Ich lese das Dokument …');
    try{const f=new FormData();f.append('file',state.file,state.file.name);f.append('now',nowZurich());f.append('context',(document.getElementById('aictx')?.value||'').trim());const j=await api(AI,'/document',{method:'POST',body:f});state.result=j.parsed;showResult('')}catch(e){error('Dokument konnte nicht gelesen werden. '+e.message)}finally{setBusy(false)}
  }

  function supportedMime(){return ['audio/mp4','audio/webm;codecs=opus','audio/webm'].find(t=>window.MediaRecorder?.isTypeSupported?.(t))||''}
  async function toggleMic(){
    if(state.recorder?.state==='recording'){stopRecording(false);return}
    if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder)return error('Sprachaufnahme wird auf diesem Gerät nicht unterstützt.');
    try{state.stream=await navigator.mediaDevices.getUserMedia({audio:true});state.chunks=[];const type=supportedMime();state.recorder=new MediaRecorder(state.stream,type?{mimeType:type}:undefined);state.recorder.ondataavailable=e=>e.data.size&&state.chunks.push(e.data);state.recorder.onstop=sendVoice;state.recorder.start();state.started=Date.now();tick();state.timer=setInterval(tick,500)}catch(e){error('Mikrofon-Berechtigung fehlt oder wurde blockiert.')}
  }
  function tick(){const b=document.getElementById('aimic'),s=document.getElementById('aistat');if(!b||state.recorder?.state!=='recording')return;const n=Math.floor((Date.now()-state.started)/1000);b.classList.add('rec');b.querySelector('b').textContent='Aufnahme beenden';if(s)s.textContent='Ich höre zu · '+String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')}
  function stopRecording(silent){if(state.timer)clearInterval(state.timer);state.timer=null;if(state.recorder?.state==='recording'){if(silent)state.recorder.onstop=null;state.recorder.stop()}state.stream?.getTracks().forEach(t=>t.stop());state.stream=null;if(silent){state.recorder=null;state.chunks=[]}}
  async function sendVoice(){
    const type=state.recorder?.mimeType||'audio/mp4',ext=type.includes('webm')?'webm':'m4a',blob=new Blob(state.chunks,{type});state.recorder=null;state.chunks=[];if(blob.size<700)return error('Aufnahme war zu kurz.');clearError();setBusy(true,'Ich höre zu und ordne alles …');
    try{const f=new FormData();f.append('file',blob,'voice.'+ext);f.append('now',nowZurich());const j=await api(AI,'/transcribe',{method:'POST',body:f});state.result=j.parsed;showResult(j.transcript||'')}catch(e){error('Sprachauswertung fehlgeschlagen. '+e.message)}finally{setBusy(false)}
  }

  function personOptions(selected){
    const list=people();if(!list.length)return '<option value="'+esc(selected||'')+'">'+esc(selected||'Person')+'</option>';
    return list.map(p=>'<option value="'+esc(p.id)+'" '+(String(selected)===String(p.id)?'selected':'')+'>'+esc(p.name)+'</option>').join('');
  }
  function typeOptions(selected){return [['event','Termin'],['homework','Hausaufgabe'],['reminder','Erinnerung']].map(([v,l])=>'<option value="'+v+'" '+(selected===v?'selected':'')+'>'+l+'</option>').join('')}
  function reminderOptions(n){const values=[[-1,'Keine Erinnerung'],[0,'Automatisch'],[10,'10 Min vorher'],[30,'30 Min vorher'],[60,'1 Std vorher'],[90,'1½ Std vorher'],[120,'2 Std vorher']];return values.map(([v,l])=>'<option value="'+v+'" '+(Number(n)===v?'selected':'')+'>'+l+'</option>').join('')}
  function reviewItem(x,i){
    const confidence=Math.max(0,Math.min(100,Math.round(Number(x.confidence||0)*100)));
    return '<article class="aiitem" data-i="'+i+'"><div class="aitop"><label class="aiinclude"><input type="checkbox" class="inc" checked><span>Übernehmen</span></label><b>'+confidence+'% sicher</b></div><div class="aigrid"><label>Typ<select class="typ">'+typeOptions(x.type)+'</select></label><label>Person<select class="per">'+personOptions(x.personId)+'</select></label><label>Datum<input class="dat" type="date" value="'+esc(x.date)+'"></label><label>Zeit<input class="tim" type="time" value="'+esc(x.time)+'"></label><label>Enddatum<input class="enddat" type="date" value="'+esc(x.endDate||'')+'"></label><label>Endzeit<input class="endtim" type="time" value="'+esc(x.end||'')+'"></label></div><label class="aifield">Titel<input class="tit" value="'+esc(x.title)+'" placeholder="Titel"></label><label class="aifield aisubject">Fach<input class="sub" value="'+esc(x.subject||'')+'" placeholder="nur bei Hausaufgaben"></label><label class="aifield">Notiz<textarea class="not" placeholder="Notiz">'+esc(x.note||'')+'</textarea></label><label class="aifield">Erinnerung<select class="rem">'+reminderOptions(x.reminderLead)+'</select></label></article>';
  }
  function showResult(transcript){
    const r=state.result||{},items=Array.isArray(r.items)?r.items:[],q=document.getElementById('aires');if(!q)return;
    q.innerHTML='<div class="airesult"><small>ERKANNT</small><h3>'+esc(r.summary||'Bitte Einträge prüfen')+'</h3>'+(transcript?'<details><summary>Transkript anzeigen</summary><p>'+esc(transcript)+'</p></details>':'')+items.map(reviewItem).join('')+(items.length?'<div class="aiact"><button type="button" id="aicancel">Verwerfen</button><button type="button" id="aiapply">Übernehmen</button></div>':'<p>Kein konkreter Eintrag gefunden.</p>')+'</div>';
    const cancel=document.getElementById('aicancel'),applyBtn=document.getElementById('aiapply');if(cancel)cancel.onclick=()=>{q.innerHTML='';state.result=null};if(applyBtn)applyBtn.onclick=apply;q.scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  function readItems(){return [...document.querySelectorAll('.aiitem')].filter(c=>c.querySelector('.inc')?.checked).map(c=>({type:c.querySelector('.typ')?.value||'event',personId:c.querySelector('.per')?.value||'',date:c.querySelector('.dat')?.value||'',time:c.querySelector('.tim')?.value||'',endDate:c.querySelector('.enddat')?.value||'',end:c.querySelector('.endtim')?.value||'',title:(c.querySelector('.tit')?.value||'').trim(),subject:(c.querySelector('.sub')?.value||'').trim(),note:(c.querySelector('.not')?.value||'').trim(),reminderLead:Number(c.querySelector('.rem')?.value||0)}))}

  async function saveOriginal(file,first,items){
    if(!file||!first)return;
    const f=new FormData();f.append('file',file,file.name);f.append('personId',items[0]?.personId||'');f.append('title',file.name||'Family AI Dokument');f.append('sourceKind',first.kind);f.append('sourceId',first.id);
    try{await api(DOC,'/upload',{method:'POST',body:f})}catch(e){console.warn('fc_ai_original',e);toast2('Einträge gespeichert · Original konnte nicht gespeichert werden')}
  }
  async function apply(){
    const items=readItems();if(!items.length)return error('Wähle mindestens einen Eintrag.');if(items.some(x=>!x.personId||!x.date||!x.title))return error('Bitte Person, Datum und Titel prüfen.');clearError();setBusy(true,'Ich trage alles ein …');
    const made=[];let duplicates=0;
    try{
      data.events=Array.isArray(data.events)?data.events:[];data.homework=Array.isArray(data.homework)?data.homework:[];
      for(const x of items){
        if(x.type==='homework'){
          if(data.homework.some(h=>String(h.personId)===String(x.personId)&&h.dueDate===x.date&&normalize(h.title)===normalize(x.title))){duplicates++;continue}
          const id='hw-ai-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);data.homework.push({id,personId:x.personId,dueDate:x.date,subject:x.subject,title:x.title,note:x.note,done:false,createdAt:new Date().toISOString()});made.push({id,kind:'homework'});
        }else{
          if(data.events.some(e=>(e.personIds||[]).map(String).includes(String(x.personId))&&e.date===x.date&&String(e.time||'')===String(x.time||'')&&normalize(e.title)===normalize(x.title))){duplicates++;continue}
          const id='ai-'+Date.now()+'-'+Math.random().toString(36).slice(2,7);data.events.push({id,personIds:[x.personId],title:x.title,date:x.date,time:x.time||'',end:x.end||'',endDate:x.endDate||'',note:x.note,reminderLead:Number.isFinite(x.reminderLead)?x.reminderLead:0});made.push({id,kind:'event'});
        }
      }
      if(typeof save==='function')save();await saveOriginal(state.file,made[0],items);
      try{if(typeof renderToday==='function')renderToday();if(typeof renderWeek==='function')renderWeek();if(typeof renderEvents==='function')await Promise.resolve(renderEvents(typeof fcEventFilter==='string'?fcEventFilter:'all'));if(typeof renderHomeworkScreen==='function')renderHomeworkScreen();if(typeof renderDocs==='function')await renderDocs();if(typeof syncPush==='function')await syncPush()}catch(e){console.warn('fc_ai_refresh',e)}
      toast2((made.length?made.length+' Eintrag'+(made.length===1?'':'e')+' gespeichert':'Nichts Neues')+(duplicates?' · '+duplicates+' bereits vorhanden':''));close();
    }catch(e){error('Speichern fehlgeschlagen. '+e.message)}finally{setBusy(false)}
  }

  function install(){
    const quick=document.getElementById('quickAdd');if(!quick||document.getElementById('fcAiBtn'))return;
    let tools=quick.closest('.aitools');if(!tools){tools=document.createElement('div');tools.className='aitools';quick.parentNode.insertBefore(tools,quick);tools.appendChild(quick)}
    const b=document.createElement('button');b.type='button';b.id='fcAiBtn';b.className='aibtn';b.setAttribute('aria-label','Family AI öffnen');b.innerHTML='<i aria-hidden="true">AI</i><b>Family AI</b>';b.onclick=()=>open('voice');tools.insertBefore(b,quick);
  }

  const style=document.createElement('style');style.id='fc-family-ai-v2-style';style.textContent=`
    .aitools{display:flex;gap:7px;align-items:center;margin-left:auto}.aibtn{height:40px;border:1px solid #cdd9e9;background:#edf4ff;color:#294e7e;border-radius:13px;padding:0 10px;display:flex;gap:6px;align-items:center}.aibtn i{font-style:normal;background:#416fa9;color:#fff;border-radius:7px;padding:5px;font-size:9px;font-weight:900}.aibtn b{font-size:11px}.aimodal{position:fixed;inset:0;z-index:190;background:#16203377;backdrop-filter:blur(5px);display:flex;align-items:flex-end}.aisheet{width:100%;max-width:680px;max-height:94dvh;overflow:auto;margin:auto;background:#f7f9fc;border-radius:24px 24px 0 0;padding:17px 14px calc(22px + env(safe-area-inset-bottom))}.aisheet header{display:flex;justify-content:space-between;gap:10px}.aisheet header strong{font-size:20px}.aisheet header strong i{font-style:normal;font-size:9px;background:#416fa9;color:#fff;padding:7px;border-radius:9px;margin-right:6px}.aisheet header p{font-size:11px;color:#667085;margin:5px 0}.aix{border:1px solid #dce3ec;background:#fff;border-radius:11px;width:38px;height:38px;font-size:20px}.aisheet nav{display:grid;grid-template-columns:repeat(3,1fr);gap:4px;background:#e9eef5;padding:4px;border-radius:12px;margin:14px 0 10px}.aisheet nav button{border:0;background:transparent;padding:9px;border-radius:9px;color:#667085;font-size:11px}.aisheet nav button.active{background:#fff;color:#263651;box-shadow:0 2px 6px #17203312}#aibody{background:#fff;border:1px solid #dce3ec;border-radius:16px;padding:12px}.aitext,#aictx,.aiitem input,.aiitem select,.aiitem textarea{width:100%;border:1px solid #d8e0ea;background:#fbfcfe;border-radius:11px;padding:10px;font:inherit;font-size:12px;color:#263651}.aitext{min-height:130px}.aigo{width:100%;min-height:44px;border:0;background:#315f97;color:#fff;border-radius:12px;padding:12px;margin-top:9px;font-weight:800}.aimic{width:100%;min-height:145px;border:1px solid #d8e0ea;background:#fbfcfe;border-radius:14px;display:grid;place-items:center;align-content:center;gap:6px;color:#263651}.aimic i{width:30px;height:30px;display:grid;place-items:center;border-radius:50%;background:#edf3fb;color:#416fa9}.aimic.rec i{background:#fee2e2;color:#b4232c}.aimic span{font-size:10px;color:#667085;max-width:300px}.aifile{min-height:92px;border:1px dashed #bdc9d8;border-radius:13px;background:#fbfcfe;display:grid;place-content:center;text-align:center;padding:12px}.aifile b{font-size:12px}.aifile span{font-size:10px;color:#667085;margin-top:4px}#aictx{margin-top:9px;min-height:72px}.aibusy{margin-top:10px;border-radius:12px;background:#edf3fb;padding:10px;color:#315f97;font-size:11px}.aierr{margin-top:10px;border:1px solid #fecdd3;background:#fff1f2;color:#9f1239;border-radius:12px;padding:10px;font-size:11px;line-height:1.4}.airesult{margin-top:10px;display:grid;gap:9px}.airesult>small{font-size:8px;font-weight:900;letter-spacing:.12em;color:#667085}.airesult>h3{margin:0;color:#172033;font-size:16px}.airesult details{background:#fff;border:1px solid #dce3ec;border-radius:11px;padding:9px}.airesult details summary{font-size:10px;font-weight:800}.airesult details p{font-size:10px;white-space:pre-wrap}.aiitem{background:#fff;border:1px solid #dce3ec;border-radius:15px;padding:11px;display:grid;gap:8px}.aitop{display:flex;justify-content:space-between;gap:8px;align-items:center}.aitop>b{font-size:9px;color:#667085}.aiinclude{font-size:10px;font-weight:850;display:flex;gap:6px;align-items:center}.aiinclude input{width:auto}.aigrid{display:grid;grid-template-columns:1fr 1fr;gap:7px}.aigrid label,.aifield{display:grid;gap:4px;font-size:8px;font-weight:900;color:#667085;letter-spacing:.03em}.aiitem textarea{min-height:64px}.aiact{display:grid;grid-template-columns:1fr 1.4fr;gap:8px;position:sticky;bottom:0;background:#f7f9fc;padding:8px 0 calc(2px + env(safe-area-inset-bottom))}.aiact button{min-height:44px;border-radius:11px;font-weight:900;border:1px solid #dce3ec}.aiact #aiapply{background:#315f97;color:#fff;border-color:#315f97}.aiact #aicancel{background:#fff;color:#526071}
    @media(max-width:430px){.aigrid{grid-template-columns:1fr 1fr}.aisheet{max-height:96dvh}.aibtn b{display:none}.aibtn{width:40px;padding:0;justify-content:center}}
    @media(max-width:350px){.aigrid{grid-template-columns:1fr}}
  `;document.head.appendChild(style);
  install();
  window.__fcFamilyAIHealth={version:2,secureHeader:true,dynamicPeople:true,preservesEventRange:true};
})();
