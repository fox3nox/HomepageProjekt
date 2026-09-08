/* Familienzentrale V9.77 · Compact Family Cockpit */
(()=>{
'use strict';
if(window.__fcCompactCockpitV977)return;window.__fcCompactCockpitV977=true;

function hideEmptyTomorrowTodos(){
  const root=document.getElementById('tomorrow');if(!root)return;
  root.querySelectorAll('.fc9-empty').forEach(empty=>{
    if(!/keine persönlichen to-dos für morgen/i.test(String(empty.textContent||'')))return;
    const section=empty.closest('.fc9-section');
    if(section)section.classList.add('fc977-hide-empty');
    else empty.classList.add('fc977-hide-empty');
  });
}

function compactMore(){
  const root=document.getElementById('more');if(!root)return;
  const groups=[...root.querySelectorAll('.fc-more-group')];
  const manage=groups.find(g=>/planung\s*&\s*verwaltung/i.test(String(g.querySelector('h2')?.textContent||'')));
  if(manage&&!manage.dataset.fc977Ready){
    manage.dataset.fc977Ready='1';
    manage.classList.add('fc977-collapsible');
    const head=manage.querySelector('.fc9-section-head');
    const grid=manage.querySelector('.fc9-more-grid');
    if(head&&grid){
      const btn=document.createElement('button');
      btn.type='button';btn.className='fc977-manage-toggle';btn.setAttribute('aria-expanded','false');btn.textContent='Anzeigen';
      head.appendChild(btn);grid.hidden=true;
      btn.addEventListener('click',()=>{const show=grid.hidden;grid.hidden=!show;btn.setAttribute('aria-expanded',String(show));btn.textContent=show?'Ausblenden':'Anzeigen'});
    }
  }
}

function markScreens(){
  ['today','tomorrow','events','homework','more'].forEach(id=>document.getElementById(id)?.classList.add('fc977-compact'));
}

function enhance(screen){markScreens();if(screen==='tomorrow')hideEmptyTomorrowTodos();if(screen==='more')compactMore();document.documentElement.dataset.fcCompactCockpit='v977'}

document.addEventListener('fc:v9:render',e=>enhance(e.detail?.screen));
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>enhance('today'),{once:true});else enhance('today');
window.__fcCompactCockpitV977API={version:'9.77.0',enhance,hideEmptyTomorrowTodos,compactMore};
})();
