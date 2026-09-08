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
const work=()=>{const d=today(),todos=allTodos().filter(x=>x&&!x.done&&!x.archived&&String(x.date||'')<=d),home=(D().homework||[]).filter(x=>x&&!x.done&&!x.archived&&String(x.dueDate||'')<=d);return [...todos,...home]};
function openEvents(){document.querySelector('.fc9-nav button[data-screen="events"]')?.click()}
function openPendency(id){
  document.querySelector('.fc9-nav button[data-screen="more"]')?.click();
  const target=[...document.querySelectorAll('#more [data-pend]')].find(x=>!id||x.dataset.pend===id);
  target?.scrollIntoView({block:'center'});target?.focus({preventScroll:true});
}
function compactHeader(root){
  const bar=root.querySelector('.fc38-daybar p');if(!bar)return;
  const base=bar.dataset.fc978BaseStatus||bar.textContent;bar.dataset.fc978BaseStatus=base;
  const count=pendencies().length;bar.textContent=count?`${base} · ${count} ${count===1?'Pendenz':'Pendenzen'}`:base;
}
function priorityDigest(root){
  const box=root.querySelector('.fc38-priority');if(!box)return;
  // The next event already appears in the focus; the canonical day list keeps full details.
  root.querySelector('.fc978-today-detail')?.setAttribute('aria-label','HEUTE UNBEDINGT WISSEN');
  box.querySelector('.fc978-digest')?.remove();
  const pd=pendencies();if(!pd.length)return;
  const digest=document.createElement('div');digest.className='fc978-digest';
  if(pd.length){
    const group=document.createElement('div');group.className='fc978-pendencies';
    group.innerHTML=`<div class="fc978-digest-head"><span>BLEIBT OFFEN, BIS ERLEDIGT</span>${pd.length>3?`<button type="button" data-pendencies="${esc(pd[3].id)}" aria-label="${pd.length-3} weitere Pendenzen anzeigen">+${pd.length-3}</button>`:''}</div>${pd.slice(0,3).map(p=>`<button type="button" class="fc978-pendency" data-pendencies="${esc(p.id)}"><span>OFFEN</span><b>${esc(p.title||'Pendenz')}</b>${p.amount!=null?`<strong>${esc(p.currency||'CHF')} ${esc(p.amount)}</strong>`:''}</button>`).join('')}`;
    group.querySelectorAll('[data-pendencies]').forEach(b=>b.onclick=()=>openPendency(b.dataset.pendencies));digest.appendChild(group);
  }
  box.appendChild(digest);
}
function childEvents(root){
  const ev=events();
  root.querySelectorAll('.fc38-child[data-focus-child]').forEach(row=>{
    row.querySelector('.fc978-child-events')?.remove();
    const prepared=new Set([...row.querySelectorAll('[data-preparation-event]')].map(x=>x.dataset.preparationEvent));
    const mine=ev.filter(e=>(e.personIds||[]).map(String).includes(row.dataset.focusChild)&&!prepared.has(String(e.id)));
    if(!mine.length)return;
    const wrap=document.createElement('div');wrap.className='fc978-child-events';
    wrap.innerHTML=mine.slice(0,2).map(e=>`<button type="button" data-event="${esc(e.id)}"><span>${esc(e.time||'Heute')}</span><b>${esc(e.title||'Termin')}</b></button>`).join('')+(mine.length>2?`<button type="button" data-events aria-label="${mine.length-2} weitere Termine anzeigen">+ ${mine.length-2} weitere Termine</button>`:'');
    row.querySelector('div')?.appendChild(wrap);
    wrap.querySelectorAll('[data-event]').forEach(b=>b.onclick=event=>{event.stopPropagation();window.fcOpenEventDetails?.(b.dataset.event)});
    wrap.querySelector('[data-events]')?.addEventListener('click',event=>{event.stopPropagation();openEvents()});
  });
}
function enhance(){
  const root=document.querySelector('#today > .fc38-dashboard');if(!root)return false;
  compactHeader(root);priorityDigest(root);childEvents(root);
  root.querySelector('.fc38-upcoming')?.classList.add('fc978-upcoming-detail');
  document.documentElement.dataset.fcZeroMiss='v978';return true;
}
// The canonical renderer owns updates, including minute ticks, resume and cloud state.
document.addEventListener('fc:today:render',enhance);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance,{once:true});else enhance();
window.__fcZeroMissV978API={version:'9.78.1',enhance,events,pendencies,work};
})();
