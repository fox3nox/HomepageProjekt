const STORE_KEY='morgenklar-v5';
const OLD_KEYS=['mk-standalone-v4','mk-v4','morgenklar-pwa-v2'];
const WEEKDAYS=[['mon','Montag'],['tue','Dienstag'],['wed','Mittwoch'],['thu','Donnerstag'],['fri','Freitag']];
const DEFAULT_CHILDREN=[
  {id:'jayden',name:'Jayden',tone:'blue'},{id:'fynn',name:'Fynn',tone:'green'},{id:'elia',name:'Elia',tone:'orange'}
];
const DEFAULT_TIMES={
  jayden:{mon:['07:45–11:50','13:30–15:10'],tue:['07:45–11:50','13:30–15:10'],wed:['07:45–11:50',''],thu:['07:45–11:50','13:30–15:10'],fri:['07:45–11:50','13:30–15:10']},
  fynn:{mon:['08:20–11:50','13:30–15:10'],tue:['08:20–11:50','13:30–15:10'],wed:['08:20–11:50',''],thu:['08:20–11:50','13:30–15:10'],fri:['08:20–11:50','13:30–15:10']},
  elia:{mon:['08:20–11:45','13:30–15:00'],tue:['08:20–11:45','13:30–15:00'],wed:['08:20–11:45',''],thu:['08:20–11:45','13:30–15:00'],fri:['08:20–11:45','13:30–15:00']}
};
function seed(){return {version:5,children:structuredClone(DEFAULT_CHILDREN),tasks:{today:{jayden:[],fynn:[],elia:[]},tomorrow:{jayden:[task('Rucksack',true),task('Helm',true),task('Turnsachen')],fynn:[task('Rucksack',true),task('Helm'),task('Unterschrift')],elia:[task('Rucksack',true),task('Trinkflasche'),task('Znünibox'),task('Leuchtweste',true)]}},timetables:structuredClone(DEFAULT_TIMES),events:[{id:'demo-trip',child:'jayden',title:'Schulreise',date:'2026-08-20',start:'07:00',end:'17:00',location:'Schulhaus',items:['CHF 5 mitgeben','Gute Schuhe'],sourceDocId:null}],docs:[]}}
function task(label,done=false,note='für morgen'){return{id:uid(),label,done,note}}
function uid(){return crypto.randomUUID?.()||String(Date.now())+Math.random().toString(16).slice(2)}
function clone(x){return JSON.parse(JSON.stringify(x))}
function loadState(){
  try{const fresh=localStorage.getItem(STORE_KEY);if(fresh)return normalize(JSON.parse(fresh));}catch{}
  for(const key of OLD_KEYS){try{const raw=localStorage.getItem(key);if(raw){const migrated=migrate(JSON.parse(raw));localStorage.setItem(STORE_KEY,JSON.stringify(migrated));return migrated}}catch{}}
  return seed();
}
function migrate(old){const n=seed();if(old.children?.length)n.children=old.children.map((c,i)=>({id:c.id||slug(c.name),name:c.name||`Kind ${i+1}`,tone:c.color||['blue','green','orange','purple'][i%4]}));
  if(old.tt)n.timetables=clone(old.tt);if(old.timetables)n.timetables=clone(old.timetables);if(Array.isArray(old.events))n.events=old.events.map(e=>({...e,location:e.location||e.loc||'',sourceDocId:e.sourceDocId||null}));if(Array.isArray(old.docs))n.docs=old.docs;
  if(old.tasks){if(old.tasks.today||old.tasks.tomorrow){n.tasks=old.tasks}else{n.tasks.tomorrow={};n.tasks.today={};for(const c of n.children){n.tasks.tomorrow[c.id]=(old.tasks[c.id]||[]).map(x=>Array.isArray(x)?task(x[0],!!x[1]):x);n.tasks.today[c.id]=[]}}}
  return normalize(n)}
