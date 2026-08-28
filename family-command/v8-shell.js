/* Family Command · V8 native shell · 2026-08-28 */
(()=>{
  'use strict';
  if(window.__fcV8ShellInstalled)return;window.__fcV8ShellInstalled=true;

  const svg={
    today:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 10.5 12 3l8.5 7.5v9A1.5 1.5 0 0 1 19 21h-4.5v-6h-5v6H5a1.5 1.5 0 0 1-1.5-1.5z"/></svg>',
    tomorrow:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3.5"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4"/></svg>',
    calendar:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M7 3v4M17 3v4M3.5 9.5h17M7 13h3M14 13h3M7 16.5h3"/></svg>',
    tasks:'<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="3.5" width="14" height="17" rx="2.3"/><path d="M8.2 10.2 10 12l3.4-3.5M8.2 16h7.5"/></svg>',
    more:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>'
  };

  const originalOpen=typeof window.openScreen==='function'?window.openScreen:null;
  const raw={
    today:typeof window.renderToday==='function'?window.renderToday:null,
    tomorrow:typeof window.renderTomorrow==='function'?window.renderTomorrow:null,
    week:typeof window.renderWeek==='function'?window.renderWeek:null,
    events:typeof window.renderEvents==='function'?window.renderEvents:null,
    homework:typeof window.renderHomeworkScreen==='function'?window.renderHomeworkScreen:null,
    more:typeof window.renderMore==='function'?window.renderMore:null,
    people:typeof window.renderPeople==='function'?window.renderPeople:null
  };
  let navRepair=false;

  function ensureScreens(){
    const main=document.querySelector('.content');if(!main)return;
    if(!document.getElementById('homework')){const s=document.createElement('section');s.id='homework';s.className='screen';const more=document.getElementById('more');more?main.insertBefore(s,more):main.appendChild(s)}
  }
  function navMarkup(){return `
    <button type="button" class="navbtn" data-screen="today"><span class="ico">${svg.today}</span><span>Heute</span></button>
    <button type="button" class="navbtn" data-screen="tomorrow"><span class="ico">${svg.tomorrow}</span><span>Morgen</span></button>
    <button type="button" class="navbtn" data-screen="events"><span class="ico">${svg.calendar}</span><span>Kalender</span></button>
    <button type="button" class="navbtn" data-screen="homework"><span class="ico">${svg.tasks}</span><span>Aufgaben</span></button>
    <button type="button" class="navbtn" data-screen="more"><span class="ico">${svg.more}</span><span>Mehr</span></button>`}
  function activeParent(id){if(id==='week')return'events';if(id==='people')return'more';return id}
  function setActiveNav(id){const parent=activeParent(id);document.querySelectorAll('.bottomnav-in .navbtn').forEach(b=>b.classList.toggle('active',b.dataset.screen===parent))}
  function ensureNav(){
    const n=document.querySelector('.bottomnav-in');if(!n)return;
    const valid=n.dataset.fcV8Nav==='1'&&n.children.length===5&&n.querySelector('[data-screen="events"]')&&n.querySelector('[data-screen="homework"]');
    if(valid){setActiveNav(document.querySelector('.screen.active')?.id||'today');return}
    navRepair=true;n.dataset.fcV8Nav='1';n.dataset.fcV7Nav='1';n.removeAttribute('data-fc-six-nav');n.innerHTML=navMarkup();
    n.querySelectorAll('.navbtn').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();open(b.dataset.screen)}));
    setActiveNav(document.querySelector('.screen.active')?.id||'today');navRepair=false;
  }

  function showOnly(id){
    document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('active',s.id===id));
    setActiveNav(id);
  }
  function invoke(fn,args=[]){try{return typeof fn==='function'?fn(...args):undefined}catch(e){console.error('fc_v8_render',e);return undefined}}
  function postSoon(id){requestAnimationFrame(()=>post(id));setTimeout(()=>post(id),40)}

  function addCalendarTabs(root,mode){
    if(!root)return;root.querySelectorAll('.v7-calendar-tabs,.v8-calendar-tabs').forEach(x=>x.remove());
    const page=root.querySelector('.v6-page,.fc-week-v2'),head=page?.querySelector('.v6-page-head');if(!page||!head)return;
    const h=head.querySelector('h1');if(h)h.textContent='Kalender';
    const tabs=document.createElement('div');tabs.className='v8-calendar-tabs';tabs.innerHTML=`<button type="button" class="${mode==='agenda'?'active':''}" data-v8-calendar="agenda">Agenda</button><button type="button" class="${mode==='week'?'active':''}" data-v8-calendar="week">Woche</button>`;
    tabs.querySelector('[data-v8-calendar="agenda"]').onclick=()=>open('events');tabs.querySelector('[data-v8-calendar="week"]').onclick=()=>open('week');head.after(tabs);
  }
  function cleanDay(root){
    if(!root)return;root.classList.add('v8-day');
    root.querySelectorAll('.fcp-today').forEach(x=>x.style.display='none');
    [...root.querySelectorAll('.v6-section')].forEach(sec=>{const title=(sec.querySelector('.v6-section-head h2')?.textContent||'').trim();if(/^Pendenzen$/i.test(title))sec.style.display='none'});
  }
  function cleanMore(root){
    if(!root)return;root.classList.add('v8-more');
    root.querySelectorAll('.v6-more-row,.v6-more-detail').forEach(x=>{if(/Family AI/i.test(x.textContent||''))x.style.display='none'});
  }
  function post(id){
    ensureScreens();ensureNav();
    const root=document.getElementById(id);if(!root)return;
    if(id==='today'||id==='tomorrow')cleanDay(root);
    if(id==='events'){root.querySelectorAll('.fc-future-events').forEach(x=>x.style.display='none');addCalendarTabs(root,'agenda')}
    if(id==='week')addCalendarTabs(root,'week');
    if(id==='more')cleanMore(root);
    try{window.__fcV8?.enhance?.()}catch(e){}
    document.documentElement.dataset.fcV8Native='1';setActiveNav(id);
  }

  function render(id,...args){
    const fn=raw[id];const out=invoke(fn,args);if(out&&typeof out.then==='function')return out.finally(()=>postSoon(id));postSoon(id);return out;
  }
  function open(id){
    ensureScreens();
    const known=['today','tomorrow','week','events','homework','more','people'];
    if(!known.includes(id)&&originalOpen){const out=invoke(originalOpen,[id]);setTimeout(ensureNav,0);return out}
    showOnly(id);
    if(id==='today')render('today');
    else if(id==='tomorrow')render('tomorrow');
    else if(id==='week')render('week');
    else if(id==='events')render('events');
    else if(id==='homework')render('homework');
    else if(id==='more')render('more');
    else if(id==='people'){if(raw.people)render('people');else if(originalOpen)invoke(originalOpen,['people'])}
    try{window.scrollTo({top:0,behavior:'smooth'})}catch(e){window.scrollTo(0,0)}
  }

  function installRenderWrappers(){
    if(raw.today){window.renderToday=(...a)=>render('today',...a);try{renderToday=window.renderToday}catch(e){}}
    if(raw.tomorrow){window.renderTomorrow=(...a)=>render('tomorrow',...a);try{renderTomorrow=window.renderTomorrow}catch(e){}}
    if(raw.week){window.renderWeek=(...a)=>render('week',...a);try{renderWeek=window.renderWeek}catch(e){}}
    if(raw.events){window.renderEvents=(...a)=>render('events',...a);try{renderEvents=window.renderEvents}catch(e){}}
    if(raw.homework){window.renderHomeworkScreen=(...a)=>render('homework',...a);try{renderHomeworkScreen=window.renderHomeworkScreen}catch(e){}}
    if(raw.more){window.renderMore=(...a)=>render('more',...a);try{renderMore=window.renderMore}catch(e){}}
    window.v6OpenHomework=()=>open('homework');
  }
  function observeNav(){const n=document.querySelector('.bottomnav-in');if(!n||n.dataset.fcV8Observed)return;n.dataset.fcV8Observed='1';new MutationObserver(()=>{if(!navRepair)requestAnimationFrame(ensureNav)}).observe(n,{childList:true,subtree:true,attributes:true,attributeFilter:['data-fc-six-nav','data-fc-v7-nav','data-fc-v8-nav']})}
  function install(){ensureScreens();ensureNav();installRenderWrappers();observeNav();window.openScreen=open;try{openScreen=open}catch(e){};const active=document.querySelector('.screen.active')?.id||'today';postSoon(active);document.documentElement.dataset.fcV8Native='1'}

  window.__fcV8Shell={version:'8.1',open,ensureNav,post,install};
  install();setTimeout(()=>{ensureNav();post(document.querySelector('.screen.active')?.id||'today')},120);
})();
