/* Shared person identity and explicit assignment controls. No DOM enhancement pass. */
(()=>{'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const people=()=>typeof data!=='undefined'?(data.people||[]):[];
const ids=value=>[...new Set((Array.isArray(value)?value:[]).map(String).filter(Boolean))];
function badge(id){const p=people().find(x=>String(x.id)===String(id));if(!p)return'';const color=/^#[\da-f]{3,8}$/i.test(p.color||'')?p.color:'#526881';return `<span class="fc-person-badge" data-person-id="${esc(p.id)}" style="--fc-person:${color}"><i aria-hidden="true">${esc(String(p.name||'?').trim().charAt(0))}</i>${esc(p.name)}</span>`}
function picker(id,selected=[]){const chosen=ids(selected),known=people().map(p=>String(p.id)),all=[...people(),...chosen.filter(x=>!known.includes(x)).map(id=>({id,name:'Nicht mehr hinterlegte Person ('+id+')'}))];return `<fieldset class="fc-person-picker" id="${esc(id)}"><legend>Personen</legend>${all.map(p=>`<label><input type="checkbox" value="${esc(p.id)}" ${chosen.includes(String(p.id))?'checked':''}>${badge(p.id)||esc(p.name)}</label>`).join('')}</fieldset>`}
function selection(root,original=[],latest=original){const initial=ids(original),selected=ids([...root.querySelectorAll('input:checked')].map(x=>x.value)),removed=initial.filter(x=>!selected.includes(x));return ids([...ids(latest).filter(x=>!removed.includes(x)),...selected.filter(x=>!initial.includes(x))])}
// A statement of money owed is a memo, not a deadline. Explicit payment/collection actions stay actionable.
function isMoneyNote(x){const title=String(x?.title||'');return x?.kind!=='homework'&&/^(?:.+\bschuldet mir\b|ich schulde\b)/i.test(title)&&!/(?:\b(?:bezahlen|zahlen|überweisen|ueberweisen|einfordern|mahnen|frist|fällig|faellig)\b|\bbis\s+(?:\d|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|morgen|heute))/i.test(title)}
function compareWork(a,b,date){const rank=x=>{if(isMoneyNote(x))return 6;const d=String(x.date||'');if(d&&d<date)return 0;if(d&&d>date)return 4;if(!d)return 5;if(x.priority)return 1;if(x.kind==='homework')return 2;return d?3:5};return rank(a)-rank(b)||String(a.date||'9999').localeCompare(String(b.date||'9999'))||Number(!!b.priority)-Number(!!a.priority)||Number(b.kind==='homework')-Number(a.kind==='homework')}
window.__fcPersonIdentity={badge,picker,selection,compareWork,isMoneyNote};
})();

/* Read-only time labels. Calendar-day distances use UTC dates to survive DST. */
(()=>{'use strict';
 const dayNumber=value=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value||'')))return NaN;return Date.parse(value+'T00:00:00Z')/86400000};
 const today=()=>typeof todayISO==='function'?todayISO():new Date().toLocaleDateString('en-CA');
 function day(date){const n=dayNumber(date)-dayNumber(today());return !Number.isFinite(n)?'Ohne Datum':n===0?'Heute':n===1?'Morgen':n===2?'Übermorgen':n>2?'In '+n+' Tagen':n===-1?'Gestern':'Vor '+Math.abs(n)+' Tagen'}
 function time(date,clock){const label=day(date);if(!clock||!['Heute','Morgen'].includes(label))return label;const at=new Date(date+'T'+clock+':00'),delta=Math.ceil((at-Date.now())/60000);if(!Number.isFinite(delta))return label;if(delta<0)return 'Beginn vorbei';if(delta===0)return 'Jetzt';const left=delta<60?'in '+delta+' Min.':'in '+Math.floor(delta/60)+' Std.'+(delta%60?' '+delta%60+' Min.':'');return label==='Morgen'?'Morgen · '+left:left[0].toUpperCase()+left.slice(1)}
 function duration(n){return n<60?n+' Min.':Math.floor(n/60)+' Std.'+(n%60?' '+n%60+' Min.':'')}
 function event(e){const last=e.endDate||e.date,now=new Date(),start=e.time?new Date(e.date+'T'+e.time+':00'):null,end=e.end?new Date(last+'T'+e.end+':00'):null;if(start&&end&&end<start)return 'Endzeit prüfen';if(last<today())return 'Vergangen';if(end&&end<=now)return 'Beendet';if(start&&start<=now&&end&&end>now)return 'Läuft · noch '+duration(Math.ceil((end-now)/60000));if(e.date<today()&&last>=today())return 'Bis '+day(last).toLowerCase();if(start&&start<now&&!end)return 'Beginn vorbei · Ende offen';return time(e.date,e.time)}
 function refresh(){if(document.hidden)return;for(const el of document.querySelectorAll('[data-relative-event]')){const e=(typeof data!=='undefined'?data.events||[]:[]).find(e=>String(e.id)===el.dataset.relativeEvent);if(e)el.textContent=event(e)}window.__fcClarity?.refresh?.()}
 window.setInterval?.(refresh,60000);window.document?.addEventListener('visibilitychange',refresh);window.addEventListener?.('pageshow',refresh);
 window.__fcGlanceTime={day,time,event};
})();

