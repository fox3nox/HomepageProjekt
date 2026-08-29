/* Familienzentrale · responsive Tages-/Wochenplan + native PDF share · 2026-08-29 */
(()=>{
  'use strict';
  if(window.__fcPrintPlannerV2Installed)return;
  window.__fcPrintPlannerV2Installed=true;

  const VERSION='3.0.0';
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const D=()=>{try{return typeof data!=='undefined'&&data?data:{}}catch(_){return{}}};
  const today=()=>{try{return typeof todayISO==='function'?todayISO():localISO(new Date())}catch(_){return localISO(new Date())}};
  const personBy=id=>{try{return typeof person==='function'?person(id):(D().people||[]).find(p=>String(p.id)===String(id))||null}catch(_){return null}};
  const kids=()=>Array.isArray(D().people)?D().people.filter(p=>String(p.id)!=='oli'):[];
  const schedule=(pid,day)=>{try{return typeof scheduleFor==='function'?(scheduleFor(pid,day)||[]):(D().schedules?.[pid]?.[day]||[])}catch(_){return[]}};
  const holiday=(pid,date)=>{try{return typeof schoolBreakFor==='function'?schoolBreakFor(pid,date):(typeof schoolHolidayOn==='function'?schoolHolidayOn(date):null)}catch(_){return null}};
  const reminders=day=>{try{return typeof remindersFor==='function'?(remindersFor(day)||[]):(D().reminders||[]).filter(r=>(r.days||[]).includes(day))}catch(_){return[]}};

  function dObj(s){return new Date(String(s)+'T12:00:00')}
  function localISO(d){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
  function addDays(s,n){const d=dObj(s);d.setDate(d.getDate()+n);return localISO(d)}
  function mondayOfDate(date){const d=dObj(date);d.setDate(d.getDate()-((d.getDay()+6)%7));return localISO(d)}
  function fmt(s,short=false){try{return new Intl.DateTimeFormat('de-CH',short?{weekday:'short',day:'numeric',month:'short'}:{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(dObj(s))}catch(_){return s}}
  function fmtRange(start){return `${fmt(start,true)} – ${fmt(addDays(start,4),true)}`}
  function pickupEnabled(pid,day){try{return JSON.parse(localStorage.getItem('fc-pickup-rules-v1')||'{}')[String(pid)+'|'+day]===true}catch(_){return false}}
  function minusMinutes(t,n){const m=String(t||'').match(/^(\d{1,2}):(\d{2})$/);if(!m)return'';let v=Number(m[1])*60+Number(m[2])-n;if(v<0)v+=1440;return `${String(Math.floor(v/60)).padStart(2,'0')}:${String(v%60).padStart(2,'0')}`}

  function childState(pid,date){
    const day=dObj(date).getDay(),h=holiday(pid,date),slots=h?[]:[...schedule(pid,day)].sort((a,b)=>String(a.start||'99:99').localeCompare(String(b.start||'99:99')));
    if(h)return{holiday:h.title||'Ferien',slots:[],depart:'',start:'',end:'',pm:'',pickup:''};
    if(!slots.length)return{holiday:'',slots:[],depart:'',start:'',end:'',pm:'',pickup:''};
    const first=slots[0],last=slots[slots.length-1],pm=slots.filter(x=>String(x.start||'')>='12:00');
    let depart=first.depart||'';
    if(!depart&&first.start==='07:30')depart='07:00';
    if(!depart&&first.start==='08:20')depart='07:55';
    return{holiday:'',slots,depart,start:first.start||'',end:last.end||'',pm:pm.map(x=>`${x.depart?x.depart+' los · ':''}${x.start||''}${x.end?'–'+x.end:''}`).join(' · '),pickup:pickupEnabled(pid,day)&&last?.end?`${minusMinutes(last.end,10)} los`:''};
  }

  function eventKey(e){return String(e?.id||`${e?.date||''}|${e?.time||''}|${e?.title||''}`)}
  function eventsAt(date){
    const map=new Map(),add=arr=>{for(const e of Array.isArray(arr)?arr:[]){if(!e)continue;const start=String(e.date||''),end=String(e.endDate||e.date||'');if(!(start===date||(end&&start<=date&&end>=date)))continue;map.set(eventKey(e),{...(map.get(eventKey(e))||{}),...e})}};
    try{if(typeof eventsOn==='function')add(eventsOn(date)||[])}catch(_){}
    add(D().events||[]);
    return [...map.values()].filter(e=>!/ferien/i.test(String(e.title||''))).sort((a,b)=>String(a.time||'99:99').localeCompare(String(b.time||'99:99'))||String(a.title||'').localeCompare(String(b.title||'')));
  }

  function todoKey(t){return String(t?.sourceCommandId||t?.clientRef||t?.id||`${t?.date||''}|${t?.title||''}`)}
  function allTodos(){const map=new Map(),add=arr=>{for(const t of Array.isArray(arr)?arr:[]){if(!t)continue;const k=todoKey(t);if(k)map.set(k,{...(map.get(k)||{}),...t})}};try{add(window.__fcChatCommandSync?.all?.())}catch(_){}add(D().todos||[]);return [...map.values()]}
  function todosAt(date){return allTodos().filter(t=>!t.archived&&String(t.date)===String(date)).sort((a,b)=>Number(!!b.priority)-Number(!!a.priority)||Number(a.order||0)-Number(b.order||0)||String(a.title||'').localeCompare(String(b.title||'')))}

  function checklist(date){
    try{if(window.__fcDailyChecklist?.model)return window.__fcDailyChecklist.model(date)}catch(_){}
    const day=dObj(date).getDay(),groups=[];
    for(const p of kids()){
      const items=[];
      for(const r of reminders(day).filter(r=>String(r.personId)===String(p.id)))for(const x of (r.items||[]))if(String(x||'').trim())items.push({label:String(x).trim(),done:false});
      if(items.length)groups.push({name:p.name,items});
    }
    return{groups,total:groups.reduce((n,g)=>n+g.items.length,0),done:groups.reduce((n,g)=>n+g.items.filter(x=>x.done).length,0)};
  }

  function dayData(date){
    const children=kids().map(p=>({p,s:childState(p.id,date)}));
    const homework=(Array.isArray(D().homework)?D().homework:[]).filter(h=>String(h.dueDate)===String(date)).sort((a,b)=>String(a.personId||'').localeCompare(String(b.personId||'')));
    return{date,children,events:eventsAt(date),homework,todos:todosAt(date),check:checklist(date)};
  }

  function statusText(x){const s=x.s;if(s.holiday)return s.holiday;if(!s.slots.length)return'Frei';const bits=[];if(s.depart)bits.push(`${s.depart} los`);if(s.start||s.end)bits.push(`${s.start||'–'}–${s.end||'–'}`);if(s.pickup)bits.push(`Abholen ${s.pickup}`);return bits.join(' · ')}
  function childHTML(x){return `<article class="fp-kid"><div class="fp-kid-top"><b>${esc(x.p.name)}</b><span>${esc(x.s.holiday||(!x.s.slots.length?'Frei':'Schule'))}</span></div>${x.s.slots.length?`<div class="fp-times"><div><small>LOS</small><strong>${esc(x.s.depart||'–')}</strong></div><div><small>BEGINN</small><strong>${esc(x.s.start||'–')}</strong></div><div><small>FERTIG</small><strong>${esc(x.s.end||'–')}</strong></div></div>${x.s.pm?`<p><b>Nachmittag:</b> ${esc(x.s.pm)}</p>`:''}${x.s.pickup?`<p><b>Abholen:</b> ${esc(x.s.pickup)}</p>`:''}`:`<div class="fp-free">${esc(x.s.holiday||'Keine feste Schulzeit')}</div>`}</article>`}
  function checkItem(label,done=false,sub=''){return `<div class="fp-check ${done?'done':''}"><span class="fp-box">${done?'✓':''}</span><div><b>${esc(label)}</b>${sub?`<small>${esc(sub)}</small>`:''}</div></div>`}
  function todoHTML(rows){return rows.length?rows.map(t=>checkItem(t.title||'To-do',!!t.done,[t.priority?'Wichtig':'',t.section==='morning'?'Morgens':t.section==='evening'?'Abends':'Tagsüber'].filter(Boolean).join(' · '))).join(''):'<div class="fp-empty">Keine To-dos für diesen Tag.</div>'}
  function checklistHTML(m){const items=(m.groups||[]).flatMap(g=>(g.items||[]).map(i=>({name:g.name,...i})));return items.length?items.map(i=>checkItem(i.label,!!i.done,i.name)).join(''):'<div class="fp-empty">Keine zusätzlichen Checkpunkte.</div>'}
  function eventHTML(rows){return rows.length?rows.map(e=>`<div class="fp-event"><div class="fp-event-time">${esc(e.time||'Ganztägig')}${e.end?`<small>bis ${esc(e.end)}</small>`:''}</div><div><b>${esc(e.title||'Termin')}</b>${e.note?`<small>${esc(e.note)}</small>`:''}</div></div>`).join(''):'<div class="fp-empty">Keine Termine.</div>'}
  function homeworkHTML(rows){return rows.length?rows.map(h=>checkItem(`${h.subject?h.subject+' · ':''}${h.title||'Hausaufgabe'}`,!!h.done,personBy(h.personId)?.name||'')).join(''):'<div class="fp-empty">Keine fälligen Schulaufgaben.</div>'}

  function dayPreview(date){const d=dayData(date);return `<article class="fp-sheet fp-day-sheet" data-print-kind="day"><header class="fp-doc-head"><div><div class="fp-eyebrow">FAMILIENZENTRALE · TAGESPLAN</div><h1>${esc(fmt(date))}</h1><p>Alles Wichtige für den Tag auf einer Seite.</p></div><div class="fp-summary"><b>${d.todos.filter(x=>!x.done).length+d.homework.filter(x=>!x.done).length}</b><span>offene Aufgaben</span></div></header><section class="fp-section"><div class="fp-section-title"><h2>Kinder & Zeiten</h2></div><div class="fp-kids">${d.children.map(childHTML).join('')}</div></section><div class="fp-day-grid"><section class="fp-card"><div class="fp-section-title"><h2>To-dos</h2><span>${d.todos.length}</span></div>${todoHTML(d.todos)}</section><section class="fp-card"><div class="fp-section-title"><h2>Termine</h2><span>${d.events.length}</span></div>${eventHTML(d.events)}</section><section class="fp-card"><div class="fp-section-title"><h2>Checkliste</h2><span>${d.check.total||0}</span></div>${checklistHTML(d.check)}</section><section class="fp-card"><div class="fp-section-title"><h2>Schulaufgaben</h2><span>${d.homework.length}</span></div>${homeworkHTML(d.homework)}</section></div><section class="fp-section"><div class="fp-section-title"><h2>Notizen</h2></div><div class="fp-notes"></div></section><footer class="fp-foot">Familienzentrale · ${esc(date)}</footer></article>`}

  function weekDayHTML(date){const d=dayData(date),checks=(d.check.groups||[]).flatMap(g=>g.items||[]);return `<article class="fp-weekday"><header><div><span>${esc(fmt(date,true))}</span><b>${esc(String(dObj(date).getDate()))}</b></div><small>${d.events.length+d.todos.length+d.homework.length} Punkte</small></header><section><h3>Kinder</h3>${d.children.map(x=>`<div class="fp-week-person"><b>${esc(x.p.name)}</b><span>${esc(statusText(x))}</span></div>`).join('')}</section><section><h3>To-dos & Checkliste</h3>${d.todos.length||checks.length?[...d.todos.map(t=>({label:t.title,done:t.done,priority:t.priority})),...checks.map(i=>({label:i.label,done:i.done}))].slice(0,8).map(i=>`<div class="fp-week-check"><span class="fp-mini-box">${i.done?'✓':''}</span><span>${i.priority?'<b>Wichtig · </b>':''}${esc(i.label)}</span></div>`).join(''):'<div class="fp-empty small">Nichts offen.</div>'}</section><section><h3>Termine</h3>${d.events.length?d.events.slice(0,6).map(e=>`<div class="fp-week-line"><b>${esc(e.time||'–')}</b><span>${esc(e.title||'Termin')}</span></div>`).join(''):'<div class="fp-empty small">Keine Termine.</div>'}</section><section><h3>Schule</h3>${d.homework.length?d.homework.slice(0,5).map(h=>`<div class="fp-week-line"><b>${esc(personBy(h.personId)?.name||'')}</b><span>${esc((h.subject?h.subject+' · ':'')+(h.title||''))}</span></div>`).join(''):'<div class="fp-empty small">Keine Aufgaben.</div>'}</section></article>`}
  function weekPreview(start){const dates=Array.from({length:5},(_,i)=>addDays(start,i));return `<article class="fp-sheet fp-week-sheet" data-print-kind="week"><header class="fp-doc-head"><div><div class="fp-eyebrow">FAMILIENZENTRALE · WOCHENPLAN</div><h1>${esc(fmtRange(start))}</h1><p>Montag bis Freitag · Schule, Termine und Aufgaben.</p></div><div class="fp-summary"><b>${dates.reduce((n,d)=>n+dayData(d).events.length,0)}</b><span>Termine</span></div></header><div class="fp-week-grid">${dates.map(weekDayHTML).join('')}</div><footer class="fp-foot">Familienzentrale · Woche ab ${esc(start)}</footer></article>`}

  const PREVIEW_CSS=`
  .fc-print-overlay{position:fixed;inset:0;z-index:150000;background:#eef2f7;color:#172033;overflow:auto;-webkit-overflow-scrolling:touch;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",sans-serif}
  .fc-print-toolbar{position:sticky;top:0;z-index:5;background:rgba(18,29,50,.97);color:#fff;padding:calc(10px + env(safe-area-inset-top,0px)) 14px 10px;backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
  .fc-print-toolbar-in{width:min(100%,920px);margin:auto;display:flex;align-items:center;gap:10px}.fc-print-toolbar-title{min-width:0;flex:1}.fc-print-toolbar-title b{display:block;font-size:16px}.fc-print-toolbar-title span{display:block;margin-top:2px;color:#b9c5d6;font-size:11px}.fc-print-actions{display:flex;gap:8px}.fc-print-actions button{min-height:44px;border:0;border-radius:12px;padding:0 14px;font-weight:850;font-size:13px;white-space:nowrap}.fc-print-actions .primary{background:#fff;color:#214cd9}.fc-print-actions .close{background:#263750;color:#fff}
  .fc-print-stage{width:min(100%,960px);margin:auto;padding:16px 12px calc(28px + env(safe-area-inset-bottom,0px))}.fp-sheet{background:#fff;border:1px solid #dce3ec;border-radius:24px;box-shadow:0 18px 50px rgba(26,42,67,.10);padding:22px}.fp-doc-head{display:flex;align-items:flex-end;justify-content:space-between;gap:18px;padding-bottom:18px;border-bottom:2px solid #1e2b42}.fp-eyebrow{font-size:11px;font-weight:900;letter-spacing:.12em;color:#61718a}.fp-doc-head h1{margin:6px 0 0;font-size:32px;line-height:1.02;letter-spacing:-.04em}.fp-doc-head p{margin:7px 0 0;color:#718096;font-size:13px}.fp-summary{text-align:right;flex:none}.fp-summary b{display:block;font-size:28px}.fp-summary span{display:block;color:#718096;font-size:11px}.fp-section{margin-top:20px}.fp-section-title{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}.fp-section-title h2{margin:0;font-size:17px}.fp-section-title>span{display:grid;place-items:center;min-width:28px;height:28px;padding:0 8px;border-radius:999px;background:#f0f3f8;color:#64748b;font-size:11px;font-weight:850}.fp-kids{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.fp-kid,.fp-card{border:1px solid #dfe5ed;border-radius:16px;background:#fff;padding:14px}.fp-kid-top{display:flex;align-items:center;justify-content:space-between;gap:8px}.fp-kid-top b{font-size:15px}.fp-kid-top span{color:#6d7c91;font-size:10px}.fp-times{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:11px}.fp-times>div{padding:8px;border-radius:10px;background:#f5f7fa}.fp-times small{display:block;color:#8a97a9;font-size:8px;font-weight:850;letter-spacing:.08em}.fp-times strong{display:block;margin-top:3px;font-size:14px}.fp-kid p{margin:9px 0 0;color:#596a82;font-size:11px;line-height:1.4}.fp-free{margin-top:11px;padding:12px;border-radius:11px;background:#f5f7fa;color:#718096;font-size:12px}.fp-day-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:20px}.fp-check{display:grid;grid-template-columns:24px minmax(0,1fr);gap:9px;align-items:start;padding:9px 0;border-top:1px solid #eef1f5}.fp-check:first-of-type{border-top:0}.fp-box,.fp-mini-box{display:grid;place-items:center;border:2px solid #8795a9;border-radius:7px;color:#fff;background:#fff}.fp-box{width:22px;height:22px;font-size:12px}.fp-check.done .fp-box{background:#168b68;border-color:#168b68}.fp-check.done>div{opacity:.58;text-decoration:line-through}.fp-check b{display:block;font-size:12px;line-height:1.35}.fp-check small{display:block;margin-top:2px;color:#7b899d;font-size:10px}.fp-event{display:grid;grid-template-columns:70px minmax(0,1fr);gap:10px;padding:10px 0;border-top:1px solid #eef1f5}.fp-event:first-of-type{border-top:0}.fp-event-time{font-size:12px;font-weight:900}.fp-event-time small{display:block;margin-top:2px;color:#7c8a9d;font-size:9px;font-weight:600}.fp-event>div:last-child b{display:block;font-size:12px;line-height:1.35}.fp-event>div:last-child small{display:block;margin-top:3px;color:#718096;font-size:10px;line-height:1.35}.fp-empty{padding:12px;border-radius:11px;background:#f7f9fc;color:#8a97aa;font-size:11px}.fp-empty.small{padding:7px;font-size:9px}.fp-notes{height:120px;border:1px solid #e1e6ed;border-radius:15px;background:repeating-linear-gradient(to bottom,#fff 0,#fff 29px,#e9edf2 30px)}.fp-foot{margin-top:18px;color:#9aa5b5;font-size:10px;text-align:right}
  .fp-week-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin-top:18px}.fp-weekday{overflow:hidden;border:1px solid #dfe5ed;border-radius:15px;background:#fff}.fp-weekday>header{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 11px;background:#1e2b42;color:#fff}.fp-weekday>header div{display:flex;align-items:baseline;gap:5px}.fp-weekday>header span{font-size:10px;font-weight:800}.fp-weekday>header b{font-size:19px}.fp-weekday>header small{color:#c7d0dd;font-size:8px}.fp-weekday>section{padding:10px;border-top:1px solid #edf0f4}.fp-weekday>section h3{margin:0 0 7px;color:#758398;font-size:8px;font-weight:950;letter-spacing:.1em;text-transform:uppercase}.fp-week-person{margin-top:7px}.fp-week-person:first-of-type{margin-top:0}.fp-week-person b{display:block;font-size:10px}.fp-week-person span{display:block;margin-top:2px;color:#64748b;font-size:8.5px;line-height:1.3}.fp-week-check{display:grid;grid-template-columns:16px minmax(0,1fr);gap:6px;align-items:start;margin-top:6px;font-size:8.5px;line-height:1.3}.fp-mini-box{width:15px;height:15px;border-width:1.5px;border-radius:4px;font-size:8px}.fp-week-line{display:grid;grid-template-columns:36px minmax(0,1fr);gap:5px;margin-top:7px;font-size:8.5px;line-height:1.3}.fp-week-line b{font-size:8.5px}.fp-week-line span{color:#596a82}
  .fc-print-toast{position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:160000;padding:10px 14px;border-radius:999px;background:#172033;color:#fff;font-size:12px;box-shadow:0 10px 28px rgba(0,0,0,.18)}
  @media(max-width:700px){.fc-print-toolbar-in{align-items:flex-start;flex-wrap:wrap}.fc-print-toolbar-title{width:100%;flex-basis:100%}.fc-print-actions{width:100%}.fc-print-actions button{flex:1}.fc-print-stage{padding:10px 8px calc(24px + env(safe-area-inset-bottom,0px))}.fp-sheet{padding:15px;border-radius:18px}.fp-doc-head{align-items:flex-start}.fp-doc-head h1{font-size:26px}.fp-doc-head p{font-size:11px}.fp-summary b{font-size:22px}.fp-kids{grid-template-columns:1fr}.fp-kid{padding:12px}.fp-day-grid{grid-template-columns:1fr;gap:10px}.fp-week-grid{grid-template-columns:1fr;gap:10px}.fp-weekday>header{padding:12px 13px}.fp-weekday>header span{font-size:12px}.fp-weekday>header b{font-size:22px}.fp-weekday>header small{font-size:10px}.fp-weekday>section{padding:11px 13px}.fp-weekday>section h3{font-size:9px}.fp-week-person b,.fp-week-line b{font-size:11px}.fp-week-person span,.fp-week-check,.fp-week-line{font-size:10px}.fp-week-line{grid-template-columns:48px minmax(0,1fr)}}
  @media print{body>*:not(.fc-print-overlay){display:none!important}.fc-print-overlay{position:static;background:#fff;overflow:visible}.fc-print-toolbar{display:none!important}.fc-print-stage{width:auto;padding:0}.fp-sheet{box-shadow:none;border:0;border-radius:0;padding:0}.fp-day-sheet{width:auto}.fp-week-sheet{width:auto}.fp-week-grid{grid-template-columns:repeat(5,minmax(0,1fr));gap:5mm}.fp-weekday>section{padding:2.5mm}.fp-weekday>header{padding:2.5mm}.fp-foot{margin-top:3mm}}
  `;

  function ensureStyle(){if(document.getElementById('fcPrintPlannerStyles'))return;const s=document.createElement('style');s.id='fcPrintPlannerStyles';s.textContent=PREVIEW_CSS;document.head.appendChild(s)}
  function closePreview(){document.getElementById('fcPrintOverlay')?.remove();document.body.style.removeProperty('overflow')}
  function toastMsg(msg){document.querySelector('.fc-print-toast')?.remove();const t=document.createElement('div');t.className='fc-print-toast';t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),2200)}

  const CP1252=new Map([['€',128],['‚',130],['ƒ',131],['„',132],['…',133],['†',134],['‡',135],['ˆ',136],['‰',137],['Š',138],['‹',139],['Œ',140],['Ž',142],['‘',145],['’',146],['“',147],['”',148],['•',149],['–',150],['—',151],['˜',152],['™',153],['š',154],['›',155],['œ',156],['ž',158],['Ÿ',159]]);
  function pdfLiteral(v){let out='';for(const ch of String(v??'').normalize('NFC')){const cp=ch.codePointAt(0);let b;if(cp<128)b=cp;else if(cp>=160&&cp<=255)b=cp;else b=CP1252.get(ch)??63;if(b===40||b===41||b===92)out+='\\'+String.fromCharCode(b);else if(b<32||b>126)out+='\\'+b.toString(8).padStart(3,'0');else out+=String.fromCharCode(b)}return out}
  const num=n=>Number(n.toFixed(2));
  function rgb(hex){const h=String(hex).replace('#','');return [parseInt(h.slice(0,2),16)/255,parseInt(h.slice(2,4),16)/255,parseInt(h.slice(4,6),16)/255]}
  function approxWidth(text,size,bold=false){return [...String(text)].reduce((w,ch)=>w+size*(ch===' '?0.28:(/[A-ZMW]/.test(ch)?0.66:(/[ilI1]/.test(ch)?0.28:0.52)))*(bold?1.04:1),0)}
  function wrapText(text,size,maxWidth,bold=false){const words=String(text??'').replace(/\s+/g,' ').trim().split(' ').filter(Boolean),lines=[];let line='';for(const word of words){const test=line?line+' '+word:word;if(approxWidth(test,size,bold)<=maxWidth||!line)line=test;else{lines.push(line);line=word}}if(line)lines.push(line);return lines.length?lines:['']}
  function pagePainter(width,height){const c=[];const y=t=>height-t;return{
    width,height,content:c,
    fill(x,top,w,h,color){const [r,g,b]=rgb(color);c.push(`${num(r)} ${num(g)} ${num(b)} rg ${num(x)} ${num(y(top+h))} ${num(w)} ${num(h)} re f`)},
    stroke(x,top,w,h,color='#dfe5ed',line=1){const [r,g,b]=rgb(color);c.push(`${num(r)} ${num(g)} ${num(b)} RG ${num(line)} w ${num(x)} ${num(y(top+h))} ${num(w)} ${num(h)} re S`)},
    line(x1,t1,x2,t2,color='#dfe5ed',line=1){const [r,g,b]=rgb(color);c.push(`${num(r)} ${num(g)} ${num(b)} RG ${num(line)} w ${num(x1)} ${num(y(t1))} m ${num(x2)} ${num(y(t2))} l S`)},
    text(x,top,text,size=10,bold=false,color='#172033'){const [r,g,b]=rgb(color);c.push(`BT /${bold?'F2':'F1'} ${num(size)} Tf ${num(r)} ${num(g)} ${num(b)} rg 1 0 0 1 ${num(x)} ${num(y(top+size))} Tm (${pdfLiteral(text)}) Tj ET`)},
    wrapped(x,top,text,size,maxWidth,lineHeight=size*1.25,bold=false,color='#172033',maxLines=99){const lines=wrapText(text,size,maxWidth,bold).slice(0,maxLines);lines.forEach((s,i)=>this.text(x,top+i*lineHeight,s,size,bold,color));return lines.length*lineHeight},
    checkbox(x,top,done=false){this.stroke(x,top,10,10,done?'#168b68':'#8795a9',1.2);if(done){this.fill(x,top,10,10,'#168b68');this.text(x+2,top+0.2,'✓',8,true,'#ffffff')}}
  }}
  function buildPDF(pagePainters){
    const objects=[null];
    const add=s=>{objects.push(s);return objects.length-1};
    const catalog=add(''),pages=add(''),font1=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'),font2=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
    const kids=[];
    for(const p of pagePainters){const stream=p.content.join('\n'),content=add(`<< /Length ${new TextEncoder().encode(stream).length} >>\nstream\n${stream}\nendstream`),page=add(`<< /Type /Page /Parent ${pages} 0 R /MediaBox [0 0 ${num(p.width)} ${num(p.height)}] /Resources << /Font << /F1 ${font1} 0 R /F2 ${font2} 0 R >> >> /Contents ${content} 0 R >>`);kids.push(page)}
    objects[pages]=`<< /Type /Pages /Count ${kids.length} /Kids [${kids.map(n=>`${n} 0 R`).join(' ')}] >>`;
    objects[catalog]=`<< /Type /Catalog /Pages ${pages} 0 R >>`;
    let pdf='%PDF-1.4\n%âãÏÓ\n',offsets=[0];
    for(let i=1;i<objects.length;i++){offsets[i]=new TextEncoder().encode(pdf).length;pdf+=`${i} 0 obj\n${objects[i]}\nendobj\n`}
    const xref=new TextEncoder().encode(pdf).length;pdf+=`xref\n0 ${objects.length}\n0000000000 65535 f \n`;for(let i=1;i<objects.length;i++)pdf+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`;pdf+=`trailer\n<< /Size ${objects.length} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return new Blob([new TextEncoder().encode(pdf)],{type:'application/pdf'});
  }

  function listBlock(p,x,top,w,title,items,max=7){p.text(x,top,title.toUpperCase(),8,true,'#6b7a90');let y=top+15;if(!items.length){p.text(x,y,'Keine Einträge.',9,false,'#99a4b4');return y+18}for(const it of items.slice(0,max)){if(it.check)p.checkbox(x,y+1,!!it.done);const tx=x+(it.check?17:0),avail=w-(it.check?17:0);if(it.lead){p.text(tx,y,it.lead,8,true,'#263a67');const leadW=Math.min(48,approxWidth(it.lead,8,true)+7);p.wrapped(tx+leadW,y,it.text,8,avail-leadW,10,false,'#3f4f66',2)}else p.wrapped(tx,y,it.text,8.5,avail,10.5,!!it.bold,'#263247',2);y+=22}if(items.length>max){p.text(x,y,`+ ${items.length-max} weitere`,8,false,'#7d8a9d');y+=14}return y}

  function dayPDF(date){
    const d=dayData(date),p=pagePainter(595.28,841.89),M=36,W=p.width-M*2;
    p.text(M,34,'FAMILIENZENTRALE · TAGESPLAN',9,true,'#62718a');p.wrapped(M,52,fmt(date),24,W-100,28,true,'#172033',2);p.text(p.width-M-82,55,`${d.todos.filter(x=>!x.done).length+d.homework.filter(x=>!x.done).length}`,24,true,'#263a67');p.text(p.width-M-82,82,'offene Aufgaben',8,false,'#748398');p.line(M,113,p.width-M,113,'#1f2e46',2);
    let top=132;const gap=10,cw=(W-gap*2)/3;d.children.forEach((x,i)=>{const x0=M+i*(cw+gap);p.fill(x0,top,cw,82,'#f7f9fc');p.stroke(x0,top,cw,82,'#dde4ed',1);p.text(x0+10,top+10,x.p.name,12,true);p.wrapped(x0+10,top+30,statusText(x),9,cw-20,12,false,'#596a82',3)});top+=102;
    const colGap=16,colW=(W-colGap)/2,left=M,right=M+colW+colGap;
    const todos=d.todos.map(t=>({check:true,done:t.done,text:`${t.priority?'Wichtig · ':''}${t.title}`}));
    const checks=(d.check.groups||[]).flatMap(g=>(g.items||[]).map(i=>({check:true,done:i.done,text:`${g.name}: ${i.label}`})));
    const events=d.events.map(e=>({lead:e.time||'–',text:`${e.title||'Termin'}${e.note?' · '+e.note:''}`}));
    const hw=d.homework.map(h=>({check:true,done:h.done,text:`${personBy(h.personId)?.name||''}${h.subject?' · '+h.subject:''}: ${h.title||'Hausaufgabe'}`}));
    let yl=listBlock(p,left,top,colW,'To-dos',todos,8);yl=listBlock(p,left,Math.max(yl+6,top+118),colW,'Checkliste',checks,7);
    let yr=listBlock(p,right,top,colW,'Termine',events,7);yr=listBlock(p,right,Math.max(yr+6,top+118),colW,'Schulaufgaben',hw,6);
    const notesTop=Math.max(515,yl+20,yr+20);p.text(M,notesTop,'NOTIZEN',8,true,'#6b7a90');for(let i=0;i<5;i++)p.line(M,notesTop+22+i*30,p.width-M,notesTop+22+i*30,'#e4e9ef',1);p.text(p.width-M-120,808,`Familienzentrale · ${date}`,7,false,'#9ba6b5');return buildPDF([p]);
  }

  function weekPDF(start){
    const dates=Array.from({length:5},(_,i)=>addDays(start,i)),p=pagePainter(841.89,595.28),M=28,W=p.width-M*2,gap=7,cw=(W-gap*4)/5;
    p.text(M,25,'FAMILIENZENTRALE · WOCHENPLAN',9,true,'#62718a');p.text(M,42,fmtRange(start),21,true);p.text(p.width-M-128,46,'Montag bis Freitag',9,false,'#748398');p.line(M,72,p.width-M,72,'#1f2e46',2);
    dates.forEach((date,i)=>{const d=dayData(date),x=M+i*(cw+gap),top=88;p.fill(x,top,cw,34,'#1f2e46');p.text(x+8,top+8,fmt(date,true),10,true,'#ffffff');let y=top+48;p.text(x+8,y,'KINDER',7,true,'#6b7a90');y+=13;for(const ch of d.children){p.text(x+8,y,ch.p.name,8.5,true);y+=11;y+=p.wrapped(x+8,y,statusText(ch),7.5,cw-16,9,false,'#56677f',3)+4}y=Math.max(y,214);const todos=[...d.todos.map(t=>({check:true,done:t.done,text:`${t.priority?'Wichtig · ':''}${t.title}`})),...(d.check.groups||[]).flatMap(g=>(g.items||[]).map(it=>({check:true,done:it.done,text:it.label})))];y=listBlock(p,x+8,y,cw-16,'To-dos',todos,5);y=Math.max(y+3,326);y=listBlock(p,x+8,y,cw-16,'Termine',d.events.map(e=>({lead:e.time||'–',text:e.title||'Termin'})),4);y=Math.max(y+3,425);listBlock(p,x+8,y,cw-16,'Schule',d.homework.map(h=>({text:`${personBy(h.personId)?.name||''}: ${h.title||'Hausaufgabe'}`})),3);p.stroke(x,top,cw,455,'#dce3ec',1)});p.text(p.width-M-145,565,`Familienzentrale · Woche ab ${start}`,7,false,'#9ba6b5');return buildPDF([p]);
  }

  async function sharePDF(kind,date){
    const blob=kind==='week'?weekPDF(date):dayPDF(date),name=kind==='week'?`Familienzentrale-Wochenplan-${date}.pdf`:`Familienzentrale-Tagesplan-${date}.pdf`,file=new File([blob],name,{type:'application/pdf'});
    document.documentElement.dataset.fcPrintPdfBytes=String(blob.size);document.documentElement.dataset.fcPrintPdfKind=kind;
    try{
      if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){await navigator.share({files:[file],title:kind==='week'?'Familienzentrale Wochenplan':'Familienzentrale Tagesplan'});document.documentElement.dataset.fcPrintShare='shared';return}
    }catch(e){if(e?.name==='AbortError'){document.documentElement.dataset.fcPrintShare='cancelled';return}console.warn('fc_print_share',e)}
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.target='_blank';a.rel='noopener';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);document.documentElement.dataset.fcPrintShare='download';toastMsg('PDF wurde erstellt. Öffne es zum Drucken oder Speichern.');
  }

  function openPreview(kind,date){
    ensureStyle();closePreview();
    const start=kind==='week'?mondayOfDate(date):date,overlay=document.createElement('div');overlay.id='fcPrintOverlay';overlay.className='fc-print-overlay';overlay.innerHTML=`<div class="fc-print-toolbar"><div class="fc-print-toolbar-in"><div class="fc-print-toolbar-title"><b>${kind==='week'?'Wochenplan':'Tagesplan'}</b><span>Optimiert für iPhone und A4-PDF</span></div><div class="fc-print-actions"><button type="button" class="primary" data-pdf-action>PDF / Drucken</button><button type="button" class="close" data-close-print>Schließen</button></div></div></div><div class="fc-print-stage">${kind==='week'?weekPreview(start):dayPreview(start)}</div>`;
    document.body.appendChild(overlay);document.body.style.overflow='hidden';overlay.querySelector('[data-close-print]').onclick=closePreview;overlay.querySelector('[data-pdf-action]').onclick=async e=>{const b=e.currentTarget,old=b.textContent;b.disabled=true;b.textContent='PDF wird erstellt …';try{await sharePDF(kind,start)}finally{b.disabled=false;b.textContent=old}};document.documentElement.dataset.fcPrintPreview=kind;document.documentElement.dataset.fcPrintDate=start;
    return overlay;
  }

  window.fcPrintDay=(date=today())=>openPreview('day',date);
  window.fcPrintWeek=(start='')=>{let s=start;if(!s){const off=Number(window.weekOffset||0);s=mondayOfDate(today());if(off)s=addDays(s,off*7)}return openPreview('week',s)};
  window.__fcPrintPlannerV2={version:VERSION,dayData,dayPreview,weekPreview,dayPDF,weekPDF,sharePDF,openPreview,closePreview,eventsAt,todosAt};
})();
