// Pure, read-only formatter for the existing morning/evening delivery schedule.
const list=x=>Array.isArray(x)?x:[];
const text=(x,max=90)=>{const s=String(x??'').replace(/\s+/g,' ').trim();return s.length>max?s.slice(0,max-1)+'…':s};
const time=x=>/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(String(x||''))?String(x):'';
const ids=e=>list(e.personIds).length?e.personIds.map(String):String(e.personId||'').split(',').filter(Boolean);
const unique=xs=>[...new Set(xs.filter(Boolean))];
const active=(e,date)=>e.date===date||!!(e.endDate&&e.date<=date&&e.endDate>=date);
const holiday=e=>/(ferien|osterwochenende|auffahrt|pfingsten)/i.test(String(e.title||''));
const pack=e=>String(e.note||'').match(/(?:^|[\n.;])\s*Mitnehmen\s*:\s*([^\n]+)/i)?.[1]?.trim()||'';
const join=xs=>{const all=unique(xs.map(x=>text(x)));return all.slice(0,3).join(' · ')+(all.length>3?` · +${all.length-3} weitere in der App`:'')};
function notificationBody(lines){
 const selected=[];let shortened=false;
 for(const line of lines){const brief=text(line,360);if(brief!==line)shortened=true;if(new TextEncoder().encode([...selected,brief].join('\n')).length>2500){shortened=true;continue}selected.push(brief)}
 if(shortened)selected.push('Weitere Einzelheiten in der App.');
 return selected.join('\n');
}
function localDay(tz,now,offset){
 const day=new Intl.DateTimeFormat('en-CA',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now),get=t=>day.find(x=>x.type===t).value;
 const d=new Date(`${get('year')}-${get('month')}-${get('day')}T12:00:00Z`);d.setUTCDate(d.getUTCDate()+offset);
 return{date:d.toISOString().slice(0,10),weekday:d.getUTCDay(),label:new Intl.DateTimeFormat('de-CH',{weekday:'long',timeZone:'UTC'}).format(d)};
}
export function buildDigest(state,tz='Europe/Zurich',daysAhead=0,mode='morning',now=new Date()){
 const day=localDay(tz,now,daysAhead),people=list(state?.people),events=list(state?.events).filter(e=>e&&active(e,day.date));
 const breaks=events.filter(holiday),schoolBreak=pid=>breaks.find(e=>!ids(e).length||ids(e).includes(String(pid)));
 const rules=list(state?.rules).filter(r=>r&&Number(r.day)===day.weekday),allTasks=list(state?.tasks).filter(t=>t&&!t.done&&!t.archived&&/^\d{4}-\d{2}-\d{2}$/.test(String(t.date))&&t.date<=day.date);
 const isPack=t=>String(t.id||'').startsWith('rem-'),isHomework=t=>/^HAUSAUFGABE:/i.test(String(t.title||''))||String(t.id||'').startsWith('hw-');
 const work=allTasks.filter(t=>!isPack(t)),packing=allTasks.filter(t=>isPack(t)&&t.date===day.date&&!schoolBreak(t.personId));
 const lines=[],departures=[];
 for(const p of people){
  const pid=String(p.id),name=text(p.name,30),parent=pid==='oli'||/parent|eltern/i.test(String(p.role||'')),pause=schoolBreak(pid);
  const slots=(pause&&!parent?[]:rules.filter(r=>String(r.personId)===pid)).sort((a,b)=>String(a.start||a.time).localeCompare(String(b.start||b.time)));
  const first=slots[0],last=slots.at(-1),start=time(first?.start||first?.time),end=time(last?.end);
  // Legacy snapshots used time for depart-or-start. Equal times cannot prove a departure.
  const depart=time(first?.depart)||(first?.time!==first?.start?time(first?.time):'');
  if(!parent&&depart)departures.push({time:depart,name});
  const schedule=slots.length?[(parent?text(first.title||'Arbeit',35):''),depart?`${depart} los`:'',[start,end].filter(Boolean).join('–')].filter(Boolean).join(' · '):pause?text(pause.title,65):parent?'':'Kein Unterricht eingetragen';
  const mine=events.filter(e=>!holiday(e)&&ids(e).includes(pid));
  const packed=unique([...packing.filter(t=>String(t.personId)===pid).map(t=>text(t.title).replace(new RegExp('^'+name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+':\\s*'),'')),...mine.map(pack),...slots.map(s=>/mitnehm|turnzeug|schwimmsachen|leuchtweste/i.test(String(s.note||''))?text(s.note):'')]);
  const homework=work.filter(t=>isHomework(t)&&String(t.personId)===pid).map(t=>`${t.date<day.date?'Überfällig: ':''}${text(t.title).replace(/^HAUSAUFGABE:\s*/i,'')}`);
  if(schedule||packed.length||homework.length)lines.push(`${name}: ${[schedule,packed.length?'Mitnehmen: '+join(packed):'',homework.length?'Schule: '+join(homework):''].filter(Boolean).join(' · ')}`);
 }
 departures.sort((a,b)=>a.time.localeCompare(b.time));if(departures.length){const first=departures[0];lines.unshift(`${first.time} los: ${departures.filter(x=>x.time===first.time).map(x=>x.name).join(' · ')}`)}
 const remaining=work.filter(t=>!isHomework(t)||!people.some(p=>String(p.id)===String(t.personId))).sort((a,b)=>String(a.date).localeCompare(String(b.date)));
 if(remaining.length)lines.push('Offen: '+join(remaining.map(t=>`${t.date<day.date?'Überfällig – ':''}${people.find(p=>String(p.id)===String(t.personId))?.name?text(people.find(p=>String(p.id)===String(t.personId)).name,25)+': ':''}${text(t.title)}`)));
 const meetings=events.filter(e=>!holiday(e)).sort((a,b)=>String(a.time||'99:99').localeCompare(String(b.time||'99:99')));
 for(const e of meetings.slice(0,4)){const names=ids(e).map(id=>people.find(p=>String(p.id)===id)?.name||id).join(' + ');lines.push(`${time(e.time)||'Ganztägig'} · ${names?text(names,60)+' · ':''}${text(e.title,75)}${!ids(e).length&&pack(e)?' · Mitnehmen: '+text(pack(e)):''}`)}
 if(meetings.length>4)lines.push(`+ ${meetings.length-4} weitere Termine in der App`);
 if(!lines.length)lines.push('Keine zusätzlichen Einträge für diesen Tag.');
 return{title:`${mode==='evening'?'Morgen vorbereiten':'Heute im Blick'} · ${day.label}`,body:notificationBody(lines),tag:`fc-${mode}-${day.date}`,url:`https://fox3nox.github.io/HomepageProjekt/family-command/?screen=${mode==='evening'?'tomorrow':'today'}`,date:day.date};
}
