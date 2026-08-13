// MorgenKlar V6 – flexible Einträge + eigene Foto-Termine
// UI-Erweiterungen dynamisch in die bestehende V5 einsetzen
(function enhanceUI(){
  const style=document.createElement('style');
  style.textContent=`.quick .custom-add{border-color:#cbdcff!important;background:#f5f8ff!important;color:#2f64b8!important}.task-edit{border:0;background:#f1f4f8;color:#607188;border-radius:10px;padding:7px 8px;font-size:13px;flex:none}.split-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}.action-card{border:1px solid #dfe7f1;background:#fff;border-radius:17px;padding:13px 10px;text-align:center;font-weight:850;font-size:11px;color:#3d506a}.action-card span{font-size:25px;display:block;margin-bottom:5px}.helper{font-size:10px;color:#718096;line-height:1.4;margin-top:5px}`;
  document.head.appendChild(style);
  const q=document.querySelector('.quick');
  if(q){q.innerHTML=`
    <button data-quick="Rucksack"><span>🎒</span>Rucksack</button><button data-quick="Trinkflasche"><span>🥤</span>Trinkflasche</button>
    <button data-quick="Znünibox"><span>🍎</span>Znünibox</button><button data-quick="Turnsachen"><span>👟</span>Turnsachen</button>
    <button data-quick="Helm"><span>🪖</span>Helm</button><button data-quick="Leuchtweste"><span>🦺</span>Leuchtweste</button>
    <button data-quick="Hallenschuhe"><span>👟</span>Hallenschuhe</button><button data-quick="Schwimmsachen"><span>🏊</span>Schwimmsachen</button>
    <button data-quick="Bibliotheksbuch"><span>📚</span>Bibliotheksbuch</button><button data-quick="Instrument"><span>🎵</span>Instrument</button>
    <button data-quick="Regenjacke"><span>🌧️</span>Regenjacke</button><button data-quick="Sonnenhut"><span>🧢</span>Sonnenhut</button>
    <button data-quick="Hausaufgaben"><span>✏️</span>Hausaufgaben</button><button data-quick="Schlüssel"><span>🔑</span>Schlüssel</button>
    <button data-quick="Geld mitgeben"><span>💰</span>Geld</button><button data-quick="Unterschrift"><span>✍️</span>Unterschrift</button>
    <button class="custom-add" id="openCustomTask"><span>＋</span>Eigener Eintrag</button>`;
  }
  const docType=document.getElementById('docType');
  if(docType&&!docType.querySelector('option[value="appointment"]')){const o=document.createElement('option');o.value='appointment';o.textContent='Eigener Termin';docType.insertBefore(o,docType.querySelector('option[value="other"]'))}
  const upload=document.querySelector('.upload-card');
  if(upload&&!document.getElementById('appointmentFile')){const wrap=document.createElement('div');wrap.className='split-actions';wrap.innerHTML=`<label class="action-card" for="appointmentFile"><span>📸</span>Termin fotografieren<div class="helper">z. B. Arzt, Behörde, Einladung</div></label><label class="action-card" for="docFile"><span>📄</span>Dokument hochladen<div class="helper">Schule, Stundenplan, PDF</div></label><input id="appointmentFile" type="file" accept="image/*" capture="environment" hidden>`;upload.parentNode.insertBefore(wrap,upload)}
  if(!document.getElementById('customTaskModal')){const box=document.createElement('div');box.innerHTML=`<div class="modal" id="customTaskModal"><div class="sheet"><h3 id="customTaskTitle">Eigener Eintrag</h3><div class="muted">Frei ergänzen – mit Symbol, Uhrzeit und Notiz.</div><div class="review-grid"><div><div class="label">Kind</div><select id="customTaskChild"></select></div><div><div class="label">Tag</div><select id="customTaskDay"><option value="tomorrow">Morgen</option><option value="today">Heute</option></select></div><div class="wide"><div class="label">Was wird gebraucht?</div><input class="input" id="customTaskLabel" placeholder="z. B. Bastelsachen, Foto, Spezialheft"></div><div><div class="label">Symbol</div><input class="input" id="customTaskIcon" maxlength="4" placeholder="📌"></div><div><div class="label">Uhrzeit (optional)</div><input class="input" id="customTaskTime" type="time"></div><div class="wide"><div class="label">Notiz (optional)</div><input class="input" id="customTaskNote" placeholder="z. B. vor der Schule abgeben"></div></div><div class="modal-footer"><button class="btn soft" id="customTaskCancel">Abbrechen</button><button class="btn" id="customTaskSave">Speichern</button></div></div></div>`;document.body.appendChild(box.firstElementChild)}
})();
const SELF_ID='me';
let editingTaskRef=null;

