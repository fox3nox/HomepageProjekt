let fcEventFilter='all';
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
const fcStyle=document.createElement('style');
fcStyle.textContent='.fc-date-head{margin:18px 2px 7px}.fc-date-head:first-of-type{margin-top:4px}.fc-term-bottom{display:flex;align-items:end;justify-content:space-between;gap:10px}.fc-delete{border:0;background:none;color:#9ca3af;font-size:10px;padding:4px 0;white-space:nowrap}.fc-delete:active{color:#b91c1c}';
document.head.appendChild(fcStyle);
