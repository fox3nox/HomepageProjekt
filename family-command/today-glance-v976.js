/* Familienzentrale V9.76 · event-centric one-glance briefing */
(()=>{
'use strict';
if(window.__fcTodayGlanceV976)return;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const D=()=>{try{return typeof data!=='undefined'&&data?data:{}}catch(_){return{}}};
const person=id=>(D().people||[]).find(p=>String(p.id)===String(id))||null;
const today=()=>{try{return typeof todayISO==='function'?todayISO():new Date().toISOString().slice(0,10)}catch(_){return new Date().toISOString().slice(0,10)}};
const events=()=>{try{return typeof eventsOn==='function'?eventsOn(today()):(D().events||[]).filter(e=>String(e.date||'')===today())}catch(_){return[]}};
const remaining=e=>{try{return !window.__fcV9?.eventIsPast?.(e)}catch(_){return true}};
const icon=e=>/fahrrad|velo|radfahr/i.test(e.title||'')?'🚲':/telefon|gespräch/i.test(e.title||'')?'☎️':/turn|sport/i.test(e.title||'')?'👟':/schwimm/i.test(e.title||'')?'🏊':'•';
const shortTitle=e=>`${icon(e)} ${e.time?`${e.time} `:''}${String(e.title||'Termin').trim()}`;
function importantEvents(){return events().filter(remaining).filter(e=>e.time||/fahrrad|velo|prüfung|test|gespräch|termin|ausflug|bummel|schwimm|turn|arzt|ambul|betreuung|tagesschule/i.test(`${e.title||''} ${e.note||''}`)).slice(0,5)}
function renderFocus(root,list){
  const focus=root.querySelector('.fc38-focus');if(!focus)return;
  focus.querySelector('.fc976-next-line')?.remove();
  const primary=String(focus.querySelector('b')?.textContent||'').toLocaleLowerCase('de');
  const extra=list.filter(e=>!primary.includes(String(e.title||'').toLocaleLowerCase('de'))).slice(0,2);
  if(!extra.length)return;
  const line=document.createElement('span');line.className='fc976-next-line';line.innerHTML=`<b>HEUTE AUCH</b> ${extra.map(e=>esc(shortTitle(e))).join(' · ')}`;focus.appendChild(line);
}
function renderChildren(root,list){
  root.querySelectorAll('.fc976-child-events').forEach(x=>x.remove());
  for(const row of root.querySelectorAll('.fc38-child[data-focus-child]')){
    const id=String(row.dataset.focusChild||''),mine=list.filter(e=>(e.personIds||[]).map(String).includes(id)).slice(0,2);if(!mine.length)continue;
    const content=row.querySelector(':scope>div');if(!content)continue;
    const line=document.createElement('div');line.className='fc976-child-events';line.innerHTML=mine.map(e=>`<span>${esc(shortTitle(e))}</span>`).join('');content.appendChild(line);
  }
}
function render(){const root=document.querySelector('#today .fc38-dashboard');if(!root)return;const list=importantEvents();renderFocus(root,list);renderChildren(root,list);document.documentElement.dataset.fcTodayGlance='v976'}
let timer;const schedule=()=>{clearTimeout(timer);timer=setTimeout(render,30)};
document.addEventListener('fc:v9:render',e=>{if(e.detail?.screen==='today')schedule()});if(typeof addEventListener==='function'){addEventListener('fc:cloud-status',schedule);addEventListener('pageshow',schedule)}
window.__fcTodayGlanceV976={version:'9.76.1',render,importantEvents};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
})();
