/* Family Command · tomorrow preparation preview · 2026-08-24 */
(()=>{
  if(window.__fcTomorrowPreviewInstalled)return;window.__fcTomorrowPreviewInstalled=true;

  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const personBy=id=>{try{return typeof person==='function'?person(id):(data?.people||[]).find(p=>String(p.id)===String(id))}catch(e){return null}};
  const today=()=>{try{return typeof todayISO==='function'?todayISO():new Date().toISOString().slice(0,10)}catch(e){return new Date().toISOString().slice(0,10)}};
  const addDays=(iso,n)=>{const d=new Date(String(iso)+'T12:00:00');d.setDate(d.getDate()+n);const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`};
  const fmtDate=iso=>{try{return new Intl.DateTimeFormat('de-CH',{weekday:'long',day:'numeric',month:'long'}).format(new Date(String(iso)+'T12:00:00'))}catch(e){return iso}};
  const schedule=(pid,day)=>{try{return typeof scheduleFor==='function'?(scheduleFor(pid,day)||[]):(data?.schedules?.[pid]?.[day]||[])}catch(e){return[]}};
  const reminders=day=>{try{return typeof remindersFor==='function'?(remindersFor(day)||[]):(data?.reminders||[]).filter(r=>(r.days||[]).includes(day))}catch(e){return[]}};
  const holiday=(pid,date)=>{try{return typeof schoolBreakFor==='function'?schoolBreakFor(pid,date):(typeof schoolHolidayOn==='function'?schoolHolidayOn(date):null)}catch(e){return null}};
  const eventsAt=date=>{try{return typeof eventsOn==='function'?(eventsOn(date)||[]):(data?.events||[]).filter(e=>e.date===date||((e.endDate||'')&&e.date<=date&&e.endDate>=date))}catch(e){return[]}};
  const childPeople=()=>{try{return (data?.people||[]).filter(p=>p.id!=='oli')}catch(e){return[]}};

  function unique(items){return [...new Set(items.map(x=>String(x||'').trim()).filter(Boolean))]}
  function cleanPackItem(s){return String(s||'').replace(/^[-•\s]+/,'').trim()}
  function packFor(pid,day){
    const rows=reminders(day).filter(r=>String(r.personId)===String(pid));
    return unique(rows.flatMap(r=>Array.isArray(r.items)?r.items:[]).map(cleanPackItem));
  }
  function departureSummary(pid,date){
    const d=new Date(String(date)+'T12:00:00'),day=d.getDay();if(holiday(pid,date))return null;
    const slots=[...schedule(pid,day)].sort((a,b)=>String(a.start||'99:99').localeCompare(String(b.start||'99:99')));if(!slots.length)return null;
    const first=slots[0],pm=slots.find(s=>String(s.start||'')>='12:00');
    const parts=[];if(first.depart)parts.push(`${first.depart} los`);else if(first.start==='07:30')parts.push('07:00 los');else if(first.start==='08:20')parts.push('07:55 los');
    if(pm?.depart&&pm.depart!==first.depart)parts.push(`${pm.depart} wieder los`);
    return parts.join(' · ')||null;
  }

  function tomorrowData(){
    const date=addDays(today(),1),day=new Date(date+'T12:00:00').getDay();
    const hw=(Array.isArray(data?.homework)?data.homework:[]).filter(h=>!h.done&&String(h.dueDate)===date).sort((a,b)=>String(a.personId).localeCompare(String(b.personId)));
    const ev=eventsAt(date).filter(e=>!String(e.title||'').toLowerCase().includes('ferien')).sort((a,b)=>String(a.time||'99:99').localeCompare(String(b.time||'99:99')));
    const kids=childPeople().map(p=>({p,pack:packFor(p.id,day),depart:departureSummary(p.id,date),holiday:holiday(p.id,date)})).filter(x=>x.pack.length||x.depart||x.holiday);
    return{date,hw,ev,kids};
  }

  function eventRow(e){
    const names=(e.personIds||[]).map(id=>personBy(id)?.name).filter(Boolean).join(' · ');
    return `<div class="fc-tom-row"><span class="fc-tom-kind">TERMIN</span><div><b>${esc(e.time||'Ganztägig')} · ${esc(e.title||'Termin')}</b>${names?`<small>${esc(names)}</small>`:''}</div></div>`;
  }
  function homeworkRow(h){
    const p=personBy(h.personId),title=(h.subject?h.subject+' · ':'')+(h.title||'Hausaufgabe');
    return `<div class="fc-tom-row"><span class="fc-tom-kind">AUFGABE</span><div><b>${esc(title)}</b><small>${esc(p?.name||'')} · bis morgen erledigen</small></div></div>`;
  }
  function kidRow(x){
    const meta=[];if(x.depart)meta.push(x.depart);if(x.holiday)meta.push(x.holiday.title||'Ferien');
    return `<div class="fc-tom-kid"><div class="fc-tom-kid-head"><b>${esc(x.p.name)}</b>${meta.length?`<span>${esc(meta.join(' · '))}</span>`:''}</div>${x.pack.length?`<div class="fc-tom-chips">${x.pack.map(i=>`<span>${esc(i)}</span>`).join('')}</div>`:'<small>Keine besonderen Sachen zum Vorbereiten.</small>'}</div>`;
  }

  function renderPreview(){
    const root=document.getElementById('today');if(!root)return;
    root.querySelector('.fc-tomorrow-section')?.remove();
    const info=tomorrowData(),has=info.hw.length||info.ev.length||info.kids.some(x=>x.pack.length||x.depart);
    if(!has)return;
    const sec=document.createElement('section');sec.className='v6-section fc-tomorrow-section';
    const content=[];
    if(info.ev.length)content.push(`<div class="fc-tom-group"><h3>Termine</h3>${info.ev.map(eventRow).join('')}</div>`);
    if(info.hw.length)content.push(`<div class="fc-tom-group"><h3>Bis morgen erledigen</h3>${info.hw.map(homeworkRow).join('')}</div>`);
    const usefulKids=info.kids.filter(x=>x.pack.length||x.depart);
    if(usefulKids.length)content.push(`<div class="fc-tom-group"><h3>Vorbereiten & los</h3>${usefulKids.map(kidRow).join('')}</div>`);
    sec.innerHTML=`<div class="v6-section-head"><div><h2>Morgen vorbereiten</h2><span>${esc(fmtDate(info.date))}</span></div><button type="button" onclick="openScreen('week');setTimeout(()=>{try{v6SelectWeekDay('${esc(info.date)}')}catch(e){}},0)">Morgen ansehen</button></div><div class="v6-card fc-tom-card">${content.join('')}</div>`;
    const pendSections=[...root.querySelectorAll('.v6-section')];
    const pend=pendSections.find(s=>/^Pendenzen$/i.test(s.querySelector('.v6-section-head h2')?.textContent||''));
    if(pend)root.insertBefore(sec,pend);else(root.querySelector('.v6-page')||root).appendChild(sec);
    document.documentElement.dataset.fcTomorrowPreview='1';
  }

  function ensureStyle(){if(document.getElementById('fc-tomorrow-style'))return;const s=document.createElement('style');s.id='fc-tomorrow-style';s.textContent=`
    .fc-tomorrow-section>.v6-section-head>div{min-width:0}.fc-tomorrow-section>.v6-section-head>div>span{display:block;margin-top:2px;color:#71839a;font-size:9px}.fc-tom-card{padding:4px 13px!important}.fc-tom-group{padding:11px 0;border-bottom:1px solid #17283b}.fc-tom-group:last-child{border-bottom:0}.fc-tom-group>h3{margin:0 0 7px;color:#7e8fa7;font-size:9px;font-weight:850;letter-spacing:.08em;text-transform:uppercase}.fc-tom-row{display:grid;grid-template-columns:52px 1fr;gap:9px;align-items:start;padding:6px 0}.fc-tom-kind{padding-top:2px;color:#8dafff;font-size:8px;font-weight:900;letter-spacing:.05em}.fc-tom-row b{display:block;color:#eef3f9;font-size:11px;line-height:1.35}.fc-tom-row small{display:block;margin-top:2px;color:#74869c;font-size:9px;line-height:1.35}.fc-tom-kid{padding:7px 0}.fc-tom-kid+.fc-tom-kid{border-top:1px solid #142438}.fc-tom-kid-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.fc-tom-kid-head b{color:#eef3f9;font-size:11px}.fc-tom-kid-head>span{color:#91a3ba;font-size:9px;text-align:right}.fc-tom-chips{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}.fc-tom-chips span{padding:5px 7px;border:1px solid #263a52;border-radius:999px;background:#091522;color:#b8c7d8;font-size:9px;font-weight:700}.fc-tom-kid>small{display:block;margin-top:4px;color:#74869c;font-size:9px}
  `;document.head.appendChild(s)}

  ensureStyle();
  if(typeof window.renderToday==='function'){
    const raw=window.renderToday;
    window.renderToday=function(...args){const out=raw.apply(this,args);if(out&&typeof out.then==='function')return out.then(v=>{renderPreview();return v});renderPreview();return out};
    try{renderToday=window.renderToday}catch(e){}
  }
  requestAnimationFrame(()=>{try{if(document.getElementById('today')?.classList.contains('active')&&typeof renderToday==='function')renderToday();else renderPreview()}catch(e){console.error('fc_tomorrow_preview_init',e)}});
  window.__fcTomorrowPreview={version:1,render:renderPreview};
})();
