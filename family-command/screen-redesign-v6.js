/* Family Command · screen architecture v6 · 2026-08-24 */
(()=>{
  if(window.__fcScreenRedesignV6)return;window.__fcScreenRedesignV6=true;

  const MONTHS=['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
  const WEEK=['So','Mo','Di','Mi','Do','Fr','Sa'];
  const WEEK_LONG=['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const q=s=>JSON.stringify(String(s??''));
  const today=()=>typeof todayISO==='function'?todayISO():new Date().toISOString().slice(0,10);
  const dObj=s=>new Date(String(s)+'T12:00:00');
  const iso=d=>{const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`};
  const fmt=(s,opts={})=>{try{return new Intl.DateTimeFormat('de-CH',{day:'numeric',month:opts.long?'long':'short',year:opts.year?'numeric':undefined,weekday:opts.weekday?'short':undefined}).format(dObj(s)).replace(',','')}catch(e){return s}};
  const longDate=s=>{try{return new Intl.DateTimeFormat('de-CH',{weekday:'long',day:'numeric',month:'long'}).format(dObj(s))}catch(e){return s}};
  const personBy=id=>{try{return typeof person==='function'?person(id):(data?.people||[]).find(p=>String(p.id)===String(id))}catch(e){return null}};
  const eventPeople=e=>(e?.personIds||[]).map(personBy).filter(Boolean);
  const childPeople=()=>Array.isArray(data?.people)?data.people.filter(p=>p.id!=='oli'):[];
  const minutes=t=>/^\d\d:\d\d$/.test(String(t||''))?Number(String(t).slice(0,2))*60+Number(String(t).slice(3,5)):9999;
  const nowMinutes=()=>{const d=new Date();return d.getHours()*60+d.getMinutes()};
  const schedule=(pid,day)=>{try{return typeof scheduleFor==='function'?(scheduleFor(pid,day)||[]):((data?.schedules?.[pid]?.[day])||[])}catch(e){return[]}};
  const reminderRows=day=>{try{return typeof remindersFor==='function'?(remindersFor(day)||[]):(data?.reminders||[]).filter(r=>(r.days||[]).includes(day))}catch(e){return[]}};
  const holiday=(pid,date)=>{try{return typeof schoolBreakFor==='function'?schoolBreakFor(pid,date):(typeof schoolHolidayOn==='function'?schoolHolidayOn(date):null)}catch(e){return null}};
  const eventsAt=date=>{try{return typeof eventsOn==='function'?(eventsOn(date)||[]):(data?.events||[]).filter(e=>e.date===date||((e.endDate||'')&&e.date<=date&&e.endDate>=date))}catch(e){return[]}};
  const colorFor=id=>personBy(id)?.color||({jayden:'#2f80ff',fynn:'#ff9000',eliyah:'#19b67a',oli:'#7e8fa7'}[id]||'#718198');
  const saveAll=()=>{try{if(typeof save==='function')save()}catch(e){console.error('fc_v6_save',e)}};
  const sync=()=>{try{if(typeof syncPush==='function')syncPush()}catch(e){}}
  const toast2=t=>{try{if(typeof toast==='function')toast(t)}catch(e){}}

  function homeDeparture(start,explicit){
    if(explicit)return explicit;
    if(start==='07:30')return'07:00';
    if(start==='08:20')return'07:55';
    return'';
  }
  function dayState(pid,date){
    const d=dObj(date),day=d.getDay(),p=personBy(pid),h=holiday(pid,date),slots=h?[]:schedule(pid,day);
    const pack=h?[]:reminderRows(day).filter(r=>String(r.personId)===String(pid)).flatMap(r=>r.items||[]);
    if(h)return{p,h,slots:[],pack,depart:'',start:'',end:'',pm:'Ferien'};
    if(!slots.length)return{p,h:null,slots:[],pack,depart:'',start:'',end:'',pm:'frei'};
    const first=slots[0],last=slots[slots.length-1],pm=slots.filter(s=>String(s.start||'')>='12:00');
    return{p,h:null,slots,pack,depart:homeDeparture(first.start,first.depart),start:first.start||'',end:last.end||'',pm:pm.length?pm.map(s=>`${s.start}–${s.end}`).join(' · '):'frei'};
  }
  function nextAction(date,states){
    if(date!==today())return null;
    const cur=nowMinutes(),all=[];
    for(const s of states){
      if(s.depart&&minutes(s.depart)>=cur)all.push({m:minutes(s.depart),time:s.depart,title:`${s.p.name} los`,sub:'Von zuhause losfahren / loslaufen'});
      else if(s.start&&minutes(s.start)>=cur)all.push({m:minutes(s.start),time:s.start,title:`${s.p.name} beginnt`,sub:'Schule / Kindergarten'});
      if(s.end&&minutes(s.end)>=cur)all.push({m:minutes(s.end),time:s.end,title:`${s.p.name} ${s.end?'fertig':''}`,sub:'Schul- oder Kindergartenende'});
    }
    for(const e of eventsAt(date))if(e.time&&minutes(e.time)>=cur)all.push({m:minutes(e.time),time:e.time,title:e.title,sub:eventPeople(e).map(p=>p.name).join(' · ')});
    all.sort((a,b)=>a.m-b.m);const x=all[0];if(!x)return{time:'—',title:'Für heute nichts Dringendes',sub:'Alles Weitere ist erledigt',left:''};
    const diff=x.m-cur,left=diff<=0?'jetzt':diff<60?`in ${diff} Min.`:`in ${Math.floor(diff/60)} Std.${diff%60?` ${diff%60} Min.`:''}`;
    return{...x,left};
  }

  function kidCard(state,editable=false){
    const p=state.p;if(!p)return'';const c=colorFor(p.id),status=state.h?(state.h.title||'Ferien'):(state.slots.length?'Schule':'Frei');
    if(!state.slots.length)return `<article class="v6-card v6-kid" style="--person:${esc(c)}"><div class="v6-kid-head"><span class="v6-dot" style="--person:${esc(c)}"></span><b>${esc(p.name)}</b><span class="v6-chip">${esc(status)}</span></div><div class="v6-kid-free">${state.h?esc(state.h.title||'Ferien'):'Heute keine feste Schulzeit.'}</div></article>`;
    return `<article class="v6-card ${editable?'v6-week-kid':'v6-kid'}" style="--person:${esc(c)}"><div class="${editable?'v6-week-kid-head':'v6-kid-head'}"><span class="v6-dot" style="--person:${esc(c)}"></span><b>${esc(p.name)}</b>${editable?`<button type="button" class="v6-week-edit" onclick="v6EditSchedule(${q(p.id)},${dObj(window.selectedWeekDay||today()).getDay()})">Ändern</button>`:`<span class="v6-chip">Schule</span>`}</div><div class="v6-time-grid"><div class="v6-time-cell"><span>LOS</span><b>${esc(state.depart||'—')}</b></div><div class="v6-time-cell"><span>BEGINN</span><b>${esc(state.start||'—')}</b></div><div class="v6-time-cell"><span>FERTIG</span><b>${esc(state.end||'—')}</b></div></div>${state.pm&&state.pm!=='frei'?`<div class="v6-week-meta">Nachmittag: <strong>${esc(state.pm)}</strong></div>`:''}${state.pack.length?`<div class="v6-kid-foot">${state.pack.map(x=>`<span class="v6-reminder-chip">${esc(x)}</span>`).join('')}</div>`:''}</article>`;
  }

  function eventSimpleRow(e){
    const ps=eventPeople(e).map(p=>p.name).join(' · '),note=[ps,e.note].filter(Boolean).join(' · ');
    return `<button type="button" class="v6-simple-row" onclick="fcOpenEventDetails(${q(e.id)})"><span class="v6-simple-time">${esc(e.time||'—')}</span><span class="v6-simple-main"><b>${esc(e.title)}</b><span>${esc(note)}</span></span><span class="v6-chevron">›</span></button>`;
  }

  function renderTodayV6(){
    const root=document.getElementById('today');if(!root)return;const date=today(),states=childPeople().map(p=>dayState(p.id,date)),focus=nextAction(date,states),todays=eventsAt(date).filter(e=>!String(e.title||'').toLowerCase().includes('ferien'));
    const hw=(Array.isArray(data?.homework)?data.homework:[]).filter(h=>!h.done&&h.dueDate<=date).sort((a,b)=>String(a.dueDate).localeCompare(String(b.dueDate))).slice(0,4);
    const pend=(Array.isArray(data?.pendencies)?data.pendencies:[]).filter(x=>!x.done).slice(0,3);
    root.innerHTML=`<div class="v6-page"><header><div class="v6-today-date">${esc(longDate(date))}</div><h1 class="v6-page-head v6-today-title">Heute</h1></header><section class="v6-card v6-focus"><div><small>JETZT WICHTIG</small><h2>${esc(focus?.title||'Für heute nichts Dringendes')}</h2><p>${esc(focus?.sub||'Alles Weitere ist erledigt')}</p></div><div class="v6-focus-time"><b>${esc(focus?.time||'—')}</b>${focus?.left?`<span>${esc(focus.left)}</span>`:''}</div></section><section class="v6-section"><div class="v6-section-head"><h2>Kinder heute</h2><span>Los · Beginn · Fertig</span></div><div class="v6-kids">${states.map(s=>kidCard(s,false)).join('')}</div></section><section class="v6-section"><div class="v6-section-head"><h2>Heute noch</h2><button type="button" onclick="openScreen('events')">Alle Termine</button></div>${todays.length?`<div class="v6-card v6-simple-list">${todays.map(eventSimpleRow).join('')}</div>`:'<div class="v6-empty">Heute keine weiteren Termine.</div>'}</section><section class="v6-section"><div class="v6-section-head"><h2>Aufgaben</h2><button type="button" onclick="v6OpenHomework()">Alle Aufgaben</button></div>${hw.length?`<div class="v6-card">${hw.map(h=>`<div class="v6-task-row"><label class="v6-task-check"><input type="checkbox" onchange="hwToggle(${q(h.id)},this.checked)"></label><div class="v6-task-main"><b>${esc((h.subject?h.subject+' · ':'')+h.title)}</b><span>${esc(personBy(h.personId)?.name||'')} · ${esc(fmt(h.dueDate,{weekday:true}))}</span></div><span class="v6-due ${h.dueDate<date?'v6-overdue':'v6-today-due'}">${h.dueDate<date?'Überfällig':'Heute'}</span></div>`).join('')}</div>`:'<div class="v6-empty">Keine offenen Aufgaben für heute.</div>'}</section>${pend.length?`<section class="v6-section"><div class="v6-section-head"><h2>Pendenzen</h2><button type="button" onclick="openScreen('more')">${pend.length} offen</button></div><div class="v6-card">${pend.map(x=>`<label class="v6-pendency-preview"><input type="checkbox" onchange="fcTogglePendency(${q(x.id)},this.checked)"><span><b>${esc(x.title)}</b>${Number(x.amount)>0?`<strong>${esc(x.currency||'CHF')} ${Number(x.amount).toFixed(2)}</strong>`:''}${x.note?`<p>${esc(x.note)}</p>`:''}</span></label>`).join('')}</div></section>`:''}</div>`;
  }

  function mondayOf(d){const x=new Date(d);x.setHours(12,0,0,0);x.setDate(x.getDate()-((x.getDay()+6)%7));return x}
  window.v6SelectWeekDay=function(date){window.selectedWeekDay=date;try{selectedWeekDay=date}catch(e){};renderWeekV6()};
  window.v6ShiftWeek=function(delta){let v=Number(window.weekOffset??(typeof weekOffset!=='undefined'?weekOffset:0))+delta;window.weekOffset=v;try{weekOffset=v}catch(e){};window.selectedWeekDay=null;try{selectedWeekDay=null}catch(e){};renderWeekV6()};
  function renderWeekV6(){
    const root=document.getElementById('week');if(!root)return;const off=Number(window.weekOffset??(typeof weekOffset!=='undefined'?weekOffset:0)),base=mondayOf(new Date());base.setDate(base.getDate()+off*7);const dates=Array.from({length:5},(_,i)=>{const d=new Date(base);d.setDate(base.getDate()+i);return d});
    let selected=window.selectedWeekDay||(typeof selectedWeekDay!=='undefined'?selectedWeekDay:null),weekIsCurrent=dates.some(d=>iso(d)===today());if(!selected||!dates.some(d=>iso(d)===selected)){selected=weekIsCurrent?today():iso(dates[0]);window.selectedWeekDay=selected;try{selectedWeekDay=selected}catch(e){}}
    const cur=dObj(selected),states=childPeople().map(p=>dayState(p.id,selected)),ev=eventsAt(selected).filter(e=>!String(e.title||'').toLowerCase().includes('ferien')),hw=(data?.homework||[]).filter(h=>!h.done&&h.dueDate===selected);
    root.innerHTML=`<div class="v6-page"><div class="v6-page-head"><div><h1>Woche</h1><p>${esc(fmt(iso(dates[0]),{year:true}))} – ${esc(fmt(iso(dates[4]),{year:true}))}</p></div><div class="v6-week-nav"><button class="v6-icon-btn" type="button" onclick="v6ShiftWeek(-1)" aria-label="Vorherige Woche">‹</button><button class="v6-icon-btn" type="button" onclick="v6ShiftWeek(1)" aria-label="Nächste Woche">›</button></div></div><div class="v6-days">${dates.map(d=>{const di=iso(d);return `<button type="button" class="v6-day ${di===selected?'active':''}" onclick="v6SelectWeekDay(${q(di)})"><b>${WEEK[d.getDay()]}</b><span>${String(d.getDate()).padStart(2,'0')}. ${MONTHS[d.getMonth()].slice(0,3)}</span></button>`}).join('')}</div><section class="v6-section"><div class="v6-week-date"><h2>${esc(WEEK_LONG[cur.getDay()])} · ${cur.getDate()}. ${esc(MONTHS[cur.getMonth()])}</h2></div><div class="v6-kids">${states.map(s=>kidCard(s,true)).join('')}</div></section>${ev.length?`<section class="v6-section"><div class="v6-section-head"><h2>Termine</h2></div><div class="v6-card v6-simple-list">${ev.map(eventSimpleRow).join('')}</div></section>`:''}${hw.length?`<section class="v6-section"><div class="v6-section-head"><h2>Aufgaben</h2></div><div class="v6-card">${hw.map(h=>`<div class="v6-task-row"><label class="v6-task-check"><input type="checkbox" onchange="hwToggle(${q(h.id)},this.checked)"></label><div class="v6-task-main"><b>${esc((h.subject?h.subject+' · ':'')+h.title)}</b><span>${esc(personBy(h.personId)?.name||'')}</span></div></div>`).join('')}</div></section>`:''}</div>`;
  }

  let homeworkFilter='open';
  window.v6HomeworkFilter=function(f){homeworkFilter=f;renderHomeworkV6()};
  window.v6OpenHomework=function(){
    document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.navbtn').forEach(x=>x.classList.remove('active'));document.getElementById('homework')?.classList.add('active');document.querySelector('.navbtn[data-screen="homework"]')?.classList.add('active');renderHomeworkV6();window.scrollTo({top:0,behavior:'smooth'});
  };
  function renderHomeworkV6(){
    const root=document.getElementById('homework');if(!root)return;const t=today(),all=Array.isArray(data?.homework)?data.homework:[];let rows=[];
    if(homeworkFilter==='done')rows=all.filter(h=>h.done).sort((a,b)=>String(b.dueDate).localeCompare(String(a.dueDate))).slice(0,40);else if(homeworkFilter==='today')rows=all.filter(h=>!h.done&&h.dueDate===t).sort((a,b)=>String(a.personId).localeCompare(String(b.personId)));else rows=all.filter(h=>!h.done).sort((a,b)=>String(a.dueDate).localeCompare(String(b.dueDate)));
    root.innerHTML=`<div class="v6-page"><div class="v6-page-head"><div><h1>Aufgaben</h1><p>${all.filter(h=>!h.done).length} offen</p></div><button type="button" class="v6-primary-btn" onclick="hwOpenAdd()">＋ Neu</button></div><div class="v6-segment"><button type="button" class="${homeworkFilter==='open'?'active':''}" onclick="v6HomeworkFilter('open')">Offen</button><button type="button" class="${homeworkFilter==='today'?'active':''}" onclick="v6HomeworkFilter('today')">Heute</button><button type="button" class="${homeworkFilter==='done'?'active':''}" onclick="v6HomeworkFilter('done')">Erledigt</button></div>${rows.length?`<div class="v6-card v6-homework-list">${rows.map(h=>{const due=h.dueDate<t&&!h.done?'Überfällig':h.dueDate===t&&!h.done?'Heute':fmt(h.dueDate,{weekday:true});return `<div class="v6-homework-row"><input type="checkbox" ${h.done?'checked':''} onchange="hwToggle(${q(h.id)},this.checked)"><div class="v6-homework-copy"><small>${esc(personBy(h.personId)?.name||'')} · <span class="${h.dueDate<t&&!h.done?'v6-overdue':h.dueDate===t&&!h.done?'v6-today-due':''}">${esc(due)}</span></small><b>${esc((h.subject?h.subject+' · ':'')+h.title)}</b>${h.note?`<span>${esc(h.note)}</span>`:''}</div><button type="button" class="v6-more-dot" onclick="v6HomeworkMenu(${q(h.id)})" aria-label="Aufgabe bearbeiten">•••</button></div>`}).join('')}</div>`:'<div class="v6-empty">Hier ist aktuell nichts zu erledigen.</div>'}</div>`;
  }

  let eventFilter='all',eventMonth=null;
  function monthStartFromCurrent(){const d=dObj(today());return new Date(d.getFullYear(),d.getMonth(),1,12)}
  window.v6EventFilter=function(id){eventFilter=id;window.fcEventFilter=id;renderEventsV6(id)};
  window.v6ShiftMonth=function(delta){if(!eventMonth)eventMonth=monthStartFromCurrent();eventMonth=new Date(eventMonth.getFullYear(),eventMonth.getMonth()+delta,1,12);renderEventsV6(eventFilter)};
  function eventIntersectsMonth(e,start,end){const a=String(e.date||''),b=String(e.endDate||e.date||'');return b>=start&&a<=end}
  function rsvpLabel(e){if(!e.rsvpRequired)return'';const st=String(e.rsvpStatus||'offen');return st==='offen'?'<span class="v6-rsvp-state open">Rückmeldung offen</span>':`<span class="v6-rsvp-state done">✓ ${esc(st==='angemeldet'?'Angemeldet':'Abgemeldet')}</span>`}
  function eventCard(e){const ps=eventPeople(e),c=colorFor(ps[0]?.id||'oli'),time=e.time?(e.time+(e.end?`–${e.end}`:'')):'Ganztägig';return `<article class="v6-card v6-event-card" style="--event-color:${esc(c)}" onclick="fcOpenEventDetails(${q(e.id)})"><div class="v6-event-time"><b>${esc(time)}</b>${e.endDate?`<span>bis ${esc(fmt(e.endDate))}</span>`:''}</div><div class="v6-event-body"><h3>${esc(e.title)}</h3>${e.note?`<p>${esc(e.note)}</p>`:''}<div class="v6-event-foot">${ps.map(p=>`<span class="v6-event-person"><span class="v6-dot" style="--person:${esc(colorFor(p.id))}"></span>${esc(p.name)}</span>`).join('')}${rsvpLabel(e)}<button type="button" class="v6-details-link" onclick="event.stopPropagation();fcOpenEventDetails(${q(e.id)})">Details</button></div></div></article>`}
  function renderEventsV6(filter=eventFilter){
    const root=document.getElementById('events');if(!root)return;eventFilter=filter||'all';window.fcEventFilter=eventFilter;if(!eventMonth)eventMonth=monthStartFromCurrent();const y=eventMonth.getFullYear(),m=eventMonth.getMonth(),start=`${y}-${String(m+1).padStart(2,'0')}-01`,last=new Date(y,m+1,0,12),end=iso(last);
    const events=(data?.events||[]).filter(e=>eventIntersectsMonth(e,start,end)&&(eventFilter==='all'||(e.personIds||[]).includes(eventFilter))).sort((a,b)=>(String(a.date)+(a.time||'99:99')).localeCompare(String(b.date)+(b.time||'99:99')));
    const groups=new Map();for(const e of events){const k=e.date;groups.set(k,[...(groups.get(k)||[]),e])}
    const filters=['all',...(data?.people||[]).map(p=>p.id)];root.innerHTML=`<div class="v6-page"><div class="v6-page-head"><div><h1>Termine</h1></div><button type="button" class="v6-primary-btn" onclick="openEventModal()">＋ Neu</button></div><div class="v6-filter-row">${filters.map(id=>`<button type="button" class="v6-filter ${eventFilter===id?'active':''}" onclick="v6EventFilter(${q(id)})">${id==='all'?'Alle':esc(personBy(id)?.name||id)}</button>`).join('')}</div><div class="v6-month-nav"><button type="button" onclick="v6ShiftMonth(-1)" aria-label="Vorheriger Monat">‹</button><div class="v6-month-label"><b>${esc(MONTHS[m])} ${y}</b><span>${events.length} Termin${events.length===1?'':'e'}</span></div><button type="button" onclick="v6ShiftMonth(1)" aria-label="Nächster Monat">›</button></div>${events.length?`<div class="v6-event-days">${[...groups.entries()].map(([date,list])=>`<section class="v6-event-day"><div class="v6-event-date">${esc(WEEK[dObj(date).getDay()])} · ${dObj(date).getDate()}. ${esc(MONTHS[dObj(date).getMonth()].slice(0,3))}</div>${list.map(eventCard).join('')}</section>`).join('')}</div>`:'<div class="v6-empty">Für diesen Monat gibt es mit diesem Filter keine Termine.</div>'}</div>`;
  }

  const legacyMore=typeof renderMore==='function'?renderMore:null;
  function makeMoreRow({icon,label,meta='',onclick='',count=''}){return `<button type="button" class="v6-more-row" ${onclick?`onclick="${onclick}"`:''}><span class="v6-more-icon">${icon}</span><span class="v6-more-copy"><b>${esc(label)}</b>${meta?`<span>${esc(meta)}</span>`:''}</span><span class="v6-more-end">${count?`<span class="v6-more-count">${esc(count)}</span>`:''}›</span></button>`}
  function makeDetail(label,icon,meta,nodes,count=''){
    const d=document.createElement('details');d.className='v6-more-detail';d.innerHTML=`<summary><span class="v6-more-icon">${icon}</span><span class="v6-more-copy"><b>${esc(label)}</b>${meta?`<span>${esc(meta)}</span>`:''}</span><span class="v6-more-end">${count?`<span class="v6-more-count">${esc(count)}</span>`:''}›</span></summary><div class="v6-more-expanded"></div>`;const box=d.querySelector('.v6-more-expanded');nodes.filter(Boolean).forEach(n=>box.appendChild(n));return d;
  }
  function renderMoreV6(){
    const root=document.getElementById('more');if(!root)return;let nodes=[];if(legacyMore){try{legacyMore()}catch(e){console.error('fc_v6_more_base',e)}nodes=[...root.querySelectorAll('.settings-stack>.setting')];}
    const take=(rx)=>{const out=nodes.filter(n=>rx.test((n.textContent||'').toLowerCase()));nodes=nodes.filter(n=>!out.includes(n));return out};
    const pend=take(/pendenz/),docs=take(/dokument|original/),push=take(/morgenbericht|push|erinner/),school=take(/schule|betreuung|personen/),backup=take(/daten sichern|backup|export/),pdf=take(/pdf|drucken/);
    const openP=(data?.pendencies||[]).filter(x=>!x.done).length;
    root.innerHTML=`<div class="v6-page"><div class="v6-page-head"><div><h1>Mehr</h1></div></div><div class="v6-more-groups"><section class="v6-more-group"><h2>Organisation</h2><div class="v6-card v6-more-list" id="v6MoreOrg"></div></section><section class="v6-more-group"><h2>Werkzeuge</h2><div class="v6-card v6-more-list" id="v6MoreTools">${makeMoreRow({icon:'✨',label:'Family AI',meta:'Sprache, Text, Foto oder PDF',onclick:"fcOpenFamilyAI('voice')"})}${makeMoreRow({icon:'📄',label:'Tagesblatt PDF',meta:'A4-Tagesübersicht erstellen',onclick:'fcPrintDay()'})}${makeMoreRow({icon:'📅',label:'Wochenplan PDF',meta:'Wochenübersicht erstellen',onclick:'fcPrintWeek()'})}</div></section><section class="v6-more-group"><h2>Erinnerungen</h2><div class="v6-card v6-more-list" id="v6MoreReminder"></div></section><section class="v6-more-group"><h2>Daten & Einstellungen</h2><div class="v6-card v6-more-list" id="v6MoreData"></div></section></div></div>`;
    const org=root.querySelector('#v6MoreOrg'),rem=root.querySelector('#v6MoreReminder'),dat=root.querySelector('#v6MoreData');
    if(pend.length)org.appendChild(makeDetail('Pendenzen','✓',openP?`${openP} offen`:'Alles erledigt',pend,String(openP||'')));else org.insertAdjacentHTML('beforeend',makeMoreRow({icon:'✓',label:'Pendenzen',meta:openP?`${openP} offen`:'Alles erledigt',onclick:'fcOpenAddPendency()',count:String(openP||'')}));
    if(docs.length)org.appendChild(makeDetail('Dokumente & Originale','📁','Sicher verwalten und verknüpfen',docs));
    else org.insertAdjacentHTML('beforeend',makeMoreRow({icon:'📁',label:'Dokumente & Originale',meta:'Dokumente verwalten',onclick:"toast('Dokumentbereich wird geladen')"}));
    org.insertAdjacentHTML('beforeend',makeMoreRow({icon:'👥',label:'Personen & Kontakte',meta:'Familie, Schule und Kontakte',onclick:"openScreen('people')"}));
    if(push.length)rem.appendChild(makeDetail('Smarte Erinnerungen','🔔','Push, Morgenbericht und Geräte',push));else rem.insertAdjacentHTML('beforeend',makeMoreRow({icon:'🔔',label:'Smarte Erinnerungen',meta:'Push und automatische Hinweise',onclick:"toast('Erinnerungen sind aktiv')"}));
    if(backup.length)dat.appendChild(makeDetail('Daten & Sicherheit','🛡️','Backup und Export',backup));
    if(school.length)dat.appendChild(makeDetail('Schule & Betreuung','🏫','Kontakte und gemeinsame Angaben',school));
    if(pdf.length||nodes.length)dat.appendChild(makeDetail('Weitere Einstellungen','⚙️','Weitere Funktionen',pdf.concat(nodes)));
  }

  window.v6HomeworkMenu=function(id){
    const h=(data?.homework||[]).find(x=>String(x.id)===String(id));if(!h)return;document.getElementById('v6HwMenu')?.remove();const m=document.createElement('div');m.id='v6HwMenu';m.className='v6-modal';m.innerHTML=`<section class="v6-sheet"><div class="v6-sheet-head"><h2>${esc(h.title)}</h2><button class="v6-close" type="button">×</button></div><div class="v6-sheet-actions"><button type="button" class="v6-ghost-btn" id="v6HwDelete">Löschen</button><button type="button" class="v6-primary-btn" id="v6HwEdit">Bearbeiten</button></div></section>`;m.querySelector('.v6-close').onclick=()=>m.remove();m.onclick=e=>{if(e.target===m)m.remove()};m.querySelector('#v6HwEdit').onclick=()=>{m.remove();v6EditHomework(id)};m.querySelector('#v6HwDelete').onclick=()=>{m.remove();if(typeof hwDelete==='function')hwDelete(id)};document.body.appendChild(m);
  };
  window.v6EditHomework=function(id){
    const h=(data?.homework||[]).find(x=>String(x.id)===String(id));if(!h)return;const m=document.createElement('div');m.className='v6-modal';m.id='v6EditHw';m.innerHTML=`<section class="v6-sheet"><div class="v6-sheet-head"><h2>Aufgabe bearbeiten</h2><button class="v6-close" type="button">×</button></div><div class="v6-fields"><div class="v6-field"><label>PERSON</label><select id="v6HwPerson">${childPeople().map(p=>`<option value="${esc(p.id)}" ${p.id===h.personId?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div><div class="v6-field"><label>FÄLLIG</label><input id="v6HwDate" type="date" value="${esc(h.dueDate)}"></div><div class="v6-field"><label>FACH</label><input id="v6HwSubject" value="${esc(h.subject||'')}"></div><div class="v6-field"><label>AUFGABE</label><textarea id="v6HwTitle">${esc(h.title)}</textarea></div><div class="v6-field"><label>NOTIZ</label><input id="v6HwNote" value="${esc(h.note||'')}"></div></div><div class="v6-sheet-actions"><button type="button" class="v6-ghost-btn">Abbrechen</button><button type="button" class="v6-primary-btn" id="v6HwSave">Speichern</button></div></section>`;const close=()=>m.remove();m.querySelector('.v6-close').onclick=close;m.querySelector('.v6-ghost-btn').onclick=close;m.onclick=e=>{if(e.target===m)close()};m.querySelector('#v6HwSave').onclick=()=>{const title=m.querySelector('#v6HwTitle').value.trim(),date=m.querySelector('#v6HwDate').value;if(!title||!date)return toast2('Titel und Datum fehlen');h.personId=m.querySelector('#v6HwPerson').value;h.dueDate=date;h.subject=m.querySelector('#v6HwSubject').value.trim();h.title=title;h.note=m.querySelector('#v6HwNote').value.trim();saveAll();sync();close();renderHomeworkV6();renderTodayV6();toast2('Aufgabe gespeichert')};document.body.appendChild(m);
  };

  window.v6EditEvent=function(id){
    const e=(data?.events||[]).find(x=>String(x.id)===String(id));if(!e)return;document.getElementById('v6EditEvent')?.remove();const m=document.createElement('div');m.className='v6-modal';m.id='v6EditEvent';const first=(e.personIds||[])[0]||'';m.innerHTML=`<section class="v6-sheet"><div class="v6-sheet-head"><h2>Termin bearbeiten</h2><button class="v6-close" type="button">×</button></div><div class="v6-fields"><div class="v6-field"><label>PERSON</label><select id="v6EvPerson">${(data?.people||[]).map(p=>`<option value="${esc(p.id)}" ${p.id===first?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div><div class="v6-field"><label>TITEL</label><input id="v6EvTitle" value="${esc(e.title)}"></div><div class="v6-fields-2"><div class="v6-field"><label>DATUM</label><input id="v6EvDate" type="date" value="${esc(e.date)}"></div><div class="v6-field"><label>ZEIT</label><input id="v6EvTime" type="time" value="${esc(e.time||'')}"></div></div><div class="v6-fields-2"><div class="v6-field"><label>ENDDATUM</label><input id="v6EvEndDate" type="date" value="${esc(e.endDate||'')}"></div><div class="v6-field"><label>ENDZEIT</label><input id="v6EvEnd" type="time" value="${esc(e.end||'')}"></div></div><div class="v6-field"><label>NOTIZ</label><textarea id="v6EvNote">${esc(e.note||'')}</textarea></div></div><div class="v6-sheet-actions"><button type="button" class="v6-ghost-btn">Abbrechen</button><button type="button" class="v6-primary-btn" id="v6EvSave">Speichern</button></div></section>`;const close=()=>m.remove();m.querySelector('.v6-close').onclick=close;m.querySelector('.v6-ghost-btn').onclick=close;m.onclick=x=>{if(x.target===m)close()};m.querySelector('#v6EvSave').onclick=()=>{const title=m.querySelector('#v6EvTitle').value.trim(),date=m.querySelector('#v6EvDate').value;if(!title||!date)return toast2('Titel und Datum fehlen');e.personIds=[m.querySelector('#v6EvPerson').value];e.title=title;e.date=date;e.time=m.querySelector('#v6EvTime').value;e.endDate=m.querySelector('#v6EvEndDate').value;e.end=m.querySelector('#v6EvEnd').value;e.note=m.querySelector('#v6EvNote').value.trim();saveAll();sync();close();renderEventsV6(eventFilter);renderTodayV6();toast2('Termin gespeichert')};document.body.appendChild(m);
  };

  window.v6EditSchedule=function(pid,day){
    try{if(typeof fcOpenScheduleEditor==='function')return fcOpenScheduleEditor(pid,day)}catch(e){}
    toast2('Die wiederkehrenden Zeiten kannst du über die bestehende Zeitbearbeitung ändern.');
  };

  const baseDetails=window.fcOpenEventDetails;
  if(typeof baseDetails==='function'){
    window.fcOpenEventDetails=async function(id,...args){await baseDetails.call(this,id,...args);const e=(data?.events||[]).find(x=>String(x.id)===String(id)),sheet=document.querySelector('#fcEventDetails .fc-detail-sheet');if(!e||!sheet||sheet.querySelector('.fc-detail-actions'))return;
      if(e.rsvpRequired){const st=String(e.rsvpStatus||'offen'),done=st!=='offen',box=document.createElement('div');box.className='v6-rsvp-detail '+(done?'done':'');box.innerHTML=`<b>${done?'Rückmeldung erledigt':'Rückmeldung nötig'}</b><p>${done?esc((e.rsvpFor||eventPeople(e).map(p=>p.name).join(' & '))+' · '+(st==='angemeldet'?'angemeldet':'abgemeldet')):'Bitte Teilnahme für diesen Anlass festhalten.'}</p><div class="v6-rsvp-buttons">${done?`<button type="button" data-rsvp="offen">Ändern</button>`:`<button type="button" data-rsvp="angemeldet">Angemeldet</button><button type="button" data-rsvp="abgemeldet">Abgemeldet</button>`}</div>`;box.querySelectorAll('[data-rsvp]').forEach(b=>b.onclick=async()=>{if(typeof fcSetRsvp==='function')fcSetRsvp(id,b.dataset.rsvp);setTimeout(()=>window.fcOpenEventDetails(id,true),80)});sheet.appendChild(box)}
      const actions=document.createElement('div');actions.className='fc-detail-actions';actions.innerHTML=`<button type="button" class="v6-primary-btn">Bearbeiten</button><button type="button" class="v6-danger-btn">Termin löschen</button>`;actions.querySelector('.v6-primary-btn').onclick=()=>{document.getElementById('fcEventDetails')?.remove();v6EditEvent(id)};actions.querySelector('.v6-danger-btn').onclick=()=>{document.getElementById('fcEventDetails')?.remove();if(typeof removeEvent==='function')removeEvent(id)};sheet.appendChild(actions);
    };
    try{fcOpenEventDetails=window.fcOpenEventDetails}catch(e){}
  }

  function install(){
    window.renderToday=renderTodayV6;try{renderToday=renderTodayV6}catch(e){}
    window.renderWeek=renderWeekV6;try{renderWeek=renderWeekV6}catch(e){}
    window.renderEvents=renderEventsV6;try{renderEvents=renderEventsV6}catch(e){}
    window.renderHomeworkScreen=renderHomeworkV6;try{renderHomeworkScreen=renderHomeworkV6}catch(e){}
    window.renderMore=renderMoreV6;try{renderMore=renderMoreV6}catch(e){}
    const active=document.querySelector('.screen.active')?.id||'today';if(active==='today')renderTodayV6();else if(active==='week')renderWeekV6();else if(active==='events')renderEventsV6();else if(active==='homework')renderHomeworkV6();else if(active==='more')renderMoreV6();
  }
  install();
  window.__fcScreenRedesignAudit=()=>({version:6,active:document.querySelector('.screen.active')?.id||'',width:innerWidth,duplicateIds:[...new Set([...document.querySelectorAll('[id]')].map(x=>x.id).filter((x,i,a)=>x&&a.indexOf(x)!==i))],eventFilter,eventMonth:eventMonth?`${eventMonth.getFullYear()}-${String(eventMonth.getMonth()+1).padStart(2,'0')}`:'',checkedAt:new Date().toISOString()});
})();
