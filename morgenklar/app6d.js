// MorgenKlar V6.1 – Schule: Hausaufgaben, Tests, Lernen, Fächer
(function schoolEnhancement(){
  const style=document.createElement('style');
  style.textContent=`
    .school-add{border-color:#d9cffd!important;background:#faf8ff!important;color:#6652ad!important}
    .school-badges{display:flex;gap:5px;flex-wrap:wrap;margin-top:4px}
    .school-badge{display:inline-flex;align-items:center;gap:4px;padding:3px 7px;border-radius:999px;background:#f2f5fa;color:#5b6a7d;font-size:9px;font-weight:850}
    .school-badge.type{background:#eef3ff;color:#4263a6}
    .school-badge.subject{background:#f5efff;color:#7356aa}
    .subject-other{display:none}.subject-other.on{display:block}
  `;
  document.head.appendChild(style);

  const q=document.querySelector('.quick');
  if(q && !document.getElementById('openSchoolTask')){
    const btn=document.createElement('button');
    btn.id='openSchoolTask';btn.className='school-add';
    btn.innerHTML='<span>📚</span>Schule';
    const generic=[...q.querySelectorAll('button')].find(b=>b.dataset.quick==='Hausaufgaben');
    if(generic) generic.replaceWith(btn); else q.insertBefore(btn,q.lastElementChild);
  }

  const grid=document.querySelector('#customTaskModal .review-grid');
  if(grid && !document.getElementById('customTaskType')){
    const wrap=document.createElement('div');
    wrap.className='wide';
    wrap.innerHTML=`
      <div class="review-grid" style="margin-bottom:2px">
        <div><div class="label">Art</div><select id="customTaskType">
          <option value="material">🎒 Mitnehmen</option>
          <option value="homework">✏️ Hausaufgabe</option>
          <option value="test">📝 Test / Prüfung</option>
          <option value="study">📖 Lernen / Üben</option>
          <option value="signature">✍️ Unterschrift / Rückgabe</option>
          <option value="other">📌 Andere Aufgabe</option>
        </select></div>
        <div><div class="label">Fach</div><select id="customTaskSubject">
          <option value="">Kein Fach</option>
          <option>Mathematik</option><option>Deutsch</option><option>Französisch</option><option>NMG</option>
          <option>Englisch</option><option>Sport</option><option>Musik</option><option>Gestalten</option><option>Medien & Informatik</option>
          <option value="__other">＋ Eigenes Fach</option>
        </select></div>
        <div class="wide subject-other" id="customSubjectOtherWrap"><div class="label">Eigenes Fach</div><input class="input" id="customSubjectOther" placeholder="z. B. Religion, Werken, Förderunterricht"></div>
      </div>`;
    grid.insertBefore(wrap,grid.firstChild);
  }
})();

const SCHOOL_TYPE_META={
  material:{label:'Mitnehmen',icon:'🎒'},homework:{label:'Hausaufgabe',icon:'✏️'},test:{label:'Test / Prüfung',icon:'📝'},
  study:{label:'Lernen / Üben',icon:'📖'},signature:{label:'Unterschrift / Rückgabe',icon:'✍️'},other:{label:'Aufgabe',icon:'📌'}
};
function schoolTypeMeta(type){return SCHOOL_TYPE_META[type]||SCHOOL_TYPE_META.other}
function schoolTaskIcon(t){if(t.icon)return t.icon;if(t.type&&t.type!=='material')return schoolTypeMeta(t.type).icon;return iconFor(t.label)}
function chosenSubject(){return customTaskSubject.value==='__other'?customSubjectOther.value.trim():customTaskSubject.value}
function updateCustomSubjectVisibility(){customSubjectOtherWrap.classList.toggle('on',customTaskSubject.value==='__other')}
customTaskSubject.onchange=updateCustomSubjectVisibility;

