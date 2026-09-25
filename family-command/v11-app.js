/* Familienzentrale V11 · one calm product shell over the proven data/runtime layer */
(()=>{'use strict';
if(window.__fcV11)return;

const VERSION='11.0.1-today-work';
const APP=document.getElementById('fcApp');
const D=()=>window.data&&typeof window.data==='object'?window.data:{};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s??'').toLocaleLowerCase('de-CH').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ä/g,'a').replace(/ö/g,'o').replace(/ü/g,'u').replace(/ß/g,'ss').replace(/[^a-z0-9]+/g,' ').trim();
const rows=v=>Array.isArray(v)?v:Object.values(v||{});
const active=x=>x&&!x.archived&&!x.deleted;
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const today=()=>{try{return typeof window.todayISO==='function'?window.todayISO():iso(new Date())}catch{return iso(new Date())}};
const dateObj=s=>new Date(String(s).slice(0,10)+'T12:00:00');
const addDays=(s,n)=>{const d=dateObj(s);d.setDate(d.getDate()+n);return iso(d)};
const fmt=(s,opt={})=>{try{return new Intl.DateTimeFormat('de-CH',{weekday:opt.weekday?'long':undefined,day:'numeric',month:opt.long?'long':'short',year:opt.year?'numeric':undefined}).format(dateObj(s))}catch{return s||''}};
const shortDay=s=>{try{return new Intl.DateTimeFormat('de-CH',{weekday:'short'}).format(dateObj(s)).replace('.','')}catch{return''}};
const person=id=>rows(D().people).find(p=>String(p.id)===String(id))||null;
const color=id=>person(id)?.color||'#64748b';
const personName=id=>person(id)?.name||'';
const pids=x=>[...new Set([...(Array.isArray(x?.personIds)?x.personIds:[]),x?.personId].filter(Boolean).map(String))];
const peopleNames=x=>[...new Set(pids(x).map(personName).filter(Boolean))];
const eventDate=x=>String(x?.date||'').slice(0,10);
const taskDate=x=>String(x?.date||x?.dueDate||'').slice(0,10);
const timeVal=t=>/^\d{1,2}:\d{2}$/.test(String(t||''))?String(t).padStart(5,'0'):'99:99';
const uid=x=>String(x?.sourceCommandId||x?.clientRef||x?.id||`${x?.date||''}|${x?.title||''}`);

const state={
  screen:'today',
  planDate:today(),
  planPerson:'all',
  taskFilter:'open',
  taskPerson:'all',
  docPerson:'all',
  docs:[],
  docsLoading:false,
};

const icons={
 today:'<svg viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5"/><path d="M5.5 9.5V21h13V9.5"/><path d="M9 21v-6h6v6"/></svg>',
 plan:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></svg>',
 tasks:'<svg viewBox="0 0 24 24"><path d="m4 7 2 2 4-4M12 7h8M4 14l2 2 4-4M12 14h8M4 21l2 2 4-4M12 21h8"/></svg>',
 docs:'<svg viewBox="0 0 24 24"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5M9.5 13h6M9.5 17h6"/></svg>',
 more:'<svg viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>',
 search:'<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>',
 plus:'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
 chevron:'<svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg>',
 brain:'<svg viewBox="0 0 24 24"><path d="M9 4.5A3.5 3.5 0 0 0 5.5 8v1A3.5 3.5 0 0 0 4 15.6 3.5 3.5 0 0 0 9 19.5"/><path d="M15 4.5A3.5 3.5 0 0 1 18.5 8v1A3.5 3.5 0 0 1 20 15.6a3.5 3.5 0 0 1-5 3.9M12 3v18M8 9h4M12 15h4"/></svg>',
 upload:'<svg viewBox="0 0 24 24"><path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 15v5h16v-5"/></svg>',
 check:'<svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>',
 bell:'<svg viewBox="0 0 24 24"><path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9"/><path d="M10 21h4"/></svg>',
 user:'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c.7-5 3.4-7 8-7s7.3 2 8 7"/></svg>',
 backup:'<svg viewBox="0 0 24 24"><path d="M5 6a8 8 0 1 1-1 10"/><path d="M5 2v4H1M12 8v5l3 2"/></svg>',
 link:'<svg viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.2 1.2"/><path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.2-1.2"/></svg>',
 download:'<svg viewBox="0 0 24 24"><path d="M12 4v12M7 11l5 5 5-5M5 20h14"/></svg>',
 food:'<svg viewBox="0 0 24 24"><path d="M7 3v8M4 3v5a3 3 0 0 0 6 0V3M7 11v10M17 3v18M17 3c3 2 3 7 0 9"/></svg>',
 cart:'<svg viewBox="0 0 24 24"><path d="M3 4h2l2 11h10l3-8H6M9 20h.01M17 20h.01"/></svg>',
 money:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M15 8.5c-.7-.7-1.7-1-3-1-1.7 0-3 .9-3 2.2 0 3.4 6 1.4 6 4.8 0 1.4-1.3 2.5-3.2 2.5-1.4 0-2.6-.4-3.5-1.2M12 5.5v13"/></svg>',
 contacts:'<svg viewBox="0 0 24 24"><path d="M5 3h12a2 2 0 0 1 2 2v16H5zM5 7H3M5 12H3M5 17H3"/><circle cx="12" cy="10" r="2.5"/><path d="M8.5 17c.4-2.3 1.6-3.5 3.5-3.5s3.1 1.2 3.5 3.5"/></svg>',
};

function icon(name){return icons[name]||icons.more}
function allTodos(){
  const map=new Map();
  const add=a=>rows(a).forEach(x=>{if(x){const k=uid(x);map.set(k,{...(map.get(k)||{}),...x})}});
  try{add(window.__fcChatCommandSync?.all?.())}catch{}
  add(D().todos);
  return [...map.values()];
}
function dependents(){
  const all=rows(D().people).filter(active);
  return all.filter(p=>String(p.id)!=='oli'&&!/papa|mama|adult|erwachs/i.test(String(p.role||'')));
}
function eventsOn(date){
  try{return typeof window.eventsOn==='function'?rows(window.eventsOn(date)):rows(D().events).filter(e=>eventDate(e)===date||(e.endDate&&eventDate(e)<=date&&String(e.endDate)>=date))}catch{return[]}
}
function duplicatesScheduledWork(e,date){
  if(!e||!/arbeit|landi|dienst|schicht/i.test(String(e.title||'')))return false;
  const start=String(e.time||''),end=String(e.end||'');
  if(!start)return false;
  return pids(e).some(pid=>{
    const slots=schedule(pid,dateObj(date).getDay())
      .filter(x=>x.start&&x.end&&/arbeit|landi|dienst|schicht/i.test(String(x.label||'')))
      .sort((a,b)=>timeVal(a.start).localeCompare(timeVal(b.start)));
    if(!slots.length)return false;
    const first=slots[0],last=slots[slots.length-1];
    return start===String(first.start||'')&&(!end||end===String(last.end||''));
  });
}
function schedule(pid,day){
  try{return typeof window.scheduleFor==='function'?rows(window.scheduleFor(pid,day)):rows(D().schedules?.[pid]?.[day])}catch{return[]}
}
function todoRows(filter='open'){
  let list=allTodos().filter(active);
  if(filter==='done')return list.filter(x=>x.done).sort((a,b)=>taskDate(b).localeCompare(taskDate(a)));
  list=list.filter(x=>!x.done);
  if(filter==='today')list=list.filter(x=>!taskDate(x)||taskDate(x)<=today());
  if(filter==='tomorrow')list=list.filter(x=>taskDate(x)===addDays(today(),1));
  return list.sort((a,b)=>Number(!!b.priority)-Number(!!a.priority)||taskDate(a).localeCompare(taskDate(b)));
}
function homeworkRows(filter='open'){
  let list=rows(D().homework).filter(active);
  if(filter==='done')return list.filter(x=>x.done).sort((a,b)=>taskDate(b).localeCompare(taskDate(a)));
  list=list.filter(x=>!x.done);
  if(filter==='today')list=list.filter(x=>!taskDate(x)||taskDate(x)<=today());
  if(filter==='tomorrow')list=list.filter(x=>taskDate(x)===addDays(today(),1));
  return list.sort((a,b)=>taskDate(a).localeCompare(taskDate(b)));
}
function matchesPerson(x,id){return id==='all'||pids(x).includes(String(id))}
function monday(s){const d=dateObj(s),n=(d.getDay()+6)%7;d.setDate(d.getDate()-n);return d}
function weekDates(s){const m=monday(s);return Array.from({length:7},(_,i)=>{const d=new Date(m);d.setDate(m.getDate()+i);return iso(d)})}
function currentState(p,date=today(),live=date===today()){
  try{return window.__fcV9?.currentChildState?.(p,date,live)||null}catch{return null}
}
function childHoliday(p,date=today()){
  try{return typeof window.schoolBreakFor==='function'?window.schoolBreakFor(p.id,date):null}catch{return null}
}
function completedSchoolDay(p,date){
  const slots=schedule(p.id,dateObj(date).getDay()).filter(x=>x.start||x.end).sort((a,b)=>timeVal(a.start).localeCompare(timeVal(b.start)));
  if(!slots.length)return null;
  const first=slots[0],last=slots[slots.length-1];
  const place=first.label||p.school||'Schule / Kindergarten';
  return {kind:'completed',label:/kindergarten/i.test(place)?'Kindergarten beendet':'Schultag beendet',sub:[first.start&&last.end?`${first.start}–${last.end}`:'',place].filter(Boolean).join(' · '),time:''};
}
function childTodayRows(date){
  const priority={active:0,future:1,free:3};
  return dependents().map((p,index)=>{const holiday=childHoliday(p,date),state=currentState(p,date,true);return {p,state:holiday?state:(state||completedSchoolDay(p,date)),holiday,index}})
    .sort((a,b)=>{
      const ar=a.holiday?4:(priority[a.state?.kind]??2),br=b.holiday?4:(priority[b.state?.kind]??2);
      return ar-br||a.index-b.index;
    });
}
function sharedChildHoliday(kids){
  if(kids.length<2||!kids.every(x=>x.holiday))return null;
  const first=kids[0].holiday;
  return kids.every(x=>holidayKey(x.holiday)===holidayKey(first))?first:null;
}
function holidayKey(h){return h?`${norm(h.title)}|${eventDate(h)}|${String(h.endDate||eventDate(h)).slice(0,10)}`:''}
function holidayNames(kids,holiday){const key=holidayKey(holiday);return kids.filter(x=>holidayKey(x.holiday)===key).map(x=>x.p.name)}
function nextAction(){try{return window.__fcV9?.nextAction?.()||null}catch{return null}}
function nextDisplay(value){
  if(!value)return null;
  const items=Array.isArray(value.items)?value.items:[];
  const allSchoolFinish=items.length>1&&items.every(x=>x?.kind==='school'&&/ fertig$/i.test(String(x.title||'')));
  if(allSchoolFinish){
    const who=items.map(x=>peopleNames(x)[0]||String(x.title||'').replace(/ fertig$/i,'')).filter(Boolean);
    return{...value,title:'Schulschluss',sub:who.join(' · ')};
  }
  return value;
}
function initials(name){return String(name||'?').split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase()}
function badgeFor(id){
  const p=person(id);if(!p)return'';
  return `<span class="fc11-person-chip" style="--p:${esc(color(id))}"><i></i>${esc(p.name)}</span>`;
}
function personFilters(selected,attr='person'){
  return `<div class="fc11-filter-row" role="group" aria-label="Person filtern"><button type="button" data-${attr}="all" aria-pressed="${selected==='all'}" class="${selected==='all'?'active':''}">Alle</button>${rows(D().people).filter(active).map(p=>`<button type="button" data-${attr}="${esc(p.id)}" aria-pressed="${String(selected)===String(p.id)}" class="${String(selected)===String(p.id)?'active':''}" style="--p:${esc(color(p.id))}"><i></i>${esc(p.name)}</button>`).join('')}</div>`;
}
function sourcePersonBadges(x){return pids(x).map(badgeFor).join('')}
function openEvent(id){window.fcOpenEventDetails?.(id)}
function editEvent(id=''){window.__fcV9?.editEvent?.(id)}
function editTodo(id='',date=today()){window.__fcV9?.editTodo?.(id,date)}
function editHomework(id='',date=today()){window.__fcV9?.editHomework?.(id,date)}
function toggleTodo(id,on){window.__fcV9?.toggleTodo?.(id,on);setTimeout(queueRender,80)}
function toggleHomework(id,on){window.__fcV9?.toggleHomework?.(id,on);setTimeout(queueRender,80)}