function personName(id){return id===SELF_ID?'Ich':(child(id)?.name||'Nicht zugeordnet')}
function personIcon(id){return id===SELF_ID?'👤':'👦'}
function personOptions(selected='',includeAuto=false){
  let out=includeAuto?`<option value="auto" ${selected==='auto'?'selected':''}>Automatisch erkennen</option>`:'';
  out+=`<option value="${SELF_ID}" ${selected===SELF_ID?'selected':''}>Ich / eigener Termin</option>`;
  out+=state.children.map(c=>`<option value="${c.id}" ${selected===c.id?'selected':''}>${esc(c.name)}</option>`).join('');
  return out;
}
function filterPeopleChips(el,value,callback){
  let html=`<button class="chip ${value==='all'?'on':''}" data-id="all">Alle</button><button class="chip ${value===SELF_ID?'on':''}" data-id="${SELF_ID}">👤 Ich</button>`;
  html+=state.children.map(c=>`<button class="chip ${value===c.id?'on':''}" data-id="${c.id}">👦 ${esc(c.name)}</button>`).join('');
  el.innerHTML=html;el.querySelectorAll('button').forEach(b=>b.onclick=()=>callback(b.dataset.id));
}

iconFor=function(v){
  const s=norm(v);
  if(s.includes('ruck'))return'🎒';if(s.includes('helm'))return'🪖';if(s.includes('trink'))return'🥤';
  if(s.includes('znuni')||s.includes('proviant')||s.includes('verpflegung'))return'🍎';
  if(s.includes('turn')||s.includes('sport')||s.includes('schuh'))return'👟';
  if(s.includes('geld')||s.includes('chf')||s.includes('franken'))return'💰';if(s.includes('regen'))return'🌧️';
  if(s.includes('weste'))return'🦺';if(s.includes('untersch'))return'✍️';if(s.includes('bibliothek')||s.includes('buch'))return'📚';
  if(s.includes('schulreise')||s.includes('ausflug'))return'🚌';if(s.includes('wald'))return'🌲';if(s.includes('foto'))return'📸';
  if(s.includes('arzt')||s.includes('zahnarzt')||s.includes('therapie')||s.includes('praxis'))return'🩺';
  if(s.includes('elternabend'))return'👥';if(s.includes('schwimm'))return'🏊';if(s.includes('instrument')||s.includes('musik'))return'🎵';
  if(s.includes('hausauf')||s.includes('blatt')||s.includes('heft'))return'✏️';if(s.includes('schlussel'))return'🔑';
  if(s.includes('sonne')||s.includes('hut')||s.includes('cap'))return'🧢';if(s.includes('geburtstag'))return'🎂';if(s.includes('termin'))return'📅';
  return'📌';
};

