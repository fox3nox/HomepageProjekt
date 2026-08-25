/* Family Command · Today shows only what is still relevant · 2026-08-25 */
(()=>{
  if(window.__fcTodayRelevanceInstalled)return;window.__fcTodayRelevanceInstalled=true;

  const mins=t=>{const m=String(t||'').match(/^(\d{1,2}):(\d{2})$/);return m?Number(m[1])*60+Number(m[2]):null};
  const nowMins=()=>{const d=new Date();return d.getHours()*60+d.getMinutes()};
  const today=()=>{try{return typeof todayISO==='function'?todayISO():new Date().toISOString().slice(0,10)}catch(e){return new Date().toISOString().slice(0,10)}};
  const people=()=>{try{return (data?.people||[]).filter(p=>p.id!=='oli')}catch(e){return[]}};
  const schedule=(pid,day)=>{try{return typeof scheduleFor==='function'?(scheduleFor(pid,day)||[]):(data?.schedules?.[pid]?.[day]||[])}catch(e){return[]}};
  const colorFor=p=>p?.color||({jayden:'#2f80ff',fynn:'#ff9000',eliyah:'#19b67a'}[p?.id]||'#718198');
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function personForCard(card){
    const text=String(card?.textContent||'').toLowerCase();
    return people().find(p=>text.includes(String(p.name||'').toLowerCase()))||null;
  }
  function relevantSlot(pid,day,now){
    const slots=[...schedule(pid,day)].sort((a,b)=>((mins(a.depart)??mins(a.start)??9999)-(mins(b.depart)??mins(b.start)??9999)));
    for(const slot of slots){
      const start=mins(slot.start),end=mins(slot.end),depart=mins(slot.depart);
      if(end!==null&&end<now)continue;
      if(start!==null&&end!==null&&start<=now&&now<=end)return{slot,state:'active',start,end,depart};
      if(depart!==null&&depart>=now)return{slot,state:'depart',start,end,depart};
      if(start!==null&&start>=now)return{slot,state:'start',start,end,depart};
      if(end!==null&&end>=now)return{slot,state:'active',start,end,depart};
    }
    return null;
  }
  function fmt(v){if(v===null||v===undefined)return'';return String(Math.floor(v/60)).padStart(2,'0')+':'+String(v%60).padStart(2,'0')}

  function renderRelevantKid(card,p,rel){
    const c=colorFor(p),label=String(rel.slot?.label||(/eli/i.test(p.id)?'Kindergarten':'Schule')).replace(/\s*·\s*Tagesschule.*/i,'');
    let main='',sub='';
    if(rel.state==='active'){
      main=`${label} läuft${rel.end!==null?' bis '+fmt(rel.end):''}`;
      sub='Du musst dafür jetzt nichts mehr vorbereiten.';
    }else if(rel.state==='depart'){
      main=`${fmt(rel.depart)} los${rel.start!==null?' · '+fmt(rel.start)+'–'+fmt(rel.end):''}`;
      sub=rel.slot?.note||'Von zuhause los.';
    }else{
      main=`Beginnt um ${fmt(rel.start)}${rel.end!==null?' · bis '+fmt(rel.end):''}`;
      sub=rel.slot?.note||(rel.depart===null?'Losgehzeit ist nicht hinterlegt.':'Die Losgehzeit ist bereits vorbei.');
    }
    card.classList.add('fc-today-relevant-kid');
    card.innerHTML=`<div class="v6-kid-head"><span class="v6-dot" style="--person:${esc(c)}"></span><b>${esc(p.name)}</b><span class="v6-chip">${rel.state==='active'?'Läuft':'Als Nächstes'}</span></div><div class="fc-today-next"><strong>${esc(main)}</strong>${sub?`<span>${esc(sub)}</span>`:''}</div>`;
  }

  function cleanKids(root,now){
    const section=[...root.querySelectorAll('.v6-section')].find(s=>/Kinder heute/i.test(s.querySelector('.v6-section-head h2')?.textContent||''));
    if(!section)return;
    const day=new Date(today()+'T12:00:00').getDay();let kept=0;
    section.querySelectorAll('.v6-kid').forEach(card=>{
      const p=personForCard(card);if(!p){card.remove();return}
      const rel=relevantSlot(p.id,day,now);if(!rel){card.remove();return}
      renderRelevantKid(card,p,rel);kept++;
    });
    if(!kept)section.remove();
  }

  function eventForRow(row){
    const title=String(row.querySelector('.v6-simple-main b')?.textContent||'').trim();
    const time=String(row.querySelector('.v6-simple-time')?.textContent||'').trim();
    try{return (data?.events||[]).find(e=>String(e.date)===today()&&String(e.title||'').trim()===title&&String(e.time||'—')===time)||null}catch(e){return null}
  }
  function cleanEvents(root,now){
    const section=[...root.querySelectorAll('.v6-section')].find(s=>/Heute noch/i.test(s.querySelector('.v6-section-head h2')?.textContent||''));
    if(!section)return;
    const rows=[...section.querySelectorAll('.v6-simple-row')];
    for(const row of rows){
      const ev=eventForRow(row),start=mins(ev?.time||row.querySelector('.v6-simple-time')?.textContent);
      if(start===null)continue;
      const explicitEnd=mins(ev?.end),end=explicitEnd!==null?explicitEnd:start+90;
      if(now>end)row.remove();
    }
    if(!section.querySelector('.v6-simple-row'))section.remove();
  }

  function tuneFocus(root){
    const h=root.querySelector('.v6-focus h2'),p=root.querySelector('.v6-focus p');
    if(!h||!/Für heute nichts Dringendes/i.test(h.textContent||''))return;
    h.textContent='Keine zeitkritischen Punkte mehr';
    p.textContent='Vergangenes ist ausgeblendet. Offene Aufgaben bleiben weiter unten sichtbar.';
  }
  function apply(){
    const root=document.getElementById('today');if(!root)return;
    const now=nowMins();cleanKids(root,now);cleanEvents(root,now);tuneFocus(root);
    document.documentElement.dataset.fcTodayRelevance='1';
  }

  function ensureStyle(){if(document.getElementById('fc-today-relevance-style'))return;const s=document.createElement('style');s.id='fc-today-relevance-style';s.textContent=`
    .fc-today-relevant-kid{padding:13px 14px!important}.fc-today-next{margin-top:10px;padding:10px 11px;border-radius:11px;background:#091522;border:1px solid #1d3047}.fc-today-next strong{display:block;color:#f2f5f9;font-size:13px;line-height:1.3}.fc-today-next span{display:block;margin-top:4px;color:#7e8fa7;font-size:10px;line-height:1.35}
  `;document.head.appendChild(s)}

  ensureStyle();
  if(typeof window.renderToday==='function'){
    const raw=window.renderToday;
    window.renderToday=function(...args){
      const out=raw.apply(this,args);
      if(out&&typeof out.then==='function')return out.then(v=>{apply();return v});
      apply();return out;
    };
    try{renderToday=window.renderToday}catch(e){}
  }
  requestAnimationFrame(()=>{try{if(document.getElementById('today')?.classList.contains('active')&&typeof renderToday==='function')renderToday();else apply()}catch(e){console.error('fc_today_relevance_init',e)}});
  window.__fcTodayRelevance={version:2,apply};
})();