function shell(){
  if(!APP)return;
  APP.innerHTML=`<div class="fc11-shell">
    <aside class="fc11-sidebar" aria-label="Hauptnavigation">
      <div class="fc11-logo"><span>F</span><div><b>Familienzentrale</b><small>Alles an einem Ort</small></div></div>
      <nav>${navButtons()}</nav>
      <button type="button" class="fc11-side-brain" data-brain>${icon('brain')}<span><b>Familie fragen</b><small>Termine & Dokumente</small></span></button>
    </aside>
    <div class="fc11-workspace">
      <header class="fc11-header">
        <div class="fc11-title"><small data-eyebrow></small><h1 data-title></h1><p data-subtitle></p></div>
        <div class="fc11-header-actions">
          <button type="button" class="fc11-icon-btn" data-search aria-label="Suchen">${icon('search')}</button>
          <button type="button" class="fc11-add-btn" data-add>${icon('plus')}<span>Hinzufügen</span></button>
        </div>
      </header>
      <main class="fc11-main" id="fc11Main" tabindex="-1"></main>
      <nav class="fc11-bottom-nav" aria-label="Hauptnavigation">${navButtons()}</nav>
      <div class="fc11-legacy-host" aria-hidden="true">${['today','tomorrow','events','homework','more','people'].map(id=>`<section id="${id}" class="fc9-screen"></section>`).join('')}</div>
    </div>
  </div>`;
  bindChrome();
}
function navButtons(){
  return [
    ['today','today','Heute'],
    ['plan','plan','Plan'],
    ['tasks','tasks','Aufgaben'],
    ['docs','docs','Dokumente'],
    ['more','more','Mehr'],
  ].map(([id,ico,label])=>`<button type="button" data-fc11-screen="${id}" class="${state.screen===id?'active':''}">${icon(ico)}<span>${label}</span></button>`).join('');
}
function bindChrome(){
  document.querySelectorAll('[data-fc11-screen]').forEach(b=>b.onclick=()=>open(b.dataset.fc11Screen));
  document.querySelectorAll('[data-search]').forEach(b=>b.onclick=e=>window.fcOpenSearch?.(e.currentTarget));
  document.querySelectorAll('[data-brain]').forEach(b=>b.onclick=openBrain);
  document.querySelectorAll('[data-add]').forEach(b=>b.onclick=openAdd);
}
function header(title,eyebrow='',subtitle=''){
  const root=APP;
  if(!root)return;
  root.querySelector('[data-title]').textContent=title;
  root.querySelector('[data-eyebrow]').textContent=eyebrow;
  root.querySelector('[data-subtitle]').textContent=subtitle;
  root.querySelectorAll('[data-fc11-screen]').forEach(b=>{const on=b.dataset.fc11Screen===state.screen;b.classList.toggle('active',on);on?b.setAttribute('aria-current','page'):b.removeAttribute('aria-current')});
}
function open(id){
  if(!['today','plan','tasks','docs','more'].includes(id))id='today';
  state.screen=id;
  render();
  try{document.getElementById('fc11Main')?.scrollTo({top:0,behavior:'instant'})}catch{}
  try{window.scrollTo({top:0,left:0,behavior:'instant'})}catch{}
}
function render(){
  if(!APP)return;
  const main=document.getElementById('fc11Main');if(!main)return;
  if(state.screen==='today')renderToday(main);
  else if(state.screen==='plan')renderPlan(main);
  else if(state.screen==='tasks')renderTasks(main);
  else if(state.screen==='docs')renderDocs(main);
  else renderMore(main);
  bindChrome();
  document.documentElement.dataset.fc11Screen=state.screen;
}

function renderToday(root){
  const date=today(),kids=childTodayRows(date),sharedHoliday=sharedChildHoliday(kids),nextCandidate=nextDisplay(nextAction()),work=workFor(date),events=eventsOn(date).filter(e=>!window.__fcV9?.eventIsPast?.(e)&&!kids.some(k=>k.holiday?.id===e.id)&&!duplicatesScheduledWork(e,date)),todos=todoRows('today'),hw=homeworkRows('today');
  const focus=focusForToday(date,sharedHoliday?.id===nextCandidate?.eventId?null:nextCandidate,todos,hw);
  let mailItems=[];try{mailItems=(window.__fcConnections?.insights?.()||[]).filter(x=>x.actionable)}catch{}
  const conflictState=conflictAudit(),actionState=actionCenter(conflictState,mailItems,todos,hw),actionHtml=actionCenterHtml(actionState);
  const tomorrow=addDays(date,1),tomKids=childTodayRows(tomorrow),tomWork=workFor(tomorrow),tomEvents=eventsOn(tomorrow).filter(e=>!tomKids.some(k=>k.holiday?.id===e.id)&&!duplicatesScheduledWork(e,tomorrow)),tomTodos=todoRows('open').filter(x=>taskDate(x)===tomorrow),tomHw=homeworkRows('open').filter(x=>taskDate(x)===tomorrow),tomCount=tomWork.length+tomEvents.length+tomTodos.length+tomHw.length;
  header('Heute',fmt(date,{weekday:true,long:true}),smartSummary(work,events,todos,hw,actionState.mailCount,actionState.conflictCount));
  const childrenSection=`<section class="fc11-section fc11-children-section">
    <div class="fc11-section-head"><div><small>FAMILIE</small><h2>Kinder heute</h2></div><button type="button" data-go-plan>Wochenplan</button></div>
    <div class="fc11-kids">${kids.map(x=>kidRow(x.p,x.state,x.holiday,false,holidayNames(kids,x.holiday))).join('')||'<div class="fc11-empty">Keine Kinderprofile vorhanden.</div>'}</div>
  </section>`;
  const tomorrowSection=`<section class="fc11-section fc11-tomorrow-section ${tomCount===1?'single':''}">
    <div class="fc11-section-head"><div><small>AUSBLICK</small><h2>Morgen</h2></div><button type="button" data-tomorrow-plan>${fmt(tomorrow)}</button></div>
    <div class="fc11-list">${tomorrowRows(tomWork,tomEvents,tomTodos,tomHw)||'<div class="fc11-empty compact">Morgen ist nichts weiter geplant.</div>'}</div>
  </section>`;
  const todaySection=(work.length+events.length+todos.length+hw.length)?`<section class="fc11-section fc11-open-section fc11-today-section">
    <div class="fc11-section-head"><div><small>TAGESABLAUF</small><h2>Heute in Reihenfolge</h2></div><button type="button" data-go-plan>Plan</button></div>
    <div class="fc11-list">${todayRows(work,events,todos,hw)}</div>
  </section>`:'';
  root.innerHTML=`<div class="fc11-page fc11-home">
    ${sharedHoliday?`<section class="fc11-shared-holiday" aria-label="Ferien für alle Kinder"><div><span>ALLE KINDER</span><h2>${esc(sharedHoliday.title||'Ferien')}</h2><p>Schulfrei${sharedHoliday.endDate?` · bis ${esc(fmt(sharedHoliday.endDate))}`:''}</p></div><div class="fc11-holiday-people" aria-label="${esc(kids.map(x=>x.p.name).join(', '))}">${kids.map(x=>`<span style="--p:${esc(color(x.p.id))}" title="${esc(x.p.name)}">${esc(initials(x.p.name))}</span>`).join('')}</div></section>`:''}
    ${focus?`<section class="fc11-next fc11-focus-${esc(focus.kind||'next')}">
      <div class="fc11-section-kicker">${esc(focus.kicker||'JETZT WICHTIG')}</div>
      <button type="button" class="fc11-next-content" data-focus-action><div><b>${esc(focus.title||'Nächster Punkt')}</b><span>${esc(focus.sub||'')}</span></div><div class="fc11-next-time"><strong>${esc(focus.time||'')}</strong><small>${esc(focus.left||'')}</small></div>${icon('chevron')}</button>
    </section>`:`<section class="fc11-next calm"><div class="fc11-section-kicker">JETZT</div><div class="fc11-next-empty"><b>Aktuell nichts Dringendes</b><span>Der Tagesablauf und morgen wichtige Punkte bleiben darunter sichtbar.</span></div></section>`}
    ${actionHtml}
    ${sharedHoliday?todaySection+tomorrowSection:childrenSection+todaySection+tomorrowSection}
    <button type="button" class="fc11-brain-entry" data-brain>
      <span class="fc11-brain-icon">${icon('brain')}</span>
      <span><b>Frag die Familienzentrale</b><small>„Was habe ich nächste Woche?“ · „Wo ist der Quartalsbrief?“</small></span>
      ${icon('chevron')}
    </button>
  </div>`;
  root.querySelectorAll('[data-go-plan]').forEach(b=>b.onclick=()=>open('plan'));
  root.querySelectorAll('[data-kid]').forEach(b=>b.onclick=()=>{state.planPerson=b.dataset.kid;state.planDate=date;open('plan')});
  root.querySelector('[data-tomorrow-plan]')?.addEventListener('click',()=>{state.planDate=tomorrow;open('plan')});
  root.querySelector('[data-focus-action]')?.addEventListener('click',()=>{if(focus?.eventId)openEvent(focus.eventId);else if(focus?.kind==='task'||focus?.kind==='homework')open('tasks');else open('plan')});
  root.querySelector('[data-open-bluewin]')?.addEventListener('click',()=>window.fcOpenConnections?.());
  root.querySelector('[data-open-conflicts]')?.addEventListener('click',()=>openConflictAssistant());
  root.querySelectorAll('[data-action-center]').forEach(b=>b.onclick=()=>{const kind=b.dataset.actionCenter;if(kind==='conflicts')return openConflictAssistant();if(kind==='mail')return window.fcOpenConnections?.();if(kind==='tasks')return open('tasks')});
  root.querySelectorAll('[data-care-date]').forEach(b=>b.onclick=()=>{state.planDate=b.dataset.careDate;state.planPerson='oli';open('plan')});
  bindRows(root);
}
function focusForToday(date,next,todos,hw){
  const overdueTodos=todoRows('open').filter(x=>!x.done&&taskDate(x)&&taskDate(x)<date).sort((a,b)=>Number(!!b.priority)-Number(!!a.priority)||String(taskDate(a)).localeCompare(String(taskDate(b))));
  const overdueHw=homeworkRows('open').filter(x=>!x.done&&taskDate(x)&&taskDate(x)<date).sort((a,b)=>String(taskDate(a)).localeCompare(String(taskDate(b))));
  const overdue=overdueTodos[0];if(overdue)return{kind:'task',kicker:'ÜBERFÄLLIG',title:overdue.title||'Aufgabe erledigen',sub:overdue.priority?'Wichtig · war bereits fällig':'War bereits fällig',time:'OFFEN',left:'heute klären'};
  const oldHw=overdueHw[0];if(oldHw)return{kind:'homework',kicker:'ÜBERFÄLLIG',title:[oldHw.subject,oldHw.title].filter(Boolean).join(' · ')||'Schulaufgabe',sub:personName(oldHw.personId)||'Schule',time:'OFFEN',left:'nachholen'};
  const priority=todos.find(x=>x.priority&&!x.done);if(priority)return{kind:'task',kicker:'WICHTIG',title:priority.title||'Aufgabe',sub:'Heute als wichtig markiert',time:'HEUTE',left:'offen'};
  if(next)return{...next,kind:next.eventId?'event':'next',kicker:'ALS NÄCHSTES'};
  return null;
}

