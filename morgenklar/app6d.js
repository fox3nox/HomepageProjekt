// MorgenKlar V6.2 – Schule: Hausaufgaben, Tests, Lernen, Fächer + beliebiges Datum
(function schoolEnhancement(){
  const style=document.createElement('style');
  style.textContent=`
    .school-add{border-color:#d9cffd!important;background:#faf8ff!important;color:#6652ad!important}
    .school-badges{display:flex;gap:5px;flex-wrap:wrap;margin-top:4px}
    .school-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 7px;border-radius:999px;background:#f2f5fa;color:#5b6a7d;font-size:9px;font-weight:850}
    .school-badge.type{background:#eef3ff;color:#4263a6}.school-badge.subject{background:#f5efff;color:#7356aa}
    .subject-other{display:none}.subject-other.on{display:block}.date-hint{font-size:9px;color:#7b8798;margin-top:4px;line-height:1.35}
  `;
  document.head.appendChild(style);

  const q=document.querySelector('.quick');
  if(q && !document.getElementById('openSchoolTask')){
    const btn=document.createElement('button');btn.id='openSchoolTask';btn.className='school-add';btn.innerHTML='<span>📚</span>Schule';
    const generic=[...q.querySelectorAll('button')].find(b=>b.dataset.quick==='Hausaufgaben');
    if(generic)generic.replaceWith(btn);else q.insertBefore(btn,q.lastElementChild);
  }

  const grid=document.querySelector('#customTaskModal .review-grid');
  if(grid && !document.getElementById('customTaskType')){
    const wrap=document.createElement('div');wrap.className='wide';wrap.innerHTML=`
      <div class="review-grid" style="margin-bottom:2px">
        <div><div class="label">Art</div><select id="customTaskType">
          <option value="material">🎒 Mitnehmen</option><option value="homework">✏️ Hausaufgabe</option>
          <option value="test">📝 Test / Prüfung</option><option value="study">📖 Lernen / Üben</option>
          <option value="signature">✍️ Unterschrift / Rückgabe</option><option value="other">📌 Andere Aufgabe</option>
        </select></div>
        <div><div class="label">Fach</div><select id="customTaskSubject">
          <option value="">Kein Fach</option><option>Mathematik</option><option>Deutsch</option><option>Französisch</option><option>NMG</option>
          <option>Englisch</option><option>Sport</option><option>Musik</option><option>Gestalten</option><option>Medien & Informatik</option>
          <option value="__other">＋ Eigenes Fach</option>
        </select></div>
        <div class="wide subject-other" id="customSubjectOtherWrap"><div class="label">Eigenes Fach</div><input class="input" id="customSubjectOther" placeholder="z. B. Religion, Werken, Förderunterricht"></div>
        <div class="wide"><div class="label">Fällig / Termin am</div><input class="input" id="customTaskDate" type="date"><div class="date-hint">Heute und morgen erscheinen in der Checkliste. Spätere Daten stehen automatisch in der Wochenansicht.</div></div>
      </div>`;
    grid.insertBefore(wrap,grid.firstChild);
  }
})();

const SCHOOL_TYPE_META={material:{label:'Mitnehmen',icon:'🎒'},homework:{label:'Hausaufgabe',icon:'✏️'},test:{label:'Test / Prüfung',icon:'📝'},study:{label:'Lernen / Üben',icon:'📖'},signature:{label:'Unterschrift / Rückgabe',icon:'✍️'},other:{label:'Aufgabe',icon:'📌'}};
function schoolTypeMeta(type){return SCHOOL_TYPE_META[type]||SCHOOL_TYPE_META.other}
function schoolTaskIcon(t){if(t.icon)return t.icon;if(t.type&&t.type!=='material')return schoolTypeMeta(t.type).icon;return iconFor(t.label)}
function chosenSubject(){const s=document.getElementById('customTaskSubject');return s.value==='__other'?document.getElementById('customSubjectOther').value.trim():s.value}
function updateCustomSubjectVisibility(){document.getElementById('customSubjectOtherWrap').classList.toggle('on',document.getElementById('customTaskSubject').value==='__other')}
document.getElementById('customTaskSubject').onchange=updateCustomSubjectVisibility;
function localIso(d){const x=new Date(d);x.setMinutes(x.getMinutes()-x.getTimezoneOffset());return x.toISOString().slice(0,10)}
function todayIso(){return localIso(new Date())}
function tomorrowIso(){const d=new Date();d.setDate(d.getDate()+1);return localIso(d)}
function dateToBucket(date){if(date===todayIso())return'today';if(date===tomorrowIso())return'tomorrow';return null}

const previousIconFor=iconFor;
iconFor=function(v){const s=norm(v);if(s.includes('test')||s.includes('pruf')||s.includes('prüfung'))return'📝';if(s.includes('hausauf'))return'✏️';if(s.includes('lernen')||s.includes('uben')||s.includes('üben'))return'📖';if(s.includes('mathe')||s.includes('mathematik'))return'➗';if(s.includes('franz'))return'🇫🇷';if(s.includes('nmg'))return'🌍';return previousIconFor(v)};

