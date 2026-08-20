let fcEventFilter='all';

function fcDayLabel(slots){
  const bits=[];
  for(const s of slots){
    for(const part of String(s.label||'').split(' · ')){
      if(part&&!bits.includes(part))bits.push(part);
    }
  }
  return bits.join(' · ');
}
function fcSlotSummary(s){return s.depart?'Abfahrt '+s.depart+' · '+s.start+'–'+s.end:s.start+'–'+s.end}

nextImportant=function(){
  const now=new Date(),date=todayISO(),mins=now.getHours()*60+now.getMinutes();
  let items=[];
  for(const p of data.people){
    for(const s of scheduleFor(p.id,now.getDay())){
      const clock=s.depart||s.start,[h,m]=clock.split(':').map(Number);
      items.push({when:h*60+m,title:p.name+' · '+s.label,sub:(s.depart?'Abfahrt '+s.depart+' · ':'')+s.start+'–'+s.end,time:clock});
    }
  }
  for(const e of eventsOn(date)){
    if(e.time){const[h,m]=e.time.split(':').map(Number);items.push({when:h*60+m,title:e.title,sub:eventPersons(e).map(x=>x.name).join(', '),time:e.time})}
  }
  items=items.filter(x=>x.when>=mins-5).sort((a,b)=>a.when-b.when);
  if(items[0])return items[0];
  const up=upcoming(1)[0];
  if(up)return{title:up.title,sub:fmtDate(up.date,{weekday:true})+' · '+eventPersons(up).map(x=>x.name).join(', '),time:up.time||'Termin'};
  return null;
};

renderToday=function(){
  const root=document.getElementById('today'),now=new Date(),date=iso(now),day=now.getDay(),c=checks(),next=nextImportant();
  const peopleHtml=data.people.map(p=>{
    const slots=scheduleFor(p.id,day);let state='Heute keine feste Zeit',strong='frei';
    if(slots.length){state=fcDayLabel(slots);strong=slots.map(fcSlotSummary).join(' · ')}
    return '<div class="person-card"><div class="person-top"><i class="dot" style="background:'+p.color+'"></i><b>'+esc(p.name)+'</b></div><div class="state">'+esc(state)+'</div><div class="strong">'+esc(strong)+'</div></div>';
  }).join('');
  const reminderHtml=remindersFor(day).map(r=>{
    const p=person(r.personId);
    return '<div class="check-group"><div class="check-title"><i class="dot" style="background:'+p.color+'"></i>'+esc(p.name)+'</div><div class="checklist">'+r.items.map(item=>{
      const k=checkKey(date,r.id,item),on=!!c[k];
      return '<label class="checkrow '+(on?'done':'')+'"><input type="checkbox" '+(on?'checked':'')+' onchange="setCheck('+JSON.stringify(k)+',this.checked)"><span>'+esc(item)+'</span></label>';
    }).join('')+'</div></div>';
  }).join('')||'<div class="empty">Heute gibt es keine Pack-Erinnerungen.</div>';
  const todays=eventsOn(date).map(e=>eventRow(e)).join('')||'<div class="empty">Heute keine zusätzlichen Termine.</div>';
  const up=upcoming(5).map(e=>eventRow(e,true)).join('')||'<div class="empty">Keine kommenden Termine.</div>';
  root.innerHTML='<div class="hero"><div class="eyebrow">'+esc(longDate(now))+'</div><h2>'+(day===0||day===6?'Wochenende im Blick.':'Heute sofort sehen, was zählt.')+'</h2><p>Stundenpläne, Abfahrten, Packlisten und Termine für die ganze Familie.</p>'+(next?'<div class="hero-next"><div><b>'+esc(next.title)+'</b><span>'+esc(next.sub)+'</span></div><div class="timebadge">'+esc(next.time)+'</div></div>':'')+'</div><div class="section"><div class="section-head"><h3>Heute</h3><span>'+DAYS[day]+'</span></div><div class="people-strip">'+peopleHtml+'</div></div><div class="section grid2"><div><div class="section-head"><h3>Nicht vergessen</h3><span>morgens abhaken</span></div><div class="card"><div class="card-pad">'+reminderHtml+'</div></div></div><div><div class="section-head"><h3>Termine heute</h3></div><div class="card"><div class="card-pad timeline">'+todays+'</div></div></div></div><div class="section"><div class="section-head"><h3>Demnächst</h3><button class="plainbtn" onclick="openScreen(\'events\')">Alle Termine</button></div><div class="card"><div class="card-pad timeline">'+up+'</div></div></div>';
};