function actionCenter(conflictState,mail,todos,hw){
  const date=today(),items=[],conflicts=rows(conflictState?.conflicts).filter(x=>!x.date||x.date<=addDays(date,14));
  const mailItems=rows(mail).filter(x=>x.actionable);
  const overdueTodos=rows(todos).filter(x=>!x.done&&taskDate(x)&&taskDate(x)<date);
  const overdueHw=rows(hw).filter(x=>!x.done&&taskDate(x)&&taskDate(x)<date);
  if(conflicts.length){
    const high=conflicts.filter(x=>x.severity==='high').length;
    items.push({kind:'conflicts',count:conflicts.length,urgent:high>0,title:conflicts.length+' Konflikt'+(conflicts.length===1?'':'e')+' prüfen',sub:high?high+' davon wichtig':'Plan kurz prüfen'});
  }
  if(mailItems.length){
    const bills=mailItems.filter(x=>x.type==='bill').length,plans=mailItems.filter(x=>x.type==='workplan').length;
    items.push({kind:'mail',count:mailItems.length,urgent:mailItems.some(x=>x.type==='bill'&&typeof x.invoice?.days==='number'&&x.invoice.days<=3),title:mailItems.length+' relevante Mail'+(mailItems.length===1?'':'s'),sub:plans?plans+' Arbeitsplan'+(plans===1?'':'e')+(bills?' · '+bills+' Rechnung'+(bills===1?'':'en'):''):bills?bills+' Rechnung'+(bills===1?'':'en'):'Bluewin prüfen'});
  }
  const overdue=overdueTodos.length+overdueHw.length;
  if(overdue)items.push({kind:'tasks',count:overdue,urgent:true,title:overdue+' überfällige Aufgabe'+(overdue===1?'':'n'),sub:overdueHw.length?overdueHw.length+' davon Schule':'Heute erledigen'});
  return{items,total:items.reduce((n,x)=>n+x.count,0),conflictCount:conflicts.length,mailCount:mailItems.length,overdueCount:overdue};
}
function actionCenterHtml(center){
  if(!center?.items?.length)return'';
  return '<section class="fc11-action-center"><div class="fc11-action-center-head"><div><small>AKTIONSZENTRALE</small><b>Hier musst du wirklich etwas tun</b></div><span>'+center.total+'</span></div><div>'+
    center.items.map(x=>'<button type="button" class="'+(x.urgent?'urgent':'')+'" data-action-center="'+esc(x.kind)+'"><i></i><span><b>'+esc(x.title)+'</b><small>'+esc(x.sub)+'</small></span>'+icon('chevron')+'</button>').join('')+
    '</div></section>';
}

function bluewinPulse(){
  let list=[];try{list=(window.__fcConnections?.insights?.()||[]).filter(x=>x.actionable).slice(0,3)}catch{}
  if(!list.length)return{count:0,html:''};
  const kind=x=>x.type==='workplan'?'Arbeitsplan':x.type==='bill'?'Rechnung':x.type==='event'?'Termin':'Aufgabe';
  const extra=x=>x.type==='bill'&&x.invoice?.dueDate?` · fällig ${x.invoice.dueDate.split('-').reverse().join('.')}`:'';
  const labels=list.map(x=>`<span><b>${esc(kind(x))}</b> ${esc(String(x.title||'').slice(0,68))}${esc(extra(x))}</span>`).join('');
  return{count:list.length,html:`<button type="button" class="fc11-mail-pulse" data-open-bluewin><span class="fc11-mail-pulse-icon">✉️</span><span class="fc11-mail-pulse-copy"><small>BLUEWIN · ${list.length} RELEVANT</small><b>Neue Mail${list.length===1?'':'s'} brauchen deine Aufmerksamkeit</b><span>${labels}</span></span>${icon('chevron')}</button>`};
}

function conflictMinutes(v){
  const m=String(v||'').match(/^(\d{1,2}):(\d{2})$/);if(!m)return null;
  const n=Number(m[1])*60+Number(m[2]);return n>=0&&n<1440?n:null;
}
function conflictIntervalsForEvent(e){
  const start=conflictMinutes(e&&e.time);if(start===null)return[];
  let end=conflictMinutes(e&&e.end);if(end===null||end<=start)end=Math.min(1440,start+60);
  const note=String(e&&e.note||''),pm=note.match(/Pause\s+(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/i);
  if(pm){
    const ps=conflictMinutes(pm[1]),pe=conflictMinutes(pm[2]);
    if(ps!==null&&pe!==null&&ps>start&&pe<end&&pe>ps)return[[start,ps],[pe,end]];
  }
  return[[start,end]];
}
function conflictOverlap(a,b){return Math.max(a[0],b[0])<Math.min(a[1],b[1])}
function conflictTimeLabel(v){return String(Math.floor(v/60)).padStart(2,'0')+':'+String(v%60).padStart(2,'0')}
function conflictTokens(v){
  const stop=new Set(['termin','einladung','bestaetigung','bestätigung','information','infos','hallo','freundliche','gruesse','grüsse','herzogenbuchsee','deine','ihre','einen','einer','einem','eines','wegen','bitte','neue','neuer','neuen','mail','email']);
  return [...new Set(String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9äöüß]+/g,' ').split(/\s+/).filter(x=>x.length>=5&&!stop.has(x)))];
}
function conflictTopicScore(a,b){
  const aa=conflictTokens(a),bb=conflictTokens(b);if(!aa.length||!bb.length)return 0;
  return aa.filter(x=>bb.includes(x)).reduce((n,x)=>n+(x.length>=8?2:1),0);
}
function isCareCoverageEvent(e){
  if(e?.eventRole==='care-coverage'||e?.requiresPresence===false)return true;
  const title=String(e?.title||''),note=String(e?.note||'');
  return /\bsrk\b/i.test(title)&&/betreuung|kinder|aufsicht/i.test(title+' '+note);
}

function conflictFingerprint(x){
  return [x?.kind||'',x?.date||'',x?.time||'',...(rows(x?.eventIds).map(String).sort()),x?.mailUid||'',x?.title||'',x?.detail||''].join('|');
}
function conflictPrefs(){
  const root=D().assistantPreferences&&typeof D().assistantPreferences==='object'?D().assistantPreferences:{};
  const conflicts=root.conflicts&&typeof root.conflicts==='object'?root.conflicts:{};
  const ignored=conflicts.ignored&&typeof conflicts.ignored==='object'?conflicts.ignored:{};
  return{root,conflicts,ignored};
}
function conflictIsIgnored(x){
  const key=conflictFingerprint(x),entry=conflictPrefs().ignored[key];
  return !!entry;
}
function saveConflictPreference(x,ignored){
  const data=D();if(!data||typeof data!=='object')return;
  const pref=data.assistantPreferences&&typeof data.assistantPreferences==='object'?data.assistantPreferences:{};
  const conflicts=pref.conflicts&&typeof pref.conflicts==='object'?pref.conflicts:{};
  const map=conflicts.ignored&&typeof conflicts.ignored==='object'?{...conflicts.ignored}:{};
  const key=conflictFingerprint(x);
  if(ignored)map[key]={ignoredAt:new Date().toISOString(),title:String(x?.title||''),date:String(x?.date||''),kind:String(x?.kind||'')};
  else delete map[key];
  const cutoff=Date.now()-180*86400000;
  for(const [k,v] of Object.entries(map)){
    const t=Date.parse(v?.ignoredAt||'');if(Number.isFinite(t)&&t<cutoff)delete map[k];
  }
  data.assistantPreferences={...pref,conflicts:{...conflicts,ignored:map}};
  try{window.save?.()}catch(e){console.warn('fc11_conflict_pref_save',e)}
  setTimeout(queueRender,80);
}

