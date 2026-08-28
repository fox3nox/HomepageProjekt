/* Family Command · V7 clarity layer · 2026-08-28 */
(()=>{
  'use strict';
  if(window.__fcV7Installed)return;window.__fcV7Installed=true;
  const legacy={open:window.openScreen,today:window.renderToday,tomorrow:window.renderTomorrow,week:window.renderWeek,events:window.renderEvents,homework:window.renderHomeworkScreen,more:window.renderMore};
  let busy=false;
  const svg={
    today:'<svg viewBox="0 0 24 24"><path d="M3.5 10.5 12 3l8.5 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-4.5v-6h-5v6H5a1.5 1.5 0 0 1-1.5-1.5z"/></svg>',
    tomorrow:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.5"/><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4"/></svg>',
    calendar:'<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M7 3v4M17 3v4M3.5 9.5h17M7 13h3M14 13h3M7 16.5h3"/></svg>',
    tasks:'<svg viewBox="0 0 24 24"><rect x="5" y="3.5" width="14" height="17" rx="2.3"/><path d="M8.2 10.2 10 12l3.4-3.5M8.2 16h7.5"/></svg>',
    more:'<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/></svg>'
  };
  function nav(){
    const n=document.querySelector('.bottomnav-in');if(!n)return;
    if(n.dataset.fcV7Nav==='1'&&n.children.length===5)return;
    n.dataset.fcV7Nav='1';
    n.innerHTML=`<button class="navbtn" type="button" data-screen="today"><span class="ico">${svg.today}</span><span>Heute</span></button><button class="navbtn" type="button" data-screen="tomorrow"><span class="ico">${svg.tomorrow}</span><span>Morgen</span></button><button class="navbtn" type="button" data-screen="events"><span class="ico">${svg.calendar}</span><span>Kalender</span></button><button class="navbtn" type="button" data-screen="homework"><span class="ico">${svg.tasks}</span><span>Aufgaben</span></button><button class="navbtn" type="button" data-screen="more"><span class="ico">${svg.more}</span><span>Mehr</span></button>`;
    n.querySelectorAll('.navbtn').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();open(b.dataset.screen)}));
    activeNav(document.querySelector('.screen.active')?.id||'today');
  }
  function activeNav(id){const parent=id==='week'?'events':id;document.querySelectorAll('.bottomnav-in .navbtn').forEach(b=>b.classList.toggle('active',b.dataset.screen===parent));}
  function open(id){
    try{legacy.open?.(id)}catch(e){console.error('fc_v7_open',e)}
    if(id==='today')renderToday();else if(id==='tomorrow')renderTomorrow();else if(id==='events')renderEvents();else if(id==='homework')renderHomework();else if(id==='week')renderWeek();else if(id==='more')renderMore();
    activeNav(id);try{scrollTo({top:0,behavior:'smooth'})}catch(e){}
  }
  function compact(root){
    if(!root)return;const page=root.querySelector('.v6-page');page?.classList.add('v7-day-page');
    const sections=[...root.querySelectorAll('.v6-section')],kids=sections.find(s=>/Kinder/.test(s.querySelector('h2')?.textContent||'')),focus=root.querySelector('.v6-focus'),todo=root.querySelector('.fc-todo-card'),daily=root.querySelector('.fc-daily-check');
    kids?.classList.add('v7-kids-section');kids?.querySelector('.v6-section-head>span')?.remove();root.querySelector('.v6-kids')?.classList.add('v7-kids-group');
    root.querySelectorAll('.v6-kid').forEach(card=>{card.classList.add('v7-kid-row');const chip=card.querySelector('.v6-chip');if(chip&&/Schule/i.test(chip.textContent||''))chip.remove();const grid=card.querySelector('.v6-time-grid');if(grid&&!card.querySelector('.v7-kid-line')){const cells=[...grid.querySelectorAll('.v6-time-cell')],v=i=>cells[i]?.querySelector('b')?.textContent?.trim()||'—',line=document.createElement('div');line.className='v7-kid-line';line.innerHTML=`<strong>${v(0)} los</strong><span>${v(1)}–${v(2)}</span>`;grid.replaceWith(line)}const free=card.querySelector('.v6-kid-free');if(free){free.classList.add('v7-free');if(/keine feste/i.test(free.textContent||''))free.textContent='Frei · keine feste Schulzeit'}});
    if(todo){todo.classList.add('v7-todo');todo.classList.toggle('v7-empty',!todo.querySelector('.fc-todo-row'))}
    if(page&&focus&&kids&&kids.previousElementSibling!==focus)page.insertBefore(focus,kids);if(todo&&kids&&kids.nextElementSibling!==todo)kids.after(todo);if(daily){daily.classList.add('v7-daily');if(todo&&todo.nextElementSibling!==daily)todo.after(daily);else if(!todo&&kids&&kids.nextElementSibling!==daily)kids.after(daily)}
    sections.forEach(s=>{if(s.querySelector('.v6-empty'))s.classList.add('v7-quiet');if(/Pendenzen/i.test(s.querySelector('h2')?.textContent||''))s.classList.add('v7-hide')});root.querySelectorAll('.fcp-today').forEach(x=>x.classList.add('v7-hide'));
  }
  function calendarTabs(root,mode){if(!root)return;root.querySelector('.v7-calendar-tabs')?.remove();const page=root.querySelector('.v6-page,.fc-week-v2');if(!page)return;const head=page.querySelector('.v6-page-head');const tabs=document.createElement('div');tabs.className='v7-calendar-tabs';tabs.innerHTML=`<button type="button" class="${mode==='agenda'?'active':''}">Agenda</button><button type="button" class="${mode==='week'?'active':''}">Woche</button>`;tabs.children[0].onclick=()=>open('events');tabs.children[1].onclick=()=>open('week');head?.after(tabs);if(mode==='agenda'){const h=head?.querySelector('h1');if(h)h.textContent='Kalender'}activeNav(mode==='week'?'week':'events')}
  function weekClean(){const root=document.getElementById('week');calendarTabs(root,'week');root?.classList.add('v7-week-clean');}
  function eventsClean(){const root=document.getElementById('events');calendarTabs(root,'agenda');root?.classList.add('v7-events-clean');}
  function moreClean(){const root=document.getElementById('more');root?.classList.add('v7-more-clean');root?.querySelectorAll('.v6-more-row,.v6-more-detail').forEach(x=>{const t=(x.textContent||'').toLowerCase();if(t.includes('family ai'))x.classList.add('v7-hide')});}
  function renderToday(){const r=legacy.today?.();setTimeout(()=>{window.__fcTodo?.render?.();window.__fcDailyChecklist?.render?.();compact(document.getElementById('today'));activeNav('today')},0);return r}
  function renderTomorrow(){const r=legacy.tomorrow?.();setTimeout(()=>{window.__fcTodo?.render?.();window.__fcDailyChecklist?.render?.();compact(document.getElementById('tomorrow'));activeNav('tomorrow')},0);return r}
  function renderWeek(){const r=legacy.week?.();setTimeout(weekClean,0);return r}
  function renderEvents(){const r=legacy.events?.();setTimeout(eventsClean,0);return r}
  function renderHomework(){const r=legacy.homework?.();setTimeout(()=>activeNav('homework'),0);return r}
  function renderMore(){const r=legacy.more?.();setTimeout(()=>{moreClean();activeNav('more')},0);return r}
  function observe(){['today','tomorrow'].forEach(id=>{const root=document.getElementById(id);if(!root||root.dataset.v7Obs)return;root.dataset.v7Obs='1';new MutationObserver(()=>{if(busy)return;busy=true;requestAnimationFrame(()=>{compact(root);busy=false})}).observe(root,{childList:true,subtree:true})});const n=document.querySelector('.bottomnav-in');if(n&&!n.dataset.v7Obs){n.dataset.v7Obs='1';new MutationObserver(()=>requestAnimationFrame(nav)).observe(n,{childList:true,subtree:true,attributes:true,attributeFilter:['data-screen']})}}
  function install(){nav();observe();window.openScreen=open;try{openScreen=open}catch(e){}window.renderToday=renderToday;try{renderToday=window.renderToday}catch(e){}window.renderTomorrow=renderTomorrow;try{renderTomorrow=window.renderTomorrow}catch(e){}window.renderWeek=renderWeek;try{renderWeek=window.renderWeek}catch(e){}window.renderEvents=renderEvents;try{renderEvents=window.renderEvents}catch(e){}window.renderHomeworkScreen=renderHomework;try{renderHomeworkScreen=window.renderHomeworkScreen}catch(e){}window.renderMore=renderMore;try{renderMore=window.renderMore}catch(e){}window.v6OpenHomework=()=>open('homework');const id=document.querySelector('.screen.active')?.id||'today';if(id==='today')renderToday();else if(id==='tomorrow')renderTomorrow();else if(id==='week')renderWeek();else if(id==='events')renderEvents();else if(id==='homework')renderHomework();else if(id==='more')renderMore();document.documentElement.dataset.fcV7='1'}
  window.__fcV7={version:'7.0',install};install();setTimeout(install,120);setTimeout(nav,700);
})();