renderEvents=function(filter='all'){
  fcEventFilter=filter;
  const root=document.getElementById('events');
  const filters=['all',...data.people.map(p=>p.id)].map(id=>'<button class="pill '+(filter===id?'active':'')+'" onclick="renderEvents(\''+id+'\')">'+(id==='all'?'Alle':person(id).name)+'</button>').join('');
  const t=todayISO();
  const es=data.events.filter(e=>(e.endDate||e.date)>=t&&(filter==='all'||e.personIds.includes(filter))).sort((a,b)=>(a.date+(a.time||'99:99')).localeCompare(b.date+(b.time||'99:99')));
  let html='',last='';
  for(const e of es){
    if(e.date!==last){last=e.date;html+='<div class="term-date fc-date-head">'+fmtDate(e.date,{weekday:true,year:true})+(e.endDate?' – '+fmtDate(e.endDate,{year:true}):'')+'</div>'}
    html+='<div class="term-card"><div class="term-top"><b>'+esc(e.title)+'</b><span class="term-time">'+esc(e.time?e.time+(e.end?'–'+e.end:''):'')+'</span></div>'+(e.note?'<p>'+esc(e.note)+'</p>':'')+'<div class="fc-term-bottom"><div class="chips">'+eventPersons(e).map(p=>'<span class="chip" style="background:'+p.color+'12;color:'+p.color+'">'+p.name+'</span>').join('')+'</div><button class="fc-delete" type="button" onclick="removeEvent(\''+e.id.replace(/'/g,"\\'")+'\')">Löschen</button></div></div>';
  }
  root.innerHTML='<div class="section-head"><h3>Termine</h3><button class="pill" onclick="openEventModal()">＋ Neu</button></div><div class="filterbar">'+filters+'</div>'+(html||'<div class="empty">Keine kommenden Termine.</div>');
};
function removeEvent(id){
  const e=data.events.find(x=>x.id===id);if(!e)return;
  if(!confirm('Termin „'+e.title+'“ wirklich löschen?'))return;
  data.events=data.events.filter(x=>x.id!==id);save();renderEvents(fcEventFilter);renderToday();toast('Termin gelöscht');
}

renderMore=function(){
  const root=document.getElementById('more');
  root.innerHTML='<div class="section-head"><h3>Mehr</h3></div><div class="settings-stack"><div class="setting"><h4>Morgenbericht · 06:30</h4><p>Auf dem iPhone als App zum Home-Bildschirm hinzufügen und Push aktivieren. Danach kann Family Command den Morgenbericht auch bei geschlossener App senden.</p><button class="action secondary" id="pushEnable">Push einrichten</button><button class="action light" style="margin-top:8px" id="pushTest">Test-Push senden</button><div class="status" id="pushStatus">Status wird geprüft …</div></div><div class="setting"><h4>Dokumente fotografieren</h4><p>Schulbriefe und Zettel kannst du direkt fotografieren und lokal auf diesem Gerät ablegen.</p><div class="row2"><select id="docPerson" class="pill" style="width:100%">'+data.people.filter(p=>p.id!=='oli').map(p=>'<option value="'+p.id+'">'+p.name+'</option>').join('')+'</select><input id="docTitle" placeholder="Titel" style="width:100%;border:1px solid var(--line);border-radius:12px;padding:10px"></div><input id="docFile" class="file-input" type="file" accept="image/*" capture="environment" onchange="updateFileName()"><label for="docFile" class="file-pick"><span>Foto aufnehmen / auswählen</span><small id="docFileName">Noch kein Foto gewählt</small></label><button class="action light" style="margin-top:10px" onclick="saveDoc()">Foto speichern</button><div class="doc-list" id="docList"></div></div><div class="setting"><h4>Schule & Betreuung</h4><div class="contact"><div><b>'+esc(data.common.school.name)+'</b><span>'+esc(data.common.school.address)+'</span></div><a class="call" href="'+phoneHref(data.common.school.phone)+'">'+esc(data.common.school.phone)+'</a></div>'+data.common.care.map(x=>'<div class="contact"><div><b>'+esc(x.name)+'</b><span>'+esc(x.email||'')+'</span></div><a class="call" href="'+phoneHref(x.phone)+'">'+esc(x.phone)+'</a></div>').join('')+'</div><div class="setting"><h4>Daten sichern</h4><p>Alle Familien- und Termin-Daten lassen sich als JSON sichern. Dokumentfotos bleiben separat lokal gespeichert.</p><button class="action light" onclick="exportData()">Backup exportieren</button><button class="action light" style="margin-top:8px" onclick="resetSeed()">Auf vorbereitete Daten zurücksetzen</button></div></div>';
  setupPushUI();renderDocs();
};
function updateFileName(){const i=document.getElementById('docFile'),n=document.getElementById('docFileName');if(n)n.textContent=i&&i.files&&i.files[0]?i.files[0].name:'Noch kein Foto gewählt'}
const fcOriginalSaveDoc=saveDoc;
saveDoc=async function(){await fcOriginalSaveDoc();updateFileName()};

const fcStyle=document.createElement('style');
fcStyle.textContent='.fc-date-head{margin:18px 2px 7px}.fc-date-head:first-of-type{margin-top:4px}.fc-term-bottom{display:flex;align-items:end;justify-content:space-between;gap:10px}.fc-delete{border:0;background:none;color:#9ca3af;font-size:10px;padding:4px 0;white-space:nowrap}.fc-delete:active{color:#b91c1c}.file-input{position:absolute;opacity:0;pointer-events:none;width:1px;height:1px}.file-pick{margin-top:10px;border:1px dashed #cbd5e1;background:#f8fafc;border-radius:14px;padding:12px 13px;display:flex;align-items:center;justify-content:space-between;gap:10px;cursor:pointer}.file-pick span{font-size:12px;font-weight:800;color:#374151}.file-pick small{font-size:10px;color:var(--muted);text-align:right;max-width:45%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.person-card .strong{line-height:1.2}';
document.head.appendChild(fcStyle);
renderToday();