function conflictAudit(){
  const start=today(),limit=addDays(start,90),events=rows(D().events).filter(active).filter(e=>{
    const d=String(e&&e.date||''),end=String(e&&e.endDate||d);return !!d&&d<=limit&&end>=start;
  }),conflicts=[],seen=new Set();
  const add=x=>{
    const key=[x.kind,x.date||'',x.title||'',...(x.eventIds||[]),x.mailUid||''].join('|');
    if(seen.has(key))return;seen.add(key);conflicts.push(Object.assign({severity:'medium'},x));
  };
  const care=saturdayCareAudit();
  care.warnings.filter(x=>x.date>=start&&x.date<=limit).forEach(x=>add({
    kind:'care',severity:'high',date:x.date,time:'',title:x.title,detail:x.detail,personIds:['oli']
  }));
  const workRx=/arbeit|landi|dienst|schicht/i;
  for(let d=start;d<=limit;d=addDays(d,1)){
    const dayEvents=events.filter(e=>String(e.date||'')===d);
    const explicit=dayEvents.filter(e=>workRx.test(String(e.title||''))&&pids(e).includes('oli')&&conflictIntervalsForEvent(e).length);
    const workBlocks=[];
    if(explicit.length){
      explicit.forEach(e=>conflictIntervalsForEvent(e).forEach(iv=>workBlocks.push({iv,label:e.title||'Arbeit',eventId:e.id})));
    }else{
      schedule('oli',dateObj(d).getDay()).filter(s=>workRx.test(String(s.label||''))).forEach(s=>{
        const a=conflictMinutes(s.start),b=conflictMinutes(s.end);
        if(a!==null&&b!==null&&b>a)workBlocks.push({iv:[a,b],label:s.label||'Arbeit',eventId:''});
      });
    }
    if(workBlocks.length){
      const other=dayEvents.filter(e=>!workRx.test(String(e.title||''))&&!isCareCoverageEvent(e)&&pids(e).includes('oli')&&conflictIntervalsForEvent(e).length);
      for(const e of other){
        for(const ei of conflictIntervalsForEvent(e)){
          const hit=workBlocks.find(w=>conflictOverlap(ei,w.iv));if(!hit)continue;
          add({
            kind:'work',severity:'high',date:d,time:e.time||'',title:'Arbeit überschneidet sich mit Termin',
            detail:String(hit.label)+' '+conflictTimeLabel(hit.iv[0])+'–'+conflictTimeLabel(hit.iv[1])+' · '+String(e.title||'Termin')+' '+String(e.time||'')+(e.end?'–'+e.end:''),
            eventIds:[hit.eventId,e.id].filter(Boolean),personIds:['oli']
          });
        }
      }
    }
    const timed=dayEvents.filter(e=>!workRx.test(String(e.title||''))&&!isCareCoverageEvent(e)&&conflictIntervalsForEvent(e).length);
    for(let i=0;i<timed.length;i++)for(let j=i+1;j<timed.length;j++){
      const a=timed[i],b=timed[j],shared=pids(a).filter(pid=>pids(b).includes(pid));
      if(!shared.length)continue;
      if(!conflictIntervalsForEvent(a).some(ai=>conflictIntervalsForEvent(b).some(bi=>conflictOverlap(ai,bi))))continue;
      const duplicate=String(a.title||'').trim().toLowerCase()===String(b.title||'').trim().toLowerCase()&&String(a.time||'')===String(b.time||'');
      add({
        kind:duplicate?'duplicate':'event',severity:duplicate?'medium':'high',date:d,time:a.time||b.time||'',
        title:duplicate?'Möglicher doppelter Termin':'Zwei Termine überschneiden sich',
        detail:String(a.title||'Termin')+' '+String(a.time||'')+(a.end?'–'+a.end:'')+' · '+String(b.title||'Termin')+' '+String(b.time||'')+(b.end?'–'+b.end:''),
        eventIds:[a.id,b.id].filter(Boolean),personIds:shared
      });
    }
  }
  const schoolRx=/schule|unterricht|kindergarten|tagesschule|bibliothek|schulzahnarzt|zahnarzt|sport|schwimmen|elternabend|klasse/i;
  const holidayRx=/ferien|schulfrei/i;
  for(const p of dependents()){
    const pid=String(p.id),holidays=events.filter(e=>pids(e).includes(pid)&&holidayRx.test(String(e.title||'')));
    const schoolEvents=events.filter(e=>pids(e).includes(pid)&&!holidayRx.test(String(e.title||''))&&schoolRx.test(String(e.title||'')+' '+String(e.note||'')));
    for(const e of schoolEvents){
      const h=holidays.find(x=>String(e.date||'')>=String(x.date||'')&&String(e.date||'')<=String(x.endDate||x.date||''));
      if(!h)continue;
      add({kind:'holiday',severity:'medium',date:e.date,time:e.time||'',title:'Schultermin liegt in Ferien',detail:String(p.name)+': '+String(e.title||'Schultermin')+' · '+String(h.title||'Ferien'),eventIds:[e.id,h.id].filter(Boolean),personIds:[pid]});
    }
  }
  let mail=[];try{mail=window.__fcConnections&&window.__fcConnections.allInsights?window.__fcConnections.allInsights():[]}catch{}
  const candidates=events.filter(e=>pids(e).includes('oli')&&!workRx.test(String(e.title||''))&&!isCareCoverageEvent(e));
  for(const m of mail.filter(x=>(x.triage_status||'pending')==='pending'&&x.type==='event'&&x.date&&!x.alreadyHandled)){
    let best=null,bestScore=0;
    for(const e of candidates){
      if(String(e.date||'')===String(m.date||''))continue;
      const score=conflictTopicScore(m.title||'',e.title||'');
      if(score>bestScore){best=e;bestScore=score}
    }
    if(!best||bestScore<2)continue;
    add({kind:'mail',severity:'medium',date:m.date,time:m.time||'',title:'Mail könnte bestehenden Termin verschieben',detail:String(best.title||'Termin')+': '+fmt(best.date)+(best.time?' · '+best.time:'')+' → Mail nennt '+fmt(m.date)+(m.time?' · '+m.time:''),eventIds:[best.id].filter(Boolean),mailUid:m.message_uid||'',personIds:['oli']});
  }
  const order={high:0,medium:1,low:2};
  conflicts.sort((a,b)=>(order[a.severity]??9)-(order[b.severity]??9)||String(a.date||'').localeCompare(String(b.date||''))||String(a.time||'').localeCompare(String(b.time||'')));
  const ignored=conflicts.filter(conflictIsIgnored),visible=conflicts.filter(x=>!conflictIsIgnored(x));
  return{conflicts:visible,ignored,all:conflicts,high:visible.filter(x=>x.severity==='high').length,medium:visible.filter(x=>x.severity==='medium').length,horizon:{start,limit}};
}
function conflictPulseHtml(audit){
  const near=rows(audit&&audit.conflicts).filter(x=>x.kind==='mail'||!x.date||x.date<=addDays(today(),14));
  if(!near.length)return'';
  const top=near.slice(0,3),nearHigh=near.some(x=>x.severity==='high');
  return '<button type="button" class="fc11-conflict-pulse '+(nearHigh?'urgent':'')+'" data-open-conflicts>'+
    '<span class="fc11-conflict-icon">⚠️</span>'+
    '<span class="fc11-conflict-copy"><small>KONFLIKT-ASSISTENT · '+near.length+' PRÜFEN</small><b>'+(nearHigh?'Terminüberschneidung erkannt':'Mögliche Konflikte erkannt')+'</b>'+
    '<span>'+top.map(x=>'<em><strong>'+(x.date?esc(fmt(x.date,{weekday:true})):'Mail')+'</strong> '+esc(x.title)+'</em>').join('')+'</span></span>'+icon('chevron')+'</button>';
}
function openConflictAssistant(){
  document.getElementById('fc11ConflictSheet')?.remove();
  const audit=conflictAudit(),m=document.createElement('div');m.id='fc11ConflictSheet';m.className='fc11-modal';
  const item=(x,i,ignored=false)=>'<article class="fc11-conflict-item '+esc(x.severity)+(ignored?' ignored':'')+'" data-conflict-card="'+i+'">'+
    '<span class="fc11-conflict-dot"></span><button type="button" class="fc11-conflict-main" data-conflict-open="'+i+'" data-conflict-source="'+(ignored?'ignored':'active')+'"><small>'+esc([x.date?fmt(x.date,{weekday:true}):'',x.time||'',ignored?'SO GEWOLLT':x.severity==='high'?'WICHTIG':'PRÜFEN'].filter(Boolean).join(' · '))+'</small><b>'+esc(x.title)+'</b><em>'+esc(x.detail||'')+'</em></button>'+
    '<div class="fc11-conflict-actions">'+(ignored?
      '<button type="button" data-conflict-restore="'+i+'">Wieder anzeigen</button>':
      '<button type="button" data-conflict-ignore="'+i+'">So gewollt</button>')+'</div></article>';
  const rowsHtml=audit.conflicts.length?audit.conflicts.map((x,i)=>item(x,i,false)).join(''):
    '<div class="fc11-conflict-clear"><span>✓</span><div><b>Keine offenen Konflikte</b><small>Die nächsten 90 Tage wurden geprüft.</small></div></div>';
  const ignoredHtml=audit.ignored.length?'<details class="fc11-conflict-ignored"><summary>Als „so gewollt“ ausgeblendet · '+audit.ignored.length+'</summary><div>'+audit.ignored.map((x,i)=>item(x,i,true)).join('')+'</div></details>':'';
  m.innerHTML='<section class="fc11-sheet fc11-conflict-sheet" role="dialog" aria-modal="true" aria-labelledby="fc11ConflictTitle">'+
    '<div class="fc11-sheet-head"><div><small>PLAN-PRÜFUNG</small><h2 id="fc11ConflictTitle">Konflikt-Assistent</h2><p>'+(audit.conflicts.length?(audit.high+' wichtig · '+audit.medium+' prüfen'):'Alles konsistent')+'</p></div><button type="button" data-close aria-label="Schliessen">×</button></div>'+
    '<div class="fc11-conflict-summary"><span><b>'+audit.conflicts.length+'</b><small>offen</small></span><span><b>'+audit.high+'</b><small>wichtig</small></span><span><b>'+audit.ignored.length+'</b><small>so gewollt</small></span></div>'+
    '<div class="fc11-conflict-list">'+rowsHtml+ignoredHtml+'</div>'+
    '<div class="fc11-conflict-foot"><span>„So gewollt“ blendet nur exakt diesen unveränderten Fall aus. Ändern sich Zeit oder Termin, erscheint er wieder.</span><button type="button" data-conflict-refresh>Neu prüfen</button></div></section>';
  const close=()=>m.remove();m.querySelector('[data-close]').onclick=close;m.onclick=e=>{if(e.target===m)close()};
  m.querySelector('[data-conflict-refresh]')?.addEventListener('click',()=>{close();openConflictAssistant()});
  const navigate=x=>{
    close();
    if(x.mailUid){window.fcOpenConnections?.();return}
    if(x.date){state.planDate=x.date;state.planPerson=(x.personIds&&x.personIds[0])||'all';open('plan');return}
    open('plan');
  };
  m.querySelectorAll('[data-conflict-open]').forEach(b=>b.onclick=()=>{
    const source=b.dataset.conflictSource==='ignored'?audit.ignored:audit.conflicts;
    const x=source[Number(b.dataset.conflictOpen)];if(x)navigate(x);
  });
  m.querySelectorAll('[data-conflict-ignore]').forEach(b=>b.onclick=e=>{
    e.stopPropagation();const x=audit.conflicts[Number(b.dataset.conflictIgnore)];if(!x)return;
    saveConflictPreference(x,true);close();setTimeout(openConflictAssistant,120);
  });
  m.querySelectorAll('[data-conflict-restore]').forEach(b=>b.onclick=e=>{
    e.stopPropagation();const x=audit.ignored[Number(b.dataset.conflictRestore)];if(!x)return;
    saveConflictPreference(x,false);close();setTimeout(openConflictAssistant,120);
  });
  document.body.appendChild(m);
}

