/* Family Command · structured digital pinboard dashboard · 2026-08-25 */
(()=>{
  if(window.__fcPinboardInstalled)return;window.__fcPinboardInstalled=true;
  let busy=false,queued=false,lastSig='';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const today=()=>{try{return typeof todayISO==='function'?todayISO():new Date().toISOString().slice(0,10)}catch(e){return new Date().toISOString().slice(0,10)}};
  const addDays=(iso,n)=>{const d=new Date(String(iso)+'T12:00:00');d.setDate(d.getDate()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
  const dayNum=iso=>new Date(String(iso)+'T12:00:00').getDay();
  const personBy=id=>{try{return (data?.people||[]).find(p=>String(p.id)===String(id))||null}catch(e){return null}};
  const childPeople=()=>{try{return (data?.people||[]).filter(p=>p.id!=='oli')}catch(e){return[]}};
  const schedule=(pid,day)=>{try{return typeof scheduleFor==='function'?(scheduleFor(pid,day)||[]):((data?.schedules?.[pid]?.[day])||[])}catch(e){return[]}};
  const holiday=(pid,date)=>{try{return typeof schoolBreakFor==='function'?schoolBreakFor(pid,date):(typeof schoolHolidayOn==='function'?schoolHolidayOn(date):null)}catch(e){return null}};
  const eventPeople=e=>{const ids=Array.isArray(e?.personIds)&&e.personIds.length?e.personIds:(e?.personId?[e.personId]:[]);return ids.map(personBy).filter(Boolean)};
  const fmtDate=(iso,long=false)=>{try{return new Intl.DateTimeFormat('de-CH',long?{weekday:'short',day:'numeric',month:'short'}:{weekday:'short',day:'numeric'}).format(new Date(String(iso)+'T12:00:00')).replace(',','')}catch(e){return iso}};
  const fmtClock=t=>String(t||'').trim()||'ganztägig';
  const allEvents=()=>{try{return Array.isArray(data?.events)?data.events:[]}catch(e){return[]}};
  const allTodos=()=>{try{return Array.isArray(data?.todos)?data.todos:[]}catch(e){return[]}};
  const allHomework=()=>{try{return Array.isArray(data?.homework)?data.homework:[]}catch(e){return[]}};
  const eventsOn=date=>allEvents().filter(e=>String(e.date)===date||((e.endDate||'')&&String(e.date)<=date&&String(e.endDate)>=date));

  function focusModel(root){
    const f=root.querySelector('.v6-focus');if(!f)return{title:'Alles ruhig',sub:'Aktuell ist nichts zeitkritisch.',time:''};
    return{title:String(f.querySelector('h2')?.textContent||'Alles ruhig').trim(),sub:String(f.querySelector('p')?.textContent||'').trim(),time:String(f.querySelector('.v6-focus-time b')?.textContent||'').trim(),left:String(f.querySelector('.v6-focus-time span')?.textContent||'').trim()};
  }
  function checklistModel(root){
    const c=root.querySelector('.fc-daily-check');if(!c)return{total:0,done:0,open:0,first:''};
    const rows=[...c.querySelectorAll('.fc-check-row')],done=rows.filter(r=>r.classList.contains('is-done')).length,first=rows.find(r=>!r.classList.contains('is-done'))?.querySelector('.fc-check-copy')?.textContent?.trim()||'';
    return{total:rows.length,done,open:Math.max(0,rows.length-done),first};
  }
  function todoModel(date){
    const rows=allTodos().filter(t=>!t.archived&&!t.done&&String(t.date)<=String(date)).sort((a,b)=>Number(!!b.priority)-Number(!!a.priority)||String(a.date).localeCompare(String(b.date))||Number(a.order||0)-Number(b.order||0));
    return{open:rows.length,priority:rows.filter(x=>x.priority).length,first:rows[0]?.title||'',rows};
  }
  function upcomingEvents(){
    const t=today();return allEvents().filter(e=>String(e.endDate||e.date||'')>=t&&!/ferien/i.test(String(e.title||''))).sort((a,b)=>(String(a.date)+(a.time||'99:99')).localeCompare(String(b.date)+(b.time||'99:99'))).slice(0,4);
  }
  function tomorrowModel(){
    const date=addDays(today(),1),day=dayNum(date),departures=[];
    for(const p of childPeople()){
      if(holiday(p.id,date))continue;
      const slots=[...schedule(p.id,day)].sort((a,b)=>String(a.start||'99:99').localeCompare(String(b.start||'99:99')));if(!slots.length)continue;
      const first=slots[0],dep=first.depart||(first.start==='07:30'?'07:00':first.start==='08:20'?'07:55':'');
      if(dep)departures.push(`${p.name} ${dep}`);else if(first.start)departures.push(`${p.name} ${first.start} Beginn`);
    }
    const events=eventsOn(date).filter(e=>!/ferien/i.test(String(e.title||''))),hw=allHomework().filter(h=>!h.done&&String(h.dueDate)===date),todos=allTodos().filter(t=>!t.archived&&!t.done&&String(t.date)===date);
    return{date,departures,events,hw,todos,total:events.length+hw.length+todos.length};
  }
  function dayLoad(date){
    const ev=eventsOn(date).filter(e=>!/ferien/i.test(String(e.title||''))).length,hw=allHomework().filter(h=>!h.done&&String(h.dueDate)===date).length,td=allTodos().filter(t=>!t.archived&&!t.done&&String(t.date)===date).length;
    return{date,count:ev+hw+td,ev,hw,td};
  }
  function eventRows(events){return events.map(e=>{const who=eventPeople(e).map(p=>p.name).join(' · ');return `<button type="button" class="fc-pin-event" data-event-id="${esc(e.id)}"><span><b>${esc(fmtDate(e.date,true))}</b><small>${esc(fmtClock(e.time))}</small></span><strong>${esc(e.title||'Termin')}</strong>${who?`<em>${esc(who)}</em>`:''}</button>`}).join('')}
  function render(){
    queued=false;if(busy)return;const root=document.getElementById('today');if(!root||!root.querySelector('.v6-page'))return;
    busy=true;try{
      const focus=focusModel(root),check=checklistModel(root),todo=todoModel(today()),events=upcomingEvents(),tom=tomorrowModel(),week=Array.from({length:7},(_,i)=>dayLoad(addDays(today(),i)));
      const sig=JSON.stringify([focus,check.open,check.first,todo.open,todo.first,events.map(e=>[e.id,e.date,e.time]),tom.total,tom.departures,week.map(x=>x.count)]);
      if(sig===lastSig&&root.querySelector('.fc-pinboard'))return;lastSig=sig;
      root.querySelector('.fc-pinboard')?.remove();root.querySelector('.v6-focus')?.classList.add('fc-pin-source-hidden');
      const wrap=document.createElement('section');wrap.className='fc-pinboard';wrap.innerHTML=`
        <div class="fc-pinboard-head"><div><span>DEINE PINNWAND</span><h2>Heute auf einen Blick</h2></div><small>${esc(fmtDate(today(),true))}</small></div>
        <div class="fc-pin-grid">
          <article class="fc-pin-note fc-pin-now"><div class="fc-pin-label"><span>JETZT</span>${focus.time?`<b>${esc(focus.time)}</b>`:''}</div><h3>${esc(focus.title)}</h3>${focus.sub?`<p>${esc(focus.sub)}</p>`:''}${focus.left?`<small>${esc(focus.left)}</small>`:''}</article>
          <article class="fc-pin-note fc-pin-do"><div class="fc-pin-label"><span>HEUTE ERLEDIGEN</span><b>${todo.open+check.open} offen</b></div><h3>${todo.first?esc(todo.first):check.first?esc(check.first):'Alles erledigt'}</h3><p>${todo.open?`${todo.open} To-do${todo.open===1?'':'s'}`:'Keine offenen To-dos'} · ${check.open?`${check.open} Checkpunkt${check.open===1?'':'e'}`:'Checkliste erledigt'}</p><div class="fc-pin-actions"><button type="button" data-open-todos>To-dos</button><button type="button" data-open-check>Checkliste</button></div></article>
          <article class="fc-pin-note fc-pin-events"><div class="fc-pin-label"><span>TERMINE</span><b>${events.length?`${events.length} nächste`:'frei'}</b></div>${events.length?`<div class="fc-pin-events-list">${eventRows(events.slice(0,3))}</div>`:'<h3>Keine kommenden Termine</h3><p>Aktuell ist nichts eingetragen.</p>'}<button type="button" class="fc-pin-wide" data-open-events>Alle Termine</button></article>
          <article class="fc-pin-note fc-pin-tomorrow"><div class="fc-pin-label"><span>MORGEN VORBEREITEN</span><b>${tom.total||'—'}</b></div><h3>${tom.departures.length?esc(tom.departures.slice(0,2).join(' · ')):'Morgen ohne feste Abfahrt'}</h3><p>${tom.events.length} Termin${tom.events.length===1?'':'e'} · ${tom.hw.length} Aufgabe${tom.hw.length===1?'':'n'} · ${tom.todos.length} To-do${tom.todos.length===1?'':'s'}</p><button type="button" class="fc-pin-wide" data-open-tomorrow>Morgen öffnen</button></article>
        </div>
        <div class="fc-pin-week"><div class="fc-pin-week-title"><span>NÄCHSTE 7 TAGE</span><b>Früh sehen, was kommt</b></div><div class="fc-pin-week-days">${week.map((d,i)=>`<button type="button" data-week-date="${esc(d.date)}" class="${i===0?'today':''}"><span>${esc(fmtDate(d.date,false).split(' ')[0])}</span><b>${new Date(d.date+'T12:00:00').getDate()}</b><i class="${d.count?'has':''}">${d.count||'·'}</i></button>`).join('')}</div></div>`;
      const header=root.querySelector('header');if(header?.parentNode)header.parentNode.insertBefore(wrap,header.nextSibling);else(root.querySelector('.v6-page')||root).prepend(wrap);
      wrap.querySelector('[data-open-todos]')?.addEventListener('click',()=>window.fcTodoOpen?.(today()));
      wrap.querySelector('[data-open-check]')?.addEventListener('click',()=>root.querySelector('.fc-daily-check')?.scrollIntoView({behavior:'smooth',block:'start'}));
      wrap.querySelector('[data-open-events]')?.addEventListener('click',()=>window.openScreen?.('events'));
      wrap.querySelector('[data-open-tomorrow]')?.addEventListener('click',()=>window.openScreen?.('tomorrow'));
      wrap.querySelectorAll('[data-event-id]').forEach(b=>b.addEventListener('click',()=>window.fcOpenEventDetails?.(b.dataset.eventId)));
      wrap.querySelectorAll('[data-week-date]').forEach(b=>b.addEventListener('click',()=>{window.openScreen?.('week');setTimeout(()=>window.v6SelectWeekDay?.(b.dataset.weekDate),30)}));
      document.documentElement.dataset.fcPinboard='1';
    }catch(e){console.error('fc_pinboard_render',e)}finally{busy=false}
  }
  function scheduleRender(){if(queued||busy)return;queued=true;requestAnimationFrame(()=>requestAnimationFrame(render))}
  function style(){if(document.getElementById('fc-pinboard-style'))return;const s=document.createElement('style');s.id='fc-pinboard-style';s.textContent=`
    .fc-pin-source-hidden{display:none!important}.fc-pinboard{display:grid;gap:11px;margin:8px 0 15px}.fc-pinboard-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;padding:0 2px}.fc-pinboard-head span{display:block;color:#788ba3;font-size:7px;font-weight:950;letter-spacing:.15em}.fc-pinboard-head h2{margin:3px 0 0;color:#f6f8fb;font-size:19px;letter-spacing:-.035em}.fc-pinboard-head small{color:#7b8da3;font-size:8px;font-weight:800}.fc-pin-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.fc-pin-note{position:relative;min-height:145px;border:1px solid #2a3d55;border-radius:16px;padding:12px 12px 11px;overflow:hidden;box-shadow:0 10px 22px rgba(0,0,0,.12)}.fc-pin-note:after{content:'';position:absolute;right:-15px;top:-15px;width:45px;height:45px;border-radius:50%;background:rgba(255,255,255,.035);pointer-events:none}.fc-pin-now{background:linear-gradient(145deg,#182142,#111a31);border-color:#3c4678}.fc-pin-do{background:linear-gradient(145deg,#16243a,#101c2d)}.fc-pin-events{background:linear-gradient(145deg,#1d2536,#111b29)}.fc-pin-tomorrow{background:linear-gradient(145deg,#17293a,#10202e);border-color:#315267}.fc-pin-label{display:flex;justify-content:space-between;gap:8px;align-items:center}.fc-pin-label span{color:#899bb1;font-size:7px;font-weight:950;letter-spacing:.13em}.fc-pin-label b{color:#aebbd0;font-size:8px}.fc-pin-note h3{margin:10px 0 0;color:#f6f8fb;font-size:15px;line-height:1.22;letter-spacing:-.025em}.fc-pin-note p{margin:6px 0 0;color:#8496ad;font-size:9px;line-height:1.4}.fc-pin-note>small{display:block;margin-top:7px;color:#a39eff;font-size:8px;font-weight:850}.fc-pin-actions{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:11px}.fc-pin-actions button,.fc-pin-wide{min-height:34px;border:1px solid #31465f;border-radius:10px;background:rgba(7,17,31,.35);color:#c4d0de;font-size:8px;font-weight:850}.fc-pin-wide{width:100%;margin-top:9px}.fc-pin-events-list{display:grid;margin-top:7px}.fc-pin-event{display:grid;grid-template-columns:54px minmax(0,1fr);gap:7px;align-items:start;border:0;border-top:1px solid rgba(54,73,96,.55);background:transparent;padding:7px 0;text-align:left;color:#fff}.fc-pin-event:first-child{border-top:0}.fc-pin-event>span b,.fc-pin-event>span small{display:block;color:#8fa0b5;font-size:7px}.fc-pin-event>span small{margin-top:2px;color:#6e8299}.fc-pin-event>strong{font-size:9px;line-height:1.25}.fc-pin-event>em{grid-column:2;color:#71869d;font-size:7px;font-style:normal}.fc-pin-week{border:1px solid #253a52;border-radius:15px;background:#0c1827;padding:10px}.fc-pin-week-title{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:0 2px 8px}.fc-pin-week-title span{color:#7f93aa;font-size:7px;font-weight:950;letter-spacing:.13em}.fc-pin-week-title b{color:#9cacc0;font-size:8px}.fc-pin-week-days{display:grid;grid-template-columns:repeat(7,1fr);gap:4px}.fc-pin-week-days button{min-width:0;border:1px solid #1d3047;border-radius:10px;background:#091522;padding:6px 2px;color:#8ea0b5}.fc-pin-week-days button.today{border-color:#5550a3;background:#151a36}.fc-pin-week-days span{display:block;font-size:6px;font-weight:900}.fc-pin-week-days b{display:block;margin-top:2px;color:#d9e2ec;font-size:11px}.fc-pin-week-days i{display:grid;place-items:center;width:18px;height:18px;margin:4px auto 0;border-radius:999px;color:#536a83;font-size:7px;font-style:normal;font-weight:900}.fc-pin-week-days i.has{background:rgba(101,92,255,.18);color:#b6b0ff}@media(max-width:390px){.fc-pin-grid{grid-template-columns:1fr}.fc-pin-note{min-height:0}.fc-pin-week-days{gap:3px}}
  `;document.head.appendChild(s)}
  style();
  const root=document.getElementById('today');if(root)new MutationObserver(scheduleRender).observe(root,{childList:true,subtree:true});
  const rawOpen=window.openScreen;if(typeof rawOpen==='function'&&!rawOpen.__fcPinboard){const w=function(...a){const r=rawOpen.apply(this,a);if(a[0]==='today')setTimeout(scheduleRender,0);return r};w.__fcPinboard=true;window.openScreen=w;try{openScreen=w}catch(e){}}
  setTimeout(scheduleRender,120);setTimeout(scheduleRender,800);
  window.__fcPinboard={version:1,render,schedule:scheduleRender};
})();