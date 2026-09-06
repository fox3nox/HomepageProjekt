/* One read-only search across existing family data and document metadata. */
(()=>{'use strict';
if(window.__fcSearch)return;
const D=()=>typeof data!=='undefined'&&data?data:{};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=s=>String(s??'').toLocaleLowerCase('de-CH').replace(/ä/g,'a').replace(/ö/g,'o').replace(/ü/g,'u').replace(/ß/g,'ss').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const rows=value=>Array.isArray(value)?value:Object.values(value||{});
const active=x=>x&&!x.archived&&!x.deleted;
const name=id=>(D().people||[]).find(p=>String(p.id)===String(id))?.name||'';
const names=ids=>[...new Set((ids||[]).map(name).filter(Boolean))].join(' · ');
const today=()=>typeof todayISO==='function'?todayISO():new Date().toISOString().slice(0,10);
const dateLabel=date=>{if(!date)return'';if(date<today())return'Überfällig';if(date===today())return'Heute';try{return new Intl.DateTimeFormat('de-CH',{day:'numeric',month:'long'}).format(new Date(date+'T12:00:00'))}catch{return date}};
const groups=['Termine','Aufgaben','Hausaufgaben','Personen','Dokumente','Notizen','Kontakte','Einkauf','Rezepte','Pendenzen'];
function index({history=false}={}){
  const out=[],d=D(),add=(group,id,title,meta,text,action)=>{if(title)out.push({group,id:String(id),title:String(title),meta:String(meta||''),text:norm([title,meta,text].flat(Infinity).join(' ')),action})};
  for(const x of rows(d.events).filter(active))if(history||String(x.endDate||x.date||'')>=today())add('Termine',x.id,x.title,[names(x.personIds),x.date<today()&&x.endDate>=today()?'Läuft':history&&x.date<today()?x.date:dateLabel(x.date),x.time].filter(Boolean).join(' · '),x.note,()=>window.fcOpenEventDetails?.(x.id));
  const todos=new Map();for(const x of [...(window.__fcChatCommandSync?.all?.()||[]),...rows(d.todos)].filter(Boolean))todos.set(String(x.sourceCommandId||x.clientRef||x.id||`${x.date||''}|${x.title||''}`),x);
  for(const [id,x] of todos)if(active(x)&&(history||!x.done))add('Aufgaben',id,x.title,[name(x.personId),x.done?'Erledigt':dateLabel(x.date)].filter(Boolean).join(' · '),x.note,()=>window.__fcV9?.editTodo?.(id));
  for(const x of rows(d.homework).filter(active))if(history||!x.done)add('Hausaufgaben',x.id,[x.subject,x.title].filter(Boolean).join(' · '),[name(x.personId),x.done?'Erledigt':dateLabel(x.dueDate)].filter(Boolean).join(' · '),x.note,()=>window.__fcV9?.editHomework?.(x.id));
  for(const x of rows(d.people).filter(active)){
    add('Personen',x.id,x.name,[x.role,x.school].filter(Boolean).join(' · '),[x.schoolClass,x.class],()=>showNote(x.name,[x.role,x.school,x.schoolClass||x.class].filter(Boolean).join(' · '),rows(x.notes).map(n=>typeof n==='string'?n:[n.title,n.content||n.text||n.note].filter(Boolean).join('\n')).join('\n\n')));
    for(const [i,n] of rows(x.notes).entries()){const title=typeof n==='string'?n:n.title||n.text||n.note;add('Notizen',x.id+'-'+i,title,x.name,typeof n==='object'?n.content:'',()=>showNote(title,x.name,typeof n==='object'?n.content||n.text||n.note:'',x.id));}
  }
  for(const x of window.__fcDocumentLibrary?.cached?.()||[])add('Dokumente',x.id,x.title,names(x.personIds),[x.summary,x.description,x.document_type,x.mime_type,rows(x.tags).map(t=>typeof t==='string'?t:t.name),x.metadata?JSON.stringify(x.metadata):''],()=>window.fcOpenOriginal?.(x.id));
  for(const x of window.__fcFamilyContacts?.rows?.()||rows(d.contacts?.entries).filter(active))add('Kontakte',x.id,x.name||x.organization,[x.category,name(x.personId),x.organization].filter(Boolean).join(' · '),[x.phone,x.email,x.role,x.address,x.note],()=>{window.fcOpenFamilyContacts?.();const input=document.querySelector('[data-contact-search]');if(input){input.value=x.name||x.organization;input.dispatchEvent(new Event('input',{bubbles:true}));}});
  for(const list of rows(d.shopping?.lists).filter(active)){
    add('Einkauf',list.id,list.title,'Einkaufsliste','',()=>openShopping(list.id));
    for(const x of rows(list.items).filter(active))if(history||!x.done)add('Einkauf',list.id+'/'+x.id,x.title,[list.title,x.quantity,x.done?'Erledigt':''].filter(Boolean).join(' · '),[x.category,name(x.personId)],()=>openShopping(list.id));
  }
  for(const x of rows(d.recipes?.items).filter(active))add('Rezepte',x.id,x.title,x.favorite?'Favorit':'Rezept',[x.note,x.instructions,rows(x.ingredients).map(i=>i.name)],()=>{window.fcOpenRecipes?.();const input=document.querySelector('#fcRecipesModal input[type="search"]');if(input){input.value=x.title;input.dispatchEvent(new Event('input',{bubbles:true}));}});
  for(const x of rows(d.pendencies).filter(active))if(history||!x.done)add('Pendenzen',x.id,x.title,[name(x.personId),x.done?'Erledigt':'Offen'].filter(Boolean).join(' · '),x.note,()=>{if(x.done){showNote(x.title,'Erledigt',x.note);return;}window.openScreen?.('more');const input=document.querySelector(`[data-pend="${CSS.escape(String(x.id))}"]`);input?.closest('.fc9-row')?.scrollIntoView({block:'center'});input?.focus();});
  for(const x of rows(d.notes).filter(active))add('Notizen',x.id,x.title||x.text,name(x.personId),x.content||x.note,()=>showNote(x.title,x.personId?name(x.personId):'',x.content||x.text||x.note,x.personId));
  return out;
}
function openShopping(id){window.fcOpenShoppingLists?.();document.querySelector(`[data-shopping-list="${CSS.escape(String(id))}"]`)?.click();}
// One insertion, deletion, substitution or adjacent transposition for long words.
function closeWord(a,b){
  if(a===b)return true;if(a.length<4||b.length<4||Math.abs(a.length-b.length)>1)return false;
  if(a.length===b.length){const at=[];for(let i=0;i<a.length;i++)if(a[i]!==b[i])at.push(i);return at.length===1||(at.length===2&&at[1]===at[0]+1&&a[at[0]]===b[at[1]]&&a[at[1]]===b[at[0]]);}
  if(a.length>b.length)[a,b]=[b,a];let i=0,j=0,skip=0;while(i<a.length&&j<b.length){if(a[i]===b[j]){i++;j++;}else{if(++skip>1)return false;j++;}}return true;
}
function search(query,options){
  const tokens=norm(query).split(' ').filter(Boolean);if(!tokens.length)return[];
  return index(options).map(x=>{const words=x.text.split(' ');let score=0;for(const t of tokens){if(x.text.includes(t))score+=norm(x.title).includes(t)?4:2;else if(words.some(w=>closeWord(t,w)))score+=1;else return null;}return{...x,score};}).filter(Boolean).sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title,'de'));
}
function showNote(title,who,body){const m=document.createElement('dialog');m.className='fc-search-note';m.setAttribute('aria-label',String(title||'Notiz'));m.innerHTML=`<h2>${esc(title)}</h2><p>${esc(who)}</p><div>${esc(body)}</div><button type="button">Schliessen</button>`;document.body.appendChild(m);m.querySelector('button').onclick=()=>m.close();m.onclose=()=>m.remove();m.showModal();}
function open(opener){
  const existing=document.getElementById('fcSearchDialog');if(existing?.open){existing.querySelector('input[type="search"]')?.focus();return;}existing?.remove();
  const previous=opener instanceof HTMLElement?opener:(document.activeElement===document.body?document.querySelector('.fc-search-entry'):document.activeElement),m=document.createElement('dialog');m.id='fcSearchDialog';m.className='fc-search-dialog';m.setAttribute('aria-labelledby','fcSearchTitle');
  m.innerHTML='<header><h2 id="fcSearchTitle">In der Familie suchen</h2><button type="button" data-close aria-label="Suche schliessen">×</button></header><label class="fc-search-field"><span class="sr-only">Suchbegriff</span><input type="search" aria-label="Suchbegriff" placeholder="Termin, Kind, Dokument …" autocomplete="off"></label><label class="fc-search-history"><input type="checkbox"> Vergangenes und Erledigtes einbeziehen</label><p class="fc-search-status" role="status" aria-live="polite"></p><div class="fc-search-results"></div>';
  const input=m.querySelector('input[type="search"]'),history=m.querySelector('input[type="checkbox"]'),results=m.querySelector('.fc-search-results'),status=m.querySelector('[role="status"]');
  let shown=[],documentState='Dokumente werden geladen …';
  function render(){
    shown=search(input.value,{history:history.checked});const q=input.value.trim();
    status.textContent=[q?`${shown.length} Treffer`:'Suche über Termine, Aufgaben, Personen und Dokumente.',documentState].filter(Boolean).join(' · ');
    results.innerHTML=!q?'<p class="fc-search-empty">Auch Notizen, Kontakte, Einkauf und Rezepte sind durchsuchbar.</p>':!shown.length?'<p class="fc-search-empty">Keine Treffer. Versuche einen kürzeren Begriff.</p>':groups.map(group=>{const items=shown.filter(x=>x.group===group);return items.length?`<section><h3>${group} <span>${items.length}</span></h3>${items.slice(0,30).map(x=>`<button type="button" data-result="${shown.indexOf(x)}"><b>${esc(x.title)}</b><span>${esc(x.meta||group)}</span></button>`).join('')}${items.length>30?'<p>Bitte präzisiere die Suche für weitere Treffer.</p>':''}</section>`:''}).join('');
  }
  m.onclose=()=>m.remove();const closeSearch=()=>{m.close();if(previous?.isConnected)previous.focus();};m.querySelector('[data-close]').onclick=closeSearch;m.addEventListener('cancel',e=>{e.preventDefault();closeSearch();});
  m.addEventListener('click',e=>{const button=e.target.closest('[data-result]');if(button){const item=shown[Number(button.dataset.result)];m.close();item?.action?.();}else if(e.target===m){const r=m.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)m.close();}});
  input.oninput=render;history.onchange=render;
  document.body.appendChild(m);m.showModal();input.focus();render();
  window.__fcDocumentLibrary?.list().then(()=>{documentState='';if(m.isConnected)render();}).catch(()=>{documentState='Dokumente momentan nicht erreichbar; die übrigen Bereiche sind durchsuchbar.';if(m.isConnected)render();});
}
window.fcOpenSearch=open;window.__fcSearch={open,search,index,norm,closeWord};
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();open();}});
})();
