/* Familienzentrale V9.35 · mobile reference-layout only; data/state untouched */
(()=>{
'use strict';
if(window.__fcReferenceMobileV35)return;window.__fcReferenceMobileV35=true;
const root=document.documentElement;
function sectionBy(page,selector){return [...page.querySelectorAll(':scope > .fc9-section')].find(s=>s.querySelector(selector))||null}
function setHeading(sec,title,subtitle=''){
  const h=sec?.querySelector('.fc9-section-head h2');if(!h)return;
  h.textContent=title;
  sec.querySelector('.fc35-subtitle')?.remove();
  if(subtitle){const s=document.createElement('span');s.className='fc35-subtitle';s.textContent=subtitle;h.after(s)}
}
function decorate(){
  const page=document.querySelector('#today .fc9-page');
  if(!page||!document.querySelector('#today')?.classList.contains('active'))return;
  const head=page.querySelector(':scope > .fc9-pagehead');
  head?.classList.add('fc35-daybar');
  const todo=sectionBy(page,'[data-todo]');
  const events=sectionBy(page,'[data-event]');
  const tomorrow=sectionBy(page,'.fc9-tomorrow');
  const people=sectionBy(page,'.fc9-person-list,.fc9-person');
  const homework=sectionBy(page,'[data-homework]');
  if(todo){todo.classList.add('fc35-priority-section');setHeading(todo,'Heute','Das Wichtigste zuerst')}
  if(events){events.classList.add('fc35-timeline-section');setHeading(events,'Heute','im Überblick')}
  if(tomorrow){tomorrow.classList.add('fc35-tomorrow-section');setHeading(tomorrow,'Morgen','Vorschau')}
  if(people){people.classList.add('fc35-school-section');setHeading(people,'Schule & Wichtiges')}
  if(homework){homework.classList.add('fc35-homework-section');setHeading(homework,'Aufgaben & Schule')}
  const order=[todo,events,tomorrow,people,homework].filter(Boolean);
  let anchor=head;
  for(const sec of order){if(anchor&&anchor.nextElementSibling!==sec)anchor.after(sec);anchor=sec}
  root.dataset.fcReferenceLayout='v35';
}
let queued=false;
function schedule(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;decorate()})}
window.addEventListener('fc9:render',schedule);
window.addEventListener('pageshow',schedule);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});
const observer=new MutationObserver(m=>{if(m.some(x=>x.type==='childList'&&x.target.closest?.('#today')))schedule()});
function start(){decorate();const today=document.querySelector('#today');if(today)observer.observe(today,{childList:true,subtree:false})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