const previousOpenTaskEditor=openTaskEditor;
openTaskEditor=function(childId=null,taskId=null,preset={}){
  previousOpenTaskEditor(childId,taskId);
  const typeEl=document.getElementById('customTaskType'),subjectEl=document.getElementById('customTaskSubject'),otherEl=document.getElementById('customSubjectOther'),dateEl=document.getElementById('customTaskDate');
  let found=null,foundBucket=null;
  if(childId&&taskId){for(const bucket of ['today','tomorrow']){const t=(state.tasks[bucket][childId]||[]).find(x=>x.id===taskId);if(t){found=t;foundBucket=bucket;break}}}
  typeEl.value=found?.type||preset.type||'material';
  const subj=found?.subject||preset.subject||'';
  if(subj&&![...subjectEl.options].some(o=>o.value===subj)){subjectEl.value='__other';otherEl.value=subj}else{subjectEl.value=subj;otherEl.value=''}
  updateCustomSubjectVisibility();
  dateEl.value=found?.dueDate||(foundBucket==='today'?todayIso():foundBucket==='tomorrow'?tomorrowIso():(document.getElementById('customTaskDay').value==='today'?todayIso():tomorrowIso()));
  if(preset.type)customTaskTitle.textContent=preset.type==='test'?'Test / Prüfung eintragen':preset.type==='homework'?'Hausaufgabe eintragen':'Schuleintrag';
  if(preset.label)customTaskLabel.value=preset.label;
};

persistCustomTask=function(){
  const label=customTaskLabel.value.trim();if(!label)return toastMsg('Bitte Aufgabe oder Inhalt eintragen');
  const childId=customTaskChild.value,time=customTaskTime.value,note=customTaskNote.value.trim(),type=document.getElementById('customTaskType').value,subject=chosenSubject(),meta=schoolTypeMeta(type),icon=customTaskIcon.value.trim()||meta.icon;
  const dueDate=document.getElementById('customTaskDate').value||((customTaskDay.value==='today')?todayIso():tomorrowIso());
  const bucket=dateToBucket(dueDate);

  if(editingTaskRef){const oldArr=state.tasks[editingTaskRef.bucket][editingTaskRef.childId]||[];const idx=oldArr.findIndex(t=>t.id===editingTaskRef.taskId);if(idx>=0)oldArr.splice(idx,1)}

  if(bucket){
    state.tasks[bucket][childId]=state.tasks[bucket][childId]||[];
    state.tasks[bucket][childId].push({id:uid(),label,done:false,note:note||(bucket==='tomorrow'?'für morgen':'für heute'),time,icon,type,subject,dueDate});
    dayMode=bucket;todayFilterValue=childId;
  }else{
    state.events=state.events||[];
    state.events.push({id:uid(),child:childId,title:`${meta.label}: ${label}`,date:dueDate,start:time,end:'',location:'',items:[],note:[subject?`Fach: ${subject}`:'',note].filter(Boolean).join(' · '),schoolType:type,subject,icon});
  }
  editingTaskRef=null;customTaskModal.classList.remove('on');save();toastMsg(`${meta.icon} ${meta.label} gespeichert`);
};

const previousRenderToday=renderToday;
renderToday=function(){
  previousRenderToday();
  taskList.querySelectorAll('.task').forEach(row=>{
    const t=(state.tasks[dayMode][row.dataset.child]||[]).find(x=>x.id===row.dataset.task);if(!t)return;
    const symbol=row.querySelector('.symbol');if(symbol)symbol.textContent=schoolTaskIcon(t);
    if(t.type||t.subject){const main=row.querySelector('.task-main'),small=main.querySelector('small'),badges=document.createElement('div');badges.className='school-badges';if(t.type)badges.innerHTML+=`<span class="school-badge type">${schoolTypeMeta(t.type).icon} ${esc(schoolTypeMeta(t.type).label)}</span>`;if(t.subject)badges.innerHTML+=`<span class="school-badge subject">📚 ${esc(t.subject)}</span>`;if(small)small.insertAdjacentElement('afterend',badges);else main.appendChild(badges)}
  });
};

const previousRenderWeek=renderWeek;
renderWeek=function(){previousRenderWeek();weekList.querySelectorAll('.event').forEach(card=>{const title=card.querySelector('.event-title b')?.textContent||'';const e=state.events.find(x=>x.title===title&&x.schoolType);if(e){const icon=card.querySelector('.event-icon');if(icon)icon.textContent=e.icon||schoolTypeMeta(e.schoolType).icon}})};

const schoolBtn=document.getElementById('openSchoolTask');if(schoolBtn)schoolBtn.onclick=()=>openTaskEditor(null,null,{type:'homework'});
const quick=document.querySelector('.quick');
if(quick&&!document.getElementById('quickTest')){
  const hw=document.createElement('button');hw.innerHTML='<span>✏️</span>Hausaufgabe';hw.onclick=()=>openTaskEditor(null,null,{type:'homework'});
  const test=document.createElement('button');test.id='quickTest';test.innerHTML='<span>📝</span>Test';test.onclick=()=>openTaskEditor(null,null,{type:'test'});
  const study=document.createElement('button');study.innerHTML='<span>📖</span>Lernen';study.onclick=()=>openTaskEditor(null,null,{type:'study'});
  const school=document.getElementById('openSchoolTask');if(school){school.insertAdjacentElement('beforebegin',hw);school.insertAdjacentElement('beforebegin',test);school.insertAdjacentElement('beforebegin',study)}
}
renderAll();