function saturdayCareAudit(){
  const start=today(),limit=addDays(start,70),events=rows(D().events).filter(active);
  const work=events.filter(e=>String(e.date||'')>=start&&String(e.date||'')<=limit&&dateObj(e.date).getDay()===6&&/arbeit\s*landi|landi.*arbeit/i.test(String(e.title||''))&&pids(e).includes('oli'));
  const warnings=[],checked=[];
  for(const w of work){
    const time=String(w.time||'').slice(0,5),expected=time==='07:30'?'06:50':time==='07:55'?'07:20':'';
    const srks=events.filter(e=>String(e.date||'')===String(w.date||'')&&/\bsrk\b/i.test(String(e.title||''))&&pids(e).includes('oli'));
    if(!expected){warnings.push({date:w.date,title:'Samstagsschicht prüfen',detail:`Arbeitsbeginn ${time||'ohne Zeit'} · SRK-Zeit nicht automatisch ableitbar`});continue}
    const matching=srks.find(e=>String(e.time||'').slice(0,5)===expected);
    if(!srks.length)warnings.push({date:w.date,title:'SRK Betreuung fehlt',detail:`Arbeit ${time} · erwartet SRK ${expected}`});
    else if(!matching)warnings.push({date:w.date,title:'SRK-Zeit stimmt nicht',detail:`Arbeit ${time} · erwartet ${expected} · eingetragen ${srks.map(x=>String(x.time||'ohne Zeit').slice(0,5)).join(', ')}`});
    else checked.push({date:w.date,work:time,srk:expected});
  }
  return{warnings,checked,total:work.length};
}
function saturdayCareWarningHtml(audit){
  if(!audit?.warnings?.length)return'';
  return `<section class="fc11-care-warning"><div class="fc11-care-warning-head"><span>⚠️</span><div><small>BETREUUNGSCHECK</small><b>${audit.warnings.length} Punkt${audit.warnings.length===1?'':'e'} prüfen</b></div></div><div>${audit.warnings.slice(0,3).map(x=>`<button type="button" data-care-date="${esc(x.date)}"><b>${esc(fmt(x.date,{weekday:true}))} · ${esc(x.title)}</b><span>${esc(x.detail)}</span></button>`).join('')}</div></section>`;
}
function smartSummary(work,events,todos,hw,mailCount=0,conflictCount=0){
  const parts=[];if(conflictCount)parts.push(`${conflictCount} Konflikt${conflictCount===1?'':'e'} prüfen`);if(events.length)parts.push(`${events.length} Termin${events.length===1?'':'e'}`);if(todos.length+hw.length)parts.push(`${todos.length+hw.length} Aufgabe${todos.length+hw.length===1?'':'n'}`);if(mailCount)parts.push(`${mailCount} relevante Mail${mailCount===1?'':'s'}`);if(work.length)parts.push('Arbeit geplant');return parts.length?parts.join(' · '):'Keine offenen Punkte für heute';
}
function summaryText(work,events,todos,hw){
  const n=work.length+events.length+todos.length+hw.length;
  if(!n)return'Keine offenen Punkte für heute';
  const parts=[];
  if(work.length)parts.push(`${work.length} Arbeit${work.length===1?'':'en'}`);
  if(events.length)parts.push(`${events.length} Termin${events.length===1?'':'e'}`);
  if(todos.length+hw.length)parts.push(`${todos.length+hw.length} Aufgabe${todos.length+hw.length===1?'':'n'}`);
  return parts.join(' · ');
}
function kidRow(p,s,holiday=null,shared=false,names=[]){
  const clr=color(p.id),status=holiday?(shared?'Schulfrei':holiday.title||'Ferien'):(s?.label||'Heute frei');
  const rawSub=s?.sub&& !/Aktuell läuft alles|Von zuhause los|Als Nächstes|Schule \/ Kindergarten/.test(s.sub)?s.sub:'';
  const sub=holiday?(shared?'':`${names.length===1?'Nur '+p.name:names.join(' & ')} · schulfrei`):rawSub;
  return `<button type="button" class="fc11-kid" data-kid="${esc(p.id)}" data-holiday="${holiday?'1':'0'}" style="--p:${esc(clr)}">
    <span class="fc11-avatar">${esc(initials(p.name))}</span>
    <span class="fc11-kid-copy"><b>${esc(p.name)}</b><span>${esc(status)}</span>${sub?`<small>${esc(sub)}</small>`:''}</span>
    <span class="fc11-kid-time">${esc(s?.time||'')}${s?.kind==='future'?`<small>${s.action==='depart'?'los':'Start'}</small>`:s?.kind==='active'?'<small>Ende</small>':''}</span>
    ${icon('chevron')}
  </button>`;
}
function todayRows(work,events,todos,hw){
  const items=[],date=today();
  work.forEach(w=>items.push({sort:`1|${timeVal(w.depart||w.slots?.[0]?.start)}|0`,html:workRow(w)}));
  events.forEach(e=>items.push({sort:e.time?`1|${timeVal(e.time)}|1`:`2|0000|0`,html:eventRow(e)}));
  todos.forEach(t=>{const over=!t.done&&taskDate(t)&&taskDate(t)<date;items.push({sort:over?`0|0000|${t.priority?'0':'1'}`:`3|0000|${t.priority?'0':'1'}`,html:todoRow(t)})});
  hw.forEach(h=>{const over=!h.done&&taskDate(h)&&taskDate(h)<date;items.push({sort:over?'0|0001|0':'4|0000|0',html:homeworkRow(h)})});
  return items.sort((a,b)=>a.sort.localeCompare(b.sort)).map(x=>x.html).join('');
}
function workFor(date){
  const childIds=new Set(dependents().map(p=>String(p.id)));
  return rows(D().people).filter(active).filter(p=>!childIds.has(String(p.id))).flatMap(p=>{
    const slots=schedule(p.id,dateObj(date).getDay()).filter(x=>x.start&&x.end&&/arbeit|dienst|schicht|landi/i.test(String(x.label||''))).sort((a,b)=>timeVal(a.start).localeCompare(timeVal(b.start)));
    const groups=new Map();
    for(const slot of slots){
      const label=String(slot.label||'Arbeit').trim();
      if(!groups.has(label))groups.set(label,[]);
      groups.get(label).push(slot);
    }
    return [...groups].map(([label,items])=>({personId:p.id,label,slots:items,depart:items.find(x=>x.depart)?.depart||''}));
  }).sort((a,b)=>timeVal(a.depart||a.slots[0].start).localeCompare(timeVal(b.depart||b.slots[0].start)));
}
function workRow(work){
  const first=work.slots[0],last=work.slots[work.slots.length-1];
  const span=`${first.start}–${last.end}`;
  const pause=work.slots.length>1?` · Pause ${work.slots.slice(0,-1).map((slot,i)=>`${slot.end}–${work.slots[i+1].start}`).join(', ')}`:'';
  return `<div class="fc11-row work" style="--p:${esc(color(work.personId))}">
    <span class="fc11-row-time"><b>${esc(work.depart||first.start)}</b><small>${work.depart?'los':'Beginn'}</small></span>
    <span class="fc11-row-copy">${badgeFor(work.personId)}<b>${esc(work.label)}</b><small>${esc(span+pause)}</small></span>
  </div>`;
}
function tomorrowRows(work,events,todos,hw){
  const list=[
    ...work.map(workRow),
    ...events.slice(0,3).map(eventRow),
    ...todos.slice(0,3).map(todoRow),
    ...hw.slice(0,2).map(homeworkRow)
  ];
  return list.slice(0,6).join('');
}
function eventRow(e){
  const prep=typeof window.eventPackText==='function'?String(window.eventPackText(e)||'').trim():'';
  const cloudSource=String(e?.source||'')==='icloud'&&e?.externalCalendarName?`<span class="fc11-source-chip">iCloud · ${esc(e.externalCalendarName)}</span>`:'';
  return `<button type="button" class="fc11-row event" data-event="${esc(e.id)}" style="--p:${esc(color(pids(e)[0]))}">
    <span class="fc11-row-time"><b>${esc(e.time||'Ganztägig')}</b>${e.end?`<small>bis ${esc(e.end)}</small>`:''}</span>
    <span class="fc11-row-copy">${cloudSource}${sourcePersonBadges(e)}<b>${esc(e.title||'Termin')}</b>${e.note?`<small>${esc(String(e.note).slice(0,120))}</small>`:''}${prep?`<em>Mitnehmen: ${esc(prep)}</em>`:''}</span>
    ${icon('chevron')}
  </button>`;
}
function todoRow(t){
  const key=uid(t),over=taskDate(t)&&taskDate(t)<today()&&!t.done;
  return `<div class="fc11-row task ${t.done?'done':''} ${over?'overdue':''}" data-todo="${esc(key)}">
    <label class="fc11-check"><input type="checkbox" ${t.done?'checked':''} aria-label="${esc(t.title||'Aufgabe')} erledigen"><span>${icon('check')}</span></label>
    <button type="button" class="fc11-row-copy" data-edit-todo="${esc(key)}">${sourcePersonBadges(t)}<b>${esc(t.title||'Aufgabe')}</b><small>${over?'Überfällig · ':''}${taskDate(t)?esc(fmt(taskDate(t),{weekday:true})):'Ohne Frist'}${t.priority?' · Wichtig':''}</small></button>
  </div>`;
}
function homeworkRow(h){
  const over=taskDate(h)&&taskDate(h)<today()&&!h.done;
  return `<div class="fc11-row task school ${h.done?'done':''} ${over?'overdue':''}" data-homework="${esc(h.id)}">
    <label class="fc11-check"><input type="checkbox" ${h.done?'checked':''} aria-label="${esc(h.title||'Schulaufgabe')} erledigen"><span>${icon('check')}</span></label>
    <button type="button" class="fc11-row-copy" data-edit-homework="${esc(h.id)}">${sourcePersonBadges(h)}<b>${esc([h.subject,h.title].filter(Boolean).join(' · ')||'Schulaufgabe')}</b><small>${over?'Überfällig · ':''}${taskDate(h)?esc(fmt(taskDate(h),{weekday:true})):'Ohne Frist'}</small></button>
  </div>`;
}
function bindRows(root){
  root.querySelectorAll('[data-event]').forEach(b=>b.onclick=()=>openEvent(b.dataset.event));
  root.querySelectorAll('[data-todo]').forEach(row=>{const input=row.querySelector('input');if(input)input.onclick=e=>{e.stopPropagation();toggleTodo(row.dataset.todo,input.checked)}});
  root.querySelectorAll('[data-edit-todo]').forEach(b=>b.onclick=()=>editTodo(b.dataset.editTodo));
  root.querySelectorAll('[data-homework]').forEach(row=>{const input=row.querySelector('input');if(input)input.onclick=e=>{e.stopPropagation();toggleHomework(row.dataset.homework,input.checked)}});
  root.querySelectorAll('[data-edit-homework]').forEach(b=>b.onclick=()=>editHomework(b.dataset.editHomework));
}