renderToday=function(){
  filterChips(todayFilter,todayFilterValue,true,v=>{todayFilterValue=v;renderToday()});
  const ids=state.children.filter(c=>todayFilterValue==='all'||c.id===todayFilterValue);let total=0,done=0;
  taskList.innerHTML=ids.map(c=>{const arr=state.tasks[dayMode][c.id]||[];total+=arr.length;done+=arr.filter(t=>t.done).length;
    return `<div class="child-card"><div class="child-head"><div class="child-title"><div class="kid-avatar ${esc(c.tone)}">👦</div><div><b>${esc(c.name)}</b><div class="muted">${arr.filter(x=>x.done).length} von ${arr.length} erledigt</div></div></div><span class="badge">${arr.length-arr.filter(x=>x.done).length} offen</span></div>${arr.length?arr.map(t=>{const meta=[t.time?`🕒 ${t.time}`:'',t.note||''].filter(Boolean).join(' · ');return `<div class="task ${t.done?'done':''}" data-child="${c.id}" data-task="${t.id}"><button class="check">${t.done?'✓':''}</button><div class="symbol">${esc(t.icon||iconFor(t.label))}</div><div class="task-main"><b>${esc(t.label)}</b><small>${esc(meta)}</small></div><button class="task-edit" aria-label="Eintrag bearbeiten">✎</button></div>`}).join(''):'<div class="empty">Für diesen Tag ist nichts eingetragen.</div>'}</div>`}).join('');
  taskList.querySelectorAll('.task').forEach(row=>{row.querySelector('.check').onclick=()=>{const arr=state.tasks[dayMode][row.dataset.child];const t=arr.find(x=>x.id===row.dataset.task);if(t){t.done=!t.done;save()}};row.querySelector('.task-edit').onclick=()=>openTaskEditor(row.dataset.child,row.dataset.task)});
  const pct=total?Math.round(done/total*100):100;meterBar.style.width=pct+'%';meterText.textContent=`${done} von ${total} erledigt`;meterPct.textContent=pct+'%';openCount.textContent=`${Math.max(0,total-done)} offen`;heroDate.textContent=dayMode==='tomorrow'?'Morgen':'Heute';heroTitle.textContent=pct===100?'Alles bereit. ✓':dayMode==='tomorrow'?'Alles bereit für morgen?':'Was ist heute noch offen?';heroCopy.textContent=pct===100?'Sehr gut – aktuell ist nichts Wichtiges mehr offen.':'Ein kurzer Blick – dann ist klar, was jedes Kind braucht.';todayToggle.classList.toggle('on',dayMode==='today');tomorrowToggle.classList.toggle('on',dayMode==='tomorrow');
};

function openTaskEditor(childId=null,taskId=null){
  editingTaskRef=null;customTaskChild.innerHTML=state.children.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join('');
  customTaskDay.value=dayMode;customTaskChild.value=childId||((todayFilterValue!=='all'&&todayFilterValue)||state.children[0]?.id||'');
  customTaskLabel.value='';customTaskIcon.value='';customTaskTime.value='';customTaskNote.value='';customTaskTitle.textContent='Eigener Eintrag';
  if(childId&&taskId){for(const bucket of ['today','tomorrow']){const t=(state.tasks[bucket][childId]||[]).find(x=>x.id===taskId);if(t){editingTaskRef={childId,taskId,bucket};customTaskChild.value=childId;customTaskDay.value=bucket;customTaskLabel.value=t.label||'';customTaskIcon.value=t.icon||iconFor(t.label);customTaskTime.value=t.time||'';customTaskNote.value=t.note||'';customTaskTitle.textContent='Eintrag bearbeiten';break}}}
  customTaskModal.classList.add('on');setTimeout(()=>customTaskLabel.focus(),100);
}
function persistCustomTask(){
  const label=customTaskLabel.value.trim();if(!label)return toastMsg('Bitte etwas eintragen');
  const childId=customTaskChild.value,bucket=customTaskDay.value,time=customTaskTime.value,note=customTaskNote.value.trim(),icon=customTaskIcon.value.trim();
  if(editingTaskRef){const oldArr=state.tasks[editingTaskRef.bucket][editingTaskRef.childId]||[];const idx=oldArr.findIndex(t=>t.id===editingTaskRef.taskId);if(idx>=0){const existing=oldArr[idx];oldArr.splice(idx,1);state.tasks[bucket][childId]=state.tasks[bucket][childId]||[];state.tasks[bucket][childId].push({...existing,label,time,note,icon})}}
  else{state.tasks[bucket][childId]=state.tasks[bucket][childId]||[];state.tasks[bucket][childId].push({id:uid(),label,done:false,note:note||(bucket==='tomorrow'?'für morgen':'für heute'),time,icon})}
  editingTaskRef=null;customTaskModal.classList.remove('on');dayMode=bucket;todayFilterValue=childId;save();toastMsg('Eintrag gespeichert');
}
