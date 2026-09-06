/* Familienzentrale V9.67.2 · iPhone school-day presentation layer with per-child daily pack list */
(()=>{
'use strict';
if(window.__fcMobileSchoolDayV947)return;
const MOBILE='(max-width: 719px)';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const D=()=>{try{return typeof data!=='undefined'&&data?data:{}}catch(_){return{}}};
const todayIso=()=>{try{return typeof todayISO==='function'?todayISO():(()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`})()}catch(_){return''}};
const addDays=(iso,n)=>{const d=new Date(`${iso}T12:00:00`);d.setDate(d.getDate()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const schedule=(pid,day)=>{try{return typeof scheduleFor==='function'?(scheduleFor(pid,day)||[]):D().schedules?.[pid]?.[day]||[]}catch(_){return[]}};
const color=p=>p?.color||'#718197';
const initial=p=>(p?.name||'?').trim().charAt(0).toUpperCase()||'?';
const personMeta=p=>String(p?.schoolClass||p?.class||p?.role||'').replace(/\s*·\s*Schuljahr\b.*$/i,'').trim();
const state={date:null};
function futureSchoolDays(){const out=[],start=todayIso();for(let i=0;out.length<5&&i<14;i++){const date=addDays(start,i),wd=new Date(`${date}T12:00:00`).getDay();if(wd>=1&&wd<=5)out.push({date,wd})}return out}
function slotText(slots){return slots.map(x=>`${x?.label||''} ${x?.subject||''} ${x?.title||''} ${x?.note||''}`).join(' · ')}
function specialReminders(slots){
  const haystack=slotText(slots),out=[];
  if(/\b(turnen|sport|sportunterricht)\b/i.test(haystack))out.push('👟 TURNEN · Turnzeug mitnehmen');
  if(/\b(schwimmen|schwimmunterricht)\b/i.test(haystack))out.push('🏊 SCHWIMMEN · Schwimmsachen mitnehmen');
  return out;
}
function packItems(p,slots){
  if(!slots.length)return[];
  const haystack=slotText(slots),who=`${p?.id||''} ${p?.name||''} ${personMeta(p)}`;
  const items=[['🎒','Schultasche'],['🧴','Trinkflasche']];
  if(/elia|eliyah|kindergarten/i.test(who)){items.push(['🦺','Leuchtweste'],['🍱','Znüni-Box'])}
  if(/\b(turnen|sport|sportunterricht)\b/i.test(haystack))items.push(['👟','Turnzeug']);
  if(/\b(schwimmen|schwimmunterricht)\b/i.test(haystack))items.push(['🏊','Schwimmsachen']);
  return items.filter((x,i,a)=>a.findIndex(y=>y[1]===x[1])===i);
}
function importantNotes(slots){return[...new Set(slots.map(x=>String(x?.note||'').trim()).filter(n=>/mitnehmen|einpack|rucksack|anzieh|dabei|turnschuh|leuchtweste|trinkflasche|zn[uü]ni|abfahrt/i.test(n)))]}
function label(slots,p){if(!slots.length)return{kind:'FREI',icon:'—',time:'Kein Unterricht',note:'',reminders:[],pack:[],dayNotes:[],free:true};const first=slots[0],last=slots[slots.length-1],start=first.start||'',notes=[...new Set(slots.map(x=>String(x.note||'').trim()).filter(Boolean))];const kg=/elia|kindergarten/i.test(`${p?.id||''} ${p?.name||''} ${first.label||''}`);const early=start&&start<'08:10';return{kind:kg?'KG':early?'FRÜH':'SPÄT',icon:kg?'⌂':early?'☀':'◐',time:`${start||'—'}${start?'–':''}${last.end||'—'}`,note:notes.find(n=>!importantNotes(slots).includes(n))||'',reminders:specialReminders(slots),pack:packItems(p,slots),dayNotes:importantNotes(slots),free:false}}
function render(){
  if(!matchMedia(MOBILE).matches)return;
  const host=document.querySelector('#today .fc38-school');if(!host)return;
  const people=(D().people||[]).filter(p=>p.id!=='oli'),days=futureSchoolDays(),today=todayIso();
  if(!state.date||!days.some(x=>x.date===state.date))state.date=days[0]?.date||today;
  let box=host.querySelector('.fc47-school-mobile');if(!box){box=document.createElement('div');box.className='fc47-school-mobile';host.appendChild(box)}
  const tabs=days.map(({date,wd})=>{const sel=date===state.date,isToday=date===today,lab=['','Mo','Di','Mi','Do','Fr','Sa'][wd];return `<button type="button" role="tab" aria-selected="${sel?'true':'false'}" class="fc47-day${sel?' is-selected':''}${isToday?' is-today':''}" data-fc47-date="${date}"${isToday?' aria-current="date"':''}><b>${lab}</b><span>${date.slice(8,10)}.${date.slice(5,7)}.</span>${isToday?'<em>HEUTE</em>':''}</button>`}).join('');
  const selected=days.find(x=>x.date===state.date)||days[0],wd=selected?.wd||1;
  const rows=people.map(p=>{const x=label(schedule(p.id,wd),p),meta=personMeta(p),reminders=x.reminders.map(r=>`<small class="fc47-reminder">${esc(r)}</small>`).join(''),pack=x.pack.map(([icon,text])=>`<span class="fc47-packchip"><i>${icon}</i>${esc(text)}</span>`).join(''),dayNotes=x.dayNotes.map(n=>`<div class="fc47-daynote">⚠ ${esc(n)}</div>`).join('');return `<article class="fc47-child${x.free?' is-free':''}${x.reminders.length?' has-reminder':''}" style="--person:${esc(color(p))}" data-pack-count="${x.pack.length}"><span class="fc47-avatar">${esc(initial(p))}</span><div class="fc47-person"><strong>${esc(p.name||'Kind')}</strong>${meta?`<small>${esc(meta)}</small>`:''}</div><div class="fc47-status"><b><i>${x.icon}</i>${esc(x.kind)}</b><span>${esc(x.time)}</span>${reminders}${x.note?`<small>${esc(x.note)}</small>`:''}</div>${x.free?'':`<div class="fc47-pack"><b>MITNEHMEN</b><div>${pack}</div>${dayNotes}</div>`}</article>`}).join('');
  const html=`<div class="fc47-daytabs" role="tablist" aria-label="Nächste Schultage auswählen">${tabs}</div><div class="fc47-schoolday">${rows||'<div class="fc47-empty">Keine Kinder hinterlegt.</div>'}</div>`;
  if(box.innerHTML!==html)box.innerHTML=html;
  box.querySelectorAll('[data-fc47-date]').forEach(b=>b.onclick=()=>{state.date=b.dataset.fc47Date;render()});
  document.documentElement.dataset.fcMobileSchoolDay='v672';
  document.documentElement.dataset.fcMobileSchoolStart=days[0]?.date||today;
}
let timer;const insideOwnView=node=>{const el=node?.nodeType===1?node:node?.parentElement;return Boolean(el?.closest?.('.fc47-school-mobile'))};const obs=new MutationObserver(mutations=>{if(mutations.length&&mutations.every(m=>insideOwnView(m.target)))return;clearTimeout(timer);timer=setTimeout(render,35)});
function install(){if(!matchMedia(MOBILE).matches)return;const t=document.getElementById('today');if(!t){setTimeout(install,50);return}obs.observe(t,{childList:true,subtree:true});render();addEventListener('resize',render)}
window.__fcMobileSchoolDayV947={version:'9.67.2',render};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