function renderPlan(root){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(state.planDate))state.planDate=today();
  const dates=weekDates(state.planDate),ev=eventsOn(state.planDate).filter(e=>matchesPerson(e,state.planPerson)&&!duplicatesScheduledWork(e,state.planDate)),allPeople=rows(D().people).filter(active),kids=childTodayRows(state.planDate),sharedHoliday=sharedChildHoliday(kids),childIds=new Set(kids.map(x=>String(x.p.id))),people=allPeople.filter(p=>state.planPerson==='all'||String(p.id)===String(state.planPerson)),shown=state.planPerson==='all'&&sharedHoliday?people.filter(p=>!childIds.has(String(p.id))):people;
  header('Plan',fmt(state.planDate,{weekday:true,long:true}),weekRangeLabel(dates));
  root.innerHTML=`<div class="fc11-page">
    <div class="fc11-plan-tools">
      <div class="fc11-week-nav"><button type="button" data-week-shift="-7" aria-label="Vorherige Woche">‹</button><b>${esc(weekRangeLabel(dates))}</b><button type="button" data-week-shift="7" aria-label="Nächste Woche">›</button></div>
      <button type="button" class="fc11-new-inline" data-new-event>${icon('plus')} Termin</button>
    </div>
    <div class="fc11-week-strip">${dates.map(d=>`<button type="button" data-plan-date="${d}" class="${d===state.planDate?'active':''} ${d===today()?'today':''}"><small>${esc(shortDay(d))}</small><b>${dateObj(d).getDate()}</b><i></i></button>`).join('')}</div>
    ${personFilters(state.planPerson,'plan-person')}
    <div class="fc11-plan-grid">
      <section class="fc11-section">
        <div class="fc11-section-head"><div><small>TAGESABLAUF</small><h2>${esc(fmt(state.planDate,{weekday:true,long:true}))}</h2></div></div>
        <div class="fc11-kids plan">${state.planPerson==='all'&&sharedHoliday?planSharedHoliday(kids,sharedHoliday):''}${shown.map(p=>planKid(p,state.planDate)).join('')||(!sharedHoliday?'<div class="fc11-empty compact">Keine Zeiten für diese Auswahl.</div>':'')}</div>
      </section>
      <section class="fc11-section">
        <div class="fc11-section-head"><div><small>TERMINE</small><h2>${ev.length?ev.length+' geplant':'Keine Termine'}</h2></div></div>
        <div class="fc11-list">${ev.length?ev.sort((a,b)=>timeVal(a.time).localeCompare(timeVal(b.time))).map(eventRow).join(''):'<div class="fc11-empty compact">An diesem Tag ist kein zusätzlicher Termin eingetragen.</div>'}</div>
      </section>
    </div>
  </div>`;
  root.querySelectorAll('[data-plan-date]').forEach(b=>b.onclick=()=>{state.planDate=b.dataset.planDate;render()});
  root.querySelectorAll('[data-plan-person]').forEach(b=>b.onclick=()=>{state.planPerson=b.dataset.planPerson;render()});
  root.querySelectorAll('[data-week-shift]').forEach(b=>b.onclick=()=>{state.planDate=addDays(state.planDate,Number(b.dataset.weekShift));render()});
  root.querySelector('[data-new-event]')?.addEventListener('click',()=>editEvent());
  bindRows(root);
}
function planSharedHoliday(kids,holiday){return `<div class="fc11-plan-shared"><div><small>ALLE KINDER</small><b>${esc(holiday.title||'Schulfrei')}</b></div><span>${esc(kids.map(x=>x.p.name).join(' · '))}</span></div>`}
function weekRangeLabel(dates){
  const a=dateObj(dates[0]),b=dateObj(dates[6]);
  const same=a.getMonth()===b.getMonth();
  const left=same?String(a.getDate()):new Intl.DateTimeFormat('de-CH',{day:'numeric',month:'short'}).format(a);
  const right=new Intl.DateTimeFormat('de-CH',{day:'numeric',month:'short',year:a.getFullYear()!==b.getFullYear()?'numeric':undefined}).format(b);
  return `${left} – ${right}`;
}
function planKid(p,date){
  const slots=schedule(p.id,dateObj(date).getDay()).sort((a,b)=>timeVal(a.start).localeCompare(timeVal(b.start)));
  const h=typeof window.schoolBreakFor==='function'?window.schoolBreakFor(p.id,date):null;
  return `<div class="fc11-plan-person" style="--p:${esc(color(p.id))}">
    <div class="fc11-plan-person-head"><span class="fc11-avatar">${esc(initials(p.name))}</span><div><b>${esc(p.name)}</b><small>${esc(h?.title||p.school||p.role||'')}</small></div></div>
    <div class="fc11-slot-list">${h?`<span class="free">${esc(h.title||'Schulfrei')}</span>`:slots.length?slots.map(s=>`<span><b>${esc(s.start||'')}${s.end?'–'+esc(s.end):''}</b>${s.depart?`<small>${esc(s.depart)} los</small>`:''}${s.label?`<em>${esc(s.label)}</em>`:''}</span>`).join(''):'<span class="free">Keine feste Zeit</span>'}</div>
  </div>`;
}

function renderTasks(root){
  const todos=todoRows(state.taskFilter).filter(x=>matchesPerson(x,state.taskPerson)),hw=homeworkRows(state.taskFilter).filter(x=>matchesPerson(x,state.taskPerson)),all=[...todos.map(x=>({kind:'todo',x,date:taskDate(x)})),...hw.map(x=>({kind:'hw',x,date:taskDate(x)}))];
  const openCount=todoRows('open').length+homeworkRows('open').length;
  header('Aufgaben','Alles, was erledigt werden muss',`${openCount} offen`);
  const grouped=groupTasks(all,state.taskFilter);
  root.innerHTML=`<div class="fc11-page">
    <div class="fc11-task-head">
      <div class="fc11-segment">${[['open','Offen'],['today','Heute'],['tomorrow','Morgen'],['done','Erledigt']].map(([k,l])=>`<button type="button" data-task-filter="${k}" aria-pressed="${state.taskFilter===k}" class="${state.taskFilter===k?'active':''}">${l}</button>`).join('')}</div>
      <div class="fc11-task-add"><button type="button" data-new-todo>${icon('plus')} To-do</button><button type="button" data-new-hw>Schule</button></div>
    </div>
    ${personFilters(state.taskPerson,'task-person')}
    <div class="fc11-task-groups">${grouped||'<div class="fc11-empty">Für diese Auswahl sind keine Aufgaben vorhanden.</div>'}</div>
  </div>`;
  root.querySelectorAll('[data-task-filter]').forEach(b=>b.onclick=()=>{state.taskFilter=b.dataset.taskFilter;render()});
  root.querySelectorAll('[data-task-person]').forEach(b=>b.onclick=()=>{state.taskPerson=b.dataset.taskPerson;render()});
  root.querySelector('[data-new-todo]')?.addEventListener('click',()=>editTodo('',today()));
  root.querySelector('[data-new-hw]')?.addEventListener('click',()=>editHomework('',today()));
  bindRows(root);
}
function groupTasks(items,filter){
  const groups=new Map();
  const label=x=>{
    if(filter==='done')return'Erledigt';
    if(!x.date)return'Ohne Frist';
    if(x.date<today())return'Überfällig';
    if(x.date===today())return'Heute';
    if(x.date===addDays(today(),1))return'Morgen';
    return'Später';
  };
  items.sort((a,b)=>String(a.date||'9999').localeCompare(String(b.date||'9999'))).forEach(item=>{const k=label(item);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(item)});
  return [...groups].map(([name,list])=>`<section class="fc11-section"><div class="fc11-section-head"><div><h2>${name}</h2></div><span class="fc11-count">${list.length}</span></div><div class="fc11-list">${list.map(i=>i.kind==='todo'?todoRow(i.x):homeworkRow(i.x)).join('')}</div></section>`).join('');
}