/* V9.87 shared read-only presentation model. No save, storage or network writes. */
(()=>{'use strict';
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const people=()=>typeof data!=='undefined'?data.people||[]:[];
 const today=()=>todayISO();
 const ids=item=>[...new Set((Array.isArray(item?.personIds)?item.personIds:item?.personId?[item.personId]:[]).map(String))];
 const matches=(item,id)=>id==='all'||(!ids(item).length?id==='unassigned':ids(item).includes(String(id)));
 function who(item){const assigned=ids(item);return assigned.length?assigned.map(id=>window.__fcPersonIdentity.badge(id)||'<span class="fc987-unassigned">Person nicht mehr hinterlegt</span>').join(' '):'<span class="fc987-unassigned">Nicht zugeordnet</span>'}
 function filters(value='all',attribute='data-person-filter',unassigned=false){const list=[{id:'all',name:'Alle'},...people(),...(unassigned?[{id:'unassigned',name:'Ohne Zuordnung'}]:[])];return `<div class="fc9-filters fc987-person-filters" role="group" aria-label="Nach Person filtern">${list.map(p=>`<button type="button" class="fc9-filter ${String(p.id)===value?'active':''}" ${attribute}="${esc(p.id)}" aria-pressed="${String(p.id)===value}" style="--person:${/^#[\da-f]{3,8}$/i.test(p.color||'')?p.color:'#526881'}">${esc(p.name)}</button>`).join('')}</div>`}
 function eventState(e){const now=new Date(),last=e.endDate||e.date,start=e.time?new Date(e.date+'T'+e.time+':00'):null,end=e.end?new Date(last+'T'+e.end+':00'):null;if(start&&end&&end<start)return 'time-conflict';if(last<today()||(end&&end<=now))return 'past';if(start&&start<=now){if(end&&end>now)return 'running';if(last===today())return 'started';if(last>today())return 'spanning'}return e.time?'upcoming':'untimed'}
 function exact(e){const short=d=>new Date(d+'T12:00:00').toLocaleDateString('de-CH',{day:'2-digit',month:'2-digit'});return e.endDate&&e.endDate!==e.date?[short(e.date),e.time,'–',short(e.endDate),e.end,!e.time&&!e.end?'· Ohne Uhrzeit':''].filter(Boolean).join(' '):e.time?[e.time,e.end].filter(Boolean).join('–'):'Ohne Uhrzeit'}
 function next(date=today()){
  const live=date===today(),now=new Date(),clock=now.getHours()*60+now.getMinutes(),mins=t=>/^\d{1,2}:\d{2}$/.test(String(t||''))?Number(t.split(':')[0])*60+Number(t.split(':')[1]):null,a=[];
  const add=(time,entry)=>{const m=mins(time);if(m!==null&&(!live||m>=clock))a.push({...entry,time,m,date})};
  for(const p of people().filter(p=>p.id!=='oli')){let slots=[];try{slots=schoolDayFor(p.id,date).slots||[]}catch(_){}for(const s of slots){const dm=mins(s.depart),sm=mins(s.start);if(dm!==null&&(!live||dm>=clock))add(s.depart,{title:p.name+' los',personIds:[p.id],kind:'school',sub:'Von zuhause los.'});else if(sm!==null&&(!live||sm>=clock))add(s.start,{title:p.name+' beginnt',personIds:[p.id],kind:'school',sub:s.label||'Schule / Kindergarten'});if(!live||mins(s.end)>clock)add(s.end,{title:p.name+' fertig',personIds:[p.id],kind:'school',sub:'Schul- oder Kindergartenende'})}}
  for(const e of(typeof data!=='undefined'?data.events||[]:[]))if(e.date===date&&e.time)add(e.time,{title:e.title||'Termin',personIds:ids(e),kind:'event',eventId:e.id,sub:''});
  a.sort((a,b)=>a.m-b.m);if(!a.length)return null;const first=a[0],items=a.filter(x=>x.m===first.m);return {...first,items,title:items.map(x=>x.kind==='event'&&items.length>1?[ids(x).map(id=>people().find(p=>String(p.id)===id)?.name||'Nicht zugeordnet').join(' + ')||'Nicht zugeordnet',x.title].join(': '):x.title).join(' · '),left:__fcGlanceTime.time(date,first.time)};
 }
 let lastViewSignature='',pointerHeld=false;
 document.addEventListener('pointerdown',()=>{pointerHeld=true},{passive:true});document.addEventListener('pointerup',()=>{pointerHeld=false},{passive:true});document.addEventListener('pointercancel',()=>{pointerHeld=false},{passive:true});
 function refresh(){const app=window.__fcV9;if(!app||document.hidden)return;const signature=today()+'|'+(typeof data!=='undefined'?data.events||[]:[]).map(e=>String(e.id)+':'+eventState(e)).join('|');if(signature===lastViewSignature)return;if(pointerHeld||document.querySelector('[role="dialog"],.fc9-modal,.fc-event-modal'))return;lastViewSignature=signature;app.invalidate(['events','tomorrow','homework']);if(!['events','tomorrow','homework'].includes(app.state.screen))return;const root=document.getElementById(app.state.screen),pastOpen=root?.querySelector('.fc9-past-toggle')?.getAttribute('aria-expanded')==='true';app.render(app.state.screen,true);if(pastOpen)root.querySelector('.fc9-past-toggle')?.click()}
 document.addEventListener('fc:v9-ready',()=>{lastViewSignature=today()+'|'+(typeof data!=='undefined'?data.events||[]:[]).map(e=>String(e.id)+':'+eventState(e)).join('|')});
 window.__fcClarity={ids,matches,who,filters,eventState,exact,next,refresh};
})();
