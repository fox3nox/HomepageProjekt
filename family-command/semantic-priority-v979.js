/* Familienzentrale V9.79 · semantic priority + unmistakable person identity */
(()=>{
'use strict';
if(window.__fcSemanticPriorityV979)return;window.__fcSemanticPriorityV979=true;
const D=()=>{try{return typeof data!=='undefined'&&data?data:{}}catch(_){return{}}};
const P=id=>(D().people||[]).find(p=>String(p.id)===String(id));
const color=id=>P(id)?.color||({jayden:'#2563eb',fynn:'#b45309',eliyah:'#059669',oli:'#111827'}[id]||'#64748b');
const name=id=>P(id)?.name||({jayden:'Jayden',fynn:'Fynn',eliyah:'Eliyah',oli:'Oli'}[id]||'Familie');
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function personBadge(id){return `<span class="fc979-person" style="--person:${esc(color(id))}"><i>${esc(name(id).charAt(0))}</i><b>${esc(name(id))}</b></span>`}
function pidForHomework(row){const id=row.getAttribute('data-homework-id')||row.dataset.homework||row.dataset.id;const h=(D().homework||[]).find(x=>String(x.id)===String(id));if(h?.personId)return h.personId;const text=String(row.textContent||'');return ['jayden','fynn','eliyah','oli'].find(id=>new RegExp(`\\b${name(id)}\\b`,'i').test(text))||''}
function decorateHomework(){const root=document.getElementById('homework');if(!root)return;const rows=[...root.querySelectorAll('[data-homework-id], [data-homework], .fc9-task-row, .fc9-homework-row, .fc-task')];for(const row of rows){if(row.dataset.fc979Person)return;const pid=pidForHomework(row);if(!pid)continue;row.dataset.fc979Person=pid;row.style.setProperty('--fc-person',color(pid));const copy=row.querySelector('.fc9-task-copy,.fc9-task-main,.fc-task-copy')||row.querySelector('div:nth-of-type(1)')||row;const badge=document.createElement('div');badge.className='fc979-personline';badge.innerHTML=personBadge(pid);copy.prepend(badge)}}
function demoteMoney(){const root=document.querySelector('#today .fc38-priority');if(!root)return;root.querySelectorAll('.fc38-task').forEach(row=>{const text=String(row.textContent||'');row.classList.toggle('fc979-money',/schuldet mir|CHF\s*\d/i.test(text))});const digest=root.querySelector('.fc978-pendencies');if(digest)digest.classList.add('fc979-secondary')}
function markImportant(){const root=document.getElementById('today');if(!root)return;root.querySelectorAll('.fc38-event,.fc978-child-events button,.fc38-event-preparation').forEach(x=>x.classList.add('fc979-important'))}
function enhance(screen){if(!screen||screen==='homework')decorateHomework();if(!screen||screen==='today'){demoteMoney();markImportant()}document.documentElement.dataset.fcSemanticPriority='v979'}
document.addEventListener('fc:v9:render',e=>queueMicrotask(()=>enhance(e.detail?.screen)));document.addEventListener('fc:today:render',()=>queueMicrotask(()=>enhance('today')));if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>enhance(),{once:true});else enhance();
window.__fcSemanticPriorityV979API={version:'9.79.0',enhance};
})();
