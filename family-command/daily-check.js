/* Familienzentrale V9.63.2 · Tagescheck · nothing important falls through */
(()=>{'use strict';
if(window.__fcDailyCheckInstalled)return;
window.__fcDailyCheckInstalled=true;

const VERSION='9.63.2';
const DATE_RE=/^\d{4}-\d{2}-\d{2}$/;
const PACK_RE=/(mitnehmen|rucksack|turn|bad|schwimm|zeug|angezogen|abfahrt|los|einpack|bereit|trinkflasche|znüni|leuchtweste)/i;
const FLOW_RE=/(tagesschule|abhol|holt|betreuung|transport|fahrdienst)/i;
const HOLIDAY_RE=/(ferien|osterwochenende|auffahrt|pfingsten)/i;
const D=()=>{try{return typeof data!=='undefined'&&data?data:{}}catch(_){return{}}};
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const currentDate=()=>{try{if(typeof todayISO==='function'){const value=String(todayISO()||'');if(DATE_RE.test(value))return value}}catch(_){}return iso(new Date())};
const dayOf=value=>new Date(`${value}T12:00:00`).getDay();
const shift=(value,days)=>{const d=new Date(`${value}T12:00:00`);d.setDate(d.getDate()+days);return iso(d)};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
const validDate=value=>DATE_RE.test(String(value||''));
const cleanTime=value=>String(value||'').slice(0,5);

function person(id){return(D().people||[]).find(p=>String(p.id)===String(id))||null}
function name(id){return person(id)?.name||String(id||'Familie')}
function names(ids){const list=(Array.isArray(ids)?ids:[ids]).filter(Boolean).map(name);return[...new Set(list)].join(' · ')}
function sectionLabel(section){return section==='morning'?'Morgens':section==='evening'?'Abends':section==='day'?'Tagsüber':''}
function shortDate(value){if(!validDate(value))return String(value||'');try{return new Intl.DateTimeFormat('de-CH',{weekday:'short',day:'2-digit',month:'2-digit'}).format(new Date(`${value}T12:00:00`))}catch(_){return value}}
function sortTime(value){const match=String(value||'').match(/\b(\d{1,2}):(\d{2})/);return match?`${String(match[1]).padStart(2,'0')}:${match[2]}`:'00:00'}

function events(date){
  return(D().events||[]).filter(e=>String(e.date)===date||(e.endDate&&String(e.date)<=date&&String(e.endDate)>=date));
}
function todoIdentity(x,index){return String(x?.id||x?.clientRef||x?.sourceCommandId||`${x?.personId||''}|${x?.date||''}|${x?.title||''}|${x?.createdAt||index}`)}
function allTodos(){
  const merged=new Map();
  const add=rows=>{for(const [index,row] of(Array.isArray(rows)?rows:[]).entries()){if(!row)continue;const key=todoIdentity(row,index);merged.set(key,{...(merged.get(key)||{}),...row})}};
  add(D().todos);
  try{add(window.__fcChatCommandSync?.all?.())}catch(_){}
  return[...merged.values()];
}
function openTodo(x){return!!x&&!x.archived&&!x.done&&validDate(x.date)}
function openHomework(x){return!!x&&!x.done&&validDate(x.dueDate)}
function todoBuckets(date){
  const exact=[],overdue=[];
  for(const x of allTodos().filter(openTodo)){
    const due=String(x.date);
    if(due===date)exact.push(x);
    else if(date===currentDate()&&due<date)overdue.push(x);
  }
  return{exact,overdue};
}
function homeworkBuckets(date){
  const exact=[],overdue=[];
  for(const x of(D().homework||[]).filter(openHomework)){
    const due=String(x.dueDate);
    if(due===date)exact.push(x);
    else if(date===currentDate()&&due<date)overdue.push(x);
  }
  return{exact,overdue};
}
function onSchoolBreak(personId,date){
  if(!personId)return false;
  try{if(typeof schoolBreakFor==='function')return!!schoolBreakFor(personId,date)}catch(_){}
  return events(date).some(e=>(e.personIds||[]).map(String).includes(String(personId))&&HOLIDAY_RE.test(String(e.title||'')));
}
function reminders(date){
  const day=dayOf(date),out=[];
  for(const r of(D().reminders||[])){
    if(!Array.isArray(r.days)||!r.days.map(Number).includes(day)||onSchoolBreak(r.personId,date))continue;
    for(const item of(r.items||[]))out.push({personId:r.personId,title:String(item),kind:'reminder'});
  }
  return out;
}
function isParent(p){return String(p?.id||'')==='oli'||/eltern|parent/i.test(String(p?.role||''))}
function scheduleInfo(date){
  const day=dayOf(date),pack=[],timeline=[];
  for(const p of(D().people||[])){
    const parent=isParent(p);
    if(!parent&&onSchoolBreak(p.id,date))continue;
    const slots=D().schedules?.[p.id]?.[day]||[];
    for(const s of(Array.isArray(slots)?slots:[])){
      const note=String(s?.note||'').trim(),label=String(s?.label||'').trim(),start=cleanTime(s?.start),end=cleanTime(s?.end);
      if(parent&&label){
        timeline.push({personId:p.id,title:label,time:[start,end].filter(Boolean).join('–'),sortTime:start||'00:00',kind:'schedule'});
        continue;
      }
      if(note&&PACK_RE.test(note))pack.push({personId:p.id,title:note,kind:'schedule-note'});
      const flow=note&&FLOW_RE.test(note)?note:(!note&&label&&FLOW_RE.test(label)?label:'');
      if(flow)timeline.push({personId:p.id,title:flow,time:end?`ab ${end}`:'',sortTime:end||start||'99:00',kind:'care'});
    }
  }
  return{pack,timeline};
}
function uniq(arr){
  const seen=new Set();
  return arr.filter(x=>{const key=[x.personId||'',(x.personIds||[]).join(','),String(x.title||'').toLowerCase().replace(/\s+/g,' ').trim(),x.time||''].join('|');if(!key||seen.has(key))return false;seen.add(key);return true});
}
function todoItem(x,overdue=false){
  const section=sectionLabel(x.section);
  return{title:x.title||'To-do',personId:x.personId||'',time:overdue?`Überfällig seit ${shortDate(x.date)}${section?` · ${section}`:''}`:section,priority:!!x.priority,overdue,dueDate:String(x.date),kind:'todo'};
}
function homeworkItem(x,overdue=false){
  return{title:(x.subject?`${x.subject} · `:'')+(x.title||'Schulaufgabe'),personId:x.personId||'',time:overdue?`Überfällig seit ${shortDate(x.dueDate)}`:'Schulaufgabe',note:x.note||'',priority:true,overdue,dueDate:String(x.dueDate),kind:'homework'};
}
function sortImportant(a,b){
  const sectionRank=value=>value==='Morgens'?0:value==='Tagsüber'?1:value==='Abends'?2:3;
  return Number(!!b.priority)-Number(!!a.priority)||sectionRank(a.time)-sectionRank(b.time)||String(a.title).localeCompare(String(b.title),'de');
}
function sortOverdue(a,b){return Number(!!b.priority)-Number(!!a.priority)||String(a.dueDate).localeCompare(String(b.dueDate))||String(a.title).localeCompare(String(b.title),'de')}
function dataFor(date){
  if(!validDate(date))date=currentDate();
  const schedule=scheduleInfo(date),todo=todoBuckets(date),homework=homeworkBuckets(date);
  const pack=uniq([...reminders(date),...schedule.pack]);
  const overdue=[...todo.overdue.map(x=>todoItem(x,true)),...homework.overdue.map(x=>homeworkItem(x,true))].sort(sortOverdue);
  const important=[...todo.exact.map(x=>todoItem(x,false)),...homework.exact.map(x=>homeworkItem(x,false))].sort(sortImportant);
  const eventTimeline=events(date).filter(e=>!HOLIDAY_RE.test(String(e.title||''))).map(e=>({title:e.title||'Termin',personIds:e.personIds||[],time:e.time||'Ganztägig',sortTime:e.time||'00:00',note:e.note||'',kind:'event'}));
  const timeline=uniq([...eventTimeline,...schedule.timeline]).sort((a,b)=>String(a.sortTime||sortTime(a.time)).localeCompare(String(b.sortTime||sortTime(b.time)))||String(a.title).localeCompare(String(b.title),'de'));
  return{date,pack,overdue,important,timeline,count:pack.length+overdue.length+important.length+timeline.length};
}
function row(icon,x){
  const who=x.personIds?.length?names(x.personIds):(x.personId?name(x.personId):'');
  return`<div class="fc-dc-row${x.overdue?' fc-dc-overdue':''}" data-dc-kind="${esc(x.kind||'item')}"><span class="fc-dc-icon">${icon}</span><div><b>${who?`${esc(who)} · `:''}${esc(x.title)}</b>${x.time||x.note?`<small>${esc([x.time,x.note].filter(Boolean).join(' · '))}</small>`:''}</div></div>`;
}
function dayLabel(date){const t=currentDate();if(date===t)return'Heute';if(date===shift(t,1))return'Morgen';if(date===shift(t,2))return'Übermorgen';return new Intl.DateTimeFormat('de-CH',{weekday:'long',day:'numeric',month:'long'}).format(new Date(`${date}T12:00:00`))}
function quickNav(date,compact=false){
  const t=currentDate(),items=[[t,'Heute'],[shift(t,1),'Morgen'],[shift(t,2),'Übermorgen']];
  return`<div class="fc-dc-quick ${compact?'compact':''}">${items.map(([d,label])=>`<button type="button" data-dc-date="${d}" class="${date===d?'active':''}">${label}</button>`).join('')}<label class="fc-dc-datepick" aria-label="Datum wählen"><span aria-hidden="true">📅</span><input type="date" data-dc-picker value="${date}"></label></div>`;
}
function previewItems(d){
  return[
    ...d.overdue.map(x=>({icon:'!',item:x})),
    ...d.pack.map(x=>({icon:'🎒',item:x})),
    ...d.important.map(x=>({icon:'●',item:x})),
    ...d.timeline.map(x=>({icon:'◷',item:x}))
  ].slice(0,4);
}
function summary(d){return d.overdue.length?`${d.overdue.length} überfällig · ${d.count} Punkte insgesamt`:d.count?`${d.count} wichtige${d.count===1?'r Punkt':' Punkte'} im Blick`:'Nichts Zusätzliches zu beachten'}
function bindDateNavigation(root,date,modal=false){
  root.querySelectorAll('[data-dc-date]').forEach(button=>button.onclick=()=>modal?(root.remove(),open(button.dataset.dcDate)):render(root,button.dataset.dcDate));
  const picker=root.querySelector('[data-dc-picker]');
  if(picker)picker.onchange=event=>{if(!event.target.value)return;if(modal){root.remove();open(event.target.value)}else render(root,event.target.value)};
}
function render(root,date){
  const d=dataFor(date),label=dayLabel(d.date),preview=previewItems(d);
  root.dataset.dailyCheckDate=d.date;
  root.dataset.dailyCheckToday=currentDate();
  root.innerHTML=`<section class="fc-dc"><header><div><small>TAGESCHECK</small><h2>${esc(label)}</h2><p>${esc(summary(d))}</p></div><button data-dc-open aria-label="Tagescheck öffnen">›</button></header>${quickNav(d.date,true)}${d.count?`<div class="fc-dc-preview">${preview.map(x=>row(x.icon,x.item)).join('')}${d.count>preview.length?`<button class="fc-dc-more" type="button" data-dc-open-more>${d.count-preview.length} weitere anzeigen</button>`:''}</div>`:`<div class="fc-dc-clear"><b>✓ Alles im Blick</b><span>Für diesen Tag gibt es nichts Zusätzliches zu beachten.</span></div>`}</section>`;
  root.querySelector('[data-dc-open]').onclick=()=>open(d.date);
  root.querySelector('[data-dc-open-more]')?.addEventListener('click',()=>open(d.date));
  bindDateNavigation(root,d.date,false);
}
function open(date=currentDate()){
  const d=dataFor(date);
  document.getElementById('fcDailyCheckModal')?.remove();
  const m=document.createElement('div');
  m.id='fcDailyCheckModal';
  m.className='fc-dc-modal';
  m.innerHTML=`<section class="fc-dc-sheet"><header><button data-close aria-label="Schließen">‹</button><div><small>TAGESCHECK</small><h2>${esc(new Intl.DateTimeFormat('de-CH',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date(`${d.date}T12:00:00`)))}</h2><p>${esc(summary(d))}</p></div><span></span></header>${quickNav(d.date)}<main>${d.count?`${d.overdue.length?`<section class="fc-dc-overdue-section"><h3>⚠️ Überfällig</h3><div class="fc-dc-list">${d.overdue.map(x=>row('!',x)).join('')}</div></section>`:''}${d.pack.length?`<section><h3>🎒 Mitnehmen & vorbereiten</h3><div class="fc-dc-list">${d.pack.map(x=>row('✓',x)).join('')}</div></section>`:''}${d.important.length?`<section><h3>📌 Wichtig an diesem Tag</h3><div class="fc-dc-list">${d.important.map(x=>row(x.priority?'!':'✓',x)).join('')}</div></section>`:''}${d.timeline.length?`<section><h3>🗓 Termine & Tagesablauf</h3><div class="fc-dc-list">${d.timeline.map(x=>row('◷',x)).join('')}</div></section>`:''}`:`<div class="fc-dc-empty"><b>✓ Alles im Blick</b><p>An diesem Tag gibt es keine zusätzlichen wichtigen Punkte.</p></div>`}</main></section>`;
  m.querySelector('[data-close]').onclick=()=>m.remove();
  m.onclick=event=>{if(event.target===m)m.remove()};
  bindDateNavigation(m,d.date,true);
  document.body.appendChild(m);
}
function mount(force=false){
  const todayRoot=document.getElementById('today');
  if(!todayRoot)return false;
  let host=todayRoot.querySelector('.fc-dc-host');
  if(!host){
    const page=todayRoot.querySelector('.fc9-page');
    if(!page)return false;
    host=document.createElement('div');
    host.className='fc-dc-host';
    page.querySelector('.fc9-pagehead')?.insertAdjacentElement('afterend',host);
  }
  const now=currentDate(),previousToday=host.dataset.dailyCheckToday,selected=host.dataset.dailyCheckDate;
  if(!force&&selected&&previousToday===now)return true;
  const next=selected&&previousToday&&selected!==previousToday?selected:now;
  render(host,next);
  return true;
}
function shortToday(){return new Intl.DateTimeFormat('de-CH',{weekday:'short',day:'numeric',month:'short'}).format(new Date(`${currentDate()}T12:00:00`))}
function longToday(){return new Intl.DateTimeFormat('de-CH',{weekday:'long',day:'numeric',month:'long'}).format(new Date(`${currentDate()}T12:00:00`)).replace(/\s+/g,' ').trim().toLowerCase()}
function anchor(){
  const brand=document.querySelector('.fc9-brand');
  if(brand){
    let a=brand.querySelector('.fc-today-anchor');
    if(!a){a=document.createElement('button');a.type='button';a.className='fc-today-anchor';a.setAttribute('aria-label','Tagescheck für heute öffnen');a.onclick=()=>open(currentDate());brand.appendChild(a)}
    const markup=`<span class="fc-today-anchor-label">HEUTE</span><span>${esc(shortToday())}</span>`;
    if(a.innerHTML!==markup)a.innerHTML=markup;
  }
  const t=currentDate();
  document.querySelectorAll('.fc9-weekday[data-week-date]').forEach(button=>{
    const hit=button.dataset.weekDate===t;
    button.classList.toggle('fc-is-today',hit);
    let tag=button.querySelector('.fc-today-tag');
    if(hit&&!tag){tag=document.createElement('small');tag.className='fc-today-tag';tag.textContent='HEUTE';button.appendChild(tag)}
    if(!hit)tag?.remove();
  });
  const expected=longToday();
  document.querySelectorAll('#events .fc9-day-label').forEach(label=>{
    const raw=String(label.childNodes[0]?.textContent||label.textContent||'').replace(/\s+/g,' ').trim().toLowerCase(),hit=raw===expected||raw.startsWith(expected);
    label.classList.toggle('fc-is-today',hit);
    let tag=label.querySelector('.fc-today-tag');
    if(hit&&!tag){tag=document.createElement('span');tag.className='fc-today-tag';tag.textContent='HEUTE';label.appendChild(tag)}
    if(!hit)tag?.remove();
  });
}
function install(){
  let queued=false;
  const refresh=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;mount(false);anchor()})};
  document.addEventListener('fc:v9-ready',refresh);
  const obs=new MutationObserver(refresh);
  obs.observe(document.getElementById('fcApp')||document.body,{childList:true,subtree:true});
  window.addEventListener('pageshow',refresh);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')refresh()});
  setInterval(refresh,60000);
  setTimeout(refresh,80);
}
window.fcOpenDailyCheck=open;
window.__fcDailyCheck={version:VERSION,open,dataFor,mount,health:()=>({version:VERSION,readOnly:true,sources:['reminders','schedules','todos','homework','events'],stableMount:true,futureQuickNav:true,datePicker:true,persistentToday:true,calendarToday:true,overdueCarry:true,futureIsolation:true,schoolBreakAware:true,parentSchedule:true,careNotes:true,coreTodayAligned:true,midnightRollover:true})};
install();
})();