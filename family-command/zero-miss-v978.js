/* Familienzentrale V9.78 · Zero-Miss dashboard consolidation */
(()=>{
'use strict';
if(window.__fcZeroMissV978)return;window.__fcZeroMissV978=true;
const D=()=>{try{return typeof data!=='undefined'&&data?data:{}}catch(_){return{}}};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const today=()=>{try{return typeof todayISO==='function'?todayISO():new Date().toISOString().slice(0,10)}catch(_){return new Date().toISOString().slice(0,10)}};
const person=id=>(D().people||[]).find(p=>String(p.id)===String(id));
const personNames=e=>(e.personIds||[]).map(id=>person(id)?.name).filter(Boolean).join(' · ');
const isPast=e=>{try{return !!window.__fcV9?.eventIsPast?.(e)}catch(_){return false}};
const events=()=>{const d=today();return(D().events||[]).filter(e=>String(e.date||'')===d||(e.endDate&&String(e.date||'')<=d&&String(e.endDate)>=d)).filter(e=>!isPast(e)).sort((a,b)=>String(a.time||'99:99').localeCompare(String(b.time||'99:99')))};
const pendencies=()=>Array.isArray(D().pendencies)?D().pendencies.filter(p=>p&&!p.done):[];
const work=()=>{const d=today(),todos=(D().todos||[]).filter(x=>x&&!x.done&&!x.archived&&String(x.date||'')<=d),home=(D().homework||[]).filter(x=>x&&!x.done&&!x.archived&&String(x.dueDate||'')<=d);return [...todos,...home]};
const specialEvent=e=>!!(e.time||/prüfung|test|velo|fahrrad|telefon|gespräch|arzt|ambul|therap|ausflug|bummel|schwimm|turn|eltern|besprech|termin/i.test(`${e.title||''} ${e.note||''}`));
const eventText=e=>[e.time||'Heute',personNames(e),e.title||'Termin'].filter(Boolean).join(' · ');
function openEvents(){document.querySelector('.fc9-nav button[data-screen="events"]')?.click()}
function openMore(){document.querySelector('.fc9-nav button[data-screen="more"]')?.click()}
function compactHeader(root){const bar=root.querySelector('.fc38-daybar p');if(!bar)return;const p=pendencies().length,e=events().length,w=work().length,bits=[];if(w)bits.push(`${w} offen`);if(e)bits.push(`${e} ${e===1?'Termin':'Termine'}`);if(p)bits.push(`${p} ${p===1?'Pendenz':'Pendenzen'}`);bar.textContent=bits.length?bits.join(' · '):'Alles Wichtige im Blick'}
function priorityDigest(root){const box=root.querySelector('.fc38-priority');if(!box)return;box.querySelector('.fc978-digest')?.remove();const ev=events().filter(specialEvent),pd=pendencies();if(!ev.length&&!pd.length)return;const digest=document.createElement('div');digest.className='fc978-digest';const eventRows=ev.slice(0,4).map(e=>`<button type="button" class="fc978-digest-row" data-event="${esc(e.id)}"><span class="fc978-time">${esc(e.time||'HEUTE')}</span><span><b>${esc(e.title||'Termin')}</b><small>${esc(personNames(e)||'Familie')}</small></span></button>`).join('');const pendRows=pd.slice(0,3).map(p=>`<button type="button" class="fc978-pendency" data-pendencies><span>OFFEN</span><b>${esc(p.title||'Pendenz')}</b>${p.amount!=null?`<strong>${esc(p.currency||'CHF')} ${esc(p.amount)}</strong>`:''}</button>`).join('');digest.innerHTML=`${eventRows?`<div class="fc978-digest-group"><div class="fc978-digest-head"><span>HEUTE UNBEDINGT WISSEN</span>${ev.length>4?`<button type="button" data-events>+${ev.length-4}</button>`:''}</div>${eventRows}</div>`:''}${pendRows?`<div class="fc978-pendencies"><div class="fc978-digest-head"><span>BLEIBT OFFEN, BIS ERLEDIGT</span>${pd.length>3?`<button type="button" data-pendencies>+${pd.length-3}</button>`:''}</div>${pendRows}</div>`:''}`;
 const focus=box.querySelector('.fc38-focus');(focus||box.querySelector('header'))?.insertAdjacentElement('afterend',digest);digest.querySelectorAll('[data-event]').forEach(b=>b.onclick=()=>window.fcOpenEventDetails?.(b.dataset.event));digest.querySelector('[data-events]')?.addEventListener('click',openEvents);digest.querySelectorAll('[data-pendencies]').forEach(b=>b.addEventListener('click',openMore));}
function childEvents(root){const ev=events();root.querySelectorAll('.fc38-child[data-focus-child]').forEach(row=>{row.querySelector('.fc978-child-events')?.remove();const id=row.getAttribute('data-focus-child'),mine=ev.filter(e=>(e.personIds||[]).some(x=>String(x)===String(id))&&specialEvent(e));if(!mine.length)return;const wrap=document.createElement('div');wrap.className='fc978-child-events';wrap.innerHTML=mine.slice(0,2).map(e=>`<button type="button" data-event="${esc(e.id)}"><span>${esc(e.time||'Heute')}</span><b>${esc(e.title||'Termin')}</b></button>`).join('');row.querySelector('div')?.appendChild(wrap);wrap.querySelectorAll('[data-event]').forEach(b=>b.onclick=event=>{event.stopPropagation();window.fcOpenEventDetails?.(b.dataset.event)})})}
function removeLegacyGlance(root){root.querySelectorAll('.fc976-glance').forEach(x=>x.remove())}
function markDetailPanels(root){const panels=[...root.querySelectorAll('.fc38-panel')];for(const p of panels){const title=p.querySelector('h2')?.textContent?.trim();if(title==='Heute noch')p.classList.add('fc978-today-detail');if(title==='Danach im Blick')p.classList.add('fc978-upcoming-detail')}}
function enhance(){const root=document.querySelector('#today .fc38-dashboard');if(!root)return false;removeLegacyGlance(root);compactHeader(root);priorityDigest(root);childEvents(root);markDetailPanels(root);document.documentElement.dataset.fcZeroMiss='v978';return true}
let timer=0;const schedule=()=>{clearTimeout(timer);timer=setTimeout(enhance,35)};
document.addEventListener('fc:v9:render',e=>{if(!e.detail?.screen||e.detail.screen==='today')schedule()});addEventListener('fc:cloud-status',schedule);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',schedule,{once:true});else schedule();
window.__fcZeroMissV978API={version:'9.78.0',enhance,events,pendencies,work};
})();