async function ensureDocs(refresh=false){
  if(state.docsLoading)return;
  state.docsLoading=true;
  try{state.docs=await window.__fcDocumentLibrary?.list?.({refresh})||[]}catch(e){console.warn('fc11_docs',e);state.docs=[]}
  finally{state.docsLoading=false}
}
function renderDocs(root){
  header('Dokumente','Briefe, Originale & Informationen',state.docsLoading?'Wird aktualisiert …':`${state.docs.length} gespeichert`);
  root.innerHTML=`<div class="fc11-page">
    <div class="fc11-doc-actions">
      <button type="button" class="primary" data-upload-doc>${icon('upload')}<span><b>Dokument hinzufügen</b><small>Foto oder PDF prüfen & zuordnen</small></span></button>
      <button type="button" data-doc-search>${icon('search')}<span><b>Dokumente durchsuchen</b><small>Auch verknüpfte Termine finden</small></span></button>
    </div>
    ${personFilters(state.docPerson,'doc-person')}
    <section class="fc11-section">
      <div class="fc11-section-head"><div><small>ABLAGE</small><h2>Zuletzt gespeichert</h2></div><button type="button" data-refresh-docs>Aktualisieren</button></div>
      <div class="fc11-doc-list">${docRows()}</div>
    </section>
    <button type="button" class="fc11-brain-entry docs" data-brain><span class="fc11-brain-icon">${icon('brain')}</span><span><b>In meinen Unterlagen fragen</b><small>Termine, Schulbriefe und Informationen wiederfinden</small></span>${icon('chevron')}</button>
  </div>`;
  root.querySelector('[data-upload-doc]')?.addEventListener('click',()=>window.fcOpenSmartDocuments?.());
  root.querySelector('[data-doc-search]')?.addEventListener('click',e=>window.fcOpenSearch?.(e.currentTarget));
  root.querySelector('[data-refresh-docs]')?.addEventListener('click',async()=>{await ensureDocs(true);render()});
  root.querySelectorAll('[data-doc-person]').forEach(b=>b.onclick=()=>{state.docPerson=b.dataset.docPerson;render()});
  root.querySelectorAll('[data-document]').forEach(b=>b.onclick=()=>window.fcOpenOriginal?.(b.dataset.document));
  if(!state.docs.length&&!state.docsLoading)ensureDocs().then(()=>{if(state.screen==='docs')render()});
}
function docRows(){
  if(state.docsLoading)return'<div class="fc11-empty compact">Dokumente werden geladen …</div>';
  const list=state.docs.filter(d=>state.docPerson==='all'||(d.personIds||[]).map(String).includes(String(state.docPerson)));
  if(!list.length)return'<div class="fc11-empty compact">Für diese Auswahl sind noch keine Dokumente gespeichert.</div>';
  return list.slice(0,80).map(d=>{const date=String(d.created_at||'').slice(0,10);return `<button type="button" class="fc11-doc-row" data-document="${esc(d.id)}"><span class="fc11-doc-type">${String(d.mime_type||'').includes('pdf')?'PDF':'DOC'}</span><span><b>${esc(d.title||'Dokument')}</b><small>${(d.personIds||[]).map(personName).filter(Boolean).map(esc).join(' · ')||'Allgemein'}${date?` · ${esc(fmt(date))}`:''}</small></span>${icon('chevron')}</button>`}).join('');
}

function renderMore(root){
  const ps=rows(D().people).filter(active);
  header('Mehr','Familie & Werkzeuge','Alles Weitere ohne die Startseite zu überladen');
  root.innerHTML=`<div class="fc11-page">
    <section class="fc11-section">
      <div class="fc11-section-head"><div><small>FAMILIE</small><h2>Personen</h2></div></div>
      <div class="fc11-people-grid">${ps.map(personCard).join('')}</div>
    </section>
    <section class="fc11-section">
      <div class="fc11-section-head"><div><small>ALLTAG</small><h2>Listen & Planung</h2></div></div>
      <div class="fc11-tools-grid">
        ${tool('shopping','cart','Einkauf','Gemeinsame Listen')}
        ${tool('meals','food','Mahlzeiten','Wochenplanung')}
        ${tool('recipes','food','Rezepte','Favoriten & Ideen')}
        ${tool('budget','money','Budget','Haushalt im Blick')}
        ${tool('contacts','contacts','Kontakte','Schule, Ärzte & mehr')}
      </div>
    </section>
    <section class="fc11-system">
      <button type="button" class="fc11-system-launch" data-system-security>
        <span><small>SYSTEM & SICHERHEIT</small><b>System & Sicherheit</b><em>${esc(systemSummaryText())}</em></span>
        ${icon('chevron')}
      </button>
    </section>
  </div>`;
  root.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>openTool(b.dataset.tool));
  root.querySelectorAll('[data-person-card]').forEach(b=>b.onclick=()=>openPerson(b.dataset.personCard));
  root.querySelector('[data-system-security]')?.addEventListener('click',openSystemTools);
}
function openSystemTools(){
  document.getElementById('fc11SystemSheet')?.remove();
  const m=document.createElement('div');m.id='fc11SystemSheet';m.className='fc11-modal';
  m.innerHTML=`<section class="fc11-sheet fc11-system-sheet" role="dialog" aria-modal="true" aria-labelledby="fc11SystemTitle">
    <div class="fc11-sheet-head">
      <div><small>SYSTEM & SICHERHEIT</small><h2 id="fc11SystemTitle">System & Sicherheit</h2></div>
      <button type="button" data-close aria-label="Schliessen">×</button>
    </div>
    ${systemHealth()}
    <div class="fc11-system-tools fc11-tools-grid">
      ${tool('connections','link','Verbindungen','Apple Kalender & Bluewin')}
      ${tool('conflicts','bell','Konflikt-Assistent',(()=>{const a=conflictAudit();return a.conflicts.length?a.conflicts.length+' Punkte prüfen':'Keine Konflikte'})())}
      ${tool('push','bell','Erinnerungen','Push & Morgenbericht')}
      ${tool('backup','backup','Sicherung','Cloud-Backups')}
      ${tool('export','download','Datenexport','JSON-Sicherung')}
      ${tool('jarvis','link','Jarvis','Gerät verbinden')}
      ${tool('ai','brain','Family AI','Sprechen & erfassen')}
    </div>
  </section>`;
  const close=()=>m.remove();
  m.querySelector('[data-close]').onclick=close;
  m.onclick=e=>{if(e.target===m)close()};
  m.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{const key=b.dataset.tool;close();setTimeout(()=>openTool(key),0)});
  document.body.appendChild(m);
}

function personCard(p){
  const week=Object.values(D().schedules?.[p.id]||{}).flat().filter(Boolean).length;
  return `<button type="button" class="fc11-person-card" style="--p:${esc(color(p.id))}" data-person-card="${esc(p.id)}"><span class="fc11-avatar large">${esc(initials(p.name))}</span><span><b>${esc(p.name)}</b><small>${esc([p.role,p.school].filter(Boolean).join(' · ')||'Familie')}</small><em>${week?week+' '+(week===1?'Zeitblock':'Zeitblöcke'):''}</em></span>${icon('chevron')}</button>`;
}
function systemHealth(){
  const snap=window.__fcConnections?.status?.()||{},conns=Array.isArray(snap.connections)?snap.connections:[],cloud=window.__fcCloudState?.health?.()||{},bg=snap.backgroundSync||null;
  const by=p=>conns.find(x=>x.provider===p)||null,ageMinutes=v=>{const t=Date.parse(v||'');return Number.isFinite(t)?Math.max(0,Math.round((Date.now()-t)/60000)):null};
  const row=(label,obj,kind='conn')=>{
    let ok=false,sub='Noch nicht geprüft';
    if(kind==='cloud'){ok=cloud.status==='synced'||cloud.status==='test';sub=ok?'Cloud-State gesichert':cloud.status==='offline-cache'?'Offline · lokaler Cache':cloud.status||'Verbindet …'}
    else if(kind==='background'){
      const age=ageMinutes(obj?.last_start),stale=age!==null&&age>75;
      ok=!!obj?.active&&obj?.last_status!=='failed'&&!stale;
      sub=!obj?.active?'Nicht aktiv':obj?.last_status==='failed'?'Letzter Lauf fehlgeschlagen':stale?'Letzter Lauf vor '+age+' Min · veraltet':obj?.last_status?('Aktiv · '+dateTimeShort(obj.last_start)):'Aktiv · wartet auf ersten Lauf';
    }
    else if(obj){
      const age=ageMinutes(obj.last_sync_at),stale=age!==null&&age>75;
      ok=obj.last_status==='connected'&&!obj.last_error&&!stale;
      sub=obj.last_error||obj.last_status!=='connected'?(obj.last_error||obj.last_status||'Eingerichtet'):stale?'Letzter Sync vor '+age+' Min · veraltet':'Verbunden · '+dateTimeShort(obj.last_sync_at);
    }
    return `<div class="fc11-health-row ${ok?'ok':'warn'}"><i></i><span><b>${esc(label)}</b><small>${esc(sub)}</small></span></div>`;
  };
  return '<div class="fc11-health"><div class="fc11-health-head"><span><small>SYSTEMSTATUS</small><b>'+(conns.length?'Cloud-Dienste':'Wird geprüft')+'</b></span><em>'+(bg?.active?'Auto-Sync · 30 Min':'Auto-Sync prüfen')+'</em></div>'+
    row('Familienzentrale Cloud',null,'cloud')+row('Apple Kalender',by('icloud'))+row('Bluewin E-Mail',by('bluewin'))+row('Hintergrund-Sync',bg,'background')+
    (()=>{const a=conflictAudit(),ok=!a.conflicts.length;return `<div class="fc11-health-row ${ok?'ok':'warn'}"><i></i><span><b>Konflikt-Assistent</b><small>${esc(ok?'Keine Konflikte in 90 Tagen':a.conflicts.length+' Punkt'+(a.conflicts.length===1?'':'e')+' prüfen')}</small></span></div>`})()+
    (()=>{const a=saturdayCareAudit(),ok=!a.warnings.length;return `<div class="fc11-health-row ${ok?'ok':'warn'}"><i></i><span><b>Samstagsbetreuung</b><small>${esc(ok?(a.total?a.checked.length+' kommende Schichten geprüft':'Keine kommenden Samstagsschichten'):a.warnings.length+' Problem'+(a.warnings.length===1?'':'e')+' gefunden')}</small></span></div>`})()+'</div>';
}
function dateTimeShort(v){if(!v)return'noch nie';try{return new Intl.DateTimeFormat('de-CH',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}).format(new Date(v))}catch{return''}}
function systemSummaryText(){
  const s=window.__fcConnections?.status?.(),list=Array.isArray(s?.connections)?s.connections:[],fresh=x=>{const t=Date.parse(x?.last_sync_at||'');return Number.isFinite(t)&&Date.now()-t<=75*60000},ok=p=>list.some(x=>x.provider===p&&x.last_status==='connected'&&!x.last_error&&fresh(x)),bg=s?.backgroundSync||null,bgAge=Date.parse(bg?.last_start||''),bgOk=!!bg?.active&&bg?.last_status!=='failed'&&(!Number.isFinite(bgAge)||Date.now()-bgAge<=75*60000);
  if(ok('icloud')&&ok('bluewin')&&bgOk)return'Cloud, iCloud & Bluewin aktuell · Auto-Sync aktiv';
  if(list.length)return'Systemstatus prüfen · mindestens ein Dienst ist veraltet oder gestört';
  return'Verbindungen, Erinnerungen, Sicherung & Geräte';
}
function tool(key,ico,title,sub){return `<button type="button" class="fc11-tool" data-tool="${key}"><span>${icon(ico)}</span><div><b>${title}</b><small>${sub}</small></div>${icon('chevron')}</button>`}
async function openBrain(){
  try{await window.__fcLoadExtrasNow?.()}catch(e){console.warn('fc11_brain_load',e)}
  if(typeof window.fcOpenFamilyBrain==='function')return window.fcOpenFamilyBrain();
  if(typeof window.fcOpenFamilyAI==='function')return window.fcOpenFamilyAI('text');
  try{window.toast?.('Familienassistent konnte noch nicht geladen werden.')}catch{}
}

