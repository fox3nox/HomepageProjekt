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
  root.querySelector('.fc978-digest')?.remove();
  const pd=pendencies();if(!pd.length)return;
  const digest=document.createElement('div');digest.className='fc978-digest';
  if(pd.length){
    const group=document.createElement('div'),currencies=[...new Set(pd.filter(p=>Number(p.amount)>0).map(p=>p.currency||'CHF'))],total=pd.reduce((sum,p)=>sum+(Number(p.amount)||0),0),labels=pd.slice(0,2).map(p=>`${p.title||'Pendenz'}${Number(p.amount)>0?` · ${p.currency||'CHF'} ${Number(p.amount).toFixed(0)}`:''}`);
    group.className='fc978-pendencies';
    group.innerHTML=`<div class="fc978-digest-head"><span>BLEIBT OFFEN, BIS ERLEDIGT</span></div><button type="button" class="fc978-pendency fc978-pendency-summary" data-pendencies="${esc(pd[0].id)}"><span>${pd.length} OFFEN</span><b>${esc(labels.join(' · '))}${pd.length>2?` · +${pd.length-2}`:''}</b>${total>0&&currencies.length===1?`<strong>${esc(currencies[0])} ${esc(total.toFixed(0))}</strong>`:''}</button>`;
    group.querySelector('[data-pendencies]').onclick=()=>openPendency(pd[0].id);digest.appendChild(group);
  }
  root.querySelector('.fc38-school')?.before(digest);
}
function enhance(){
  const root=document.querySelector('#today > .fc38-dashboard');if(!root)return false;
  compactHeader(root);priorityDigest(root);
  root.querySelector('.fc38-upcoming')?.classList.add('fc978-upcoming-detail');
  document.documentElement.dataset.fcZeroMiss='v982';return true;
}
// The canonical renderer owns updates, including minute ticks, resume and cloud state.
document.addEventListener('fc:today:render',enhance);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',enhance,{once:true});else enhance();
window.__fcZeroMissV978API={version:'9.82.0',enhance,events,pendencies,work};
})();
