let fcEventFilter='all';

const FC_EVENT_MONTHS=['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const FC_EVENT_SHORT=['JAN','FEB','MÄR','APR','MAI','JUN','JUL','AUG','SEP','OKT','NOV','DEZ'];
const FC_EVENT_COLORS=[
  {main:'#0369a1',soft:'#e0f2fe',line:'#7dd3fc',dark:'#0c4a6e'},
  {main:'#4f46e5',soft:'#eef2ff',line:'#a5b4fc',dark:'#3730a3'},
  {main:'#059669',soft:'#ecfdf5',line:'#6ee7b7',dark:'#065f46'},
  {main:'#16a34a',soft:'#f0fdf4',line:'#86efac',dark:'#166534'},
  {main:'#0d9488',soft:'#f0fdfa',line:'#5eead4',dark:'#115e59'},
  {main:'#0284c7',soft:'#f0f9ff',line:'#7dd3fc',dark:'#075985'},
  {main:'#ca8a04',soft:'#fefce8',line:'#fde047',dark:'#854d0e'},
  {main:'#ea580c',soft:'#fff7ed',line:'#fdba74',dark:'#9a3412'},
  {main:'#2563eb',soft:'#eff6ff',line:'#93c5fd',dark:'#1e40af'},
  {main:'#9333ea',soft:'#faf5ff',line:'#d8b4fe',dark:'#6b21a8'},
  {main:'#059669',soft:'#ecfdf5',line:'#6ee7b7',dark:'#065f46'},
  {main:'#e11d48',soft:'#fff1f2',line:'#fda4af',dark:'#9f1239'}
];
function fcEventMonthInfo(date){
  const d=new Date(date+'T12:00:00'),m=d.getMonth();
  return {month:m,year:d.getFullYear(),name:FC_EVENT_MONTHS[m],short:FC_EVENT_SHORT[m],color:FC_EVENT_COLORS[m]};
}
function fcEventDay(date){return String(new Date(date+'T12:00:00').getDate()).padStart(2,'0')}
function fcEventWeekday(date){return new Intl.DateTimeFormat('de-CH',{weekday:'short'}).format(new Date(date+'T12:00:00')).replace('.','').toUpperCase()}
function fcEventRangeLabel(e){
  const a=fcEventMonthInfo(e.date),start=fcEventDay(e.date)+' '+a.short;
  if(!e.endDate||e.endDate===e.date)return start;
  const b=fcEventMonthInfo(e.endDate);return start+' – '+fcEventDay(e.endDate)+' '+b.short;
}
function fcJumpMonth(id){document.getElementById(id)?.scrollIntoView({behavior:'smooth',block:'start'})}

renderEvents=function(filter='all'){
  fcEventFilter=filter;
  const root=document.getElementById('events');
  const filters=['all',...data.people.map(p=>p.id)].map(id=>'<button class="pill '+(filter===id?'active':'')+'" onclick="renderEvents(\''+id+'\')">'+(id==='all'?'Alle':esc(person(id).name))+'</button>').join('');
  const t=todayISO();
  const es=data.events.filter(e=>(e.endDate||e.date)>=t&&(filter==='all'||(e.personIds||[]).includes(filter))).sort((a,b)=>(a.date+(a.time||'99:99')).localeCompare(b.date+(b.time||'99:99')));

  const groups=[];const byMonth=new Map();
  for(const e of es){
    const key=e.date.slice(0,7);
    if(!byMonth.has(key)){const g={key,date:e.date,events:[]};byMonth.set(key,g);groups.push(g)}
    byMonth.get(key).events.push(e);
  }

  const monthNav=groups.map(g=>{const mi=fcEventMonthInfo(g.date),id='fc-month-'+g.key;return '<button style="--mc:'+mi.color.main+';--ms:'+mi.color.soft+';--md:'+mi.color.dark+'" onclick="fcJumpMonth(\''+id+'\')"><b>'+mi.short+'</b><span>'+mi.year+'</span></button>'}).join('');

  const months=groups.map(g=>{
    const mi=fcEventMonthInfo(g.date),id='fc-month-'+g.key;
    const cards=g.events.map(e=>{
      const ps=eventPersons(e),range=fcEventRangeLabel(e);
      return '<article class="fc-month-event" style="--mc:'+mi.color.main+';--ms:'+mi.color.soft+';--ml:'+mi.color.line+';--md:'+mi.color.dark+'">'+
        '<div class="fc-month-date"><b>'+fcEventDay(e.date)+'</b><span>'+mi.short+'</span><em>'+fcEventWeekday(e.date)+'</em></div>'+
        '<div class="fc-month-eventmain"><div class="fc-month-eventtop"><div><small>'+range+'</small><h3>'+esc(e.title)+'</h3></div><strong>'+(e.time?esc(e.time+(e.end?'–'+e.end:'')):'')+'</strong></div>'+
        (e.note?'<p>'+esc(e.note)+'</p>':'')+
        '<div class="fc-term-bottom"><div class="chips">'+ps.map(p=>'<span class="chip" style="background:'+p.color+'12;color:'+p.color+'">'+esc(p.name)+'</span>').join('')+'</div><button class="fc-delete" type="button" onclick="removeEvent('+JSON.stringify(e.id)+')">Löschen</button></div></div></article>';
    }).join('');
    return '<section class="fc-month-section" id="'+id+'" style="--mc:'+mi.color.main+';--ms:'+mi.color.soft+';--ml:'+mi.color.line+';--md:'+mi.color.dark+'">'+
      '<div class="fc-month-banner"><div><small>MONAT</small><h2>'+mi.name.toUpperCase()+' <span>'+mi.year+'</span></h2></div><b>'+g.events.length+' '+(g.events.length===1?'Termin':'Termine')+'</b></div>'+
      '<div class="fc-month-list">'+cards+'</div></section>';
  }).join('');

  root.innerHTML='<div class="fc-events-page"><div class="section-head"><h3>Termine</h3><button class="pill" onclick="openEventModal()">＋ Neu</button></div><div class="filterbar">'+filters+'</div>'+(groups.length?'<div class="fc-month-jumps">'+monthNav+'</div>':'')+(months||'<div class="empty">Keine kommenden Termine.</div>')+'</div>';
};
function removeEvent(id){
  const e=data.events.find(x=>x.id===id);if(!e)return;
  if(!confirm('Termin „'+e.title+'“ wirklich löschen?'))return;
  data.events=data.events.filter(x=>x.id!==id);save();renderEvents(fcEventFilter);renderToday();toast('Termin gelöscht');
}

renderMore=function(){
  const root=document.getElementById('more');
  root.innerHTML='<div class="section-head"><h3>Mehr</h3></div><div class="settings-stack"><div class="setting"><h4>Automatische Tagesübersichten</h4><p><b>06:30:</b> kompletter heutiger Tag · <b>19:00:</b> Vorschau für morgen. Auf dem iPhone einmal Push erlauben, danach funktionieren die Meldungen auch bei geschlossener App.</p><button class="action secondary" id="pushEnable">Push einrichten</button><button class="action light" style="margin-top:8px" id="pushTest">Test-Push senden</button><div class="status" id="pushStatus">Status wird geprüft …</div></div><div class="setting"><h4>PDF & Drucken</h4><p>Tagesblatt oder Wochenplan direkt als A4 öffnen, drucken oder auf dem iPhone als PDF sichern.</p><button class="action" onclick="fcPrintDay()">Tagesblatt erstellen</button><button class="action light" style="margin-top:8px" onclick="fcPrintWeek()">Wochenplan erstellen</button></div><div class="setting"><h4>Dokumente fotografieren</h4><p>Schulbriefe und Zettel kannst du direkt fotografieren und lokal auf diesem Gerät ablegen.</p><div class="row2"><select id="docPerson" class="pill" style="width:100%">'+data.people.filter(p=>p.id!==\'oli\').map(p=>'<option value="'+p.id+'">'+p.name+'</option>').join('')+'</select><input id="docTitle" placeholder="Titel" style="width:100%;border:1px solid var(--line);border-radius:12px;padding:10px"></div><input id="docFile" class="file-input" type="file" accept="image/*" capture="environment" onchange="updateFileName()"><label for="docFile" class="file-pick"><span>Foto aufnehmen / auswählen</span><small id="docFileName">Noch kein Foto gewählt</small></label><button class="action light" style="margin-top:10px" onclick="saveDoc()">Foto speichern</button><div class="doc-list" id="docList"></div></div><div class="setting"><h4>Schule & Betreuung</h4><div class="contact"><div><b>'+esc(data.common.school.name)+'</b><span>'+esc(data.common.school.address)+'</span></div><a class="call" href="'+phoneHref(data.common.school.phone)+'">'+esc(data.common.school.phone)+'</a></div>'+data.common.care.map(x=>'<div class="contact"><div><b>'+esc(x.name)+'</b><span>'+esc(x.email||'')+'</span></div><a class="call" href="'+phoneHref(x.phone)+'">'+esc(x.phone)+'</a></div>').join('')+'</div><div class="setting"><h4>Daten sichern</h4><p>Alle Familien- und Termin-Daten lassen sich als JSON sichern. Dokumentfotos bleiben separat lokal gespeichert.</p><button class="action light" onclick="exportData()">Backup exportieren</button><button class="action light" style="margin-top:8px" onclick="resetSeed()">Auf vorbereitete Daten zurücksetzen</button></div></div>';
  setupPushUI();renderDocs();
};
function updateFileName(){const i=document.getElementById('docFile'),n=document.getElementById('docFileName');if(n)n.textContent=i&&i.files&&i.files[0]?i.files[0].name:'Noch kein Foto gewählt'}
const fcOriginalSaveDoc=saveDoc;
saveDoc=async function(){await fcOriginalSaveDoc();updateFileName()};

const fcStyle=document.createElement('style');
fcStyle.textContent=`
.fc-events-page{display:grid;gap:14px}.fc-term-bottom{display:flex;align-items:end;justify-content:space-between;gap:10px}.fc-delete{border:0;background:none;color:#94a3b8;font-size:10px;padding:4px 0;white-space:nowrap}.fc-delete:active{color:#b91c1c}
.fc-month-jumps{display:flex;gap:7px;overflow:auto;padding:1px 1px 4px;scrollbar-width:none}.fc-month-jumps::-webkit-scrollbar{display:none}.fc-month-jumps button{flex:0 0 auto;border:1px solid var(--mc);background:var(--ms);color:var(--md);border-radius:12px;padding:8px 12px;min-width:67px;text-align:center}.fc-month-jumps b{display:block;font-size:13px;font-weight:1000}.fc-month-jumps span{display:block;font-size:8px;font-weight:850;margin-top:2px;opacity:.8}
.fc-month-section{scroll-margin-top:14px;border-radius:22px;background:var(--ms);border:1px solid var(--ml);overflow:visible;padding:0 10px 10px}.fc-month-section+.fc-month-section{margin-top:8px}.fc-month-banner{position:sticky;top:0;z-index:6;margin:0 -10px 10px;background:var(--mc);color:#fff;border-radius:20px 20px 14px 14px;padding:13px 15px;display:flex;justify-content:space-between;align-items:center;gap:12px;box-shadow:0 5px 18px rgba(15,23,42,.15)}.fc-month-banner small{display:block;font-size:8px;font-weight:1000;letter-spacing:.15em;opacity:.78}.fc-month-banner h2{margin:2px 0 0;font-size:23px;line-height:1;font-weight:1000;letter-spacing:-.035em}.fc-month-banner h2 span{font-size:12px;opacity:.8;margin-left:5px;letter-spacing:0}.fc-month-banner>b{background:rgba(255,255,255,.17);border:1px solid rgba(255,255,255,.3);border-radius:999px;padding:6px 9px;font-size:9px;white-space:nowrap}
.fc-month-list{display:grid;gap:8px}.fc-month-event{display:grid;grid-template-columns:58px 1fr;gap:11px;background:#fff;border:1px solid var(--ml);border-left:6px solid var(--mc);border-radius:16px;padding:10px;box-shadow:0 2px 6px rgba(15,23,42,.04)}.fc-month-date{background:var(--ms);border:1px solid var(--ml);border-radius:12px;min-height:62px;display:grid;place-content:center;text-align:center;color:var(--md)}.fc-month-date b{font-size:23px;line-height:.95;font-weight:1000}.fc-month-date span{display:block;font-size:10px;font-weight:1000;margin-top:3px}.fc-month-date em{display:block;font-size:7px;font-style:normal;font-weight:900;margin-top:2px;opacity:.72}.fc-month-eventmain{min-width:0}.fc-month-eventtop{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}.fc-month-eventtop small{display:block;color:var(--md);font-size:8px;font-weight:1000;letter-spacing:.04em;margin-bottom:3px}.fc-month-eventtop h3{margin:0;color:#0f172a;font-size:14px;line-height:1.18;font-weight:950}.fc-month-eventtop strong{font-size:11px;color:var(--md);font-weight:1000;white-space:nowrap}.fc-month-eventmain>p{margin:6px 0 0;color:#64748b;font-size:10px;line-height:1.4}
.file-input{position:absolute;opacity:0;pointer-events:none;width:1px;height:1px}.file-pick{margin-top:10px;border:1px dashed #cbd5e1;background:#f8fafc;border-radius:14px;padding:12px 13px;display:flex;align-items:center;justify-content:space-between;gap:10px;cursor:pointer}.file-pick span{font-size:12px;font-weight:800;color:#374151}.file-pick small{font-size:10px;color:var(--muted);text-align:right;max-width:45%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
@media(max-width:430px){.fc-month-banner h2{font-size:21px}.fc-month-banner>b{font-size:8px}.fc-month-event{grid-template-columns:52px 1fr;gap:9px}.fc-month-date{min-height:58px}.fc-month-date b{font-size:21px}.fc-month-eventtop{flex-direction:column;gap:2px}.fc-month-eventtop h3{font-size:13px}.fc-month-eventtop strong{font-size:10px}.fc-month-eventmain>p{font-size:9.5px}}
`;
document.head.appendChild(fcStyle);
renderToday();
