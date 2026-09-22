/* Familienzentrale V11 · one calm product shell over the proven data/runtime layer */
(()=>{'use strict';
if(window.__fcV11)return;

const VERSION='11.0.0-preview';
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
const pids=x=>[...(Array.isArray(x?.personIds)?x.personIds:[]),x?.personId].filter(Boolean).map(String);
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
  const explicit=all.filter(p=>/kind|child|sohn|tochter/i.test(String(p.role||'')));
  if(explicit.length)return explicit;
  return all.filter(p=>String(p.id)!=='oli'&&!/papa|mama|adult|erwachs/i.test(String(p.role||'')));
}
function eventsOn(date){
  try{return typeof window.eventsOn==='function'?rows(window.eventsOn(date)):rows(D().events).filter(e=>eventDate(e)===date||(e.endDate&&eventDate(e)<=date&&String(e.endDate)>=date))}catch{return[]}
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
  return `<div class="fc11-filter-row" role="group" aria-label="Person filtern"><button type="button" data-${attr}="all" class="${selected==='all'?'active':''}">Alle</button>${rows(D().people).filter(active).map(p=>`<button type="button" data-${attr}="${esc(p.id)}" class="${String(selected)===String(p.id)?'active':''}" style="--p:${esc(color(p.id))}"><i></i>${esc(p.name)}</button>`).join('')}</div>`;
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
  const date=today(),next=nextDisplay(nextAction()),kids=dependents(),events=eventsOn(date).filter(e=>!window.__fcV9?.eventIsPast?.(e)),todos=todoRows('today'),hw=homeworkRows('today');
  const tomorrow=addDays(date,1),tomEvents=eventsOn(tomorrow),tomTodos=todoRows('open').filter(x=>taskDate(x)===tomorrow),tomHw=homeworkRows('open').filter(x=>taskDate(x)===tomorrow);
  header('Heute',fmt(date,{weekday:true,long:true}),summaryText(events,todos,hw));
  root.innerHTML=`<div class="fc11-page fc11-home">
    <section class="fc11-next ${next?'':'calm'}">
      <div class="fc11-section-kicker">${next?'Als Nächstes':'Heute'}</div>
      ${next?`<button type="button" class="fc11-next-content" data-next-action><div><b>${esc(next.title||'Nächster Punkt')}</b><span>${esc(next.sub||'')}</span></div><div class="fc11-next-time"><strong>${esc(next.time||'')}</strong><small>${esc(next.left||'')}</small></div>${icon('chevron')}</button>`:`<div class="fc11-next-empty"><b>Kein Zeitdruck mehr</b><span>Offene Aufgaben und der morgige Tag bleiben unten sichtbar.</span></div>`}
    </section>

    <section class="fc11-section">
      <div class="fc11-section-head"><div><small>FAMILIE</small><h2>Kinder heute</h2></div><button type="button" data-go-plan>Wochenplan</button></div>
      <div class="fc11-kids">${kids.map(p=>kidRow(p,currentState(p,date,true))).join('')||'<div class="fc11-empty">Keine Kinderprofile vorhanden.</div>'}</div>
    </section>

    <div class="fc11-home-grid">
      <section class="fc11-section">
        <div class="fc11-section-head"><div><small>HEUTE</small><h2>Was noch ansteht</h2></div><button type="button" data-go-plan>Plan</button></div>
        <div class="fc11-list">${todayRows(events,todos,hw)||'<div class="fc11-empty compact">Für heute ist nichts mehr offen.</div>'}</div>
      </section>
      <section class="fc11-section">
        <div class="fc11-section-head"><div><small>MORGEN</small><h2>Früh wissen, was kommt</h2></div><button type="button" data-tomorrow-plan>${fmt(tomorrow)}</button></div>
        <div class="fc11-list">${tomorrowRows(tomEvents,tomTodos,tomHw)||'<div class="fc11-empty compact">Für morgen gibt es keine zusätzlichen Punkte.</div>'}</div>
      </section>
    </div>

    <button type="button" class="fc11-brain-entry" data-brain>
      <span class="fc11-brain-icon">${icon('brain')}</span>
      <span><b>Frag die Familienzentrale</b><small>„Was habe ich nächste Woche?“ · „Wo ist der Quartalsbrief?“</small></span>
      ${icon('chevron')}
    </button>
  </div>`;
  root.querySelectorAll('[data-go-plan]').forEach(b=>b.onclick=()=>open('plan'));
  root.querySelectorAll('[data-kid]').forEach(b=>b.onclick=()=>{state.planPerson=b.dataset.kid;state.planDate=date;open('plan')});
  root.querySelector('[data-tomorrow-plan]')?.addEventListener('click',()=>{state.planDate=tomorrow;open('plan')});
  root.querySelector('[data-next-action]')?.addEventListener('click',()=>{if(next?.eventId)openEvent(next.eventId);else open('plan')});
  bindRows(root);
}
function summaryText(events,todos,hw){
  const n=events.length+todos.length+hw.length;
  if(!n)return'Keine offenen Punkte für heute';
  return `${events.length} Termin${events.length===1?'':'e'} · ${todos.length+hw.length} Aufgabe${todos.length+hw.length===1?'':'n'}`;
}
function kidRow(p,s){
  const clr=color(p.id),status=s?.label||'Heute frei',sub=s?.sub&& !/Aktuell läuft alles|Von zuhause los|Als Nächstes|Schule \/ Kindergarten/.test(s.sub)?s.sub:'';
  return `<button type="button" class="fc11-kid" data-kid="${esc(p.id)}" style="--p:${esc(clr)}">
    <span class="fc11-avatar">${esc(initials(p.name))}</span>
    <span class="fc11-kid-copy"><b>${esc(p.name)}</b><span>${esc(status)}</span>${sub?`<small>${esc(sub)}</small>`:''}</span>
    <span class="fc11-kid-time">${esc(s?.time||'')}${s?.kind==='future'?`<small>${s.action==='depart'?'los':'Start'}</small>`:s?.kind==='active'?'<small>Ende</small>':''}</span>
    ${icon('chevron')}
  </button>`;
}
function todayRows(events,todos,hw){
  const items=[];
  events.forEach(e=>items.push({sort:`0|${timeVal(e.time)}`,html:eventRow(e)}));
  todos.forEach(t=>items.push({sort:`1|${taskDate(t)}|${t.priority?'0':'1'}`,html:todoRow(t)}));
  hw.forEach(h=>items.push({sort:`2|${taskDate(h)}`,html:homeworkRow(h)}));
  return items.sort((a,b)=>a.sort.localeCompare(b.sort)).map(x=>x.html).join('');
}
function tomorrowRows(events,todos,hw){
  const list=[
    ...events.slice(0,3).map(eventRow),
    ...todos.slice(0,3).map(todoRow),
    ...hw.slice(0,2).map(homeworkRow)
  ];
  return list.slice(0,6).join('');
}
function eventRow(e){
  const prep=typeof window.eventPackText==='function'?String(window.eventPackText(e)||'').trim():'';
  return `<button type="button" class="fc11-row event" data-event="${esc(e.id)}" style="--p:${esc(color(pids(e)[0]))}">
    <span class="fc11-row-time"><b>${esc(e.time||'Ganztägig')}</b>${e.end?`<small>bis ${esc(e.end)}</small>`:''}</span>
    <span class="fc11-row-copy">${sourcePersonBadges(e)}<b>${esc(e.title||'Termin')}</b>${e.note?`<small>${esc(String(e.note).slice(0,120))}</small>`:''}${prep?`<em>Mitnehmen: ${esc(prep)}</em>`:''}</span>
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
  const dates=weekDates(state.planDate),ev=eventsOn(state.planDate).filter(e=>matchesPerson(e,state.planPerson)),kids=dependents().filter(p=>state.planPerson==='all'||String(p.id)===String(state.planPerson));
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
        <div class="fc11-kids plan">${kids.map(p=>planKid(p,state.planDate)).join('')||'<div class="fc11-empty compact">Keine Personen für diesen Filter.</div>'}</div>
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
      <div class="fc11-segment">${[['open','Offen'],['today','Heute'],['tomorrow','Morgen'],['done','Erledigt']].map(([k,l])=>`<button type="button" data-task-filter="${k}" class="${state.taskFilter===k?'active':''}">${l}</button>`).join('')}</div>
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
    <button type="button" class="fc11-brain-entry docs" data-brain><span class="fc11-brain-icon">${icon('brain')}</span><span><b>In meinen Unterlagen fragen</b><small>Termine, Schulbriefe und Informationen wiederfinden</small></span>${icon('chevron')}</button>
    <div class="fc11-doc-actions">
      <button type="button" class="primary" data-upload-doc>${icon('upload')}<span><b>Dokument hinzufügen</b><small>Foto oder PDF prüfen & zuordnen</small></span></button>
      <button type="button" data-doc-search>${icon('search')}<span><b>Dokumente durchsuchen</b><small>Auch verknüpfte Termine finden</small></span></button>
    </div>
    ${personFilters(state.docPerson,'doc-person')}
    <section class="fc11-section">
      <div class="fc11-section-head"><div><small>ABLAGE</small><h2>Zuletzt gespeichert</h2></div><button type="button" data-refresh-docs>Aktualisieren</button></div>
      <div class="fc11-doc-list">${docRows()}</div>
    </section>
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
  return list.slice(0,80).map(d=>`<button type="button" class="fc11-doc-row" data-document="${esc(d.id)}"><span class="fc11-doc-type">${String(d.mime_type||'').includes('pdf')?'PDF':'DOC'}</span><span><b>${esc(d.title||'Dokument')}</b><small>${(d.personIds||[]).map(personName).filter(Boolean).map(esc).join(' · ')||'Allgemein'} · ${esc(String(d.created_at||'').slice(0,10))}</small></span>${icon('chevron')}</button>`).join('');
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
    <section class="fc11-section">
      <div class="fc11-section-head"><div><small>SYSTEM</small><h2>Organisation & Sicherheit</h2></div></div>
      <div class="fc11-tools-grid">
        ${tool('ai','brain','Family AI','Sprechen & erfassen')}
        ${tool('push','bell','Erinnerungen','Push & Morgenbericht')}
        ${tool('backup','backup','Sicherung','Cloud-Backups')}
        ${tool('export','download','Datenexport','JSON-Sicherung')}
        ${tool('jarvis','link','Jarvis','Gerät verbinden')}
      </div>
    </section>
  </div>`;
  root.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>openTool(b.dataset.tool));
  root.querySelectorAll('[data-person-card]').forEach(b=>b.onclick=()=>openPerson(b.dataset.personCard));
}
function personCard(p){
  const week=Object.values(D().schedules?.[p.id]||{}).flat().filter(Boolean).length;
  return `<button type="button" class="fc11-person-card" style="--p:${esc(color(p.id))}" data-person-card="${esc(p.id)}"><span class="fc11-avatar large">${esc(initials(p.name))}</span><span><b>${esc(p.name)}</b><small>${esc([p.role,p.school].filter(Boolean).join(' · ')||'Familie')}</small><em>${week?week+' Wochenzeiten hinterlegt':''}</em></span>${icon('chevron')}</button>`;
}
function tool(key,ico,title,sub){return `<button type="button" class="fc11-tool" data-tool="${key}"><span>${icon(ico)}</span><div><b>${title}</b><small>${sub}</small></div>${icon('chevron')}</button>`}
async async function openBrain(){
  try{await window.__fcLoadExtrasNow?.()}catch(e){console.warn('fc11_brain_load',e)}
  if(typeof window.fcOpenFamilyBrain==='function')return window.fcOpenFamilyBrain();
  if(typeof window.fcOpenFamilyAI==='function')return window.fcOpenFamilyAI('text');
}

function openTool(key){
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
  const l=document.createElement('link');l.rel='stylesheet';l.href='./v11.css?v=20260922-v1100';l.dataset.fc11='1';document.head.appendChild(l);
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
  setInterval(()=>{if(state.screen==='today'||state.screen==='plan')queueRender()},60000);
  document.documentElement.dataset.fc11='1';
  document.dispatchEvent(new CustomEvent('fc:v11-ready'));
}
window.__fcV11={version:VERSION,state,open,render,health:()=>({version:VERSION,screen:state.screen,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,nav:[...document.querySelectorAll('.fc11-bottom-nav [data-fc11-screen]')].map(x=>x.dataset.fc11Screen),docs:state.docs.length})};
install();
})();