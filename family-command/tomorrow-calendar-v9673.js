/* Familienzentrale V9.67.3 · tomorrow pack list + usable calendar dates */
(()=>{
'use strict';
if(window.__fcTomorrowCalendarV9673)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const D=()=>{try{return typeof data!=='undefined'&&data?data:{}}catch(_){return{}}};
const iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const today=()=>{try{return typeof todayISO==='function'?todayISO():iso(new Date())}catch(_){return iso(new Date())}};
const addDays=(value,n)=>{const d=new Date(`${value}T12:00:00`);d.setDate(d.getDate()+n);return iso(d)};
const schedule=(pid,wd)=>{try{return typeof scheduleFor==='function'?(scheduleFor(pid,wd)||[]):D().schedules?.[pid]?.[wd]||[]}catch(_){return[]}};
const isKg=p=>/elia|eliya|eliyah|kindergarten/i.test(`${p?.id||''} ${p?.name||''} ${p?.role||''} ${p?.schoolClass||''}`);
function packFor(p,date){
  const wd=new Date(`${date}T12:00:00`).getDay(),slots=[...schedule(p.id,wd)],hay=slots.map(x=>`${x?.label||''} ${x?.subject||''} ${x?.title||''} ${x?.note||''}`).join(' · '),items=[];
  if(!slots.length)return{items:[],note:''};
  items.push('🎒 Schultasche','💧 Trinkflasche');
  if(isKg(p))items.push('🦺 Leuchtweste','🍎 Znüni-Box');
  if(/\b(turnen|sport|sportunterricht)\b/i.test(hay))items.push('👟 Turnzeug');
  if(/\b(schwimmen|schwimmunterricht)\b/i.test(hay))items.push('🏊 Schwimmsachen');
  const notes=[...new Set(slots.map(x=>String(x?.note||'').trim()).filter(n=>/mitnehmen|rucksack|anziehen|abfahrt|turnschuh|leuchtweste|znüni|znueni/i.test(n)))];
  return{items:[...new Set(items)],note:notes[0]||''};
}
function enhanceTomorrow(){
  const root=document.getElementById('tomorrow');if(!root||!root.classList.contains('active'))return;
  const page=root.querySelector('.fc9-page');if(!page)return;
  const date=addDays(today(),1),people=(D().people||[]).filter(p=>p.id!=='oli'),rows=people.map(p=>({p,...packFor(p,date)})).filter(x=>x.items.length);
  let box=page.querySelector('.fc673-tomorrow-pack');
  if(!rows.length){box?.remove();return}
  const html=`<section class="fc9-section fc673-tomorrow-pack"><div class="fc9-section-head"><h2>Morgen mitnehmen</h2><span>Direkt aus dem Stundenplan</span></div><div class="fc673-packlist">${rows.map(x=>`<article class="fc673-packchild"><div class="fc673-packhead"><b>${esc(x.p.name||'Kind')}</b><small>MITNEHMEN</small></div><div class="fc673-packchips">${x.items.map(i=>`<span>${esc(i)}</span>`).join('')}</div>${x.note?`<div class="fc673-packnote">⚠ ${esc(x.note)}</div>`:''}</article>`).join('')}</div></section>`;
  if(!box){const anchor=[...page.querySelectorAll('.fc9-section')].find(s=>/Kinder morgen/i.test(s.textContent||''));if(anchor)anchor.insertAdjacentHTML('afterend',html);else page.querySelector('.fc9-pagehead')?.insertAdjacentHTML('afterend',html)}
  else box.outerHTML=html;
  document.documentElement.dataset.fcTomorrowPack='v673';
}
function monthData(){const state=window.__fcV9?.state||{},cur=state.calendarMonth instanceof Date?state.calendarMonth:new Date(`${today()}T12:00:00`),y=cur.getFullYear(),m=cur.getMonth(),first=new Date(y,m,1,12),days=new Date(y,m+1,0,12).getDate(),offset=(first.getDay()+6)%7;return{state,y,m,days,offset}}
function enhanceCalendar(){
  const root=document.getElementById('events');if(!root||!root.classList.contains('active')||window.__fcV9?.state?.calendarMode!=='agenda')return;
  const month=root.querySelector('.fc9-month');if(!month)return;
  const {y,m,days,offset}=monthData(),selected=window.__fcV9?.state?.weekDate||'',now=today();
  const cells=[];for(let i=0;i<offset;i++)cells.push('<span class="fc673-calblank"></span>');
  for(let day=1;day<=days;day++){const date=`${y}-${String(m+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`,wd=new Date(`${date}T12:00:00`).getDay(),has=(D().events||[]).some(e=>String(e.date||'')<=date&&String(e.endDate||e.date||'')>=date);cells.push(`<button type="button" class="fc673-calday${date===now?' is-today':''}${date===selected?' is-selected':''}${wd===0||wd===6?' is-weekend':''}" data-fc673-date="${date}" aria-label="${day}. ${m+1}. öffnen"><b>${day}</b>${has?'<i aria-hidden="true"></i>':''}</button>`)}
  const html=`<div class="fc673-monthgrid"><div class="fc673-weekheads"><span>Mo</span><span>Di</span><span>Mi</span><span>Do</span><span>Fr</span><span>Sa</span><span>So</span></div><div class="fc673-days">${cells.join('')}</div><small>Datum antippen, um den Tag zu öffnen</small></div>`;
  let grid=root.querySelector('.fc673-monthgrid');if(grid)grid.outerHTML=html;else month.insertAdjacentHTML('afterend',html);
  root.querySelectorAll('[data-fc673-date]').forEach(b=>b.onclick=()=>{const state=window.__fcV9?.state;if(!state)return;state.weekDate=b.dataset.fc673Date;state.calendarMode='week';window.__fcV9.invalidate?.('events');window.__fcV9.render?.('events',true)});
  document.documentElement.dataset.fcCalendarDays='v673';
}
let timer=0;function run(){clearTimeout(timer);timer=setTimeout(()=>{enhanceTomorrow();enhanceCalendar()},20)}
const obs=new MutationObserver(ms=>{if(ms.every(m=>m.target?.closest?.('.fc673-tomorrow-pack,.fc673-monthgrid')))return;run()});
function install(){const app=document.getElementById('fcApp')||document.body;obs.observe(app,{childList:true,subtree:true});document.addEventListener('click',e=>{if(e.target.closest?.('[data-screen="tomorrow"],[data-screen="events"]'))setTimeout(run,30)},true);run()}
window.__fcTomorrowCalendarV9673={version:'9.67.3',render:run,packFor};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();