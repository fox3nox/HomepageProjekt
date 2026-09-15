/* Familienzentrale V9.78 · read-only extensions of the canonical Today renderer. */
(()=>{
'use strict';
if(window.__fcZeroMissV978)return;window.__fcZeroMissV978=true;
const D=()=>{try{return typeof data!=='undefined'&&data?data:{}}catch(_){return{}}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>{try{return typeof todayISO==='function'?todayISO():new Date().toISOString().slice(0,10)}catch(_){return new Date().toISOString().slice(0,10)}};
const isPast=e=>{try{return !!window.__fcV9?.eventIsPast?.(e)}catch(_){return false}};
const events=()=> (D().events||[]).filter(e=>e&&(e.date===today()||(e.endDate&&e.date<=today()&&e.endDate>=today()))&&!isPast(e)).sort((a,b)=>String(a.time||'99:99').localeCompare(String(b.time||'99:99')));
// Tasks and pendencies have independent completion state. Similar titles are not identities.
const pendencies=()=> (D().pendencies||[]).filter(p=>p&&!p.done);
function allTodos(){const m=new Map(),add=arr=>{for(const t of Array.isArray(arr)?arr:[]){if(!t)continue;const key=String(t.sourceCommandId||t.clientRef||t.id||`${t.date}|${t.title}`);m.set(key,{...(m.get(key)||{}),...t})}};try{add(window.__fcChatCommandSync?.all?.())}catch(_){}add(D().todos);return[...m.values()]}
const work=()=>{const d=today(),todos=allTodos().filter(x=>x&&!x.done&&!x.archived&&!window.__fcPersonIdentity?.isMoneyNote?.(x)&&String(x.date||'')<=d),home=(D().homework||[]).filter(x=>x&&!x.done&&!x.archived&&String(x.dueDate||'')<=d);return [...todos,...home]};
function enhance(){
  const root=document.querySelector('#today > .fc38-dashboard');if(!root)return false;
  // Money and pendencies have one home in Familie; never repeat the records on Today.
  root.querySelector('.fc978-digest')?.remove();
  root.querySelector('.fc38-upcoming')?.classList.add('fc978-upcoming-detail');
  document.documentElement.dataset.fcZeroMiss='v982';return true;
}
// The canonical renderer owns updates, including minute ticks, resume and cloud state.
document.addEventListener('fc:today:render',enhance);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance,{once:true});else enhance();
window.__fcZeroMissV978API={version:'9.82.0',enhance,events,pendencies,work};
})();
