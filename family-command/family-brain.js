/* Family Command · Family Brain V10.1 preview
   Read-only answers from canonical family state + document metadata.
   Never writes appointments, tasks or documents. A future local provider can
   be attached through window.__fcFamilyBrain.setProvider(fn). */
(()=>{'use strict';
if(window.__fcFamilyBrain)return;

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rows=v=>Array.isArray(v)?v:Object.values(v||{});
const active=x=>x&&!x.deleted&&!x.archived;
const D=()=>window.data&&typeof window.data==='object'?window.data:{};
const iso=d=>{const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`};
const atNoon=s=>new Date(String(s).slice(0,10)+'T12:00:00');
const addDays=(s,n)=>{const d=atNoon(s);d.setDate(d.getDate()+n);return iso(d)};
const today=()=>typeof window.todayISO==='function'?window.todayISO():iso(new Date());
const norm=s=>String(s??'').toLocaleLowerCase('de-CH').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ä/g,'a').replace(/ö/g,'o').replace(/ü/g,'u').replace(/ß/g,'ss').replace(/[^a-z0-9]+/g,' ').trim();
const formatDate=s=>{try{return new Intl.DateTimeFormat('de-CH',{weekday:'short',day:'numeric',month:'short'}).format(atNoon(s))}catch{return s||''}};
const personName=id=>rows(D().people).find(p=>String(p.id)===String(id))?.name||'';
const names=ids=>[...new Set((ids||[]).map(personName).filter(Boolean))].join(' · ');
const knownPeople=()=>rows(D().people).filter(active);
let provider=null;

function mondayOf(dateIso){
  const d=atNoon(dateIso),day=d.getDay()||7;
  d.setDate(d.getDate()-(day-1));
  return iso(d);
}
function rangeFor(query,now=today()){
  const q=norm(query);
  if(q.includes('nachste woche')||q.includes('naechste woche')){
    const start=addDays(mondayOf(now),7);return{start,end:addDays(start,6),label:'nächste Woche'};
  }
  if(q.includes('diese woche')||q.includes('diese woche')){
    const start=mondayOf(now);return{start,end:addDays(start,6),label:'diese Woche'};
  }
  if(q.includes('morgen')){const start=addDays(now,1);return{start,end:start,label:'morgen'}}
  if(q.includes('heute'))return{start:now,end:now,label:'heute'};
  return null;
}
function personFilter(query){
  const q=norm(query);
  return knownPeople().filter(p=>[p.name,...rows(p.aliases)].some(a=>a&&q.includes(norm(a)))).map(p=>String(p.id));
}
function within(date,range){const s=String(date||'').slice(0,10);return !range||Boolean(s&&s>=range.start&&s<=range.end)}
function eventDate(x){return String(x.date||x.startDate||'').slice(0,10)}
function taskDate(x){return String(x.date||x.dueDate||'').slice(0,10)}
function personMatch(ids,filter){if(!filter.length)return true;return(ids||[]).some(id=>filter.includes(String(id)))}

function context({query='',history=false}={}){
  const range=rangeFor(query),pf=personFilter(query),d=D(),now=today();
  const events=rows(d.events).filter(active).filter(x=>(history||eventDate(x)>=now)&&within(eventDate(x),range)&&personMatch(x.personIds||[x.personId],pf));
  const todos=rows(d.todos).filter(active).filter(x=>history||!x.done).filter(x=>within(taskDate(x),range)&&personMatch([x.personId],pf));
  const homework=rows(d.homework).filter(active).filter(x=>history||!x.done).filter(x=>within(taskDate(x),range)&&personMatch([x.personId],pf));
  const docs=rows(window.__fcDocumentLibrary?.cached?.()).filter(x=>personMatch(x.personIds||[],pf));
  return{now,range,personIds:pf,events,todos,homework,documents:docs,people:knownPeople().map(p=>({id:String(p.id),name:p.name}))};
}
function sourceForEvent(x){return{kind:'event',id:String(x.id||''),label:'Termin öffnen',action:()=>window.fcOpenEventDetails?.(x.id)}}
function sourceForDoc(x){return{kind:'document',id:String(x.id||''),label:x.title||'Original öffnen',action:()=>window.fcOpenOriginal?.(x.id)}}
function lineForEvent(x){return `${formatDate(eventDate(x))}${x.time?' · '+x.time:''} — ${x.title}${names(x.personIds||[x.personId])?' · '+names(x.personIds||[x.personId]):''}`}
function lineForTodo(x,kind='Aufgabe'){return `${formatDate(taskDate(x))} — ${x.title}${personName(x.personId)?' · '+personName(x.personId):''} (${kind})`}

function docsMatching(query,docs){
  const tokens=norm(query).split(' ').filter(t=>t.length>2&&!['wann','war','noch','mal','steht','stand','etwas','uber','ueber','dem','der','die','das','einen','eine','einer','wo','ist','sind','mein','meine','was'].includes(t));
  return docs.map(d=>{
    const text=norm([d.title,d.summary,d.description,d.searchText,d.document_type,d.mime_type,JSON.stringify(d.metadata||{})].join(' '));
    const score=tokens.reduce((n,t)=>n+(text.includes(t)?1:0),0);
    return{d,score};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,8).map(x=>x.d);
}
function requirements(query,ctx){
  const q=norm(query);
  if(!/(mitnehmen|mitbringen|braucht|benotigt|benoetigt|vorbereiten|einpacken)/.test(q))return[];
  const out=[];
  for(const e of ctx.events){
    const text=[e.note,e.requirements,e.preparation,e.whatToBring].flat().filter(Boolean).join(' · ');
    if(text)out.push({text:`${e.title}: ${text}`,source:sourceForEvent(e)});
  }
  for(const d of ctx.documents){
    const text=[d.summary,d.description,d.searchText].filter(Boolean).join(' ');
    if(/mitnehm|mitbring|turn|rucksack|kleid|schuh|material|verpfleg|regen|wetter/i.test(text))out.push({text:`${d.title}: ${text.slice(0,320)}`,source:sourceForDoc(d)});
  }
  return out.slice(0,10);
}
function deterministic(query){
  const ctx=context({query}),q=norm(query),sources=[];
  if(!query.trim())return{answer:'Stell mir eine Frage zu Terminen, Aufgaben oder Dokumenten.',sources,context:ctx};

  const req=requirements(query,ctx);
  if(req.length){
    req.forEach(x=>sources.push(x.source));
    return{answer:req.map(x=>'• '+x.text).join('\n'),sources:dedupeSources(sources),context:ctx};
  }

  if(/(dokument|brief|quartal|wo stand|wo ist|finde|herbstbummel|zahnarzt)/.test(q)){
    const matches=docsMatching(query,ctx.documents);
    if(matches.length){
      matches.forEach(x=>sources.push(sourceForDoc(x)));
      return{answer:matches.map(d=>`• ${d.title}${names(d.personIds)?' · '+names(d.personIds):''}`).join('\n'),sources:dedupeSources(sources),context:ctx};
    }
  }

  if(ctx.range||/(termin|aufgabe|hausaufgabe|plan|was habe|was ist)/.test(q)){
    const parts=[];
    for(const e of ctx.events.sort((a,b)=>(eventDate(a)+(a.time||'')).localeCompare(eventDate(b)+(b.time||'')))){parts.push('• '+lineForEvent(e));sources.push(sourceForEvent(e))}
    for(const h of ctx.homework.sort((a,b)=>taskDate(a).localeCompare(taskDate(b))))parts.push('• '+lineForTodo(h,'Hausaufgabe'));
    for(const t of ctx.todos.sort((a,b)=>taskDate(a).localeCompare(taskDate(b))))parts.push('• '+lineForTodo(t,'Aufgabe'));
    if(parts.length)return{answer:(ctx.range?`Für ${ctx.range.label}:\n`:'')+parts.join('\n'),sources:dedupeSources(sources),context:ctx};
    return{answer:ctx.range?`Für ${ctx.range.label} finde ich in den gespeicherten Daten keine offenen Termine oder Aufgaben.`:'Ich finde dazu in den gespeicherten Daten nichts Eindeutiges.',sources,context:ctx};
  }

  const matches=docsMatching(query,ctx.documents);
  if(matches.length){matches.forEach(x=>sources.push(sourceForDoc(x)));return{answer:matches.map(d=>'• '+d.title).join('\n'),sources:dedupeSources(sources),context:ctx}}
  return{answer:'Ich finde dazu in den gespeicherten Daten nichts Eindeutiges. Ich rate nicht.',sources,context:ctx};
}
function dedupeSources(list){const seen=new Set();return list.filter(x=>{const k=x.kind+':'+x.id;if(seen.has(k))return false;seen.add(k);return true})}

async function answer(query){
  try{await window.__fcDocumentLibrary?.list?.()}catch{}
  const base=deterministic(query);
  if(typeof provider!=='function')return base;
  try{
    const result=await provider({query,context:base.context});
    if(result&&typeof result.answer==='string')return{...base,...result,sources:dedupeSources([...(result.sources||[]),...base.sources])};
  }catch(e){console.warn('fc_family_brain_provider',e)}
  return base;
}
function installButton(){
  if(document.getElementById('fcFamilyBrainBtn'))return true;
  const tools=document.querySelector('.aitools');if(!tools)return false;
  const b=document.createElement('button');b.type='button';b.id='fcFamilyBrainBtn';b.className='fc-brain-btn';b.setAttribute('aria-label','Familienzentrale fragen');b.innerHTML='<i aria-hidden="true">⌕</i><b>Fragen</b>';b.onclick=open;
  const ai=document.getElementById('fcAiBtn');tools.insertBefore(b,ai||tools.firstChild);return true;
}
function sourceButtons(sources){
  if(!sources.length)return'';
  return `<div class="fc-brain-sources"><b>Quellen</b>${sources.map((s,i)=>`<button type="button" data-source="${i}">${esc(s.label||'Quelle öffnen')}</button>`).join('')}</div>`;
}
function open(){
  document.getElementById('fcFamilyBrain')?.remove();
  const m=document.createElement('div');m.id='fcFamilyBrain';m.className='fc-brain-modal';
  m.innerHTML=`<section class="fc-brain-sheet" role="dialog" aria-modal="true" aria-labelledby="fcBrainTitle"><header><div><small>DEINE DATEN</small><h2 id="fcBrainTitle">Familienzentrale fragen</h2><p>Antworten kommen aus gespeicherten Terminen, Aufgaben und Dokumenten. Ohne Beleg wird nicht geraten.</p></div><button type="button" data-close aria-label="Schliessen">×</button></header><div class="fc-brain-prompts"><button>Was habe ich nächste Woche?</button><button>Was müssen wir morgen mitnehmen?</button><button>Wo steht etwas zum Herbstbummel?</button></div><form><label><span class="sr-only">Frage</span><textarea rows="3" placeholder="Frag z. B. «Welche Termine hat Fynn nächste Woche?»"></textarea></label><button type="submit">Antwort suchen</button></form><div class="fc-brain-status" role="status" aria-live="polite"></div><article class="fc-brain-answer" hidden></article></section>`;
  const sheet=m.querySelector('.fc-brain-sheet'),input=m.querySelector('textarea'),status=m.querySelector('.fc-brain-status'),out=m.querySelector('.fc-brain-answer');
  const close=()=>m.remove();m.querySelector('[data-close]').onclick=close;m.onclick=e=>{if(e.target===m)close()};
  m.querySelectorAll('.fc-brain-prompts button').forEach(b=>b.onclick=()=>{input.value=b.textContent;run()});
  async function run(){
    const q=input.value.trim();if(!q)return;
    status.textContent='Ich prüfe deine gespeicherten Daten …';out.hidden=true;
    const r=await answer(q);status.textContent='';
    out.innerHTML=`<div class="fc-brain-text">${esc(r.answer).replace(/\n/g,'<br>')}</div>${sourceButtons(r.sources||[])}`;out.hidden=false;
    out.querySelectorAll('[data-source]').forEach(b=>{b.onclick=()=>{const s=r.sources[Number(b.dataset.source)];if(s?.action){close();s.action()}}});
  }
  m.querySelector('form').onsubmit=e=>{e.preventDefault();run()};
  document.body.appendChild(m);setTimeout(()=>input.focus(),0);
}
const observer=new MutationObserver(()=>installButton());observer.observe(document.documentElement,{subtree:true,childList:true});installButton();
window.__fcFamilyBrain={version:'10.1-preview',readOnly:true,answer,context,open,setProvider:fn=>{provider=typeof fn==='function'?fn:null},health:()=>({ok:true,readOnly:true,provider:Boolean(provider)})};
window.fcOpenFamilyBrain=open;
})();