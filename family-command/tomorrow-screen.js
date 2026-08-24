/* Family Command · dedicated Tomorrow tab · 2026-08-24 */
(()=>{
  if(window.__fcTomorrowScreenInstalled)return;window.__fcTomorrowScreenInstalled=true;

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const today=()=>{try{return typeof todayISO==='function'?todayISO():new Date().toISOString().slice(0,10)}catch(e){return new Date().toISOString().slice(0,10)}};
  const addDays=(iso,n)=>{const d=new Date(String(iso)+'T12:00:00');d.setDate(d.getDate()+n);const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`};
  const tomorrow=()=>addDays(today(),1);
  const fmtLong=iso=>{try{return new Intl.DateTimeFormat('de-CH',{weekday:'long',day:'numeric',month:'long'}).format(new Date(String(iso)+'T12:00:00'))}catch(e){return iso}};
  const personBy=id=>{try{return typeof person==='function'?person(id):(data?.people||[]).find(p=>String(p.id)===String(id))}catch(e){return null}};
  const childPeople=()=>{try{return (data?.people||[]).filter(p=>p.id!=='oli')}catch(e){return[]}};
  const schedule=(pid,day)=>{try{return typeof scheduleFor==='function'?(scheduleFor(pid,day)||[]):(data?.schedules?.[pid]?.[day]||[])}catch(e){return[]}};
  const reminders=day=>{try{return typeof remindersFor==='function'?(remindersFor(day)||[]):(data?.reminders||[]).filter(r=>(r.days||[]).includes(day))}catch(e){return[]}};
  const eventsAt=date=>{try{return typeof eventsOn==='function'?(eventsOn(date)||[]):(data?.events||[]).filter(e=>e.date===date||((e.endDate||'')&&e.date<=date&&e.endDate>=date))}catch(e){return[]}};
  const holiday=(pid,date)=>{try{return typeof schoolBreakFor==='function'?schoolBreakFor(pid,date):(typeof schoolHolidayOn==='function'?schoolHolidayOn(date):null)}catch(e){return null}};
  const colorFor=id=>personBy(id)?.color||({jayden:'#2f80ff',fynn:'#ff9000',eliyah:'#19b67a'}[id]||'#718198');
  const q=s=>"'"+String(s??'').replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\r/g,'\\r').replace(/\n/g,'\\n')+"'";

  function ensureShell(){
    const content=document.querySelector('.content');
    let root=document.getElementById('tomorrow');
    if(!root&&content){root=document.createElement('section');root.id='tomorrow';root.className='screen';const todayRoot=document.getElementById('today');if(todayRoot?.nextSibling)content.insertBefore(root,todayRoot.nextSibling);else content.appendChild(root)}
    const peopleBtn=document.querySelector('.navbtn[data-screen="people"]');
    if(peopleBtn){peopleBtn.dataset.screen='tomorrow';peopleBtn.setAttribute('aria-label','Morgen');const ico=peopleBtn.querySelector('.ico'),label=peopleBtn.querySelector('.ico+span')||peopleBtn.querySelectorAll('span')[1];if(ico)ico.textContent='☀';if(label)label.textContent='Morgen'}
    return root;
  }
  function showTomorrow(){
    const root=ensureShell(),btn=document.querySelector('.navbtn[data-screen="tomorrow"]');if(!root)return;
    document.querySelectorAll('.screen').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.navbtn').forEach(x=>x.classList.remove('active'));
    root.classList.add('active');btn?.classList.add('active');renderTomorrow();window.scrollTo({top:0,behavior:'smooth'});
  }

  function unique(items){return [...new Set(items.map(x=>String(x||'').trim()).filter(Boolean))]}
  function packFor(pid,day){const rows=reminders(day).filter(r=>String(r.personId)===String(pid));return unique(rows.flatMap(r=>Array.isArray(r.items)?r.items:[]))}
  function pickupEnabled(pid,day){try{const rules=JSON.parse(localStorage.getItem('fc-pickup-rules-v1')||'{}');return rules[String(pid)+'|'+day]===true}catch(e){return false}}
  function minusMinutes(t,n){const m=String(t||'').match(/^(\d{1,2}):(\d{2})$/);if(!m)return'';let v=Number(m[1])*60+Number(m[2])-n;if(v<0)v+=1440;return String(Math.floor(v/60)).padStart(2,'0')+':'+String(v%60).padStart(2,'0')}
  function schoolState(p,date){
    const day=new Date(date+'T12:00:00').getDay(),h=holiday(p.id,date),slots=h?[]:[...schedule(p.id,day)].sort((a,b)=>String(a.start||'99:99').localeCompare(String(b.start||'99:99'))),pack=h?[]:packFor(p.id,day);
    if(h)return{p,h,slots:[],pack,depart:'',start:'',end:'',pm:[],pickup:''};
    if(!slots.length)return{p,h:null,slots:[],pack,depart:'',start:'',end:'',pm:[],pickup:''};
    const first=slots[0],last=slots[slots.length-1],pm=slots.filter(s=>String(s.start||'')>='12:00');
    let depart=first.depart||'';if(!depart&&first.start==='07:30')depart='07:00';if(!depart&&first.start==='08:20')depart='07:55';
    const pickup=pickupEnabled(p.id,day)&&last?.end?`${minusMinutes(last.end,10)} los zum Abholen`:'';
    return{p,h:null,slots,pack,depart,start:first.start||'',end:last.end||'',pm,pickup};
  }
  function kidCard(s){
    const c=colorFor(s.p.id);
    if(s.h)return `<article class="v6-card fc-tom-screen-kid" style="--person:${esc(c)}"><div class="fc-tom-screen-kid-head"><span class="v6-dot" style="--person:${esc(c)}"></span><b>${esc(s.p.name)}</b><span>${esc(s.h.title||'Ferien')}</span></div><p>Keine Schulvorbereitung nötig.</p></article>`;
    if(!s.slots.length)return `<article class="v6-card fc-tom-screen-kid" style="--person:${esc(c)}"><div class="fc-tom-screen-kid-head"><span class="v6-dot" style="--person:${esc(c)}"></span><b>${esc(s.p.name)}</b><span>Frei</span></div><p>Keine feste Schulzeit.</p></article>`;
    const pm=s.pm.length?s.pm.map(x=>`${x.depart?x.depart+' los · ':''}${x.start||''}${x.end?'–'+x.end:''}`).join(' · '):'';
    return `<article class="v6-card fc-tom-screen-kid" style="--person:${esc(c)}"><div class="fc-tom-screen-kid-head"><span class="v6-dot" style="--person:${esc(c)}"></span><b>${esc(s.p.name)}</b><span>Schule</span></div><div class="v6-time-grid"><div class="v6-time-cell"><span>LOS</span><b>${esc(s.depart||'—')}</b></div><div class="v6-time-cell"><span>BEGINN</span><b>${esc(s.start||'—')}</b></div><div class="v6-time-cell"><span>FERTIG</span><b>${esc(s.end||'—')}</b></div></div>${pm?`<div class="fc-tom-screen-meta"><b>Nachmittag</b><span>${esc(pm)}</span></div>`:''}${s.pickup?`<div class="fc-tom-screen-pickup"><b>Abholen</b><span>${esc(s.pickup)}</span></div>`:''}${s.pack.length?`<div class="fc-tom-screen-pack"><b>Heute vorbereiten</b><div>${s.pack.map(x=>`<span>${esc(x)}</span>`).join('')}</div></div>`:''}</article>`;
  }
  function eventRow(e){
    const names=(e.personIds||[]).map(id=>personBy(id)?.name).filter(Boolean).join(' · '),note=String(e.note||'').trim();
    return `<button type="button" class="v6-simple-row" onclick="fcOpenEventDetails(${q(e.id)})"><span class="v6-simple-time">${esc(e.time||'—')}</span><span class="v6-simple-main"><b>${esc(e.title||'Termin')}</b><span>${esc([names,note].filter(Boolean).join(' · '))}</span></span><span class="v6-chevron">›</span></button>`;
  }
  function homeworkRow(h){
    return `<div class="v6-task-row"><label class="v6-task-check"><input type="checkbox" onchange="hwToggle(${q(h.id)},this.checked)"></label><div class="v6-task-main"><b>${esc((h.subject?h.subject+' · ':'')+(h.title||'Hausaufgabe'))}</b><span>${esc(personBy(h.personId)?.name||'')} · bis morgen</span>${h.note?`<small>${esc(h.note)}</small>`:''}</div><button type="button" class="v6-more-dot" onclick="v6HomeworkMenu(${q(h.id)})">•••</button></div>`;
  }

  function renderTomorrow(){
    const root=ensureShell();if(!root)return;
    const date=tomorrow(),states=childPeople().map(p=>schoolState(p,date));
    const ev=eventsAt(date).filter(e=>!String(e.title||'').toLowerCase().includes('ferien')).sort((a,b)=>String(a.time||'99:99').localeCompare(String(b.time||'99:99')));
    const hw=(Array.isArray(data?.homework)?data.homework:[]).filter(h=>!h.done&&String(h.dueDate)===date).sort((a,b)=>String(a.personId).localeCompare(String(b.personId)));
    const prepCount=states.reduce((n,s)=>n+s.pack.length+(s.pickup?1:0),0)+ev.length+hw.length;
    root.innerHTML=`<div class="v6-page fc-tomorrow-page"><div class="v6-page-head"><div><p class="fc-tomorrow-kicker">${esc(fmtLong(date))}</p><h1>Morgen</h1><p>${prepCount?`${prepCount} Punkte zum Vorbereiten oder Beachten`:'Für morgen ist nichts Besonderes offen.'}</p></div><button type="button" class="v6-primary-btn" onclick="openScreen('week');setTimeout(()=>{try{v6SelectWeekDay(${q(date)})}catch(e){}},0)">In Woche</button></div><section class="v6-section"><div class="v6-section-head"><h2>Kinder morgen</h2><span>Los · Beginn · Fertig</span></div><div class="v6-kids">${states.map(kidCard).join('')}</div></section>${ev.length?`<section class="v6-section"><div class="v6-section-head"><h2>Termine morgen</h2><button type="button" onclick="openScreen('events')">Alle Termine</button></div><div class="v6-card v6-simple-list">${ev.map(eventRow).join('')}</div></section>`:''}${hw.length?`<section class="v6-section"><div class="v6-section-head"><h2>Bis morgen erledigen</h2><button type="button" onclick="v6OpenHomework()">Alle Aufgaben</button></div><div class="v6-card">${hw.map(homeworkRow).join('')}</div></section>`:''}${!ev.length&&!hw.length&&!states.some(s=>s.pack.length||s.pickup)?'<div class="v6-empty fc-tomorrow-empty">Für morgen ist aktuell nichts zusätzlich vorzubereiten.</div>':''}</div>`;
    document.documentElement.dataset.fcTomorrowScreen='1';
  }

  function ensureStyle(){if(document.getElementById('fc-tomorrow-screen-style'))return;const s=document.createElement('style');s.id='fc-tomorrow-screen-style';s.textContent=`
    .fc-tomorrow-kicker{margin:0 0 3px!important;color:#7f91a8!important;font-size:10px!important;text-transform:capitalize}.fc-tom-screen-kid{padding:13px 14px!important}.fc-tom-screen-kid-head{display:flex;align-items:center;gap:8px}.fc-tom-screen-kid-head>b{font-size:13px}.fc-tom-screen-kid-head>span:last-child{margin-left:auto;color:#8fa2b9;font-size:9px;font-weight:800}.fc-tom-screen-kid>p{margin:10px 0 0;color:#8192a8;font-size:10px}.fc-tom-screen-meta,.fc-tom-screen-pickup{display:flex;justify-content:space-between;gap:10px;margin-top:8px;padding:8px 9px;border-radius:10px;background:#091522;border:1px solid #1d3047}.fc-tom-screen-meta b,.fc-tom-screen-pickup b{color:#7f91a8;font-size:9px}.fc-tom-screen-meta span,.fc-tom-screen-pickup span{color:#dce6f1;font-size:9px;text-align:right}.fc-tom-screen-pickup{border-color:rgba(255,181,75,.2);background:rgba(255,181,75,.06)}.fc-tom-screen-pack{margin-top:10px}.fc-tom-screen-pack>b{display:block;margin-bottom:6px;color:#8dafff;font-size:9px;text-transform:uppercase;letter-spacing:.06em}.fc-tom-screen-pack>div{display:flex;flex-wrap:wrap;gap:5px}.fc-tom-screen-pack span{padding:5px 7px;border:1px solid #263a52;border-radius:999px;background:#091522;color:#c4d1df;font-size:9px;font-weight:700}.fc-tomorrow-empty{margin-top:14px}
  `;document.head.appendChild(s)}

  ensureShell();ensureStyle();
  window.renderTomorrow=renderTomorrow;window.fcOpenTomorrow=showTomorrow;
  try{renderTomorrow=window.renderTomorrow}catch(e){}

  if(typeof window.openScreen==='function'&&!window.__fcTomorrowOpenScreenWrapped){
    window.__fcTomorrowOpenScreenWrapped=true;const raw=window.openScreen;
    window.openScreen=function(id,...args){if(String(id)==='tomorrow'){showTomorrow();return}return raw.call(this,id,...args)};
    try{openScreen=window.openScreen}catch(e){}
  }

  document.addEventListener('click',e=>{const b=e.target?.closest?.('.navbtn[data-screen="tomorrow"]');if(!b)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();showTomorrow()},true);
  requestAnimationFrame(()=>{if(document.getElementById('tomorrow')?.classList.contains('active'))renderTomorrow()});
  window.__fcTomorrowScreen={version:2,render:renderTomorrow,open:showTomorrow};
})();