const previousOpenTaskEditor=openTaskEditor;
openTaskEditor=function(childId=null,taskId=null,preset={}){
  previousOpenTaskEditor(childId,taskId);
  const typeEl=document.getElementById('customTaskType');
  const subjectEl=document.getElementById('customTaskSubject');
  const otherEl=document.getElementById('customSubjectOther');
  let found=null;
  if(childId&&taskId){for(const bucket of ['today','tomorrow']){const t=(state.tasks[bucket][childId]||[]).find(x=>x.id===taskId);if(t){found=t;break}}}
  typeEl.value=found?.type||preset.type||'material';
  const subj=found?.subject||preset.subject||'';
  if(subj && ![...subjectEl.options].some(o=>o.value===subj)){subjectEl.value='__other';otherEl.value=subj}else{subjectEl.value=subj;otherEl.value=''}
  updateCustomSubjectVisibility();
  if(preset.type){customTaskTitle.textContent=preset.type==='test'?'Test / Prüfung eintragen':preset.type==='homework'?'Hausaufgabe eintragen':'Schuleintrag';}
  if(preset.label)customTaskLabel.value=preset.label;
};

persistCustomTask=function(){
  const label=customTaskLabel.value.trim();if(!label)return toastMsg('Bitte Aufgabe oder Inhalt eintragen');
  const childId=customTaskChild.value,bucket=customTaskDay.value,time=customTaskTime.value,note=customTaskNote.value.trim();
  const type=customTaskType.value,subject=chosenSubject(),meta=schoolTypeMeta(type),icon=customTaskIcon.value.trim()||meta.icon;
  if(editingTaskRef){
    const oldArr=state.tasks[editingTaskRef.bucket][editingTaskRef.childId]||[];const idx=oldArr.findIndex(t=>t.id===editingTaskRef.taskId);
    if(idx>=0){const existing=oldArr[idx];oldArr.splice(idx,1);state.tasks[bucket][childId]=state.tasks[bucket][childId]||[];state.tasks[bucket][childId].push({...existing,label,time,note,icon,type,subject})}
  }else{
    state.tasks[bucket][childId]=state.tasks[bucket][childId]||[];
    state.tasks[bucket][childId].push({id:uid(),label,done:false,note:note||(bucket==='tomorrow'?'für morgen':'für heute'),time,icon,type,subject});
  }
  editingTaskRef=null;customTaskModal.classList.remove('on');dayMode=bucket;todayFilterValue=childId;save();toastMsg(`${meta.icon} ${meta.label} gespeichert`);
};

const previousRenderToday=renderToday;
renderToday=function(){
  previousRenderToday();
  taskList.querySelectorAll('.task').forEach(row=>{
    const t=(state.tasks[dayMode][row.dataset.child]||[]).find(x=>x.id===row.dataset.task);if(!t)return;
    const symbol=row.querySelector('.symbol');if(symbol)symbol.textContent=schoolTaskIcon(t);
    if(t.type||t.subject){
      const main=row.querySelector('.task-main');const small=main.querySelector('small');
      const badges=document.createElement('div');badges.className='school-badges';
      if(t.type)badges.innerHTML+=`<span class="school-badge type">${schoolTypeMeta(t.type).icon} ${esc(schoolTypeMeta(t.type).label)}</span>`;
      if(t.subject)badges.innerHTML+=`<span class="school-badge subject">📚 ${esc(t.subject)}</span>`;
      if(small)small.insertAdjacentElement('afterend',badges); else main.appendChild(badges);
    }
  });
};

const schoolBtn=document.getElementById('openSchoolTask');
if(schoolBtn)schoolBtn.onclick=()=>openTaskEditor(null,null,{type:'homework',label:''});

const quick=document.querySelector('.quick');
if(quick && !document.getElementById('quickTest')){
  const hw=document.createElement('button');hw.innerHTML='<span>✏️</span>Hausaufgabe';hw.onclick=()=>openTaskEditor(null,null,{type:'homework'});
  const test=document.createElement('button');test.id='quickTest';test.innerHTML='<span>📝</span>Test';test.onclick=()=>openTaskEditor(null,null,{type:'test'});
  const study=document.createElement('button');study.innerHTML='<span>📖</span>Lernen';study.onclick=()=>openTaskEditor(null,null,{type:'study'});
  const school=document.getElementById('openSchoolTask');
  if(school){school.insertAdjacentElement('beforebegin',hw);school.insertAdjacentElement('beforebegin',test);school.insertAdjacentElement('beforebegin',study)}
}
renderAll();
