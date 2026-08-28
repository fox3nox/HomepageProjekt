/* Family Command · V8 light compact enhancer · 2026-08-28 */
(()=>{
  'use strict';
  if(window.__fcV8Installed)return;window.__fcV8Installed=true;
  let queued=false;
  const TASK_EMPTY=`<div class="v8-task-empty-inner"><svg class="v8-task-empty-icon" viewBox="0 0 120 120" aria-hidden="true"><defs><linearGradient id="v8g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7180ff"/><stop offset="1" stop-color="#9a8cff"/></linearGradient></defs><circle cx="60" cy="60" r="48" fill="#f2f3ff"/><rect x="36" y="31" width="48" height="61" rx="10" fill="#fff" stroke="#cdd3e1" stroke-width="3"/><rect x="48" y="25" width="24" height="12" rx="6" fill="url(#v8g)"/><path d="M47 49h7M60 49h13M47 62h7M60 62h13M47 75h7M60 75h13" stroke="#a8b0c0" stroke-width="3" stroke-linecap="round"/><path d="m47 48 3 3 5-6M47 61l3 3 5-6" stroke="#6673ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg><h3>Alles erledigt</h3><p>Hier ist aktuell nichts zu erledigen. Neue Aufgaben erscheinen automatisch an dieser Stelle.</p></div>`;

  function markEmptyTodo(root){
    root?.querySelectorAll('.fc-todo-card').forEach(card=>{
      const hasRows=!!card.querySelector('.fc-todo-row');
      const text=String(card.textContent||'');
      card.classList.toggle('v8-hide-empty-todo',!hasRows&&/Noch keine To-dos|Erstes To-do hinzufügen/i.test(text));
    });
  }
  function day(root){
    if(!root)return;root.classList.add('v8-day');
    markEmptyTodo(root);
    [...root.querySelectorAll('.v6-section')].forEach(sec=>{
      const title=String(sec.querySelector('.v6-section-head h2')?.textContent||'');
      if(/Aufgaben/i.test(title)&&sec.querySelector('.v6-empty'))sec.classList.add('v8-empty-summary');
      if(/Pendenzen/i.test(title))sec.classList.add('v8-pendencies');
      if(/Heute noch|Termine morgen/i.test(title))sec.classList.add('v8-agenda-summary');
      if(/Kinder heute|Kinder morgen/i.test(title))sec.classList.add('v8-kids-summary');
    });
  }
  function tasks(){
    const root=document.getElementById('homework');if(!root)return;root.classList.add('v8-homework');
    const empty=root.querySelector('.v6-empty');
    if(empty&&!root.querySelector('.v6-homework-row')){
      empty.classList.add('v8-task-empty');
      if(!empty.querySelector('.v8-task-empty-inner'))empty.innerHTML=TASK_EMPTY;
    }
  }
  function calendar(){document.getElementById('events')?.classList.add('v8-calendar');document.getElementById('week')?.classList.add('v8-calendar','v8-week')}
  function more(){document.getElementById('more')?.classList.add('v8-more')}
  function enhance(){queued=false;try{day(document.getElementById('today'));day(document.getElementById('tomorrow'));tasks();calendar();more();document.documentElement.dataset.fcV8='1'}catch(e){console.error('fc_v8_enhance',e)}}
  function schedule(){if(queued)return;queued=true;requestAnimationFrame(enhance)}
  const content=document.querySelector('.content');if(content)new MutationObserver(schedule).observe(content,{childList:true,subtree:true});
  document.addEventListener('click',e=>{if(e.target?.closest?.('.navbtn,.v7-calendar-tabs,.v6-filter,.v6-segment'))setTimeout(schedule,0)},true);
  window.__fcV8={version:'8.0',enhance,schedule};
  enhance();setTimeout(enhance,120);setTimeout(enhance,700);
})();
