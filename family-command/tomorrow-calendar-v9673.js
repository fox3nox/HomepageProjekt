/* Familienzentrale V9.67.4 · reliable calendar day switching + compact tomorrow school rows */
(()=>{
'use strict';
if(window.__fcTomorrowCalendarV9674)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
const D=()=>{try{return typeof data!=='undefined'&&data?data:{}}catch(_){return{}}};
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const today=()=>{try{return typeof todayISO==='function'?todayISO():iso(new Date())}catch(_){return iso(new Date())}};
const addDays=(value,n)=>{const d=new Date(`${value}T12:00:00`);d.setDate(d.getDate()+n);return iso(d)};
const schedule=(pid,wd)=>{try{return typeof scheduleFor==='function'?(scheduleFor(pid,wd)||[]):D().schedules?.[pid]?.[wd]||[]}catch(_){return[]}};
const isKg=p=>/elia|eliya|eliyah|kindergarten/i.test(`${p?.id||''} ${p?.name||''} ${p?.role||''} ${p?.schoolClass||''}`);
function packFor(p,date){
  const wd=new Date(`${date}T12:00:00`).getDay(),slots=[...schedule(p.id,wd)],hay=slots.map(x=>`${x?.label||''} ${x?.subject||''} ${x?.title||''} ${x?.note||''}`).join(' · ');
  if(!slots.length)return{items:[],special:[],note:''};
  const items=['🎒 Schultasche','💧 Trinkflasche'],special=[];
  if(isKg(p))items.push('🦺 Leuchtweste','🍎 Znüni-Box');
  if(/\b(turnen|sport|sportunterricht|turnschuh(?:e|en)?)\b/i.test(hay)){items.push('👟 Turnzeug');special.push('👟 Turnen · Turnzeug mitnehmen')}
  if(/\b(schwimmen|schwimmunterricht)\b/i.test(hay)){items.push('🏊 Schwimmsachen');special.push('🏊 Schwimmen · Schwimmsachen mitnehmen')}
  const notes=[...new Set(slots.map(x=>String(x?.note||'').trim()).filter(n=>/mitnehmen|rucksack|anziehen|abfahrt|turnschuh|leuchtweste|znüni|znueni/i.test(n)))];
  return{items:[...new Set(items)],special:[...new Set(special)],note:notes[0]||''};
}
function compactPackText(info){
  if(info.special.length){const extra=info.items.filter(x=>!/(Turnzeug|Schwimmsachen)/i.test(x));return [...info.special,...extra].join(' · ')}
  return info.items.join(' · ');
}
function enhanceTomorrow(){
  const root=document.getElementById('tomorrow');if(!root||!root.classList.contains('active'))return;
  root.querySelector('.fc673-tomorrow-pack')?.remove();
  const section=[...root.querySelectorAll('.fc9-section')].find(s=>/Kinder morgen/i.test(s.querySelector('.fc9-section-head h2')?.textContent||''));if(!section)return;
  const date=addDays(today(),1),people=(D().people||[]).filter(p=>p.id!=='oli');
  section.classList.add('fc674-tomorrow-children');
  for(const row of section.querySelectorAll('.fc9-person')){
    row.querySelectorAll('.fc674-inline-pack').forEach(x=>x.remove());
    const name=row.querySelector('b')?.textContent?.trim()||'',p=people.find(x=>String(x.name||'').trim()===name);if(!p)continue;
    const info=packFor(p,date),text=compactPackText(info);if(!text)continue;
    const main=row.querySelector('b')?.parentElement;if(!main)continue;
    const line=document.createElement('span');line.className='fc674-inline-pack';line.textContent=text;main.appendChild(line);
    if(info.note&&!text.includes(info.note)){const note=document.createElement('small');note.className='fc674-inline-note';note.textContent=info.note;main.appendChild(note)}
  }
  document.documentElement.dataset.fcTomorrowPack='v674';
  document.documentElement.dataset.fcTomorrowCompact='v674';
}
function monthData(){const state=window.__fcV9?.state||{},cur=state.calendarMonth instanceof Date?state.calendarMonth:new Date(`${today()}T12:00:00`),y=cur.getFullYear(),m=cur.getMonth(),first=new Date(y,m,1,12),days=new Date(y,m+1,0,12).getDate(),offset=(first.getDay()+6)%7;return{state,y,m,days,offset}}
function openCalendarDate(date){
  const v9=window.__fcV9,state=v9?.state;if(!state||!/^\d{4}-\d{2}-\d{2}$/.test(String(date||'')))return false;
  const selected=String(date),d=new Date(`${selected}T12:00:00`);
  state.weekDate=selected;state.calendarMode='week';state.calendarMonth=new Date(d.getFullYear(),d.getMonth(),1,12);
  v9.invalidate?.('events');
  if(state.screen!=='events')v9.open?.('events');else v9.render?.('events',true);
  requestAnimationFrame(()=>{if(state.weekDate!==selected||state.calendarMode!=='week'){state.weekDate=selected;state.calendarMode='week';v9.invalidate?.('events');v9.render?.('events',true)}});
  document.documentElement.dataset.fcCalendarSelectedDate=selected;
  return true;
}
function enhanceCalendar(){
  const root=document.getElementById('events');if(!root||!root.classList.contains('active')||window.__fcV9?.state?.calendarMode!=='agenda')return;
  const month=root.querySelector('.fc9-month');if(!month)return;
  const {y,m,days,offset}=monthData(),selected=window.__fcV9?.state?.weekDate||'',now=today(),eventSig=(D().events||[]).map(e=>`${e.id||''}:${e.date||''}:${e.endDate||''}`).join('|'),signature=`${y}-${m}-${selected}-${eventSig}`;
  let grid=root.querySelector('.fc673-monthgrid');
  if(grid?.dataset.fc673Signature===signature){document.documentElement.dataset.fcCalendarDays='v674';return}
  const cells=[];for(let i=0;i<offset;i++)cells.push('<span class="fc673-calblank"></span>');
  for(let day=1;day<=days;day++){const date=`${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`,wd=new Date(`${date}T12:00:00`).getDay(),has=(D().events||[]).some(e=>String(e.date||'')<=date&&String(e.endDate||e.date||'')>=date);cells.push(`<button type="button" class="fc673-calday${date===now?' is-today':''}${date===selected?' is-selected':''}${wd===0||wd===6?' is-weekend':''}" data-fc673-date="${date}" aria-label="${day}. ${m+1}. öffnen"><b>${day}</b>${has?'<i aria-hidden="true"></i>':''}</button>`)}
  const html=`<div class="fc673-monthgrid" data-fc673-signature="${esc(signature)}"><div class="fc673-weekheads"><span>Mo</span><span>Di</span><span>Mi</span><span>Do</span><span>Fr</span><span>Sa</span><span>So</span></div><div class="fc673-days">${cells.join('')}</div><small>Datum antippen, um den Tag zu öffnen</small></div>`;
  if(grid)grid.outerHTML=html;else month.insertAdjacentHTML('afterend',html);
  document.documentElement.dataset.fcCalendarDays='v674';
}
let timer=0;function run(){clearTimeout(timer);timer=setTimeout(()=>{enhanceTomorrow();enhanceCalendar()},20)}
const obs=new MutationObserver(ms=>{if(ms.every(m=>m.target?.closest?.('.fc674-tomorrow-children,.fc673-monthgrid')))return;run()});
function install(){
  const app=document.getElementById('fcApp')||document.body;obs.observe(app,{childList:true,subtree:true});
  document.addEventListener('click',e=>{
    const monthDay=e.target?.closest?.('[data-fc673-date]');if(monthDay){e.preventDefault();e.stopImmediatePropagation();openCalendarDate(monthDay.dataset.fc673Date);return}
    const weekDay=e.target?.closest?.('#events [data-week-date]');if(weekDay){e.preventDefault();e.stopImmediatePropagation();openCalendarDate(weekDay.dataset.weekDate);return}
    if(e.target.closest?.('[data-screen="tomorrow"],[data-screen="events"]'))setTimeout(run,30)
  },true);
  run();
}
const api={version:'9.67.4',render:run,packFor,openCalendarDate};
window.__fcTomorrowCalendarV9674=api;window.__fcTomorrowCalendarV9673=api;
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();