async function openTool(key){
  try{await window.__fcLoadExtrasNow?.()}catch{}
  const map={
    shopping:()=>window.fcOpenShoppingLists?.(),
    meals:()=>window.fcOpenMealPlanner?.(),
    recipes:()=>window.fcOpenRecipes?.(),
    budget:()=>window.fcOpenFamilyBudget?.(),
    contacts:()=>window.fcOpenFamilyContacts?.(),
    ai:()=>window.fcOpenFamilyAI?.('voice'),
    backup:()=>window.fcOpenBackups?.(),
    jarvis:()=>window.fcOpenJarvisConnect?.(),
    connections:()=>window.fcOpenConnections?.(),
    conflicts:()=>openConflictAssistant(),
    push:()=>typeof window.fcOpenReminderCenter==='function'?window.fcOpenReminderCenter():window.enablePush?.(),
    export:()=>{if(typeof window.exportData==='function')return window.exportData();const a=document.createElement('a'),blob=new Blob([JSON.stringify(D(),null,2)],{type:'application/json'});a.href=URL.createObjectURL(blob);a.download=`familienzentrale-${today()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),0)}
  };
  const fn=map[key];if(fn)return fn();
  try{window.openScreen?.('more')}catch{}
}
function openPerson(id){
  const p=person(id);if(!p)return;
  document.getElementById('fc11PersonSheet')?.remove();
  const days=['So','Mo','Di','Mi','Do','Fr','Sa'];
  const scheduleLines=Object.entries(D().schedules?.[p.id]||{}).filter(([,slots])=>rows(slots).length).map(([day,slots])=>`<div class="fc11-person-day"><b>${days[Number(day)]||day}</b><span>${rows(slots).map(s=>[s.start,s.end].filter(Boolean).join('–')).filter(Boolean).join(' · ')}</span></div>`).join('');
  const teachers=rows(p.teachers).map(t=>`<div class="fc11-person-contact"><b>${esc(t.name||'Kontakt')}</b><span>${esc([t.role,t.phone,t.email].filter(Boolean).join(' · '))}</span></div>`).join('');
  const linkedDocs=state.docs.filter(d=>(d.personIds||[]).map(String).includes(String(p.id))).slice(0,5);
  const m=document.createElement('div');m.id='fc11PersonSheet';m.className='fc11-modal';
  m.innerHTML=`<section class="fc11-sheet fc11-person-sheet" role="dialog" aria-modal="true" aria-labelledby="fc11PersonTitle"><div class="fc11-sheet-head"><div class="fc11-person-title" style="--p:${esc(color(p.id))}"><span class="fc11-avatar large">${esc(initials(p.name))}</span><div><small>PERSON</small><h2 id="fc11PersonTitle">${esc(p.name)}</h2><p>${esc([p.role,p.school,p.schoolClass||p.class].filter(Boolean).join(' · '))}</p></div></div><button type="button" data-close aria-label="Schliessen">×</button></div><div class="fc11-person-detail">${scheduleLines?`<section><h3>Wochenzeiten</h3><div>${scheduleLines}</div></section>`:''}${teachers?`<section><h3>Kontakte</h3><div>${teachers}</div></section>`:''}${linkedDocs.length?`<section><h3>Dokumente</h3><div class="fc11-person-docs">${linkedDocs.map(d=>`<button type="button" data-person-doc="${esc(d.id)}">${esc(d.title||'Dokument')}${icon('chevron')}</button>`).join('')}</div></section>`:''}<div class="fc11-person-actions"><button type="button" data-person-plan>Im Plan anzeigen</button><button type="button" data-person-doc-center>Dokumente</button></div></div></section>`;
  const close=()=>m.remove();m.querySelector('[data-close]').onclick=close;m.onclick=e=>{if(e.target===m)close()};
  m.querySelector('[data-person-plan]').onclick=()=>{state.planPerson=String(p.id);state.planDate=today();close();open('plan')};
  m.querySelector('[data-person-doc-center]').onclick=()=>{state.docPerson=String(p.id);close();open('docs')};
  m.querySelectorAll('[data-person-doc]').forEach(b=>b.onclick=()=>window.fcOpenOriginal?.(b.dataset.personDoc));
  document.body.appendChild(m);
}

function openAdd(){
  document.getElementById('fc11AddSheet')?.remove();
  const m=document.createElement('div');m.id='fc11AddSheet';m.className='fc11-modal';
  m.innerHTML=`<section class="fc11-sheet" role="dialog" aria-modal="true" aria-labelledby="fc11AddTitle"><div class="fc11-sheet-head"><div><small>SCHNELL HINZUFÜGEN</small><h2 id="fc11AddTitle">Was möchtest du eintragen?</h2></div><button type="button" data-close aria-label="Schliessen">×</button></div><div class="fc11-add-grid"><button data-kind="event">${icon('plan')}<span><b>Termin</b><small>Arzt, Schule, Anlass …</small></span></button><button data-kind="todo">${icon('tasks')}<span><b>To-do</b><small>Etwas erledigen</small></span></button><button data-kind="homework">${icon('tasks')}<span><b>Schulaufgabe</b><small>Fällig für ein Kind</small></span></button><button data-kind="doc">${icon('upload')}<span><b>Dokument</b><small>Foto oder PDF prüfen</small></span></button></div></section>`;
  const close=()=>m.remove();m.querySelector('[data-close]').onclick=close;m.onclick=e=>{if(e.target===m)close()};
  m.querySelectorAll('[data-kind]').forEach(b=>b.onclick=()=>{const k=b.dataset.kind;close();if(k==='event')editEvent();if(k==='todo')editTodo('',today());if(k==='homework')editHomework('',today());if(k==='doc')window.fcOpenSmartDocuments?.()});
  document.body.appendChild(m);
}
let raf=0;
function queueRender(){cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>render())}
function installSaveRefresh(){
  if(window.__fcV11SaveWrapped||typeof window.save!=='function')return;
  window.__fcV11SaveWrapped=true;
  const raw=window.save;
  window.save=function(...args){const out=raw.apply(this,args);setTimeout(queueRender,120);return out};
  try{save=window.save}catch{}
}
function installCss(){
  const existing=[...document.querySelectorAll('link[rel="stylesheet"]')].find(x=>/\bv11\.css(?:\?|$)/.test(x.getAttribute('href')||''));if(existing){existing.dataset.fc11='1';return}
  const l=document.createElement('link');l.rel='stylesheet';l.href='./v11.css?v=20260922-v1105-mobile-briefing';l.dataset.fc11='1';document.head.appendChild(l);
}
function install(){
  installCss();
  shell();
  installSaveRefresh();
  render();
  ensureDocs().then(()=>{if(state.screen==='docs')render()});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)queueRender()});
  window.addEventListener('focus',queueRender);
  document.addEventListener('fc:v9:render',()=>setTimeout(queueRender,120));
  document.addEventListener('fc:connections-updated',()=>{if(state.screen==='today')setTimeout(queueRender,60)});
  setInterval(()=>{if(state.screen==='today'||state.screen==='plan')queueRender()},60000);
  document.documentElement.dataset.fc11='1';
  document.dispatchEvent(new CustomEvent('fc:v11-ready'));
}
window.fcOpenConflictAssistant=openConflictAssistant;
window.__fcConflictAssistant={open:openConflictAssistant,audit:conflictAudit};
window.__fcV11={version:VERSION,state,open,render,health:()=>({version:VERSION,screen:state.screen,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,nav:[...document.querySelectorAll('.fc11-bottom-nav [data-fc11-screen]')].map(x=>x.dataset.fc11Screen),docs:state.docs.length})};
install();
})();