function normalize(s){s.version=5;s.children=s.children?.length?s.children:clone(DEFAULT_CHILDREN);s.tasks=s.tasks||{today:{},tomorrow:{}};s.tasks.today=s.tasks.today||{};s.tasks.tomorrow=s.tasks.tomorrow||{};s.timetables=s.timetables||{};s.events=Array.isArray(s.events)?s.events:[];s.docs=Array.isArray(s.docs)?s.docs:[];s.children.forEach((c,i)=>{c.tone=c.tone||['blue','green','orange','purple'][i%4];s.tasks.today[c.id]=(s.tasks.today[c.id]||[]).map(x=>Array.isArray(x)?task(x[0],!!x[1],'für heute'):{...x,id:x.id||uid()});s.tasks.tomorrow[c.id]=(s.tasks.tomorrow[c.id]||[]).map(x=>Array.isArray(x)?task(x[0],!!x[1]):{...x,id:x.id||uid()});s.timetables[c.id]=s.timetables[c.id]||{}});return s}
function save(){localStorage.setItem(STORE_KEY,JSON.stringify(state));renderAll()}
function slug(s){return String(s||'kind').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'').slice(0,20)+Date.now()}
function esc(s){return String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function child(id){return state.children.find(c=>c.id===id)}
function iconFor(v){const s=norm(v);if(s.includes('ruck'))return'🎒';if(s.includes('helm'))return'🪖';if(s.includes('trink'))return'🥤';if(s.includes('znuni')||s.includes('proviant')||s.includes('verpflegung'))return'🍎';if(s.includes('turn')||s.includes('sport')||s.includes('schuh'))return'👟';if(s.includes('geld')||s.includes('chf')||s.includes('franken'))return'💰';if(s.includes('regen'))return'🌧️';if(s.includes('weste'))return'🦺';if(s.includes('untersch'))return'✍️';if(s.includes('bibliothek')||s.includes('buch'))return'📚';if(s.includes('schulreise')||s.includes('ausflug'))return'🚌';if(s.includes('wald'))return'🌲';if(s.includes('foto'))return'📸';if(s.includes('arzt')||s.includes('zahnarzt'))return'🩺';if(s.includes('elternabend'))return'👥';if(s.includes('schwimm'))return'🏊';return'📌'}
function norm(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ü/g,'u').replace(/ö/g,'o').replace(/ä/g,'a')}
function toastMsg(msg){toast.textContent=msg;toast.classList.add('on');clearTimeout(toastMsg.t);toastMsg.t=setTimeout(()=>toast.classList.remove('on'),1900)}
function filterChips(el,value,includeAll,callback){let html=includeAll?`<button class="chip ${value==='all'?'on':''}" data-id="all">Alle</button>`:'';html+=state.children.map(c=>`<button class="chip ${value===c.id?'on':''}" data-id="${c.id}">👦 ${esc(c.name)}</button>`).join('');el.innerHTML=html;el.querySelectorAll('button').forEach(b=>b.onclick=()=>callback(b.dataset.id))}

let state=loadState(),dayMode='tomorrow',todayFilterValue='all',weekFilterValue='all',docFilterValue='all',weekOffset=0,currentFile=null,pendingReview=null;

function renderToday(){filterChips(todayFilter,todayFilterValue,true,v=>{todayFilterValue=v;renderToday()});const ids=state.children.filter(c=>todayFilterValue==='all'||c.id===todayFilterValue);let total=0,done=0;taskList.innerHTML=ids.map(c=>{const arr=state.tasks[dayMode][c.id]||[];total+=arr.length;done+=arr.filter(t=>t.done).length;return `<div class="child-card"><div class="child-head"><div class="child-title"><div class="kid-avatar ${esc(c.tone)}">👦</div><div><b>${esc(c.name)}</b><div class="muted">${arr.filter(x=>x.done).length} von ${arr.length} erledigt</div></div></div><span class="badge">${arr.length-arr.filter(x=>x.done).length} offen</span></div>${arr.length?arr.map(t=>`<div class="task ${t.done?'done':''}" data-child="${c.id}" data-task="${t.id}"><button class="check">${t.done?'✓':''}</button><div class="symbol">${iconFor(t.label)}</div><div class="task-main"><b>${esc(t.label)}</b><small>${esc(t.note||'')}</small></div></div>`).join(''):'<div class="empty">Für diesen Tag ist nichts eingetragen.</div>'}</div>`}).join('');
  taskList.querySelectorAll('.task').forEach(row=>row.querySelector('.check').onclick=()=>{const arr=state.tasks[dayMode][row.dataset.child];const t=arr.find(x=>x.id===row.dataset.task);if(t){t.done=!t.done;save()}});
  const pct=total?Math.round(done/total*100):100;meterBar.style.width=pct+'%';meterText.textContent=`${done} von ${total} erledigt`;meterPct.textContent=pct+'%';openCount.textContent=`${Math.max(0,total-done)} offen`;heroDate.textContent=dayMode==='tomorrow'?'Morgen':'Heute';heroTitle.textContent=pct===100?'Alles bereit. ✓':dayMode==='tomorrow'?'Alles bereit für morgen?':'Was ist heute noch offen?';heroCopy.textContent=pct===100?'Sehr gut – aktuell ist nichts Wichtiges mehr offen.':'Ein kurzer Blick – dann ist klar, was jedes Kind braucht.';todayToggle.classList.toggle('on',dayMode==='today');tomorrowToggle.classList.toggle('on',dayMode==='tomorrow')}
